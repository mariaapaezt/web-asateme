// js/componentes/inscripciones/ProvincialForm.js
import { JugadorModal } from "./JugadorModal.js";

export class ProvincialForm {
  constructor({ onInscripcionExitosa }) {
    this.onInscripcionExitosa = onInscripcionExitosa;
    this.clubesRegistrados = [];

    // ⚠️ Reemplazar por el número real del administrador (+54 9 341 XXX-XXXX)
    this.numeroAdminWhatsApp = "5493412293463";

    // Instanciamos el modal modular de jugadores
    this.jugadorModal = new JugadorModal({
      onGuardarExitoso: async (datosInscripcion) => {
        // 1. Refrescar lista local de clubes por si se creó uno nuevo
        await this.cargarClubesDeSupabase();

        // 2. Limpiar la interfaz de búsqueda
        this.limpiarBuscador();

        // 3. Notificación vía WhatsApp si es Jugador Nuevo Puro
        if (datosInscripcion.esNuevoPuro) {
          this.notificarAdminWhatsApp(datosInscripcion);
        }

        // 4. Delegar evento a la vista principal (ProvincialVista)
        if (typeof this.onInscripcionExitosa === "function") {
          await this.onInscripcionExitosa(datosInscripcion);
        }
      },
    });
  }

  limpiarBuscador() {
    const inputNombre = document.getElementById("prov-nombre-buscar");
    const contenedorSugerencias = document.getElementById(
      "resultado-sugerencias-ranking",
    );
    if (inputNombre) inputNombre.value = "";
    if (contenedorSugerencias) contenedorSugerencias.innerHTML = "";
  }

  /**
   * Genera el mensaje estructurado y redirige a WhatsApp Web/App
   */
  notificarAdminWhatsApp(datos) {
    const mensaje = encodeURIComponent(
      `👋 *¡Hola Admin ASATEME!*\n\n` +
        `Se ha registrado un *NUEVO JUGADOR* en el padrón provincial y requiere validación de ranking:\n\n` +
        `👤 *Nombre:* ${datos.nombre}\n` +
        `🪪 *DNI:* ${datos.dni}\n` +
        `🏓 *Club:* ${datos.nombreClub || "Sin Club"}\n` +
        `📞 *Teléfono:* ${datos.telefono || "No especificado"}\n` +
        `✉️ *Email:* ${datos.email || "No especificado"}\n\n` +
        `Por favor, validar la categoría asignada para habilitar sus próximas inscripciones.`,
    );

    const urlWhatsApp = `https://wa.me/${this.numeroAdminWhatsApp}?text=${mensaje}`;
    window.open(urlWhatsApp, "_blank");
  }

  limpiarNombreClub(nombreCrudo) {
    if (!nombreCrudo) return "";
    let limpio = nombreCrudo.trim();

    limpio = limpio.replace(/\s+[A-Za-z]\d*$/i, "");

    const excepciones = {
      ger: "GER",
      atlantico: "Atlántico",
      provincial: "Provincial",
      sionista: "Sionista",
      estudantil: "Estudantil",
      estudiantil: "Estudantil",
      casba: "CASBA",
    };

    const lower = limpio.toLowerCase();
    if (excepciones[lower]) return excepciones[lower];

    return limpio.charAt(0).toUpperCase() + limpio.slice(1);
  }

  async render(containerId) {
    const contenedor = document.getElementById(containerId);
    if (!contenedor) return;

    await this.cargarClubesDeSupabase();

    contenedor.innerHTML = `
      <div class="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-8 space-y-6">
          <div class="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div class="w-8 h-8 rounded-lg bg-blue-50 text-asatemeBlue font-bold flex items-center justify-center">1</div>
              <div>
                  <h3 class="text-base font-bold text-gray-800">Búsqueda en el Padrón y Ranking Provincial</h3>
                  <p class="text-xs text-gray-500">Ingresá tu apellido o nombre para encontrarte en el ranking oficial.</p>
              </div>
          </div>

          <div class="flex gap-3">
              <input type="text" id="prov-nombre-buscar" placeholder="Ej.: Pérez Juan (o apellido)..." 
                     class="flex-grow bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-medium text-gray-800 focus:outline-none focus:border-asatemeBlue focus:bg-white">
              <button type="button" id="btn-buscar-nombre" class="px-6 py-3 bg-asatemeBlue hover:bg-slate-800 text-white font-extrabold rounded-xl text-xs transition-all cursor-pointer shadow-md">
                  <i class="fas fa-search mr-1.5"></i> Buscar
              </button>
          </div>

          <div id="resultado-sugerencias-ranking" class="space-y-3"></div>
      </div>
    `;

    this.conectarEventosBusqueda();
  }

  async cargarClubesDeSupabase() {
    try {
      if (!window.supabase) return;
      const { data, error } = await window.supabase
        .from("equipos")
        .select("id, nombre");
      if (!error && data) {
        const clubesLimpios = data.map((c) => ({
          id: c.id,
          nombreLimpio: this.limpiarNombreClub(c.nombre),
        }));

        const nombresVistos = new Set();
        this.clubesRegistrados = clubesLimpios
          .filter((c) => {
            const clave = c.nombreLimpio.toLowerCase();
            if (nombresVistos.has(clave)) return false;
            nombresVistos.add(clave);
            return true;
          })
          .sort((a, b) => a.nombreLimpio.localeCompare(b.nombreLimpio));
      }
    } catch (e) {
      console.warn("No se pudieron cargar los clubes:", e);
    }
  }

