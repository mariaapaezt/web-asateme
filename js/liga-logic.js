// =============================================================================
// 1. VARIABLES GLOBALES (ESTADO EN MEMORIA)
// =============================================================================
let LIGAS_DATA = { LIGA_A: [], LIGA_B: [] }; // Equipos agrupados por clave de liga
let FIXTURE_DATA = [];                      // Lista pura de partidos (esquema real)
let JUGADORES_DATA = [];                    // Lista pura de jugadores (esquema real)
let TODOS_DETALLES_JUEGOS = [];             // Almacena todos los partidos individuales disputados en las planillas

// Diccionario auxiliar plano para cruzar IDs de equipos con sus nombres rápidamente
let EQUIPOS_MAP = {};

// Variable global en tu archivo de estados para cachear los detalles ya descargados
if (typeof FIXTURE_DETALLES_CACHE === 'undefined') {
    var FIXTURE_DETALLES_CACHE = {};
}

// =============================================================================
// 2. CONTROLADORES DE INTERFAZ (Funciones vinculadas a los 'onclick' del HTML)
// =============================================================================
/**
 * Controla el cambio de pestañas principales (Posiciones, Fixture, Equipos)
 */
function switchTab(tabId) {
    APP_STATE.currentTab = tabId;

    // Ocultar contenidos y limpiar estados activos de botones
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('border-asatemeRed', 'text-asatemeRed');
        btn.classList.add('border-transparent', 'text-gray-500');
    });

    // Activar el contenedor seleccionado
    const contentEl = document.getElementById(`content-${tabId}`);
    if (contentEl) contentEl.classList.add('active');

    // Resaltar el botón clickeado
    const activeBtn = document.getElementById(`tab-${tabId}`);
    if (activeBtn) {
        activeBtn.className = "tab-btn px-4 py-4 text-sm font-bold border-b-2 border-asatemeRed text-asatemeRed whitespace-nowrap";
    }

    // Orquestar renderizado de la solapa activa
    renderApp();
}

/**
 * Controla el filtro de Ligas dentro de la pestaña de Posiciones
 */
function switchLiga(ligaId) {
    APP_STATE.currentLigaPosiciones = ligaId;

    document.querySelectorAll('.liga-filter-btn').forEach(btn => {
        if (btn.dataset.liga === ligaId) {
            btn.className = "liga-filter-btn px-4 py-2 text-sm font-semibold rounded-lg shadow-sm bg-asatemeBlue text-white border border-gray-200 transition-all";
        } else {
            btn.className = "liga-filter-btn px-4 py-2 text-sm font-semibold rounded-lg shadow-sm bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 transition-all";
        }
    });

    renderPosiciones();
}

/**
 * Controla las flechas de navegación de jornadas en el Fixture
 */
function cambiarFechaFixture(direccion) {
    const nuevaFecha = APP_STATE.currentFechaFiltro + direccion;

    // Rango dinámico basado en la columna 'fecha_numero' de tu base de datos
    const maxFecha = FIXTURE_DATA.length > 0 ? Math.max(...FIXTURE_DATA.map(p => Number(p.fecha_numero || 1))) : 5;

    if (nuevaFecha >= 1 && nuevaFecha <= maxFecha) {
        APP_STATE.currentFechaFiltro = nuevaFecha;
        renderFixture();
    }
}

/**
 * Controla el filtro de Ligas dentro del Fixture
 */
function switchLigaFixture(ligaId) {
    APP_STATE.currentLigaFixture = ligaId;

    const btnA = document.getElementById('btn-fixture-ligaA');
    const btnB = document.getElementById('btn-fixture-ligaB');

    if (ligaId === 'LIGA_A') {
        if (btnA) btnA.className = "px-4 py-1.5 text-xs font-semibold rounded-lg shadow-sm bg-asatemeBlue text-white border border-gray-200 transition-all";
        if (btnB) btnB.className = "px-4 py-1.5 text-xs font-semibold rounded-lg shadow-sm bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 transition-all";
    } else {
        if (btnB) btnB.className = "px-4 py-1.5 text-xs font-semibold rounded-lg shadow-sm bg-asatemeBlue text-white border border-gray-200 transition-all";
        if (btnA) btnA.className = "px-4 py-1.5 text-xs font-semibold rounded-lg shadow-sm bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 transition-all";
    }

    renderFixture();
}

/**
 * Controla el filtro de Ligas dentro de la sección de Equipos/Planteles
 */
function seleccionarLigaEquipos(ligaId) {
    APP_STATE.currentLigaEquipos = ligaId;
    APP_STATE.equipoSeleccionadoId = null;

    const btnA = document.getElementById('btn-equipos-ligaA');
    const btnB = document.getElementById('btn-equipos-ligaB');

    if (ligaId === 'LIGA_A') {
        if (btnA) btnA.className = "px-4 py-2 text-sm font-semibold rounded-lg shadow-sm bg-asatemeBlue text-white border border-gray-200 transition-all cursor-pointer";
        if (btnB) btnB.className = "px-4 py-2 text-sm font-semibold rounded-lg shadow-sm bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 transition-all cursor-pointer";
    } else {
        if (btnB) btnB.className = "px-4 py-2 text-sm font-semibold rounded-lg shadow-sm bg-asatemeBlue text-white border border-gray-200 transition-all cursor-pointer";
        if (btnA) btnA.className = "px-4 py-2 text-sm font-semibold rounded-lg shadow-sm bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 transition-all cursor-pointer";
    }

    cerrarDetalleJugadores();
    renderEquipos();
}

/**
 * Acción global unificada al hacer click en la tarjeta de un equipo
 */
function verDetalleEquipo(equipoId, btnElement) {
    if (typeof APP_STATE !== 'undefined') {
        APP_STATE.equipoSeleccionadoId = String(equipoId);
    }

    // Limpiamos visualmente el borde activo de todas las demás tarjetas
    document.querySelectorAll('.card-equipo-btn').forEach(btn => {
        btn.classList.remove('border-asatemeBlue', 'ring-2', 'ring-blue-100', 'bg-blue-50/20');
        btn.classList.add('border-gray-200', 'bg-white');
    });

    // Le aplicamos el estilo activo al botón presionado
    if (btnElement) {
        btnElement.classList.remove('border-gray-200', 'bg-white');
        btnElement.classList.add('border-asatemeBlue', 'ring-2', 'ring-blue-100', 'bg-blue-50/20');
    }

    // Buscamos el nombre directamente del mapa plano (EQUIPOS_MAP) para evitar fallos de scope
    const datosClub = EQUIPOS_MAP[String(equipoId)];
    const nombreHeader = document.getElementById('nombre-equipo-seleccionado');
    if (nombreHeader && datosClub) {
        nombreHeader.textContent = datosClub.nombre;
    }

    // Ejecutamos el renderizado de la lista de buena fe de jugadores
    renderJugadoresDelEquipo(equipoId);
}

