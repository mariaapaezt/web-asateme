// js/componentes/inscripciones/InscriptosModal.js

export const InscriptosModal = {
  render(jugadorInscripto, todosInscriptos) {
    // Si se pasa un jugador recién inscripto, mostramos el modal estilo éxito de la imagen
    // Si no, podemos usarlo para mostrar el listado general de una categoría.
    const categoriasDelJugador = jugadorInscripto
      ? jugadorInscripto.categoriasSeleccionadas
      : [];

    return `
            <div class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                <div class="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">
                    
                    <!-- Cabecera de Éxito -->
                    <div class="bg-asatemeBlue text-white p-6 relative">
                        <button onclick="window.cerrarModalInscriptos()" class="absolute right-6 top-6 text-white/80 hover:text-white text-lg cursor-pointer">
                            <i class="fas fa-times"></i>
                        </button>
                        <div class="flex items-center gap-3 mb-3">
                            <div class="w-10 h-10 rounded-full bg-blue-500/30 flex items-center justify-center text-amber-400 text-xl font-bold border border-white/20">
                                <i class="fas fa-check-circle"></i>
                            </div>
                            <h3 class="text-xl font-extrabold">¡Inscripción confirmada!</h3>
                        </div>
                        <p class="text-blue-100 text-xs">Te esperamos el 18 y 19 de Octubre en el Centro Municipal Distrito Oeste.</p>
                    </div>

                    <!-- Tarjeta de Resumen del Jugador -->
                    <div class="p-6 max-h-[60vh] overflow-y-auto space-y-6">
                        ${
                          jugadorInscripto
                            ? `
                            <div class="bg-gray-50 border border-gray-100 rounded-2xl p-4 space-y-3">
                                <div class="flex justify-between items-start">
                                    <div>
                                        <span class="text-[10px] uppercase font-bold text-gray-400 block">Jugador/a</span>
                                        <h4 class="text-sm font-black text-asatemeBlue">${jugadorInscripto.nombre}</h4>
                                    </div>
                                    <span class="px-2.5 py-1 rounded-md text-[10px] font-bold ${jugadorInscripto.genero === "Masculino" ? "bg-blue-100 text-blue-800" : "bg-pink-100 text-pink-800"}">
                                        ${jugadorInscripto.genero}
                                    </span>
                                </div>
                                <div class="grid grid-cols-2 gap-4 text-xs pt-2 border-t border-gray-200/60">
                                    <div>
                                        <span class="text-gray-400 block text-[10px]">DNI</span>
                                        <span class="font-bold text-gray-700">${jugadorInscripto.dni}</span>
                                    </div>
                                    <div>
                                        <span class="text-gray-400 block text-[10px]">Género</span>
                                        <span class="font-bold text-gray-700">${jugadorInscripto.genero}</span>
                                    </div>
                                </div>
                                <div class="flex items-center gap-4 text-[11px] text-gray-500 pt-1">
                                    <span><i class="fas fa-calendar-alt text-amber-500 mr-1"></i> 18 y 19 de Octubre</span>
                                    <span><i class="fas fa-map-marker-alt text-amber-500 mr-1"></i> Distrito Oeste</span>
                                </div>
                            </div>
                        `
                            : ""
                        }

                        <!-- Listado de inscriptos en tus categorías (o general) -->
                        <div>
                            <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Inscriptos en tus categorías</h4>
                            <div class="space-y-4">
                                ${categoriasDelJugador
                                  .map((catNombre) => {
                                    // Filtramos los inscriptos de esa categoría (tanto rama masculina como femenina)
                                    const inscriptosCat =
                                      todosInscriptos.filter((i) =>
                                        i.categoriasSeleccionadas?.includes(
                                          catNombre,
                                        ),
                                      );

                                    return `
                                        <div class="border border-gray-100 rounded-2xl overflow-hidden shadow-2xs">
                                            <div class="bg-blue-50/60 px-4 py-2.5 flex justify-between items-center border-b border-gray-100">
                                                <span class="font-bold text-xs text-asatemeBlue">${catNombre}</span>
                                                <span class="text-[10px] font-bold bg-white px-2 py-0.5 rounded-md text-gray-600 border border-gray-200">${inscriptosCat.length} jugadores</span>
                                            </div>
                                            <div class="divide-y divide-gray-100 bg-white">
                                                ${
                                                  inscriptosCat.length === 0
                                                    ? `
                                                    <div class="p-3 text-center text-xs text-gray-400 italic">No hay otros inscriptos aún.</div>
                                                `
                                                    : inscriptosCat
                                                        .map(
                                                          (j, idx) => `
                                                    <div class="px-4 py-2.5 flex items-center justify-between text-xs">
                                                        <div class="flex items-center gap-3">
                                                            <span class="text-gray-400 font-bold text-[10px] w-4">${idx + 1}</span>
                                                            <span class="font-bold text-gray-800">${j.nombre}</span>
                                                        </div>
                                                        <span class="text-[10px] text-gray-500 font-medium">${j.genero}</span>
                                                    </div>
                                                `,
                                                        )
                                                        .join("")
                                                }
                                            </div>
                                        </div>
                                    `;
                                  })
                                  .join("")}
                            </div>
                        </div>
                    </div>

                    <!-- Botón de Cierre -->
                    <div class="bg-gray-50 p-4 border-t border-gray-100 flex justify-end">
                        <button onclick="window.cerrarModalInscriptos()" class="px-6 py-2.5 bg-asatemeBlue text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-all cursor-pointer">
                            Listo
                        </button>
                    </div>
                </div>
            </div>
        `;
  },
};
