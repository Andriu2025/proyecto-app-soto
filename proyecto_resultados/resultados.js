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
// Actualizar tabla de resultados POR CATEGORÍAS (agregación)
// -----------------------------
function actualizarTablaResultadosPorCategorias(gestionesSeleccionadas) {
  const tbody = document.querySelector("#tablaResultados tbody");
  const tfoot = document.querySelector("#tablaResultados tfoot");
  if (!tbody || !tfoot) return;
  tbody.innerHTML = "";
  tfoot.innerHTML = "";

  const summary = {};
  ["Toros Angus","Toros Hereford","Vaquillonas Angus","Vaquillonas Hereford","Caballos","Otros"].forEach(c => {
    summary[c] = { cantidad: 0, importe: 0, kilos: 0 };
  });

  gestionesSeleccionadas.forEach(g => {
    if (!g.detalle || !Array.isArray(g.detalle)) return;
    g.detalle.forEach(d => {
      const key = normalizeCategory(d.categoria);
      const cantidad = safeParseNumber(d.cantidad);
      const importe = safeParseNumber(d.importe);
      const kilos = safeParseNumber(d.impKg);
      if (!summary[key]) summary[key] = { cantidad: 0, importe: 0, kilos: 0 };
      summary[key].cantidad += cantidad;
      summary[key].importe += importe;
      summary[key].kilos += kilos;
    });
  });

  const bovinos = ["Toros Angus","Toros Hereford","Vaquillonas Angus","Vaquillonas Hereford"];
  bovinos.forEach(cat => {
    const data = summary[cat] || { cantidad:0, importe:0, kilos:0 };
    const promedio$ = data.cantidad ? data.importe / data.cantidad : 0;
    const promedioKg = data.cantidad ? data.kilos / data.cantidad : 0;
    const precioKg = data.kilos ? data.importe / data.kilos : 0;

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${cat}</td>
      <td>${formatNumber(data.cantidad)}</td>
      <td>${formatMoney(data.importe)}</td>
      <td>${formatNumber(data.importe ? data.importe / (data.cantidad || 1) : 0)}</td>
      <td>${formatMoney(promedio$)}</td>
      <td>${formatNumber(promedioKg)}</td>
      <td>${formatNumber(data.kilos)}</td>
      <td>${formatMoney(precioKg)}</td>
    `;
    tbody.appendChild(row);
  });

  const subtotal = bovinos.reduce((acc, c) => {
    acc.cantidad += summary[c]?.cantidad || 0;
    acc.importe += summary[c]?.importe || 0;
    acc.kilos += summary[c]?.kilos || 0;
    return acc;
  }, {cantidad:0, importe:0, kilos:0});

  const promedioSubtotal = subtotal.cantidad ? subtotal.importe / subtotal.cantidad : 0;
  const promedioKgSubtotal = subtotal.cantidad ? subtotal.kilos / subtotal.cantidad : 0;
  const precioKgSubtotal = subtotal.kilos ? subtotal.importe / subtotal.kilos : 0;

  const rowSubtotal = document.createElement("tr");
  rowSubtotal.className = "fila-subtotal";
  rowSubtotal.innerHTML = `
    <td><strong>SUBTOTAL</strong></td>
    <td><strong>${formatNumber(subtotal.cantidad)}</strong></td>
    <td><strong>${formatMoney(subtotal.importe)}</strong></td>
    <td><strong>${formatNumber(subtotal.importe ? subtotal.importe / (subtotal.cantidad || 1) : 0)}</strong></td>
    <td><strong>${formatMoney(promedioSubtotal)}</strong></td>
    <td><strong>${formatNumber(promedioKgSubtotal)}</strong></td>
    <td><strong>${formatNumber(subtotal.kilos)}</strong></td>
    <td><strong>${formatMoney(precioKgSubtotal)}</strong></td>
  `;
  tbody.appendChild(rowSubtotal);

  const cab = summary["Caballos"] || { cantidad:0, importe:0, kilos:0 };
  const promedioCab = cab.cantidad ? cab.importe / cab.cantidad : 0;
  const promedioKgCab = cab.cantidad ? cab.kilos / cab.cantidad : 0;
  const precioKgCab = cab.kilos ? cab.importe / cab.kilos : 0;

  const rowCab = document.createElement("tr");
  rowCab.innerHTML = `
    <td>Caballos</td>
    <td>${formatNumber(cab.cantidad)}</td>
    <td>${formatMoney(cab.importe)}</td>
    <td>${formatNumber(cab.importe ? cab.importe / (cab.cantidad || 1) : 0)}</td>
    <td>${formatMoney(promedioCab)}</td>
    <td>${formatNumber(promedioKgCab)}</td>
    <td>${formatNumber(cab.kilos)}</td>
    <td>${formatMoney(precioKgCab)}</td>
  `;
  tbody.appendChild(rowCab);

  const otros = summary["Otros"] || { cantidad:0, importe:0, kilos:0 };
  const totalRemate = {
    cantidad: subtotal.cantidad + cab.cantidad + otros.cantidad,
    importe: subtotal.importe + cab.importe + otros.importe,
    kilos: subtotal.kilos + cab.kilos + otros.kilos
  };
  const precioKgTotal = totalRemate.kilos ? totalRemate.importe / totalRemate.kilos : 0;

  const rowTotal = document.createElement("tr");
  rowTotal.className = "fila-total";
  rowTotal.innerHTML = `
    <td><strong>TOTAL DEL REMATE</strong></td>
    <td><strong>${formatNumber(totalRemate.cantidad)}</strong></td>
    <td><strong>${formatMoney(totalRemate.importe)}</strong></td>
    <td><strong>${formatNumber(totalRemate.importe ? totalRemate.importe / (totalRemate.cantidad || 1) : 0)}</strong></td>
    <td colspan="3"></td>
    <td><strong>${formatMoney(precioKgTotal)}</strong></td>
  `;
  tbody.appendChild(rowTotal);

  tfoot.innerHTML = `
    <tr>
      <td style="font-weight:700">TOTALES</td>
      <td style="font-weight:700">${formatNumber(totalRemate.cantidad)}</td>
      <td style="font-weight:700">${formatMoney(totalRemate.importe)}</td>
      <td style="font-weight:700">${formatNumber(totalRemate.kilos)}</td>
      <td colspan="4"></td>
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
// AGREGAR A REPORTES (reemplazar este bloque en resultados.js)
// -----------------------------
document.addEventListener("DOMContentLoaded", () => {
  const btnAgregar = document.getElementById("btnAgregarAReportes");
  const btnConfirmar = document.getElementById("btnConfirmarAgregar");
  const btnCancelar = document.getElementById("btnCancelarAgregar");

  if (!btnAgregar || !btnConfirmar || !btnCancelar) return;

  btnAgregar.addEventListener("click", () => {
    btnConfirmar.style.display = "inline-block";
    btnCancelar.style.display = "inline-block";
  });

  btnCancelar.addEventListener("click", () => {
    btnConfirmar.style.display = "none";
    btnCancelar.style.display = "none";
  });

  btnConfirmar.addEventListener("click", () => {
    const tabla = document.getElementById("tablaResultados");
    if (!tabla) {
      alert("No se encontró la tabla de resultados.");
      return;
    }

    // Limpia botones visuales inmediatamente
    btnConfirmar.style.display = "none";
    btnCancelar.style.display = "none";

    // Tomamos el HTML de la tabla (solo la tabla)
    const tablaHTML = tabla.outerHTML;

    // Si la función agregarReporte está disponible (reportes.js cargado en la misma página),
    // la usamos directamente para insertar la tabla en la sección de reportes.
    if (typeof agregarReporte === "function") {
      try {
        agregarReporte(tablaHTML, "tabla");
        // Mostrar la sección de reportes (misma página)
        if (typeof mostrarReportes === "function") {
          mostrarReportes();
        } else {
          // si no existe mostrarReportes, intentamos mostrar la sección manualmente
          const reportesEl = document.getElementById("reportes");
          const resultadosEl = document.getElementById("resultados");
          const menuEl = document.getElementById("menuPrincipal");
          if (resultadosEl) resultadosEl.style.display = "none";
          if (menuEl) menuEl.style.display = "none";
          if (reportesEl) reportesEl.style.display = "block";
        }
      } catch (err) {
        console.error("Error agregando reporte directamente:", err);
        // fallback a localStorage
        localStorage.setItem("tablaResultadosParaReportes", tablaHTML);
        if (typeof mostrarReportes === "function") mostrarReportes();
      }
      return;
    }

    // Si no existe agregarReporte (por orden de carga), usamos localStorage como fallback
    localStorage.setItem("tablaResultadosParaReportes", tablaHTML);

    // Intentamos mostrar la sección de reportes si la función existe
    if (typeof mostrarReportes === "function") {
      mostrarReportes();
    } else {
      // si no, mostramos la sección de reportes manualmente
      const reportesEl = document.getElementById("reportes");
      const resultadosEl = document.getElementById("resultados");
      const menuEl = document.getElementById("menuPrincipal");
      if (resultadosEl) resultadosEl.style.display = "none";
      if (menuEl) menuEl.style.display = "none";
      if (reportesEl) reportesEl.style.display = "block";
    }
  });
});
