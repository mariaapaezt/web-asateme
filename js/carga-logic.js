// ==========================================
// 1. ESTADO CENTRAL DE LA PÁGINA DE CARGA
// ==========================================
let PARTIDOS_BACKUP = [];
let EQUIPOS_MAPA = {};
let JUGADORES_LOCALES = [];
let JUGADORES_VISITANTES = [];


let FILTROS_CARGA = {
    liga: 'LIGA_A',
    fechaNum: 1,
    partidoSeleccionadoId: null
};

let PLANILLA_ITTF = {
    partido1: { modalidad: 'SINGLE', local1: '', vis1: '', setsL: [0, 0, 0, 0, 0], setsV: [0, 0, 0, 0, 0], scoreL: 0, scoreV: 0, terminado: false },
    partido2: { modalidad: 'SINGLE', local1: '', vis1: '', setsL: [0, 0, 0, 0, 0], setsV: [0, 0, 0, 0, 0], scoreL: 0, scoreV: 0, terminado: false },
    partido3: { modalidad: 'DOBLES', local1: '', local2: '', vis1: '', vis2: '', setsL: [0, 0, 0, 0, 0], setsV: [0, 0, 0, 0, 0], scoreL: 0, scoreV: 0, terminado: false },
    partido4: { modalidad: 'SINGLE', local1: '', vis1: '', setsL: [0, 0, 0, 0, 0], setsV: [0, 0, 0, 0, 0], scoreL: 0, scoreV: 0, terminado: false },
    partido5: { modalidad: 'SINGLE', local1: '', vis1: '', setsL: [0, 0, 0, 0, 0], setsV: [0, 0, 0, 0, 0], scoreL: 0, scoreV: 0, terminado: false }
};

// =========================================================================
// 2. DESCARGA E INICIALIZACIÓN DE DATOS DIRECTA
// =========================================================================
async function inicializarPantallaCarga() {
    console.log("📥 [ASATEME Debug] Conectando a Supabase para descargar fixture...");

    if (!window.supabase) {
        console.error("❌ ERROR CRÍTICO: 'window.supabase' no existe. Revisá el orden de los scripts.");
        return;
    }

    try {
        const [resPartidos, resEquipos] = await Promise.all([
            window.supabase.from('fixture').select('*'),
            window.supabase.from('equipos').select('*')
        ]);

        if (resPartidos.error) {
            console.error("❌ Error en tabla 'fixture':", resPartidos.error.message);
            return;
        }
        if (resEquipos.error) {
            console.error("❌ Error en tabla 'equipos':", resEquipos.error.message);
            return;
        }
        if (resJugadores.error) {
            console.error("❌ Error en tabla 'jugadores':", resJugadores.error);
            return;
        }

        PARTIDOS_BACKUP = resPartidos.data || [];
        console.log(`✅ Fixture descargado con éxito. Cantidad de partidos: ${PARTIDOS_BACKUP.length}`);

        EQUIPOS_MAPA = {};
        resEquipos.data.forEach(eq => {
            const nombreClub = eq.nombre || eq.name || `Club ID: ${eq.id}`;
            EQUIPOS_MAPA[eq.id] = nombreClub;
        });
        console.log(`✅ Mapa de clubes generado (${Object.keys(EQUIPOS_MAPA).length} mapeados)`);

        actualizarDesplegablePartidos();

    } catch (error) {
        console.error("💥 Error inesperado durante el fetch general:", error);
    }
}

function seleccionarFiltroLiga(ligaId) {
    console.log(`🎯 [Acción] Click en Liga: ${ligaId}`);
    FILTROS_CARGA.liga = ligaId;
    FILTROS_CARGA.partidoSeleccionadoId = null;

    const btnA = document.getElementById('btn-liga-a');
    const btnB = document.getElementById('btn-liga-b');

    if (ligaId === 'LIGA_A') {
        if (btnA) btnA.className = "py-2.5 px-4 rounded-xl font-bold text-xs border text-center transition-all bg-asatemeBlue text-white border-asatemeBlue cursor-pointer";
        if (btnB) btnB.className = "py-2.5 px-4 rounded-xl font-bold text-xs border text-center transition-all bg-white text-gray-700 border-gray-200 cursor-pointer";
    } else {
        if (btnB) btnB.className = "py-2.5 px-4 rounded-xl font-bold text-xs border text-center transition-all bg-asatemeBlue text-white border-asatemeBlue cursor-pointer";
        if (btnA) btnA.className = "py-2.5 px-4 rounded-xl font-bold text-xs border text-center transition-all bg-white text-gray-700 border-gray-200 cursor-pointer";
    }

    const selectPartido = document.getElementById('select-partido-id');
    if (selectPartido) selectPartido.value = "";

    restaurarBotonEnvioOriginal();
    actualizarDesplegablePartidos();
    resetearNombresMarcador();
}

