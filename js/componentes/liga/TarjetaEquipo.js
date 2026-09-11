// js/componentes/liga/TarjetaEquipo.js

export const TarjetaEquipo = {
  /**
   * Renderiza la grilla de selección de equipos
   */
  renderGrid(equipos, jugadores, equipoSeleccionadoId) {
    if (!equipos || equipos.length === 0) {
      return `
                <div class="col-span-full text-center py-12 text-gray-400 text-sm bg-white rounded-xl border border-gray-100 shadow-sm">
                    No se encontraron equipos para esta liga.
                </div>
            `;
    }

    return equipos
      .map((equipo) => {
        const esSeleccionado =
          String(equipo.id) === String(equipoSeleccionadoId);
        const cantJugadores = (jugadores || []).filter(
          (j) => String(j.equipo_id) === String(equipo.id),
        ).length;

        return `
                <button onclick="window.seleccionarEquipoDetalle('${equipo.id}')" 
                        class="p-4 rounded-xl border transition-all text-left flex items-center justify-between gap-3 cursor-pointer ${
                          esSeleccionado
                            ? "bg-blue-50/50 border-[#003366] ring-2 ring-[#003366]/20 shadow-sm"
                            : "bg-white border-gray-100 hover:border-gray-300 shadow-2xs hover:shadow-xs"
                        }">
                    <div class="flex items-center gap-3 min-w-0">
                        <img src="${equipo.logo || "assets/logos/generic-pingpong.png"}" 
                             onerror="this.onerror=null; this.src='assets/logos/generic-pingpong.png';" 
                             class="w-10 h-10 object-contain shrink-0" alt="${equipo.nombre}">
                        <div class="min-w-0">
                            <h4 class="text-sm font-bold text-gray-800 truncate">${equipo.nombre}</h4>
                            <span class="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                                <i class="fas fa-check-circle text-[10px]"></i> ${cantJugadores} Jugadores
                            </span>
                        </div>
                    </div>
                </button>
            `;
      })
      .join("");
  },

  /**
   * Renderiza las tarjetas de jugadores dentro de la Lista de Buena Fe
   * Permite hacer clic para abrir el historial del jugador
   */
  renderJugadores(jugadores, detallesPartidos, maxFechas) {
    if (!jugadores || jugadores.length === 0) {
      return `
                <div class="col-span-full text-center py-8 text-gray-400 text-xs italic bg-white rounded-xl border border-gray-100">
                    No hay jugadores registrados en la lista de buena fe de este equipo.
                </div>
            `;
    }

    return jugadores
      .map((jugador) => {
        // Inicial de la avatar / avatar genérico
        const inicial = jugador.nombre
          ? jugador.nombre.charAt(0).toUpperCase()
          : "J";

        // Filtrar partidos donde participó el jugador
        const partidosJugados = (detallesPartidos || []).filter(
          (d) =>
            !d.esPlayoff && // Se excluyen partidos de playoffs de la asistencia
            (Number(d.local_jugador1_id) === Number(jugador.id) ||
              Number(d.local_jugador2_id) === Number(jugador.id) ||
              Number(d.visitante_jugador1_id) === Number(jugador.id) ||
              Number(d.visitante_jugador2_id) === Number(jugador.id)),
        );

        // Agrupar por número de fecha única (fecha_numero o partido_id como respaldo)
        const fechasUnicasSet = new Set(
          partidosJugados.map((p) => p.fecha_numero || p.partido_id),
        );

        // Si maxFechas está definido, las fechas contabilizadas no pueden exceder la cantidad total
        const totalFechasValidas = maxFechas > 0 ? maxFechas : 1;
        const fechasUnicas = Math.min(fechasUnicasSet.size, totalFechasValidas);

        // Cálculo de porcentaje con tope en 100%
        const porcentajeCalculado = Math.round(
          (fechasUnicas / totalFechasValidas) * 100,
        );
        const porcentajePresencia = Math.min(100, porcentajeCalculado);

        return `
                <div onclick="window.verDetalleJugador('${jugador.id}', '${jugador.equipo_id}')" 
                     class="bg-white rounded-xl border border-gray-100 p-3.5 flex items-center justify-between gap-3 hover:border-[#003366]/40 hover:shadow-md transition-all cursor-pointer group">
                    
                    <div class="flex items-center gap-3 min-w-0">
                        <!-- Avatar con inicial -->
                        <div class="w-9 h-9 rounded-full bg-slate-100 text-[#003366] font-bold flex items-center justify-center text-sm shrink-0 group-hover:bg-[#003366] group-hover:text-white transition-colors">
                            ${inicial}
                        </div>
                        
                        <!-- Nombre e Info -->
                        <div class="min-w-0">
                            <h5 class="text-xs font-bold text-gray-800 group-hover:text-[#003366] transition-colors truncate">
                                ${jugador.nombre}
                            </h5>
                            <span class="text-[10px] text-gray-400 block mt-0.5">
                                Fechas: ${fechasUnicas} / ${maxFechas || 0}
                            </span>
                        </div>
                    </div>

                    <!-- Badge Presencia -->
                    <div class="shrink-0 text-right">
                        <span class="px-2 py-1 rounded-md text-[10px] font-bold bg-slate-100 text-gray-600 group-hover:bg-blue-50 group-hover:text-[#003366] transition-colors">
                            ${porcentajePresencia}% Pres.
                        </span>
                    </div>
                </div>
            `;
      })
      .join("");
  },
};
