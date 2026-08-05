// js/vistas/liga.js

import { ligaState } from '../state/liga-state.js';
import { TablaRankingLiga } from '../componentes/liga/TablaRankingLiga.js';
import { TarjetaFixture } from '../componentes/liga/TarjetaFixture.js';
import { TarjetaEquipo } from '../componentes/liga/TarjetaEquipo.js';
import { DesplegableFixture } from '../componentes/liga/DesplegableFixture.js';
import { ModalHistorial } from '../componentes/liga/ModalHistorial.js';

export const ligaController = {
    supabase: null,

    async inicializar(supabaseClient) {
        this.supabase = supabaseClient;
        window.ligaController = this;

        // Registrar funciones de la ventana global requeridas por el HTML
        this._registrarPuentesGlobales();

        try {
            await ligaState.cargarDatosDesdeSupabase(this.supabase);
        } catch (err) {
            this._mostrarErrorUI();
            return;
        }

        this.actualizarContadoresBanner();
        this._configurarListenersDOM();

        // Establecer pestañas y ligas iniciales activas
        window.switchLiga('LIGA_A');
        window.switchLigaFixture('LIGA_A');
        window.seleccionarLigaEquipos('LIGA_A');

        // Renderizar vista acorde al tab activo inicial
        this.renderizarVistaActual();
    },

    // js/vistas/liga.js

    _registrarPuentesGlobales() {
        window.switchTab = (tabId) => {
            ligaState.currentTab = tabId;
            this._actualizarEstiloTabsSuperiores(tabId);
            this.renderizarVistaActual();
        };

        window.switchLiga = (ligaId) => {
            ligaState.currentLigaPosiciones = ligaId;

            // --- ACTUALIZACIÓN DE TÍTULO EN TABLA DE POSICIONES ---
            const tituloPosiciones = document.getElementById('titulo-liga-actual');
            if (tituloPosiciones) {
                tituloPosiciones.textContent = ligaId === 'LIGA_A' ? 'Liga A' : 'Liga B';
            }

            this.renderizarTabPosiciones();
            this._actualizarBotonesEstilo('button[onclick*="switchLiga("]', ligaId);
        };

        window.switchLigaFixture = (ligaId) => {
            ligaState.currentLigaFixture = ligaId;
            ligaState.currentFechaFiltro = 1;

            // --- ACTUALIZACIÓN DE TÍTULO EN FIXTURE ---
            const tituloFixture = document.getElementById('fixture-titulo-liga');
            if (tituloFixture) {
                tituloFixture.textContent = ligaId === 'LIGA_A' ? 'Liga A' : 'Liga B';
            }

            this.renderizarTabFixture();
            this._actualizarBotonesEstilo('button[onclick*="switchLigaFixture"]', ligaId);
        };

        window.seleccionarLigaEquipos = (ligaId) => {
            ligaState.currentLigaEquipos = ligaId;
            ligaState.equipoSeleccionadoId = null;
            this.renderizarTabEquipos();
            this._actualizarBotonesEstilo('button[onclick*="seleccionarLigaEquipos"]', ligaId);
        };

        window.cambiarFechaFixture = (direccion) => {
            let nuevaFecha = Number(ligaState.currentFechaFiltro) + direccion;
            const maxFechas = ligaState.obtenerMaxFechasFixture() || 12;
            if (nuevaFecha >= 1 && nuevaFecha <= maxFechas) {
                ligaState.currentFechaFiltro = nuevaFecha;
                this.renderizarTabFixture();
            }
        };

        // Puentes globales para selección de equipo y modales
        window.seleccionarEquipoDetalle = (equipoId) => this.seleccionarEquipoDetalle(equipoId);
        window.verDetalleJugador = (jugadorId, equipoId) => this.verDetalleJugador(jugadorId, equipoId);
        window.cerrarModalJugador = () => this.cerrarModalJugador();
    },

    _configurarListenersDOM() {
        document.getElementById('input-busqueda-equipos')?.addEventListener('input', (e) => {
            ligaState.filtroTextoEquipos = e.target.value;
            this.renderizarGridEquiposUnicamente();
        });
    },

    seleccionarEquipoDetalle(equipoId) {
        ligaState.equipoSeleccionadoId = equipoId;
        this.renderizarTabEquipos();
    },

    togglePlanilla(partidoId) {
        const contenedor = document.getElementById(`contenedor-detalle-${partidoId}`);
        const icono = document.getElementById(`icono-detalle-${partidoId}`);
        const filasDestino = document.getElementById(`planilla-rows-${partidoId}`);

        if (!contenedor) return;

        if (!contenedor.classList.contains('hidden')) {
            contenedor.classList.add('hidden');
            icono?.classList.remove('rotate-180');
            return;
        }

        contenedor.classList.remove('hidden');
        icono?.classList.add('rotate-180');

        const detalles = ligaState.obtenerPlanillaPartidoCache(partidoId);

        filasDestino.innerHTML = DesplegableFixture.renderLineasPlanilla(detalles, (id) => {
            return ligaState.obtenerNombreJugadorLocal(id);
        });
    },

    verDetalleJugador(jugadorId, equipoId) {
        const jugador = ligaState.obtenerJugadorPorId(jugadorId);
        const equipoActual = ligaState.equiposMap[String(equipoId)] || { nombre: 'Club' };

        const historial = ligaState.obtenerHistorialJugador(jugadorId);

        // 1. Obtener total de fechas en la competencia
        const totalFechas = ligaState.obtenerMaxFechasFixture() || 12;

        // 2. Contabilizar en cuántas fechas distintas jugó el deportista
        const fechasUnicasJugadas = new Set(
            historial
                .map(p => Number(p.fecha_numero))
                .filter(f => !isNaN(f) && f > 0)
        ).size;

        // 3. Renderizar partidos pasándole el club rival
        const htmlPartidos = ModalHistorial.renderListaPartidos(
            historial,
            jugadorId,
            (id) => ligaState.obtenerNombreJugadorLocal(id),
            (idPartido, esLocal) => {
                const idRival = esLocal ? idPartido.visitante_equipo_id : idPartido.local_equipo_id;
                return ligaState.equiposMap[String(idRival)]?.nombre || 'Club Rival';
            }
        );

        // 4. Renderizar modal con el total de fechas contabilizadas (ej: 5 de 13)
        const modalHTML = ModalHistorial.renderModal(
            jugador,
            equipoActual.nombre,
            fechasUnicasJugadas,
            totalFechas,
            htmlPartidos
        );

        let contenedor = document.getElementById('modal-container');
        if (!contenedor) {
            contenedor = document.createElement('div');
            contenedor.id = 'modal-container';
            document.body.appendChild(contenedor);
        }
        contenedor.innerHTML = modalHTML;
    },
    
    cerrarModalJugador() {
        const contenedor = document.getElementById('modal-container');
        if (contenedor) {
            contenedor.innerHTML = '';
        }
    },

    renderizarVistaActual() {
        const paneles = ['content-posiciones', 'content-fixture', 'content-equipos'];
        paneles.forEach(id => document.getElementById(id)?.classList.remove('active'));

        const tabActiva = `content-${ligaState.currentTab}`;
        document.getElementById(tabActiva)?.classList.add('active');

        if (ligaState.currentTab === 'posiciones') this.renderizarTabPosiciones();
        if (ligaState.currentTab === 'fixture') this.renderizarTabFixture();
        if (ligaState.currentTab === 'equipos') this.renderizarTabEquipos();
    },

    // js/vistas/liga.js

    renderizarTabPosiciones() {
        // Sincronizar título HTML según el estado
        const tituloPosiciones = document.getElementById('titulo-liga-actual');
        if (tituloPosiciones) {
            tituloPosiciones.textContent = ligaState.currentLigaPosiciones === 'LIGA_A' ? 'Liga A' : 'Liga B';
        }

        const contenedor = document.getElementById('tabla-posiciones-body');
        if (contenedor) {
            const equipos = ligaState.obtenerEquiposPosiciones() || [];
            contenedor.innerHTML = TablaRankingLiga.render(
                equipos,
                ligaState.equiposMap,
                ligaState.currentLigaPosiciones
            );
        }
    },

    renderizarTabFixture() {
        // Sincronizar título HTML según el estado
        const tituloFixture = document.getElementById('fixture-titulo-liga');
        if (tituloFixture) {
            tituloFixture.textContent = ligaState.currentLigaFixture === 'LIGA_A' ? 'Liga A' : 'Liga B';
        }

        const maxFechas = ligaState.obtenerMaxFechasFixture() || 12;

        const paginador = document.getElementById('txt-fecha-actual')?.parentElement;
        if (paginador) {
            paginador.outerHTML = TarjetaFixture.renderPaginador(ligaState.currentFechaFiltro, maxFechas);
        }

        const btnPrev = document.getElementById('btn-fecha-prev');
        const btnNext = document.getElementById('btn-fecha-next');
        if (btnPrev) btnPrev.disabled = Number(ligaState.currentFechaFiltro) <= 1;
        if (btnNext) btnNext.disabled = Number(ligaState.currentFechaFiltro) >= maxFechas;

        const contenedorCards = document.getElementById('fixture-partidos-container');
        if (contenedorCards) {
            const partidos = ligaState.obtenerPartidosFixture();
            const equiposLiga = ligaState.ligasData[ligaState.currentLigaFixture] || [];
            contenedorCards.innerHTML = TarjetaFixture.render(partidos, ligaState.equiposMap, equiposLiga);
        }
    },

    renderizarTabEquipos() {
        this.renderizarGridEquiposUnicamente();
        this.renderizarListaBuenaFe();
    },

    renderizarGridEquiposUnicamente() {
        const grid = document.getElementById('equipos-grid-container');
        if (grid) {
            grid.innerHTML = TarjetaEquipo.renderGrid(ligaState.obtenerEquiposGrid(), ligaState._jugadores, ligaState.equipoSeleccionadoId);
        }
    },

    renderizarListaBuenaFe() {
        const panelDetalle = document.getElementById('seccion-detalle-jugadores');
        const contenedorLista = document.getElementById('jugadores-grid-container');

        if (!contenedorLista) return;

        if (!ligaState.equipoSeleccionadoId) {
            panelDetalle?.classList.add('hidden');
            return;
        }

        panelDetalle?.classList.remove('hidden');
        const datosClub = ligaState.equiposMap[String(ligaState.equipoSeleccionadoId)];

        const txtTitulo = document.getElementById('nombre-equipo-seleccionado');
        if (txtTitulo && datosClub) txtTitulo.textContent = datosClub.nombre;

        const jugadores = ligaState.obtenerJugadoresDeEquipo(ligaState.equipoSeleccionadoId);
        contenedorLista.innerHTML = TarjetaEquipo.renderJugadores(jugadores, ligaState._todosDetallesJuegos, ligaState.obtenerMaxFechasFixture());
    },

    actualizarContadoresBanner() {
        const txtTotal = document.getElementById('contador-equipos-total');
        if (txtTotal && ligaState.ligasData) {
            const total = (ligaState.ligasData['LIGA_A']?.length || 0) + (ligaState.ligasData['LIGA_B']?.length || 0);
            txtTotal.textContent = `${total} Equipos`;
        }
    },

    _mostrarErrorUI() {
        console.error("Error al renderizar los datos de la liga.");
    },

    _actualizarEstiloTabsSuperiores(tabId) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            const attr = btn.getAttribute('onclick');
            btn.className = attr && attr.includes(tabId)
                ? "tab-btn px-4 py-4 text-sm font-bold border-b-2 border-asatemeRed text-asatemeRed whitespace-nowrap"
                : "tab-btn px-4 py-4 text-sm font-bold border-b-2 border-transparent text-gray-500 hover:text-asatemeBlue whitespace-nowrap";
        });
    },

    _actualizarBotonesEstilo(selector, ligaId) {
        document.querySelectorAll(selector).forEach(btn => {
            const attr = btn.getAttribute('onclick');
            btn.className = attr && attr.includes(ligaId)
                ? "px-4 py-2 text-sm font-semibold rounded-lg shadow-sm bg-[#003366] text-white border border-gray-200 transition-all cursor-pointer"
                : "px-4 py-2 text-sm font-semibold rounded-lg shadow-sm bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 transition-all cursor-pointer";
        });
    }
};