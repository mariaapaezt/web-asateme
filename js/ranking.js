// =========================================================================
// ARCHIVO: js/ranking.js
// DESCRIPCIÓN: Gestión del Ranking Provincial bajo Arquitectura Modular de Capas
// =========================================================================

// -------------------------------------------------------------------------
// 1. CAPA DE SERVICIOS (Conectividad y Extracción de Datos)
// -------------------------------------------------------------------------
const RankingService = {
    SHEET_ID: '1D8FRoqxEYdG--DHnOERb5cKEze9suOVOyhyhGBIAc-A',

    get url() {
        return `https://docs.google.com/spreadsheets/d/${this.SHEET_ID}/gviz/tq?tqx=out:json`;
    },

    /**
     * Consume los datos crudos desde Google Sheets y los devuelve normalizados
     * @returns {Promise<Array>} Lista de jugadores con formato estandarizado
     */
    async obtenerRankingDesdeSheets() {
        const respuesta = await fetch(this.url);
        const textoCrudo = await respuesta.text();

        // Limpieza de la envoltura de seguridad que inyecta Google GViz
        const inicioJson = textoCrudo.indexOf('{');
        const finJson = textoCrudo.lastIndexOf('}') + 1;
        const textoJsonValido = textoCrudo.substring(inicioJson, finJson);
        const datosParseados = JSON.parse(textoJsonValido);

        const filas = datosParseados.table.rows;
        if (!filas) return [];

        // Mapeo semántico de columnas según orden:
        // A (0): Categoría | B (1): Posición | C (2): Jugador | D (3): Club | E (4): Puntos
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
// 2. CAPA DE ESTADO CENTRAL (Única Fuente de la Verdad)
// -------------------------------------------------------------------------
const RankingState = {
    jugadoresGlobales: [],
    categoriaActual: "PRIMERA",
    mostrarSoloTop10: true, // En el index siempre se mantiene en true para fijar el Top 10
    mesActivo: "Actualizado Junio 2026",

    /**
     * Filtra y ordena los datos globales basándose en el estado actual de los filtros
     * @returns {Object} Datos procesados listos para renderizar y metadatos
     */
    obtenerDatosProcesados() {
        // Filtrar por categoría activa
        let filtrados = this.jugadoresGlobales.filter(j => j.categoria === this.categoriaActual);

        // Garantizar orden numérico estricto por posición provincial
        filtrados.sort((a, b) => a.posicion - b.posicion);

        const totalEnCategoria = filtrados.length;

        // En la home siempre recortamos a los primeros 10
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
    // Selectores de elementos del DOM guardados en caché para rendimiento
    elementos: {
        tablaBody: () => document.getElementById('ranking-body'),
        tituloTabla: () => document.getElementById('ranking-title'),
        subtituloMes: () => document.getElementById('ranking-mes-titulo'),
        botonToggle: () => document.getElementById('btn-toggle-vista')
    },

    /**
     * Renderiza la cuadrícula de datos en base al estado actual
     */
    renderizar() {
        const tbody = this.elementos.tablaBody();
        if (!tbody) return;

        const { jugadores, totalEnCategoria } = RankingState.obtenerDatosProcesados();

        // 1. Control de Estado Vacío
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

        // 2. Generación dinámica de filas
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

        // 3. Sincronizar textos laterales y enlaces
        this.actualizarComponentesTexto(totalEnCategoria);
        this.resaltarBotonesCategoria();
    },

    /**
     * Actualiza de manera semántica los componentes de texto y el link dinámico
     */
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

        // Configuración del botón como enlace dinámico real hacia la página externa
        if (btnToggle) {
            btnToggle.classList.remove('hidden'); // Siempre visible en la home

            // Le inyectamos el destino correcto con la query variable
            btnToggle.setAttribute('href', `ranking.html?categoria=${RankingState.categoriaActual}`);

            // Restablecemos el diseño limpio original de redirección
            btnToggle.innerHTML = `<i class="fas fa-list-ol mr-2"></i><span>Ver Ranking Completo</span>`;
        }
    },

    /**
     * Gestiona las clases visuales de Tailwind en el menú lateral izquierdo
     */
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

    /**
     * Renderiza una alerta de error elegante en caso de fallos de red
     */
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

// Exponer las acciones a nivel global (`window`) ÚNICAMENTE para la interfaz del HTML
window.RankingController = {
    cambiarCategoria(nuevaCategoria) {
        RankingState.categoriaActual = nuevaCategoria.trim().toUpperCase();
        RankingUI.renderizar();
    }
};

// Gracias al atributo 'defer' configurado previamente, el DOM ya está disponible de forma nativa
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Carga inicial asíncrona de datos desde el endpoint de Google
        RankingState.jugadoresGlobales = await RankingService.obtenerRankingDesdeSheets();

        // Ejecución del renderizado inicial de la UI
        RankingUI.renderizar();

    } catch (error) {
        console.error("🚨 [ASATEME-ARCH]: Falla crítica en inicialización de módulo Ranking:", error);
        RankingUI.mostrarPantallaError();
    }
});