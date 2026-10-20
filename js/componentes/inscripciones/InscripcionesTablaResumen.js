// js/componentes/inscripciones/InscripcionesTablaResumen.js

export const InscripcionesTablaResumen = {
  render(inscriptosList = []) {
    const totalJugadoresUnicos = new Set(inscriptosList.map((i) => i.dni)).size;
    let totalInscripcionesCategorias = 0;

    // Definimos las categorías separadas por rama (Masculino y Femenino), incluyendo Maxi
    const categoriasDefinidas = [
      /*{
        nombre: "Sub-9 Masculino",
        cat: "Sub-9",
        genero: "Masculino",
        desc: "Hasta 9 años",
      },
      {
        nombre: "Sub-9 Femenino",
        cat: "Sub-9",
        genero: "Femenino",
        desc: "Hasta 9 años",
      },*/
      {
        nombre: "Sub-11 Masculino",
        cat: "Sub-11",
        genero: "Masculino",
        desc: "Hasta 11 años",
      },
      {
        nombre: "Sub-11 Femenino",
        cat: "Sub-11",
        genero: "Femenino",
        desc: "Hasta 11 años",
      },
      {
        nombre: "Sub-13 Masculino",
        cat: "Sub-13",
        genero: "Masculino",
        desc: "Hasta 13 años",
      },
      {
        nombre: "Sub-13 Femenino",
        cat: "Sub-13",
        genero: "Femenino",
        desc: "Hasta 13 años",
      },
      {
        nombre: "Sub-15 Masculino",
        cat: "Sub-15",
        genero: "Masculino",
        desc: "Hasta 15 años",
      },
      {
        nombre: "Sub-15 Femenino",
        cat: "Sub-15",
        genero: "Femenino",
        desc: "Hasta 15 años",
      },
      /*{
        nombre: "Sub-17 Masculino",
        cat: "Sub-17",
        genero: "Masculino",
        desc: "Hasta 17 años",
      },
      {
        nombre: "Sub-17 Femenino",
        cat: "Sub-17",
        genero: "Femenino",
        desc: "Hasta 17 años",
      },*/
      {
        nombre: "Sub-19 Masculino",
        cat: "Sub-19",
        genero: "Masculino",
        desc: "Hasta 19 años",
      },
      {
        nombre: "Sub-19 Femenino",
        cat: "Sub-19",
        genero: "Femenino",
        desc: "Hasta 19 años",
      },
      /* {
        nombre: "Sub-23 Masculino",
        cat: "Sub-23",
        genero: "Masculino",
        desc: "Hasta 23 años",
      },
      {
        nombre: "Sub-23 Femenino",
        cat: "Sub-23",
        genero: "Femenino",
        desc: "Hasta 23 años",
      },*/
      {
        nombre: "Maxi Masculino",
        cat: "Maxi",
        genero: "Masculino",
        desc: "Mayores de 30 años",
      },
      {
        nombre: "Maxi Femenino",
        cat: "Maxi",
        genero: "Femenino",
        desc: "Mayores de 30 años",
      },
      {
        nombre: "Todo Competidor Masculino",
        cat: "Todo Competidor",
        genero: "Masculino",
        desc: "Abierto a todas las edades",
      },
      {
        nombre: "Todo Competidor Femenino",
        cat: "Todo Competidor",
        genero: "Femenino",
        desc: "Abierto a todas las edades",
      },
    ];

    const estadisticasCategorias = categoriasDefinidas.map((c) => {
      const inscriptosEnCat = inscriptosList.filter(
        (i) =>
          i.categoriasSeleccionadas?.includes(c.cat) && i.genero === c.genero,
      );
      const total = inscriptosEnCat.length;
      totalInscripcionesCategorias += total;

      return { ...c, total, inscriptos: inscriptosEnCat };
    });

    return `
            <div class="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-12">
                <!-- Tarjetas Estadísticas Laterales -->
                <div class="lg:col-span-1 space-y-4">
                    <div class="bg-asatemeBlue text-white rounded-2xl p-6 shadow-lg relative overflow-hidden">
                        <span class="text-xs font-bold uppercase tracking-wider text-blue-200 block mb-1">Inscriptos Únicos</span>
                        <div class="text-4xl font-extrabold mb-1">${totalJugadoresUnicos}</div>
                        <span class="text-xs text-blue-100">Jugadores registrados</span>
                    </div>

                    <div class="bg-white text-gray-800 rounded-2xl p-6 shadow-md border border-gray-100 flex flex-col justify-between">
                        <div>
                            <span class="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-1">Total Inscripciones</span>
                            <div class="text-4xl font-extrabold text-asatemeBlue mb-1">${totalInscripcionesCategorias}</div>
                            <span class="text-xs text-gray-500">Inscripciones a categorías</span>
                        </div>
                        <div class="mt-6 pt-4 border-t border-gray-100">
                            <button onclick="window.descargarListadoPDFGeneral()" 
                                    class="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2">
                                <i class="fas fa-file-pdf"></i> Descargar Listado General (PDF)
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Tabla Detallada por Categoría y Rama -->
                <div class="lg:col-span-3 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    <div class="px-6 py-4 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
                        <div>
                            <h3 class="text-base font-bold text-gray-800">Inscriptos por categoría y rama</h3>
                            <p class="text-xs text-gray-500">Desglose oficial masculino y femenino del torneo.</p>
                        </div>
                        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">
                            <span class="w-2 h-2 rounded-full bg-gray-400"></span> Finalizada
                        </span>
                    </div>

                    <div class="overflow-x-auto max-h-[500px] overflow-y-auto">
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase bg-gray-50/30 sticky top-0 bg-white z-10">
                                    <th class="py-3 px-6">Categoría / Rama</th>
                                    <th class="py-3 px-4 text-center">Total Inscriptos</th>
                                    <th class="py-3 px-6 text-right">Acción</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-100 text-xs">
                                ${estadisticasCategorias
                                  .map(
                                    (c) => `
                                    <tr class="hover:bg-gray-50/80 transition-colors">
                                        <td class="py-4 px-6">
                                            <div class="flex items-center gap-2">
                                                <span class="font-bold text-gray-800">${c.nombre}</span>
                                                <span class="px-2 py-0.5 rounded text-[9px] font-extrabold ${c.genero === "Masculino" ? "bg-blue-100 text-blue-800" : "bg-pink-100 text-pink-800"}">${c.genero}</span>
                                            </div>
                                            <span class="text-[10px] text-gray-400">${c.desc}</span>
                                        </td>
                                        <td class="py-4 px-4 text-center font-black text-asatemeBlue text-sm">${c.total}</td>
                                        <td class="py-4 px-6 text-right">
                                            <button onclick="window.verListadoCategoriaRama('${c.cat}', '${c.genero}')" 
                                                    class="px-3 py-1.5 rounded-lg font-bold text-xs bg-blue-50 text-asatemeBlue hover:bg-asatemeBlue hover:text-white transition-all cursor-pointer">
                                                Ver inscriptos
                                            </button>
                                        </td>
                                    </tr>
                                `,
                                  )
                                  .join("")}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
  },
};
