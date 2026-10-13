// js/vistas/InscripcionesVista.js
import { InscripcionForm } from "../componentes/inscripciones/InscripcionForm.js";
import { InscripcionesTablaResumen } from "../componentes/inscripciones/InscripcionesTablaResumen.js";

export class InscripcionesVista {
  constructor() {
    this.inscriptos = [];
    this.torneoIdActivo = 1; // ID del torneo regional activo

    this.formComponent = new InscripcionForm({
      onInscripcionExitosa: async (nuevoJugador) => {
        const exito = await this.guardarInscripcionEnSupabase(nuevoJugador);
        if (exito) {
          await this.cargarInscriptosDeSupabase();
          this.abrirModalExito(nuevoJugador);
          window.scrollTo({ top: 0, behavior: "smooth" });
          return true;
        }
        return false;
      },
    });

    window.verListadoCategoriaRama = (cat, genero) =>
      this.abrirModalCategoriaRama(cat, genero);
    window.cerrarModalInscriptos = () => this.cerrarModal();
    window.descargarListadoPDFGeneral = () => this.generarPDFGeneral();
  }

  async obtenerClienteSupabase() {
    if (window.supabase) return window.supabase;
    for (let i = 0; i < 15; i++) {
      await new Promise((res) => setTimeout(res, 100));
      if (window.supabase) return window.supabase;
    }
    return null;
  }

  async render(container) {
    this.container = container;
    this.renderizarEstructuraBase();
    await this.cargarInscriptosDeSupabase();
  }

  renderizarEstructuraBase() {
    if (!this.container) return;

    this.container.innerHTML = `
            <div class="min-h-screen bg-[#F8F9FA] pb-20">
                <div class="bg-asatemeBlue text-white py-12 px-6 md:px-16 relative overflow-hidden shadow-md">
                    <div class="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
                        <div class="space-y-4 max-w-2xl">
                            <span class="inline-block px-3 py-1 rounded-full bg-red-600 text-white font-extrabold text-[10px] tracking-wider uppercase">
                                • Inscripciones Abiertas
                            </span>
                            <h1 class="text-3xl md:text-5xl font-black tracking-tight">Torneo Regional<br>de Tenis de Mesa</h1>
                            <p class="text-blue-100 text-xs md:text-sm">Asociación Santafesina de Tenis de Mesa (ASATEME). Categorías formativas, juveniles y Todo Competidor, en ramas masculina y femenina.</p>
                            
                            <div class="flex flex-wrap gap-4 pt-2">
                                <div class="bg-white/10 backdrop-blur-xs border border-white/20 rounded-xl px-4 py-2.5 flex items-center gap-3">
                                    <i class="fas fa-calendar-alt text-amber-400"></i>
                                    <div>
                                        <span class="block text-[10px] uppercase font-bold text-blue-200">Fecha</span>
                                        <span class="text-xs font-bold">18 y 19 de Octubre</span>
                                    </div>
                                </div>
                                <div class="bg-white/10 backdrop-blur-xs border border-white/20 rounded-xl px-4 py-2.5 flex items-center gap-3">
                                    <i class="fas fa-map-marker-alt text-amber-400"></i>
                                    <div>
                                        <span class="block text-[10px] uppercase font-bold text-blue-200">Sede</span>
                                        <span class="text-xs font-bold">Av. Francia 4435, Rosario</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Botón directo añadido al banner -->
                            <div class="pt-2">
                                <a href="#seccion-formulario-ins" class="inline-flex items-center gap-2 bg-asatemeRed hover:bg-red-700 text-white font-extrabold px-6 py-3 rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg cursor-pointer">
                                    <i class="fas fa-pen-to-square"></i> Inscribirme Ahora
                                </a>
                            </div>
                        </div>

                        <div class="shrink-0">
                            <div class="w-36 h-36 md:w-44 md:h-44 rounded-full border-4 border-white/20 flex items-center justify-center p-3 overflow-hidden">
                                <img src="assets/images/logo-asateme.png" alt="Logo ASATEME" class="w-full h-full object-contain">
                            </div>
                        </div>
                    </div>
                </div>

                <div class="max-w-7xl mx-auto px-4 md:px-6 pt-10">
                    <div id="seccion-tabla-resumen">
                        ${InscripcionesTablaResumen.render([])}
                    </div>

                    <div class="max-w-3xl mx-auto mt-12" id="seccion-formulario-ins"></div>
                </div>

                <div id="modal-inscriptos-container"></div>
            </div>
        `;

    this.formComponent.render("seccion-formulario-ins");
  }

