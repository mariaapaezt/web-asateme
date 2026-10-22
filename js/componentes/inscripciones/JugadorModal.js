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

    const nombreFinal = jugadorData
      ? jugadorData.nombre
      : rankingData
        ? rankingData.nombre
        : "";
    const dniFinal = jugadorData ? jugadorData.dni || "" : "";
    const fnacFinal = jugadorData ? jugadorData.fecha_nacimiento || "" : "";
    const generoFinal = jugadorData
      ? jugadorData.genero || "Masculino"
      : "Masculino";
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
                              <input type="text" id="perfil-nombre" value="${nombreFinal}" required 
                                     class="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-medium text-gray-800 focus:outline-none focus:border-asatemeBlue">
                          </div>
                          <div>
                              <label class="block text-[11px] font-bold text-gray-700 uppercase mb-1">DNI *</label>
                              <input type="text" id="perfil-dni" value="${dniFinal}" required placeholder="Sin puntos"
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
                                 class="hidden mt-2 w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-medium text-gray-800 focus:outline-none focus:border-asatemeBlue">
                      </div>

                      <!-- Campos exclusivos para Jugador Nuevo (Teléfono y Email de contacto) -->
                      ${
                        esJugadorNuevoPuro
                          ? `
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                            <div>
                                <label class="block text-[11px] font-bold text-gray-700 uppercase mb-1">Teléfono de Contacto *</label>
                                <input type="tel" id="perfil-telefono" required placeholder="Ej: 3415123456" 
                                       class="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-medium text-gray-800 focus:outline-none focus:border-asatemeBlue">
                            </div>
                            <div>
                                <label class="block text-[11px] font-bold text-gray-700 uppercase mb-1">Correo Electrónico *</label>
                                <input type="email" id="perfil-email" required placeholder="correo@ejemplo.com" 
                                       class="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-medium text-gray-800 focus:outline-none focus:border-asatemeBlue">
                            </div>
                        </div>
                        <div class="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs space-y-1">
                            <div><i class="fas fa-info-circle mr-1"></i> Al ser un jugador nuevo, sus datos se registrarán en el padrón oficial y quedarán pendientes de validación por parte del administrador.</div>
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
                          <button type="submit" class="flex-grow py-3 bg-asatemeBlue hover:bg-slate-800 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md transition">
                              ${esEdicion ? "Guardar Cambios e Inscribir" : esJugadorNuevoPuro ? "Registrar en Padrón" : "Registrar e Inscribir al Torneo"}
                          </button>
                          <button type="button" id="btn-cancelar-modal" class="px-5 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl text-xs cursor-pointer">Cancelar</button>
                      </div>
                  </form>
              </div>
          </div>
      </div>
    `;

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
      const nombre = document.getElementById("perfil-nombre").value.trim();
      const dni = document.getElementById("perfil-dni").value.trim();
      const fechaNacimiento = document.getElementById("perfil-fnac").value;
      const genero = document.getElementById("perfil-genero").value;
      const telefono = esJugadorNuevoPuro
        ? document.getElementById("perfil-telefono").value.trim()
        : null;
      const email = esJugadorNuevoPuro
        ? document.getElementById("perfil-email").value.trim()
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
        return;
      }

      try {
        let queryDni = window.supabase
          .from("jugadores")
          .select("id")
          .eq("dni", dni);
        if (jugadorData && jugadorData.id) {
          queryDni = queryDni.neq("id", jugadorData.id);
        }
        const { data: dniRepetido } = await queryDni.maybeSingle();

        if (dniRepetido) {
          alert(
            "⚠️ Ya existe otro jugador registrado con el número de DNI " +
              dni +
              ". Verificá los datos ingresados.",
          );
          return;
        }

        if (equipoIdFinal === "OTRO") {
          const nombreNuevoClub = inputClubNuevo.value.trim();
          if (!nombreNuevoClub) {
            alert("⚠️ Ingresá el nombre del nuevo club.");
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

        let jugadorIdFinal = jugadorData ? jugadorData.id : null;

        if (jugadorIdFinal) {
          const { error: errUpd } = await window.supabase
            .from("jugadores")
            .update({
              nombre,
              dni,
              fecha_nacimiento: fechaNacimiento,
              genero,
              equipo_id: equipoIdFinal,
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
            })
            .select("id")
            .single();

          if (errIns) throw errIns;
          jugadorIdFinal = nuevoJugador.id;
        }

        cerrar();

        if (esJugadorNuevoPuro) {
          alert(
            "✅ ¡Jugador registrado correctamente en el padrón! Quedará pendiente de validación por parte del administrador.",
          );

          if (typeof this.onGuardarExitoso === "function") {
            await this.onGuardarExitoso({
              jugadorId: jugadorIdFinal,
              nombre: nombre,
              dni: dni,
              telefono: telefono,
              email: email,
              nombreClub: nombreClubFinal,
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
      }
    };
  }
}
