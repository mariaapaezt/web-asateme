// js/componentes/inscripciones/JugadorModal.js
import { RANGOS_PUNTOS_PROVINCIAL } from "../../utils/provincialConfig.js";

export class JugadorModal {
  constructor({ onGuardarExitoso }) {
    this.onGuardarExitoso = onGuardarExitoso;
    this.containerId = "modal-perfil-jugador-container";
  }

  async abrir(jugadorData, rankingData, clubesRegistrados = []) {
    let contenedor = document.getElementById(this.containerId);
    if (!contenedor) {
      contenedor = document.createElement("div");
      contenedor.id = this.containerId;
      document.body.appendChild(contenedor);
    }

    const esEdicion = !!jugadorData;
    const esJugadorNuevoPuro = !jugadorData && !rankingData;

    const nombreFinal = (
      jugadorData ? jugadorData.nombre : rankingData ? rankingData.nombre : ""
    ).toUpperCase();

    const dniFinal = jugadorData ? jugadorData.dni || "" : "";
    const fnacFinal = jugadorData ? jugadorData.fecha_nacimiento || "" : "";
    const generoFinal = jugadorData
      ? jugadorData.genero || "Masculino"
      : "Masculino";

    // Extraemos el teléfono y email si ya están guardados en jugadorData
    const telefonoFinal = jugadorData ? jugadorData.telefono || "" : "";
    const emailFinal = jugadorData ? jugadorData.email || "" : "";

    const puntosFinal = rankingData
      ? rankingData.puntos
      : jugadorData
        ? jugadorData.puntos_ranking || 0
        : 0;
    const clubSugerido = rankingData ? rankingData.club : "";

    const opcionesClubes = clubesRegistrados
      .map((c) => {
        const seleccionado =
          (jugadorData && String(jugadorData.equipo_id) === String(c.id)) ||
          (!jugadorData &&
            c.nombreLimpio.toLowerCase() === clubSugerido.toLowerCase())
            ? "selected"
            : "";
        return `<option value="${c.id}" ${seleccionado}>${c.nombreLimpio}</option>`;
      })
      .join("");

    let categoriaPrincipal = "Quinta";
    RANGOS_PUNTOS_PROVINCIAL.forEach((rango) => {
      if (puntosFinal >= rango.min && puntosFinal <= rango.max) {
        categoriaPrincipal = rango.categoria;
      }
    });

    const jerarquiaCategorias = [
      "Quinta",
      "Cuarta",
      "Tercera",
      "Segunda",
      "Primera",
    ];
    const indexCatActual = jerarquiaCategorias.indexOf(categoriaPrincipal);
    const categoriaSuperior =
      indexCatActual !== -1 && indexCatActual < jerarquiaCategorias.length - 1
        ? jerarquiaCategorias[indexCatActual + 1]
        : null;

    contenedor.innerHTML = `
      <div class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div class="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-100 p-5 sm:p-6 space-y-4 my-auto animate-in fade-in duration-200">
              
              <!-- Cabecera fija -->
              <div class="flex items-center justify-between border-b border-gray-100 pb-3 shrink-0">
                  <div class="flex items-center gap-3">
                      <div class="w-9 h-9 bg-blue-100 text-asatemeBlue rounded-full flex items-center justify-center text-base font-bold">
                          <i class="fas fa-user-check"></i>
                      </div>
                      <div>
                          <h3 class="text-sm sm:text-base font-black text-gray-800">${esEdicion ? "Perfil del Jugador (Actualizar)" : esJugadorNuevoPuro ? "Registro en Padrón (Jugador Nuevo)" : "Registro de Jugador"}</h3>
                          <p class="text-[11px] text-gray-500">${esJugadorNuevoPuro ? "Guardado exclusivo en padrón para validación admin" : `Ranking actual: <b>${puntosFinal} pts</b> (${categoriaPrincipal})`}</p>
                      </div>
                  </div>
                  <button type="button" id="btn-cerrar-modal-perfil" class="text-gray-400 hover:text-gray-600 text-lg cursor-pointer p-1">
                      <i class="fas fa-times"></i>
                  </button>
              </div>

              <!-- Formulario con scroll interno responsivo -->
              <div class="overflow-y-auto pr-1 space-y-3.5">
                  <form id="form-perfil-jugador" class="space-y-3.5">
                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                              <label class="block text-[11px] font-bold text-gray-700 uppercase mb-1">Nombre Completo *</label>
                              <input type="text" id="perfil-nombre" value="${nombreFinal}" required placeholder="EJ: PÉREZ JUAN"
                                     class="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-medium text-gray-800 focus:outline-none focus:border-asatemeBlue uppercase">
                          </div>
                          <div>
                              <label class="block text-[11px] font-bold text-gray-700 uppercase mb-1">DNI *</label>
                              <input type="text" id="perfil-dni" value="${dniFinal}" maxlength="8" required placeholder="Solo números (ej: 38123456)"
                                     class="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-medium text-gray-800 focus:outline-none focus:border-asatemeBlue">
                          </div>
                      </div>

                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                              <label class="block text-[11px] font-bold text-gray-700 uppercase mb-1">Fecha de Nacimiento *</label>
                              <input type="date" id="perfil-fnac" value="${fnacFinal}" required 
                                     class="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-medium text-gray-800 focus:outline-none focus:border-asatemeBlue">
                          </div>
                          <div>
                              <label class="block text-[11px] font-bold text-gray-700 uppercase mb-1">Género *</label>
                              <select id="perfil-genero" class="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-medium text-gray-800 focus:outline-none focus:border-asatemeBlue">
                                  <option value="Masculino" ${generoFinal === "Masculino" ? "selected" : ""}>Masculino</option>
                                  <option value="Femenino" ${generoFinal === "Femenino" ? "selected" : ""}>Femenino</option>
                              </select>
                          </div>
                      </div>

                      <div>
                          <label class="block text-[11px] font-bold text-gray-700 uppercase mb-1">Club *</label>
                          <select id="perfil-club-select" class="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-medium text-gray-800 focus:outline-none focus:border-asatemeBlue">
                              <option value="">Seleccioná un club...</option>
                              ${opcionesClubes}
                              <option value="OTRO">➕ Agregar club nuevo...</option>
                          </select>
                          <input type="text" id="perfil-club-nuevo" placeholder="Escribí el nombre del nuevo club..." 
                                 class="hidden mt-2 w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-medium text-gray-800 focus:outline-none focus:border-asatemeBlue uppercase">
                      </div>

                      <!-- Teléfono y Email precargados y obligatorios para todos los casos -->
                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                          <div>
                              <label class="block text-[11px] font-bold text-gray-700 uppercase mb-1">Teléfono de Contacto *</label>
                              <input type="tel" id="perfil-telefono" value="${telefonoFinal}" required placeholder="Ej: 3415123456 (Mín. 10 dígitos)" 
                                     class="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-medium text-gray-800 focus:outline-none focus:border-asatemeBlue">
                          </div>
                          <div>
                              <label class="block text-[11px] font-bold text-gray-700 uppercase mb-1">Correo Electrónico *</label>
                              <input type="email" id="perfil-email" value="${emailFinal}" required placeholder="correo@ejemplo.com" 
                                     class="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-medium text-gray-800 focus:outline-none focus:border-asatemeBlue">
                          </div>
                      </div>

                      <!-- Nota de categoría exclusiva para jugador nuevo puro -->
                      ${
                        esJugadorNuevoPuro
                          ? `
                        <div>
                            <label class="block text-[11px] font-bold text-gray-700 uppercase mb-1">Categoría/s en las que desea participar *</label>
                            <textarea id="perfil-nota-categoria" required rows="2" placeholder="Ej: Me quiero anotar en Tercera y Cuarta" 
                                      class="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-medium text-gray-800 focus:outline-none focus:border-asatemeBlue"></textarea>
                        </div>

                        <div class="p-3.5 bg-red-50 border-l-4 border-asatemeRed rounded-r-xl text-gray-800 text-xs space-y-1 shadow-xs">
                            <div class="font-extrabold text-asatemeRed uppercase tracking-wide text-[11px] flex items-center gap-1.5 mb-1">
                                <i class="fab fa-whatsapp text-sm text-green-600"></i> Aviso importante sobre tu registro
                            </div>
                            <p class="leading-relaxed">Al registrarte, se abrirá automáticamente <b>WhatsApp</b> con un mensaje redactado con tus datos y la categoría solicitada para notificar al administrador.</p>
                        </div>
                      `
                          : ""
                      }

                      <!-- Bloque de Categorías (Oculto completamente si es jugador nuevo puro) -->
                      <div class="pt-2 border-t border-gray-100 space-y-2 ${esJugadorNuevoPuro ? "hidden" : ""}">
                          <label class="block text-[11px] font-bold text-gray-700 uppercase">Categorías habilitadas (Máx. 2):</label>
                          <div id="contenedor-checkboxes-categorias" class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <!-- Renderizado dinámico -->
                          </div>
                      </div>

                      <div class="flex gap-3 pt-2">
                          <button type="submit" id="btn-submit-perfil" class="flex-grow py-3 bg-asatemeBlue hover:bg-slate-800 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md transition">
                              ${esEdicion ? "Guardar Cambios e Inscribir" : esJugadorNuevoPuro ? "Registrar en Padrón y Notificar" : "Registrar e Inscribir al Torneo"}
                          </button>
                          <button type="button" id="btn-cancelar-modal" class="px-5 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl text-xs cursor-pointer">Cancelar</button>
                      </div>
                  </form>
              </div>
          </div>
      </div>
    `;

    const inputDniElem = document.getElementById("perfil-dni");
    if (inputDniElem) {
      inputDniElem.addEventListener("input", (e) => {
        e.target.value = e.target.value.replace(/\D/g, "");
      });
    }

    const inputTelElem = document.getElementById("perfil-telefono");
    if (inputTelElem) {
      inputTelElem.addEventListener("input", (e) => {
        e.target.value = e.target.value.replace(/\D/g, "");
      });
    }

    const actualizarCategoriasHabilitadas = () => {
      if (esJugadorNuevoPuro) return;

      const fnacVal = document.getElementById("perfil-fnac").value;
      let esSub13Habilitado = false;

      if (fnacVal) {
        const anioNacimiento = new Date(fnacVal).getFullYear();
        const edad = 2026 - anioNacimiento;
        if (edad < 13) esSub13Habilitado = true;
      }

      let htmlCheckboxes = `
        <label class="flex items-center gap-2 p-2 rounded-lg border bg-white border-blue-200 cursor-pointer hover:border-asatemeBlue transition">
            <input type="checkbox" name="cat-prov-modal" value="${categoriaPrincipal}" checked class="cat-prov-cb w-3.5 h-3.5 text-asatemeBlue rounded">
            <div>
                <span class="block text-[11px] font-bold text-gray-800 leading-tight">Categoría ${categoriaPrincipal}</span>
                <span class="text-[9px] text-gray-400">Puntaje base: ${puntosFinal} pts</span>
            </div>
        </label>
      `;

      if (categoriaSuperior) {
        htmlCheckboxes += `
          <label class="flex items-center gap-2 p-2 rounded-lg border bg-white border-blue-200 cursor-pointer hover:border-asatemeBlue transition">
              <input type="checkbox" name="cat-prov-modal" value="${categoriaSuperior}" class="cat-prov-cb w-3.5 h-3.5 text-asatemeBlue rounded">
              <div>
                  <span class="block text-[11px] font-bold text-gray-800 leading-tight">Categoría ${categoriaSuperior} (Ascenso)</span>
                  <span class="text-[9px] text-gray-400">Habilitado por ranking</span>
              </div>
          </label>
        `;
      }

      if (esSub13Habilitado) {
        htmlCheckboxes += `
          <label class="flex items-center gap-2 p-2 rounded-lg border bg-white border-blue-200 cursor-pointer hover:border-asatemeBlue transition">
              <input type="checkbox" name="cat-prov-modal" value="Sub-13" class="cat-prov-cb w-3.5 h-3.5 text-asatemeBlue rounded">
              <div>
                  <span class="block text-[11px] font-bold text-gray-800 leading-tight">Sub-13</span>
                  <span class="text-[9px] text-gray-400">Habilitado por fecha de nacimiento</span>
              </div>
          </label>
        `;
      }

      const contenedorCategorias = document.getElementById(
        "contenedor-checkboxes-categorias",
      );
      if (contenedorCategorias) {
        contenedorCategorias.innerHTML = htmlCheckboxes;
      }

      document.querySelectorAll(".cat-prov-cb").forEach((cb) => {
        cb.addEventListener("change", () => {
          const sel = document.querySelectorAll(".cat-prov-cb:checked");
          if (sel.length > 2) {
            cb.checked = false;
            alert("⚠️ Solo podés inscribirte a un máximo de dos categorías.");
          }
        });
      });
    };

    if (!esJugadorNuevoPuro) {
      actualizarCategoriasHabilitadas();
      document
        .getElementById("perfil-fnac")
        .addEventListener("change", actualizarCategoriasHabilitadas);
    }

    const selectClub = document.getElementById("perfil-club-select");
    const inputClubNuevo = document.getElementById("perfil-club-nuevo");
    selectClub.onchange = () => {
      if (selectClub.value === "OTRO") {
        inputClubNuevo.classList.remove("hidden");
        inputClubNuevo.required = true;
        inputClubNuevo.focus();
      } else {
        inputClubNuevo.classList.add("hidden");
        inputClubNuevo.required = false;
        inputClubNuevo.value = "";
      }
    };

    const cerrar = () => (contenedor.innerHTML = "");
    document.getElementById("btn-cerrar-modal-perfil").onclick = cerrar;
    document.getElementById("btn-cancelar-modal").onclick = cerrar;

    document.getElementById("form-perfil-jugador").onsubmit = async (e) => {
      e.preventDefault();

      const btnSubmit = document.getElementById("btn-submit-perfil");
      if (btnSubmit.disabled) return;
      btnSubmit.disabled = true;
      btnSubmit.textContent = "Guardando...";

      try {
        const nombre = document
          .getElementById("perfil-nombre")
          .value.trim()
          .toUpperCase();

        const dniCrudo = document.getElementById("perfil-dni").value.trim();
        const dni = dniCrudo.replace(/\D/g, "");

        if (!/^\d{7,8}$/.test(dni)) {
          alert(
            "⚠️ Ingresá un número de DNI válido (entre 7 y 8 dígitos numéricos, sin puntos ni letras).",
          );
          btnSubmit.disabled = false;
          btnSubmit.textContent = "Guardar";
          return;
        }

        const fechaNacimiento = document.getElementById("perfil-fnac").value;
        const genero = document.getElementById("perfil-genero").value;

        const telCrudo = document
          .getElementById("perfil-telefono")
          .value.trim();
        const telefono = telCrudo.replace(/\D/g, "");

        if (telefono.length < 10) {
          alert(
            "⚠️ Ingresá un número de teléfono válido con al menos 10 dígitos (incluyendo código de área, ej: 3415123456).",
          );
          btnSubmit.disabled = false;
          btnSubmit.textContent = "Guardar";
          return;
        }

        const email = document.getElementById("perfil-email").value.trim();
        if (!email || !email.includes("@")) {
          alert("⚠️ Ingresá un correo electrónico válido.");
          btnSubmit.disabled = false;
          btnSubmit.textContent = "Guardar";
          return;
        }

        const notaCategoria = esJugadorNuevoPuro
          ? document.getElementById("perfil-nota-categoria").value.trim()
          : null;

        const categoriasSeleccionadas = esJugadorNuevoPuro
          ? []
          : Array.from(document.querySelectorAll(".cat-prov-cb:checked")).map(
              (cb) => cb.value,
            );

        let equipoIdFinal = selectClub.value;
        let nombreClubFinal = "";

        if (!esJugadorNuevoPuro && categoriasSeleccionadas.length === 0) {
          alert("⚠️ Debes seleccionar al menos una categoría.");
          btnSubmit.disabled = false;
          btnSubmit.textContent = "Guardar";
          return;
        }

        let { data: jugadorPorDni } = await window.supabase
          .from("jugadores")
          .select("id")
          .eq("dni", dni)
          .maybeSingle();

        let jugadorIdFinal = jugadorData ? jugadorData.id : null;

        if (jugadorPorDni) {
          if (jugadorIdFinal && jugadorPorDni.id !== jugadorIdFinal) {
            alert(
              "⚠️ El DNI ingresado ya pertenece a otro jugador en el padrón.",
            );
            btnSubmit.disabled = false;
            btnSubmit.textContent = "Guardar";
            return;
          }
          jugadorIdFinal = jugadorPorDni.id;
        }

        if (equipoIdFinal === "OTRO") {
          const nombreNuevoClub = inputClubNuevo.value.trim().toUpperCase();
          if (!nombreNuevoClub) {
            alert("⚠️ Ingresá el nombre del nuevo club.");
            btnSubmit.disabled = false;
            btnSubmit.textContent = "Guardar";
            return;
          }

          const { data: clubExistente } = await window.supabase
            .from("equipos")
            .select("id, nombre")
            .ilike("nombre", nombreNuevoClub)
            .maybeSingle();

          if (clubExistente) {
            equipoIdFinal = clubExistente.id;
            nombreClubFinal = clubExistente.nombre;
          } else {
            const nuevoId = crypto.randomUUID
              ? crypto.randomUUID()
              : "eq_" + Date.now();
            const tokenGenerado = crypto.randomUUID
              ? crypto.randomUUID()
              : "tok_" + Date.now();

            const datosNuevoClub = {
              id: nuevoId,
              nombre: nombreNuevoClub,
              delegado: "A determinar",
              liga: "ASATEME",
              token: tokenGenerado,
            };

            const { data: nuevoEquipo, error: errEq } = await window.supabase
              .from("equipos")
              .insert(datosNuevoClub)
              .select("id, nombre")
              .single();

            if (errEq) throw errEq;
            equipoIdFinal = nuevoEquipo.id;
            nombreClubFinal = nuevoEquipo.nombre;
          }
        } else if (equipoIdFinal) {
          const clubSeleccionadoObj = clubesRegistrados.find(
            (c) => String(c.id) === String(equipoIdFinal),
          );
          nombreClubFinal = clubSeleccionadoObj
            ? clubSeleccionadoObj.nombreLimpio
            : "";
        } else {
          equipoIdFinal = null;
        }

        if (jugadorIdFinal) {
          const { error: errUpd } = await window.supabase
            .from("jugadores")
            .update({
              nombre,
              dni,
              fecha_nacimiento: fechaNacimiento,
              genero,
              equipo_id: equipoIdFinal,
              telefono,
              email,
            })
            .eq("id", jugadorIdFinal);

          if (errUpd) throw errUpd;
        } else {
          const { data: nuevoJugador, error: errIns } = await window.supabase
            .from("jugadores")
            .insert({
              nombre,
              dni,
              fecha_nacimiento: fechaNacimiento,
              genero,
              equipo_id: equipoIdFinal,
              telefono,
              email,
            })
            .select("id")
            .single();

          if (errIns) throw errIns;
          jugadorIdFinal = nuevoJugador.id;
        }

        cerrar();

        if (esJugadorNuevoPuro) {
          alert(
            "✅ ¡Jugador registrado en el padrón! A continuación se abrirá WhatsApp para notificar al administrador.",
          );

          if (typeof this.onGuardarExitoso === "function") {
            await this.onGuardarExitoso({
              jugadorId: jugadorIdFinal,
              nombre: nombre,
              dni: dni,
              telefono: telefono,
              email: email,
              nombreClub: nombreClubFinal,
              notaCategoria: notaCategoria,
              esNuevoPuro: true,
            });
          }
        } else if (typeof this.onGuardarExitoso === "function") {
          await this.onGuardarExitoso({
            jugadorId: jugadorIdFinal,
            nombre: nombre,
            equipoId: equipoIdFinal,
            nombreClub: nombreClubFinal,
            categoriasSeleccionadas: categoriasSeleccionadas,
            esNuevoPuro: false,
          });
        }
      } catch (err) {
        console.error("Error guardando perfil:", err);
        alert("⚠️ Ocurrió un error al guardar los datos del jugador.");
        const btnSubmit = document.getElementById("btn-submit-perfil");
        if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.textContent = "Guardar";
        }
      }
    };
  }
}