  async cargarInscriptosDeSupabase() {
    try {
      const clienteSupabase = await this.obtenerClienteSupabase();
      if (!clienteSupabase) {
        console.error("Supabase no está disponible globalmente.");
        return;
      }

      const { data, error } = await clienteSupabase
        .from("inscripciones")
        .select(
          `
                    categorias,
                    jugadores (nombre, dni, genero, fecha_nacimiento)
                `,
        )
        .eq("torneo_id", this.torneoIdActivo);

      if (error) throw error;

      if (data) {
        this.inscriptos = data
          .filter((item) => item.jugadores !== null)
          .map((item) => ({
            nombre: item.jugadores.nombre,
            dni: item.jugadores.dni,
            genero: item.jugadores.genero,
            fechaNacimiento: item.jugadores.fecha_nacimiento,
            categoriasSeleccionadas: item.categorias,
          }));

        const contenedorTabla = document.getElementById(
          "seccion-tabla-resumen",
        );
        if (contenedorTabla) {
          contenedorTabla.innerHTML = InscripcionesTablaResumen.render(
            this.inscriptos,
          );
        }
      }
    } catch (error) {
      console.error("Error al cargar inscriptos de Supabase:", error);
    }
  }

  async guardarInscripcionEnSupabase(nuevoJugador) {
    const clienteSupabase = await this.obtenerClienteSupabase();
    if (!clienteSupabase) {
      alert("⚠️ Error: No hay conexión con la base de datos.");
      return false;
    }

    const dniLimpio = String(nuevoJugador.dni || "").trim();
    if (!dniLimpio) {
      alert("⚠️ El DNI es obligatorio.");
      return false;
    }

    try {
      // 0. Consultamos si el torneo activo es Regional o Provincial
      let { data: torneoActual, error: errTorneo } = await clienteSupabase
        .from("torneos")
        .select("tipo")
        .eq("id", this.torneoIdActivo)
        .single();

      const esProvincial = torneoActual?.tipo === "provincial";

      // 1. Buscamos al jugador en el padrón usando el DNI limpio de forma segura
      let { data: jugadorExistente, error: errBusqueda } = await clienteSupabase
        .from("jugadores")
        .select("id")
        .eq("dni", dniLimpio)
        .maybeSingle();

      if (errBusqueda) {
        console.error("Error en búsqueda por DNI:", errBusqueda);
        throw errBusqueda;
      }

      let jugadorId;

      if (jugadorExistente) {
        jugadorId = jugadorExistente.id;
      } else {
        if (esProvincial) {
          alert(
            "⚠️ Acceso denegado: Los torneos Provinciales requieren estar previamente registrados en el Padrón / Ranking oficial de la Liga.",
          );
          return false;
        }

        // Si es Regional, insertamos el nuevo jugador (dejando equipo_id en null de forma explícita)
        let { data: nuevoJugadorInsertado, error: errInsertarJugador } =
          await clienteSupabase
            .from("jugadores")
            .insert({
              nombre: nuevoJugador.nombre,
              dni: dniLimpio,
              fecha_nacimiento: nuevoJugador.fechaNacimiento,
              genero: nuevoJugador.genero,
              equipo_id: null, // Explicitamente nulo para jugadores de torneos individuales
            })
            .select("id")
            .single();

        if (errInsertarJugador) {
          console.error("Error al insertar nuevo jugador:", errInsertarJugador);
          throw errInsertarJugador;
        }
        jugadorId = nuevoJugadorInsertado.id;
      }

      // 2. Registramos la inscripción vinculada al torneo activo
      const { error: errInscripcion } = await clienteSupabase
        .from("inscripciones")
        .insert({
          torneo_id: this.torneoIdActivo,
          jugador_id: jugadorId,
          categorias: nuevoJugador.categoriasSeleccionadas,
        });

      if (errInscripcion) {
        if (errInscripcion.code === "23505") {
          alert("⚠️ Este DNI ya se encuentra inscripto en este torneo.");
          const inputDni = document.getElementById("ins-dni");
          if (inputDni) {
            inputDni.focus();
            inputDni.select();
          }
          return false;
        }
        throw errInscripcion;
      }

      return true;
    } catch (error) {
      console.error("Error al guardar inscripción:", error);
      alert(
        "⚠️ Ocurrió un error al procesar la inscripción. Revisa la consola para más detalles.",
      );
      return false;
    }
  }

  abrirModalExito(jugador) {
    const contenedor = document.getElementById("modal-inscriptos-container");
    if (contenedor) {
      contenedor.innerHTML = `
                <div class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 p-6 text-center space-y-4">
                        <div class="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-2xl">
                            <i class="fas fa-check"></i>
                        </div>
                        <h3 class="text-lg font-black text-gray-800">¡Inscripción Exitosa!</h3>
                        <p class="text-xs text-gray-600"><b>${jugador.nombre}</b> se ha inscripto correctamente en las categorías seleccionadas.</p>
                        <button onclick="window.cerrarModalInscriptos()" class="w-full py-3 bg-asatemeBlue text-white font-bold rounded-xl text-xs cursor-pointer">Aceptar</button>
                    </div>
                </div>
            `;
    }
  }

