import { cargarRankingDesdeSupabase, RANKING_STATE } from '../state/ranking-state.js';
import { TablaRanking } from '../componentes/ranking/TablaRanking.js';

const ElementosDOM = {
    tablaBody: () => document.getElementById('ranking-body'),
    tituloTabla: () => document.getElementById('ranking-title'),
    subtituloMes: () => document.getElementById('ranking-mes-titulo'),
    botonToggle: () => document.getElementById('btn-toggle-vista')
};

// Exponemos la función globalmente a la ventana mediante window para que los botones HTML sigan funcionando
window.cambiarCategoria = function (nuevaCategoria) {
    RANKING_STATE.categoriaActual = nuevaCategoria.trim().toUpperCase();
    renderizarUI();
};

function renderizarUI() {
    const tbody = ElementosDOM.tablaBody();
    if (!tbody) return;

    const { jugadores, totalEnCategoria } = RANKING_STATE.obtenerDatosProcesados();

    if (jugadores.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="px-6 py-8 text-center text-gray-500">
                    No hay datos cargados para la categoría ${RANKING_STATE.categoriaActual} en este período.
                </td>
            </tr>
        `;
        actualizarTextosAcompañantes(0);
        return;
    }

    // Inyectamos el componente funcional puro
    tbody.innerHTML = TablaRanking(jugadores);

    actualizarTextosAcompañantes(totalEnCategoria);
    resaltarBotonesCategoria();
}

function actualizarTextosAcompañantes(cantidadTotal) {
    const titulo = ElementosDOM.tituloTabla();
    const subtitulo = ElementosDOM.subtituloMes();
    const btnToggle = ElementosDOM.botonToggle();

    if (titulo) {
        const catFormateada = RANKING_STATE.categoriaActual.charAt(0) + RANKING_STATE.categoriaActual.slice(1).toLowerCase();
        titulo.innerHTML = `<i class="fas fa-medal mr-2"></i>Top 10 - ${catFormateada}`;
    }

    if (subtitulo) {
        subtitulo.innerText = `Ranking Oficial — ${RANKING_STATE.mesActivo}`;
    }

    if (btnToggle) {
        btnToggle.classList.remove('hidden');
        btnToggle.setAttribute('href', `ranking.html?categoria=${RANKING_STATE.categoriaActual}`);
        btnToggle.innerHTML = `<i class="fas fa-list-ol mr-2"></i><span>Ver Ranking Completo</span>`;
    }
}

function resaltarBotonesCategoria() {
    const botones = document.querySelectorAll('#category-buttons button');
    botones.forEach(btn => {
        if (btn.id === `btn-${RANKING_STATE.categoriaActual}`) {
            btn.className = "w-full text-left px-4 py-3 rounded-lg bg-asatemeBlue text-white font-semibold transition active-category-btn";
        } else {
            btn.className = "w-full text-left px-4 py-3 rounded-lg bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition";
        }
    });
}

function mostrarPantallaError() {
    const tbody = ElementosDOM.tablaBody();
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="px-6 py-8 text-center text-red-500 font-bold">
                    <i class="fas fa-exclamation-triangle mr-2"></i> Error al cargar el ranking. Por favor, intente nuevamente más tarde.
                </td>
            </tr>
        `;
    }
}

// Inicialización limpia
document.addEventListener('DOMContentLoaded', () => {
    // Le damos un pequeño delay controlado idéntico al tuyo para la seguridad de window.supabase
    setTimeout(async () => {
        try {
            console.log("🚀 [Ranking Module] Iniciando descarga segura estructurada...");
            await cargarRankingDesdeSupabase();
            renderizarUI();
        } catch (error) {
            console.error("🚨 [ASATEME-SUPABASE]: Falla crítica en controlador de Ranking:", error);
            mostrarPantallaError();
        }
    }, 150);
});