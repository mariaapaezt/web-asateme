// js/vistas/SembradoTorneoView.js
import { SembradoEngine } from "../componentes/torneos/SembradoEngine.js";
import { SembradoService } from "../componentes/torneos/SembradoService.js";

export class SembradoTorneoView {
  constructor({
    torneoId,
    torneoNombre = "Torneo ASATEME",
    categorias = [],
    categoriaInicial = "",
    inscripcionCerrada = false,
    tokenSuperUsuario = "",
    onEstadoCambiado = null,
    service = null,
  }) {
    this.torneoId = torneoId;
    this.torneoNombre = torneoNombre;
    this.categorias = Array.isArray(categorias) ? categorias : [];
    this.categoriaActual =
      categoriaInicial ||
      (this.categorias[0] ? String(this.categorias[0]) : "");
    this.inscripcionCerrada = Boolean(inscripcionCerrada);
    this.tokenSuperUsuario = String(tokenSuperUsuario || "");
    this.onEstadoCambiado = onEstadoCambiado;
    this.service = service || new SembradoService();

    this.esSuperUsuario = false;
    this.zonasActuales = [];
    this.metaSembrado = null;
    this.container = null;
    this.mensajeEstado = "";
    this.tipoMensaje = "info"; // 'info' | 'success' | 'warning' | 'error'
  }