  abrirModalCategoriaRama(cat, genero) {
    const filtrados = this.inscriptos.filter(
      (i) => i.categoriasSeleccionadas?.includes(cat) && i.genero === genero,
    );
    const contenedor = document.getElementById("modal-inscriptos-container");
    if (contenedor) {
      contenedor.innerHTML = `
                <div class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100">
                        <div class="bg-asatemeBlue text-white px-6 py-4 flex justify-between items-center">
                            <div>
                                <span class="text-[10px] uppercase font-bold tracking-wider text-blue-200 block">Listado oficial - ${genero}</span>
                                <h3 class="text-base font-extrabold">${cat} (${genero})</h3>
                            </div>
                            <button onclick="window.cerrarModalInscriptos()" class="text-white/80 hover:text-white text-lg cursor-pointer">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="p-6 max-h-[60vh] overflow-y-auto space-y-2">
                            ${
                              filtrados.length === 0
                                ? `
                                <div class="text-center py-8 text-gray-400 text-xs italic">No hay jugadores inscriptos en esta categoría y rama.</div>
                            `
                                : filtrados
                                    .map(
                                      (j, idx) => `
                                <div class="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs">
                                    <div class="flex items-center gap-3">
                                        <span class="w-6 h-6 rounded-full bg-blue-100 text-asatemeBlue font-bold flex items-center justify-center text-[10px]">${idx + 1}</span>
                                        <span class="font-bold text-gray-800">${j.nombre}</span>
                                    </div>
                                </div>
                            `,
                                    )
                                    .join("")
                            }
                        </div>
                        <div class="bg-gray-50 px-6 py-3 border-t border-gray-100 flex justify-between items-center text-xs">
                            <span class="text-gray-500 font-medium">Total: <b>${filtrados.length}</b> inscriptos</span>
                            <button onclick="window.cerrarModalInscriptos()" class="px-4 py-2 bg-asatemeBlue text-white font-bold rounded-xl cursor-pointer">Cerrar</button>
                        </div>
                    </div>
                </div>
            `;
    }
  }

  cerrarModal() {
    const contenedor = document.getElementById("modal-inscriptos-container");
    if (contenedor) contenedor.innerHTML = "";
  }

  generarPDFGeneral() {
    const ventanaPrint = window.open("", "_blank");
    const fechaActual = new Date().toLocaleDateString();

    let htmlContenido = `
            <html>
            <head>
                <title>Listado General de Inscriptos - Torneo Regional ASATEME</title>
                <style>
                    body { font-family: Arial, sans-serif; color: #333; margin: 20px; }
                    .header { text-align: center; border-bottom: 2px solid #003366; padding-bottom: 10px; margin-bottom: 20px; }
                    .header h1 { color: #003366; margin: 0; font-size: 22px; }
                    .header p { margin: 5px 0 0; font-size: 12px; color: #666; }
                    .categoria-box { margin-bottom: 20px; page-break-inside: avoid; }
                    .categoria-titulo { background: #003366; color: white; padding: 6px 12px; font-size: 14px; font-weight: bold; }
                    table { width: 100%; border-collapse: collapse; margin-top: 5px; }
                    th, td { border: 1px solid #ddd; padding: 6px 10px; font-size: 12px; text-align: left; }
                    th { background: #f4f4f4; color: #333; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>ASOCIACIÓN SANTAFESINA DE TENIS DE MESA (ASATEME)</h1>
                    <p>Torneo Regional | 18 y 19 de Octubre - Centro Municipal Distrito Oeste</p>
                    <p>Listado General de Inscriptos al ${fechaActual}</p>
                </div>
        `;

    const listadoCategorias = [
      "Sub-9",
      "Sub-11",
      "Sub-13",
      "Sub-15",
      "Sub-17",
      "Sub-19",
      "Sub-23",
      "Todo Competidor",
    ];
    const ramas = ["Masculino", "Femenino"];

    listadoCategorias.forEach((cat) => {
      ramas.forEach((genero) => {
        const filtrados = this.inscriptos.filter(
          (i) =>
            i.categoriasSeleccionadas?.includes(cat) && i.genero === genero,
        );

        htmlContenido += `
                    <div class="categoria-box">
                        <div class="categoria-titulo">${cat} - ${genero} (${filtrados.length} inscriptos)</div>
                        <table>
                            <thead>
                                <tr>
                                    <th style="width: 40px;">#</th>
                                    <th>Nombre Completo</th>
                                </tr>
                            </thead>
                            <tbody>
                `;

        if (filtrados.length === 0) {
          htmlContenido += `<tr><td colspan="2" style="text-align: center; color: #886; font-style: italic;">Sin inscriptos</td></tr>`;
        } else {
          filtrados.forEach((j, idx) => {
            htmlContenido += `
                            <tr>
                                <td>${idx + 1}</td>
                                <td>${j.nombre}</td>
                            </tr>
                        `;
          });
        }

        htmlContenido += `
                            </tbody>
                        </table>
                    </div>
                `;
      });
    });

    htmlContenido += `
            </body>
            </html>
        `;

    ventanaPrint.document.write(htmlContenido);
    ventanaPrint.document.close();
    ventanaPrint.focus();
    setTimeout(() => {
      ventanaPrint.print();
    }, 500);
  }
}
