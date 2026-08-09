document.addEventListener("DOMContentLoaded", function () {
    const calendarioContainer = document.getElementById('calendario-grid');

    if (!calendarioContainer) return;

    fetch('data/calendario.json')
        .then(response => response.json())
        .then(eventos => {
            if (!eventos || eventos.length === 0) {
                calendarioContainer.innerHTML = `
                    <div class="col-span-full text-center py-8 bg-gray-50 rounded-xl border border-gray-100">
                        <p class="text-gray-400 text-sm">No hay eventos programados en este momento.</p>
                    </div>`;
                return;
            }

            calendarioContainer.innerHTML = ""; // Limpia el spinner de carga

            eventos.forEach(evento => {
                const card = document.createElement('div');
                card.className = "bg-white rounded-xl shadow-lg border-l-4 border-asatemeBlue overflow-hidden card-hover border border-gray-100 transition duration-300 flex flex-col justify-between";

                card.innerHTML = `
                    <div class="p-6">
                        <div class="flex justify-between items-center mb-4">
                            <span class="${evento.badgeColor || 'bg-blue-100 text-blue-700'} px-3 py-1 rounded-full text-xs font-bold uppercase">
                                ${evento.estado}
                            </span>
                            <span class="text-gray-500 font-bold text-xs uppercase tracking-wider">${evento.tipo}</span>
                        </div>
                        <h3 class="text-xl font-bold text-gray-800 mb-2">${evento.titulo}</h3>
                        <h4 class="text-asatemeRed font-semibold mb-2">
                            <i class="far fa-calendar-alt mr-2"></i>${evento.fecha}
                        </h4>
                        <p class="text-gray-600 text-sm">
                            <i class="fas fa-map-marker-alt mr-2 text-gray-400"></i>${evento.lugar}
                        </p>
                    </div>
                `;
                calendarioContainer.appendChild(card);
            });
        })
        .catch(err => {
            console.error("Error cargando el calendario:", err);
            calendarioContainer.innerHTML = `
                <p class="text-gray-500 text-sm col-span-full text-center py-6">
                    No se pudieron cargar las fechas del calendario.
                </p>`;
        });
});