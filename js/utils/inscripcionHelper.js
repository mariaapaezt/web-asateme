// js/utils/inscripcionHelper.js

export const CATEGORIAS_EDADES = [
  { nombre: "Sub-9", edadMax: 9 },
  { nombre: "Sub-11", edadMax: 11 },
  { nombre: "Sub-13", edadMax: 13 },
  { nombre: "Sub-15", edadMax: 15 },
  { nombre: "Sub-17", edadMax: 17 },
  { nombre: "Sub-19", edadMax: 19 },
  { nombre: "Sub-23", edadMax: 23 },
  { nombre: "Todo Competidor", edadMax: 99 },
  { nombre: "Maxi", edadMin: 30 } // Maxi general para mayores de 30 años
];

export function obtenerCategoriasPermitidas(fechaNacimientoStr) {
  if (!fechaNacimientoStr) return [];

  const anioNacimiento = new Date(fechaNacimientoStr).getFullYear();
  const anioActual = 2026; // Año en curso de los torneos
  const edad = anioActual - anioNacimiento;

  let permitidas = [];

  // 1. Determinar categoría mínima por edad y habilitar esa y las superiores
  let encontreMinima = false;
  CATEGORIAS_EDADES.forEach((cat) => {
    if (cat.nombre === "Todo Competidor") {
      permitidas.push(cat.nombre); // Todo Competidor siempre está habilitado
    } else if (cat.nombre === "Maxi") {
      // Maxi se habilita si tiene 30 años o más
      if (edad >= 30) {
        permitidas.push(cat.nombre);
      }
    } else {
      // Para las categorías por edades (Sub-9 a Sub-23)
      if (!encontreMinima) {
        if (edad <= cat.edadMax) {
          encontreMinima = true;
          permitidas.push(cat.nombre);
        }
      } else {
        // Todas las categorías superiores a la edad del jugador también se habilitan
        permitidas.push(cat.nombre);
      }
    }
  });

  // Si por alguna razón la edad excede Sub-23 y no entró en ninguna de menores menor o igual, se aseguran Todo Competidor y Maxi si corresponde
  return permitidas;
}