/**
 * Controla el cierre del panel inferior de Listas de Buena Fe
 */
function cerrarDetalleJugadores() {
    APP_STATE.equipoSeleccionadoId = null;
    const seccionDetalle = document.getElementById('seccion-detalle-jugadores');
    if (seccionDetalle) seccionDetalle.classList.add('hidden');

    document.querySelectorAll('.card-equipo-btn').forEach(card => {
        card.classList.remove('border-asatemeBlue', 'ring-2', 'ring-blue-100', 'bg-blue-50/20');
        card.classList.add('border-gray-200', 'bg-white');
    });
}

// =============================================================================
// 3. CONSULTAS ASÍNCRONAS A SUPABASE Y PROCESAMIENTO MATEMÁTICO
// =============================================================================
async function cargarDatosDesdeSupabase() {
    try {
        console.log("⏳ Conectando con Supabase y descargando datos...");

        if (typeof supabase === 'undefined') {
            throw new Error("La instancia 'supabase' no está definida. Revisá js/supabase-config.js");
        }

        // Descargamos las 4 tablas en paralelo al iniciar
        const [resEquipos, resFixture, resJugadores, resDetalles] = await Promise.all([
            supabase.from('equipos').select('*'),
            supabase.from('fixture').select('*'),
            supabase.from('jugadores').select('*'),
            supabase.from('fixture_detalles').select('*')
        ]);

        if (resEquipos.error) throw resEquipos.error;
        if (resFixture.error) throw resFixture.error;
        if (resJugadores.error) throw resJugadores.error;
        if (resDetalles.error) throw resDetalles.error;

        FIXTURE_DATA = resFixture.data || [];
        JUGADORES_DATA = resJugadores.data || [];

        // Guardamos todos los detalles en caché global para cálculos e historial
        TODOS_DETALLES_JUEGOS = resDetalles.data || [];
        // También alimentamos la caché de planillas para que los desplegables del fixture abran instantáneamente
        FIXTURE_DETALLES_CACHE = {};
        TODOS_DETALLES_JUEGOS.forEach(d => {
            if (!FIXTURE_DETALLES_CACHE[d.partido_id]) {
                FIXTURE_DETALLES_CACHE[d.partido_id] = [];
            }
            FIXTURE_DETALLES_CACHE[d.partido_id].push(d);
        });

        let listaEquipos = resEquipos.data || [];

        EQUIPOS_MAP = {};
        listaEquipos.forEach(e => {
            EQUIPOS_MAP[String(e.id)] = {
                nombre: e.nombre,
                logo: e.logo || 'assets/logos/generic-pingpong.png'
            };

            // Inicializamos estadísticas en 0
            e.sj = 0;
            e.sg = 0;
            e.sp = 0;
            e.pg = 0;
            e.pp = 0;
            e.pts = 0;
        });

        // Procesamos los partidos finalizados para calcular estadísticas reales
        FIXTURE_DATA.forEach(partido => {
            if (partido.estado && partido.estado.toLowerCase() === 'finalizado') {
                const locId = String(partido.local_id);
                const visId = String(partido.visitante_id);

                const eqLocal = listaEquipos.find(e => String(e.id) === locId);
                const eqVisitante = listaEquipos.find(e => String(e.id) === visId);

                if (eqLocal && eqVisitante) {
                    eqLocal.sj += 1;
                    eqVisitante.sj += 1;

                    const quienFalto = partido.walkover ? String(partido.walkover).toUpperCase().trim() : null;

                    if (quienFalto === 'LOCAL') {
                        eqLocal.sp += 1;
                        eqLocal.pts += 0;
                        eqVisitante.sg += 1;
                        eqVisitante.pts += 2;
                    }
                    else if (quienFalto === 'VISITANTE') {
                        eqVisitante.sp += 1;
                        eqVisitante.pts += 0;
                        eqLocal.sg += 1;
                        eqLocal.pts += 2;
                    }
                    else {
                        const scoreLoc = Number(partido.score_local || 0);
                        const scoreVis = Number(partido.score_visitante || 0);

                        eqLocal.pg += scoreLoc;
                        eqLocal.pp += scoreVis;
                        eqVisitante.pg += scoreVis;
                        eqVisitante.pp += scoreLoc;

                        if (scoreLoc > scoreVis) {
                            eqLocal.sg += 1;
                            eqLocal.pts += 2;
                            eqVisitante.sp += 1;
                            eqVisitante.pts += 1;
                        } else if (scoreVis > scoreLoc) {
                            eqVisitante.sg += 1;
                            eqVisitante.pts += 2;
                            eqLocal.sp += 1;
                            eqLocal.pts += 1;
                        } else {
                            eqLocal.pts += 2;
                            eqVisitante.pts += 2;
                        }
                    }
                }
            }
        });

        // FUNCIÓN DE ORDENAMIENTO DUAL: 1º Puntos, 2º Coeficiente de Partidos (pg / pp)
        const funcionOrdenamientoAvanzado = (a, b) => {
            const puntosA = a.pts ?? 0;
            const puntosB = b.pts ?? 0;

            if (puntosB !== puntosA) {
                return puntosB - puntosA;
            }

            const pgA = a.pg ?? 0;
            const ppA = a.pp ?? 0;
            const pgB = b.pg ?? 0;
            const ppB = b.pp ?? 0;

            const coeficienteA = ppA === 0 ? pgA : pgA / ppA;
            const coeficienteB = ppB === 0 ? pgB : pgB / ppB;

            return coeficienteB - coeficienteA;
        };

        LIGAS_DATA = {
            LIGA_A: listaEquipos.filter(e => e.liga === 'LIGA_A').sort(funcionOrdenamientoAvanzado),
            LIGA_B: listaEquipos.filter(e => e.liga === 'LIGA_B').sort(funcionOrdenamientoAvanzado)
        };

        console.log("✅ Datos calculados dinámicamente con éxito en tiempo real.");

        const totalEquiposInscritos = LIGAS_DATA.LIGA_A.length + LIGAS_DATA.LIGA_B.length;
        const elContador = document.getElementById('contador-equipos-total');
        if (elContador) {
            elContador.textContent = `${totalEquiposInscritos} Equipos`;
        }

        renderPosiciones();
        renderApp();

    } catch (error) {
        console.error("❌ Error crítico al inicializar los datos de la liga:", error.message);
        mostrarErrorVisual(error.message);
    }
}

