// js/componentes/liga/PlayoffDetalleModal.js

export const PlayoffDetalleModal = {
    renderLineasPlanilla(detalles, obtenerNombreJugador) {
        if (!detalles || detalles.length === 0) {
            return `
                <div class="text-center py-6 text-gray-400 text-xs italic bg-white rounded-xl border border-gray-100">
                    <i class="far fa-folder-open text-base mb-1.5 block opacity-50"></i>
                    No hay información de partidos individuales registrada para esta serie.
                </div>
            `;
        }

        const listaOrdenada = [...detalles].sort((a, b) => (a.orden || 0) - (b.orden || 0));

        return listaOrdenada.map(juego => {
            const modalidad = juego.modalidad ? juego.modalidad.toUpperCase() : (juego.local_jugador2_id ? 'DOBLES' : 'SINGLE');

            // Nombres de Jugadores
            let nombreLoc = obtenerNombreJugador(juego.local_jugador1_id) || 'Jugador Local';
            if (juego.local_jugador2_id) {
                nombreLoc += ` / ${obtenerNombreJugador(juego.local_jugador2_id)}`;
            }

            let nombreVis = obtenerNombreJugador(juego.visitante_jugador1_id) || 'Jugador Visitante';
            if (juego.visitante_jugador2_id) {
                nombreVis += ` / ${obtenerNombreJugador(juego.visitante_jugador2_id)}`;
            }

            // 1. MARCADOR FINAL EN SETS DEL PARTIDO
            const setsLoc = juego.score_sets_local ?? 0;
            const setsVis = juego.score_sets_visitante ?? 0;

            const ganoPartidoLocal = Number(setsLoc) > Number(setsVis);
            const ganoPartidoVisitante = Number(setsVis) > Number(setsLoc);

            // 2. DESGLOSE DE PUNTOS POR SET (S1..S5)
            const setsLocalArr = Array.isArray(juego.sets_local) ? juego.sets_local : [];
            const setsVisitanteArr = Array.isArray(juego.sets_visitante) ? juego.sets_visitante : [];

            return `
                <div class="bg-white rounded-xl border border-gray-200/80 p-3.5 shadow-xs mb-3">
                    <div class="text-[10px] font-bold text-gray-400 tracking-wider uppercase mb-2">
                        ${modalidad}
                    </div>

                    <div class="flex items-center justify-between gap-3">
                        <div class="flex-1 min-w-0 space-y-1.5">
                            <div class="flex items-center gap-1.5 text-xs ${ganoPartidoLocal ? 'font-bold text-gray-900' : 'text-gray-500'}">
                                ${ganoPartidoLocal ? '<span class="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>' : '<span class="w-2 h-2 shrink-0"></span>'}
                                <span class="truncate">${nombreLoc}</span>
                            </div>
                            <div class="flex items-center gap-1.5 text-xs ${ganoPartidoVisitante ? 'font-bold text-gray-900' : 'text-gray-500'}">
                                ${ganoPartidoVisitante ? '<span class="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>' : '<span class="w-2 h-2 shrink-0"></span>'}
                                <span class="truncate">${nombreVis}</span>
                            </div>
                        </div>

                        <div class="flex items-center gap-2 text-center shrink-0">
                            ${[0, 1, 2, 3, 4].map(i => {
                                const pLoc = Number(setsLocalArr[i] ?? 0);
                                const pVis = Number(setsVisitanteArr[i] ?? 0);

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

                        <div class="ml-2 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50/50 text-xs font-black text-[#003366] shrink-0 min-w-[52px] text-center">
                            ${setsLoc} - ${setsVis}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    renderModal(partidoPlayoff, htmlLineasPlanilla) {
        const localNombre = partidoPlayoff.equipo_1?.nombre || 'Equipo Local';
        const visitanteNombre = partidoPlayoff.equipo_2?.nombre || 'Equipo Visitante';
        const puntosLocal = partidoPlayoff.puntos_equipo_1 ?? 0;
        const puntosVisitante = partidoPlayoff.puntos_equipo_2 ?? 0;
        const etapa = partidoPlayoff.fase || partidoPlayoff.instancia || 'PLAYOFF';

        // LÓGICA DEL TROFEO
        const pLoc = Number(puntosLocal);
        const pVis = Number(puntosVisitante);

        // Solo muestra el trofeo si hay un ganador claro (un puntaje mayor que el otro)
        const ganaLocal = pLoc > pVis;
        const ganaVisitante = pVis > pLoc;

        // Trofeo visible con respaldo SVG/Emoji + FontAwesome
        const trofeoBadge = `
            <span class="inline-flex items-center justify-center bg-amber-400/20 text-amber-300 p-1 rounded-full text-xs animate-bounce border border-amber-400/40 shrink-0" title="Ganador">
                🏆
            </span>
        `;

        return `
            <div id="modal-playoff-detalle" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                <div class="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] transform transition-all">
                    
                    <!-- CABECERA DEL ENCUENTRO -->
                    <div class="bg-gradient-to-r from-[#003366] to-[#001f3f] text-white p-5 relative">
                        <button onclick="cerrarModalPlayoff()" class="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-1.5 transition-all cursor-pointer">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>

                        <div class="text-[10px] font-bold text-blue-200 tracking-widest uppercase mb-2">
                            ${etapa}
                        </div>

                        <div class="flex items-center justify-between gap-3 my-1">
                            <!-- EQUIPO LOCAL -->
                            <div class="flex-1 text-left min-w-0">
                                <h3 class="text-base font-bold text-white leading-tight truncate flex items-center gap-1.5">
                                    ${ganaLocal ? trofeoBadge : ''}
                                    <span class="${ganaLocal ? 'text-amber-300 font-extrabold' : ''}">${localNombre}</span>
                                </h3>
                            </div>

                            <!-- MARCADOR GENERAL DE LA SERIE -->
                            <div class="px-3.5 py-1.5 bg-white/10 rounded-xl border border-white/20 font-black text-lg text-white flex items-center gap-2 shrink-0">
                                <span class="${ganaLocal ? 'text-amber-300 font-extrabold' : ''}">${puntosLocal}</span>
                                <span class="text-xs text-blue-300 font-normal">-</span>
                                <span class="${ganaVisitante ? 'text-amber-300 font-extrabold' : ''}">${puntosVisitante}</span>
                            </div>

                            <!-- EQUIPO VISITANTE -->
                            <div class="flex-1 text-right min-w-0">
                                <h3 class="text-base font-bold text-white leading-tight truncate flex items-center justify-end gap-1.5">
                                    <span class="${ganaVisitante ? 'text-amber-300 font-extrabold' : ''}">${visitanteNombre}</span>
                                    ${ganaVisitante ? trofeoBadge : ''}
                                </h3>
                            </div>
                        </div>
                    </div>

                    <!-- PLANILLA DESGLOSADA -->
                    <div class="p-4 overflow-y-auto flex-1 bg-slate-50/50 space-y-1">
                        <div class="text-[11px] font-bold text-gray-400 tracking-wider uppercase mb-3 flex items-center gap-1.5">
                            <i class="far fa-id-card text-xs"></i> DESGLOSE DE PARTIDOS
                        </div>
                        ${htmlLineasPlanilla}
                    </div>

                    <div class="p-3 bg-white border-t border-gray-100 flex justify-end">
                        <button onclick="cerrarModalPlayoff()" class="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg transition-all cursor-pointer">
                            Cerrar
                        </button>
                    </div>

                </div>
            </div>
        `;
    }
};