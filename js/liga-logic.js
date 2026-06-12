// =============================================================================
// 1. VARIABLES GLOBALES (ESTADO EN MEMORIA)
// =============================================================================
let LIGAS_DATA = { LIGA_A: [], LIGA_B: [] }; // Equipos agrupados por clave de liga
let FIXTURE_DATA = [];                      // Lista pura de partidos (esquema real)
let JUGADORES_DATA = [];                    // Lista pura de jugadores (esquema real)

// Diccionario auxiliar plano para cruzar IDs de equipos con sus nombres rápidamente
let EQUIPOS_MAP = {};

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
 * Controla la selección de un equipo específico para desplegar su plantilla
 * Nota: El ID del equipo en tu BD viene en formato TEXT
 */
function verDetalleEquipo(equipoId, btnElement) {
    APP_STATE.equipoSeleccionadoId = String(equipoId);

    // Resaltar visualmente la tarjeta del equipo seleccionado
    document.querySelectorAll('.card-equipo-btn').forEach(card => {
        card.classList.remove('border-asatemeBlue', 'ring-2', 'ring-blue-100');
    });
    if (btnElement) {
        btnElement.classList.add('border-asatemeBlue', 'ring-2', 'ring-blue-100');
    }

    // Buscar los datos en memoria para rellenar la cabecera
    const ligaActual = APP_STATE.currentLigaEquipos;
    const club = LIGAS_DATA[ligaActual].find(e => String(e.id) === String(equipoId));

    const nombreHeader = document.getElementById('nombre-equipo-seleccionado');
    if (nombreHeader && club) {
        nombreHeader.textContent = club.nombre;
    }

    // Renderizar la grilla interna de jugadores correspondientes
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
        card.classList.remove('border-asatemeBlue', 'ring-2', 'ring-blue-100');
    });
}

// =============================================================================
// 3. CONSULTAS ASÍNCRONAS A SUPABASE (Alineadas estrictamente al esquema relacional)
// =============================================================================

