// =========================================================================
// ARCHIVO: js/ranking.js
// DESCRIPCIÓN: Gestión del Ranking Provincial usando el cliente global de Supabase
// =========================================================================

// -------------------------------------------------------------------------
// 1. CAPA DE SERVICIOS (Usa la instancia 'window.supabase' de config.js)
// -------------------------------------------------------------------------
const RankingService = {
    /**
     * Obtiene el periodo activo más reciente disponible en la tabla
     */
    async obtenerPeriodoMasReciente() {
        try {
            if (!window.supabase) throw new Error("window.supabase no está listo");

            // Consultamos el último registro para saber cuál es el mes más nuevo
            const { data, error } = await window.supabase
                .from('ranking')
                .select('periodo')
                .order('created_at', { ascending: false })
                .limit(1);

            if (error) throw error;
            return data && data.length > 0 ? data[0].periodo : "Junio 2026";
        } catch (error) {
            console.error("⚠️ Error al determinar el periodo más reciente:", error);
            return "Junio 2026"; // Fallback seguro
        }
    },

    /**
     * Consume los datos desde Supabase filtrando por el periodo más nuevo
     * @returns {Promise<Array>} Lista de jugadores con formato estandarizado
     */
    async obtenerRankingDesdeSupabase() {
        // Detectamos dinámicamente cuál es el último mes subido
        const ultimoPeriodo = await this.obtenerPeriodoMasReciente();
        RankingState.mesActivo = `Actualizado ${ultimoPeriodo}`;

        if (!window.supabase) return [];

        // Consulta usando la librería oficial apuntando al cliente global seguro
        const { data, error } = await window.supabase
            .from('ranking')
            .select('categoria, posicion, jugador, club, puntos')
            .eq('periodo', ultimoPeriodo);

        if (error) throw error;

        // Mapeo semántico para asegurar compatibilidad estricta con las Capas 2 y 3
        return data.map(r => ({
            categoria: r.categoria ? r.categoria.trim().toUpperCase() : '',
            posicion: parseInt(r.posicion) || 0,
            jugador: r.jugador || '',
            club: r.club || '',
            puntos: parseInt(r.puntos) || 0
        }));
    }
};

// -------------------------------------------------------------------------
// 2. CAPA DE ESTADO CENTRAL (Única Fuente de la Verdad con Filtro Tolerante)
// -------------------------------------------------------------------------
const RankingState = {
    jugadoresGlobales: [],
    categoriaActual: "PRIMERA",
    mostrarSoloTop10: true,
    mesActivo: "Cargando...",

    obtenerDatosProcesados() {
        const filtroNormalizado = this.categoriaActual.trim().toUpperCase();

        // Filtro flexible tolerante a mayúsculas/minúsculas de la base de datos
        let filtrados = this.jugadoresGlobales.filter(j => {
            if (!j.categoria) return false;
            const catJugador = j.categoria.trim().toUpperCase();
            return catJugador === filtroNormalizado || catJugador.includes(filtroNormalizado);
        });

        // Ordenamos por posición numérica
        filtrados.sort((a, b) => a.posicion - b.posicion);
        const totalEnCategoria = filtrados.length;

        if (this.mostrarSoloTop10) {
            filtrados = filtrados.slice(0, 10);
        }

        return {
            jugadores: filtrados,
            totalEnCategoria
        };
    }
};

