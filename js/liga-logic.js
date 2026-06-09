// ==========================================
// 1. BASE DE DATOS SIMULADA (ESTADO CENTRAL)
// ==========================================

const LIGAS_DATA = {
    "LIGA_A": [
        {
            id: "prov_a",
            nombre: "Atlético Provincial 'A'",
            delegado: "Alejandro Martínez",
            pj: 2, pg: 2, pp: 0, sf: 14, pts: 4,
            jugadores: [
                { nombre: "Isabella Olivarez", rol: "Singlista 1" },
                { nombre: "Ixchel Guia Monzón", rol: "Singlista 2" },
                { nombre: "Valentino Marcial", rol: "Dobles / Suplente" }
            ]
        },
        {
            id: "nautico",
            nombre: "Club Náutico Avellaneda",
            delegado: "Martín Rossi",
            pj: 2, pg: 1, pp: 1, sf: 10, pts: 3,
            jugadores: [
                { nombre: "Julián Lucas", rol: "Singlista 1" },
                { nombre: "Sofía Pereyra", rol: "Singlista 2" },
                { nombre: "Lucas Gómez", rol: "Dobles" }
            ]
        },
        {
            id: "ger",
            nombre: "Gimnasia y Esgrima Rosario",
            delegado: "Carlos Pellegrini",
            pj: 2, pg: 1, pp: 1, sf: 8, pts: 3,
            jugadores: [
                { nombre: "Facundo Arias", rol: "Singlista 1" },
                { nombre: "Micaela Benítez", rol: "Singlista 2" }
            ]
        }
    ],
    "LIGA_B": [
        {
            id: "echesortu",
            nombre: "Echesortu F.C.",
            delegado: "Juan Pérez",
            pj: 2, pg: 0, pp: 2, sf: 2, pts: 2,
            jugadores: [
                { nombre: "Tomás Silva", rol: "Singlista 1" },
                { nombre: "Gastón Ríos", rol: "Singlista 2" }
            ]
        }
    ]
};

const FIXTURE_DATA = [
    {
        id: 1,
        liga: "LIGA_A",
        fechaNumero: 3,
        fechaTxt: "Sábado 13/06 - 15:00 hs",
        mesa: "Mesa 1 & 2",
        localId: "prov_a",
        visitanteId: "ger",
        scoreLocal: null,
        scoreVisitante: null,
        estado: "Programado"
    },
    {
        id: 2,
        liga: "LIGA_A",
        fechaNumero: 3,
        fechaTxt: "Sábado 13/06 - 17:00 hs",
        mesa: "Mesa 3 & 4",
        localId: "nautico",
        visitanteId: "echesortu",
        scoreLocal: 4,
        scoreVisitante: 1,
        estado: "Finalizado"
    }
];

const APP_STATE = {
    currentTab: 'posiciones',
    currentLigaPosiciones: 'LIGA_A',
    currentLigaFixture: 'LIGA_A',
    currentFechaFiltro: 3
};

// ==========================================
// 2. FUNCIONES DE CONTROL (LOGICA)
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

// ==========================================
// 3. RENDERIZADORES REUTILIZABLES (VISTAS)
// ==========================================

function renderApp() {
    if (APP_STATE.currentTab === 'posiciones') {
        renderPosiciones();
    } else if (APP_STATE.currentTab === 'fixture') {
        renderFixture();
    } else if (APP_STATE.currentTab === 'equipos') {
        renderEquipos();
    }
}

function renderPosiciones() {
    const ligaActual = APP_STATE.currentLigaPosiciones; 

    const tituloLayout = document.getElementById('titulo-liga-actual');
    if (tituloLayout) {
        tituloLayout.innerText = ligaActual === 'LIGA_A' ? 'Liga A (Campeonato)' : 'Liga B (Ascenso)';
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
    if (tituloLiga) tituloLiga.innerText = ligaActual === 'LIGA_A' ? 'Liga A (Campeonato)' : 'Liga B (Ascenso)';

    const txtFecha = document.getElementById('txt-fecha-actual');
    if (txtFecha) txtFecha.innerText = `Fecha ${fechaActual}`;

    document.getElementById('btn-fecha-prev').disabled = (fechaActual === 1);
    document.getElementById('btn-fecha-next').disabled = (fechaActual === 5);

    const partidosFiltrados = FIXTURE_DATA.filter(p => p.liga === ligaActual && p.fechaNumero === fechaActual);

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
        // Buscamos los nombres de los equipos usando sus IDs en la base de datos
        const todosLosEquipos = [...LIGAS_DATA["LIGA_A"], ...LIGAS_DATA["LIGA_B"]];
        const local = todosLosEquipos.find(e => e.id === partido.localId) || { nombre: partido.localId };
        const visitante = todosLosEquipos.find(e => e.id === partido.visitanteId) || { nombre: partido.visitanteId };

        // Definimos el estilo visual del estado del partido
        const esFinalizado = partido.estado === "Finalizado";
        const badgeClass = esFinalizado 
            ? "bg-green-100 text-green-800 border border-green-200" 
            : "bg-blue-100 text-blue-800 border border-blue-200";

        // Si no tiene score cargado, mostramos un guión
        const scoreLocalTxt = partido.scoreLocal !== null ? partido.scoreLocal : "-";
        const scoreVisitanteTxt = partido.scoreVisitante !== null ? partido.scoreVisitante : "-";

        const tarjetaHtml = `
            <div class="bg-white rounded-xl border border-gray-200 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-all duration-200">
                <!-- Info superior del partido -->
                <div class="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
                    <div class="space-y-0.5">
                        <p class="text-xs font-bold text-gray-500">${partido.fechaTxt}</p>
                        <p class="text-[11px] font-medium text-gray-400">${partido.mesa}</p>
                    </div>
                    <span class="text-[11px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${badgeClass}">
                        ${partido.estado}
                    </span>
                </div>

                <!-- Bloque de Equipos y Resultados -->
                <div class="space-y-3 my-2">
                    <!-- Local -->
                    <div class="flex justify-between items-center">
                        <span class="font-semibold text-gray-900 text-sm truncate pr-4">${local.nombre}</span>
                        <span class="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center font-black text-sm text-gray-800 ${esFinalizado && partido.scoreLocal > partido.scoreVisitante ? 'bg-amber-50 border-amber-200 text-amber-900' : ''}">
                            ${scoreLocalTxt}
                        </span>
                    </div>
                    <!-- Visitante -->
                    <div class="flex justify-between items-center">
                        <span class="font-semibold text-gray-900 text-sm truncate pr-4">${visitante.nombre}</span>
                        <span class="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center font-black text-sm text-gray-800 ${esFinalizado && partido.scoreVisitante > partido.scoreLocal ? 'bg-amber-50 border-amber-200 text-amber-900' : ''}">
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
    // (Aquí irá el render de las tarjetas de los clubes y la Lista de Buena Fe)
}

// Inicialización de la App al cargar el documento
document.addEventListener("DOMContentLoaded", () => {
    renderApp();
});