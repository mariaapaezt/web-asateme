// ==========================================
// 1. ESTADO CENTRAL DE LA PÁGINA PRINCIPAL
// ==========================================

// Variables globales en memoria
let LIGAS_DATA = {};
let FIXTURE_DATA = [];
let JUGADORES_DATA = [];

if (typeof APP_STATE === 'undefined') {
    window.APP_STATE = {
        currentTab: 'posiciones',
        currentLigaPosiciones: 'LIGA_A',
        currentLigaFixture: 'LIGA_A',
        currentLigaEquipos: 'LIGA_A',
        currentFechaFiltro: 1,
        filtroTextoEquipos: '',
        equipoSeleccionadoId: null
    };
}

async function cargarDatosDesdeSupabase() {
    try {
        console.log("📥 Descargando datos desde el cliente global de Supabase...");

        // Mostramos el spinner de carga prolijo en las tres pestañas
        mostrarEstadoDeCarga();

        // Validamos primero que el cliente exista
        if (!window.supabaseClient) {
            throw new Error("El cliente de Supabase no está inicializado.");
        }

        const [resEquipos, resFixture, resJugadores] = await Promise.all([
            window.supabaseClient.from('equipos').select('*'),
            window.supabaseClient.from('fixture').select('*'),
            window.supabaseClient.from('jugadores').select('*')
        ]);

        if (resEquipos.error || resFixture.error || resJugadores.error) {
            const errorDetalle = resEquipos.error || resFixture.error || resJugadores.error;
            throw new Error(`Supabase Error: ${errorDetalle.message}`);
        }

        // Guardamos los datos puros en las variables globales
        FIXTURE_DATA = resFixture.data;
        JUGADORES_DATA = resJugadores.data;

        LIGAS_DATA = {};
        resEquipos.data.forEach(equipo => {
            if (!LIGAS_DATA[equipo.liga]) {
                LIGAS_DATA[equipo.liga] = [];
            }
            LIGAS_DATA[equipo.liga].push(equipo);
        });

        // Todo salió bien: Renderizamos la app de forma normal
        renderApp();

    } catch (error) {
        console.error("💥 Error crítico capturado:", error);
        mostrarMensajeErrorPantalla(
            "No se pudieron cargar las posiciones ni el fixture en este momento. " +
            "Por favor, verificá tu conexión a internet e intentalo de nuevo."
        );
    }
}

// --- FUNCIONES AUXILIARES DE UX (ESTADOS VISUALES DE CARGA Y ERROR) ---

function mostrarEstadoDeCarga() {
    const loaderHtml = `
        <div class="text-center py-10 flex flex-col items-center justify-center gap-3 text-gray-500 animate-pulse">
            <i class="fas fa-spinner fa-spin text-2xl text-asatemeBlue"></i>
            <p class="text-sm font-medium">Actualizando datos en tiempo real...</p>
        </div>
    `;

    ['tabla-posiciones-body', 'fixture-partidos-container', 'equipos-grid-container'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (id === 'tabla-posiciones-body') {
                el.innerHTML = `<tr><td colspan="8">${loaderHtml}</td></tr>`;
            } else {
                el.innerHTML = loaderHtml;
            }
        }
    });
}

function mostrarMensajeErrorPantalla(mensaje) {
    const errorHtml = `
        <div class="max-w-md mx-auto my-6 p-4 bg-red-50 border border-red-200 rounded-xl text-center shadow-xs">
            <div class="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 text-red-600">
                <i class="fas fa-exclamation-circle text-lg"></i>
            </div>
            <p class="text-sm text-red-700 font-semibold mb-3">${mensaje}</p>
            <button onclick="cargarDatosDesdeSupabase()" class="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all shadow-xs cursor-pointer">
                <i class="fas fa-sync-alt mr-1"></i> Reintentar conexión
            </button>
        </div>
    `;

    ['tabla-posiciones-body', 'fixture-partidos-container', 'equipos-grid-container'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (id === 'tabla-posiciones-body') {
                el.innerHTML = `<tr><td colspan="8" class="py-6">${errorHtml}</td></tr>`;
            } else {
                el.innerHTML = errorHtml;
            }
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    cargarDatosDesdeSupabase();

    const inputBusqueda = document.getElementById('input-busqueda-equipos');
    if (inputBusqueda) {
        inputBusqueda.addEventListener('input', (e) => {
            APP_STATE.filtroTextoEquipos = e.target.value;
            renderEquipos();
        });
    }
});