// -------------------------------------------------------------------------
// 3. CAPA DE INTERFAZ DE USUARIO (Manipulación del DOM y Pintado)
// -------------------------------------------------------------------------
const RankingUI = {
    elementos: {
        tablaBody: () => document.getElementById('ranking-body'),
        tituloTabla: () => document.getElementById('ranking-title'),
        subtituloMes: () => document.getElementById('ranking-mes-titulo'),
        botonToggle: () => document.getElementById('btn-toggle-vista')
    },

    renderizar() {
        const tbody = this.elementos.tablaBody();
        if (!tbody) return;

        const { jugadores, totalEnCategoria } = RankingState.obtenerDatosProcesados();

        if (jugadores.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="px-6 py-8 text-center text-gray-500">
                        No hay datos cargados para la categoría ${RankingState.categoriaActual} en este período.
                    </td>
                </tr>
            `;
            this.actualizarComponentesTexto(0);
            return;
        }

        tbody.innerHTML = jugadores.map(j => {
            let clasePosicion = "text-gray-700 font-bold";
            if (j.posicion === 1) clasePosicion = "text-yellow-500 font-extrabold text-lg";
            if (j.posicion === 2) clasePosicion = "text-gray-400 font-extrabold text-lg";
            if (j.posicion === 3) clasePosicion = "text-amber-600 font-extrabold text-lg";

            return `
                <tr class="hover:bg-gray-50 transition duration-200 border-b border-gray-100">
                    <td class="px-6 py-4 text-center ${clasePosicion}">${j.posicion}º</td>
                    <td class="px-6 py-4 font-semibold text-blue-900">${j.jugador}</td>
                    <td class="px-6 py-4 text-gray-600 text-sm">${j.club}</td>
                    <td class="px-6 py-4 text-right font-bold text-gray-900">${j.puntos}</td>
                </tr>
            `;
        }).join('');

        this.actualizarComponentesTexto(totalEnCategoria);
        this.resaltarBotonesCategoria();
    },

    actualizarComponentesTexto(cantidadTotal) {
        const titulo = this.elementos.tituloTabla();
        const subtitulo = this.elementos.subtituloMes();
        const btnToggle = this.elementos.botonToggle();

        if (titulo) {
            const catFormateada = RankingState.categoriaActual.charAt(0) + RankingState.categoriaActual.slice(1).toLowerCase();
            titulo.innerHTML = `<i class="fas fa-medal mr-2"></i>Top 10 - ${catFormateada}`;
        }

        if (subtitulo) {
            subtitulo.innerText = `Ranking Oficial — ${RankingState.mesActivo}`;
        }

        if (btnToggle) {
            btnToggle.classList.remove('hidden');
            btnToggle.setAttribute('href', `ranking.html?categoria=${RankingState.categoriaActual}`);
            btnToggle.innerHTML = `<i class="fas fa-list-ol mr-2"></i><span>Ver Ranking Completo</span>`;
        }
    },

    resaltarBotonesCategoria() {
        const botones = document.querySelectorAll('#category-buttons button');
        botones.forEach(btn => {
            if (btn.id === `btn-${RankingState.categoriaActual}`) {
                btn.className = "w-full text-left px-4 py-3 rounded-lg bg-asatemeBlue text-white font-semibold transition active-category-btn";
            } else {
                btn.className = "w-full text-left px-4 py-3 rounded-lg bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition";
            }
        });
    },

    mostrarPantallaError() {
        const tbody = this.elementos.tablaBody();
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
};

// -------------------------------------------------------------------------
// 4. PUNTO DE ENTRADA GLOBAL (Controlador de Inicialización)
// -------------------------------------------------------------------------
window.RankingController = {
    cambiarCategoria(nuevaCategoria) {
        RankingState.categoriaActual = nuevaCategoria.trim().toUpperCase();
        RankingUI.renderizar();
    }
};

// Inicialización asíncrona controlada con margen de seguridad (Asilamiento de Tiempos)
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(async () => {
        try {
            console.log("🚀 [Ranking Module] Iniciando descarga segura desde Supabase...");
            RankingState.jugadoresGlobales = await RankingService.obtenerRankingDesdeSupabase();

            // Log de diagnóstico para desarrollo (puedes quitarlo luego de verificar)
            console.log("📊 Filas recuperadas:", RankingState.jugadoresGlobales);

            RankingUI.renderizar();
        } catch (error) {
            console.error("🚨 [ASATEME-SUPABASE]: Falla crítica en módulo Ranking:", error);
            RankingUI.mostrarPantallaError();
        }
    }, 150); // 150ms para garantizar que 'window.supabase' exista en memoria
});