function mostrarErrorVisual(mensaje) {
    const contenedores = ['tabla-posiciones-body', 'fixture-partidos-container', 'equipos-grid-container'];
    contenedores.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.innerHTML = `
                <div class="col-span-full py-8 text-center text-red-500 font-medium bg-white rounded-xl border p-4 shadow-xs">
                    <i class="fas fa-exclamation-circle mr-2"></i> Error de Sincronización: ${mensaje}
                </div>
            `;
        }
    });
}

// =============================================================================
// 4. RENDERIZADORES COMPONENTES DE INTERFAZ
// =============================================================================
function renderApp() {
    const tabActiva = (typeof APP_STATE !== 'undefined' && APP_STATE.currentTab) || 'posiciones';

    if (tabActiva === 'posiciones') {
        renderPosiciones();
    } else if (tabActiva === 'fixture') {
        renderFixture();
    } else if (tabActiva === 'equipos') {
        renderEquipos();
    }
}

/**
 * Dibuja la Tabla de Posiciones usando el clon de datos ordenados
 */
function renderPosiciones() {
    const tablaBody = document.getElementById('tabla-posiciones-body');
    const tituloLiga = document.getElementById('titulo-liga-actual');

    if (!tablaBody) return;

    const ligaActual = (typeof APP_STATE !== 'undefined' && APP_STATE.currentLigaPosiciones) || 'LIGA_A';
    if (tituloLiga) tituloLiga.textContent = ligaActual === 'LIGA_A' ? 'Liga A' : 'Liga B';

    const equiposFiltrados = [...(LIGAS_DATA[ligaActual] || [])];

    if (equiposFiltrados.length === 0) {
        tablaBody.innerHTML = `<tr><td colspan="8" class="py-6 text-center text-gray-400">No hay registros de posiciones para esta liga.</td></tr>`;
        return;
    }

    let html = '';
    equiposFiltrados.forEach((equipo, index) => {
        let claseMedalla = "text-gray-500";
        if (index === 0) claseMedalla = "bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full text-xs";
        else if (index === 1) claseMedalla = "bg-gray-200 text-gray-800 font-bold px-2 py-0.5 rounded-full text-xs";
        else if (index === 2) claseMedalla = "bg-amber-600/10 text-amber-800 font-bold px-2 py-0.5 rounded-full text-xs";

        const datosEquipo = EQUIPOS_MAP[String(equipo.id)] || { nombre: equipo.nombre, logo: '' };

        const pos = index + 1;
        const nombreFinal = datosEquipo.nombre || "Club";
        const primeraLetra = nombreFinal.charAt(0).toUpperCase();

        const logoHTML = (datosEquipo.logo && datosEquipo.logo !== 'assets/logos/generic-pingpong.png' && datosEquipo.logo.trim() !== "")
            ? `<img src="${datosEquipo.logo}" alt="${nombreFinal}" class="w-full h-full object-contain" onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\'w-7 h-7 rounded-full bg-asatemeBlue text-white flex items-center justify-center text-xs font-bold uppercase\'>${primeraLetra}</div>';">`
            : `<div class="w-7 h-7 rounded-full bg-asatemeBlue text-white flex items-center justify-center text-xs font-bold uppercase">${primeraLetra}</div>`;

        const seriesJugadas = equipo.sj ?? 0;
        const seriesGanadas = equipo.sg ?? 0;
        const seriesPerdidas = equipo.sp ?? 0;
        const partidosGanados = equipo.pg ?? 0;
        const partidosPerdidos = equipo.pp ?? 0;
        const puntos = equipo.pts ?? 0;

        html += `
            <tr class="hover:bg-gray-50/70 transition-colors text-center border-b border-gray-100 last:border-0">
                <td class="py-3 px-4 font-bold text-sm"><span class="${claseMedalla}">${pos}</span></td>
                <td class="py-3 px-4 text-left font-semibold text-gray-900 flex items-center gap-3">
                    <div class="w-7 h-7 min-w-7 rounded-full overflow-hidden flex items-center justify-center border bg-white shadow-2xs">
                        ${logoHTML}
                    </div>
                    <span>${nombreFinal}</span>
                </td>
                <td class="py-3 px-4 text-gray-600 font-medium">${seriesJugadas}</td>
                <td class="py-3 px-4 font-semibold text-green-600">${seriesGanadas}</td>
                <td class="py-3 px-4 font-semibold text-red-600">${seriesPerdidas}</td>
                <td class="py-3 px-4 text-blue-600 font-medium">${partidosGanados}</td>
                <td class="py-3 px-4 text-amber-600 font-medium">${partidosPerdidos}</td>
                <td class="py-3 px-4 font-extrabold text-gray-800 bg-gray-50/50">${puntos}</td>
            </tr>
        `;
    });

    tablaBody.innerHTML = html;
}

/**
 * Dibuja la Sección del Fixture con los desplegables de planillas
 */
/**
 * Dibuja la Sección del Fixture con los desplegables de planillas y el equipo libre
 */
