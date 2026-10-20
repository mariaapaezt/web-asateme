// js/componentes/inscripciones/InscripcionForm.js
import {
  obtenerCategoriasPermitidas,
  CATEGORIAS_EDADES,
} from "../../utils/inscripcionHelper.js";

export class InscripcionForm {
  constructor({ onInscripcionExitosa, inscripcionesAbiertas = false }) {
    this.onInscripcionExitosa = onInscripcionExitosa;
    this.inscripcionesAbiertas = inscripcionesAbiertas; // Control dinámico futuro para abierto/cerrado
    this.datosForm = {
      nombre: "",
      dni: "",
      fechaNacimiento: "",
      genero: "Masculino",
      categoriasSeleccionadas: [],
    };
  }

  render(containerId) {
    const contenedor = document.getElementById(containerId);
    if (!contenedor) return;

    // Si las inscripciones están cerradas, mostramos el aviso pero conservamos la estructura/aviso institucional sin romper código
    if (!this.inscripcionesAbiertas) {
      contenedor.innerHTML = `
        <div class="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-8 opacity-90">
            <div class="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                <div class="w-8 h-8 rounded-lg bg-gray-100 text-gray-500 font-bold flex items-center justify-center">
                    <i class="fas fa-lock"></i>
                </div>
                <div>
                    <h3 class="text-base font-bold text-gray-800">Inscripciones Cerradas</h3>
                    <p class="text-xs text-gray-500">El periodo de inscripción para este torneo ha finalizado.</p>
                </div>
            </div>
            <div class="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center space-y-3">
                <div class="text-amber-800 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2">
                    <i class="fas fa-info-circle text-base"></i> Evento Concluido
                </div>
                <p class="text-xs text-amber-700 leading-relaxed max-w-lg mx-auto">
                    Ya no se aceptan nuevos registros ni modificaciones de categorías. Podés consultar el listado oficial y descargar el PDF con los inscriptos definitivos en las secciones superiores.
                </p>
            </div>
        </div>
      `;
      return;
    }

    // Renderizado completo original con toda su lógica de registro e interacciones
    contenedor.innerHTML = `
            <div class="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-8">
                <div class="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                    <div class="w-8 h-8 rounded-lg bg-blue-50 text-asatemeBlue font-bold flex items-center justify-center">1</div>
                    <div>
                        <h3 class="text-base font-bold text-gray-800">Datos personales</h3>
                        <p class="text-xs text-gray-500">Completá tus datos para calcular automáticamente tus categorías habilitadas.</p>
                    </div>
                </div>

                <form id="form-inscripcion-torneo" class="space-y-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-bold text-gray-700 uppercase mb-1.5">Nombre completo *</label>
                            <input type="text" id="ins-nombre" required placeholder="Ej.: Lucía Fernández"
                                   class="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-medium text-gray-800 focus:outline-none focus:border-asatemeBlue focus:bg-white">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-gray-700 uppercase mb-1.5">DNI / Documento *</label>
                            <input type="text" id="ins-dni" required placeholder="Ej.: 45123466 (Solo números)"
                                   class="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-medium text-gray-800 focus:outline-none focus:border-asatemeBlue focus:bg-white transition-all">
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-bold text-gray-700 uppercase mb-1.5">Fecha de nacimiento *</label>
                            <input type="date" id="ins-fnac" required
                                   class="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-medium text-gray-800 focus:outline-none focus:border-asatemeBlue focus:bg-white">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-gray-700 uppercase mb-1.5">Género *</label>
                            <div class="grid grid-cols-2 gap-2">
                                <button type="button" data-genero="Masculino" class="btn-genero py-3 px-4 rounded-xl font-bold text-xs border text-center transition-all bg-asatemeBlue text-white border-asatemeBlue cursor-pointer">Masculino</button>
                                <button type="button" data-genero="Femenino" class="btn-genero py-3 px-4 rounded-xl font-bold text-xs border text-center transition-all bg-white text-gray-700 border-gray-200 cursor-pointer">Femenino</button>
                            </div>
                        </div>
                    </div>

                    <div class="pt-4 border-t border-gray-100">
                        <div class="flex items-center gap-3 mb-4">
                            <div class="w-8 h-8 rounded-lg bg-blue-50 text-asatemeBlue font-bold flex items-center justify-center">2</div>
                            <div>
                                <h3 class="text-base font-bold text-gray-800">Categorías habilitadas</h3>
                                <p class="text-xs text-gray-500">Podés anotarte en tu categoría por edad, superiores, Todo Competidor y Maxi (si cumplís con la edad).</p>
                            </div>
                        </div>

                        <div id="contenedor-categorias-checkboxes" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <p class="col-span-full text-center text-xs text-gray-400 py-4 italic">
                                Completá tu fecha de nacimiento y género para ver las categorías en las que podés competir.
                            </p>
                        </div>
                    </div>

                    <button type="submit" id="btn-submit-inscripcion" class="w-full py-4 bg-asatemeBlue hover:bg-slate-800 text-white font-extrabold rounded-xl text-sm transition-all shadow-md cursor-pointer flex items-center justify-center gap-2">
                        <i class="fas fa-check-circle"></i> Confirmar inscripción
                    </button>
                </form>
            </div>
        `;

    this.conectarEventos();
  }