function actualizarDesplegablePartidos() {
    const selectPartido = document.getElementById('select-partido-id');
    if (!selectPartido) return;

    const partidosFiltrados = PARTIDOS_BACKUP.filter(p => {
        const matchesLiga = p.liga === FILTROS_CARGA.liga;
        const matchesFecha = Number(p.fecha_numero) === Number(FILTROS_CARGA.fechaNum);
        return matchesLiga && matchesFecha;
    });

    selectPartido.innerHTML = '<option value="">-- Seleccioná la serie en juego --</option>';

    if (partidosFiltrados.length === 0) {
        selectPartido.innerHTML = '<option value="">No hay partidos agendados para este filtro.</option>';
        return;
    }

    partidosFiltrados.forEach(partido => {
        const nombreLocal = EQUIPOS_MAPA[partido.local_id] || `Local (${partido.local_id})`;
        const nombreVisitante = EQUIPOS_MAPA[partido.visitante_id] || `Visitante (${partido.visitante_id})`;
        const estadoTxt = partido.estado === "Finalizado" ? " (🔒 Cerrada)" : "";

        const option = document.createElement('option');
        option.value = partido.id;
        option.textContent = `${nombreLocal} vs ${nombreVisitante}${estadoTxt}`;
        selectPartido.appendChild(option);
    });
}

// 🛡️ SISTEMA DE RESTAURACIÓN ULTRA DEFENSIVO CONTRA CUALQUIER ALTERACIÓN DE DOM
function restaurarBotonEnvioOriginal() {
    try {
        // Apuntamos directo al ID único e indiscutible del botón principal
        const botonEnviar = document.getElementById('btn-enviar-planilla');

        if (botonEnviar) {
            // Habilitamos el botón por si estaba bloqueado
            botonEnviar.disabled = false;
            botonEnviar.removeAttribute('disabled');
            botonEnviar.type = "submit";

            // Reemplazamos COMPLETAMENTE las clases asegurando el color azul de ASATEME
            botonEnviar.className = "w-full bg-asatemeBlue hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs";

            // Restauramos el texto original original
            botonEnviar.innerHTML = `<i class="fas fa-paper-plane"></i> Enviar Informe Oficial`;

            console.log("🔵 [UI Sync] ¡Botón PRINCIPAL (id: btn-enviar-planilla) restaurado a AZUL con éxito!");
        } else {
            console.warn("⚠️ [UI Sync] Alerta: No se encontró ningún elemento con el ID 'btn-enviar-planilla' en el HTML.");
        }
    } catch (err) {
        console.error("❌ Falló el intento de restaurar el botón:", err);
    }
}

