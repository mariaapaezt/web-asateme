// js/componentes/inscripciones/ProvincialForm.js
import { JugadorModal } from "./JugadorModal.js";

const BYTES_WINDOWS_1252 = new Map([
  ["\u20ac", 0x80],
  ["\u201a", 0x82],
  ["\u0192", 0x83],
  ["\u201e", 0x84],
  ["\u2026", 0x85],
  ["\u2020", 0x86],
  ["\u2021", 0x87],
  ["\u02c6", 0x88],
  ["\u2030", 0x89],
  ["\u0160", 0x8a],
  ["\u2039", 0x8b],
  ["\u0152", 0x8c],
  ["\u017d", 0x8e],
  ["\u2018", 0x91],
  ["\u2019", 0x92],
  ["\u201c", 0x93],
  ["\u201d", 0x94],
  ["\u2022", 0x95],
  ["\u2013", 0x96],
  ["\u2014", 0x97],
  ["\u02dc", 0x98],
  ["\u2122", 0x99],
  ["\u0161", 0x9a],
  ["\u203a", 0x9b],
  ["\u0153", 0x9c],
  ["\u017e", 0x9e],
  ["\u0178", 0x9f],
]);
const DECODIFICADOR_UTF8 = new TextDecoder("utf-8", { fatal: true });

