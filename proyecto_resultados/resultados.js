// resultados.js
// =============================
// RESULTADOS DEL REMATE (agregación por categorías + historial con checkboxes)
// =============================

// Helpers ---------------------
function safeParseNumber(str) {
  if (str == null) return 0;
  if (typeof str === "number") return isFinite(str) ? str : 0;
  const cleaned = String(str)
    .replace(/\$/g, "")
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(/,/g, ".");
  const n = parseFloat(cleaned);
  return isFinite(n) ? n : 0;
}

function formatMoney(n) {
  if (!isFinite(n)) return "$ 0,00";
  return `$ ${Number(n).toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatNumber(n) {
  if (!isFinite(n)) return "0";
  return Number(n).toLocaleString("es-AR");
}

// Categorías objetivo (orden de filas que querés en la tabla)
const CATS_ORDER = [
  "Toros Angus",
  "Toros Hereford",
  "Vaquillonas Angus",
  "Vaquillonas Hereford",
  // SUBTOTAL row (calculada), luego:
  "Caballos",
  // TOTAL DEL REMATE (calculada)
];

// Normaliza el texto de categoría (intenta mapear variantes a las categorías deseadas)
function normalizeCategory(raw) {
  if (!raw) return "Otros";
  const s = String(raw).toLowerCase();

  if (s.includes("toro") && s.includes("angus")) return "Toros Angus";
  if (s.includes("toro") && s.includes("hereford")) return "Toros Hereford";

  if ((s.includes("vaquill") || s.includes("vaq")) && s.includes("angus")) return "Vaquillonas Angus";
  if ((s.includes("vaquill") || s.includes("vaq")) && s.includes("hereford")) return "Vaquillonas Hereford";

  if (s.includes("caball")) return "Caballos";

  for (const c of CATS_ORDER) {
    if (s.includes(c.toLowerCase())) return c;
  }

  return "Otros";
}

// -----------------------------
// Mostrar sección de Resultados
// -----------------------------
function mostrarResultados() {
  try {
    const animalesEl = document.getElementById("animales");
    const menuEl = document.getElementById("menuPrincipal");
    const resultadosEl = document.getElementById("resultados");

    if (animalesEl) animalesEl.style.display = "none";
    if (menuEl) menuEl.style.display = "none";
    if (resultadosEl) resultadosEl.style.display = "block";

    // Mostrar historial (checkboxes)
    mostrarHistorialGestiones();

    // Recalcular con la selección actual
    recalcularResultadosSeleccionados();
  } catch (err) {
    console.error("mostrarResultados error:", err);
    alert("Ocurrió un error al abrir Resultados. Revisa la consola (F12).");
  }
}

// -----------------------------
// Historial de Gestiones (checkboxes, agrupado por año-mes)
// -----------------------------
function mostrarHistorialGestiones() {
  const cont = document.getElementById("historialGestiones");
  if (!cont) return;

  const gestiones = JSON.parse(localStorage.getItem("gestiones")) || [];
  let seleccionadas = JSON.parse(localStorage.getItem("seleccionadas")) || {};
  
  if (gestiones.length === 0) {
    cont.innerHTML = "<p>No hay gestiones guardadas.</p>";
    return;
  }

  const groups = {};
  gestiones.forEach((g, idx) => {
    const fecha = g.fecha ? new Date(g.fecha) : null;
    const y = fecha ? fecha.getFullYear() : "SinFecha";
    const m = fecha ? (fecha.getMonth() + 1) : "0";
    const key = `${y}-${String(m).padStart(2, "0")}`;
    if (!groups[key]) groups[key] = { year: y, month: m, items: [] };
    groups[key].items.push({ index: idx, gestion: g });
  });

  const keys = Object.keys(groups).sort((a,b) => b.localeCompare(a));
  let html = "";
  keys.forEach(key => {
    const group = groups[key];
    const year = group.year;
    const month = Number(group.month);
    const monthName = isNaN(month) ? group.month : new Date(year, month - 1).toLocaleString("es-AR", { month: "long" });

    // checkbox del mes completo
    const allSelected = group.items.every(it => seleccionadas[it.index] !== false);
    html += `<h4>
      <label>
        <input type="checkbox" class="chkMes" data-group="${key}" ${allSelected ? "checked" : ""}>
        ${year} - ${monthName}
      </label>
    </h4><div class="groupGestiones">`;

    group.items.forEach(it => {
      const g = it.gestion;
      const fechaTexto = g.fecha ? new Date(g.fecha).toLocaleDateString("es-AR") : "Sin fecha";
      const cantidad = g.totalCantidad || 0;
      const kilos = g.totalKg || 0;
      const importe = safeParseNumber(g.total);

      const isChecked = seleccionadas[it.index] !== false;
      html += `
        <label class="histItem">
          <input type="checkbox" class="chkGestion" value="${it.index}" ${isChecked ? "checked" : ""}>
          ${fechaTexto} — ${cantidad} animales — ${formatNumber(kilos)} Kg — ${formatMoney(importe)}
        </label>
      `;
    });
    html += `</div>`;
  });

  cont.innerHTML = html;

  // eventos para gestiones individuales
  cont.querySelectorAll(".chkGestion").forEach(chk => {
    chk.addEventListener("change", e => {
      const val = parseInt(e.target.value, 10);
      if (!isNaN(val)) {
        seleccionadas[val] = e.target.checked;
        localStorage.setItem("seleccionadas", JSON.stringify(seleccionadas));
        recalcularResultadosSeleccionados();
      }
    });
  });

  // eventos para meses completos
  cont.querySelectorAll(".chkMes").forEach(chkMes => {
    chkMes.addEventListener("change", e => {
      const groupKey = e.target.dataset.group;
      const group = groups[groupKey];
      if (group) {
        group.items.forEach(it => {
          seleccionadas[it.index] = e.target.checked;
        });
        localStorage.setItem("seleccionadas", JSON.stringify(seleccionadas));
        mostrarHistorialGestiones(); // re-render
        recalcularResultadosSeleccionados();
      }
    });
  });
}

// -----------------------------
// Recalcular en base a seleccionados
// -----------------------------
function recalcularResultadosSeleccionados() {
  const gestiones = JSON.parse(localStorage.getItem("gestiones")) || [];
  const seleccionadas = JSON.parse(localStorage.getItem("seleccionadas")) || {};
  const activas = [];

  gestiones.forEach((g, idx) => {
    if (seleccionadas[idx] !== false) activas.push(g);
  });

  actualizarTablaResultadosPorCategorias(activas);
}

// -----------------------------
// Actualizar tabla de resultados POR CATEGORÍAS (bloque corregido completo)
// -----------------------------
function actualizarTablaResultadosPorCategorias(gestionesSeleccionadas) {
  const tbody = document.querySelector("#tablaResultados tbody");
  const tfoot = document.querySelector("#tablaResultados tfoot");
  if (!tbody || !tfoot) return;
  tbody.innerHTML = "";
  tfoot.innerHTML = "";

  const categorias = ["Toros Angus","Toros Hereford","Vaquillonas Angus","Vaquillonas Hereford","Caballos","Otros"];
  const resumen = {};
  categorias.forEach(c => resumen[c] = { cantidad:0, importe:0, kilos:0 });

  // Sumatoria general por categoría
  gestionesSeleccionadas.forEach(g => {
    if (!g.detalle || !Array.isArray(g.detalle)) return;
    g.detalle.forEach(d => {
      const key = normalizeCategory(d.categoria);
      const cantidad = safeParseNumber(d.cantidad);
      const importe = safeParseNumber(d.importe);
let kilosCalc = 0;

// TOROS → peso fijo 650 kg
if (key.includes("Toro")) {
  kilosCalc = cantidad * 650;
}

// VAQUILLONAS → peso fijo 200 kg
else if (key.includes("Vaquillona")) {
  kilosCalc = cantidad * 200;
}

// CABALLOS → no usan kilos
else if (key.includes("Caballo")) {
  kilosCalc = 0;
}


      if (!resumen[key]) resumen[key] = { cantidad:0, importe:0, kilos:0 };
      resumen[key].cantidad += cantidad;
      resumen[key].importe += importe;
      resumen[key].kilos += kilosCalc;
    });
  });

  // =======================
  // FILAS PRINCIPALES
  // =======================
  const bovinos = ["Toros Angus","Toros Hereford","Vaquillonas Angus","Vaquillonas Hereford"];
  bovinos.forEach(cat => {
    const d = resumen[cat] || { cantidad:0, importe:0, kilos:0 };
    const promedio$ = d.cantidad ? d.importe / d.cantidad : 0;
    const promedioKg = d.cantidad ? d.kilos / d.cantidad : 0;
    const precioKg = d.kilos ? d.importe / d.kilos : 0;
    const convertidoKg = 0; // En categorías NO se usa $ convertidos en Kg

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${cat}</td>
      <td>${formatNumber(d.cantidad)}</td>
      <td>${formatMoney(d.importe)}</td>
      <td>${formatNumber(convertidoKg)}</td>   <!-- SIN $ -->
      <td>${formatMoney(promedio$)}</td>       <!-- ESTO SIGUE EN $ -->
      <td>${formatNumber(promedioKg)}</td>
      <td>${formatNumber(d.kilos)}</td>
      <td>${formatMoney(precioKg)}</td>
    `;
    tbody.appendChild(row);
  });

  // =======================
  // SUBTOTAL
  // =======================
  const subtotal = bovinos.reduce((acc, c) => {
    const d = resumen[c] || { cantidad:0, importe:0, kilos:0 };
    acc.cantidad += d.cantidad;
    acc.importe += d.importe;
    acc.kilos += d.kilos;
    return acc;
  }, {cantidad:0, importe:0, kilos:0});

  const promedioSubtotal$ = subtotal.cantidad ? subtotal.importe / subtotal.cantidad : 0;
  const promedioKgSubtotal = subtotal.cantidad ? subtotal.kilos / subtotal.cantidad : 0;
  const precioKgSubtotal = subtotal.kilos ? subtotal.importe / subtotal.kilos : 0;
  const convertidoKgSubtotal = promedioKgSubtotal > 0 ? subtotal.importe / promedioKgSubtotal : 0;

  const rowSubtotal = document.createElement("tr");
  rowSubtotal.className = "fila-subtotal";
  rowSubtotal.innerHTML = `
    <td><strong>SUBTOTAL</strong></td>
    <td><strong>${formatNumber(subtotal.cantidad)}</strong></td>
    <td><strong>${formatMoney(subtotal.importe)}</strong></td>
    <td><strong>${formatMoney(convertidoKgSubtotal)}</strong></td>
    <td><strong>${formatMoney(promedioSubtotal$)}</strong></td>
    <td><strong>${formatNumber(promedioKgSubtotal)}</strong></td>
    <td><strong>${formatNumber(subtotal.kilos)}</strong></td>
    <td><strong>${formatMoney(precioKgSubtotal)}</strong></td>
  `;
  tbody.appendChild(rowSubtotal);

  // =======================
  // CABALLOS
  // =======================
  const cab = resumen["Caballos"] || { cantidad:0, importe:0, kilos:0 };
  const promedioCab$ = cab.cantidad ? cab.importe / cab.cantidad : 0;
  const promedioKgCab = cab.cantidad ? cab.kilos / cab.cantidad : 0;
  const precioKgCab = cab.kilos ? cab.importe / cab.kilos : 0;
  const convertidoKgCab = promedioKgCab > 0 ? cab.importe / promedioKgCab : 0;

  const rowCab = document.createElement("tr");
  rowCab.innerHTML = `
    <td>Caballos</td>
    <td>${formatNumber(cab.cantidad)}</td>
    <td>${formatMoney(cab.importe)}</td>
    <td>${formatMoney(convertidoKgCab)}</td>
    <td>${formatMoney(promedioCab$)}</td>
    <td>${formatNumber(promedioKgCab)}</td>
    <td>${formatNumber(cab.kilos)}</td>
    <td>${formatMoney(precioKgCab)}</td>
  `;
  tbody.appendChild(rowCab);

  // =======================
  // TOTAL DEL REMATE
  // =======================
  const total = {
    cantidad: subtotal.cantidad + cab.cantidad,
    importe: subtotal.importe + cab.importe,
    kilos: subtotal.kilos + cab.kilos
  };
  const promedioTotal$ = total.cantidad ? total.importe / total.cantidad : 0;
  const promedioKgTotal = total.cantidad ? total.kilos / total.cantidad : 0;
  const promedioGeneralKg = 370; // ESTE ES EL PROMEDIO GENERAL DEL REMATE
  const kilosConvertidosFinal = total.cantidad * promedioGeneralKg;
  const precioKgTotal = total.kilos ? total.importe / total.kilos : 0;
  const convertidoKgTotal = kilosConvertidosFinal; // igual que en Excel (19.000 aprox)

  const rowTotal = document.createElement("tr");
  rowTotal.className = "fila-total";
  rowTotal.innerHTML = `
    <td><strong>TOTAL DEL REMATE</strong></td>
    <td><strong>${formatNumber(total.cantidad)}</strong></td>
    <td><strong>${formatMoney(total.importe)}</strong></td>
    <td><strong>${formatNumber(convertidoKgTotal)}</strong></td> <!-- SIN $ -->
    <td><strong>${formatMoney(promedioTotal$)}</strong></td>
    <td><strong>${formatNumber(promedioKgTotal)}</strong></td>
    <td><strong>${formatNumber(total.kilos)}</strong></td>
    <td><strong>${formatMoney(precioKgTotal)}</strong></td>
  `;
  tbody.appendChild(rowTotal);

  // =======================
  // TOTALES FOOT
  // =======================
  tfoot.innerHTML = `
    <tr>
      <td style="font-weight:700">TOTALES</td>
      <td style="font-weight:700">${formatNumber(total.cantidad)}</td>
      <td style="font-weight:700">${formatMoney(total.importe)}</td>
      <td style="font-weight:700">${formatMoney(convertidoKgTotal)}</td>
      <td style="font-weight:700">${formatMoney(promedioTotal$)}</td>
      <td style="font-weight:700">${formatNumber(promedioKgTotal)}</td>
      <td style="font-weight:700">${formatNumber(total.kilos)}</td>
      <td style="font-weight:700">${formatMoney(precioKgTotal)}</td>
    </tr>
  `;
}