// ==========================================
// 2. FUNCIONES DE CONTROL (LOGICA INTERNA)
// ==========================================

function switchTab(tabId) {
    APP_STATE.currentTab = tabId;

    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('border-asatemeRed', 'text-asatemeRed');
        btn.classList.add('border-transparent', 'text-gray-500');
    });

    document.getElementById(`content-${tabId}`).classList.add('active');
    const activeBtn = document.getElementById(`tab-${tabId}`);
    if (activeBtn) {
        activeBtn.className = "tab-btn px-4 py-4 text-sm font-bold border-b-2 border-asatemeRed text-asatemeRed whitespace-nowrap";
    }

    renderApp();
}

function switchLiga(ligaId) {
    APP_STATE.currentLigaPosiciones = ligaId;

    document.querySelectorAll('.liga-filter-btn').forEach(btn => {
        if (btn.dataset.liga === ligaId) {
            btn.className = "liga-filter-btn px-4 py-2 text-sm font-semibold rounded-lg shadow-sm bg-asatemeBlue text-white border border-gray-200 transition-all";
        } else {
            btn.className = "liga-filter-btn px-4 py-2 text-sm font-semibold rounded-lg shadow-sm bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 transition-all";
        }
    });

    renderApp();
}

function cambiarFechaFixture(direccion) {
    const nuevaFecha = APP_STATE.currentFechaFiltro + direccion;
    if (nuevaFecha >= 1 && nuevaFecha <= 5) {
        APP_STATE.currentFechaFiltro = nuevaFecha;
        renderFixture();
    }
}

function switchLigaFixture(ligaId) {
    APP_STATE.currentLigaFixture = ligaId;

    const btnA = document.getElementById('btn-fixture-ligaA');
    const btnB = document.getElementById('btn-fixture-ligaB');

    if (ligaId === 'LIGA_A') {
        btnA.className = "px-4 py-1.5 text-xs font-semibold rounded-lg shadow-sm bg-asatemeBlue text-white border border-gray-200 transition-all";
        btnB.className = "px-4 py-1.5 text-xs font-semibold rounded-lg shadow-sm bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 transition-all";
    } else {
        btnB.className = "px-4 py-1.5 text-xs font-semibold rounded-lg shadow-sm bg-asatemeBlue text-white border border-gray-200 transition-all";
        btnA.className = "px-4 py-1.5 text-xs font-semibold rounded-lg shadow-sm bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 transition-all";
    }

    renderFixture();
}

function seleccionarLigaEquipos(ligaId) {
    APP_STATE.currentLigaEquipos = ligaId;
    APP_STATE.equipoSeleccionadoId = null;

    const btnA = document.getElementById('btn-equipos-ligaA');
    const btnB = document.getElementById('btn-equipos-ligaB');

    if (ligaId === 'LIGA_A') {
        btnA.className = "px-4 py-2 text-sm font-semibold rounded-lg shadow-sm bg-asatemeBlue text-white border border-gray-200 transition-all cursor-pointer";
        btnB.className = "px-4 py-2 text-sm font-semibold rounded-lg shadow-sm bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 transition-all cursor-pointer";
    } else {
        btnB.className = "px-4 py-2 text-sm font-semibold rounded-lg shadow-sm bg-asatemeBlue text-white border border-gray-200 transition-all cursor-pointer";
        btnA.className = "px-4 py-2 text-sm font-semibold rounded-lg shadow-sm bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 transition-all cursor-pointer";
    }

    cerrarDetalleJugadores();
    renderEquipos();
}

