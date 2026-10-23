// js/vistas/ProvincialVista.js
import { ProvincialForm } from "../componentes/inscripciones/ProvincialForm.js";
import { InscriptosProvModal } from "../componentes/inscripciones/InscriptosProvModal.js";

export class ProvincialVista {
  constructor() {
    this.inscriptos = [];
    this.torneoIdActivo = 2; // ID del torneo provincial en la tabla torneos
    this.categoriasProvinciales = [
      "Primera",
      "Segunda",
      "Tercera",
      "Cuarta",
      "Quinta",
      "Sub-13",
    ];

    this.modalComponent = new InscriptosProvModal();

    this.formComponent = new ProvincialForm({
      onInscripcionExitosa: async (nuevoInscripto) => {
        // 1. Si es un jugador nuevo puro, NO mostramos modal de inscripción exitosa
        // (solo fue registrado en el padrón y ya fue notificado por WhatsApp)
        if (nuevoInscripto.esNuevoPuro) {
          window.scrollTo({ top: 0, behavior: "smooth" });
          return true;
        }

        // 2. Si es un jugador del ranking que se inscribe a categorías:
        const exito = await this.guardarInscripcionEnSupabase(nuevoInscripto);
        if (exito) {
          await this.cargarInscriptosDeSupabase();
          this.abrirModalExito(nuevoInscripto);
          window.scrollTo({ top: 0, behavior: "smooth" });
          return true;
        }
        return false;
      },
    });

    window.verListadoCategoriaProvincial = (cat) =>
      this.abrirModalCategoria(cat);
    window.descargarListadoPDFGeneral = () => this.generarPDFGeneral();
  }

