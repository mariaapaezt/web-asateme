// js/componentes/liga/ModalHistorial.js

export const ModalHistorial = {
    /**
     * Formatea los arrays de sets (sets_local: [11, 9, 11], sets_visitante: [8, 11, 5])
     * en un string legible: "11-8, 9-11, 11-5"
     */
    _formatearParciales(setsLocal, setsVisitante) {
        if (!Array.isArray(setsLocal) || !Array.isArray(setsVisitante) || setsLocal.length === 0) {
            return null;
        }

        const parciales = [];
        const maxLen = Math.max(setsLocal.length, setsVisitante.length);

        for (let i = 0; i < maxLen; i++) {
            const pLoc = setsLocal[i] !== undefined ? setsLocal[i] : 0;
            const pVis = setsVisitante[i] !== undefined ? setsVisitante[i] : 0;
            if (pLoc > 0 || pVis > 0) {
                parciales.push(`${pLoc}-${pVis}`);
            }
        }

        return parciales.length > 0 ? parciales.join(', ') : null;
    },

    renderListaPartidos(historial, jugadorId, obtenerNombreJugadorFn, obtenerNombreRivalFn) {
        if (!historial || historial.length === 0) {
            return `
                <div class="text-center py-8 text-gray-400">
                    <svg class="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    <p class="text-sm font-medium">No hay registros de partidos para este jugador.</p>
                </div>
            `;
        }

        return historial.map(partido => {
            const esLocal = Number(partido.local_jugador1_id) === Number(jugadorId) || Number(partido.local_jugador2_id) === Number(jugadorId);

            const esDobles = (partido.modalidad && partido.modalidad.toLowerCase().includes('doble')) || Boolean(partido.local_jugador2_id);

            // Nombres de Rivales
            const rival1Id = esLocal ? partido.visitante_jugador1_id : partido.local_jugador1_id;
            const rival2Id = esLocal ? partido.visitante_jugador2_id : partido.local_jugador2_id;

            const nombreRival1 = obtenerNombreJugadorFn(rival1Id);
            const nombreRival2 = rival2Id ? obtenerNombreJugadorFn(rival2Id) : null;

            // Club Rival
            const nombreClubRival = obtenerNombreRivalFn(partido, esLocal);

            // Marcador exacto según el esquema
            const setsLocal = Number(partido.score_sets_local || 0);
            const setsVisitante = Number(partido.score_sets_visitante || 0);

            const ganoLocal = setsLocal > setsVisitante;
            const ganoElJugador = (esLocal && ganoLocal) || (!esLocal && !ganoLocal);

            const miScore = esLocal ? setsLocal : setsVisitante;
            const rivalScore = esLocal ? setsVisitante : setsLocal;

            // Parciales formateados desde los arreglos smallint[]
            const detalleParciales = this._formatearParciales(partido.sets_local, partido.sets_visitante);

            return `
                <div class="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 mb-3 border-l-4 ${ganoElJugador ? 'border-l-emerald-500' : 'border-l-rose-500'}">
                    
                    <!-- Encabezado del partido -->
                    <div class="flex items-center justify-between text-xs mb-2">
                        <div class="flex items-center gap-2">
                            <span class="px-2 py-0.5 font-extrabold rounded bg-blue-50 text-[#003366] border border-blue-100">
                                Fecha ${partido.fecha_numero || '-'}
                            </span>
                            <span class="font-medium text-gray-500 flex items-center gap-1">
                                vs <strong class="text-gray-800 font-bold">${nombreClubRival}</strong>
                            </span>
                        </div>
                        
                        <span class="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded ${ganoElJugador ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}">
                            ${ganoElJugador ? 'Victoria' : 'Derrota'}
                        </span>
                    </div>

                    <!-- Cuerpo central: Rival y Marcador de Sets -->
                    <div class="flex items-center justify-between gap-3 my-1">
                        <div class="flex-1 min-w-0">
                            <div class="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-0.5">
                                ${esDobles ? 'Pareja Rival' : 'Rival Directo'}
                            </div>
                            <div class="text-sm font-bold text-gray-800 truncate">
                                ${nombreRival1}
                            </div>
                            ${nombreRival2 ? `<div class="text-xs text-gray-600 font-medium truncate">+ ${nombreRival2}</div>` : ''}
                        </div>

                        <!-- Marcador Principal de Sets -->
                        <div class="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200/80 shadow-inner">
                            <span class="text-lg font-black ${ganoElJugador ? 'text-emerald-600' : 'text-gray-400'}">
                                ${miScore}
                            </span>
                            <span class="text-xs font-bold text-gray-300">-</span>
                            <span class="text-lg font-black ${!ganoElJugador ? 'text-rose-600' : 'text-gray-400'}">
                                ${rivalScore}
                            </span>
                        </div>
                    </div>

                    <!-- Detalle de Parciales/Sets -->
                    ${detalleParciales ? `
                        <div class="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                            <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Parciales:</span>
                            <span class="font-mono font-semibold text-gray-700 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                                ${detalleParciales}
                            </span>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    },

    renderModal(jugador, nombreEquipo, fechasJugadas, totalFechas, htmlPartidos) {
        const porcentaje = totalFechas > 0 ? Math.round((fechasJugadas / totalFechas) * 100) : 0;

        return `
            <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                <div class="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] transform transition-all">
                    
                    <!-- Header -->
                    <div class="bg-gradient-to-r from-[#003366] to-[#001f3f] text-white p-5 relative">
                        <button onclick="cerrarModalJugador()" class="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-1.5 transition-all cursor-pointer">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>

                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center font-black text-xl text-white shadow-inner">
                                ${jugador.nombre ? jugador.nombre.charAt(0).toUpperCase() : 'J'}
                            </div>
                            <div>
                                <h3 class="text-lg font-bold text-white leading-tight">${jugador.nombre}</h3>
                                <p class="text-xs text-blue-200 font-medium">${nombreEquipo}</p>
                            </div>
                        </div>

                        <div class="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                            <div>
                                <span class="text-blue-200">Presencia en Torneo:</span>
                                <strong class="text-white ml-1 font-extrabold">${fechasJugadas} de ${totalFechas} Fechas</strong>
                            </div>
                            <span class="bg-white/20 text-white font-bold px-2 py-0.5 rounded text-[11px]">
                                ${porcentaje}% Asistencia
                            </span>
                        </div>
                    </div>

                    <!-- Lista de Partidos -->
                    <div class="p-4 overflow-y-auto flex-1 bg-slate-50/50">
                        <div class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">
                            Detalle de Encuentros Disputados
                        </div>
                        ${htmlPartidos}
                    </div>

                    <!-- Footer -->
                    <div class="p-3 bg-white border-t border-gray-100 flex justify-end">
                        <button onclick="cerrarModalJugador()" class="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg transition-all cursor-pointer">
                            Cerrar
                        </button>
                    </div>

                </div>
            </div>
        `;
    }
};