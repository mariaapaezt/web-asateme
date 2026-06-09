// --- VARIABLES GLOBALES DE CONTROL ---
const SHEET_ID = '1D8FRoqxEYdG--DHnOERb5cKEze9suOVOyhyhGBIAc-A'; // <--- Asegurate de poner tu ID real acá
const RECOPILACION_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;

let datosRankingGlobal = [];
let mesActivoGlobal = "";
let categoriaActual = "PRIMERA"; // Categoría seleccionada por defecto
let mostrarSoloTop10 = true;     // Controla si recortamos la lista o no

// --- 1. CARGA INICIAL DE DATOS ---
document.addEventListener('DOMContentLoaded', inicializarBaseDeDatos);

async function inicializarBaseDeDatos() {
    try {
        const respuesta = await fetch(RECOPILACION_URL);
        const textoCrudo = await respuesta.text();

        // Limpiamos el texto HTML/String que devuelve Google para transformarlo en JSON válido
        const textoJsonValido = textoCrudo.substring(textoCrudo.indexOf('{'), textoCrudo.lastIndexOf('}') + 1);
        const datosParseados = JSON.parse(textoJsonValido);

        const filas = datosParseados.table.rows;

        // Guardamos el mes (asumiendo que está en la celda E2 de la primera fila de datos)
        if (filas[0] && filas[0].c[4]) {
            // Como no hay columna de mes en esta estructura, dejamos un texto fijo o lo manejás desde el HTML
            mesActivoGlobal = "Actualizado Junio 2026";
        }

        // Mapeamos las filas según el orden REAL de tu Google Sheet:
        // Columna 0 (A) = Categoría | Columna 1 (B) = Posición | Columna 2 (C) = Jugador | Columna 3 (D) = Club | Columna 4 (E) = Puntos
        datosRankingGlobal = filas.map(f => ({
            categoria: f.c[0] ? f.c[0].v.trim().toUpperCase() : '',
            posicion: f.c[1] ? parseInt(f.c[1].v) : 0,
            jugador: f.c[2] ? f.c[2].v : '',
            club: f.c[3] ? f.c[3].v : '',
            puntos: f.c[4] ? parseInt(f.c[4].v) : 0
        }));

        console.log("¡Base de datos cargada con éxito!", datosRankingGlobal);

        // Renderizado inicial al cargar la página por primera vez
        renderizarTablaRanking();

    } catch (error) {
        console.error("Hubo un error al conectar con la base de datos:", error);
        const tablaBody = document.getElementById('ranking-body');
        if (tablaBody) {
            tablaBody.innerHTML = `
                <tr>
                    <td colspan="4" class="px-6 py-8 text-center text-red-500 font-bold">
                        <i class="fas fa-exclamation-triangle mr-2"></i> Error al cargar el ranking. Por favor, reintente más tarde.
                    </td>
                </tr>
            `;
        }
    }
}

// --- 2. FUNCIÓN DE RENDERIZADO GENERAL ---
function renderizarTablaRanking() {
    const tablaBody = document.getElementById('ranking-body');
    if (!tablaBody) return;

    // Filtramos por la categoría seleccionada actualmente
    let jugadoresFiltrados = datosRankingGlobal.filter(j => j.categoria === categoriaActual);

    // Ordenamos numéricamente por posición por si las dudas
    jugadoresFiltrados.sort((a, b) => a.posicion - b.posicion);

    // Guardamos la cantidad total antes de aplicar el recorte del Top 10
    const totalJugadoresEnCategoria = jugadoresFiltrados.length;

    // Si está activada la vista recortada, aplicamos el slice a los primeros 10
    if (mostrarSoloTop10) {
        jugadoresFiltrados = jugadoresFiltrados.slice(0, 10);
    }

    // Limpiamos la tabla
    tablaBody.innerHTML = '';

    // Si no hay nadie registrado en la categoría
    if (jugadoresFiltrados.length === 0) {
        tablaBody.innerHTML = `
            <tr>
                <td colspan="4" class="px-6 py-8 text-center text-gray-500">
                    No hay datos cargados para la categoría ${categoriaActual} en este período.
                </td>
            </tr>
        `;
        if (botonToggle) {
            botonToggle.href = `ranking.html?categoria=${categoriaActual}`;
        }
        return;
    }

    // Dibujamos las filas dinámicamente en el HTML
    jugadoresFiltrados.forEach(j => {
        let clasePosicion = "text-gray-700 font-bold";
        if (j.posicion === 1) clasePosicion = "text-yellow-500 font-extrabold text-lg"; // Oro
        if (j.posicion === 2) clasePosicion = "text-gray-400 font-extrabold text-lg";   // Plata
        if (j.posicion === 3) clasePosicion = "text-amber-600 font-extrabold text-lg";  // Bronce

        tablaBody.innerHTML += `
            <tr class="hover:bg-gray-50 transition duration-200 border-b border-gray-100">
                <td class="px-6 py-4 text-center ${clasePosicion}">${j.posicion}º</td>
                <td class="px-6 py-4 font-semibold text-blue-900">${j.jugador}</td>
                <td class="px-6 py-4 text-gray-600 text-sm">${j.club}</td>
                <td class="px-6 py-4 text-right font-bold text-gray-900">${j.puntos}</td>
            </tr>
        `;
    });

    // Actualizamos los títulos y el botón según los estados actuales
    actualizarTextosInterfaz(totalJugadoresEnCategoria);
}

