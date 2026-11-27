// js/componentes/torneos/SembradoService.js
import { SembradoEngine } from "./SembradoEngine.js";

export class SembradoService {
  constructor(clienteSupabase = null) {
    this.supabase = clienteSupabase;
  }

  async obtenerCliente() {
    if (this.supabase) return this.supabase;
    if (window.supabase) {
      this.supabase = window.supabase;
      return this.supabase;
    }
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 100));
      if (window.supabase) {
        this.supabase = window.supabase;
        return this.supabase;
      }
    }
    throw new Error("Cliente de Supabase no disponible.");
  }

  static normalizarCategoria(valor = "") {
    return String(valor || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
  }

  /**
   * Obtiene los jugadores inscriptos en un torneo para una categoría dada,
   * ordenados inicialmente por fecha de inscripción (created_at).
   */
  async obtenerInscriptosCategoria(torneoId, categoria) {
    const supabase = await this.obtenerCliente();

    const { data: inscripciones, error: errInsc } = await supabase
      .from("inscripciones")
      .select("id, torneo_id, jugador_id, categorias, created_at")
      .eq("torneo_id", torneoId)
      .order("created_at", { ascending: true });

    if (errInsc) throw errInsc;

    const catBuscada = SembradoService.normalizarCategoria(categoria);
    const filtradas = (inscripciones || []).filter((insc) => {
      const cats = Array.isArray(insc.categorias)
        ? insc.categorias
        : typeof insc.categorias === "string"
          ? insc.categorias.split(",")
          : [];
      return cats.some(
        (c) => SembradoService.normalizarCategoria(c) === catBuscada,
      );
    });

    if (filtradas.length === 0) return [];

    const jugadorIds = [
      ...new Set(filtradas.map((i) => i.jugador_id).filter(Boolean)),
    ];

    const [
      { data: jugadores, error: errJug },
      { data: clubes, error: errClub },
    ] = await Promise.all([
      supabase
        .from("jugadores")
        .select(
          "id, nombre, club_id, equipo_id, puntos_ranking, categoria_ranking",
        )
        .in("id", jugadorIds),
      supabase.from("clubes").select("id, nombre"),
    ]);

    if (errJug) throw errJug;
    if (errClub) throw errClub;

    const mapaClubes = new Map(
      (clubes || []).map((c) => [String(c.id), c.nombre]),
    );
    const mapaJugadores = new Map(
      (jugadores || []).map((j) => [String(j.id), j]),
    );

    return filtradas
      .map((insc, index) => {
        const jug = mapaJugadores.get(String(insc.jugador_id));
        if (!jug) return null;

        const clubId = jug.club_id ?? null;
        return {
          id: jug.id,
          inscripcion_id: insc.id,
          inscripcion_orden: index + 1,
          inscripcion_created_at: insc.created_at,
          nombre: jug.nombre,
          club_id: clubId,
          nombre_club: clubId
            ? mapaClubes.get(String(clubId)) || "Sin Club"
            : "Sin Club",
          puntos: Number(jug.puntos_ranking ?? 0),
          puntos_ranking: Number(jug.puntos_ranking ?? 0),
        };
      })
      .filter(Boolean);
  }

  /**
   * Consulta las zonas ya guardadas para un torneo y categoría.
   */
  async obtenerZonasGuardadas(torneoId, categoria) {
    const supabase = await this.obtenerCliente();

    const { data: zonas, error: errZonas } = await supabase
      .from("torneo_zonas")
      .select(
        "id, torneo_id, categoria, numero_zona, capacidad, bloqueada, created_at",
      )
      .eq("torneo_id", torneoId)
      .eq("categoria", categoria)
      .order("numero_zona", { ascending: true });

    if (errZonas) throw errZonas;
    if (!zonas || zonas.length === 0) return [];

    const zonaIds = zonas.map((z) => z.id);
    const { data: asignaciones, error: errAsig } = await supabase
      .from("torneo_zona_jugadores")
      .select(
        `
        id, zona_id, jugador_id, club_id, posicion_en_zona,
        es_cabeza_de_serie, puntos_ranking, puntos_efectivos, ajuste_manual,
        jugadores ( id, nombre, club_id ),
        clubes ( id, nombre )
      `,
      )
      .in("zona_id", zonaIds)
      .order("posicion_en_zona", { ascending: true });

    if (errAsig) throw errAsig;

    const porZona = new Map();
    for (const row of asignaciones || []) {
      const lista = porZona.get(row.zona_id) || [];
      lista.push({
        id: row.jugador_id,
        asignacion_id: row.id,
        nombre: row.jugadores?.nombre || `Jugador #${row.jugador_id}`,
        club_id: row.club_id ?? row.jugadores?.club_id ?? null,
        nombre_club: row.clubes?.nombre || "Sin Club",
        posicionEnZona: row.posicion_en_zona,
        esCabezaDeSerie: row.es_cabeza_de_serie,
        puntos: row.puntos_ranking,
        puntosEfectivos: row.puntos_efectivos,
        ajusteManual: row.ajuste_manual,
      });
      porZona.set(row.zona_id, lista);
    }

    return zonas.map((z) => {
      const jugadoresZona = porZona.get(z.id) || [];
      return {
        id: z.id,
        numeroZona: z.numero_zona,
        capacidad: z.capacidad,
        bloqueada: z.bloqueada,
        jugadores: jugadoresZona,
        choquesClub: SembradoEngine.contarChoquesClubEnZona(jugadoresZona),
      };
    });
  }

  /**
   * Guarda (reemplazando si ya existían para ese torneo + categoría) las zonas calculadas.
   */
  async guardarZonas(torneoId, categoria, zonas = []) {
    const supabase = await this.obtenerCliente();

    // Eliminar zonas previas de esa categoría en el torneo (cascada borra asignaciones)
    const { error: errDelete } = await supabase
      .from("torneo_zonas")
      .delete()
      .eq("torneo_id", torneoId)
      .eq("categoria", categoria);

    if (errDelete) throw errDelete;
    if (!Array.isArray(zonas) || zonas.length === 0) return [];

    for (const zona of zonas) {
      const { data: zonaInsertada, error: errZona } = await supabase
        .from("torneo_zonas")
        .insert({
          torneo_id: torneoId,
          categoria,
          numero_zona: zona.numeroZona,
          capacidad: zona.capacidad ?? zona.jugadores?.length ?? 3,
          bloqueada: Boolean(zona.bloqueada),
        })
        .select("id, numero_zona, capacidad, bloqueada")
        .single();

      if (errZona) throw errZona;

      const filasJugadores = (zona.jugadores || []).map((j, idx) => ({
        zona_id: zonaInsertada.id,
        jugador_id: j.id,
        club_id: j.club_id || null,
        posicion_en_zona: j.posicionEnZona ?? idx + 1,
        es_cabeza_de_serie: Boolean(j.esCabezaDeSerie ?? idx === 0),
        puntos_ranking: Number(j.puntos ?? j.puntos_ranking ?? 0),
        puntos_efectivos: Number(j.puntosEfectivos ?? j.puntos ?? 0),
        ajuste_manual: Boolean(j.ajusteManual),
      }));

      if (filasJugadores.length > 0) {
        const { error: errJugInsert } = await supabase
          .from("torneo_zona_jugadores")
          .insert(filasJugadores);
        if (errJugInsert) throw errJugInsert;
      }
    }

    return this.obtenerZonasGuardadas(torneoId, categoria);
  }

  /**
   * Flujo principal:
   * - Si ya existen zonas guardadas y no se fuerza regenerar, las devuelve (modo lectura).
   * - Si la inscripción está cerrada y aún no hay zonas (o forzarRegenerar = true),
   *   calcula el sembrado en serpiente y lo persiste automáticamente.
   */
  async obtenerOGenerarSembrado({
    torneoId,
    categoria,
    inscripcionCerrada = false,
    forzarRegenerar = false,
  }) {
    const existentes = await this.obtenerZonasGuardadas(torneoId, categoria);
    if (existentes.length > 0 && !forzarRegenerar) {
      return {
        origen: "guardado",
        categoria,
        totalZonas: existentes.length,
        choquesClubRestantes: SembradoEngine.contarTotalChoquesClub(existentes),
        zonas: existentes,
      };
    }

    if (!inscripcionCerrada && !forzarRegenerar) {
      return {
        origen: "pendiente_cierre",
        categoria,
        totalZonas: 0,
        choquesClubRestantes: 0,
        zonas: [],
      };
    }

    const inscriptos = await this.obtenerInscriptosCategoria(
      torneoId,
      categoria,
    );
    const resultado = SembradoEngine.generarSembrado({
      jugadores: inscriptos,
      categoria,
    });

    const zonasPersistidas = await this.guardarZonas(
      torneoId,
      categoria,
      resultado.zonas,
    );

    return {
      ...resultado,
      origen: "generado_automatico",
      zonas: zonasPersistidas,
    };
  }
}
