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
];

export function calcularEdad(fechaNacimiento) {
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const m = hoy.getMonth() - nacimiento.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  return edad;
}

export function obtenerCategoriasPermitidas(fechaNacimiento) {
  if (!fechaNacimiento) return [];
  const edad = calcularEdad(fechaNacimiento);

  let indiceBase = CATEGORIAS_EDADES.findIndex((cat) => edad <= cat.edadMax);
  if (indiceBase === -1) indiceBase = CATEGORIAS_EDADES.length - 2;

  const categoriasPermitidas = [];

  // 1. Su categoría por edad
  const catBase = CATEGORIAS_EDADES[indiceBase];
  if (catBase) categoriasPermitidas.push(catBase.nombre);

  // 2. La categoría siguiente (siempre que no sea Todo Competidor)
  const catSiguiente = CATEGORIAS_EDADES[indiceBase + 1];
  if (catSiguiente && catSiguiente.nombre !== "Todo Competidor") {
    categoriasPermitidas.push(catSiguiente.nombre);
  }

  // 3. Todo Competidor (obligatorio para todos)
  if (!categoriasPermitidas.includes("Todo Competidor")) {
    categoriasPermitidas.push("Todo Competidor");
  }

  return categoriasPermitidas;
}
