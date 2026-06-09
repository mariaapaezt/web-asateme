// CONFIGURACIÓN DE LA CONEXIÓN DIRECTA CON TU EXCEL
const SHEET_ID = '1D8FRoqxEYdG--DHnOERb5cKEze9suOVOyhyhGBIAc-A'; // <--- Poné tu ID real acá
const RECOPILACION_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Ranking`;

let datosRankingGlobal = [];
let categoriaActual = "PRIMERA"; // Por defecto al arrancar
let textoBusqueda = "";          // Almacena lo que el usuario escribe en el buscador

// --- FUNCIÓN PARA OBTENER EL MES Y AÑO DINÁMICO EN ESPAÑOL ---
function obtenerMesAnioActual() {
    const meses = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    const fecha = new Date();
    const nombreMes = meses[fecha.getMonth()];
    const anio = fecha.getFullYear();
    
    return `${nombreMes} ${anio}`;
}

// Inicialización de la pantalla
document.addEventListener('DOMContentLoaded', async () => {
    const parametrosURL = new URLSearchParams(window.location.search);
    const catUrl = parametrosURL.get('categoria');
    if (catUrl) {
        categoriaActual = catUrl.trim().toUpperCase();
    }

    await cargarDatosDesdeSheets();
});

async function cargarDatosDesdeSheets() {
    try {
        const respuesta = await fetch(RECOPILACION_URL);
        const textoCrudo = await respuesta.text();
        const textoJsonValido = textoCrudo.substring(textoCrudo.indexOf('{'), textoCrudo.lastIndexOf('}') + 1);
        const datosParseados = JSON.parse(textoJsonValido);
        const filas = datosParseados.table.rows;

        // Mapeo adaptado a tu estructura real
        datosRankingGlobal = filas.map(f => ({
            categoria: f.c[0] ? f.c[0].v.trim().toUpperCase() : '',
            posicion:  f.c[1] ? parseInt(f.c[1].v) : 0,
            jugador:   f.c[2] ? f.c[2].v : '',
            club:      f.c[3] ? f.c[3].v : '',
            puntos:    f.c[4] ? parseInt(f.c[4].v) : 0
        }));

        renderizarTablaCompleta();

    } catch (error) {
        console.error("Error al procesar el ranking completo:", error);
        document.getElementById('vista-ranking-body').innerHTML = `
            <tr>
                <td colspan="4" class="px-6 py-12 text-center text-red-500 font-bold">
                    <i class="fas fa-exclamation-triangle mr-2"></i> Error de conexión.
                </td>
            </tr>
        `;
    }
}

function renderizarTablaCompleta() {
    const tablaBody = document.getElementById('vista-ranking-body');
    const tituloSeccion = document.getElementById('vista-ranking-titulo');
    const subtituloMes = document.getElementById('vista-ranking-mes');
    if (!tablaBody) return;

    // 1. FILTRADO MULTIPLE: Por categoría Y por el texto del buscador (ignorando mayúsculas/minúsculas)
    let jugadoresFiltrados = datosRankingGlobal.filter(j => {
        const coincideCategoria = j.categoria === categoriaActual;
        const coincideNombre = j.jugador.toLowerCase().includes(textoBusqueda.toLowerCase());
        return coincideCategoria && coincideNombre;
    });

    // Ordenamos por escalafón numérico
    jugadoresFiltrados.sort((a, b) => a.posicion - b.posicion);

    // Formateo visual del título
    const nombreBonito = categoriaActual.charAt(0) + categoriaActual.slice(1).toLowerCase();

    if (tituloSeccion) {
        tituloSeccion.innerHTML = `<i class="fas fa-trophy text-asatemeRed mr-2"></i> Ranking Completo — Categoría ${nombreBonito}`;
    }
    
    if (subtituloMes) {
        subtituloMes.innerText = ` ${obtenerMesAnioActual()}`;
    }

    // Sincronizar estilos de las pestañas superiores
    const botonesTabs = document.querySelectorAll('#vista-category-selector button');
    botonesTabs.forEach(btn => {
        if (btn.id === `tab-${categoriaActual}`) {
            btn.className = "px-4 py-2 rounded-lg font-bold text-sm transition bg-asatemeBlue text-white shadow-md";
        } else {
            btn.className = "px-4 py-2 rounded-lg font-bold text-sm transition bg-white text-gray-600 hover:bg-gray-100 border border-gray-200";
        }
    });

    // Limpieza e inserción de filas filtradas
    tablaBody.innerHTML = '';

    if (jugadoresFiltrados.length === 0) {
        tablaBody.innerHTML = `
            <tr>
                <td colspan="4" class="px-6 py-12 text-center text-gray-500 font-medium">
                    ${textoBusqueda ? 'No se encontraron jugadores que coincidan con la búsqueda.' : 'No hay jugadores registrados en esta categoría.'}
                </td>
            </tr>
        `;
        return;
    }

    jugadoresFiltrados.forEach(j => {
        let clasePosicion = "text-gray-700 font-bold";
        if (j.posicion === 1) clasePosicion = "text-yellow-500 font-extrabold text-lg";
        if (j.posicion === 2) clasePosicion = "text-gray-400 font-extrabold text-lg";
        if (j.posicion === 3) clasePosicion = "text-amber-600 font-extrabold text-lg";

        tablaBody.innerHTML += `
            <tr class="hover:bg-gray-50/80 transition duration-150 border-b border-gray-100">
                <td class="px-6 py-4 text-center ${clasePosicion}">${j.posicion}º</td>
                <td class="px-6 py-4 font-semibold text-blue-900">${j.jugador}</td>
                <td class="px-6 py-4 text-gray-600 text-sm">${j.club}</td>
                <td class="px-6 py-4 text-right font-bold text-gray-900">${j.puntos}</td>
            </tr>
        `;
    });
}

// Se ejecuta cada vez que el usuario escribe en el input
function filtrarPorNombre() {
    const inputBuscador = document.getElementById('buscador-jugador');
    if (inputBuscador) {
        textoBusqueda = inputBuscador.value.trim();
        renderizarTablaCompleta(); // Volvemos a dibujar con el nuevo filtro activo
    }
}

// Permite cambiar de categoría limpiando el buscador para una mejor experiencia
function filtrarNuevaCategoria(nuevaCat) {
    categoriaActual = nuevaCat.trim().toUpperCase();
    textoBusqueda = ""; // Reseteamos el buscador al cambiar de división
    
    const inputBuscador = document.getElementById('buscador-jugador');
    if (inputBuscador) inputBuscador.value = ""; // Limpiamos la caja visualmente
    
    renderizarTablaCompleta();
}