// Exportar al scope global
window.mostrarResultados = mostrarResultados;


function recargarTodo() {
  // resultados
  if (typeof renderTablaResultados === "function") {
    renderTablaResultados();
  }

  // estadísticas
  if (typeof renderGraficoVentas === "function") {
    if (currentFiltroRange) {
      renderGraficoVentas({ año: currentVentasYear, range: currentFiltroRange });
      renderGraficoDinero({ año: currentDineroYear, range: currentFiltroRange });
    } else {
      renderGraficoVentas({ año: currentVentasYear, mes: currentFiltroMes });
      renderGraficoDinero({ año: currentDineroYear, mes: currentFiltroMes });
    }

    renderRanking({ año: currentRankingYear, mes: currentRankingMonth });
    actualizarRankingNavegacion();
    actualizarVentasNavegacion();
    actualizarDineroNavegacion();
  }
}

// -----------------------------
// AGREGAR A REPORTES (bloque definitivo, compatible con CSS !important)
// Reemplazar cualquier bloque anterior parecido por este
// -----------------------------
document.addEventListener("DOMContentLoaded", () => {
  const btnAgregar = document.getElementById("btnAgregarAReportes");
  const btnConfirmar = document.getElementById("btnConfirmarAgregar");
  const btnCancelar = document.getElementById("btnCancelarAgregar");

  // Si no existen, salir sin que rompa nada
  if (!btnAgregar || !btnConfirmar || !btnCancelar) return;

  // -- Estado inicial: forzar ocultar confirmar/cancelar usando inline !important
  btnConfirmar.style.setProperty("display", "none", "important");
  btnCancelar.style.setProperty("display", "none", "important");
  // Aseguramos que el botón Agregar esté visible inicialmente
  btnAgregar.style.setProperty("display", "inline-flex", "important");

  // Al presionar "Agregar a Reportes"
  btnAgregar.addEventListener("click", () => {
    // Ocultamos el botón principal (forzado)
    btnAgregar.style.setProperty("display", "none", "important");

    // Mostramos confirmar y cancelar (forzado inline con !important)
    btnConfirmar.style.setProperty("display", "inline-flex", "important");
    btnCancelar.style.setProperty("display", "inline-flex", "important");

    // (si querés, podés añadir focus)
    try { btnConfirmar.focus(); } catch(e) {}
  });

  // Al presionar "Cancelar"
  btnCancelar.addEventListener("click", () => {
    // Ocultar botones secundarios (forzado)
    btnConfirmar.style.setProperty("display", "none", "important");
    btnCancelar.style.setProperty("display", "none", "important");

    // Volver a mostrar botón Agregar
    btnAgregar.style.setProperty("display", "inline-flex", "important");
  });

  // Al presionar "Confirmar"
  btnConfirmar.addEventListener("click", () => {
    const tabla = document.getElementById("tablaResultados");
    if (!tabla) {
      alert("No se encontró la tabla de resultados.");
      return;
    }

    // Volver al estado inicial (ocultar secundarios, mostrar agregar)
    btnConfirmar.style.setProperty("display", "none", "important");
    btnCancelar.style.setProperty("display", "none", "important");
    btnAgregar.style.setProperty("display", "inline-flex", "important");

    // Lógica original: tomar HTML y enviarlo a reportes (idem a tu código)
    const tablaHTML = tabla.outerHTML;

    if (typeof agregarReporte === "function") {
      try {
        agregarReporte(tablaHTML, "tabla");
        if (typeof mostrarReportes === "function") {
          mostrarReportes();
        } else {
          const reportesEl = document.getElementById("reportes");
          const resultadosEl = document.getElementById("resultados");
          const menuEl = document.getElementById("menuPrincipal");
          if (resultadosEl) resultadosEl.style.display = "none";
          if (menuEl) menuEl.style.display = "none";
          if (reportesEl) reportesEl.style.display = "block";
        }
      } catch (err) {
        console.error("Error agregando reporte directamente:", err);
        localStorage.setItem("tablaResultadosParaReportes", tablaHTML);
        if (typeof mostrarReportes === "function") mostrarReportes();
      }
      return;
    }

    // Fallback si no existe agregarReporte
    localStorage.setItem("tablaResultadosParaReportes", tablaHTML);
    if (typeof mostrarReportes === "function") {
      mostrarReportes();
    } else {
      const reportesEl = document.getElementById("reportes");
      const resultadosEl = document.getElementById("resultados");
      const menuEl = document.getElementById("menuPrincipal");
      if (resultadosEl) resultadosEl.style.display = "none";
      if (menuEl) menuEl.style.display = "none";
      if (reportesEl) reportesEl.style.display = "block";
    }
  });
});

