// =========================================================================
// ARCHIVO: js/ranking-completo.js
// DESCRIPCIÓN: Módulo de Escalafón Completo conectado a Supabase mediante cliente global
// =========================================================================

// -------------------------------------------------------------------------
// 1. CAPA DE SERVICIOS (Usa la instancia 'supabase' de config.js)
// -------------------------------------------------------------------------
const RankingCompletoService = {
    /**
     * Obtiene de forma idéntica cuál es el periodo más reciente subido
     */
    async obtenerPeriodoMasReciente() {
        try {
            const { data, error } = await supabase
                .from('ranking')
                .select('periodo')
                .order('created_at', { ascending: false })
                .limit(1);

            if (error) throw error;
            return data && data.length > 0 ? data[0].periodo : "Junio 2026";
        } catch (error) {
            return "Junio 2026";
        }
    },

    /**
     * Consume el ranking completo del periodo activo sin filtros de categoría
     * @returns {Promise<Array>} Lista total de jugadores normalizada
     */
    async obtenerDatosCompletos() {
        const periodoActivo = await this.obtenerPeriodoMasReciente();
        RankingCompletoState.periodoDetectado = periodoActivo;

        const { data, error } = await supabase
            .from('ranking')
            .select('categoria, posicion, jugador, club, puntos')
            .eq('periodo', periodoActivo);

        if (error) throw error;

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
// 2. CAPA DE ESTADO CENTRAL (Filtros y Memoria Volátil)
// -------------------------------------------------------------------------
const RankingCompletoState = {
    jugadoresGlobales: [],
    categoriaActual: "PRIMERA",
    textoBusqueda: "",
    periodoDetectado: "",

    obtenerPeriodoFormateado() {
        return this.periodoDetectado || "Junio 2026";
    },

    obtenerDatosFiltrados() {
        const criterioBusqueda = this.textoBusqueda.toLowerCase().trim();

        let resultado = this.jugadoresGlobales.filter(j => {
            const coincideCategoria = j.categoria === this.categoriaActual;
            const coincideFiltroTexto = j.jugador.toLowerCase().includes(criterioBusqueda) ||
                j.club.toLowerCase().includes(criterioBusqueda);

            return coincideCategoria && coincideFiltroTexto;
        });

        return resultado.sort((a, b) => a.posicion - b.posicion);
    }
};

// -------------------------------------------------------------------------
// 3. CAPA DE INTERFAZ DE USUARIO (Renderizado Semántico)
// -------------------------------------------------------------------------
const RankingCompletoUI = {
    elementos: {
        tablaBody: () => document.getElementById('vista-ranking-body'),
        tituloSeccion: () => document.getElementById('vista-ranking-titulo'),
        subtituloMes: () => document.getElementById('vista-ranking-mes'),
        inputBuscador: () => document.getElementById('buscador-jugador')
    },

    renderizar() {
        const tbody = this.elementos.tablaBody();
        if (!tbody) return;

        const jugadores = RankingCompletoState.obtenerDatosFiltrados();

        this.actualizarCabeceras();
        this.actualizarTabsNavegacion();

        if (jugadores.length === 0) {
            const mensajeVacio = RankingCompletoState.textoBusqueda
                ? 'No se encontraron jugadores ni clubes que coincidan con la búsqueda.'
                : 'No hay jugadores registrados en esta categoría.';

            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="px-6 py-12 text-center text-gray-500 font-medium">
                        ${mensajeVacio}
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = jugadores.map(j => {
            let clasePosicion = "text-gray-700 font-bold";
            if (j.posicion === 1) clasePosicion = "text-yellow-500 font-extrabold text-lg";
            if (j.posicion === 2) clasePosicion = "text-gray-400 font-extrabold text-lg";
            if (j.posicion === 3) clasePosicion = "text-amber-600 font-extrabold text-lg";

            return `
                <tr class="hover:bg-gray-50/80 transition duration-150 border-b border-gray-100">
                    <td class="px-6 py-4 text-center ${clasePosicion}">${j.posicion}º</td>
                    <td class="px-6 py-4 font-semibold text-blue-900">${j.jugador}</td>
                    <td class="px-6 py-4 text-gray-600 text-sm">${j.club}</td>
                    <td class="px-6 py-4 text-right font-bold text-gray-900">${j.puntos}</td>
                </tr>
            `;
        }).join('');
    },

    actualizarCabeceras() {
        const titulo = this.elementos.tituloSeccion();
        const subtitulo = this.elementos.subtituloMes();

        if (titulo) {
            const catBonita = RankingCompletoState.categoriaActual.charAt(0) + RankingCompletoState.categoriaActual.slice(1).toLowerCase();
            titulo.innerHTML = `<i class="fas fa-trophy text-asatemeRed mr-2"></i> Ranking Completo — Categoría ${catBonita}`;
        }

        if (subtitulo) {
            subtitulo.innerText = `Período Activo: ${RankingCompletoState.obtenerPeriodoFormateado()}`;
        }
    },

    actualizarTabsNavegacion() {
        const botonesTabs = document.querySelectorAll('#vista-category-selector button');
        botonesTabs.forEach(btn => {
            if (btn.id === `tab-${RankingCompletoState.categoriaActual}`) {
                btn.className = "px-4 py-2 rounded-lg font-bold text-sm transition bg-asatemeBlue text-white shadow-md";
            } else {
                btn.className = "px-4 py-2 rounded-lg font-bold text-sm transition bg-white text-gray-600 hover:bg-gray-100 border border-gray-200";
            }
        });
    },

    mostrarErrorServidor() {
        const tbody = this.elementos.tablaBody();
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="px-6 py-12 text-center text-red-500 font-bold">
                        <i class="fas fa-exclamation-triangle mr-2"></i> Error al conectar con el servidor de cómputos. Reintente en unos instantes.
                    </td>
                </tr>
            `;
        }
    }
};

// -------------------------------------------------------------------------
// 4. CONTROLADOR DE EVENTOS E INICIALIZACIÓN DE ENTRADA
// -------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
    const parametrosURL = new URLSearchParams(window.location.search);
    const categoriaQuery = parametrosURL.get('categoria');
    if (categoriaQuery) {
        RankingCompletoState.categoriaActual = categoriaQuery.trim().toUpperCase();
    }

    const contenedorTabs = document.getElementById('vista-category-selector');
    if (contenedorTabs) {
        contenedorTabs.addEventListener('click', (e) => {
            const botonPresionado = e.target.closest('button');
            if (!botonPresionado) return;

            const nuevaCat = botonPresionado.id.replace('tab-', '');
            RankingCompletoState.categoriaActual = nuevaCat;
            RankingCompletoState.textoBusqueda = "";

            const input = RankingCompletoUI.elementos.inputBuscador();
            if (input) input.value = "";

            RankingCompletoUI.renderizar();
        });
    }

    const inputBusqueda = RankingCompletoUI.elementos.inputBuscador();
    if (inputBusqueda) {
        inputBusqueda.addEventListener('input', (e) => {
            RankingCompletoState.textoBusqueda = e.target.value;
            RankingCompletoUI.renderizar();
        });
    }

    try {
        RankingCompletoState.jugadoresGlobales = await RankingCompletoService.obtenerDatosCompletos();
        RankingCompletoUI.renderizar();
    } catch (error) {
        console.error("🚨 [ASATEME-SUPABASE]: Falla en carga de módulo Completo:", error);
        RankingCompletoUI.mostrarErrorServidor();
    }
});