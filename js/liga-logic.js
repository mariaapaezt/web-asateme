// ==========================================
// 1. CONEXIÓN Y ESTADO CENTRAL DE SUPABASE
// ==========================================

// CONFIGURACIÓN DE SUPABASE (Corregida la URL sin subrutas)
const SUPABASE_URL = "https://gniieyrbxpodzzuaxbvr.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduaWlleXJieHBvZHp6dWF4YnZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwOTE2MjUsImV4cCI6MjA5NjY2NzYyNX0.L1mmw4aGZPkmES63pyMc6gWKPnvKEUbq63nJXvMlzxE";

// Inicializamos el cliente de Supabase
// Cambiá el nombre de la variable para que no choque con la librería global
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Variables globales que se llenan desde la nube
let LIGAS_DATA = {};
let FIXTURE_DATA = [];
let JUGADORES_DATA = [];

async function cargarDatosDesdeSupabase() {
    try {
        // 1. Traer los equipos
        const { data: equipos, error: errEquipos } = await supabaseClient.from('equipos').select('*');
        // 2. Traer el fixture
        const { data: fixture, error: errFixture } = await supabaseClient.from('fixture').select('*');
        // 3. Traer los jugadores
        const { data: jugadores, error: errJugadores } = await supabaseClient.from('jugadores').select('*');

        if (errEquipos || errFixture || errJugadores) {
            console.error("Error al descargar datos de Supabase:", errEquipos || errFixture || errJugadores);
            return;
        }

        // Guardamos fixture y jugadores en memoria
        FIXTURE_DATA = fixture;
        JUGADORES_DATA = jugadores;

        // Agrupamos los equipos por liga (A, B, etc.) para mantener la compatibilidad del render
        LIGAS_DATA = {};
        equipos.forEach(equipo => {
            if (!LIGAS_DATA[equipo.liga]) {
                LIGAS_DATA[equipo.liga] = [];
            }
            LIGAS_DATA[equipo.liga].push(equipo);
        });

        // Ahora que tenemos todo, dibujamos la interfaz por primera vez
        renderApp();

    } catch (error) {
        console.error("Error crítico en la conexión:", error);
    }
}