async function cargarDatosDesdeSupabase() {
    try {
        console.log("⏳ Conectando con Supabase y descargando datos...");

        if (typeof supabase === 'undefined') {
            throw new Error("La instancia 'supabase' no está definida. Revisá js/supabase-config.js");
        }

        const [resEquipos, resFixture, resJugadores] = await Promise.all([
            supabase.from('equipos').select('*'),
            supabase.from('fixture').select('*'),
            supabase.from('jugadores').select('*')
        ]);

        if (resEquipos.error) throw resEquipos.error;
        if (resFixture.error) throw resFixture.error;
        if (resJugadores.error) throw resJugadores.error;

        FIXTURE_DATA = resFixture.data || [];
        JUGADORES_DATA = resJugadores.data || [];

        let listaEquipos = resEquipos.data || [];

        EQUIPOS_MAP = {};
        listaEquipos.forEach(e => {
            EQUIPOS_MAP[String(e.id)] = {
                nombre: e.nombre,
                logo: e.logo || 'assets/logos/generic-pingpong.png'
            };

            // Inicializamos las estadísticas en 0 para calcularlas dinámicamente...
            e.sj = 0;
            e.sg = 0;
            e.sp = 0;
            e.pg = 0;
            e.pp = 0;
            e.pts = 0;
        });
        // 🧠 PROCESAMIENTO LOGIC: Recorremos los partidos finalizados para calcular la tabla real
        FIXTURE_DATA.forEach(partido => {
            if (partido.estado && partido.estado.toLowerCase() === 'finalizado') {
                const locId = String(partido.local_id);
                const visId = String(partido.visitante_id);

                const eqLocal = listaEquipos.find(e => String(e.id) === locId);
                const eqVisitante = listaEquipos.find(e => String(e.id) === visId);

                if (eqLocal && eqVisitante) {

                    // 1. Sumar serie jugada/computada a ambos para el historial
                    eqLocal.sj += 1;
                    eqVisitante.sj += 1;

                    // 🛠️ DETECTOR ULTRA ESTRICTO DE WALKOVER (WO)
                    // Forzamos a leer de manera limpia la columna walkover de Supabase
                    const quienFalto = partido.walkover ? String(partido.walkover).toUpperCase().trim() : null;

                    if (quienFalto === 'LOCAL') {
                        // El local NO se presentó (WO)
                        eqLocal.sp += 1;
                        eqLocal.pts += 0;     // 👈 Penalizado con CERO puntos

                        eqVisitante.sg += 1;
                        eqVisitante.pts += 3;  // 👈 GANADOR ASEGURA SUS 3 PUNTOS
                    }
                    else if (quienFalto === 'VISITANTE') {
                        // El visitante NO se presentó (WO)
                        eqVisitante.sp += 1;
                        eqVisitante.pts += 0;  // 👈 Penalizado con CERO puntos

                        eqLocal.sg += 1;
                        eqLocal.pts += 3;      // 👈 GANADOR ASEGURA SUS 3 PUNTOS
                    }
                    else {
                        // --- LÓGICA REGLAMENTARIA NORMAL (Si se jugó en la mesa) ---
                        const scoreLoc = Number(partido.score_local || 0);
                        const scoreVis = Number(partido.score_visitante || 0);

                        // Sumar sets/partidos individuales solo si se jugó
                        eqLocal.pg += scoreLoc;
                        eqLocal.pp += scoreVis;
                        eqVisitante.pg += scoreVis;
                        eqVisitante.pp += scoreLoc;

                        if (scoreLoc > scoreVis) {
                            eqLocal.sg += 1;
                            eqLocal.pts += 3; // Ganador de la serie

                            eqVisitante.sp += 1;
                            eqVisitante.pts += 1; // Perdedor por jugar suma 1
                        } else if (scoreVis > scoreLoc) {
                            eqVisitante.sg += 1;
                            eqVisitante.pts += 3; // Ganador de la serie

                            eqLocal.sp += 1;
                            eqLocal.pts += 1; // Perdedor por jugar suma 1
                        } else {
                            // Empate reglamentario
                            eqLocal.pts += 2;
                            eqVisitante.pts += 2;
                        }
                    }
                }
            }
        });

        // Agrupar y ordenar equipos por puntos calculados de forma descendente
        LIGAS_DATA = {
            LIGA_A: listaEquipos.filter(e => e.liga === 'LIGA_A').sort((a, b) => b.pts - a.pts),
            LIGA_B: listaEquipos.filter(e => e.liga === 'LIGA_B').sort((a, b) => b.pts - a.pts)
        };

        console.log("✅ Datos calculados dinámicamente con éxito en tiempo real.");

        // 🚀 NUEVA LÍNEA: Calculamos el total sumando ambas listas y actualizamos el HTML
        const totalEquiposInscritos = LIGAS_DATA.LIGA_A.length + LIGAS_DATA.LIGA_B.length;
        const elContador = document.getElementById('contador-equipos-total');
        if (elContador) {
            elContador.textContent = `${totalEquiposInscritos} Clubes`;
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
    // Si APP_STATE no está definido o no tiene pestaña, por defecto vamos a posiciones
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
 * Dibuja la Tabla de Posiciones usando las columnas estrictas del esquema
 */
/**
 * Dibuja la Tabla de Posiciones alineada con las columnas del HTML
 */
/**
 * Dibuja la Tabla de Posiciones alineada con las columnas del HTML e incluyendo logos
 */
/**
 * Dibuja la Tabla de Posiciones usando el mapa unificado (nombre + logo)
 */
function renderPosiciones() {
    const tablaBody = document.getElementById('tabla-posiciones-body');
    const tituloLiga = document.getElementById('titulo-liga-actual');

    if (!tablaBody) return;

    const ligaActual = (typeof APP_STATE !== 'undefined' && APP_STATE.currentLigaPosiciones) || 'LIGA_A';
    if (tituloLiga) tituloLiga.textContent = ligaActual === 'LIGA_A' ? 'Liga A' : 'Liga B';

    const equiposFiltrados = LIGAS_DATA[ligaActual] || [];

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

        // Obtenemos los datos desde nuestro mapa unificado
        const datosEquipo = EQUIPOS_MAP[String(equipo.id)] || { nombre: equipo.nombre, logo: '' };

        const pos = index + 1;
        const nombreFinal = datosEquipo.nombre || "Club";
        const primeraLetra = nombreFinal.charAt(0).toUpperCase();

        // 🛡️ ESCUDO ANTI-PARPADEO: Si no hay logo o está vacío, genera el círculo con la inicial
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
    if (APP_STATE.currentTab === 'posiciones') {
        renderPosiciones();
    } else if (APP_STATE.currentTab === 'fixture') {
        renderFixture();
    } else if (APP_STATE.currentTab === 'equipos') {
        renderEquipos();
    }
}


/**
 * Dibuja la Sección del Fixture cruzando los IDs relacionales locales y visitantes
 */
/**
 * Dibuja la Sección del Fixture cruzando los IDs relacionales e incluyendo los logos de los equipos
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

    const partidosFiltrados = FIXTURE_DATA.filter(p => p.liga === ligaActual && Number(p.fecha_numero) === Number(fechaActual));

    const totalFechas = FIXTURE_DATA.length > 0 ? Math.max(...FIXTURE_DATA.map(p => Number(p.fecha_numero || 1))) : 5;
    if (btnPrev) btnPrev.disabled = (fechaActual === 1);
    if (btnNext) btnNext.disabled = (fechaActual >= totalFechas);

    if (partidosFiltrados.length === 0) {
        container.innerHTML = `
            <div class="col-span-full bg-white p-8 text-center text-gray-400 border rounded-xl shadow-xs">
                <i class="far fa-calendar-times text-2xl mb-2 block text-gray-300"></i>
                No hay encuentros programados para la Fecha ${fechaActual} de esta zona.
            </div>
        `;
        return;
    }

    let html = '';
    partidosFiltrados.forEach(partido => {
        // CRUCE RELACIONAL: Extraemos los datos completos del mapa
        const datosLocal = EQUIPOS_MAP[String(partido.local_id)] || { nombre: `Equipo (${partido.local_id})`, logo: '' };
        const datosVisitante = EQUIPOS_MAP[String(partido.visitante_id)] || { nombre: `Equipo (${partido.visitante_id})`, logo: '' };
        const nombreL = datosLocal.nombre;
        const nombreV = datosVisitante.nombre;
        const letraL = nombreL.charAt(0).toUpperCase();
        const letraV = nombreV.charAt(0).toUpperCase();

        // 🛡️ ESCUDO LOCAL ANTI-PARPADEO
        const imgLocalHTML = (datosLocal.logo && datosLocal.logo !== 'assets/logos/generic-pingpong.png' && datosLocal.logo.trim() !== "")
            ? `<img src="${datosLocal.logo}" alt="${nombreL}" class="w-full h-full object-contain" onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\'w-6 h-6 rounded-full bg-asatemeBlue text-white flex items-center justify-center text-[10px] font-bold uppercase\'>${letraL}</div>';">`
            : `<div class="w-6 h-6 rounded-full bg-asatemeBlue text-white flex items-center justify-center text-[10px] font-bold uppercase">${letraL}</div>`;

        // 🛡️ ESCUDO VISITANTE ANTI-PARPADEO
        const imgVisHTML = (datosVisitante.logo && datosVisitante.logo !== 'assets/logos/generic-pingpong.png' && datosVisitante.logo.trim() !== "")
            ? `<img src="${datosVisitante.logo}" alt="${nombreV}" class="w-full h-full object-contain" onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\'w-6 h-6 rounded-full bg-asatemeBlue text-white flex items-center justify-center text-[10px] font-bold uppercase\'>${letraV}</div>';">`
            : `<div class="w-6 h-6 rounded-full bg-asatemeBlue text-white flex items-center justify-center text-[10px] font-bold uppercase">${letraV}</div>`;

        const esFinalizado = (partido.estado && partido.estado.toLowerCase() === 'finalizado');

        let estadoBadge = `<span class="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wide">${partido.estado || 'Pendiente'}</span>`;

        // Inicializamos las estrellas/trofeos vacíos
        let trofeoLocal = '';
        let trofeoVisitante = '';
        let botonDesplegableHTML = '';
        let contenedorDetalleHTML = '';

        if (esFinalizado) {
            estadoBadge = `<span class="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wide">Finalizado</span>`;

            // Determinamos el ganador de la serie para poner el detalle visual impactante
            const scoreL = Number(partido.score_local || 0);
            const scoreV = Number(partido.score_visitante || 0);
            if (scoreL > scoreV) {
                trofeoLocal = `<i class="fas fa-trophy text-xs text-amber-500 mr-1 animate-pulse" title="Ganador de la serie"></i>`;
            } else if (scoreV > scoreL) {
                trofeoVisitante = `<i class="fas fa-trophy text-xs text-amber-500 ml-1 animate-pulse" title="Ganador de la serie"></i>`;
            }

            // Agregamos el botón prolijo abajo de la tarjeta
            botonDesplegableHTML = `
                <div class="border-t border-gray-100 mt-4 pt-2 flex justify-center">
                    <button onclick="toggleDetallePartido('${partido.id}')" 
                            class="text-[11px] font-bold text-asatemeBlue hover:text-asatemeRed transition flex items-center gap-1 focus:outline-none py-1 px-3 rounded-md hover:bg-gray-50">
                        <i id="icono-detalle-${partido.id}" class="fas fa-chevron-down transition-transform duration-200"></i> 
                        <span>Ver resultados</span>
                    </button>
                </div>
            `;

            // Dejamos el contenedor listo (y oculto con hidden) para inyectar los sets en el siguiente paso
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

    container.innerHTML = html;
}
/**
 * Dibuja los Equipos validando que cuenten con mínimo 2 jugadores vinculados por 'equipo_id'
 */
/**
 * Dibuja las Tarjetas de Equipos incluyendo sus logos oficiales
 */
function renderEquipos() {
    const container = document.getElementById('equipos-grid-container');
    if (!container) return;

    // Leemos el estado global tal como lo hacía tu app originalmente
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

        const esSeleccionado = APP_STATE.equipoSeleccionadoId === idClub;
        const clasesBordeActivo = esSeleccionado ? 'border-asatemeBlue ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300 hover:shadow-md';

        const nombreEquipo = equipo.nombre || "Club";
        const primeraLetraEquip = nombreEquipo.charAt(0).toUpperCase();

        // 🛡️ ESCUDO ANTI-PARPADEO PARA LA GRILLA DE EQUIPOS
        const imgEquipoHTML = (equipo.logo && equipo.logo !== 'assets/logos/generic-pingpong.png' && equipo.logo.trim() !== "")
            ? `<img src="${equipo.logo}" alt="${nombreEquipo}" class="w-full h-full object-contain" onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\'w-9 h-9 rounded-lg bg-asatemeBlue text-white flex items-center justify-center font-bold text-sm uppercase\'>${primeraLetraEquip}</div>';">`
            : `<div class="w-9 h-9 rounded-lg bg-asatemeBlue text-white flex items-center justify-center font-bold text-sm uppercase">${primeraLetraEquip}</div>`;

        html += `
            <button onclick="verDetalleEquipo('${idClub}', this)" 
                class="card-equipo-btn text-left bg-white border rounded-xl p-4 flex items-center justify-between transition-all cursor-pointer w-full sm:w-[calc(50%-8px)] md:w-[calc(33.33%-11px)] ${clasesBordeActivo}">
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
 * Dibuja la nómina de jugadores en el panel inferior desplegable
 */
function renderJugadoresDelEquipo(equipoId) {
    const container = document.getElementById('jugadores-equipo-container');
    const seccionDetalle = document.getElementById('seccion-detalle-jugadores');

    if (!container || !seccionDetalle) return;

    // Filtrar estrictamente sobre la FK 'equipo_id' (String)
    const jugadores = JUGADORES_DATA.filter(j => String(j.equipo_id) === String(equipoId));

    seccionDetalle.classList.remove('hidden');

    if (jugadores.length === 0) {
        container.innerHTML = `<div class="col-span-full py-4 text-center text-sm text-gray-400 font-medium">No hay jugadores registrados oficialmente en este equipo.</div>`;
        return;
    }

    let html = '';
    jugadores.forEach(jugador => {
        html += `
            <div class="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-xs">
                    <i class="fas fa-user text-xs"></i>
                </div>
                <div class="truncate">
                    <p class="text-xs font-bold text-gray-800 truncate leading-snug">${jugador.nombre}</p>
                    <p class="text-[10px] font-semibold text-gray-400 tracking-wide uppercase mt-0.5">Lista Oficial</p>
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
    }); // <-- Acá se cerraba correctamente el bucle de jugadores

    container.innerHTML = html;
}

// =============================================================================
// 5. INICIALIZADOR DE EVENTOS DOM (Ciclo de vida al cargar la página)
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

    // Variable global en tu archivo de estados para cachear los detalles ya descargados
    if (typeof FIXTURE_DETALLES_CACHE === 'undefined') {
        var FIXTURE_DETALLES_CACHE = {};
    }

    /**
     * Alterna la visibilidad del detalle de la serie y descarga los sets bajo demanda si es necesario
     */
    async function toggleDetallePartido(partidoId) {
        const contenedor = document.getElementById(`contenedor-detalle-${partidoId}`);
        const icono = document.getElementById(`icono-detalle-${partidoId}`);
        const contenedorPlanilla = document.getElementById(`planilla-rows-${partidoId}`);

        if (!contenedor || !contenedorPlanilla) return;

        const esOculto = contenedor.classList.contains('hidden');

        if (esOculto) {
            // 1. Abrimos el contenedor visual e invertimos el chevron
            contenedor.classList.remove('hidden');
            if (icono) icono.classList.add('rotate-180');

            // 2. ¿Ya descargamos estos detalles antes? (Uso de Caché)
            let detalles = FIXTURE_DETALLES_CACHE[partidoId];

            if (!detalles) {
                try {
                    contenedorPlanilla.innerHTML = `
                    <div class="text-center py-2 text-xs text-gray-400 flex items-center justify-center gap-2">
                        <i class="fas fa-spinner animate-spin text-asatemeBlue"></i> Cargando partidos de la planilla...
                    </div>
                `;

                    // 3. Consulta asíncrona y quirúrgica a Supabase por la FK 'partido_id'
                    const { data, error } = await supabase
                        .from('fixture_detalles')
                        .select('*')
                        .eq('partido_id', Number(partidoId))
                        .order('orden', { ascending: true });

                    if (error) throw error;

                    detalles = data || [];
                    // Guardamos en memoria para futuras aperturas
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

            // 4. Si no hay registros cargados aún en esa planilla
            if (detalles.length === 0) {
                contenedorPlanilla.innerHTML = `
                <p class="text-xs text-gray-400 italic py-2 text-center bg-white border border-dashed rounded-lg">
                    Partido ganado por W.O.
                </p>
            `;
                return;
            }

            // 5. Construcción dinámica del HTML (Apalancado en tu esquema de base de datos)
            let htmlPlanilla = '';

            detalles.forEach(d => {
                // Resolución de nombres usando tu array global JUGADORES_DATA cargado al inicio
                const nomLocal1 = obtenerNombreJugador(d.local_jugador1_id);
                const nomLocal2 = d.local_jugador2_id ? ` / ${obtenerNombreJugador(d.local_jugador2_id)}` : '';
                const parejaLocal = `${nomLocal1}${nomLocal2}`;

                const nomVis1 = obtenerNombreJugador(d.visitante_jugador1_id);
                const nomVis2 = d.visitante_jugador2_id ? ` / ${obtenerNombreJugador(d.visitante_jugador2_id)}` : '';
                const parejaVisitante = `${nomVis1}${nomVis2}`;

                // Arrays nativos de puntos por set traídos desde PostgreSQL
                const arrSetsLocal = d.sets_local || [];
                const arrSetsVisitante = d.sets_visitante || [];

                const ganoLocal = Number(d.score_sets_local || 0) > Number(d.score_sets_visitante || 0);

                // Mapeamos los sets en paralelo de manera limpia
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
                        <div class="flex gap-1">
                            ${setsHTML || '<span class="text-[10px] text-gray-400 italic">Sin sets</span>'}
                        </div>

                        <div class="ml-1 px-2 py-1.5 bg-asatemeBlue/5 text-asatemeBlue rounded font-black text-xs min-w-[38px] text-center border border-asatemeBlue/10">
                            ${d.score_sets_local ?? 0} - ${d.score_sets_visitante ?? 0}
                        </div>
                    </div>
                </div>
            `;
            });

            contenedorPlanilla.innerHTML = htmlPlanilla;

        } else {
            // Cierre prolijo del panel si se vuelve a presionar el botón
            contenedor.classList.add('hidden');
            if (icono) icono.classList.remove('rotate-180');
        }
    }

    /**
     * Helper para resolver los nombres de los jugadores basándose en el JUGADORES_DATA global
     */
    function obtenerNombreJugador(jugadorId) {
        if (!jugadorId) return 'W.O. / Sin asignar';
        const jugador = JUGADORES_DATA.find(j => Number(j.id) === Number(jugadorId));
        return jugador ? jugador.nombre : `Jugador (${jugadorId})`;
    }

    // Hacemos que la función sea visible para el HTML sin importar el módulo o el scope
    window.toggleDetallePartido = toggleDetallePartido;

    // DISPARO INICIAL: Conectar y descargar información limpia de la BD
    cargarDatosDesdeSupabase();
});
