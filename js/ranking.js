// Simulación de Base de Datos de Rankings (Mock Data)
const rankingData = {
    caballeros: [
        { pos: 1, name: "Juan Pérez", club: "Club Rosario", pts: 1250 },
        { pos: 2, name: "Martín Silva", club: "G. Fernández", pts: 1100 },
        { pos: 3, name: "Carlos López", club: "A. de Tenis", pts: 950 }
    ],
    damas: [
        { pos: 1, name: "María González", club: "A. de Tenis", pts: 1400 },
        { pos: 2, name: "Ana Martínez", club: "Club Rosario", pts: 1050 }
    ],
    sub15: [
        { pos: 1, name: "Juan Pérez", club: "Club Rosario", pts: 800 }
    ],
    sub11: [
        { pos: 1, name: "Sofía López", club: "Santo Tomé", pts: 600 }
    ],
    maxi: [
        { pos: 1, name: "Lautaro Díaz", club: "G. Fernández", pts: 900 }
    ]
};

// Función principal para renderizar el ranking dinámicamente
function changeCategory(category) {
    const tbody = document.getElementById('ranking-body');
    const title = document.getElementById('ranking-title');
    
    if (!tbody || !rankingData[category]) return;

    // 1. Actualizar el título visual
    title.innerHTML = `<i class="fas fa-medal mr-2"></i>Top ${category.charAt(0).toUpperCase() + category.slice(1)}`;

    // 2. Limpiar la tabla anterior
    tbody.innerHTML = '';

    // 3. Inyectar las nuevas filas dinámicamente
    rankingData[category].forEach(player => {
        const row = `
            <tr class="hover:bg-gray-50 transition">
                <td class="px-6 py-4 font-bold text-asatemeBlue">#${player.pos}</td>
                <td class="px-6 py-4 font-semibold">${player.name}</td>
                <td class="px-6 py-4 text-gray-600">${player.club}</td>
                <td class="px-6 py-4 text-right font-bold text-gray-900">${player.pts} pts</td>
            </tr>
        `;
        tbody.innerHTML += row;
    });

    // 4. Actualizar estado visual de los botones del menú lateral
    updateButtonStyles(category);
}

function updateButtonStyles(activeCategory) {
    const buttonsContainer = document.getElementById('category-buttons');
    if (!buttonsContainer) return;
    
    const buttons = buttonsContainer.getElementsByTagName('button');
    
    for (let btn of buttons) {
        if (btn.id === `btn-${activeCategory}`) {
            btn.className = "w-full text-left px-4 py-3 rounded-lg bg-asatemeBlue text-white font-semibold transition";
        } else {
            btn.className = "w-full text-left px-4 py-3 rounded-lg bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition";
        }
    }
}

// Carga inicial por defecto al abrir la página
document.addEventListener('DOMContentLoaded', () => {
    changeCategory('caballeros');
});