// =========================================================================
// 3. CONTROL DE PLANILLAS E INYECCIÓN DE ACORDEONES (ITTF)
// =========================================================================
async function manejarCambioPartido(partidoId) {
    console.log(`🔄 [Acción] Cambio de partido detectado. ID: "${partidoId}"`);
    FILTROS_CARGA.partidoSeleccionadoId = partidoId;

    const seccionIttf = document.getElementById('seccion-partidos-ittf');
    const containerAcordeones = document.getElementById('contenedor-acordeones-partidos');
    const botonEnviar = document.getElementById('btn-enviar-planilla') || document.querySelector('#form-envio-planilla button[type="submit"]');

    // Reseteo inicial inmediato
    restaurarBotonEnvioOriginal();

    if (!partidoId || partidoId === "") {
        resetearNombresMarcador();
        if (seccionIttf) seccionIttf.classList.add('hidden');
        return;
    }
    const partido = PARTIDOS_BACKUP.find(p => String(p.id) === String(partidoId));
    if (!partido) return;

    if (document.getElementById('txt-nombre-local')) {
        document.getElementById('txt-nombre-local').textContent = EQUIPOS_MAPA[partido.local_id] || "Local";
    }
    if (document.getElementById('txt-nombre-visitante')) {
        document.getElementById('txt-nombre-visitante').textContent = EQUIPOS_MAPA[partido.visitante_id] || "Visitante";
    }

    if (partido.estado === "Finalizado") {
        if (seccionIttf) seccionIttf.classList.add('hidden');
        if (document.getElementById('score-local-input')) document.getElementById('score-local-input').value = partido.score_local ?? 0;
        if (document.getElementById('score-visitante-input')) document.getElementById('score-visitante-input').value = partido.score_visitante ?? 0;
        alert("Esta serie ya está finalizada y protegida contra modificaciones.");
        return;
    }

    try {
        console.log(`👤 Solicitando planteles a Supabase...`);

        const [resLocal, resVis] = await Promise.all([
            window.supabase.from('jugadores').select('*').eq('equipo_id', partido.local_id),
            window.supabase.from('jugadores').select('*').eq('equipo_id', partido.visitante_id)
        ]);

        JUGADORES_LOCALES = resLocal.data || [];
        JUGADORES_VISITANTES = resVis.data || [];

        // Si el usuario cambió de opinión a mitad del viaje asincrónico, matamos el hilo
        if (FILTROS_CARGA.partidoSeleccionadoId !== partidoId) {
            console.log("🛑 El partido cambió en medio del fetch. Cancelando pintado.");
            restaurarBotonEnvioOriginal();
            return;
        }

        if (seccionIttf) seccionIttf.classList.remove('hidden');

        // VALIDACIÓN DEL CARTEL ORDENADO Y TEXTO DE BOTÓN NARANJA
        if (JUGADORES_LOCALES.length === 0 || JUGADORES_VISITANTES.length === 0) {
            const nombreEquipoFaltante = JUGADORES_LOCALES.length === 0
                ? (EQUIPOS_MAPA[partido.local_id] || "Equipo Local")
                : (EQUIPOS_MAPA[partido.visitante_id] || "Equipo Visitante");

            console.warn(`⚠️ Bloqueo activado: ${nombreEquipoFaltante} no tiene jugadores.`);

            if (containerAcordeones) {
                containerAcordeones.innerHTML = `
                    <div class="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4 flex items-center gap-3 my-2 text-xs font-medium">
                        <i class="fas fa-exclamation-triangle text-amber-500 text-lg"></i>
                        <span>
                            <strong>Carga inhabilitada:</strong> El club <u>${nombreEquipoFaltante}</u> no registra jugadores cargados en el sistema de la federación.
                        </span>
                    </div>
                `;
            }

            if (botonEnviar) {
                botonEnviar.disabled = true;
                botonEnviar.type = "button";
                botonEnviar.className = "w-full bg-amber-500 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-not-allowed shadow-xs";
                botonEnviar.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Carga Bloqueada: Plantel Incompleto`;
            }
            return;
        }

        resetearPlanillaITTFMemoria();
        renderizarAcordeonesPlanilla();
        restaurarBotonEnvioOriginal();

    } catch (e) {
        console.error("💥 Error crítico en la cascada de promesas de jugadores:", e);
    }
}

function resetearPlanillaITTFMemoria() {
    for (let i = 1; i <= 5; i++) {
        PLANILLA_ITTF[`partido${i}`] = {
            modalidad: i === 3 ? 'DOBLES' : 'SINGLE',
            local1: '', local2: '', vis1: '', vis2: '',
            setsL: [0, 0, 0, 0, 0], setsV: [0, 0, 0, 0, 0],
            scoreL: 0, scoreV: 0, terminado: false,
            abiertoManual: i === 1
        };
    }
    if (document.getElementById('score-local-input')) document.getElementById('score-local-input').value = 0;
    if (document.getElementById('score-visitante-input')) document.getElementById('score-visitante-input').value = 0;
    if (document.getElementById('marcador-parcial-txt')) document.getElementById('marcador-parcial-txt').textContent = "0 - 0";
}

function renderizarAcordeonesPlanilla() {
    const container = document.getElementById('contenedor-acordeones-partidos');
    if (!container) return;

    let html = '';
    const nombresModalidades = ["Single 1", "Single 2", "Dobles (Parejas)", "Single 3", "Single 4"];
    let tabIndexContador = 1;

    for (let i = 1; i <= 5; i++) {
        const p = PLANILLA_ITTF[`partido${i}`];
        const esDobles = p.modalidad === 'DOBLES';

        if (p.abiertoManual === undefined) {
            p.abiertoManual = (i === 1);
        }

        const claseEstadoIcono = p.terminado
            ? "fas fa-check-circle text-green-500 text-base"
            : "far fa-circle text-gray-300 text-base";

        const tituloResumen = p.terminado
            ? `<span class="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-md font-bold">Confirmado (${p.scoreL}-${p.scoreV})</span>`
            : `<span class="text-[11px] text-gray-400 font-normal">En carga</span>`;

        html += `
            <div class="border border-gray-200 rounded-xl overflow-hidden shadow-2xs bg-white transition-all duration-200">
                <div class="bg-gray-50 p-3.5 flex justify-between items-center cursor-pointer select-none border-b border-gray-100 hover:bg-gray-100/70 transition-colors" 
                     onclick="toggleBloqueManual(${i})">
                    <div class="flex items-center gap-2.5">
                        <i class="${claseEstadoIcono}"></i>
                        <span class="font-bold text-xs text-gray-700 uppercase tracking-wider">Partido ${i}: ${nombresModalidades[i - 1]}</span>
                    </div>
                    <div class="flex items-center gap-3">
                        ${tituloResumen}
                        <i class="fas ${p.abiertoManual ? 'fa-chevron-up' : 'fa-chevron-down'} text-xs text-gray-400"></i>
                    </div>
                </div>

                <div id="cuerpo-acordeon-${i}" class="${p.abiertoManual ? '' : 'hidden'} p-4 bg-white space-y-4">
                    <div class="grid grid-cols-2 gap-3">
                        <div class="space-y-2">
                            <label class="block text-[10px] font-bold text-gray-400 uppercase">Alineación Local</label>
                            <select onchange="actualizarJugadorPlanilla(${i}, 'local1', this.value)" 
                                    class="w-full bg-gray-50 border rounded-lg p-2 text-xs font-medium text-gray-700 focus:outline-none focus:border-asatemeBlue">
                                <option value="">-- Seleccionar Jugador --</option>
                                ${JUGADORES_LOCALES.map(j => `<option value="${j.id}" ${p.local1 == j.id ? 'selected' : ''}>${j.nombre || j.name}</option>`).join('')}
                            </select>
                            ${esDobles ? `
                            <select onchange="actualizarJugadorPlanilla(${i}, 'local2', this.value)" class="w-full bg-gray-50 border rounded-lg p-2 text-xs font-medium text-gray-700 focus:outline-none">
                                <option value="">-- Pareja Jugador 2 --</option>
                                ${JUGADORES_LOCALES.map(j => `<option value="${j.id}" ${p.local2 == j.id ? 'selected' : ''}>${j.nombre || j.name}</option>`).join('')}
                            </select> ` : ''}
                        </div>
                        <div class="space-y-2">
                            <label class="block text-[10px] font-bold text-gray-400 uppercase text-right">Alineación Visitante</label>
                            <select onchange="actualizarJugadorPlanilla(${i}, 'vis1', this.value)" 
                                    class="w-full bg-gray-50 border rounded-lg p-2 text-xs font-medium text-gray-700 focus:outline-none focus:border-asatemeBlue">
                                <option value="">-- Seleccionar Jugador --</option>
                                ${JUGADORES_VISITANTES.map(j => `<option value="${j.id}" ${p.vis1 == j.id ? 'selected' : ''}>${j.nombre || j.name}</option>`).join('')}
                            </select>
                            ${esDobles ? `
                            <select onchange="actualizarJugadorPlanilla(${i}, 'vis2', this.value)" class="w-full bg-gray-50 border rounded-lg p-2 text-xs font-medium text-gray-700 focus:outline-none">
                                <option value="">-- Pareja Jugador 2 --</option>
                                ${JUGADORES_VISITANTES.map(j => `<option value="${j.id}" ${p.vis2 == j.id ? 'selected' : ''}>${j.nombre || j.name}</option>`).join('')}
                            </select>` : ''}
                        </div>
                    </div>

                    <div class="bg-gray-50/70 p-3 rounded-xl border border-gray-100">
                        <span class="block text-[10px] font-bold text-gray-400 uppercase mb-2 text-center tracking-wider">Puntajes por Set</span>
                        <div class="grid grid-cols-5 gap-1.5 text-center">
                            ${[0, 1, 2, 3, 4].map(sIdx => {
            const tabLocal = tabIndexContador++;
            const tabVis = tabIndexContador++;
            return `
                                    <div class="bg-white p-1.5 rounded-lg border border-gray-200 space-y-1.5">
                                        <span class="block text-[9px] font-bold text-gray-400 uppercase">S${sIdx + 1}</span>
                                        <input type="number" min="0" max="99" value="${p.setsL[sIdx]}" 
                                            tabindex="${tabLocal}"
                                            onchange="actualizarPuntosSetTeclado(${i}, ${sIdx}, 'L', this.value)"
                                            class="w-full text-center font-bold text-sm text-gray-800 bg-gray-50 rounded-md py-1 focus:outline-none border border-transparent focus:border-asatemeBlue focus:bg-white transition-all">
                                        <input type="number" min="0" max="99" value="${p.setsV[sIdx]}" 
                                            tabindex="${tabVis}"
                                            onchange="actualizarPuntosSetTeclado(${i}, ${sIdx}, 'V', this.value)"
                                            class="w-full text-center font-bold text-sm text-gray-800 bg-gray-50 rounded-md py-1 focus:outline-none border border-transparent focus:border-asatemeBlue focus:bg-white transition-all">
                                    </div>`;
        }).join('')}
                        </div>
                    </div>

                    <div class="pt-1 flex justify-end">
                        <button type="button" onclick="confirmarResultadoPartidoManual(${i})"
                                class="w-full sm:w-auto bg-asatemeBlue hover:bg-slate-800 text-white font-bold py-2 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs">
                            <i class="fas fa-check"></i> Confirmar Partido ${i}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    container.innerHTML = html;
}

function toggleBloqueManual(num) {
    const p = PLANILLA_ITTF[`partido${num}`];
    if (p) {
        p.abiertoManual = !p.abiertoManual;
        renderizarAcordeonesPlanilla();
    }
}

function actualizarJugadorPlanilla(partidoNum, campo, idVal) {
    PLANILLA_ITTF[`partido${partidoNum}`][campo] = idVal;
}

// =========================================================================
// 4. LÓGICA MATEMÁTICA ITTF
// =========================================================================
function actualizarPuntosSetTeclado(partidoNum, setIdx, lado, valor) {
    const p = PLANILLA_ITTF[`partido${partidoNum}`];
    const numVal = parseInt(valor, 10) || 0;

    if (lado === 'L') p.setsL[setIdx] = numVal;
    if (lado === 'V') p.setsV[setIdx] = numVal;
}

function confirmarResultadoPartidoManual(partidoNum) {
    const p = PLANILLA_ITTF[`partido${partidoNum}`];

    if (!p.local1 || !p.vis1 || (p.modalidad === 'DOBLES' && (!p.local2 || !p.vis2))) {
        alert(`⚠️ Por favor, seleccioná los jugadores para el Partido ${partidoNum} antes de confirmar.`);
        return;
    }

    let acumL = 0;
    let acumV = 0;

    for (let i = 0; i < 5; i++) {
        const sL = p.setsL[i];
        const sV = p.setsV[i];

        if (sL === 0 && sV === 0) continue;

        if (sL < 11 && sV < 11) {
            alert(`⚠️ Error en el Set ${i + 1}: Ningún jugador llegó al mínimo de 11 puntos (${sL} - ${sV}).`);
            return;
        }

        const diferencia = Math.abs(sL - sV);

        if ((sL === 11 || sV === 11) && diferencia >= 2) {
            if (sL > sV) acumL++; else acumV++;
            continue;
        }

        if (sL >= 10 && sV >= 10) {
            if (diferencia === 2) {
                if (sL > sV) acumL++; else acumV++;
            } else if (diferencia < 2) {
                alert(`⚠️ Error en el Set ${i + 1}: El set está en ventajas (${sL} - ${sV}). Requiere diferencia de 2 puntos.`);
                return;
            } else {
                alert(`⚠️ Error en el Set ${i + 1}: Diferencia imposible en ventajas (${sL} - ${sV}).`);
                return;
            }
            continue;
        }

        alert(`⚠️ Error en el Set ${i + 1}: El marcador ${sL} - ${sV} no cumple el reglamento.`);
        return;
    }

    if (acumL !== 3 && acumV !== 3) {
        alert(`⚠️ Puntuación incompleta. Alguien debe ganar 3 sets (Actual: ${acumL} - ${acumV}).`);
        return;
    }

    p.scoreL = acumL;
    p.scoreV = acumV;
    p.terminado = true;
    p.abiertoManual = false;

    const siguiente = partidoNum + 1;
    if (siguiente <= 5) {
        const sigPartido = PLANILLA_ITTF[`partido${siguiente}`];
        if (!sigPartido.terminado) {
            sigPartido.abiertoManual = true;
        }
    }

    recalcularTotalesMacroDeLaSerie();
    renderizarAcordeonesPlanilla();
}

function recalcularTotalesMacroDeLaSerie() {
    let seriesGanadasLocal = 0;
    let seriesGanadasVis = 0;

    for (let i = 1; i <= 5; i++) {
        const part = PLANILLA_ITTF[`partido${i}`];
        if (part.terminado) {
            if (part.scoreL > part.scoreV) seriesGanadasLocal++;
            else seriesGanadasVis++;
        }
    }

    if (document.getElementById('score-local-input')) document.getElementById('score-local-input').value = seriesGanadasLocal;
    if (document.getElementById('score-visitante-input')) document.getElementById('score-visitante-input').value = seriesGanadasVis;
    if (document.getElementById('marcador-parcial-txt')) document.getElementById('marcador-parcial-txt').textContent = `${seriesGanadasLocal} - ${seriesGanadasVis}`;
}

function resetearNombresMarcador() {
    if (document.getElementById('txt-nombre-local')) document.getElementById('txt-nombre-local').textContent = "Equipo Local";
    if (document.getElementById('txt-nombre-visitante')) document.getElementById('txt-nombre-visitante').textContent = "Equipo Visitante";
    if (document.getElementById('score-local-input')) document.getElementById('score-local-input').value = "0";
    if (document.getElementById('score-visitante-input')) document.getElementById('score-visitante-input').value = "0";
    if (document.getElementById('seccion-partidos-ittf')) document.getElementById('seccion-partidos-ittf').classList.add('hidden');

    restaurarBotonEnvioOriginal();
}

function idEncontradoPartidoActual() {
    return FILTROS_CARGA.partidoSeleccionadoId;
}

function manejarCambioWO(tipo) {
    const chkLocal = document.getElementById('wo-local-check');
    const chkVisitante = document.getElementById('wo-visitante-check');
    const inputScoreLocal = document.getElementById('score-local-input');
    const inputScoreVisitante = document.getElementById('score-visitante-input');

    if (!chkLocal || !chkVisitante) return;

    if (tipo === 'LOCAL' && chkLocal.checked) {
        chkVisitante.checked = false;
        if (inputScoreLocal) inputScoreLocal.value = 0;
        if (inputScoreVisitante) inputScoreVisitante.value = 5;
        document.getElementById('seccion-partidos-ittf').classList.add('hidden');
        restaurarBotonEnvioOriginal();
    } else if (tipo === 'VISITANTE' && chkVisitante.checked) {
        chkLocal.checked = false;
        if (inputScoreLocal) inputScoreLocal.value = 5;
        if (inputScoreVisitante) inputScoreVisitante.value = 0;
        document.getElementById('seccion-partidos-ittf').classList.add('hidden');
        restaurarBotonEnvioOriginal();
    } else {
        if (inputScoreLocal) inputScoreLocal.value = "0";
        if (inputScoreVisitante) inputScoreVisitante.value = "0";
        manejarCambioPartido(idEncontradoPartidoActual());
    }
}

// =========================================================================
// 5. ENVÍO, TRANSACCIÓN Y GUARDADO
// =========================================================================
async function procesarEnvioResultado(event) {
    event.preventDefault();
    event.stopImmediatePropagation();

    const partidoId = FILTROS_CARGA.partidoSeleccionadoId;
    if (!partidoId) return alert("Por favor, seleccioná un partido del desplegable.");

    const partidoSeleccionado = PARTIDOS_BACKUP.find(p => String(p.id) === String(partidoId));
    if (partidoSeleccionado && partidoSeleccionado.estado === "Finalizado") {
        return alert("Esta serie ya fue enviada y se encuentra cerrada.");
    }

    const scoreLocal = parseInt(document.getElementById('score-local-input').value) || 0;
    const scoreVisitante = parseInt(document.getElementById('score-visitante-input').value) || 0;
    const tokenIngresado = document.getElementById('token-club-input').value.trim();
    const inputArchivo = document.getElementById('archivo-planilla-input');

    const chkLocalWO = document.getElementById('wo-local-check').checked;
    const chkVisitanteWO = document.getElementById('wo-visitante-check').checked;
    const esWalkover = chkLocalWO || chkVisitanteWO;

    if (!esWalkover) {
        for (let i = 1; i <= 5; i++) {
            const part = PLANILLA_ITTF[`partido${i}`];
            if (!part.terminado) {
                return alert(`⚠️ Planilla incompleta. El Partido ${i} no registra un ganador reglamentario.`);
            }
            if (!part.local1 || !part.vis1 || (part.modalidad === 'DOBLES' && (!part.local2 || !part.vis2))) {
                return alert(`⚠️ Falta asignar jugadores o parejas en el Partido ${i}.`);
            }
        }
    }

    if (!inputArchivo.files || inputArchivo.files.length === 0) {
        return alert("Es obligatorio adjuntar la foto de la planilla firmada.");
    }

    const btnEnviar = document.querySelector('#form-envio-planilla button[type="submit"]') || document.getElementById('btn-enviar-planilla');
    if (!btnEnviar) return;

    const textoOriginalBtn = btnEnviar.innerHTML;
    btnEnviar.disabled = true;
    btnEnviar.innerHTML = `<i class="fas fa-spinner fa-spin mr-1.5"></i> Guardando...`;

    try {
        const { data: equiposValidados, error: errToken } = await window.supabase
            .from('equipos')
            .select('*')
            .or(`id.eq.${partidoSeleccionado.local_id},id.eq.${partidoSeleccionado.visitante_id}`)
            .eq('token', tokenIngresado);

        if (errToken || !equiposValidados || equiposValidados.length === 0) {
            alert("El Código de Validation del Club es incorrecto.");
            btnEnviar.disabled = false;
            btnEnviar.innerHTML = textoOriginalBtn;
            return;
        }

        const archivoActa = inputArchivo.files[0];
        const extension = archivoActa.name.split('.').pop();
        const nombreLimpioArchivo = `acta_${partidoId}_${Date.now()}.${extension}`;

        const { error: errStorage } = await window.supabase.storage
            .from('planillas')
            .upload(nombreLimpioArchivo, archivoActa, { cacheControl: '3600', upsert: false });

        if (errStorage) throw new Error("No se pudo subir la foto.");

        const { data: resUrl } = window.supabase.storage.from('planillas').getPublicUrl(nombreLimpioArchivo);
        const urlPublicaActa = resUrl.publicUrl;

        if (!esWalkover) {
            const filasDetalle = [];
            for (let i = 1; i <= 5; i++) {
                const part = PLANILLA_ITTF[`partido${i}`];
                filasDetalle.push({
                    partido_id: partidoId,
                    orden: i,
                    modalidad: part.modalidad,
                    local_jugador1_id: parseInt(part.local1),
                    local_jugador2_id: part.local2 ? parseInt(part.local2) : null,
                    visitante_jugador1_id: parseInt(part.vis1),
                    visitante_jugador2_id: part.vis2 ? parseInt(part.vis2) : null,
                    sets_local: part.setsL,
                    sets_visitante: part.setsV,
                    score_sets_local: part.scoreL,
                    score_sets_visitante: part.scoreV
                });
            }
            const { error: errDetalle } = await window.supabase.from('fixture_detalles').insert(filasDetalle);
            if (errDetalle) throw errDetalle;
        }

        let valorWalkover = null;
        if (chkLocalWO) valorWalkover = "LOCAL";
        if (chkVisitanteWO) valorWalkover = "VISITANTE";

        const { error: errUpdate } = await window.supabase
            .from('fixture')
            .update({
                score_local: scoreLocal,
                score_visitante: scoreVisitante,
                estado: "Finalizado",
                url_acta: urlPublicaActa,
                walkover: valorWalkover
            })
            .eq('id', partidoId);

        if (errUpdate) throw errUpdate;

        alert(`¡Planilla cargada con éxito absoluto!`);
        window.location.href = "liga-equipos.html";

    } catch (error) {
        console.error("💥 Error crítico al guardar:", error);
        alert("Ocurrió un error crítico al guardar.");
        btnEnviar.disabled = false;
        btnEnviar.innerHTML = textoOriginalBtn;
    }
}

// =========================================================================
// 6. CONEXIÓN DE LISTENERS CON INICIALIZACIÓN SEGURA
// =========================================================================
function conectarEventosFormulario() {
    const selectFecha = document.getElementById('select-fecha-num');
    if (selectFecha) {
        selectFecha.addEventListener('change', (e) => {
            FILTROS_CARGA.fechaNum = parseInt(e.target.value) || 1;
            FILTROS_CARGA.partidoSeleccionadoId = "";
            console.log(`📅 Sincronizando Fecha: ${FILTROS_CARGA.fechaNum}`);

            const selectPartido = document.getElementById('select-partido-id');
            if (selectPartido) {
                selectPartido.value = "";
            }

            restaurarBotonEnvioOriginal();
            actualizarDesplegablePartidos();
            manejarCambioPartido("");
        });
    }

    const selectPartido = document.getElementById('select-partido-id');
    if (selectPartido) {
        selectPartido.addEventListener('change', (e) => {
            manejarCambioPartido(e.target.value);
        });
    }

    const inputArchivo = document.getElementById('archivo-planilla-input');
    if (inputArchivo) {
        inputArchivo.addEventListener('change', (e) => {
            const contenedorFeedback = document.getElementById('feedback-archivo-contenedor');
            const textoFeedback = document.getElementById('feedback-archivo-texto');
            const iconoFeedback = document.getElementById('feedback-archivo-icono');

            if (e.target.files && e.target.files.length > 0) {
                const archivo = e.target.files[0];
                const pesoEnMB = (archivo.size / (1024 * 1024)).toFixed(2);

                if (contenedorFeedback) {
                    contenedorFeedback.className = "mt-2 p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl flex items-center gap-2.5 transition-all text-xs font-medium";
                }
                if (textoFeedback) {
                    textoFeedback.innerHTML = `<strong>Foto cargada:</strong> ${archivo.name} (${pesoEnMB} MB)`;
                }
                if (iconoFeedback) {
                    iconoFeedback.className = "fas fa-check-circle text-green-600 text-base";
                }
            } else {
                if (contenedorFeedback) contenedorFeedback.className = "hidden";
            }
        });
    }

    // ==========================================
    // 🔥 NUEVO: LÓGICA PARA MOSTRAR/OCULTAR PIN (EL OJITO)
    // ==========================================
    // Buscamos el contenedor o el ícono del ojo que está dentro de la clave de validación
    const inputPin = document.getElementById('token-club-input') || document.getElementById('token-club') || document.querySelector('input[type="password"]');
    // Buscamos el ícono del ojito (por clase o contenedor)
    const btnOjo = document.querySelector('.clave-validacion-contenedor i') || document.querySelector('input[type="password"] + i') || document.querySelector('.fa-eye') || document.querySelector('.fa-eye-slash');

    if (btnOjo && inputPin) {
        // Le damos interactividad real al hacer clic
        btnOjo.style.cursor = 'pointer'; // Nos aseguramos de que muestre la manito al pasar el mouse
        btnOjo.addEventListener('click', () => {
            if (inputPin.type === 'password') {
                inputPin.type = 'text';
                // Cambiamos el ícono a un ojo tachado
                btnOjo.classList.remove('fa-eye');
                btnOjo.classList.add('fa-eye-slash');
            } else {
                inputPin.type = 'password';
                // Volvemos al ícono del ojo normal
                btnOjo.classList.remove('fa-eye-slash');
                btnOjo.classList.add('fa-eye');
            }
        });
        console.log("👁️ [UI Sync] Listener del ojito para revelar PIN configurado correctamente.");
    } else {
        console.warn("⚠️ [UI Sync] No se pudo conectar el ojito. Verificá los IDs/clases del input de PIN.");
    }
    // ==========================================

    const formEnvio = document.getElementById('form-envio-planilla');
    if (formEnvio) {
        formEnvio.addEventListener('submit', procesarEnvioResultado);
    }
}

// Inicialización defensiva única con el DOM listo
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (window.supabase) {
            inicializarPantallaCarga();
            conectarEventosFormulario();
        } else {
            console.error("❌ [ASATEME] No se encontró window.supabase.");
        }
    }, 100);
});