function renderFixture() {
    const container = document.getElementById('fixture-partidos-container');
    const txtFecha = document.getElementById('txt-fecha-actual');
    const tituloLiga = document.getElementById('fixture-titulo-liga');
    const btnPrev = document.getElementById('btn-fecha-prev');
    const btnNext = document.getElementById('btn-fecha-next');

    if (!container) return;

    const ligaActual = APP_STATE.currentLigaFixture;
    const fechaActual = APP_STATE.currentFechaFiltro;

    if (txtFecha) txtFecha.textContent = `Fecha ${fechaActual}`;
    if (tituloLiga) tituloLiga.textContent = ligaActual === 'LIGA_A' ? 'Liga A' : 'Liga B';

    // 1. Filtrar los partidos de la fecha y liga actual
    const partidosFiltrados = FIXTURE_DATA.filter(p => p.liga === ligaActual && Number(p.fecha_numero) === Number(fechaActual));
    const totalFechas = FIXTURE_DATA.length > 0 ? Math.max(...FIXTURE_DATA.map(p => Number(p.fecha_numero || 1))) : 5;

    if (btnPrev) btnPrev.disabled = (fechaActual === 1);
    if (btnNext) btnNext.disabled = (fechaActual >= totalFechas);

    let html = '';

    if (partidosFiltrados.length === 0) {
        html += `
            <div class="col-span-full bg-white p-8 text-center text-gray-400 border rounded-xl shadow-xs">
                <i class="far fa-calendar-times text-2xl mb-2 block text-gray-300"></i>
                No hay encuentros programados para la Fecha ${fechaActual} de esta zona.
            </div>
        `;
    } else {
        // 2. Construir el HTML de cada partido de la fecha
        partidosFiltrados.forEach(partido => {
            const datosLocal = EQUIPOS_MAP[String(partido.local_id)] || { nombre: `Equipo (${partido.local_id})`, logo: '' };
            const datosVisitante = EQUIPOS_MAP[String(partido.visitante_id)] || { nombre: `Equipo (${partido.visitante_id})`, logo: '' };
            const nombreL = datosLocal.nombre;
            const nombreV = datosVisitante.nombre;
            const letraL = nombreL.charAt(0).toUpperCase();
            const letraV = nombreV.charAt(0).toUpperCase();

            const imgLocalHTML = (datosLocal.logo && datosLocal.logo !== 'assets/logos/generic-pingpong.png' && datosLocal.logo.trim() !== "")
                ? `<img src="${datosLocal.logo}" alt="${nombreL}" class="w-full h-full object-contain" onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\'w-6 h-6 rounded-full bg-asatemeBlue text-white flex items-center justify-center text-[10px] font-bold uppercase\'>${letraL}</div>';">`
                : `<div class="w-6 h-6 rounded-full bg-asatemeBlue text-white flex items-center justify-center text-[10px] font-bold uppercase">${letraL}</div>`;

            const imgVisHTML = (datosVisitante.logo && datosVisitante.logo !== 'assets/logos/generic-pingpong.png' && datosVisitante.logo.trim() !== "")
                ? `<img src="${datosVisitante.logo}" alt="${nombreV}" class="w-full h-full object-contain" onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\'w-6 h-6 rounded-full bg-asatemeBlue text-white flex items-center justify-center text-[10px] font-bold uppercase\'>${letraV}</div>';">`
                : `<div class="w-6 h-6 rounded-full bg-asatemeBlue text-white flex items-center justify-center text-[10px] font-bold uppercase">${letraV}</div>`;

            const esFinalizado = (partido.estado && partido.estado.toLowerCase() === 'finalizado');
            let estadoBadge = `<span class="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wide">${partido.estado || 'Pendiente'}</span>`;

            let trofeoLocal = '';
            let trofeoVisitante = '';
            let botonDesplegableHTML = '';
            let contenedorDetalleHTML = '';

            if (esFinalizado) {
                estadoBadge = `<span class="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wide">Finalizado</span>`;

                const scoreL = Number(partido.score_local || 0);
                const scoreV = Number(partido.score_visitante || 0);
                if (scoreL > scoreV) {
                    trofeoLocal = `<i class="fas fa-trophy text-xs text-amber-500 mr-1 animate-pulse" title="Ganador de la serie"></i>`;
                } else if (scoreV > scoreL) {
                    trofeoVisitante = `<i class="fas fa-trophy text-xs text-amber-500 ml-1 animate-pulse" title="Ganador de la serie"></i>`;
                }

                botonDesplegableHTML = `
                    <div class="border-t border-gray-100 mt-4 pt-2 flex justify-center">
                        <button onclick="toggleDetallePartido('${partido.id}')" 
                                class="text-[11px] font-bold text-asatemeBlue hover:text-asatemeRed transition flex items-center gap-1 focus:outline-none py-1 px-3 rounded-md hover:bg-gray-50">
                            <i id="icono-detalle-${partido.id}" class="fas fa-chevron-down transition-transform duration-200"></i> 
                            <span>Ver resultados</span>
                        </button>
                    </div>
                `;

                contenedorDetalleHTML = `
                    <div id="contenedor-detalle-${partido.id}" class="hidden border-t border-gray-150 bg-gray-50/60 rounded-b-xl p-3 mt-2 space-y-2">
                        <div class="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                            <i class="fas fa-clipboard-list"></i> Detalle de la planilla
                        </div>
                        <div id="planilla-rows-${partido.id}" class="space-y-2">
                            <p class="text-xs text-gray-400 italic">Cargando detalles...</p>
                        </div>
                    </div>
                `;
            }

            html += `
                <div class="bg-white rounded-xl border border-gray-200 shadow-xs hover:shadow-md transition-all p-4 flex flex-col justify-between">
                    <div>
                        <div class="flex justify-between items-center border-b border-gray-100 pb-2 mb-3">
                            <span class="text-xs font-semibold text-gray-400 flex items-center gap-1.5">
                                <i class="far fa-clock"></i> ${partido.fecha_txt || 'Serie Oficial'}
                            </span>
                            ${estadoBadge}
                        </div>
                        <div class="grid grid-cols-7 items-center text-sm gap-2">
                            <div class="col-span-3 flex items-center justify-end gap-2 font-bold text-gray-800 tracking-tight truncate">
                                <span class="truncate">${trofeoLocal}${nombreL}</span>
                                <div class="w-6 h-6 min-w-6 rounded-full overflow-hidden border bg-white flex items-center justify-center p-0.5 shadow-3xs">
                                    ${imgLocalHTML}
                                </div>
                            </div>
                            <div class="col-span-1 flex justify-center items-center gap-1 font-black text-base text-gray-900 bg-gray-50 py-1 px-2 rounded-lg border">
                                <span>${esFinalizado ? (partido.score_local ?? 0) : '-'}</span>
                                <span class="text-xs text-gray-300 font-normal">:</span>
                                <span>${esFinalizado ? (partido.score_visitante ?? 0) : '-'}</span>
                            </div>
                            <div class="col-span-3 flex items-center justify-start gap-2 font-bold text-gray-800 tracking-tight truncate">
                                <div class="w-6 h-6 min-w-6 rounded-full overflow-hidden border bg-white flex items-center justify-center p-0.5 shadow-3xs">
                                    ${imgVisHTML}
                                </div>
                                <span class="truncate">${nombreV}${trofeoVisitante}</span>
                            </div>
                        </div>
                    </div>
                    ${botonDesplegableHTML}
                    ${contenedorDetalleHTML}
                </div>
            `;
        });
    }

    // =========================================================================
    // NUEVA INYECCIÓN: CALCULAR Y MOSTRAR EQUIPO LIBRE
    // =========================================================================
    // Obtenemos todos los clubes inscritos en la liga actual
    const todosLosEquiposDeLaLiga = LIGAS_DATA[ligaActual] || [];

    // Creamos un Set con los IDs de los equipos que tienen partidos programados en esta fecha
    const idsEquiposActivos = new Set();
    partidosFiltrados.forEach(p => {
        idsEquiposActivos.add(String(p.local_id));
        idsEquiposActivos.add(String(p.visitante_id));
    });

    // Buscamos el equipo que pertenece a esta liga pero NO está en el conjunto de activos
    const equipoLibre = todosLosEquiposDeLaLiga.find(e => !idsEquiposActivos.has(String(e.id)));

    // Si efectivamente encontramos un equipo libre (porque la liga es impar), agregamos el banner
    if (equipoLibre) {
        const datosLibre = EQUIPOS_MAP[String(equipoLibre.id)] || { nombre: equipoLibre.nombre, logo: '' };
        const nombreLibre = datosLibre.nombre || "Club";
        const primeraLetraLibre = nombreLibre.charAt(0).toUpperCase();

        const imgLibreHTML = (datosLibre.logo && datosLibre.logo !== 'assets/logos/generic-pingpong.png' && datosLibre.logo.trim() !== "")
            ? `<img src="${datosLibre.logo}" alt="${nombreLibre}" class="w-full h-full object-contain" onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\'w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px] font-bold uppercase\'>${primeraLetraLibre}</div>';">`
            : `<div class="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px] font-bold uppercase">${primeraLetraLibre}</div>`;

        html += `
            <div class="col-span-full mt-4 bg-amber-50/60 border border-dashed border-amber-300 rounded-xl p-3.5 flex items-center justify-between shadow-3xs">
                <div class="flex items-center gap-3">
                    <div class="w-7 h-7 bg-white rounded-full overflow-hidden border border-amber-200 flex items-center justify-center p-0.5 shadow-2xs">
                        ${imgLibreHTML}
                    </div>
                    <div>
                        <span class="block font-bold text-gray-800 text-xs sm:text-sm tracking-tight">
                            ${nombreLibre}
                        </span>
                        <span class="block text-[10px] text-amber-700 font-semibold mt-0.5">
                            <i class="fas fa-mug-hot mr-1"></i> Queda libre en esta jornada
                        </span>
                    </div>
                </div>
                <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md shadow-3xs">
                    Libre
                </span>
            </div>
        `;
    }

    container.innerHTML = html;
}