// Único iniciador de la App al cargar el documento
document.addEventListener("DOMContentLoaded", () => {
    // 1. Arrancamos la descarga desde la nube
    cargarDatosDesdeSupabase();

    // 2. Dejamos el buscador escuchando en tiempo real
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

        // Buscamos los jugadores correspondientes usando la estructura plana de Supabase
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

// FUNCIÓN AGREGADA: Centralizador de la interfaz de usuario
// ==========================================
// 3. RENDERIZADORES REUTILIZABLES (VISTAS)
// ==========================================

// FUNCIÓN MODIFICADA: Asegura que todas las pestañas tengan datos listos de entrada
function renderApp() {
    // 1. Dibujamos todas las vistas en segundo plano para que ya tengan contenido incorporado
    renderPosiciones();
    renderFixture();
    renderEquipos();
}

function renderPosiciones() {
    const ligaActual = APP_STATE.currentLigaPosiciones;

    const tituloLayout = document.getElementById('titulo-liga-actual');
    if (tituloLayout) {
        tituloLayout.innerText = ligaActual === 'LIGA_A' ? 'Liga A ' : 'Liga B ';
    }

    let equipos = [...(LIGAS_DATA[ligaActual] || [])];

    equipos.sort((a, b) => {
        if (b.pts !== a.pts) {
            return b.pts - a.pts;
        }
        return b.sf - a.sf;
    });

    const tbody = document.getElementById('tabla-posiciones-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (equipos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="py-8 text-center text-gray-400 italic">
                    No hay equipos registrados en esta liga actualmente.
                </td>
            </tr>
        `;
        return;
    }

    equipos.forEach((equipo, index) => {
        const posicion = index + 1;
        let posBadge = `<span class="font-bold text-gray-500">${posicion}</span>`;
        if (posicion === 1) posBadge = `<span class="w-6 h-6 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-xs mx-auto">1</span>`;
        if (posicion === 2) posBadge = `<span class="w-6 h-6 rounded-full bg-slate-100 text-slate-800 font-bold flex items-center justify-center text-xs mx-auto">2</span>`;

        const filaHtml = `
            <tr class="hover:bg-gray-50/70 transition-colors">
                <td class="py-4 px-4 text-center">${posBadge}</td>
                <td class="py-4 px-4 font-medium text-gray-900">${equipo.nombre}</td>
                <td class="py-4 px-4 text-center">${equipo.pj}</td>
                <td class="py-4 px-4 text-center font-medium text-green-600">${equipo.pg}</td>
                <td class="py-4 px-4 text-center font-medium text-red-600">${equipo.pp}</td>
                <td class="py-4 px-4 text-center text-gray-400 hidden sm:table-cell">${equipo.sf}</td>
                <td class="py-4 px-4 text-center font-bold text-asatemeBlue bg-gray-50/50">${equipo.pts}</td>
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

    // Mapeo adaptado a las columnas snake_case de Supabase
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

        const local = todosLosEquipos.find(e => e.id === partido.local_id) || { nombre: partido.local_id };
        const visitante = todosLosEquipos.find(e => e.id === partido.visitante_id) || { nombre: partido.visitante_id };

        const esFinalizado = partido.estado === "Finalizado";
        const badgeClass = esFinalizado
            ? "bg-green-100 text-green-800 border border-green-200"
            : "bg-blue-100 text-blue-800 border border-blue-200";

        const scoreLocalTxt = partido.score_local !== null ? partido.score_local : "-";
        const scoreVisitanteTxt = partido.score_visitante !== null ? partido.score_visitante : "-";

        const tarjetaHtml = `
            <div class="bg-white rounded-xl border border-gray-200 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-all duration-200">
                <div class="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
                    <div class="space-y-0.5">
                        <p class="text-xs font-bold text-gray-500">${partido.fecha_txt}</p>
                    </div>
                    <span class="text-[11px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${badgeClass}">
                        ${partido.estado}
                    </span>
                </div>
                <div class="space-y-3 my-2">
                    <div class="flex justify-between items-center">
                        <span class="font-semibold text-gray-900 text-sm truncate pr-4">${local.nombre}</span>
                        <span class="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center font-black text-sm text-gray-800 ${esFinalizado && partido.score_local > partido.score_visitante ? 'bg-amber-50 border-amber-200 text-amber-900' : ''}">
                            ${scoreLocalTxt}
                        </span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="font-semibold text-gray-900 text-sm truncate pr-4">${visitante.nombre}</span>
                        <span class="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center font-black text-sm text-gray-800 ${esFinalizado && partido.score_visitante > partido.score_local ? 'bg-amber-50 border-amber-200 text-amber-900' : ''}">
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

    const ligaActual = APP_STATE.currentLigaEquipos;
    const equiposDeLiga = LIGAS_DATA[ligaActual] || [];
    const query = APP_STATE.filtroTextoEquipos.toLowerCase().trim();

    const equiposFiltrados = equiposDeLiga.filter(e => e.nombre.toLowerCase().includes(query));

    if (equiposFiltrados.length === 0) {
        container.innerHTML = `
            <div class="w-full bg-white rounded-xl p-6 text-center border border-dashed border-gray-200">
                <p class="text-sm text-gray-500 font-medium">No se encontraron equipos que coincidan.</p>
            </div>
        `;
        return;
    }

    equiposFiltrados.forEach(equipo => {
        const esSeleccionado = APP_STATE.equipoSeleccionadoId === equipo.id;
        const borderCls = esSeleccionado ? 'border-asatemeBlue ring-2 ring-blue-100' : 'border-gray-200';

        // =========================================================================
        // FILTRO DE IMAGEN: Si no tiene logo asignado en Supabase, usa uno por defecto.
        // Podés cambiar la URL de placeholder por una imagen local tuya si querés.
        // =========================================================================
        const rutaLogo = equipo.logo && equipo.logo.trim() !== ''
            ? equipo.logo
            : 'https://placehold.co/40x40/f1f5f9/003366?text=Club';

        const tarjetaHtml = `
            <div data-id="${equipo.id}" onclick="verJugadoresEquipo('${equipo.id}')" 
                class="card-equipo-btn bg-white border ${borderCls} rounded-xl p-4 flex items-center gap-3 shadow-xs min-w-[260px] flex-1 cursor-pointer hover:border-asatemeBlue/40 hover:shadow-xs transition-all duration-200">
                <div class="w-10 h-10 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center shrink-0 border border-gray-100">
                    <img src="${rutaLogo}" alt="Logo ${equipo.nombre}" class="w-full h-full object-cover" onerror="this.src='https://placehold.co/40x40/f1f5f9/d32f2f?text=Err'">
                </div>
                <div class="truncate">
                    <p class="font-bold text-gray-800 text-sm leading-tight truncate">${equipo.nombre}</p>
                    <p class="text-xs font-semibold text-gray-400 mt-0.5 truncate">Delegado: ${equipo.delegado}</p>
                </div>
            </div>
        `;
        container.innerHTML += tarjetaHtml;
    });

    if (APP_STATE.equipoSeleccionadoId) {
        verJugadoresEquipo(APP_STATE.equipoSeleccionadoId);
    }
}