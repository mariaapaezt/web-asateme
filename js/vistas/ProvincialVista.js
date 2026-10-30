// js/vistas/ProvincialVista.js
import { ProvincialForm } from "../componentes/inscripciones/ProvincialForm.js";
import { InscriptosProvModal } from "../componentes/inscripciones/InscriptosProvModal.js";

export class ProvincialVista {
  constructor() {
    this.inscriptos = [];
    this.torneoIdActivo = 2; // ID del torneo provincial en la tabla torneos

    // Control de estado de inscripciones para el torneo activo
    this.inscripcionesAbiertas = false; // Cambiar a true si deseas abrirlas nuevamente

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
      inscripcionesAbiertas: this.inscripcionesAbiertas,
      onInscripcionExitosa: async (nuevoInscripto) => {
        if (!this.inscripcionesAbiertas) {
          alert(
            "⚠️ Las inscripciones para este torneo se encuentran cerradas.",
          );
          return false;
        }

        // 1. Si es un jugador nuevo puro, NO mostramos modal de inscripción exitosa
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
              <div class="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 relative z-10">
                  <div class="space-y-4 max-w-2xl">
                      <span class="inline-block px-3 py-1 rounded-full bg-blue-600 text-white font-extrabold text-[10px] tracking-wider uppercase">
                          • Torneo Provincial ASATEME
                      </span>
                      <h1 class="text-3xl md:text-5xl font-black tracking-tight">Torneo Provincial<br>ASATEME</h1>
                      <p class="text-blue-100 text-xs md:text-sm">Competencia oficial regulada por la Asociación Santafesina de Tenis de Mesa. Inscripciones validadas por padrón y ranking oficial.</p>
                      
                      <!-- Bloques de Fecha y Sede -->
                      <div class="flex flex-wrap gap-4 pt-1">
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
                  </div>

                  <!-- Horarios Integrados en el Banner -->
                  <div class="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 w-full lg:w-auto lg:min-w-[420px] space-y-3.5 shadow-xl">
                      <div class="flex items-center gap-2 text-amber-300 font-extrabold text-xs uppercase tracking-wider">
                          <i class="fas fa-clock"></i> Horarios por Categoría
                      </div>
                      
                      <div class="grid grid-cols-3 gap-2 text-center">
                          <div class="bg-black/20 rounded-xl p-2.5">
                              <span class="block text-[9px] text-blue-200 font-bold uppercase">Quinta</span>
                              <span class="text-xs font-black">09:30 hs</span>
                          </div>
                          <div class="bg-black/20 rounded-xl p-2.5">
                              <span class="block text-[9px] text-blue-200 font-bold uppercase">Tercera</span>
                              <span class="text-xs font-black">10:30 hs</span>
                          </div>
                          <div class="bg-black/20 rounded-xl p-2.5">
                              <span class="block text-[9px] text-blue-200 font-bold uppercase">Sub-13</span>
                              <span class="text-xs font-black">12:30 hs</span>
                          </div>
                          <div class="bg-black/20 rounded-xl p-2.5">
                              <span class="block text-[9px] text-blue-200 font-bold uppercase">Primera</span>
                              <span class="text-xs font-black">13:45 hs</span>
                          </div>
                          <div class="bg-black/20 rounded-xl p-2.5">
                              <span class="block text-[9px] text-blue-200 font-bold uppercase">Cuarta</span>
                              <span class="text-xs font-black">14:00 hs</span>
                          </div>
                          <div class="bg-black/20 rounded-xl p-2.5">
                              <span class="block text-[9px] text-blue-200 font-bold uppercase">Segunda</span>
                              <span class="text-xs font-black">16:30 hs</span>
                          </div>
                      </div>

                      <div class="text-[10px] text-blue-100 space-y-1 pt-1 border-t border-white/10">
                          <p>🕧 <i>Según inscriptos, el horario puede variar +/- 30 minutos.</i></p>
                          <p class="text-amber-300 font-bold">⌛ Cierre de inscripciones: Viernes 30 hasta las 14 hs.</p>
                      </div>
                  </div>
              </div>

              <div class="mt-6">
                  ${
                    this.inscripcionesAbiertas
                      ? `<a href="#seccion-formulario-prov" class="inline-flex items-center gap-2 bg-asatemeRed hover:bg-red-700 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg cursor-pointer">
                             <i class="fas fa-pen-to-square"></i> INSCRIBIRME AHORA
                         </a>`
                      : `<div class="inline-flex items-center gap-2 bg-gray-800/90 text-amber-300 border border-amber-300/30 font-extrabold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-md">
                             <i class="fas fa-lock"></i> INSCRIPCIONES FINALIZADAS
                         </div>`
                  }
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

      // 1. Traemos TODOS los jugadores del padrón general junto con sus equipos (clubes)
      const { data: jugadoresData, error: errJug } = await clienteSupabase
        .from("jugadores")
        .select(
          `
            id,
            nombre, 
            dni, 
            genero, 
            fecha_nacimiento,
            telefono,
            email,
            equipos (nombre)
        `,
        )
        .not("dni", "is", null)
        .neq("dni", "");

      if (errJug) throw errJug;

      // 2. Traemos las inscripciones exclusivas de este torneo activo
      const { data: inscripcionesData, error: errIns } = await clienteSupabase
        .from("inscripciones")
        .select(
          `
            jugador_id,
            categorias
        `,
        )
        .eq("torneo_id", this.torneoIdActivo);

      if (errIns) throw errIns;

      // 3. Creamos un mapa rápido de inscripciones por jugador_id
      const mapaInscripciones = new Map();
      if (inscripcionesData) {
        inscripcionesData.forEach((ins) => {
          mapaInscripciones.set(ins.jugador_id, ins.categorias || []);
        });
      }

      // 4. Fusionamos el padrón con sus respectivas categorías del torneo
      this.inscriptos = [];
      if (jugadoresData) {
        jugadoresData.forEach((j) => {
          const categoriasDelJugador = mapaInscripciones.get(j.id) || [];
          const nombreClubCrudo = j.equipos ? j.equipos.nombre : "";

          this.inscriptos.push({
            id: j.id,
            nombre: j.nombre,
            dni: j.dni,
            genero: j.genero,
            fechaNacimiento: j.fecha_nacimiento,
            telefono: j.telefono,
            email: j.email,
            club: this.limpiarNombreClub(nombreClubCrudo) || "Sin Club",
            categoriasSeleccionadas: categoriasDelJugador,
          });
        });
      }

      this.renderizarResumenYTarjetas();
    } catch (error) {
      console.error("Error al cargar inscriptos y padrón provincial:", error);
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

          <!-- Cuadrícula de Categorías -->
          <div class="lg:col-span-3 space-y-3">
              <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-3 px-5 flex justify-between items-center">
                  <div>
                      <h3 class="text-xs font-bold text-gray-800">Categorías del Torneo Provincial</h3>
                      <p class="text-[10px] text-gray-400">Desglose de inscriptos según ranking y categorías oficiales.</p>
                  </div>
                  ${
                    this.inscripcionesAbiertas
                      ? `<span class="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-black rounded-md text-[10px] uppercase border border-emerald-100">
                             • Abierto
                         </span>`
                      : `<span class="px-2.5 py-1 bg-amber-50 text-amber-700 font-black rounded-md text-[10px] uppercase border border-amber-100 flex items-center gap-1">
                             <i class="fas fa-lock text-[9px]"></i> Cerrado
                         </span>`
                  }
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
      const { error } = await clienteSupabase.from("inscripciones").upsert(
        {
          torneo_id: this.torneoIdActivo,
          jugador_id: nuevoInscripto.jugadorId,
          categorias: nuevoInscripto.categoriasSeleccionadas,
        },
        {
          onConflict: "torneo_id,jugador_id",
        },
      );

      if (error) throw error;
      return true;
    } catch (err) {
      console.error("Error guardando inscripción provincial:", err);
      alert("⚠️ Ocurrió un error al registrar la inscripción.");
      return false;
    }
  }

  abrirModalExito(inscripto) {
    const clubLimpio =
      this.limpiarNombreClub(inscripto.nombreClub) || "Sin Club";

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
