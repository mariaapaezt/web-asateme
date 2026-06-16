// =========================================================================
// ARCHIVO: js/ranking-completo.js
// DESCRIPCIÓN: Módulo de Escalafón Completo con Filtros Dinámicos Combinados
// =========================================================================

// -------------------------------------------------------------------------
// 1. CAPA DE SERVICIOS (Conectividad y Extracción de Datos)
// -------------------------------------------------------------------------
const RankingCompletoService = {
    SHEET_ID: '1D8FRoqxEYdG--DHnOERb5cKEze9suOVOyhyhGBIAc-A',

    get url() {
        return `https://docs.google.com/spreadsheets/d/${this.SHEET_ID}/gviz/tq?tqx=out:json&sheet=Ranking`;
    },

    /**
     * Consume los datos globales del ranking sin recortes
     * @returns {Promise<Array>} Lista total de jugadores normalizada
     */
    async obtenerDatosCompletos() {
        const respuesta = await fetch(this.url);
        const textoCrudo = await respuesta.text();

        const inicioJson = textoCrudo.indexOf('{');
        const finJson = textoCrudo.lastIndexOf('}') + 1;
        const textoJsonValido = textoCrudo.substring(inicioJson, finJson);
        const datosParseados = JSON.parse(textoJsonValido);

        const filas = datosParseados.table.rows;
        if (!filas) return [];

        return filas.map(f => ({
            categoria: f.c[0] ? f.c[0].v.trim().toUpperCase() : '',
            posicion: f.c[1] ? parseInt(f.c[1].v) : 0,
            jugador: f.c[2] ? f.c[2].v : '',
            club: f.c[3] ? f.c[3].v : '',
            puntos: f.c[4] ? parseInt(f.c[4].v) : 0
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

    /**
     * Resuelve de forma dinámica el mes/año comercial en curso
     * @returns {string} Cadena formateada para la interfaz corporativa
     */
    obtenerPeriodoFormateado() {
        const meses = [
            "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
            "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
        ];
        const fecha = new Date();
        return `${meses[fecha.getMonth()]} ${fecha.getFullYear()}`;
    },

    /**
     * Filtra la colección aplicando los criterios concurrentes de Categoría y Buscador
     * @returns {Array} Listado depurado y ordenado de forma ascendente
     */
    obtenerDatosFiltrados() {
        const criterioBusqueda = this.textoBusqueda.toLowerCase().trim();

        let resultado = this.jugadoresGlobales.filter(j => {
            const coincideCategoria = j.categoria === this.categoriaActual;

            // Filtro avanzado: Busca coincidencia tanto en el nombre del Jugador como en su Club
            const coincideFiltroTexto = j.jugador.toLowerCase().includes(criterioBusqueda) ||
                j.club.toLowerCase().includes(criterioBusqueda);

            return coincideCategoria && coincideFiltroTexto;
        });

        // Garantizar el escalafón por posición estricta
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

    /**
     * Dibuja los componentes del listado completo basándose en los filtros activos
     */
    renderizar() {
        const tbody = this.elementos.tablaBody();
        if (!tbody) return;

        const jugadores = RankingCompletoState.obtenerDatosFiltrados();

        // 1. Renderizado de textos informativos de cabecera
        this.actualizarCabeceras();

        // 2. Sincronización visual de pestañas (Tabs de selección rápida)
        this.actualizarTabsNavegacion();

        // 3. Control de Layout vacío (Sin Coincidencias)
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

        // 4. Inyección estructurada de filas
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

    /**
     * Refresca las etiquetas de títulos de la pantalla
     */
    actualizarCabeceras() {
        const titulo = this.elementos.tituloSeccion();
        const subtitulo = this.elementos.subtituloMes();

        if (titulo) {
            const catBonita = RankingCompletoState.categoriaActual.charAt(0) + RankingCompletoState.categoriaActual.slice(1).toLowerCase();
            titulo.innerHTML = `<i class="fas fa-trophy text-asatemeRed mr-2"></i> Ranking Completo — Categoría ${catBonita}`;
        }

        if (subtitulo) {
            subtitulo.innerText = `Período Activo: ${RankingCompletoState.obtenerMesAnioActual || RankingCompletoState.obtenerPeriodoFormateado()}`;
        }
    },

    /**
     * Modifica las clases de Tailwind de los botones superiores imitando comportamiento de SPA
     */
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

    /**
     * Inyecta una alerta visual ante fallas críticas del Fetch
     */
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
    // A. Interceptar parámetro "?categoria=..." heredado desde la Home
    const parametrosURL = new URLSearchParams(window.location.search);
    const categoriaQuery = parametrosURL.get('categoria');
    if (categoriaQuery) {
        RankingCompletoState.categoriaActual = categoriaQuery.trim().toUpperCase();
    }

    // B. Delegación de eventos dinámicos para los Botones de Categorías (Tabs)
    const contenedorTabs = document.getElementById('vista-category-selector');
    if (contenedorTabs) {
        contenedorTabs.addEventListener('click', (e) => {
            const botonPresionado = e.target.closest('button');
            if (!botonPresionado) return;

            // Extraemos la categoría desde el ID del botón (ej: "tab-SEGUNDA" -> "SEGUNDA")
            const nuevaCat = botonPresionado.id.replace('tab-', '');

            // Modificamos estado interno y limpiamos los filtros de búsqueda por comodidad comercial
            RankingCompletoState.categoriaActual = nuevaCat;
            RankingCompletoState.textoBusqueda = "";

            const input = RankingCompletoUI.elementos.inputBuscador();
            if (input) input.value = "";

            RankingCompletoUI.renderizar();
        });
    }

    // C. Escucha reactiva en el Input de búsqueda (Manejo de entrada de datos)
    const inputBusqueda = RankingCompletoUI.elementos.inputBuscador();
    if (inputBusqueda) {
        inputBusqueda.addEventListener('input', (e) => {
            RankingCompletoState.textoBusqueda = e.target.value;
            RankingCompletoUI.renderizar();
        });
    }

    // D. Descarga inicial e inicio del ciclo de renderizado
    try {
        RankingCompletoState.jugadoresGlobales = await RankingCompletoService.obtenerDatosCompletos();
        RankingCompletoUI.renderizar();
    } catch (error) {
        console.error("🚨 [ASATEME-ARCH]: Falla en carga de módulo Completo:", error);
        RankingCompletoUI.mostrarErrorServidor();
    }
});