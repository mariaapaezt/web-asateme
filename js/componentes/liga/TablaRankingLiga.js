// js/componentes/liga/TablaRankingLiga.js

export const TablaRankingLiga = {
    /**
     * Renderiza las filas de la tabla de posiciones
     * @param {Array} equipos - Equipos ordenados de la liga seleccionada
     * @param {Object} equiposMap - Diccionario de logos y nombres
     */
    render(equipos, equiposMap) {
        if (equipos.length === 0) {
            return `<tr><td colspan="8" class="py-6 text-center text-gray-400">No hay registros de posiciones para esta liga.</td></tr>`;
        }

        return equipos.map((equipo, index) => {
            let claseMedalla = "text-gray-500";
            if (index === 0) claseMedalla = "bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full text-xs";
            else if (index === 1) claseMedalla = "bg-gray-200 text-gray-800 font-bold px-2 py-0.5 rounded-full text-xs";
            else if (index === 2) claseMedalla = "bg-amber-600/10 text-amber-800 font-bold px-2 py-0.5 rounded-full text-xs";

            const datosEquipo = equiposMap[String(equipo.id)] || { nombre: equipo.nombre, logo: '' };
            const pos = index + 1;
            const nombreFinal = datosEquipo.nombre || "Club";
            const primeraLetra = nombreFinal.charAt(0).toUpperCase();

            const logoHTML = (datosEquipo.logo && datosEquipo.logo !== 'assets/logos/generic-pingpong.png' && datosEquipo.logo.trim() !== "")
                ? `<img src="${datosEquipo.logo}" alt="${nombreFinal}" class="w-full h-full object-contain" onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\'w-7 h-7 rounded-full bg-asatemeBlue text-white flex items-center justify-center text-xs font-bold uppercase\'>${primeraLetra}</div>';">`
                : `<div class="w-7 h-7 rounded-full bg-asatemeBlue text-white flex items-center justify-center text-xs font-bold uppercase">${primeraLetra}</div>`;

            return `
                <tr class="hover:bg-gray-50/70 transition-colors text-center border-b border-gray-100 last:border-0">
                    <td class="py-3 px-4 font-bold text-sm"><span class="${claseMedalla}">${pos}</span></td>
                    <td class="py-3 px-4 text-left font-semibold text-gray-900 flex items-center gap-3">
                        <div class="w-7 h-7 min-w-7 rounded-full overflow-hidden flex items-center justify-center border bg-white shadow-2xs">
                            ${logoHTML}
                        </div>
                        <span>${nombreFinal}</span>
                    </td>
                    <td class="py-3 px-4 text-gray-600 font-medium">${equipo.sj ?? 0}</td>
                    <td class="py-3 px-4 font-semibold text-green-600">${equipo.sg ?? 0}</td>
                    <td class="py-3 px-4 font-semibold text-red-600">${equipo.sp ?? 0}</td>
                    <td class="py-3 px-4 text-blue-600 font-medium">${equipo.pg ?? 0}</td>
                    <td class="py-3 px-4 text-amber-600 font-medium">${equipo.pp ?? 0}</td>
                    <td class="py-3 px-4 font-extrabold text-gray-800 bg-gray-50/50">${equipo.pts ?? 0}</td>
                </tr>
            `;
        }).join('');
    }
};