export class ProvincialForm {
  constructor({ inscripcionesAbiertas = true, onInscripcionExitosa }) {
    this.inscripcionesAbiertas = inscripcionesAbiertas;
    this.onInscripcionExitosa = onInscripcionExitosa;
    this.clubesRegistrados = [];
    this.numeroAdminWhatsApp = "5493412293463";

    this.jugadorModal = new JugadorModal({
      onGuardarExitoso: async (datosInscripcion) => {
        if (!this.inscripcionesAbiertas) return;

        await this.cargarClubesDeSupabase();
        this.limpiarBuscador();

        if (datosInscripcion.esNuevoPuro) {
          this.notificarAdminWhatsApp(datosInscripcion);
        }

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

  notificarAdminWhatsApp(datos) {
    const mensaje = encodeURIComponent(
      `*¡Hola Admin ASATEME!*\n\n` +
        `Se ha registrado un *NUEVO JUGADOR* en el padrón provincial y requiere validación:\n\n` +
        `*Nombre:* ${String(datos.nombre || "").toUpperCase()}\n` +
        `*DNI:* ${datos.dni}\n` +
        `*Club:* ${datos.nombreClub || "Sin Club"}\n` +
        `*Teléfono:* ${datos.telefono || "No especificado"}\n` +
        `*Email:* ${datos.email || "No especificado"}\n` +
        `*Categoría solicitada:* ${datos.notaCategoria || "No especificada"}\n\n` +
        `Por favor, validar sus datos y asignar la categoría correspondiente en el sistema.`,
    );
    window.open(
      `https://wa.me/${this.numeroAdminWhatsApp}?text=${mensaje}`,
      "_blank",
    );
  }

  repararTextoMalCodificado(valor) {
    let corregido = String(valor || "");

    for (let intento = 0; intento < 3; intento++) {
      let huboCambios = false;
      const resultado = corregido.replace(
        /(\u00c3|\u00c2)([^\s])/g,
        (secuencia, primerCaracter, segundoCaracter) => {
          const segundoCodigo = segundoCaracter.codePointAt(0);
          const segundoByte =
            segundoCodigo <= 0xff
              ? segundoCodigo
              : BYTES_WINDOWS_1252.get(segundoCaracter);

          if (segundoByte === undefined) return secuencia;

          try {
            const textoDecodificado = DECODIFICADOR_UTF8.decode(
              new Uint8Array([primerCaracter.charCodeAt(0), segundoByte]),
            );
            huboCambios = true;
            return textoDecodificado;
          } catch {
            return secuencia;
          }
        },
      );

      if (!huboCambios) break;
      corregido = resultado;
    }

    return corregido;
  }

  limpiarNombreClub(nombreCrudo) {
    if (!nombreCrudo) return "";
    let limpio = this.repararTextoMalCodificado(nombreCrudo.trim());
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
    return (
      excepciones[lower] || limpio.charAt(0).toUpperCase() + limpio.slice(1)
    );
  }

  normalizarNombre(nombre) {
    return this.repararTextoMalCodificado(nombre)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("es")
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .sort()
      .join(" ");
  }

  normalizarClub(nombre) {
    const palabras = this.repararTextoMalCodificado(nombre)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("es")
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (palabras[0] === "club") palabras.shift();
    return palabras.join(" ");
  }

  puntajeCompletitudJugador(j) {
    if (!j) return -1;
    let score = 0;
    if (j.dni && String(j.dni).trim() !== "") score += 100;
    if (j.club_id != null && String(j.club_id).trim() !== "") score += 40;
    if (j.fecha_nacimiento) score += 15;
    if (j.telefono && String(j.telefono).trim() !== "") score += 10;
    if (j.email && String(j.email).trim() !== "") score += 10;
    if (Number(j.puntos_ranking || 0) > 0) score += 10;
    return score;
  }

  elegirMejorJugador(candidatos = []) {
    if (!Array.isArray(candidatos) || candidatos.length === 0) return null;
    return [...candidatos].sort((a, b) => {
      const diff =
        this.puntajeCompletitudJugador(b) - this.puntajeCompletitudJugador(a);
      if (diff !== 0) return diff;
      return Number(a.id || 0) - Number(b.id || 0);
    })[0];
  }

  obtenerPatronesBusqueda(termino) {
    const palabra = this.normalizarNombre(termino).replace(/\s/g, "");
    if (!palabra) return [];

    const patrones = new Set([`%${palabra}%`]);
    patrones.add(`%${palabra.replace(/[aeiou]/g, "_")}%`);

    const consonantes = palabra.replace(/[aeiou]/g, "");
    if (consonantes.length >= 2) {
      patrones.add(`%${consonantes.split("").join("%")}%`);
    }

    return [...patrones];
  }

  async buscarPorTerminos(tabla, columnas, columnaNombre, terminos, periodo) {
    const consultas = terminos.flatMap((termino) =>
      this.obtenerPatronesBusqueda(termino).map((patron) => {
        let consulta = window.supabase
          .from(tabla)
          .select(columnas)
          .ilike(columnaNombre, patron);

        if (periodo) consulta = consulta.eq("periodo", periodo);
        return consulta.limit(50);
      }),
    );
    const resultados = await Promise.all(consultas);
    const registros = new Map();

    resultados.forEach(({ data, error }) => {
      if (error) throw error;
      (data || []).forEach((registro) => {
        registros.set(String(registro.id), registro);
      });
    });

    const terminosNormalizados = terminos.map((termino) =>
      this.normalizarNombre(termino),
    );

    return [...registros.values()]
      .filter((registro) => {
        const nombre = this.normalizarNombre(registro[columnaNombre]);
        return terminosNormalizados.every((termino) =>
          nombre.includes(termino),
        );
      })
      .slice(0, 50);
  }

  escaparHtml(valor) {
    return this.repararTextoMalCodificado(valor).replace(
      /[&<>"']/g,
      (caracter) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[caracter],
    );
  }

  async render(containerId) {
    const contenedor = document.getElementById(containerId);
    if (!contenedor) return;

    await this.cargarClubesDeSupabase();

    if (!this.inscripcionesAbiertas) {
      contenedor.innerHTML = `
        <div class="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-8 text-center space-y-4">
            <div class="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl mx-auto flex items-center justify-center text-xl shadow-inner">
                <i class="fas fa-lock"></i>
            </div>
            <h3 class="text-base font-bold text-gray-800">Inscripciones Cerradas</h3>
            <p class="text-xs text-gray-500 max-w-md mx-auto">El período de inscripción para este Torneo Provincial ha finalizado.</p>
        </div>`;
      return;
    }

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
              <input type="text" id="prov-nombre-buscar" placeholder="Buscar por NOMBRE o APELLIDO" 
                     class="flex-grow bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-medium text-gray-800 focus:outline-none focus:border-asatemeBlue focus:bg-white uppercase">
              <button type="button" id="btn-buscar-nombre" class="px-6 py-3 bg-asatemeBlue hover:bg-slate-800 text-white font-extrabold rounded-xl text-xs transition-all cursor-pointer shadow-md">
                  <i class="fas fa-search mr-1.5"></i> Buscar
              </button>
          </div>

          <div id="resultado-sugerencias-ranking" class="space-y-3"></div>
      </div>`;

    this.conectarEventosBusqueda();
  }

  async cargarClubesDeSupabase() {
    try {
      if (!window.supabase) return;
      const { data, error } = await window.supabase
        .from("clubes")
        .select("id, nombre");
      if (!error && data) {
        this.clubesRegistrados = data
          .map((c) => ({
            id: c.id,
            nombreLimpio: this.limpiarNombreClub(c.nombre),
          }))
          .sort((a, b) => a.nombreLimpio.localeCompare(b.nombreLimpio));
      }
    } catch (e) {
      console.warn("No se pudieron cargar los clubes:", e);
    }
  }

  conectarEventosBusqueda() {
    if (!this.inscripcionesAbiertas) return;

    const btnBuscar = document.getElementById("btn-buscar-nombre");
    const inputNombre = document.getElementById("prov-nombre-buscar");

    const ejecutarBusqueda = async () => {
      const query = inputNombre.value.trim();
      const terminosBusqueda = [
        ...new Set(
          query
            .split(/\s+/)
            .map((termino) => this.normalizarNombre(termino))
            .filter(Boolean),
        ),
      ];
      const contenedorSugerencias = document.getElementById(
        "resultado-sugerencias-ranking",
      );

      if (!query || query.length < 2 || terminosBusqueda.length === 0) {
        alert("⚠️ Ingresá al menos 2 letras para realizar la búsqueda.");
        return;
      }

      btnBuscar.disabled = true;
      btnBuscar.innerHTML = `<i class="fas fa-spinner fa-spin"></i>`;
      contenedorSugerencias.innerHTML = `<p class="text-xs text-gray-400 text-center py-4"><i class="fas fa-spinner fa-spin mr-1"></i> Buscando...</p>`;

      try {
        if (!this.clubesRegistrados || this.clubesRegistrados.length === 0) {
          await this.cargarClubesDeSupabase();
        }

        const { data: periodoRanking } = await window.supabase
          .from("ranking")
          .select("periodo")
          .order("created_at", { ascending: false })
          .limit(1);

        const periodoActual = periodoRanking?.[0]?.periodo;

        const [jugadoresCoincidencias, rankingCoincidencias] =
          await Promise.all([
            this.buscarPorTerminos(
              "jugadores",
              "id, nombre, dni, club_id, equipo_id, fecha_nacimiento, telefono, email, puntos_ranking",
              "nombre",
              terminosBusqueda,
            ),
            periodoActual
              ? this.buscarPorTerminos(
                  "ranking",
                  "id, jugador, club, puntos, categoria, periodo",
                  "jugador",
                  terminosBusqueda,
                  periodoActual,
                )
              : Promise.resolve([]),
          ]);

        const padronPorRanking = new Map();
        const idsPadronVinculados = new Set();

        rankingCoincidencias.forEach((item, indice) => {
          const coincidencias = jugadoresCoincidencias.filter((jugador) => {
            return (
              this.normalizarNombre(jugador.nombre) ===
              this.normalizarNombre(item.jugador)
            );
          });

          const mejorCandidato = this.elegirMejorJugador(coincidencias);
          if (mejorCandidato) {
            padronPorRanking.set(indice, mejorCandidato);
            idsPadronVinculados.add(String(mejorCandidato.id));
          }
        });

        const jugadoresSoloEnPadron = jugadoresCoincidencias
          .filter((j) => !idsPadronVinculados.has(String(j.id)))
          .slice(0, 10);

        const rankingVisible = rankingCoincidencias.slice(0, 10);

        if (jugadoresSoloEnPadron.length === 0 && rankingVisible.length === 0) {
          contenedorSugerencias.innerHTML = `
            <div class="p-6 bg-amber-50 border border-amber-200 rounded-2xl text-center space-y-3">
                <p class="text-xs font-bold text-amber-800">No encontramos registros con ese nombre.</p>
                <button type="button" id="btn-registrar-desde-cero" class="px-5 py-2.5 bg-asatemeRed hover:bg-red-700 text-white font-bold rounded-xl text-xs transition shadow cursor-pointer">
                    <i class="fas fa-user-plus mr-1"></i> Registrar Jugador Nuevo
                </button>
            </div>`;
          document.getElementById("btn-registrar-desde-cero").onclick = () => {
            this.jugadorModal.abrir(null, null, this.clubesRegistrados);
          };
          return;
        }

        let htmlResultados = `<div class="space-y-3 pt-2">`;

        if (jugadoresSoloEnPadron.length > 0) {
          htmlResultados += `<span class="text-[11px] font-extrabold text-asatemeBlue uppercase tracking-wider block">Jugadores en Padrón (Nuevos sin ranking):</span>`;
          jugadoresSoloEnPadron.forEach((j) => {
            const nombreMayus = String(j.nombre || "").toUpperCase();
            const clubEncontrado = this.clubesRegistrados.find(
              (c) => String(c.id) === String(j.club_id),
            );
            const nombreClub = clubEncontrado
              ? clubEncontrado.nombreLimpio
              : "Sin Club";
            htmlResultados += `
              <div class="p-4 bg-gray-50 hover:bg-blue-50/50 border border-gray-100 rounded-2xl flex justify-between items-center gap-3 transition">
                  <div>
                      <h4 class="font-bold text-gray-800 text-sm">${this.escaparHtml(nombreMayus)}</h4>
                      <p class="text-xs text-gray-500">Club: <b class="text-gray-700">${this.escaparHtml(nombreClub)}</b></p>
                  </div>
                  <button type="button" class="px-4 py-2 bg-asatemeBlue text-white font-bold rounded-xl text-xs transition hover:bg-slate-800 cursor-pointer seleccionar-padron-btn" data-jugador-id="${encodeURIComponent(j.id)}">Seleccionar</button>
              </div>`;
          });
        }

        if (rankingVisible.length > 0) {
          htmlResultados += `<span class="text-[11px] font-extrabold text-asatemeBlue uppercase tracking-wider block mt-3">Jugadores en Ranking Actual (Unificado):</span>`;
          rankingVisible.forEach((item, indice) => {
            const nombreMayus = String(item.jugador || "").toUpperCase();
            const clubLimpio = this.limpiarNombreClub(item.club);
            htmlResultados += `
              <div class="p-4 bg-gray-50 hover:bg-blue-50/50 border border-gray-100 rounded-2xl flex justify-between items-center gap-3 transition">
                  <div>
                      <h4 class="font-bold text-gray-800 text-sm">${this.escaparHtml(nombreMayus)}</h4>
                      <p class="text-xs text-gray-500">Club: <b class="text-gray-700">${this.escaparHtml(clubLimpio)}</b> · Puntos: <b class="text-asatemeBlue">${item.puntos} pts</b> (${this.escaparHtml(item.categoria)})</p>
                  </div>
                  <button type="button" class="px-4 py-2 bg-asatemeBlue text-white font-bold rounded-xl text-xs transition hover:bg-slate-800 cursor-pointer seleccionar-ranking-btn" data-ranking-indice="${indice}">Seleccionar</button>
              </div>`;
          });
        }

        htmlResultados += `</div>`;
        contenedorSugerencias.innerHTML = htmlResultados;

        document.querySelectorAll(".seleccionar-padron-btn").forEach((btn) => {
          btn.onclick = async () => {
            if (
              !this.clubesRegistrados ||
              this.clubesRegistrados.length === 0
            ) {
              await this.cargarClubesDeSupabase();
            }
            const { data } = await window.supabase
              .from("jugadores")
              .select("*")
              .eq("id", decodeURIComponent(btn.getAttribute("data-jugador-id")))
              .single();
            this.jugadorModal.abrir(data, null, this.clubesRegistrados);
          };
        });

        document.querySelectorAll(".seleccionar-ranking-btn").forEach((btn) => {
          btn.onclick = async () => {
            const indice = Number(btn.getAttribute("data-ranking-indice"));
            const item = rankingVisible[indice];
            let jugadorExistente = null;

            if (
              !this.clubesRegistrados ||
              this.clubesRegistrados.length === 0
            ) {
              await this.cargarClubesDeSupabase();
            }

            const jugadorVinculado = padronPorRanking.get(indice);
            if (jugadorVinculado) {
              const { data } = await window.supabase
                .from("jugadores")
                .select("*")
                .eq("id", jugadorVinculado.id)
                .maybeSingle();
              jugadorExistente = data;
            }

            if (!jugadorExistente && item?.jugador) {
              const terminosItem = [
                ...new Set(
                  String(item.jugador)
                    .split(/\s+/)
                    .map((t) => this.normalizarNombre(t))
                    .filter(Boolean),
                ),
              ];
              if (terminosItem.length > 0) {
                const candidatosExtra = await this.buscarPorTerminos(
                  "jugadores",
                  "*",
                  "nombre",
                  terminosItem,
                );
                const exactos = candidatosExtra.filter(
                  (c) =>
                    this.normalizarNombre(c.nombre) ===
                    this.normalizarNombre(item.jugador),
                );
                jugadorExistente = this.elegirMejorJugador(
                  exactos.length > 0 ? exactos : candidatosExtra,
                );
              }
            }

            const clubNormRanking = this.normalizarClub(item.club);
            const clubObj =
              this.clubesRegistrados.find(
                (c) => this.normalizarClub(c.nombreLimpio) === clubNormRanking,
              ) ||
              this.clubesRegistrados.find((c) => {
                const cNorm = this.normalizarClub(c.nombreLimpio);
                return (
                  clubNormRanking &&
                  cNorm &&
                  (cNorm.includes(clubNormRanking) ||
                    clubNormRanking.includes(cNorm))
                );
              });

            this.jugadorModal.abrir(
              jugadorExistente,
              {
                nombre: String(item.jugador || "").toUpperCase(),
                club: this.limpiarNombreClub(item.club),
                clubId: clubObj ? clubObj.id : null,
                puntos: parseInt(item.puntos) || 0,
              },
              this.clubesRegistrados,
            );
          };
        });
      } catch (err) {
        console.error("Error en búsqueda:", err);
        alert("⚠️ Ocurrió un error al realizar la búsqueda.");
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

  async obtenerClienteSupabase() {
    if (window.supabase) return window.supabase;
    for (let i = 0; i < 20; i++) {
      await new Promise((res) => setTimeout(res, 100));
      if (window.supabase) return window.supabase;
    }
    return null;
  }

  async cargarClubesDeSupabase() {
    try {
      const clienteSupabase = await this.obtenerClienteSupabase();
      if (!clienteSupabase) {
        console.warn("Supabase no se inicializó a tiempo para cargar clubes.");
        return;
      }

      const { data, error } = await clienteSupabase
        .from("clubes")
        .select("id, nombre");

      if (error) {
        console.error("Error consultando tabla clubes:", error);
        return;
      }

      if (data) {
        this.clubesRegistrados = data
          .map((c) => ({
            id: c.id,
            nombreLimpio: this.limpiarNombreClub(c.nombre),
          }))
          .sort((a, b) => a.nombreLimpio.localeCompare(b.nombreLimpio));
      }
    } catch (e) {
      console.warn("No se pudieron cargar los clubes:", e);
    }
  }
}