  conectarEventosBusqueda() {
    const btnBuscar = document.getElementById("btn-buscar-nombre");
    const inputNombre = document.getElementById("prov-nombre-buscar");

    const ejecutarBusqueda = async () => {
      const query = inputNombre.value.trim();
      const contenedorSugerencias = document.getElementById(
        "resultado-sugerencias-ranking",
      );

      if (!query || query.length < 2) {
        alert("⚠️ Ingresá al menos 2 letras para realizar la búsqueda.");
        return;
      }

      btnBuscar.disabled = true;
      btnBuscar.innerHTML = `<i class="fas fa-spinner fa-spin"></i>`;
      contenedorSugerencias.innerHTML = `<p class="text-xs text-gray-400 text-center py-4"><i class="fas fa-spinner fa-spin mr-1"></i> Buscando en el ranking oficial...</p>`;

      try {
        const { data: rankingCoincidencias, error } = await window.supabase
          .from("ranking")
          .select("id, jugador, club, puntos, categoria, periodo")
          .ilike("jugador", `%${query}%`)
          .limit(10);

        if (error) throw error;

        if (!rankingCoincidencias || rankingCoincidencias.length === 0) {
          contenedorSugerencias.innerHTML = `
            <div class="p-6 bg-amber-50 border border-amber-200 rounded-2xl text-center space-y-3">
                <p class="text-xs font-bold text-amber-800">No encontramos registros con ese nombre en el ranking oficial.</p>
                <button type="button" id="btn-registrar-desde-cero" class="px-5 py-2.5 bg-asatemeRed hover:bg-red-700 text-white font-bold rounded-xl text-xs transition shadow cursor-pointer">
                    <i class="fas fa-user-plus mr-1"></i> Registrar Jugador Nuevo
                </button>
            </div>
          `;
          document.getElementById("btn-registrar-desde-cero").onclick = () => {
            this.jugadorModal.abrir(null, null, this.clubesRegistrados);
          };
          return;
        }

        contenedorSugerencias.innerHTML = `
          <div class="space-y-2 pt-2">
              <span class="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider block">Coincidencias en el Ranking:</span>
              ${rankingCoincidencias
                .map((item) => {
                  const clubLimpio = this.limpiarNombreClub(item.club);
                  return `
                      <div class="p-4 bg-gray-50 hover:bg-blue-50/50 border border-gray-100 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition">
                          <div>
                              <h4 class="font-bold text-gray-800 text-sm">${item.jugador}</h4>
                              <p class="text-xs text-gray-500">Club: <b class="text-gray-700">${clubLimpio}</b> · Puntos: <b class="text-asatemeBlue">${item.puntos} pts</b> (${item.categoria})</p>
                          </div>
                          <button type="button" class="px-4 py-2 bg-asatemeBlue text-white font-bold rounded-xl text-xs transition shadow-sm hover:bg-slate-800 cursor-pointer seleccionar-ranking-btn"
                                  data-nombre="${item.jugador}" data-club="${clubLimpio}" data-puntos="${item.puntos}">
                              Seleccionar
                          </button>
                      </div>
                  `;
                })
                .join("")}

              <div class="pt-3 text-center border-t border-gray-100">
                  <button type="button" id="btn-registrar-desde-cero-alt" class="text-xs text-asatemeRed font-bold hover:underline">
                      ¿No figurás en la lista? Registrate como jugador nuevo
                  </button>
              </div>
          </div>
        `;

        document.getElementById("btn-registrar-desde-cero-alt").onclick =
          () => {
            this.jugadorModal.abrir(null, null, this.clubesRegistrados);
          };

        document.querySelectorAll(".seleccionar-ranking-btn").forEach((btn) => {
          btn.onclick = async () => {
            const nombreRanking = btn.getAttribute("data-nombre");
            const clubRanking = btn.getAttribute("data-club");
            const puntosRanking =
              parseInt(btn.getAttribute("data-puntos")) || 0;

            const { data: jugadorExistente } = await window.supabase
              .from("jugadores")
              .select("*")
              .ilike("nombre", nombreRanking)
              .maybeSingle();

            this.jugadorModal.abrir(
              jugadorExistente,
              {
                nombre: nombreRanking,
                club: clubRanking,
                puntos: puntosRanking,
              },
              this.clubesRegistrados,
            );
          };
        });
      } catch (err) {
        console.error("Error en búsqueda:", err);
        alert("⚠️ Ocurrió un error al consultar el ranking.");
      } finally {
        btnBuscar.disabled = false;
        btnBuscar.innerHTML = `<i class="fas fa-search mr-1.5"></i> Buscar`;
      }
    };

    btnBuscar?.addEventListener("click", ejecutarBusqueda);
    inputNombre?.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        ejecutarBusqueda();
      }
    });
  }
}
