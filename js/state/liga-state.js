// js/state/liga-state.js

export const ligaState = {
  // 1. ESTADO INTERNO
  _currentTab: "posiciones",
  _currentLigaPosiciones: "LIGA_A",
  _currentLigaFixture: "LIGA_A",
  _currentLigaEquipos: "LIGA_A",
  _currentFechaFiltro: 1,
  _filtroTextoEquipos: "",
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

  playoffsData: {
    LIGA_A: [],
    LIGA_B: [],
  },

  // GETTERS / SETTERS DE CONTROL DE FLUJO
  get currentTab() {
    return this._currentTab;
  },
  set currentTab(val) {
    this._currentTab = val;
  },

  get currentLigaPosiciones() {
    return this._currentLigaPosiciones;
  },
  set currentLigaPosiciones(val) {
    this._currentLigaPosiciones = val;
  },

  get currentLigaFixture() {
    return this._currentLigaFixture;
  },
  set currentLigaFixture(val) {
    this._currentLigaFixture = val;
  },

  get currentLigaEquipos() {
    return this._currentLigaEquipos;
  },
  set currentLigaEquipos(val) {
    this._currentLigaEquipos = val;
  },

  get currentFechaFiltro() {
    return this._currentFechaFiltro;
  },
  set currentFechaFiltro(val) {
    this._currentFechaFiltro = val;
  },

  get filtroTextoEquipos() {
    return this._filtroTextoEquipos;
  },
  set filtroTextoEquipos(val) {
    this._filtroTextoEquipos = val;
  },

  get equipoSeleccionadoId() {
    return this._equipoSeleccionadoId;
  },
  set equipoSeleccionadoId(val) {
    this._equipoSeleccionadoId = val;
  },

  get partidos() {
    return this._fixture || [];
  },

  // =============================================================================
  // MÉTODOS DE DATOS Y CONEXIÓN (Supabase)
  // =============================================================================

  async init(supabaseClient = window.supabase) {
    if (!supabaseClient) {
      console.error(
        "❌ No se proporcionó el cliente de Supabase a ligaState.init()",
      );
      return false;
    }
    return await this.cargarDatosDesdeSupabase(supabaseClient);
  },

  async cargarDatosDesdeSupabase(supabaseClient) {
    this.cargando = true;
    try {
      const [
        resEquipos,
        resFixture,
        resJugadores,
        resDetalles,
        resPlayoffs,
        resPlayoffsDetalles,
      ] = await Promise.all([
        supabaseClient.from("equipos").select("*"),
        supabaseClient.from("fixture").select("*"),
        supabaseClient.from("jugadores").select("*"),
        supabaseClient.from("fixture_detalles").select("*"),
        supabaseClient
          .from("liga_playoffs")
          .select("*")
          .order("created_at", { ascending: true }),
        supabaseClient.from("liga_playoffs_detalles").select("*"),
      ]);

      if (resEquipos.error) throw resEquipos.error;
      if (resFixture.error) throw resFixture.error;
      if (resJugadores.error) throw resJugadores.error;

      this._equipos = resEquipos.data || [];
      this._fixture = resFixture.data || [];
      this._jugadores = resJugadores.data || [];

      // Unificamos detalles de fixture y playoffs
      const detallesFixture = resDetalles.data || [];
      const detallesPlayoffs = resPlayoffsDetalles.data || [];
      this._todosDetallesJuegos = [...detallesFixture, ...detallesPlayoffs];

      this._fixtureDetallesCache = {};
      this._todosDetallesJuegos.forEach((d) => {
        if (!this._fixtureDetallesCache[d.partido_id]) {
          this._fixtureDetallesCache[d.partido_id] = [];
        }
        this._fixtureDetallesCache[d.partido_id].push(d);
      });

      // Procesar estadísticas de fase regular
      this._procesarEstadisticasYPosiciones();

      if (
        !resPlayoffs.error &&
        resPlayoffs.data &&
        resPlayoffs.data.length > 0
      ) {
        this.playoffsData.LIGA_A = resPlayoffs.data.filter(
          (p) => p.liga === "LIGA_A",
        );
        this.playoffsData.LIGA_B = resPlayoffs.data.filter(
          (p) => p.liga === "LIGA_B",
        );

        // Propagar asignaciones y avances en memoria local
        this.actualizarAvancePlayoffs("LIGA_A");
        this.actualizarAvancePlayoffs("LIGA_B");
      }

      return true;
    } catch (error) {
      console.error(
        "❌ Error en ligaState.cargarDatosDesdeSupabase:",
        error.message,
      );
      throw error;
    } finally {
      this.cargando = false;
    }
  },
  
  _procesarEstadisticasYPosiciones() {
    this.equiposMap = {};

    let listaEquiposClon = this._equipos.map((e) => {
      const ligaActual = String(e.liga || e.liga_id || "LIGA_A").trim();

      this.equiposMap[String(e.id)] = {
        nombre: e.nombre,
        logo: e.logo || "assets/logos/generic-pingpong.png",
        liga: ligaActual,
      };

      return {
        ...e,
        id: String(e.id),
        liga: ligaActual,
        sj: 0,
        sg: 0,
        sp: 0,
        pg: 0,
        pp: 0,
        pts: 0,
        sets_favor: 0,
        sets_contra: 0,
      };
    });

    // 1. Acumular estadísticas desde los resultados finalizados de la Fase Regular
    this._fixture.forEach((partido) => {
      if (partido.estado && partido.estado.toLowerCase() === "finalizado") {
        const locId = String(partido.local_id);
        const visId = String(partido.visitante_id);

        const eqLocal = listaEquiposClon.find((e) => e.id === locId);
        const eqVisitante = listaEquiposClon.find((e) => e.id === visId);

        if (eqLocal && eqVisitante) {
          eqLocal.sj += 1;
          eqVisitante.sj += 1;

          const quienFalto = partido.walkover
            ? String(partido.walkover).toUpperCase().trim()
            : null;

          if (quienFalto === "LOCAL") {
            eqLocal.sp += 1;
            eqLocal.pts += 0;
            eqVisitante.sg += 1;
            eqVisitante.pts += 2;
          } else if (quienFalto === "VISITANTE") {
            eqVisitante.sp += 1;
            eqVisitante.pts += 0;
            eqLocal.sg += 1;
            eqLocal.pts += 2;
          } else {
            const scoreLoc = Number(partido.score_local || 0);
            const scoreVis = Number(partido.score_visitante || 0);

            eqLocal.pg += scoreLoc;
            eqLocal.pp += scoreVis;
            eqVisitante.pg += scoreVis;
            eqVisitante.pp += scoreLoc;

            // Suma de sets individuales para criterio de desempate
            const detalles = this._fixtureDetallesCache[partido.id] || [];
            detalles.forEach((d) => {
              const sL = Number(d.score_sets_local || 0);
              const sV = Number(d.score_sets_visitante || 0);
              eqLocal.sets_favor += sL;
              eqLocal.sets_contra += sV;
              eqVisitante.sets_favor += sV;
              eqVisitante.sets_contra += sL;
            });

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

    // 2. Aplicación de Criterios de Desempate
    const funcionOrdenamientoAvanzado = (a, b) => {
      // 1° Criterio: Puntos
      if (b.pts !== a.pts) return b.pts - a.pts;

      // 2° Criterio: Coeficiente Partidos (PG/PP)
      const coefPartidosA = a.pp === 0 ? a.pg : a.pg / a.pp;
      const coefPartidosB = b.pp === 0 ? b.pg : b.pg / b.pp;
      if (coefPartidosB !== coefPartidosA) return coefPartidosB - coefPartidosA;

      // 3° Criterio: Diferencia de Sets (favor - contra)
      const difSetsA = a.sets_favor - a.sets_contra;
      const difSetsB = b.sets_favor - b.sets_contra;
      if (difSetsB !== difSetsA) return difSetsB - difSetsA;

      // 4° Criterio: Enfrentamiento directo (Head to Head)
      const partidoDirecto = this._fixture.find(
        (f) =>
          f.estado &&
          f.estado.toLowerCase() === "finalizado" &&
          ((String(f.local_id) === a.id && String(f.visitante_id) === b.id) ||
            (String(f.local_id) === b.id && String(f.visitante_id) === a.id)),
      );

      if (partidoDirecto) {
        const esALocal = String(partidoDirecto.local_id) === a.id;
        const scoreA = esALocal
          ? Number(partidoDirecto.score_local)
          : Number(partidoDirecto.score_visitante);
        const scoreB = esALocal
          ? Number(partidoDirecto.score_visitante)
          : Number(partidoDirecto.score_local);
        if (scoreB !== scoreA) return scoreB - scoreA;
      }

      return 0;
    };

    this.ligasData = {
      LIGA_A: listaEquiposClon
        .filter((e) => e.liga === "LIGA_A")
        .sort(funcionOrdenamientoAvanzado),
      LIGA_B: listaEquiposClon
        .filter((e) => e.liga === "LIGA_B")
        .sort(funcionOrdenamientoAvanzado),
    };
  },

  // =============================================================================
  // MÉTODOS DE CONSULTA Y SELECCIÓN
  // =============================================================================

  getNombreEquipo(equipoId) {
    if (!equipoId) return "Equipo";
    if (this.equiposMap[String(equipoId)]) {
      return this.equiposMap[String(equipoId)].nombre;
    }
    const eq = this._equipos.find((e) => String(e.id) === String(equipoId));
    return eq ? eq.nombre : `Equipo (${equipoId})`;
  },

  obtenerEquiposPosiciones() {
    return this.ligasData[this._currentLigaPosiciones] || [];
  },

  obtenerPartidosFixture() {
    return this._fixture.filter((p) => {
      const ligaPartido = String(p.liga || p.liga_id || "").trim();
      return (
        ligaPartido === this._currentLigaFixture &&
        Number(p.fecha_numero) === Number(this._currentFechaFiltro)
      );
    });
  },

  obtenerMaxFechasFixture() {
    return this._fixture.length > 0
      ? Math.max(...this._fixture.map((p) => Number(p.fecha_numero || 1)))
      : 5;
  },

  obtenerEquiposGrid() {
    let deLiga = this.ligasData[this._currentLigaEquipos] || [];
    const texto = this._filtroTextoEquipos.toLowerCase().trim();
    if (texto !== "") {
      return deLiga.filter((e) => e.nombre.toLowerCase().includes(texto));
    }
    return deLiga;
  },

  obtenerJugadoresDeEquipo(equipoId) {
    return this._jugadores.filter(
      (j) => String(j.equipo_id) === String(equipoId),
    );
  },

  obtenerJugadorPorId(jugadorId) {
    return (
      this._jugadores.find((j) => Number(j.id) === Number(jugadorId)) || {
        id: jugadorId,
        nombre: "Jugador",
      }
    );
  },

  obtenerPlanillaPartidoCache(partidoId) {
    return this._fixtureDetallesCache[partidoId] || null;
  },

  guardarPlanillaEnCache(partidoId, data) {
    this._fixtureDetallesCache[partidoId] = data;
  },

  obtenerHistorialJugador(jugadorId) {
    if (!jugadorId || !this._todosDetallesJuegos) return [];

    return this._todosDetallesJuegos
      .filter(
        (d) =>
          Number(d.local_jugador1_id) === Number(jugadorId) ||
          Number(d.local_jugador2_id) === Number(jugadorId) ||
          Number(d.visitante_jugador1_id) === Number(jugadorId) ||
          Number(d.visitante_jugador2_id) === Number(jugadorId),
      )
      .map((d) => {
        const partidoPadre = (this._fixture || []).find(
          (f) => Number(f.id) === Number(d.partido_id),
        );
        return {
          ...d,
          fecha_numero: partidoPadre ? partidoPadre.fecha_numero : "",
          local_equipo_id: partidoPadre ? partidoPadre.local_id : null,
          visitante_equipo_id: partidoPadre ? partidoPadre.visitante_id : null,
        };
      });
  },

  obtenerEquipoLibreJornada() {
    const equiposDeLiga = this.ligasData[this._currentLigaFixture] || [];
    if (equiposDeLiga.length === 0) return null;

    const partidosFecha = this.obtenerPartidosFixture();
    const idsOcupados = new Set();

    partidosFecha.forEach((p) => {
      if (p.local_id !== null && p.local_id !== undefined) {
        idsOcupados.add(String(p.local_id));
      }
      if (p.visitante_id !== null && p.visitante_id !== undefined) {
        idsOcupados.add(String(p.visitante_id));
      }
    });

    const equipoLibreObj = equiposDeLiga.find(
      (eq) => !idsOcupados.has(String(eq.id)),
    );

    if (!equipoLibreObj) return null;

    return {
      id: equipoLibreObj.id,
      nombre: equipoLibreObj.nombre,
      logo: equipoLibreObj.logo || "assets/logos/generic-pingpong.png",
    };
  },

  obtenerNombreJugadorLocal(jugadorId) {
    if (!jugadorId) return "W.O. / Sin asignar";
    const j = this._jugadores.find(
      (jug) => Number(jug.id) === Number(jugadorId),
    );
    return j ? j.nombre : `Jugador (${jugadorId})`;
  },

  obtenerPlayoffsLiga(ligaId) {
    return this.playoffsData[ligaId || "LIGA_A"] || [];
  },

  obtenerPartidoPorIdUnificado(partidoId) {
    // 1. Buscar en Fixture Regular
    const partidoRegular = this._fixture.find(
      (p) => String(p.id) === String(partidoId),
    );
    if (partidoRegular) {
      return { ...partidoRegular, esPlayoff: false };
    }

    // 2. Buscar en Playoffs
    const todosPlayoffs = [
      ...(this.playoffsData.LIGA_A || []),
      ...(this.playoffsData.LIGA_B || []),
    ];
    const partidoPlayoff = todosPlayoffs.find(
      (p) => String(p.id) === String(partidoId),
    );
    if (partidoPlayoff) {
      return {
        ...partidoPlayoff,
        esPlayoff: true,
        local_id: partidoPlayoff.equipo_1_id,
        visitante_id: partidoPlayoff.equipo_2_id,
        score_local: partidoPlayoff.puntos_equipo_1,
        score_visitante: partidoPlayoff.puntos_equipo_2,
      };
    }

    return null;
  },

  // =======================================================================
  // PROPAGACIÓN Y AVANCE DE LLAVES EN PLAYOFFS
  // =======================================================================
  actualizarAvancePlayoffs(liga) {
    const lista = this.playoffsData[liga] || [];
    if (lista.length === 0) return;

    const qf1 = lista.find((p) => p.codigo_llave === "QF1");
    const qf2 = lista.find((p) => p.codigo_llave === "QF2");
    const sf1 = lista.find((p) => p.codigo_llave === "SF1");
    const sf2 = lista.find((p) => p.codigo_llave === "SF2");
    const final = lista.find((p) => p.codigo_llave === "FINAL");

    // A. Asignar 1° y 2° de Fase Regular a Semifinales
    const posiciones = this.ligasData[liga] || [];
    if (posiciones.length >= 2) {
      if (sf1 && !sf1.equipo_1_id) sf1.equipo_1_id = String(posiciones[0].id);
      if (sf2 && !sf2.equipo_1_id) sf2.equipo_1_id = String(posiciones[1].id);
    }

    // B. Avanzar ganador QF2 a SF1 (equipo_2_id)
    if (qf2 && (qf2.estado === "FINALIZADO" || qf2.ganador_id) && sf1) {
      sf1.equipo_2_id = qf2.ganador_id;
    }

    // C. Avanzar ganador QF1 a SF2 (equipo_2_id)
    if (qf1 && (qf1.estado === "FINALIZADO" || qf1.ganador_id) && sf2) {
      sf2.equipo_2_id = qf1.ganador_id;
    }

    // D. Avanzar ganador SF1 a FINAL (equipo_1_id)
    if (sf1 && (sf1.estado === "FINALIZADO" || sf1.ganador_id) && final) {
      final.equipo_1_id = sf1.ganador_id;
    }

    // E. Avanzar ganador SF2 a FINAL (equipo_2_id)
    if (sf2 && (sf2.estado === "FINALIZADO" || sf2.ganador_id) && final) {
      final.equipo_2_id = sf2.ganador_id;
    }
  },
};