/**
 * Dibuja las Tarjetas de Equipos incluyendo sus logos oficiales
 */
function renderEquipos() {
    const container = document.getElementById('equipos-grid-container');
    if (!container) return;

    const ligaActual = APP_STATE.currentLigaEquipos;
    const textoBusqueda = APP_STATE.filtroTextoEquipos.toLowerCase().trim();

    let equipos = LIGAS_DATA[ligaActual] || [];
    if (textoBusqueda !== '') {
        equipos = equipos.filter(e => e.nombre.toLowerCase().includes(textoBusqueda));
    }

    if (equipos.length === 0) {
        container.innerHTML = `
            <div class="w-full bg-white p-8 text-center text-gray-400 border rounded-xl shadow-xs">
                <i class="fas fa-search text-xl mb-2 block text-gray-300"></i> No se encontraron equipos.
            </div>
        `;
        return;
    }

    let html = '';
    equipos.forEach(equipo => {
        const idClub = String(equipo.id);
        const cantJugadores = JUGADORES_DATA.filter(j => String(j.equipo_id) === idClub).length;

        let badgeValidacion = '';
        if (cantJugadores < 2) {
            badgeValidacion = `<span class="text-[10px] text-red-500 font-semibold block mt-0.5"><i class="fas fa-exclamation-triangle"></i> Incompleto (Min. 2)</span>`;
        } else {
            badgeValidacion = `<span class="text-[10px] text-green-600 font-semibold block mt-0.5"><i class="fas fa-check-circle"></i> ${cantJugadores} Jugadores</span>`;
        }

        const esSelected = (typeof APP_STATE !== 'undefined' && String(APP_STATE.equipoSeleccionadoId) === idClub);
        const clasesBordeActivo = esSelected ? 'border-asatemeBlue ring-2 ring-blue-100 bg-blue-50/20' : 'border-gray-200 hover:border-gray-300 hover:shadow-md bg-white';

        const nombreEquipo = equipo.nombre || "Club";
        const primeraLetraEquip = nombreEquipo.charAt(0).toUpperCase();

        const imgEquipoHTML = (equipo.logo && equipo.logo !== 'assets/logos/generic-pingpong.png' && equipo.logo.trim() !== "")
            ? `<img src="${equipo.logo}" alt="${nombreEquipo}" class="w-full h-full object-contain" onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\'w-9 h-9 rounded-lg bg-asatemeBlue text-white flex items-center justify-center font-bold text-sm uppercase\'>${primeraLetraEquip}</div>';">`
            : `<div class="w-9 h-9 rounded-lg bg-asatemeBlue text-white flex items-center justify-center font-bold text-sm uppercase">${primeraLetraEquip}</div>`;

        html += `
            <button onclick="verDetalleEquipo('${idClub}', this)" 
                class="card-equipo-btn text-left border rounded-xl p-4 flex items-center justify-between transition-all cursor-pointer w-full sm:w-[calc(50%-8px)] md:w-[calc(33.33%-11px)] ${clasesBordeActivo}">
                <div class="flex items-center gap-3 truncate">
                    <div class="w-9 h-9 min-w-9 bg-white rounded-lg flex items-center justify-center p-1 border overflow-hidden shadow-2xs">
                        ${imgEquipoHTML}
                    </div>
                    <div class="truncate">
                        <span class="block font-bold text-gray-800 text-sm tracking-tight truncate">${nombreEquipo}</span>
                        ${badgeValidacion}
                    </div>
                </div>
                <i class="fas fa-chevron-right text-gray-300 text-xs pl-2"></i>
            </button>
        `;
    });

    container.innerHTML = html;
}

/**
 * Muestra la lista interna de jugadores de un equipo específico en la grilla inferior
 */
/**
 * Muestra la lista interna de jugadores de un equipo específico con su % de asistencia de juego
 */
/**
 * Muestra la lista interna de jugadores de un equipo específico con su % de asistencia real (series únicas)
 */
