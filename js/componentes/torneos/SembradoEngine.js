// js/componentes/torneos/SembradoEngine.js

export class SembradoEngine {
  static normalizarCategoria(categoria = "") {
    return String(categoria || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
  }

  static esCategoriaOrdenPorInscripcion(categoria = "") {
    const cat = this.normalizarCategoria(categoria);
    return cat === "sub13" || cat === "quinta";
  }

  /**
   * Calcula los tamaños de cada zona:
   * - Ideal: 3 jugadores por zona.
   * - Si no es múltiplo de 3, las zonas de 4 quedan al final.
   */
  static calcularTamanosZonas(totalJugadores) {
    const total = Number(totalJugadores || 0);
    if (total <= 0) return [];
    if (total < 3) return [total];

    const resto = total % 3;
    if (resto === 0) {
      return Array(total / 3).fill(3);
    }
    if (resto === 1) {
      const zonasDe4 = 1;
      const zonasDe3 = (total - 4) / 3;
      return [...Array(zonasDe3).fill(3), ...Array(zonasDe4).fill(4)];
    }

    // resto === 2
    if (total < 6) {
      return [3, total - 3];
    }
    const zonasDe4 = 2;
    const zonasDe3 = (total - 8) / 3;
    return [...Array(zonasDe3).fill(3), ...Array(zonasDe4).fill(4)];
  }

  static obtenerMarcaTiempoInscripcion(jugador) {
    if (typeof jugador.inscripcionOrden === "number") {
      return jugador.inscripcionOrden;
    }
    if (typeof jugador.inscripcion_orden === "number") {
      return jugador.inscripcion_orden;
    }
    const fechaRaw = jugador.inscripcion_created_at || jugador.created_at;
    if (!fechaRaw) return Number.MAX_SAFE_INTEGER;
    const ts = new Date(fechaRaw).getTime();
    return Number.isFinite(ts) ? ts : Number.MAX_SAFE_INTEGER;
  }

  /**
   * Ordena jugadores de mayor a menor puntaje.
   * Sin rating (0 / null):
   * - Sub-13 y Quinta: orden por inscripción.
   * - Resto de categorías: toman el valor más bajo de la categoría.
   */
  static ordenarJugadoresParaSembrado(jugadores = [], categoria = "") {
    const lista = (Array.isArray(jugadores) ? jugadores : []).map((j, idx) => {
      const puntosRaw = Number(j.puntos ?? j.puntos_ranking ?? 0);
      const tieneRating = Number.isFinite(puntosRaw) && puntosRaw > 0;
      const clubIdNormalizado =
        j.club_id === null ||
        j.club_id === undefined ||
        String(j.club_id).trim() === ""
          ? null
          : String(j.club_id);

      return {
        ...j,
        club_id: clubIdNormalizado,
        puntosOriginales: tieneRating ? puntosRaw : 0,
        tieneRating,
        _ordenInscripcion:
          j.inscripcionOrden ??
          j.inscripcion_orden ??
          (this.obtenerMarcaTiempoInscripcion(j) !== Number.MAX_SAFE_INTEGER
            ? this.obtenerMarcaTiempoInscripcion(j)
            : idx + 1),
        _idxOriginal: idx,
      };
    });

    const conRating = lista
      .filter((j) => j.tieneRating)
      .sort((a, b) => {
        if (b.puntosOriginales !== a.puntosOriginales) {
          return b.puntosOriginales - a.puntosOriginales;
        }
        if (a._ordenInscripcion !== b._ordenInscripcion) {
          return a._ordenInscripcion - b._ordenInscripcion;
        }
        return String(a.id).localeCompare(String(b.id));
      });

    const sinRating = lista
      .filter((j) => !j.tieneRating)
      .sort((a, b) => {
        if (a._ordenInscripcion !== b._ordenInscripcion) {
          return a._ordenInscripcion - b._ordenInscripcion;
        }
        return String(a.id).localeCompare(String(b.id));
      });

    const usarOrdenInscripcion = this.esCategoriaOrdenPorInscripcion(categoria);
    const puntajeMinimoCategoria =
      conRating.length > 0
        ? Math.min(...conRating.map((j) => j.puntosOriginales))
        : 0;

    const conRatingAjustados = conRating.map((j) => ({
      ...j,
      puntosEfectivos: j.puntosOriginales,
    }));

    const sinRatingAjustados = sinRating.map((j) => ({
      ...j,
      puntosEfectivos: usarOrdenInscripcion ? 0 : puntajeMinimoCategoria,
    }));

    return usarOrdenInscripcion
      ? [...conRatingAjustados, ...sinRatingAjustados]
      : [...conRatingAjustados, ...sinRatingAjustados].sort((a, b) => {
          if (b.puntosEfectivos !== a.puntosEfectivos) {
            return b.puntosEfectivos - a.puntosEfectivos;
          }
          if (a._ordenInscripcion !== b._ordenInscripcion) {
            return a._ordenInscripcion - b._ordenInscripcion;
          }
          return String(a.id).localeCompare(String(b.id));
        });
  }

  /**
   * Asigna en serpiente:
   * - Fila 0 (cabezas de serie): Zona 1 -> Zona N
   * - Fila 1: Zona N -> Zona 1
   * - Fila 2: Zona 1 -> Zona N, etc.
   */
  static asignarEnSerpiente(jugadoresOrdenados = [], tamanosZonas = []) {
    const numZonas = tamanosZonas.length;
    const zonas = Array.from({ length: numZonas }, (_, i) => ({
      numeroZona: i + 1,
      capacidad: tamanosZonas[i],
      jugadores: [],
    }));

    const maxFilas = Math.max(0, ...tamanosZonas);
    let cursor = 0;

    for (let fila = 0; fila < maxFilas; fila++) {
      const vaHaciaAbajo = fila % 2 === 0;
      const indicesZona = vaHaciaAbajo
        ? Array.from({ length: numZonas }, (_, i) => i)
        : Array.from({ length: numZonas }, (_, i) => numZonas - 1 - i);

      for (const zIdx of indicesZona) {
        if (fila < tamanosZonas[zIdx] && cursor < jugadoresOrdenados.length) {
          const jugador = {
            ...jugadoresOrdenados[cursor],
            posicionEnZona: fila + 1,
            esCabezaDeSerie: fila === 0,
            intercambiadoPorClub: false,
          };
          zonas[zIdx].jugadores.push(jugador);
          cursor++;
        }
      }
    }

    return zonas;
  }

  /**
   * Cuenta cuántos jugadores comparten el mismo club_id dentro de una misma zona.
   * club_id === null (sin club / libre) no genera choque.
   */
  static contarChoquesClubEnZona(jugadoresZona = []) {
    const conteoPorClub = new Map();
    for (const j of jugadoresZona) {
      if (!j || !j.club_id) continue;
      conteoPorClub.set(j.club_id, (conteoPorClub.get(j.club_id) || 0) + 1);
    }

    let choques = 0;
    for (const cantidad of conteoPorClub.values()) {
      if (cantidad > 1) {
        choques += cantidad - 1;
      }
    }
    return choques;
  }

  static contarTotalChoquesClub(zonas = []) {
    return zonas.reduce(
      (acc, zona) => acc + this.contarChoquesClubEnZona(zona.jugadores || []),
      0,
    );
  }

  /**
   * Intenta eliminar o minimizar choques del mismo club en una zona intercambiando
   * jugadores de la MISMA posición (fila) entre distintas zonas.
   * Nunca intercambia cabezas de serie (fila === 0).
   */
  static balancearClubesMismaPosicion(zonas = []) {
    const copiaZonas = zonas.map((z) => ({
      ...z,
      jugadores: (z.jugadores || []).map((j) => ({ ...j })),
    }));

    const numZonas = copiaZonas.length;
    if (numZonas <= 1) return copiaZonas;

    const maxFilas = Math.max(0, ...copiaZonas.map((z) => z.jugadores.length));
    let choquesActuales = this.contarTotalChoquesClub(copiaZonas);
    if (choquesActuales === 0) return copiaZonas;

    const maxIteraciones = numZonas * maxFilas * 4;
    for (let iter = 0; iter < maxIteraciones; iter++) {
      if (choquesActuales === 0) break;
      let huboMejora = false;

      // Empezamos desde fila = 1 para no mover cabezas de serie (fila = 0)
      for (let fila = 1; fila < maxFilas; fila++) {
        for (let zA = 0; zA < numZonas; zA++) {
          if (fila >= copiaZonas[zA].jugadores.length) continue;

          for (let zB = zA + 1; zB < numZonas; zB++) {
            if (fila >= copiaZonas[zB].jugadores.length) continue;

            const jA = copiaZonas[zA].jugadores[fila];
            const jB = copiaZonas[zB].jugadores[fila];

            // Si ambos son libres o tienen el mismo club, intercambiarlos no cambia choques
            if (jA.club_id === jB.club_id) continue;

            copiaZonas[zA].jugadores[fila] = jB;
            copiaZonas[zB].jugadores[fila] = jA;

            const nuevosChoques = this.contarTotalChoquesClub(copiaZonas);
            if (nuevosChoques < choquesActuales) {
              choquesActuales = nuevosChoques;
              copiaZonas[zA].jugadores[fila].intercambiadoPorClub = true;
              copiaZonas[zB].jugadores[fila].intercambiadoPorClub = true;
              huboMejora = true;
            } else {
              // Revertir si no mejora
              copiaZonas[zA].jugadores[fila] = jA;
              copiaZonas[zB].jugadores[fila] = jB;
            }
          }
        }
      }

      if (!huboMejora) break;
    }

    // Normalizar posicionEnZona tras posibles intercambios
    return copiaZonas.map((zona) => ({
      ...zona,
      jugadores: zona.jugadores.map((j, idx) => ({
        ...j,
        posicionEnZona: idx + 1,
        esCabezaDeSerie: idx === 0,
      })),
      choquesClub: this.contarChoquesClubEnZona(zona.jugadores),
    }));
  }

  /**
   * Ejecuta el sembrado completo para una categoría.
   */
  static generarSembrado({ jugadores = [], categoria = "" }) {
    const ordenados = this.ordenarJugadoresParaSembrado(jugadores, categoria);
    const tamanosZonas = this.calcularTamanosZonas(ordenados.length);
    const zonasSerpiente = this.asignarEnSerpiente(ordenados, tamanosZonas);
    const zonasBalanceadas = this.balancearClubesMismaPosicion(zonasSerpiente);

    return {
      categoria,
      totalJugadores: ordenados.length,
      tamanosZonas,
      totalZonas: zonasBalanceadas.length,
      choquesClubRestantes: this.contarTotalChoquesClub(zonasBalanceadas),
      ordenados,
      zonas: zonasBalanceadas,
    };
  }

  /**
   * Utilidad para ajuste manual (futuro rol superusuario / token):
   * mueve un jugador desde zonaOrigen hacia zonaDestino.
   */
  static moverJugadorManual(zonas = [], jugadorId, zonaDestinoNumero) {
    const copia = zonas.map((z) => ({
      ...z,
      jugadores: [...(z.jugadores || [])],
    }));

    let jugadorMovido = null;
    for (const zona of copia) {
      const idx = zona.jugadores.findIndex(
        (j) => String(j.id) === String(jugadorId),
      );
      if (idx !== -1) {
        [jugadorMovido] = zona.jugadores.splice(idx, 1);
        break;
      }
    }

    if (!jugadorMovido) return copia;

    const destino = copia.find(
      (z) => Number(z.numeroZona) === Number(zonaDestinoNumero),
    );
    if (!destino) return copia;

    destino.jugadores.push({
      ...jugadorMovido,
      ajusteManual: true,
    });

    return copia.map((zona) => ({
      ...zona,
      capacidad: Math.max(zona.capacidad, zona.jugadores.length),
      jugadores: zona.jugadores.map((j, idx) => ({
        ...j,
        posicionEnZona: idx + 1,
        esCabezaDeSerie: idx === 0,
      })),
      choquesClub: this.contarChoquesClubEnZona(zona.jugadores),
    }));
  }
}
