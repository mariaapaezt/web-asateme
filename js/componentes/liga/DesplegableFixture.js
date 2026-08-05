// js/componentes/liga/DesplegableFixture.js

export const DesplegableFixture = {
    /**
     * Renderiza el contenedor HTML para la planilla desplegable
     */
    renderContenedor(partidoId) {
        return `
            <div id="contenedor-detalle-${partidoId}" class="hidden bg-slate-50/70 border-t border-gray-100 p-4 transition-all">
                <div class="text-[11px] font-bold text-gray-400 tracking-wider uppercase mb-3 flex items-center gap-1.5">
                    <i class="far fa-id-card text-xs"></i> DETALLE DE LA PLANILLA
                </div>
                <div id="planilla-rows-${partidoId}" class="space-y-3">
                    <!-- Inyectado mediante renderLineasPlanilla -->
                </div>
            </div>
        `;
    },

    /**
     * Renderiza los partidos individuales con resalte dinamico Set por Set
     */
    renderLineasPlanilla(detalles, obtenerNombreJugador) {
        if (!detalles || detalles.length === 0) {
            return `
                <div class="text-center py-4 text-gray-400 text-xs italic bg-white rounded-xl border border-gray-100">
                    No hay partidos individuales registrados para este encuentro.
                </div>
            `;
        }

        const listaOrdenada = [...detalles].sort((a, b) => (a.orden || 0) - (b.orden || 0));

        return listaOrdenada.map(juego => {
            const modalidad = juego.modalidad ? juego.modalidad.toUpperCase() : (juego.local_jugador2_id ? 'DOBLES' : 'SINGLE');

            let nombreLoc = obtenerNombreJugador(juego.local_jugador1_id) || 'Jugador Local';
            if (juego.local_jugador2_id) {
                nombreLoc += ` / ${obtenerNombreJugador(juego.local_jugador2_id)}`;
            }

            let nombreVis = obtenerNombreJugador(juego.visitante_jugador1_id) || 'Jugador Visitante';
            if (juego.visitante_jugador2_id) {
                nombreVis += ` / ${obtenerNombreJugador(juego.visitante_jugador2_id)}`;
            }

            const setsLoc = juego.score_sets_local ?? 0;
            const setsVis = juego.score_sets_visitante ?? 0;

            // Ganador del partido global (para el punto verde y nombre del jugador)
            const ganoPartidoLocal = Number(setsLoc) > Number(setsVis);
            const ganoPartidoVisitante = Number(setsVis) > Number(setsLoc);

            const setsLocalArr = Array.isArray(juego.sets_local) ? juego.sets_local : [];
            const setsVisitanteArr = Array.isArray(juego.sets_visitante) ? juego.sets_visitante : [];

            return `
                <div class="bg-white rounded-xl border border-gray-200/70 p-3 shadow-xs">
                    <!-- Modalidad -->
                    <div class="text-[10px] font-bold text-gray-400 tracking-wider uppercase mb-1.5">
                        ${modalidad}
                    </div>

                    <div class="flex items-center justify-between gap-3">
                        <!-- Nombres Jugadores e Indicadores -->
                        <div class="flex-1 min-w-0 space-y-1">
                            <div class="flex items-center gap-1.5 text-xs ${ganoPartidoLocal ? 'font-bold text-gray-900' : 'text-gray-500'}">
                                ${ganoPartidoLocal ? '<span class="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>' : '<span class="w-2 h-2 shrink-0"></span>'}
                                <span class="truncate">${nombreLoc}</span>
                            </div>
                            <div class="flex items-center gap-1.5 text-xs ${ganoPartidoVisitante ? 'font-bold text-gray-900' : 'text-gray-500'}">
                                ${ganoPartidoVisitante ? '<span class="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>' : '<span class="w-2 h-2 shrink-0"></span>'}
                                <span class="truncate">${nombreVis}</span>
                            </div>
                        </div>

                        <!-- Detalle por Set (S1..S5) con resaltado individual -->
                        <div class="flex items-center gap-2 text-center shrink-0">
                            ${[0, 1, 2, 3, 4].map(i => {
                const pLoc = Number(setsLocalArr[i] ?? 0);
                const pVis = Number(setsVisitanteArr[i] ?? 0);

                // Evaluación individual del Set
                const ganoSetLocal = pLoc > pVis && (pLoc > 0 || pVis > 0);
                const ganoSetVisitante = pVis > pLoc && (pLoc > 0 || pVis > 0);

                return `
                                    <div class="w-5 text-[10px]">
                                        <div class="text-gray-300 font-bold mb-0.5">S${i + 1}</div>
                                        <div class="${ganoSetLocal ? 'font-bold text-gray-900' : 'text-gray-400'}">${pLoc}</div>
                                        <div class="${ganoSetVisitante ? 'font-bold text-gray-900' : 'text-gray-400'}">${pVis}</div>
                                    </div>
                                `;
            }).join('')}
                        </div>

                        <!-- Marcador Final de Sets -->
                        <div class="ml-2 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50/50 text-xs font-black text-[#003366] shrink-0 min-w-[52px] text-center">
                            ${setsLoc} - ${setsVis}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
};