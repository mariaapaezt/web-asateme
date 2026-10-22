// js/componentes/inscripciones/InscriptosProvModal.js

export class InscriptosProvModal {
  constructor() {
    this.containerId = "modal-provincial-container";
  }

  mostrar(tituloCategoria, inscriptosList = []) {
    let contenedor = document.getElementById(this.containerId);
    if (!contenedor) {
      contenedor = document.createElement("div");
      contenedor.id = this.containerId;
      document.body.appendChild(contenedor);
    }

    const htmlLista =
      inscriptosList.length === 0
        ? `<div class="text-center py-8 text-gray-400 text-xs italic">No hay jugadores inscriptos en esta categoría todavía.</div>`
        : inscriptosList
            .map(
              (j, idx) => `
          <div class="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-xs">
              <div class="flex items-center gap-3">
                  <span class="w-6 h-6 rounded-full bg-blue-100 text-asatemeBlue font-bold flex items-center justify-center text-[10px] shrink-0">${idx + 1}</span>
                  <div>
                      <span class="font-bold text-gray-800 block">${j.nombre || j}</span>
                      <span class="text-[10px] text-gray-500 font-medium">Club: <b class="text-gray-700">${j.club || "Sin Club"}</b></span>
                  </div>
              </div>
          </div>
        `,
            )
            .join("");

    contenedor.innerHTML = `
      <div class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100">
              <div class="bg-asatemeBlue text-white px-6 py-4 flex justify-between items-center">
                  <div>
                      <span class="text-[10px] uppercase font-bold tracking-wider text-blue-200 block">Listado Oficial</span>
                      <h3 class="text-base font-extrabold">${tituloCategoria}</h3>
                  </div>
                  <button type="button" id="btn-cerrar-modal-x" class="text-white/80 hover:text-white text-lg cursor-pointer">
                      <i class="fas fa-times"></i>
                  </button>
              </div>

              <div class="p-5 max-h-[60vh] overflow-y-auto space-y-2">
                  ${htmlLista}
              </div>

              <div class="bg-gray-50 px-6 py-3 border-t border-gray-100 flex justify-between items-center text-xs">
                  <span class="text-gray-500 font-medium">Total: <b>${inscriptosList.length}</b> inscriptos</span>
                  <button type="button" id="btn-cerrar-modal-footer" class="px-4 py-2 bg-asatemeBlue text-white font-bold rounded-xl cursor-pointer hover:bg-slate-800 transition">Cerrar</button>
              </div>
          </div>
      </div>
    `;

    const cerrar = () => this.cerrar();
    document
      .getElementById("btn-cerrar-modal-x")
      ?.addEventListener("click", cerrar);
    document
      .getElementById("btn-cerrar-modal-footer")
      ?.addEventListener("click", cerrar);
  }

  cerrar() {
    const contenedor = document.getElementById(this.containerId);
    if (contenedor) {
      contenedor.innerHTML = "";
    }
  }
}