function renderJugadoresDelEquipo(equipoId) {
    const seccionDetalle = document.getElementById('seccion-detalle-jugadores');
    const grillaJugadores = document.getElementById('jugadores-grid-container');

    if (!seccionDetalle || !grillaJugadores) return;

    // Hacemos visible el contenedor de la Lista de Buena Fe
    seccionDetalle.classList.remove('hidden');

    const jugadoresFiltrados = JUGADORES_DATA.filter(j => String(j.equipo_id) === String(equipoId));

    if (jugadoresFiltrados.length === 0) {
        grillaJugadores.innerHTML = `
            <div class="col-span-full bg-gray-50 p-6 text-center text-gray-400 border border-dashed rounded-xl py-8">
                <i class="fas fa-users-slash text-xl mb-1 block text-gray-300"></i> No hay jugadores registrados en la lista de buena fe de este club.
            </div>
        `;
        return;
    }

    // 1. Obtener el total de fechas disponibles dinámicamente
    const totalFechasDisponibles = FIXTURE_DATA.length > 0
        ? Math.max(...FIXTURE_DATA.map(p => Number(p.fecha_numero || 1)))
        : 10;

    let html = '';

    jugadoresFiltrados.forEach(jugador => {
        const idJugador = Number(jugador.id);
        const nombreJugador = jugador.nombre || "Jugador";
        const primeraLetra = nombreJugador.charAt(0).toUpperCase();
        const badgeCategoria = jugador.categoria
            ? `<span class="text-[10px] bg-asatemeBlue/10 text-asatemeBlue font-bold px-2 py-0.5 rounded-sm uppercase tracking-wide">${jugador.categoria}</span>`
            : '';

        // 2. FILTRADO INTELIGENTE: Buscamos todas las planillas donde participó
        const planillasDondeParticipo = TODOS_DETALLES_JUEGOS.filter(partido => {
            return Number(partido.local_jugador1_id) === idJugador ||
                Number(partido.local_jugador2_id) === idJugador ||
                Number(partido.visitante_jugador1_id) === idJugador ||
                Number(partido.visitante_jugador2_id) === idJugador;
        });

        // 3. Extraemos únicamente los 'partido_id' (series) únicos para evitar duplicar si jugó singles y dobles en la misma fecha
        const seriesUnicasJugadas = [...new Set(planillasDondeParticipo.map(p => p.partido_id))].length;

        // 4. Calculamos porcentaje real en base a las fechas totales del torneo
        const porcentajeParticipacion = totalFechasDisponibles > 0
            ? Math.round((seriesUnicasJugadas / totalFechasDisponibles) * 100)
            : 0;

        let colorPorcentaje = 'text-gray-500 bg-gray-100';
        if (porcentajeParticipacion >= 75) {
            colorPorcentaje = 'text-green-700 bg-green-100';
        } else if (porcentajeParticipacion >= 35) {
            colorPorcentaje = 'text-amber-700 bg-amber-100';
        }

        // Agregamos cursor-pointer y onclick para abrir su historial detallado al hacer click
        html += `
            <div onclick="verHistorialJugador(${idJugador})" 
                class="bg-white border border-gray-150 rounded-xl p-3 flex items-center justify-between shadow-3xs hover:shadow-md hover:border-asatemeBlue transition cursor-pointer">
                <div class="flex items-center gap-3 truncate">
                    <div class="w-8 h-8 min-w-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 flex items-center justify-center font-bold text-xs border border-gray-200 uppercase">
                        ${primeraLetra}
                    </div>
                    <div class="truncate">
                        <div class="flex items-center gap-1.5">
                            <span class="font-semibold text-gray-800 text-xs tracking-tight truncate">${nombreJugador}</span>
                        </div>
                        <span class="block text-[10px] text-gray-400 mt-0.5">Fechas: ${seriesUnicasJugadas} / ${totalFechasDisponibles}</span>
                    </div>
                </div>
                <div class="flex items-center gap-2 pl-2 shrink-0">
                    <span class="text-[10px] font-extrabold px-2 py-1 rounded-md ${colorPorcentaje}" title="Porcentaje de presentismo sobre fechas totales">
                        ${porcentajeParticipacion}% Pres.
                    </span>
                    ${badgeCategoria}
                </div>
            </div>
        `;
    });

    grillaJugadores.innerHTML = html;
}

