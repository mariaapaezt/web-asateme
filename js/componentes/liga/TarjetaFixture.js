// js/componentes/liga/TarjetaFixture.js

import { DesplegableFixture } from './DesplegableFixture.js';

export const TarjetaFixture = {
    /**
     * Renderiza el bloque central del paginador de jornadas
     */
    renderPaginador(currentFecha, maxFechas) {
        return `
            <div class="text-center min-w-[100px]">
                <span class="block text-xs uppercase font-bold tracking-wider text-gray-400">JORNADA</span>
                <span id="txt-fecha-actual" class="text-base font-bold text-gray-800">Fecha ${currentFecha}</span>
            </div>
        `;
    },

    /**
     * Renderiza la tarjeta del equipo libre
     */
    renderEquipoLibre(equipoLibre) {
        if (!equipoLibre) return '';

        return `
            <div class="col-span-full bg-white rounded-xl border-2 border-dashed border-amber-200 p-4 shadow-xs flex items-center justify-between gap-4">
                <div class="flex items-center gap-3 min-w-0">
                    <img src="${equipoLibre.logo}" 
                         onerror="this.onerror=null; this.src='assets/logos/generic-pingpong.png';" 
                         class="w-9 h-9 object-contain shrink-0" alt="${equipoLibre.nombre}">
                    <div class="min-w-0">
                        <h4 class="text-sm font-bold text-gray-900 truncate">${equipoLibre.nombre}</h4>
                        <span class="text-xs text-amber-800/80 font-medium flex items-center gap-1.5 mt-0.5">
                            ☕ Queda libre en esta jornada
                        </span>
                    </div>
                </div>

                <span class="px-2.5 py-1 text-[10px] font-black rounded-md bg-amber-100 text-amber-800 tracking-wider uppercase shrink-0">
                    LIBRE
                </span>
            </div>
        `;
    },

    /**
     * Renderiza las tarjetas de los partidos y el equipo libre
     */
    render(partidos, equiposMap, todosLosEquipos, equipoLibre = null) {
        const htmlPartidos = partidos && partidos.length > 0 ? partidos.map(partido => {
            const elocal = equiposMap[String(partido.local_id)] || { nombre: 'Local', logo: '' };
            const evisitante = equiposMap[String(partido.visitante_id)] || { nombre: 'Visitante', logo: '' };

            const scoreLocNum = partido.score_local !== null && partido.partido_jugado !== false ? Number(partido.score_local) : null;
            const scoreVisNum = partido.score_visitante !== null && partido.partido_jugado !== false ? Number(partido.score_visitante) : null;

            const esFinalizado = String(partido.estado || '').toLowerCase() === 'finalizado' ||
                String(partido.estado || '').toLowerCase() === 'jugado' ||
                (scoreLocNum !== null && scoreVisNum !== null);

            const ganoLocal = esFinalizado && scoreLocNum > scoreVisNum;
            const ganoVisitante = esFinalizado && scoreVisNum > scoreLocNum;

            const badgeEstado = esFinalizado
                ? `<span class="px-2 py-0.5 text-[10px] font-bold rounded bg-green-100 text-green-700 tracking-wide uppercase">FINALIZADO</span>`
                : `<span class="px-2 py-0.5 text-[10px] font-bold rounded bg-gray-100 text-gray-500 tracking-wide uppercase">${partido.estado || 'PENDIENTE'}</span>`;

            const txtMarcadorLocal = scoreLocNum !== null ? scoreLocNum : '-';
            const txtMarcadorVisitante = scoreVisNum !== null ? scoreVisNum : '-';

            return `
                <div class="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between">
                    <!-- Encabezado con estado -->
                    <div class="px-4 py-3 flex justify-between items-center text-xs text-gray-400 font-medium">
                        <span class="flex items-center gap-1">
                            <i class="far fa-clock"></i> Fecha ${partido.fecha_numero || ''}
                        </span>
                        ${badgeEstado}
                    </div>

                    <!-- Enfrentamiento Principal -->
                    <div class="px-4 py-2 flex items-center justify-between gap-2">
                        <!-- Equipo Local -->
                        <div class="flex items-center gap-2 w-[42%] justify-end text-right">
                            ${ganoLocal ? '<span class="text-base sm:text-lg leading-none shrink-0 drop-shadow-xs">🏆</span>' : ''}
                            <span class="text-sm ${ganoLocal ? 'font-extrabold text-gray-900' : 'font-bold text-gray-700'} truncate">${elocal.nombre}</span>
                            <img src="${elocal.logo || 'assets/logos/generic-pingpong.png'}" 
                                 onerror="this.onerror=null; this.src='assets/logos/generic-pingpong.png';" 
                                 class="w-7 h-7 object-contain shrink-0" alt="${elocal.nombre}">
                        </div>

                        <!-- Marcador Box -->
                        <div class="flex items-center justify-center gap-2 bg-gray-50/80 px-3 py-1.5 rounded-lg border border-gray-100 shrink-0">
                            <span class="text-base font-black ${ganoLocal ? 'text-gray-900' : 'text-gray-600'}">${txtMarcadorLocal}</span>
                            <span class="text-xs font-bold text-gray-300">:</span>
                            <span class="text-base font-black ${ganoVisitante ? 'text-gray-900' : 'text-gray-600'}">${txtMarcadorVisitante}</span>
                        </div>

                        <!-- Equipo Visitante -->
                        <div class="flex items-center gap-2 w-[42%] justify-start text-left">
                            <img src="${evisitante.logo || 'assets/logos/generic-pingpong.png'}" 
                                 onerror="this.onerror=null; this.src='assets/logos/generic-pingpong.png';" 
                                 class="w-7 h-7 object-contain shrink-0" alt="${evisitante.nombre}">
                            <span class="text-sm ${ganoVisitante ? 'font-extrabold text-gray-900' : 'font-bold text-gray-700'} truncate">${evisitante.nombre}</span>
                            ${ganoVisitante ? '<span class="text-base sm:text-lg leading-none shrink-0 drop-shadow-xs">🏆</span>' : ''}
                        </div>
                    </div>

                    <!-- Pie de Tarjeta / Botón Desplegable -->
                    <div class="mt-3 border-t border-gray-50">
                        <button onclick="window.ligaController.togglePlanilla(${partido.id})" 
                                class="w-full py-2.5 text-center text-xs font-bold text-[#003366] hover:bg-gray-50 flex items-center justify-center gap-1.5 transition-colors cursor-pointer">
                            <i id="icono-detalle-${partido.id}" class="fas fa-chevron-down text-[10px] transition-transform duration-200"></i>
                            <span>Ver resultados</span>
                        </button>

                        <!-- Contenedor desplegable mediante componente dedicado -->
                        ${DesplegableFixture.renderContenedor(partido.id)}
                    </div>
                </div>
            `;
        }).join('') : `
            <div class="col-span-full text-center py-8 text-gray-400 text-sm bg-white rounded-xl border border-gray-100 shadow-sm">
                <i class="fas fa-calendar-times text-2xl mb-2 block text-gray-300"></i>
                No hay partidos programados para esta jornada.
            </div>
        `;

        // Retorna los partidos + la tarjeta del equipo libre (si aplica)
        return htmlPartidos + this.renderEquipoLibre(equipoLibre);
    }
};