function verJugadoresEquipo(equipoId) {
    APP_STATE.equipoSeleccionadoId = equipoId;

    document.querySelectorAll('.card-equipo-btn').forEach(card => {
        if (card.dataset.id === equipoId) {
            card.classList.add('border-asatemeBlue', 'ring-2', 'ring-blue-100');
        } else {
            card.classList.remove('border-asatemeBlue', 'ring-2', 'ring-blue-100');
        }
    });

    const ligaActual = APP_STATE.currentLigaEquipos;
    const equipo = LIGAS_DATA[ligaActual].find(e => e.id === equipoId);

    if (!equipo) return;

    const nombreContainer = document.getElementById('nombre-equipo-seleccionado');
    if (nombreContainer) nombreContainer.innerText = equipo.nombre;

    const jugadoresContainer = document.getElementById('jugadores-equipo-container');
    if (jugadoresContainer) {
        jugadoresContainer.innerHTML = '';

        const jugadoresFiltrados = JUGADORES_DATA.filter(j => j.equipo_id === equipoId);

        if (jugadoresFiltrados.length === 0) {
            jugadoresContainer.innerHTML = `<p class="text-xs italic text-gray-400 p-2">No hay jugadores cargados en este equipo.</p>`;
            return;
        }

        jugadoresFiltrados.forEach(j => {
            const blockHtml = `
                <div class="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3 shadow-xs">
                    <div class="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 shrink-0">
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path>
                        </svg>
                    </div>
                    <div>
                        <p class="font-bold text-gray-800 text-sm leading-tight">${j.nombre}</p>
                    </div>
                </div>
            `;
            jugadoresContainer.innerHTML += blockHtml;
        });
    }

    const seccionDetalle = document.getElementById('seccion-detalle-jugadores');
    if (seccionDetalle) seccionDetalle.classList.remove('hidden');
}

function cerrarDetalleJugadores() {
    APP_STATE.equipoSeleccionadoId = null;
    const seccionDetalle = document.getElementById('seccion-detalle-jugadores');
    if (seccionDetalle) seccionDetalle.classList.add('hidden');

    document.querySelectorAll('.card-equipo-btn').forEach(card => {
        card.classList.remove('border-asatemeBlue', 'ring-2', 'ring-blue-100');
    });
}

// ==========================================
// 3. RENDERIZADORES REUTILIZABLES (VISTAS)
// ==========================================

function renderApp() {
    renderPosiciones();
    renderFixture();
    renderEquipos();
}

function calcularTablaPosiciones(liga) {
    const equiposBase = LIGAS_DATA[liga] || [];

    const tablaCalculada = equiposBase.map(e => ({
        id: e.id,
        nombre: e.nombre,
        sj: 0,  // Series Jugadas
        sg: 0,  // Series Ganadas
        sp: 0,  // Series Perdidas
        pg: 0,  // Partidos individuales Ganados
        pp: 0,  // Partidos individuales Perdidos
        pts: 0  // Puntos del Campeonato
    }));

    const partidosJugados = FIXTURE_DATA.filter(p => p.liga === liga && p.estado === "Finalizado");

    partidosJugados.forEach(partido => {
        const local = tablaCalculada.find(e => e.id === partido.local_id);
        const visitante = tablaCalculada.find(e => e.id === partido.visitante_id);

        if (!local || !visitante) return;

        const sLocal = partido.score_local || 0;
        const sVisitante = partido.score_visitante || 0;

        if (partido.walkover && partido.walkover.trim() !== "") {
            if (partido.walkover === "LOCAL") {
                visitante.sj += 1;
                visitante.sg += 1;
                visitante.pg += 5;
                visitante.pts += 2;

                local.sp += 1;
                local.pp += 5;
                local.pts += 0;
            } else if (partido.walkover === "VISITANTE") {
                local.sj += 1;
                local.sg += 1;
                local.pg += 5;
                local.pts += 2;

                visitante.sp += 1;
                visitante.pp += 5;
                visitante.pts += 0;
            }
        }
        else {
            local.sj += 1;
            visitante.sj += 1;

            local.pg += sLocal;
            local.pp += sVisitante;
            visitante.pg += sVisitante;
            visitante.pp += sLocal;

            if (sLocal > sVisitante) {
                local.sg += 1;
                local.pts += 2;
                visitante.sp += 1;
                visitante.pts += 1;
            } else {
                visitante.sg += 1;
                visitante.pts += 2;
                local.sp += 1;
                local.pts += 1;
            }
        }
    });

    tablaCalculada.sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        const difA = a.pg - a.pp;
        const difB = b.pg - b.pp;
        return difB - difA;
    });

    return tablaCalculada;
}