// =============================================================================
// 5. MÓDULO DESPLEGABLE BAJO DEMANDA (Planillas y Helpers)
// =============================================================================
async function toggleDetallePartido(partidoId) {
    const contenedor = document.getElementById(`contenedor-detalle-${partidoId}`);
    const icono = document.getElementById(`icono-detalle-${partidoId}`);
    const contenedorPlanilla = document.getElementById(`planilla-rows-${partidoId}`);

    if (!contenedor || !contenedorPlanilla) return;

    const esOculto = contenedor.classList.contains('hidden');

    if (esOculto) {
        contenedor.classList.remove('hidden');
        if (icono) icono.classList.add('rotate-180');

        let detalles = FIXTURE_DETALLES_CACHE[partidoId];

        if (!detalles) {
            try {
                contenedorPlanilla.innerHTML = `
                    <div class="text-center py-2 text-xs text-gray-400 flex items-center justify-center gap-2">
                        <i class="fas fa-spinner animate-spin text-asatemeBlue"></i> Cargando partidos de la planilla...
                    </div>
                `;

                const { data, error } = await supabase
                    .from('fixture_detalles')
                    .select('*')
                    .eq('partido_id', Number(partidoId))
                    .order('orden', { ascending: true });

                if (error) throw error;

                detalles = data || [];
                FIXTURE_DETALLES_CACHE[partidoId] = detalles;

            } catch (err) {
                console.error("❌ Error al traer detalles de la planilla:", err.message);
                contenedorPlanilla.innerHTML = `
                    <div class="text-center py-2 text-xs text-red-500 font-semibold">
                        <i class="fas fa-exclamation-triangle mr-1"></i> No se pudo cargar la planilla.
                    </div>
                `;
                return;
            }
        }

        if (detalles.length === 0) {
            contenedorPlanilla.innerHTML = `
                <p class="text-xs text-gray-400 italic py-2 text-center bg-white border border-dashed rounded-lg">
                    Partido ganado por W.O.
                </p>
            `;
            return;
        }

        let htmlPlanilla = '';
        detalles.forEach(d => {
            const nomLocal1 = obtenerNombreJugador(d.local_jugador1_id);
            const nomLocal2 = d.local_jugador2_id ? ` / ${obtenerNombreJugador(d.local_jugador2_id)}` : '';
            const parejaLocal = `${nomLocal1}${nomLocal2}`;

            const nomVis1 = obtenerNombreJugador(d.visitante_jugador1_id);
            const nomVis2 = d.visitante_jugador2_id ? ` / ${obtenerNombreJugador(d.visitante_jugador2_id)}` : '';
            const parejaVisitante = `${nomVis1}${nomVis2}`;

            const arrSetsLocal = d.sets_local || [];
            const arrSetsVisitante = d.sets_visitante || [];
            const ganoLocal = Number(d.score_sets_local || 0) > Number(d.score_sets_visitante || 0);

            let setsHTML = '';
            arrSetsLocal.forEach((puntosL, idx) => {
                const puntosV = arrSetsVisitante[idx] ?? 0;
                setsHTML += `
                    <div class="text-center min-w-[24px] bg-gray-50 rounded px-1 py-0.5 border border-gray-100">
                        <div class="text-[8px] text-gray-400 font-bold">S${idx + 1}</div>
                        <div class="text-[11px] ${Number(puntosL) > Number(puntosV) ? 'font-black text-gray-950' : 'text-gray-400 font-medium'}">${puntosL}</div>
                        <div class="text-[11px] ${Number(puntosV) > Number(puntosL) ? 'font-black text-gray-950' : 'text-gray-400 font-medium'}">${puntosV}</div>
                    </div>
                `;
            });

            htmlPlanilla += `
                <div class="bg-white p-2.5 rounded-lg border border-gray-150 shadow-3xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div class="text-xs min-w-0 flex-1">
                        <div class="font-bold text-gray-400 text-[9px] uppercase tracking-wider mb-0.5">${d.modalidad || 'Partido'}</div>
                        <div class="truncate ${ganoLocal ? 'font-bold text-gray-900' : 'text-gray-500'}">
                            <span class="inline-block w-1.5 h-1.5 rounded-full ${ganoLocal ? 'bg-green-500' : 'bg-transparent'} mr-1.5"></span>
                            ${parejaLocal}
                        </div>
                        <div class="truncate ${!ganoLocal ? 'font-bold text-gray-900' : 'text-gray-500'} mt-0.5">
                            <span class="inline-block w-1.5 h-1.5 rounded-full ${!ganoLocal ? 'bg-green-500' : 'bg-transparent'} mr-1.5"></span>
                            ${parejaVisitante}
                        </div>
                    </div>
                    <div class="flex items-center gap-2 justify-end shrink-0">
                        <div class="flex gap-1">${setsHTML || '<span class="text-[10px] text-gray-400 italic">Sin sets</span>'}</div>
                        <div class="ml-1 px-2 py-1.5 bg-asatemeBlue/5 text-asatemeBlue rounded font-black text-xs min-w-[38px] text-center border border-asatemeBlue/10">
                            ${d.score_sets_local ?? 0} - ${d.score_sets_visitante ?? 0}
                        </div>
                    </div>
                </div>
            `;
        });

        contenedorPlanilla.innerHTML = htmlPlanilla;
    } else {
        contenedor.classList.add('hidden');
        if (icono) icono.classList.remove('rotate-180');
    }
}

function obtenerNombreJugador(jugadorId) {
    if (!jugadorId) return 'W.O. / Sin asignar';
    const jugador = JUGADORES_DATA.find(j => Number(j.id) === Number(jugadorId));
    return jugador ? jugador.nombre : `Jugador (${jugadorId})`;
}

// Exportación explícita al objeto window para evitar problemas de scope en el onclick del HTML
window.toggleDetallePartido = toggleDetallePartido;

