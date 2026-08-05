// js/state/liga-state.js

export const ligaState = {
    // 1. ESTADO INTERNO
    _currentTab: 'posiciones',
    _currentLigaPosiciones: 'LIGA_A',
    _currentLigaFixture: 'LIGA_A',
    _currentLigaEquipos: 'LIGA_A',
    _currentFechaFiltro: 1,
    _filtroTextoEquipos: '',
    _equipoSeleccionadoId: null,

    // CACHÉ DE DATOS PUROS DE SUPABASE
    _equipos: [],
    _fixture: [],
    _jugadores: [],
    _todosDetallesJuegos: [],
    _fixtureDetallesCache: {},

    // ESTRUCTURAS CALCULADAS
    ligasData: { LIGA_A: [], LIGA_B: [] },
    equiposMap: {},
    cargando: false,

    // GETTERS / SETTERS DE CONTROL DE FLUJO
    get currentTab() { return this._currentTab; },
    set currentTab(val) { this._currentTab = val; },

    get currentLigaPosiciones() { return this._currentLigaPosiciones; },
    set currentLigaPosiciones(val) { this._currentLigaPosiciones = val; },

    get currentLigaFixture() { return this._currentLigaFixture; },
    set currentLigaFixture(val) { this._currentLigaFixture = val; },

    get currentLigaEquipos() { return this._currentLigaEquipos; },
    set currentLigaEquipos(val) { this._currentLigaEquipos = val; },

    get currentFechaFiltro() { return this._currentFechaFiltro; },
    set currentFechaFiltro(val) { this._currentFechaFiltro = val; },

    get filtroTextoEquipos() { return this._filtroTextoEquipos; },
    set filtroTextoEquipos(val) { this._filtroTextoEquipos = val; },

    get equipoSeleccionadoId() { return this._equipoSeleccionadoId; },
    set equipoSeleccionadoId(val) { this._equipoSeleccionadoId = val; },

    // NUEVO: Getter para exponer la lista de partidos requerida por la vista de Carga
    get partidos() {
        return this._fixture || [];
    },

    // =============================================================================
    // MÉTODOS DE DATOS Y CONEXIÓN (Supabase)
    // =============================================================================

    // NUEVO: Alias estándar init()
    async init(supabaseClient = window.supabase) {
        if (!supabaseClient) {
            console.error("❌ No se proporcionó el cliente de Supabase a ligaState.init()");
            return false;
        }
        return await this.cargarDatosDesdeSupabase(supabaseClient);
    },

    async cargarDatosDesdeSupabase(supabaseClient) {
        this.cargando = true;
        try {
            const [resEquipos, resFixture, resJugadores, resDetalles] = await Promise.all([
                supabaseClient.from('equipos').select('*'),
                supabaseClient.from('fixture').select('*'),
                supabaseClient.from('jugadores').select('*'),
                supabaseClient.from('fixture_detalles').select('*')
            ]);

            if (resEquipos.error) throw resEquipos.error;
            if (resFixture.error) throw resFixture.error;
            if (resJugadores.error) throw resJugadores.error;
            if (resDetalles.error) throw resDetalles.error;

            this._equipos = resEquipos.data || [];
            this._fixture = resFixture.data || [];
            this._jugadores = resJugadores.data || [];
            this._todosDetallesJuegos = resDetalles.data || [];

            this._fixtureDetallesCache = {};
            this._todosDetallesJuegos.forEach(d => {
                if (!this._fixtureDetallesCache[d.partido_id]) {
                    this._fixtureDetallesCache[d.partido_id] = [];
                }
                this._fixtureDetallesCache[d.partido_id].push(d);
            });

            this._procesarEstadisticasYPosiciones();

            return true;
        } catch (error) {
            console.error("❌ Error en ligaState.cargarDatosDesdeSupabase:", error.message);
            throw error;
        } finally {
            this.cargando = false;
        }
    },

    _procesarEstadisticasYPosiciones() {
        this.equiposMap = {};

        // Mapeo directo respetando LIGA_A y LIGA_B de Supabase
        let listaEquiposClon = this._equipos.map(e => {
            const ligaActual = String(e.liga || e.liga_id || 'LIGA_A').trim();

            this.equiposMap[String(e.id)] = {
                nombre: e.nombre,
                logo: e.logo || 'assets/logos/generic-pingpong.png',
                liga: ligaActual
            };

            return {
                ...e,
                liga: ligaActual,
                sj: 0, sg: 0, sp: 0, pg: 0, pp: 0, pts: 0
            };
        });

        // Cálculo de estadisticas según resultados finalizados
        this._fixture.forEach(partido => {
            if (partido.estado && partido.estado.toLowerCase() === 'finalizado') {
                const locId = String(partido.local_id);
                const visId = String(partido.visitante_id);

                const eqLocal = listaEquiposClon.find(e => String(e.id) === locId);
                const eqVisitante = listaEquiposClon.find(e => String(e.id) === visId);

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

        const funcionOrdenamientoAvanzado = (a, b) => {
            const puntosA = a.pts ?? 0;
            const puntosB = b.pts ?? 0;
            if (puntosB !== puntosA) return puntosB - puntosA;

            const pgA = a.pg ?? 0; const ppA = a.pp ?? 0;
            const pgB = b.pg ?? 0; const ppB = b.pp ?? 0;

            const coeficienteA = ppA === 0 ? pgA : pgA / ppA;
            const coeficienteB = ppB === 0 ? pgB : pgB / ppB;

            return coeficienteB - coeficienteA;
        };

        // Filtrado exacto usando las claves directas de Supabase
        this.ligasData = {
            LIGA_A: listaEquiposClon.filter(e => e.liga === 'LIGA_A').sort(funcionOrdenamientoAvanzado),
            LIGA_B: listaEquiposClon.filter(e => e.liga === 'LIGA_B').sort(funcionOrdenamientoAvanzado)
        };
    },

    // =============================================================================
    // MÉTODOS DE CONSULTA Y SELECCIÓN
    // =============================================================================

    // NUEVO: Método para resolver el nombre del equipo por ID
    getNombreEquipo(equipoId) {
        if (!equipoId) return 'Equipo';
        if (this.equiposMap[String(equipoId)]) {
            return this.equiposMap[String(equipoId)].nombre;
        }
        const eq = this._equipos.find(e => String(e.id) === String(equipoId));
        return eq ? eq.nombre : `Equipo (${equipoId})`;
    },

    obtenerEquiposPosiciones() {
        return this.ligasData[this._currentLigaPosiciones] || [];
    },

    obtenerPartidosFixture() {
        return this._fixture.filter(p => {
            const ligaPartido = String(p.liga || p.liga_id || '').trim();
            return ligaPartido === this._currentLigaFixture && Number(p.fecha_numero) === Number(this._currentFechaFiltro);
        });
    },

    obtenerMaxFechasFixture() {
        return this._fixture.length > 0 ? Math.max(...this._fixture.map(p => Number(p.fecha_numero || 1))) : 5;
    },

    obtenerEquiposGrid() {
        let deLiga = this.ligasData[this._currentLigaEquipos] || [];
        const texto = this._filtroTextoEquipos.toLowerCase().trim();
        if (texto !== '') {
            return deLiga.filter(e => e.nombre.toLowerCase().includes(texto));
        }
        return deLiga;
    },

    obtenerJugadoresDeEquipo(equipoId) {
        return this._jugadores.filter(j => String(j.equipo_id) === String(equipoId));
    },

    obtenerJugadorPorId(jugadorId) {
        return this._jugadores.find(j => Number(j.id) === Number(jugadorId)) || { id: jugadorId, nombre: 'Jugador' };
    },

    obtenerPlanillaPartidoCache(partidoId) {
        return this._fixtureDetallesCache[partidoId] || null;
    },

    guardarPlanillaEnCache(partidoId, data) {
        this._fixtureDetallesCache[partidoId] = data;
    },

    obtenerHistorialJugador(jugadorId) {
        if (!jugadorId || !this._todosDetallesJuegos) return [];

        return this._todosDetallesJuegos.filter(d =>
            Number(d.local_jugador1_id) === Number(jugadorId) ||
            Number(d.local_jugador2_id) === Number(jugadorId) ||
            Number(d.visitante_jugador1_id) === Number(jugadorId) ||
            Number(d.visitante_jugador2_id) === Number(jugadorId)
        ).map(d => {
            const partidoPadre = (this._fixture || []).find(f => Number(f.id) === Number(d.partido_id));
            return {
                ...d,
                fecha_numero: partidoPadre ? partidoPadre.fecha_numero : '',
                local_equipo_id: partidoPadre ? partidoPadre.local_id : null,
                visitante_equipo_id: partidoPadre ? partidoPadre.visitante_id : null
            };
        });
    },

    obtenerNombreJugadorLocal(jugadorId) {
        if (!jugadorId) return 'W.O. / Sin asignar';
        const j = this._jugadores.find(jug => Number(jug.id) === Number(jugadorId));
        return j ? j.nombre : `Jugador (${jugadorId})`;
    }
};