// --- 3. ACCIONES DEL USUARIO (INTERACTIVIDAD) ---

// Cambia de categoría al hacer clic en los botones de la izquierda
function cambiarCategoriaYRenderizar(nuevaCategoria) {
    categoriaActual = nuevaCategoria.trim().toUpperCase();

    // Al cambiar de categoría, reiniciamos la vista para mostrar primero el Top 10
    mostrarSoloTop10 = true;

    // Actualizamos visualmente cuál botón lateral está seleccionado
    const botones = document.querySelectorAll('#category-buttons button');
    botones.forEach(btn => {
        if (btn.id === `btn-${categoriaActual}`) {
            btn.className = "w-full text-left px-4 py-3 rounded-lg bg-asatemeBlue text-white font-semibold transition active-category-btn";
        } else {
            btn.className = "w-full text-left px-4 py-3 rounded-lg bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition";
        }
    });

    // Volvemos a dibujar la tabla con los nuevos filtros aplicados
    renderizarTablaRanking();
}

// Alterna entre ver solo 10 o ver toda la lista de la categoría
function alternarVistaCompleta() {
    mostrarSoloTop10 = !mostrarSoloTop10; // Invierte el valor (true -> false / false -> true)
    renderizarTablaRanking();
}

// Actualiza de manera prolija los títulos, subtítulos y textos de los botones
function actualizarTextosInterfaz(cantidadTotal) {
    const tituloTabla = document.getElementById('ranking-title');
    const subtituloMes = document.getElementById('ranking-mes-titulo');
    const botonToggle = document.getElementById('btn-toggle-vista');
    const textoBoton = document.getElementById('txt-toggle-vista');

    // Formateamos el título de la tabla de forma semántica
    if (tituloTabla) {
        const nombreBonitoCategoria = categoriaActual.charAt(0) + categoriaActual.slice(1).toLowerCase();
        tituloTabla.innerHTML = `<i class="fas fa-medal mr-2"></i>${mostrarSoloTop10 ? 'Top 10' : 'Ranking Completo'} - ${nombreBonitoCategoria}`;
    }

    // Inyectamos el mes obtenido desde el Excel
    if (subtituloMes) {
        subtituloMes.innerText = mesActivoGlobal ? `Ranking Oficial — ${mesActivoGlobal}` : "Ranking Oficial Actualizado";
    }

    // Ocultamos o cambiamos el texto del botón según corresponda
    if (botonToggle && textoBoton) {
        if (cantidadTotal <= 10) {
            // Si la lista de por sí tiene 10 jugadores o menos, ocultamos el botón porque no hay nada más que expandir
            botonToggle.classList.add('hidden');
        } else {
            botonToggle.classList.remove('hidden');
            if (mostrarSoloTop10) {
                textoBoton.innerText = "Ver Ranking Completo";
                botonToggle.innerHTML = `<i class="fas fa-list-ol"></i> <span id="txt-toggle-vista">Ver Ranking Completo</span>`;
            } else {
                textoBoton.innerText = "Ver Solo Top 10";
                botonToggle.innerHTML = `<i class="fas fa-compress-alt"></i> <span id="txt-toggle-vista">Ver Solo Top 10</span>`;
            }
        }
    }
}