  escaparHtml(valor = "") {
    return String(valor ?? "").replace(
      /[&<>"']/g,
      (ch) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[ch],
    );
  }

  setMensaje(texto, tipo = "info") {
    this.mensajeEstado = texto;
    this.tipoMensaje = tipo;
  }

  async render(containerId) {
    this.container =
      typeof containerId === "string"
        ? document.getElementById(containerId)
        : containerId;

    if (!this.container) return;

    await this.cargarSembrado({ forzarRegenerar: false });
  }

  async cargarSembrado({ forzarRegenerar = false } = {}) {
    if (!this.container) return;

    if (!this.torneoId || !this.categoriaActual) {
      this.zonasActuales = [];
      this.metaSembrado = null;
      this.setMensaje(
        "Seleccioná un torneo y una categoría para visualizar el sembrado.",
        "info",
      );
      this.pintar();
      return;
    }

    this.setMensaje("Cargando sembrado de zonas...", "info");
    this.pintar();

    try {
      const resultado = await this.service.obtenerOGenerarSembrado({
        torneoId: this.torneoId,
        categoria: this.categoriaActual,
        inscripcionCerrada: this.inscripcionCerrada,
        forzarRegenerar,
      });

      this.metaSembrado = resultado;
      this.zonasActuales = resultado.zonas || [];

      if (resultado.origen === "pendiente_cierre") {
        this.setMensaje(
          "Las inscripciones aún no han finalizado. El sembrado en serpiente se generará automáticamente al cerrar la inscripción.",
          "warning",
        );
      } else if (resultado.origen === "generado_automatico") {
        this.setMensaje(
          "Sembrado en serpiente generado y guardado automáticamente.",
          "success",
        );
      } else {
        this.mensajeEstado = "";
      }
    } catch (error) {
      console.error("Error al cargar/generar sembrado:", error);
      this.setMensaje(
        "No se pudo cargar o generar el sembrado de la categoría.",
        "error",
      );
    }

    this.pintar();
  }

  async guardarAjustesManuales() {
    if (!this.esSuperUsuario) {
      this.setMensaje(
        "Se requiere modo superusuario / clave válida para guardar cambios manuales.",
        "warning",
      );
      this.pintar();
      return;
    }

    try {
      const guardadas = await this.service.guardarZonas(
        this.torneoId,
        this.categoriaActual,
        this.zonasActuales,
      );
      this.zonasActuales = guardadas;
      this.setMensaje("Cambios de zonas guardados correctamente.", "success");

      if (typeof this.onEstadoCambiado === "function") {
        await this.onEstadoCambiado({
          torneoId: this.torneoId,
          categoria: this.categoriaActual,
          zonas: this.zonasActuales,
        });
      }
    } catch (error) {
      console.error("Error al guardar ajustes manuales:", error);
      this.setMensaje("Error al guardar los ajustes en la base.", "error");
    }

    this.pintar();
  }

  renderBannerEstado() {
    if (!this.mensajeEstado) return "";

    const estilos = {
      info: "bg-blue-50 border-blue-200 text-blue-800",
      success: "bg-emerald-50 border-emerald-200 text-emerald-800",
      warning: "bg-amber-50 border-amber-200 text-amber-800",
      error: "bg-red-50 border-red-200 text-red-800",
    };

    const clase = estilos[this.tipoMensaje] || estilos.info;
    return `
      <div class="p-4 rounded-xl border text-xs font-medium ${clase}">
        ${this.escaparHtml(this.mensajeEstado)}
      </div>
    `;
  }

  renderResumen() {
    const totalJugadores = this.zonasActuales.reduce(
      (acc, z) => acc + (z.jugadores?.length || 0),
      0,
    );
    const totalZonas = this.zonasActuales.length;
    const choques = SembradoEngine.contarTotalChoquesClub(this.zonasActuales);
    const distribucion =
      this.metaSembrado?.tamanosZonas?.length > 0
        ? this.metaSembrado.tamanosZonas.join(" - ")
        : this.zonasActuales.map((z) => z.jugadores?.length || 0).join(" - ");

    return `
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div class="bg-gray-50 border border-gray-100 rounded-xl p-3.5">
          <span class="text-[11px] uppercase font-bold text-gray-400 block">Inscriptos en Cat.</span>
          <strong class="text-lg font-extrabold text-gray-800">${totalJugadores}</strong>
        </div>
        <div class="bg-gray-50 border border-gray-100 rounded-xl p-3.5">
          <span class="text-[11px] uppercase font-bold text-gray-400 block">Zonas Armadas</span>
          <strong class="text-lg font-extrabold text-asatemeBlue">${totalZonas}</strong>
        </div>
        <div class="bg-gray-50 border border-gray-100 rounded-xl p-3.5">
          <span class="text-[11px] uppercase font-bold text-gray-400 block">Cupos por Zona</span>
          <strong class="text-sm font-extrabold text-gray-800">${distribucion || "—"}</strong>
        </div>
        <div class="bg-gray-50 border border-gray-100 rounded-xl p-3.5">
          <span class="text-[11px] uppercase font-bold text-gray-400 block">Cruces de Club</span>
          <strong class="text-lg font-extrabold ${choques > 0 ? "text-amber-600" : "text-emerald-600"}">${choques}</strong>
        </div>
      </div>
    `;
  }

  renderTarjetaZona(zona) {
    const jugadores = zona.jugadores || [];
    const choquesZona = SembradoEngine.contarChoquesClubEnZona(jugadores);
    const opcionesDestino = this.zonasActuales
      .filter((z) => z.numeroZona !== zona.numeroZona)
      .map(
        (z) =>
          `<option value="${z.numeroZona}">Mover a Zona ${z.numeroZona}</option>`,
      )
      .join("");

    const filasJugadores = jugadores
      .map((j, idx) => {
        const esCabeza = idx === 0 || j.esCabezaDeSerie;
        const clubTexto =
          j.nombre_club ||
          (j.club_id ? `Club #${j.club_id}` : "Libre / Sin Club");
        const puntosTexto = `${Number(j.puntos ?? j.puntos_ranking ?? 0)} pts`;

        return `
          <li class="py-2.5 px-3 rounded-xl bg-gray-50 border border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div class="flex items-start sm:items-center gap-2.5">
              <span class="w-6 h-6 rounded-lg text-xs font-extrabold flex items-center justify-center shrink-0 ${
                esCabeza
                  ? "bg-asatemeBlue text-white"
                  : "bg-white border border-gray-200 text-gray-700"
              }">
                ${idx + 1}
              </span>
              <div>
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="text-xs font-bold text-gray-800 uppercase">
                    ${this.escaparHtml(j.nombre)}
                  </span>
                  ${
                    esCabeza
                      ? `<span class="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-asatemeBlue">Cabeza</span>`
                      : ""
                  }
                  ${
                    j.ajusteManual
                      ? `<span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">Ajuste manual</span>`
                      : ""
                  }
                </div>
                <p class="text-[11px] text-gray-500">
                  Club: <b class="text-gray-700">${this.escaparHtml(clubTexto)}</b> · Ranking: <b class="text-asatemeBlue">${this.escaparHtml(puntosTexto)}</b>
                </p>
              </div>
            </div>

            ${
              this.esSuperUsuario && opcionesDestino
                ? `
                  <select
                    aria-label="Mover ${this.escaparHtml(j.nombre)} a otra zona"
                    class="js-mover-jugador text-xs bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-gray-700 focus:outline-none focus:border-asatemeBlue"
                    data-jugador-id="${this.escaparHtml(j.id)}"
                  >
                    <option value="">Mover a...</option>
                    ${opcionesDestino}
                  </select>
                `
                : ""
            }
          </li>
        `;
      })
      .join("");

    return `
      <article class="bg-white rounded-2xl border ${
        choquesZona > 0 ? "border-amber-300" : "border-gray-200"
      } shadow-sm p-4 space-y-3">
        <div class="flex items-center justify-between border-b border-gray-100 pb-2.5">
          <div>
            <h4 class="text-sm font-extrabold text-gray-800">
              Zona ${this.escaparHtml(zona.numeroZona)}
            </h4>
            <span class="text-[11px] text-gray-400">
              ${jugadores.length} / ${this.escaparHtml(zona.capacidad || 3)} jugadores
            </span>
          </div>
          ${
            choquesZona > 0
              ? `<span class="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">${choquesZona} cruce(s) de club</span>`
              : `<span class="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">Clubes separados</span>`
          }
        </div>

        <ul class="space-y-2">
          ${
            filasJugadores ||
            `<li class="text-xs text-gray-400 text-center py-3">Sin jugadores asignados</li>`
          }
        </ul>
      </article>
    `;
  }

  pintar() {
    if (!this.container) return;

    const opcionesCategoria = this.categorias
      .map((cat) => {
        const val = String(cat);
        const selected = val === this.categoriaActual ? "selected" : "";
        return `<option value="${this.escaparHtml(val)}" ${selected}>${this.escaparHtml(val)}</option>`;
      })
      .join("");

    const grillaZonas =
      this.zonasActuales.length > 0
        ? `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            ${this.zonasActuales.map((z) => this.renderTarjetaZona(z)).join("")}
           </div>`
        : "";

    this.container.innerHTML = `
      <section class="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-8 space-y-6">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-100 pb-4">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-blue-50 text-asatemeBlue font-extrabold flex items-center justify-center">
              <i class="fas fa-sitemap"></i>
            </div>
            <div>
              <h3 class="text-base font-bold text-gray-800">
                Sembrado en Serpiente — ${this.escaparHtml(this.torneoNombre)}
              </h3>
              <p class="text-xs text-gray-500">
                ${
                  this.esSuperUsuario
                    ? "Modo superusuario activo: podés mover jugadores entre zonas y guardar cambios."
                    : "Visualización de zonas sembradas por ranking y separación por club."
                }
              </p>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            ${
              this.categorias.length > 0
                ? `
                  <select
                    id="sembrado-selector-categoria"
                    class="bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-800 focus:outline-none focus:border-asatemeBlue"
                  >
                    ${opcionesCategoria}
                  </select>
                `
                : ""
            }

            ${
              this.esSuperUsuario
                ? `
                  <button
                    type="button"
                    id="btn-regenerar-sembrado"
                    class="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    Recalcular serpiente
                  </button>
                  <button
                    type="button"
                    id="btn-guardar-sembrado-manual"
                    class="px-4 py-2.5 bg-asatemeBlue hover:bg-slate-800 text-white font-extrabold rounded-xl text-xs transition cursor-pointer shadow-sm"
                  >
                    Guardar zonas
                  </button>
                `
                : ""
            }
          </div>
        </div>

        ${this.renderBannerEstado()}
        ${this.renderResumen()}
        ${grillaZonas}

        <div class="pt-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <span class="text-[11px] text-gray-400">
            Zonas base de 3 (4 al final si el total no es múltiplo de 3) · Cabezales preservados en ajuste por club.
          </span>

          ${
            !this.esSuperUsuario && this.tokenSuperUsuario
              ? `
                <div class="flex items-center gap-2">
                  <input
                    type="password"
                    id="sembrado-token-input"
                    placeholder="Clave / token superusuario"
                    class="bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-asatemeBlue"
                  />
                  <button
                    type="button"
                    id="btn-activar-superuser"
                    class="px-3.5 py-1.5 bg-gray-800 hover:bg-gray-900 text-white font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    Habilitar edición
                  </button>
                </div>
              `
              : ""
          }
        </div>
      </section>
    `;

    this.conectarEventos();
  }

  conectarEventos() {
    if (!this.container) return;

    const selectorCat = this.container.querySelector(
      "#sembrado-selector-categoria",
    );
    selectorCat?.addEventListener("change", async (e) => {
      this.categoriaActual = e.target.value;
      await this.cargarSembrado({ forzarRegenerar: false });
    });

    const btnActivar = this.container.querySelector("#btn-activar-superuser");
    const inputToken = this.container.querySelector("#sembrado-token-input");
    btnActivar?.addEventListener("click", () => {
      const ingresado = String(inputToken?.value || "").trim();
      if (this.tokenSuperUsuario && ingresado === this.tokenSuperUsuario) {
        this.esSuperUsuario = true;
        this.setMensaje(
          "Modo superusuario habilitado. Podés reubicar jugadores entre zonas.",
          "success",
        );
      } else {
        this.setMensaje("Clave / token inválida.", "error");
      }
      this.pintar();
    });

    const btnRegenerar = this.container.querySelector(
      "#btn-regenerar-sembrado",
    );
    btnRegenerar?.addEventListener("click", async () => {
      await this.cargarSembrado({ forzarRegenerar: true });
    });

    const btnGuardarManual = this.container.querySelector(
      "#btn-guardar-sembrado-manual",
    );
    btnGuardarManual?.addEventListener("click", async () => {
      await this.guardarAjustesManuales();
    });

    this.container.querySelectorAll(".js-mover-jugador").forEach((selectEl) => {
      selectEl.addEventListener("change", (e) => {
        const zonaDestino = Number(e.target.value);
        const jugadorId = e.target.getAttribute("data-jugador-id");
        if (!zonaDestino || !jugadorId) return;

        this.zonasActuales = SembradoEngine.moverJugadorManual(
          this.zonasActuales,
          jugadorId,
          zonaDestino,
        );
        this.setMensaje(
          `Jugador reubicado en Zona ${zonaDestino}. Recordá presionar "Guardar zonas" para persistir.`,
          "info",
        );
        this.pintar();
      });
    });
  }
}