  limpiarNombreClub(nombreCrudo) {
    if (!nombreCrudo) return "";
    let limpio = nombreCrudo.trim();

    // Elimina sufijos como " B1", " B2", " A", " B", " C3", etc. al final
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
          <!-- Banner Superior Provincial -->
          <div class="bg-asatemeBlue text-white py-10 px-6 md:px-16 relative overflow-hidden shadow-md">
              <div class="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
                  <div class="space-y-4 max-w-2xl">
                      <span class="inline-block px-3 py-1 rounded-full bg-blue-600 text-white font-extrabold text-[10px] tracking-wider uppercase">
                          • Torneo Provincial ASATEME
                      </span>
                      <h1 class="text-3xl md:text-5xl font-black tracking-tight">Torneo Provincial<br>ASATEME</h1>
                      <p class="text-blue-100 text-xs md:text-sm">Competencia oficial regulada por la Asociación Santafesina de Tenis de Mesa. Inscripciones validadas por padrón y ranking oficial.</p>
                      
                      <!-- Bloques de Fecha y Sede -->
                      <div class="flex flex-wrap gap-4 pt-2">
                          <div class="bg-white/10 backdrop-blur-xs border border-white/20 rounded-xl px-4 py-2 flex items-center gap-3">
                              <i class="fas fa-calendar-alt text-amber-400"></i>
                              <div>
                                  <span class="block text-[10px] uppercase font-bold text-blue-200">FECHA</span>
                                  <span class="text-xs font-bold">31 de Octubre</span>
                              </div>
                          </div>
                          <div class="bg-white/10 backdrop-blur-xs border border-white/20 rounded-xl px-4 py-2 flex items-center gap-3">
                              <i class="fas fa-map-marker-alt text-amber-400"></i>
                              <div>
                                  <span class="block text-[10px] uppercase font-bold text-blue-200">SEDE</span>
                                  <span class="text-xs font-bold">Club Atletico Provincial, Rosario</span>
                              </div>
                          </div>
                      </div>

                      <div class="pt-2">
                          <a href="#seccion-formulario-prov" class="inline-flex items-center gap-2 bg-asatemeRed hover:bg-red-700 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg cursor-pointer">
                              <i class="fas fa-pen-to-square"></i> INSCRIBIRME AHORA
                          </a>
                      </div>
                  </div>

                  <div class="shrink-0">
                      <div class="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white/20 flex items-center justify-center p-3 overflow-hidden bg-white/5">
                          <img src="assets/images/logo-asateme.png" alt="Logo ASATEME" class="w-full h-full object-contain">
                      </div>
                  </div>
              </div>
          </div>

          <!-- Contenido Principal: Resumen y Formulario -->
          <div class="max-w-7xl mx-auto px-4 md:px-6 pt-8 space-y-10">
              <div id="seccion-resumen-provincial"></div>
              <div class="max-w-3xl mx-auto" id="seccion-formulario-prov"></div>
          </div>

          <div id="modal-provincial-container"></div>
      </div>
    `;

    this.formComponent.render("seccion-formulario-prov");
  }

  async cargarInscriptosDeSupabase() {
    try {
      const clienteSupabase = await this.obtenerClienteSupabase();
      if (!clienteSupabase) return;

      const { data, error } = await clienteSupabase
        .from("inscripciones")
        .select(
          `
            categorias,
            jugadores (
              nombre, 
              dni, 
              genero, 
              fecha_nacimiento,
              equipos (nombre)
            )
        `,
        )
        .eq("torneo_id", this.torneoIdActivo);

      if (error) throw error;

      if (data) {
        this.inscriptos = data
          .filter((item) => item.jugadores !== null)
          .map((item) => {
            const nombreClubCrudo = item.jugadores.equipos
              ? item.jugadores.equipos.nombre
              : "";
            return {
              nombre: item.jugadores.nombre,
              dni: item.jugadores.dni,
              genero: item.jugadores.genero,
              fechaNacimiento: item.jugadores.fecha_nacimiento,
              club: this.limpiarNombreClub(nombreClubCrudo) || "Sin Club",
              categoriasSeleccionadas: item.categorias,
            };
          });

        this.renderizarResumenYTarjetas();
      }
    } catch (error) {
      console.error("Error al cargar inscriptos provinciales:", error);
    }
  }

  renderizarResumenYTarjetas() {
    const contenedor = document.getElementById("seccion-resumen-provincial");
    if (!contenedor) return;

    const totalJugadoresUnicos = new Set(this.inscriptos.map((i) => i.dni))
      .size;
    let totalInscripcionesCategorias = 0;

    const estadisticasCategorias = this.categoriasProvinciales.map((cat) => {
      const inscriptosEnCat = this.inscriptos.filter((i) =>
        i.categoriasSeleccionadas?.includes(cat),
      );
      const total = inscriptosEnCat.length;
      totalInscripcionesCategorias += total;
      return { categoria: cat, total, inscriptos: inscriptosEnCat };
    });

    contenedor.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-5">
          <!-- Tarjetas Estadísticas Laterales -->
          <div class="lg:col-span-1 space-y-3">
              <div class="bg-asatemeBlue text-white rounded-xl p-4 shadow-md relative overflow-hidden">
                  <span class="text-[10px] font-bold uppercase tracking-wider text-blue-200 block mb-0.5">Inscriptos Únicos</span>
                  <div class="text-2xl font-extrabold mb-0.5">${totalJugadoresUnicos}</div>
                  <span class="text-[10px] text-blue-100">Jugadores registrados</span>
              </div>

              <div class="bg-white text-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col justify-between">
                  <div>
                      <span class="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">Total Inscripciones</span>
                      <div class="text-2xl font-extrabold text-asatemeBlue mb-0.5">${totalInscripcionesCategorias}</div>
                      <span class="text-[10px] text-gray-500">Inscripciones a categorías</span>
                  </div>
                  <div class="mt-3 pt-2.5 border-t border-gray-100">
                      <button onclick="window.descargarListadoPDFGeneral()" 
                              class="w-full py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] rounded-lg transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1.5">
                          <i class="fas fa-file-pdf"></i> Descargar Listado (PDF)
                      </button>
                  </div>
              </div>
          </div>

          <!-- Cuadrícula en Rectángulos Compactos (3 columnas en pantallas grandes) -->
          <div class="lg:col-span-3 space-y-3">
              <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-3 px-5 flex justify-between items-center">
                  <div>
                      <h3 class="text-xs font-bold text-gray-800">Categorías del Torneo Provincial</h3>
                      <p class="text-[10px] text-gray-400">Desglose de inscriptos según ranking y categorías oficiales.</p>
                  </div>
                  <span class="px-2 py-0.5 bg-blue-50 text-asatemeBlue font-bold rounded-md text-[10px]">
                      Abierto
                  </span>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  ${estadisticasCategorias
                    .map(
                      (c) => `
                      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-3.5 flex flex-col justify-between hover:border-asatemeBlue/40 transition">
                          <div class="flex justify-between items-center mb-2">
                              <h4 class="font-black text-gray-800 text-xs uppercase tracking-wide text-asatemeBlue">${c.categoria}</h4>
                              <span class="px-2.5 py-0.5 rounded-lg bg-blue-50 text-asatemeBlue font-extrabold text-[11px]">
                                  ${c.total}${c.total === 1 ? " Inscripto" : " Inscriptos"}
                              </span>
                          </div>
                          
                          <div class="pt-2 border-t border-gray-50 flex justify-between items-center mt-1">
                              <span class="text-[10px] text-gray-400 font-medium">Listado oficial</span>
                              <button onclick="window.verListadoCategoriaProvincial('${c.categoria}')" 
                                      class="px-3 py-1.5 bg-gray-50 hover:bg-asatemeBlue hover:text-white text-gray-700 font-bold rounded-xl text-[11px] transition cursor-pointer">
                                  Ver inscriptos
                              </button>
                          </div>
                      </div>
                  `,
                    )
                    .join("")}
              </div>
          </div>
      </div>
    `;
  }