// =============================================================================
// 6. INICIALIZADOR DE EVENTOS DOM (Ciclo de vida al cargar la página)
// =============================================================================
document.addEventListener("DOMContentLoaded", () => {
    console.log("🚀 Estructura básica de UI lista.");

    const inputBusqueda = document.getElementById('input-busqueda-equipos');
    if (inputBusqueda) {
        inputBusqueda.addEventListener('input', (e) => {
            APP_STATE.filtroTextoEquipos = e.target.value;
            if (APP_STATE.currentTab === 'equipos') {
                renderEquipos();
            }
        });
    }

    /**
     * Abre un modal interactivo con todo el historial de partidos jugados por un jugador específico
     */
    function verHistorialJugador(jugadorId) {
        const jugador = JUGADORES_DATA.find(j => Number(j.id) === Number(jugadorId));
        if (!jugador) return;

        // 1. Buscamos el club original en nuestras listas de ligas para saber a cuál pertenece ("LIGA_A" o "LIGA_B")
        const clubOriginal = LIGAS_DATA.LIGA_A.find(e => String(e.id) === String(jugador.equipo_id)) ||
            LIGAS_DATA.LIGA_B.find(e => String(e.id) === String(jugador.equipo_id));

        const club = EQUIPOS_MAP[String(jugador.equipo_id)] || { nombre: 'Club Desconocido' };

        // Formateamos el texto de la liga para que se vea prolijo (ej: "Liga A" o "Liga B")
        const nombreLiga = clubOriginal
            ? (clubOriginal.liga === 'LIGA_A' ? 'Liga A' : 'Liga B')
            : 'Liga Sin Especificar';

        // Buscamos todos sus partidos individuales en la tabla de detalles
        const partidosIndividuales = TODOS_DETALLES_JUEGOS.filter(partido => {
            return Number(partido.local_jugador1_id) === jugadorId ||
                Number(partido.local_jugador2_id) === jugadorId ||
                Number(partido.visitante_jugador1_id) === jugadorId ||
                Number(partido.visitante_jugador2_id) === jugadorId;
        });

        let htmlPartidos = '';

        if (partidosIndividuales.length === 0) {
            htmlPartidos = `
            <div class="text-center py-8 text-gray-400 text-xs border border-dashed rounded-xl">
                <i class="fas fa-history text-lg mb-2 block text-gray-300"></i> Este jugador aún no ha disputado partidos oficiales registrados en el sistema.
            </div>
        `;
        } else {
            partidosIndividuales.forEach(p => {
                // Buscamos el partido padre para saber la Fecha Nro
                const seriePadre = FIXTURE_DATA.find(f => Number(f.id) === Number(p.partido_id));
                const nroFecha = seriePadre ? `Fecha ${seriePadre.fecha_numero}` : 'Serie Especial';

                // Identificar si jugó como Local o Visitante en este partido individual
                const esLocal = (Number(p.local_jugador1_id) === jugadorId || Number(p.local_jugador2_id) === jugadorId);

                // Determinar compañeros y rivales
                let parejaAliada = '';
                let parejaRival = '';
                let clubRivalNombre = 'Club Rival';

                if (esLocal) {
                    const compañero = p.local_jugador2_id ? ` / ${obtenerNombreJugador(p.local_jugador2_id)}` : '';
                    parejaAliada = `${jugador.nombre}${compañero}`;

                    const rival1 = obtenerNombreJugador(p.visitante_jugador1_id);
                    const rival2 = p.visitante_jugador2_id ? ` / ${obtenerNombreJugador(p.visitante_jugador2_id)}` : '';
                    parejaRival = `${rival1}${rival2}`;

                    // El rival es el visitante de la serie
                    if (seriePadre) {
                        const datosRivalClub = EQUIPOS_MAP[String(seriePadre.visitante_id)];
                        if (datosRivalClub) clubRivalNombre = datosRivalClub.nombre;
                    }
                } else {
                    const compañero = p.visitante_jugador2_id ? ` / ${obtenerNombreJugador(p.visitante_jugador2_id)}` : '';
                    parejaAliada = `${jugador.nombre}${compañero}`;

                    const rival1 = obtenerNombreJugador(p.local_jugador1_id);
                    const rival2 = p.local_jugador2_id ? ` / ${obtenerNombreJugador(p.local_jugador2_id)}` : '';
                    parejaRival = `${rival1}${rival2}`;

                    // El rival es el local de la serie
                    if (seriePadre) {
                        const datosRivalClub = EQUIPOS_MAP[String(seriePadre.local_id)];
                        if (datosRivalClub) clubRivalNombre = datosRivalClub.nombre;
                    }
                }

                // Marcadores de sets
                const setsFavor = esLocal ? Number(p.score_sets_local || 0) : Number(p.score_sets_visitante || 0);
                const setsContra = esLocal ? Number(p.score_sets_visitante || 0) : Number(p.score_sets_local || 0);
                const ganoPartido = setsFavor > setsContra;

                // Badge de resultado
                const badgeResultado = ganoPartido
                    ? `<span class="bg-green-100 text-green-700 font-extrabold text-[10px] px-2 py-1 rounded">GANÓ</span>`
                    : `<span class="bg-red-50 text-red-600 font-extrabold text-[10px] px-2 py-1 rounded">PERDIÓ</span>`;

                // Detalle de sets individuales
                const setsLocal = p.sets_local || [];
                const setsVisitante = p.sets_visitante || [];
                let detalleSetsList = [];
                setsLocal.forEach((ptL, idx) => {
                    const ptV = setsVisitante[idx] ?? 0;
                    const setFavor = esLocal ? ptL : ptV;
                    const setContra = esLocal ? ptV : ptL;
                    detalleSetsList.push(`${setFavor}-${setContra}`);
                });

                htmlPartidos += `
                <div class="border border-gray-100 rounded-xl p-3 bg-gray-50/50 hover:bg-gray-50 transition">
                    <div class="flex justify-between items-center mb-1.5">
                        <span class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">${nroFecha} — ${p.modalidad || 'Partido'}</span>
                        ${badgeResultado}
                    </div>
                    <div class="text-xs text-gray-800 space-y-1">
                        <div>
                            <span class="text-gray-400 font-medium">Pareja:</span> 
                            <span class="font-semibold">${parejaAliada}</span>
                        </div>
                        <div>
                            <span class="text-gray-400 font-medium">Vs:</span> 
                            <span class="font-semibold text-asatemeBlue">${parejaRival}</span> 
                            <span class="text-[10px] text-gray-400">(${clubRivalNombre})</span>
                        </div>
                    </div>
                    <div class="mt-2.5 pt-2 border-t border-gray-100/60 flex justify-between items-center">
                        <span class="text-[10px] text-gray-400 font-medium">Parciales: <span class="font-mono text-gray-600 font-bold">${detalleSetsList.join(', ')}</span></span>
                        <span class="text-xs font-black text-gray-800 bg-white border px-2 py-0.5 rounded shadow-3xs">${setsFavor} - ${setsContra}</span>
                    </div>
                </div>
            `;
            });
        }

        // Estructura HTML del Modal Flotante de Tailwind
        const modalHTML = `
        <div id="modal-historial-jugador" class="fixed inset-0 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <div class="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[85vh] transform transition-all scale-100">
                <!-- Cabecera -->
                <div class="p-4 border-b border-gray-100 flex justify-between items-start">
                    <div>
                        <h3 class="text-sm font-bold text-gray-900 tracking-tight">${jugador.nombre}</h3>
                        <span class="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                            <i class="fas fa-shield-alt text-gray-300"></i> ${club.nombre} — ${nombreLiga}
                        </span>
                    </div>
                    <button onclick="cerrarModalHistorial()" class="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition focus:outline-none">
                        <i class="fas fa-times text-sm"></i>
                    </button>
                </div>
                <div class="p-4 overflow-y-auto space-y-3 flex-1 scrollbar-thin">
                    <div class="text-[10px] font-bold text-gray-400 uppercase tracking-wider"><i class="fas fa-history mr-1"></i> Historial de enfrentamientos</div>
                    ${htmlPartidos}
                </div>
                <div class="p-3 bg-gray-50 border-t border-gray-100 rounded-b-2xl text-center">
                    <button onclick="cerrarModalHistorial()" class="bg-asatemeBlue hover:bg-blue-800 text-white font-bold text-xs px-5 py-2 rounded-lg shadow-sm transition">
                        Entendido
                    </button>
                </div>
            </div>
        </div>
    `;

        // Lo inyectamos al final del body
        const div = document.createElement('div');
        div.id = 'container-modal-historial';
        div.innerHTML = modalHTML;
        document.body.appendChild(div);
    }

    /**
     * Cierra y remueve el modal del historial del DOM
     */
    function cerrarModalHistorial() {
        const modal = document.getElementById('container-modal-historial');
        if (modal) {
            modal.remove();
        }
    }

    // Hacemos accesibles las funciones desde el objeto Window para que respondan al onclick del HTML inyectado
    window.verHistorialJugador = verHistorialJugador;
    window.cerrarModalHistorial = cerrarModalHistorial;

    // DISPARO INICIAL: Conectar y descargar información limpia de la BD
    cargarDatosDesdeSupabase();
});
