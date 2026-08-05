/**
 * Componente funcional que renderiza las filas de la tabla de posiciones del ranking
 * @param {Array} jugadores - Lista de jugadores filtrados a renderizar
 * @returns {string} Bloque de strings HTML con los elementos <tr>
 */
export function TablaRanking(jugadores) {
    return jugadores.map(j => {
        let clasePosicion = "text-gray-700 font-bold";

        // Destacamos los podios del 1º al 3º de forma prolija
        if (j.posicion === 1) clasePosicion = "text-yellow-500 font-extrabold text-lg";
        if (j.posicion === 2) clasePosicion = "text-gray-400 font-extrabold text-lg";
        if (j.posicion === 3) clasePosicion = "text-amber-600 font-extrabold text-lg";

        return `
            <tr class="hover:bg-gray-50 transition duration-200 border-b border-gray-100">
                <td class="px-6 py-4 text-center ${clasePosicion}">${j.posicion}º</td>
                <td class="px-6 py-4 font-semibold text-blue-900">${j.jugador}</td>
                <td class="px-6 py-4 text-gray-600 text-sm">${j.club}</td>
                <td class="px-6 py-4 text-right font-bold text-gray-900">${j.puntos}</td>
            </tr>
        `;
    }).join('');
}