  abrirModalCategoria(cat) {
    const filtrados = this.inscriptos.filter((i) =>
      i.categoriasSeleccionadas?.includes(cat),
    );
    this.modalComponent.mostrar(`Categoría ${cat}`, filtrados);
  }

  async guardarInscripcionEnSupabase(nuevoInscripto) {
    const clienteSupabase = await this.obtenerClienteSupabase();
    if (!clienteSupabase) {
      alert("⚠️ Error de conexión con la base de datos.");
      return false;
    }

    if (
      !nuevoInscripto.categoriasSeleccionadas ||
      nuevoInscripto.categoriasSeleccionadas.length === 0
    ) {
      return true;
    }

    try {
      // 1. Verificamos si ya existe una inscripción para este jugador en este torneo
      const { data: inscripcionExistente } = await clienteSupabase
        .from("inscripciones")
        .select("id")
        .eq("torneo_id", this.torneoIdActivo)
        .eq("jugador_id", nuevoInscripto.jugadorId)
        .maybeSingle();

      let errorSupabase = null;

      if (inscripcionExistente) {
        // 2. Si ya está inscripto, ACTUALIZAMOS sus categorías
        const { error } = await clienteSupabase
          .from("inscripciones")
          .update({ categorias: nuevoInscripto.categoriasSeleccionadas })
          .eq("id", inscripcionExistente.id);
        errorSupabase = error;
      } else {
        // 3. Si no está inscripto, INSERTAMOS el nuevo registro
        const { error } = await clienteSupabase.from("inscripciones").insert({
          torneo_id: this.torneoIdActivo,
          jugador_id: nuevoInscripto.jugadorId,
          categorias: nuevoInscripto.categoriasSeleccionadas,
        });
        errorSupabase = error;
      }

      if (errorSupabase) throw errorSupabase;
      return true;
    } catch (err) {
      console.error("Error guardando inscripción provincial:", err);
      alert("⚠️ Ocurrió un error al registrar la inscripción.");
      return false;
    }
  }
  
  abrirModalExito(inscripto) {
    // Obtenemos el nombre limpio del club
    const clubLimpio =
      this.limpiarNombreClub(inscripto.nombreClub) || "Sin Club";

    // Pasamos el objeto limpio a InscriptosProvModal sin concatenar textos largos en el campo nombre
    this.modalComponent.mostrar("¡Inscripción Exitosa!", [
      {
        nombre: `${inscripto.nombre} ha quedado inscripto correctamente.`,
        club: clubLimpio,
      },
    ]);
  }

  generarPDFGeneral() {
    const ventanaPrint = window.open("", "_blank");
    const fechaActual = new Date().toLocaleDateString();

    let htmlContenido = `
      <html>
      <head>
          <title>Listado General de Inscriptos - Torneo Provincial ASATEME</title>
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
              <p>Torneo Provincial ASATEME | Gimnasio Emilio Lotuf - Rosario</p>
              <p>Listado General de Inscriptos al ${fechaActual}</p>
          </div>
    `;

    this.categoriasProvinciales.forEach((cat) => {
      const filtrados = this.inscriptos.filter((i) =>
        i.categoriasSeleccionadas?.includes(cat),
      );

      htmlContenido += `
        <div class="categoria-box">
            <div class="categoria-titulo">Categoría ${cat} (${filtrados.length} inscriptos)</div>
            <table>
                <thead>
                    <tr>
                        <th style="width: 40px;">#</th>
                        <th>Nombre Completo</th>
                        <th>Club</th>
                    </tr>
                </thead>
                <tbody>
      `;

      if (filtrados.length === 0) {
        htmlContenido += `<tr><td colspan="3" style="text-align: center; color: #888; font-style: italic;">Sin inscriptos</td></tr>`;
      } else {
        filtrados.forEach((j, idx) => {
          htmlContenido += `
            <tr>
                <td>${idx + 1}</td>
                <td>${j.nombre}</td>
                <td>${j.club || "-"}</td>
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
