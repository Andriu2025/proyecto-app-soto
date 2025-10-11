// =============================
// reportes.js - FINAL AJUSTADO
// =============================

// Mostrar sección de reportes
function mostrarReportes() {
  const secciones = ["menuPrincipal", "animales", "resultados", "estadisticas"];
  secciones.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });

  const reportes = document.getElementById("reportes");
  if (reportes) reportes.style.display = "block";
}

document.addEventListener("DOMContentLoaded", () => {

  // BOTÓN VOLVER AL MENÚ
  const btnVolverReportes = document.getElementById("volverMenuReportes");
  if (btnVolverReportes) {
    btnVolverReportes.addEventListener("click", () => {
      const reportes = document.getElementById("reportes");
      const menu = document.getElementById("menuPrincipal");
      if (reportes) reportes.style.display = "none";
      if (menu) menu.style.display = "block";
    });
  }

  // CARGA INICIAL
  cargarReportesGuardados();

  // Si hay tabla enviada desde resultados.js
  const tablaResultados = localStorage.getItem("tablaResultadosParaReportes");
  if (tablaResultados) {
    agregarReporte(tablaResultados, "tabla");
    localStorage.removeItem("tablaResultadosParaReportes");
  }

  // ⚠ Estadísticas desde estadisticas.js ya NO se agregan automáticamente
});


// =============================
// FUNCIONES DE HOJAS Y REPORTES
// =============================
function agregarReporte(contenidoHTML, tipo = "general") {
  let hojaActual = document.querySelector(".reportes-hoja-wrap .reportes-hoja:last-child");
  if (!hojaActual) {
    hojaActual = crearNuevaHoja();
    document.querySelector(".reportes-hoja-wrap").appendChild(hojaActual);
  }

  let contenedorDestino;
  switch (tipo) {
    case "gestiones":
      contenedorDestino = hojaActual.querySelector(".reportes-gestiones");
      break;
    case "tabla":
      contenedorDestino = hojaActual.querySelector(".reportes-tabla");
      break;
    case "estadisticas":
      contenedorDestino = hojaActual.querySelector(".reportes-estadisticas");
      break;
    default:
      contenedorDestino = hojaActual;
      break;
  }

  if (contenidoHTML.trim()) contenedorDestino.innerHTML += contenidoHTML;

  // Asegurar el orden fijo: tabla -> gestiones -> estadísticas
  reordenarBloques(hojaActual);

  guardarReportes();
}

function crearNuevaHoja() {
  const div = document.createElement("div");
  div.className = "reportes-hoja";
  div.contentEditable = "true";
  div.style.overflow = "visible";
  div.style.minHeight = "150px";
  div.innerHTML = `
    <div class="reportes-tabla"><p><br></p></div>
    <div class="reportes-gestiones"><p><br></p></div>
    <div class="reportes-estadisticas"><p><br></p></div>
  `;
  div.addEventListener("input", guardarReportes);
  return div;
}


// =============================
// LOCALSTORAGE
// =============================
function guardarReportes() {
  const wrap = document.querySelector(".reportes-hoja-wrap");
  if (wrap) localStorage.setItem("reportesGuardados", wrap.innerHTML);
}

function cargarReportesGuardados() {
  const wrap = document.querySelector(".reportes-hoja-wrap");
  if (!wrap) return;

  const guardado = localStorage.getItem("reportesGuardados");
  if (guardado) wrap.innerHTML = guardado;

  limpiarHojasVacias();
}


// =============================
// FUNCIONES AUXILIARES
// =============================
function limpiarHojasVacias() {
  const hojas = document.querySelectorAll(".reportes-hoja");
  hojas.forEach(hoja => {
    if (!hoja.innerText.trim() && !hoja.querySelector("img, table, ul, ol")) hoja.remove();
  });
}

// 🔧 ORDEN FIJO DE BLOQUES
function reordenarBloques(hoja) {
  const tabla = hoja.querySelector(".reportes-tabla");
  const gestiones = hoja.querySelector(".reportes-gestiones");
  const estadisticas = hoja.querySelector(".reportes-estadisticas");

  if (!hoja || !tabla || !gestiones || !estadisticas) return;

  // Orden fijo: primero tabla, luego gestiones, luego estadísticas
  hoja.appendChild(tabla);
  hoja.appendChild(gestiones);
  hoja.appendChild(estadisticas);
}


// =============================
// AGREGAR ESTADÍSTICAS DESDE ESTADISTICAS.JS
// =============================
// ⚠ Eliminado: ya no se agrega automáticamente desde estadísticas



// =============================
// Paginación automática: ELIMINADA
// =============================
// No usar. Presionar Enter ya no crea hojas extras.