function renderPosiciones() {
    const ligaActual = APP_STATE.currentLigaPosiciones;

    const tituloLayout = document.getElementById('titulo-liga-actual');
    if (tituloLayout) {
        tituloLayout.innerText = ligaActual === 'LIGA_A' ? 'Liga A ' : 'Liga B ';
    }

    const equiposClasificados = calcularTablaPosiciones(ligaActual);

    const tbody = document.getElementById('tabla-posiciones-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (equiposClasificados.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="py-8 text-center text-gray-400 italic">
                    No hay equipos registrados en esta liga actualmente.
                </td>
            </tr>
        `;
        return;
    }

    equiposClasificados.forEach((equipo, index) => {
        const posicion = index + 1;
        let posBadge = `<span class="font-bold text-gray-500">${posicion}</span>`;
        if (posicion === 1) posBadge = `<span class="w-6 h-6 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-xs mx-auto">1</span>`;
        if (posicion === 2) posBadge = `<span class="w-6 h-6 rounded-full bg-slate-100 text-slate-800 font-bold flex items-center justify-center text-xs mx-auto">2</span>`;

        const filaHtml = `
            <tr class="hover:bg-gray-50/70 transition-colors text-center">
                <td class="py-4 px-4 text-center">${posBadge}</td>
                <td class="py-4 px-4 text-left font-medium text-gray-900 truncate max-w-[200px]">${equipo.nombre}</td>
                <td class="py-4 px-4 text-gray-600 font-semibold">${equipo.sj}</td>
                <td class="py-4 px-4 font-bold text-green-600 bg-green-50/20">${equipo.sg}</td>
                <td class="py-4 px-4 font-bold text-red-600 bg-red-50/20">${equipo.sp}</td>
                <td class="py-4 px-4 text-gray-700 font-medium">${equipo.pg}</td>
                <td class="py-4 px-4 text-gray-700 font-medium">${equipo.pp}</td>
                <td class="py-4 px-4 font-black text-asatemeBlue bg-gray-50/80 text-base border-l border-gray-100">${equipo.pts}</td>
            </tr>
        `;
        tbody.innerHTML += filaHtml;
    });
}

function renderFixture() {
    const ligaActual = APP_STATE.currentLigaFixture;
    const fechaActual = APP_STATE.currentFechaFiltro;

    const tituloLiga = document.getElementById('fixture-titulo-liga');
    if (tituloLiga) tituloLiga.innerText = ligaActual === 'LIGA_A' ? 'Liga A ' : 'Liga B ';

    const txtFecha = document.getElementById('txt-fecha-actual');
    if (txtFecha) txtFecha.innerText = `Fecha ${fechaActual}`;

    document.getElementById('btn-fecha-prev').disabled = (fechaActual === 1);
    document.getElementById('btn-fecha-next').disabled = (fechaActual === 5);

    const partidosFiltrados = FIXTURE_DATA.filter(p => p.liga === ligaActual && p.fecha_numero === fechaActual);

    const container = document.getElementById('fixture-partidos-container');
    if (!container) return;
    container.innerHTML = '';

    if (partidosFiltrados.length === 0) {
        container.innerHTML = `
            <div class="col-span-full bg-white rounded-xl p-8 text-center border border-dashed border-gray-200">
                <p class="text-sm text-gray-500 font-medium">No hay partidos agendados para la Fecha ${fechaActual} en esta liga.</p>
            </div>
        `;
        return;
    }

    partidosFiltrados.forEach(partido => {
        const todosLosEquipos = Object.values(LIGAS_DATA).flat();

        const local = todosLosEquipos.find(e => e.id === partido.local_id) || { id: partido.local_id, nombre: partido.local_id };
        const visitante = todosLosEquipos.find(e => e.id === partido.visitante_id) || { id: partido.visitante_id, nombre: partido.visitante_id };

        // =====================================================================
        // REGLA DE NEGOCIO: Validamos si ambos equipos tienen el mínimo de jugadores
        // =====================================================================
        const validacionLocal = LigaService.validarRequisitosEquipo(local.id, JUGADORES_DATA);
        const validacionVisitante = LigaService.validarRequisitosEquipo(visitante.id, JUGADORES_DATA);

        const ambosEquiposValidos = validacionLocal.valido && validacionVisitante.valido;

        const esFinalizado = partido.estado === "Finalizado";

        // Determinamos el estilo del estado (Badge)
        let badgeClass = "";
        let estadoTexto = partido.estado;

        if (esFinalizado) {
            badgeClass = "bg-green-100 text-green-800 border border-green-200";
        } else if (!ambosEquiposValidos) {
            // Si no está finalizado y falta gente, lo marcamos como inhabilitado para carga
            badgeClass = "bg-amber-100 text-amber-800 border border-amber-200 font-bold animate-pulse";
            estadoTexto = "Falta Plantel";
        } else {
            badgeClass = "bg-blue-100 text-blue-800 border border-blue-200";
        }

        let scoreLocalTxt = partido.score_local !== null ? partido.score_local : "-";
        let scoreVisitanteTxt = partido.score_visitante !== null ? partido.score_visitante : "-";

        // Armamos el texto de advertencia si corresponde
        let subtextoWO = "";
        if (partido.walkover && partido.walkover.trim() !== "") {
            subtextoWO = `<p class="text-[10px] text-red-500 font-bold mt-1"><i class="fas fa-exclamation-triangle"></i> Resuelto por W.O. (Ausente: ${partido.walkover})</p>`;
            scoreLocalTxt = partido.walkover === "LOCAL" ? "0" : "5";
            scoreVisitanteTxt = partido.walkover === "VISITANTE" ? "0" : "5";
        } else if (!esFinalizado && !ambosEquiposValidos) {
            // Si le falta completar jugadores a alguno, listamos quién está en falta
            let quienesFaltan = [];
            if (!validacionLocal.valido) quienesFaltan.push(local.nombre);
            if (!validacionVisitante.valido) quienesFaltan.push(visitante.nombre);

            subtextoWO = `<p class="text-[10px] text-amber-600 font-semibold mt-1"><i class="fas fa-user-slash"></i> Carga bloqueada.</p>`;
        }

        // Variable para controlar si el botón de cargar resultado (si tenés uno) debería ocultarse o bloquearse
        // Si en tu diseño actual el click en la tarjeta abre el modal de carga de puntos, 
        // usamos la variable 'ambosEquiposValidos' o 'esFinalizado' para dejar pasar o no el evento.
        const clickAccion = (esFinalizado || !ambosEquiposValidos)
            ? ""
            : `onclick="abrirModalCargaResultado('${partido.id}')"`; // Ajustá el nombre de tu función si usás otra

        const cursorClase = (esFinalizado || !ambosEquiposValidos) ? "cursor-not-allowed" : "hover:shadow-md cursor-pointer";

        const tarjetaHtml = `
            <div ${clickAccion} class="bg-white rounded-xl border border-gray-200 p-5 shadow-xs flex flex-col justify-between transition-all duration-200 ${cursorClase}">
                <div class="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
                    <div class="space-y-0.5">
                        <p class="text-xs font-bold text-gray-500">${partido.fecha_txt}</p>
                        ${subtextoWO}
                    </div>
                    <span class="text-[11px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${badgeClass}">
                        ${estadoTexto}
                    </span>
                </div>
                <div class="space-y-3 my-2">
                    <div class="flex justify-between items-center">
                        <span class="font-semibold text-gray-900 text-sm truncate pr-4 ${!validacionLocal.valido && !esFinalizado ? 'text-red-400 line-through' : ''}">${local.nombre}</span>
                        <span class="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center font-black text-sm text-gray-800 ${esFinalizado && parseInt(scoreLocalTxt) > parseInt(scoreVisitanteTxt) ? 'bg-amber-50 border-amber-200 text-amber-900' : ''}">
                            ${scoreLocalTxt}
                        </span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="font-semibold text-gray-900 text-sm truncate pr-4 ${!validacionVisitante.valido && !esFinalizado ? 'text-red-400 line-through' : ''}">${visitante.nombre}</span>
                        <span class="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center font-black text-sm text-gray-800 ${esFinalizado && parseInt(scoreVisitanteTxt) > parseInt(scoreLocalTxt) ? 'bg-amber-50 border-amber-200 text-amber-900' : ''}">
                            ${scoreVisitanteTxt}
                        </span>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += tarjetaHtml;
    });
}