  conectarEventos() {
    const inputFnac = document.getElementById("ins-fnac");
    const botonesGenero = document.querySelectorAll(".btn-genero");
    const form = document.getElementById("form-inscripcion-torneo");

    botonesGenero.forEach((btn) => {
      btn.onclick = (e) => {
        botonesGenero.forEach(
          (b) =>
            (b.className =
              "btn-genero py-3 px-4 rounded-xl font-bold text-xs border text-center transition-all bg-white text-gray-700 border-gray-200 cursor-pointer"),
        );
        e.target.className =
          "btn-genero py-3 px-4 rounded-xl font-bold text-xs border text-center transition-all bg-asatemeBlue text-white border-asatemeBlue cursor-pointer";
        this.datosForm.genero = e.target.dataset.genero;
      };
    });

    inputFnac?.addEventListener("change", (e) => {
      this.datosForm.fechaNacimiento = e.target.value;
      this.actualizarCategoriasHabilitadas();
    });

    form.onsubmit = async (e) => {
      e.preventDefault();
      this.datosForm.nombre = document
        .getElementById("ins-nombre")
        .value.trim();
      this.datosForm.dni = document.getElementById("ins-dni").value.trim();

      const checkboxes = document.querySelectorAll(".cat-checkbox:checked");
      this.datosForm.categoriasSeleccionadas = Array.from(checkboxes).map(
        (cb) => cb.value,
      );

      if (this.datosForm.categoriasSeleccionadas.length === 0) {
        alert("⚠️ Debes seleccionar al menos una categoría para inscribirte.");
        return;
      }

      if (typeof this.onInscripcionExitosa === "function") {
        const btnSubmit = document.getElementById("btn-submit-inscripcion");
        if (btnSubmit) {
          btnSubmit.disabled = true;
          btnSubmit.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Guardando...`;
        }

        const exito = await this.onInscripcionExitosa(this.datosForm);

        if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.innerHTML = `<i class="fas fa-check-circle"></i> Confirmar inscripción`;
        }

        if (exito !== false) {
          form.reset();
          document.getElementById(
            "contenedor-categorias-checkboxes",
          ).innerHTML = `
                        <p class="col-span-full text-center text-xs text-gray-400 py-4 italic">
                            Completá tu fecha de nacimiento y género para ver las categorías en las que podés competir.
                        </p>`;
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }
    };
  }

  actualizarCategoriasHabilitadas() {
    const contenedor = document.getElementById(
      "contenedor-categorias-checkboxes",
    );
    if (!contenedor) return;

    const permitidas = obtenerCategoriasPermitidas(
      this.datosForm.fechaNacimiento,
    );

    contenedor.innerHTML = CATEGORIAS_EDADES.map((cat) => {
      const esPermitida = permitidas.includes(cat.nombre);
      return `
                <label class="flex items-center gap-3 p-3 rounded-xl border ${esPermitida ? "bg-white border-blue-200 cursor-pointer hover:border-asatemeBlue shadow-2xs" : "bg-gray-100/60 border-gray-200 opacity-50 cursor-not-allowed"}">
                    <input type="checkbox" value="${cat.nombre}" ${esPermitida ? "checked" : "disabled"} class="cat-checkbox w-4 h-4 text-asatemeBlue rounded border-gray-300 focus:ring-asatemeBlue">
                    <div>
                        <span class="block text-xs font-bold text-gray-800">${cat.nombre}</span>
                        <span class="text-[10px] text-gray-400">${esPermitida ? (cat.nombre === "Todo Competidor" ? "Abierto" : cat.nombre === "Maxi" ? "Veteranos (+30)" : "Habilitada") : "No habilitada"}</span>
                    </div>
                </label>
            `;
    }).join("");
  }
}
