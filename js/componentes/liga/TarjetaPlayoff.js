// js/componentes/liga/TarjetaPlayoff.js

export const TarjetaPlayoff = {
    renderArbol(playoffs = [], equiposMap = {}) {
        const qf1 = playoffs.find(p => p.codigo_llave === 'QF1') || {};
        const qf2 = playoffs.find(p => p.codigo_llave === 'QF2') || {};
        const sf1 = playoffs.find(p => p.codigo_llave === 'SF1') || {};
        const sf2 = playoffs.find(p => p.codigo_llave === 'SF2') || {};
        const final = playoffs.find(p => p.codigo_llave === 'FINAL') || {};

        return `
            <div class="flex flex-col lg:flex-row items-center justify-between gap-6 overflow-x-auto py-6 px-2">
                
                <!-- COLUMNA 1: CUARTOS DE FINAL -->
                <div class="flex flex-col justify-around gap-8 w-full lg:w-1/3 min-w-[280px]">
                    <div class="text-center font-bold text-xs tracking-wider text-gray-500 uppercase mb-2">
                        <i class="fas fa-play-circle text-asatemeRed mr-1"></i> Cuartos de Final
                    </div>
                    ${this.renderMatchCard(qf1, equiposMap)}
                    ${this.renderMatchCard(qf2, equiposMap)}
                </div>

                <!-- CONECTOR 1 -->
                <div class="hidden lg:flex flex-col justify-around h-full py-12 text-gray-300">
                    <i class="fas fa-chevron-right text-xl"></i>
                    <i class="fas fa-chevron-right text-xl"></i>
                </div>

                <!-- COLUMNA 2: SEMIFINALES -->
                <div class="flex flex-col justify-around gap-12 w-full lg:w-1/3 min-w-[280px]">
                    <div class="text-center font-bold text-xs tracking-wider text-gray-500 uppercase mb-2">
                        <i class="fas fa-fire text-amber-500 mr-1"></i> Semifinales
                    </div>
                    ${this.renderMatchCard(sf1, equiposMap)}
                    ${this.renderMatchCard(sf2, equiposMap)}
                </div>

                <!-- CONECTOR 2 -->
                <div class="hidden lg:flex flex-col justify-around h-full py-12 text-gray-300">
                    <i class="fas fa-chevron-right text-xl"></i>
                </div>

                <!-- COLUMNA 3: GRAN FINAL -->
                <div class="flex flex-col justify-center w-full lg:w-1/3 min-w-[280px]">
                    <div class="text-center font-bold text-xs tracking-wider text-amber-600 uppercase mb-2">
                        <i class="fas fa-trophy mr-1 text-amber-500"></i> Gran Final
                    </div>
                    ${this.renderMatchCard(final, equiposMap, true)}
                </div>

            </div>
        `;
    },

    renderMatchCard(match, equiposMap, esFinal = false) {
        if (!match || !match.codigo_llave) {
            return `<div class="p-4 bg-gray-50 border border-dashed rounded-xl text-center text-xs text-gray-400">Sin definir</div>`;
        }

        const eq1 = equiposMap[match.equipo_1_id] || null;
        const eq2 = equiposMap[match.equipo_2_id] || null;

        const nombreEq1 = eq1 ? eq1.nombre : (match.origen_equipo_1 || 'Por definir');
        const nombreEq2 = eq2 ? eq2.nombre : (match.origen_equipo_2 || 'Por definir');

        const logoEq1 = eq1?.logo ? `<img src="${eq1.logo}" class="w-6 h-6 object-contain rounded-full">` : `<div class="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] text-gray-500 font-bold"><i class="fas fa-shield-alt"></i></div>`;
        const logoEq2 = eq2?.logo ? `<img src="${eq2.logo}" class="w-6 h-6 object-contain rounded-full">` : `<div class="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] text-gray-500 font-bold"><i class="fas fa-shield-alt"></i></div>`;

        // Determinar ganador por ganador_id o por comparación de puntos
        const p1 = Number(match.puntos_equipo_1 ?? 0);
        const p2 = Number(match.puntos_equipo_2 ?? 0);

        const esGanador1 = (match.ganador_id && String(match.ganador_id) === String(match.equipo_1_id)) || (match.estado === 'FINALIZADO' && p1 > p2);
        const esGanador2 = (match.ganador_id && String(match.ganador_id) === String(match.equipo_2_id)) || (match.estado === 'FINALIZADO' && p2 > p1);

        const bgCard = esFinal ? 'bg-gradient-to-b from-amber-50/60 to-white border-amber-300 shadow-md' : 'bg-white border-gray-200 shadow-sm';

        const cruceListo = match.equipo_1_id && match.equipo_2_id;
        const esFinalizado = match.estado === 'FINALIZADO';

        // Badge de trofeo
        const trofeoBadge = `<span class="text-xs animate-bounce" title="Ganador">🏆</span>`;

        return `
            <div class="border rounded-xl p-3 ${bgCard} transition-all hover:shadow-md relative">
                <div class="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 border-b border-gray-100 pb-1">
                    <span>${match.fase || match.instancia || 'PLAYOFF'} - ${match.codigo_llave}</span>
                    <span class="px-2 py-0.5 rounded-full ${esFinalizado ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}">
                        ${match.estado || 'PENDIENTE'}
                    </span>
                </div>

                <!-- EQUIPO 1 -->
                <div class="flex items-center justify-between py-1.5 px-2 rounded-lg ${esGanador1 ? 'bg-amber-100/70 font-bold text-amber-950 border border-amber-200/60' : 'text-gray-700'}">
                    <div class="flex items-center gap-2 overflow-hidden">
                        ${logoEq1}
                        <span class="text-xs truncate max-w-[130px] ${esGanador1 ? 'font-extrabold text-amber-900' : ''}">${nombreEq1}</span>
                        ${esGanador1 ? trofeoBadge : ''}
                    </div>
                    <span class="text-sm font-extrabold ${esGanador1 ? 'text-amber-700' : 'text-gray-600'}">
                        ${match.puntos_equipo_1 ?? '-'}
                    </span>
                </div>

                <!-- EQUIPO 2 -->
                <div class="flex items-center justify-between py-1.5 px-2 rounded-lg mt-1 ${esGanador2 ? 'bg-amber-100/70 font-bold text-amber-950 border border-amber-200/60' : 'text-gray-700'}">
                    <div class="flex items-center gap-2 overflow-hidden">
                        ${logoEq2}
                        <span class="text-xs truncate max-w-[130px] ${esGanador2 ? 'font-extrabold text-amber-900' : ''}">${nombreEq2}</span>
                        ${esGanador2 ? trofeoBadge : ''}
                    </div>
                    <span class="text-sm font-extrabold ${esGanador2 ? 'text-amber-700' : 'text-gray-600'}">
                        ${match.puntos_equipo_2 ?? '-'}
                    </span>
                </div>

                <!-- PIE DE TARJETA: VER RESULTADOS EN MODAL -->
                <div class="mt-2 pt-2 border-t border-gray-100">
                    ${esFinalizado ? `
                        <button data-action="abrir-modal-playoff" data-id="${match.id}"
                                class="w-full py-1 text-center text-[11px] font-bold text-[#003366] hover:bg-gray-50 flex items-center justify-center gap-1 transition-colors cursor-pointer rounded">
                            <i class="fas fa-eye text-[10px]"></i>
                            <span>Ver resultados</span>
                        </button>
                    ` : `
                        <span class="text-[10px] text-gray-400 italic text-center block w-full py-0.5">
                            <i class="fas fa-clock mr-1"></i> ${cruceListo ? 'Partido pendiente' : 'Esperando cruce'}
                        </span>
                    `}
                </div>
            </div>
        `;
    }
};