function renderEquipos() {
    const container = document.getElementById('equipos-grid-container');
    if (!container) return;

    container.innerHTML = '';

    // Leemos el estado global tal como lo hacía tu app originalmente
    const ligaActual = APP_STATE.currentLigaEquipos;
    const equiposBase = LIGAS_DATA[ligaActual] || [];

    // Filtramos por el input de búsqueda de tu app
    const textoFiltro = APP_STATE.filtroTextoEquipos.toLowerCase().trim();
    const equiposFiltrados = equiposBase.filter(e => e.nombre.toLowerCase().includes(textoFiltro));

    if (equiposFiltrados.length === 0) {
        container.innerHTML = `<p class="text-xs italic text-gray-400 p-4 col-span-full text-center">No se encontraron equipos.</p>`;
        return;
    }

    equiposFiltrados.forEach(equipo => {
        // Usamos la capa de servicio con el patrón de diseño para validar el reglamento de 2 jugadores mínimos
        const estadoInscripcion = LigaService.validarRequisitosEquipo(equipo.id, JUGADORES_DATA);

        let alertaHTML = '';
        let opacidadClase = '';
        let bordeEspecial = equipo.id === APP_STATE.equipoSeleccionadoId ? 'border-asatemeBlue ring-2 ring-blue-100' : 'border-gray-200';

        if (!estadoInscripcion.valido) {
            opacidadClase = 'opacity-85';
            alertaHTML = `
                <div class="mt-3 bg-red-50 border border-red-200 text-red-700 px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 min-h-[6px]">
                    <i class="fas fa-exclamation-triangle shrink-0 text-red-500"></i>
                    <span><strong class="font-bold"></strong>Mínimo 2 jugadores.</span>
                </div>
            `;
        } else {
            alertaHTML = `
                <div class="mt-3 bg-green-50 border border-green-200 text-green-700 px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 min-h-[36px]">
                    <i class="fas fa-check-circle shrink-0 text-green-500"></i>
                    <span>Plantel verificado</span>
                </div>
            `;
        }

        // Estructura de la tarjeta del equipo con el ajuste h-full para estirado uniforme
        const tarjeta = `
            <div onclick="verJugadoresEquipo('${equipo.id}')" data-id="${equipo.id}" class="card-equipo-btn bg-white rounded-xl border ${bordeEspecial} p-4 flex flex-col justify-between h-full hover:shadow-md transition-all duration-200 cursor-pointer ${opacidadClase}">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 bg-gray-50 border border-gray-100 rounded-xl p-1 flex items-center justify-center shrink-0">
                        <img src="${equipo.logo}" alt="Logo ${equipo.nombre}" class="w-full h-full object-contain rounded">
                    </div>
                    <div class="min-w-0 flex-1">
                        <h3 class="font-bold text-gray-800 text-sm leading-tight truncate">${equipo.nombre}</h3>
                        <p class="text-gray-500 text-xs mt-0.5 truncate">Delegado: ${equipo.delegado || 'Sin asignar'}</p>
                    </div>
                </div>
                
                <!-- Bloque de alerta alineado y con el texto exacto que me pasaste -->
                ${alertaHTML}
            </div>
        `;
        
        container.innerHTML += tarjeta;
    });
}

// =============================================================================
// PATRÓN REPOSITORY/SERVICE: Validación y Estado de Equipos
// =============================================================================

/**
 * Servicio encargado de aplicar las reglas de negocio de la liga
 */
const LigaService = {
    /**
     * Valida si un equipo cumple con los requisitos mínimos para competir
     * @param {string} equipoId 
     * @param {Array} listaJugadores 
     * @returns {Object} { valido: boolean, cantidad: number }
     */
    validarRequisitosEquipo(equipoId, listaJugadores) {
        const jugadoresDelEquipo = listaJugadores.filter(j => j.equipo_id === equipoId);
        const cantidad = jugadoresDelEquipo.length;

        return {
            valido: cantidad >= 2, // Mínimo 2 jugadores reglamentarios
            cantidad: cantidad
        };
    }
};