// =============================
// Estadísticas (gráficos + ranking) - VERSIÓN FINAL (completa)
// =============================

/* Helpers */
function safeParseNumber(str) {
  if (str == null) return 0;
  if (typeof str === "number") return isFinite(str) ? str : 0;
  const cleaned = String(str).replace(/\$/g, "").replace(/\s/g, "").replace(/\./g, "").replace(/,/g, ".");
  const n = parseFloat(cleaned);
  return isFinite(n) ? n : 0;
}

/* Meses */
const MESES_CORTOS = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
];

/* Charts globales */
let chartVentas = null;
let chartDinero = null;

/* Estado de navegación/filtrado */
let currentRankingYear = new Date().getFullYear();
let currentRankingMonth = new Date().getMonth(); // 0..11
let currentVentasYear = new Date().getFullYear();
let currentDineroYear = new Date().getFullYear();

let currentFiltroMes = null;       // null = ninguno; número 0..11 = mes aplicado por "Aplicar"
let currentFiltroRange = null;     // null o { from: mDesde, to: mHasta }

// =============================
// Mostrar / ocultar secciones
// =============================
function mostrarEstadisticas() {
  const animales = document.getElementById("animales");
  const resultados = document.getElementById("resultados");
  const estadisticas = document.getElementById("estadisticas");
  const menu = document.getElementById("menuPrincipal");
  if (animales) animales.style.display = "none";
  if (resultados) resultados.style.display = "none";
  if (menu) menu.style.display = "none";
  if (estadisticas) estadisticas.style.display = "block";

  cargarFiltros();

  currentRankingYear = new Date().getFullYear();
  currentRankingMonth = new Date().getMonth();
  currentVentasYear = currentRankingYear;
  currentDineroYear = currentRankingYear;
  currentFiltroMes = null;
  currentFiltroRange = null;

  actualizarRankingNavegacion();
  actualizarVentasNavegacion();
  actualizarDineroNavegacion();
}

function mostrarMenuPrincipal() {
  const animales = document.getElementById("animales");
  const resultados = document.getElementById("resultados");
  const estadisticas = document.getElementById("estadisticas");
  const menu = document.getElementById("menuPrincipal");
  if (estadisticas) estadisticas.style.display = "none";
  if (animales) animales.style.display = "none";
  if (resultados) resultados.style.display = "none";
  if (menu) menu.style.display = "block";
}

// =============================
// Cargar filtros (años / meses / rango)
// =============================
function cargarFiltros() {
  const selectAno = document.getElementById("filtroAno");
  const selectMes = document.getElementById("filtroMes");
  const selectDesde = document.getElementById("filtroMesDesde");
  const selectHasta = document.getElementById("filtroMesHasta");
  if (!selectAno || !selectMes) return;

  const gestiones = JSON.parse(localStorage.getItem("gestiones")) || [];
  const anosSet = new Set();
  gestiones.forEach(g => {
    const fecha = g && g.fecha ? new Date(g.fecha) : null;
    if (fecha && !isNaN(fecha)) anosSet.add(fecha.getFullYear());
  });

  let anos = Array.from(anosSet).sort((a,b) => b-a);
  if (anos.length === 0) {
    const ahora = new Date();
    anos = [ahora.getFullYear(), ahora.getFullYear()-1];
  }

  selectAno.innerHTML = anos.map(a => `<option value="${a}">${a}</option>`).join("");
  selectMes.innerHTML = `<option value="">Todos</option>` + MESES_CORTOS.map((m,i)=>`<option value="${i}">${m}</option>`).join("");

  if (selectDesde && selectHasta) {
    const options = MESES_CORTOS.map((m,i)=>`<option value="${i}">${m}</option>`).join("");
    selectDesde.innerHTML = `<option value="">Desde</option>` + options;
    selectHasta.innerHTML = `<option value="">Hasta</option>` + options;
  }

  const ahora = new Date().getFullYear();
  if (anos.includes(ahora)) selectAno.value = ahora;
}

// =============================
// Aplicar filtros / rango
// =============================
function aplicarFiltros() {
  const añoVal = document.getElementById("filtroAno")?.value;
  const mesVal = document.getElementById("filtroMes")?.value;

  const filtro = {
    año: añoVal ? parseInt(añoVal) : null,
    mes: (mesVal === "" || mesVal == null) ? null : parseInt(mesVal)
  };

  if (filtro.año) {
    currentVentasYear = filtro.año;
    currentRankingYear = filtro.año;
    currentDineroYear = filtro.año;
  }

  // Guardamos el mes y limpiamos rango (prioridad: mes simple)
  currentFiltroMes = (filtro.mes === null) ? null : filtro.mes;
  currentFiltroRange = null;

  if (typeof filtro.mes === "number") currentRankingMonth = filtro.mes;

  // Render
  renderGraficoVentas({ año: filtro.año, mes: filtro.mes });
  renderGraficoDinero({ año: filtro.año, mes: filtro.mes });
  renderRanking({ año: filtro.año || currentRankingYear, mes: filtro.mes === null ? null : currentRankingMonth });

  actualizarRankingNavegacion();
  actualizarVentasNavegacion();
  actualizarDineroNavegacion();
}

function aplicarRangoMeses() {
  const desdeVal = document.getElementById("filtroMesDesde")?.value;
  const hastaVal = document.getElementById("filtroMesHasta")?.value;
  const añoVal = document.getElementById("filtroAno")?.value;

  if (!desdeVal || !hastaVal) {
    alert("Seleccioná mes Desde y Hasta (ambos).");
    return;
  }
  const desde = parseInt(desdeVal);
  const hasta = parseInt(hastaVal);
  if (isNaN(desde) || isNaN(hasta) || desde > hasta) {
    alert("Rango inválido (Desde <= Hasta).");
    return;
  }

  currentFiltroRange = { from: desde, to: hasta };
  currentFiltroMes = null;

  if (añoVal) {
    currentVentasYear = parseInt(añoVal);
    currentDineroYear = parseInt(añoVal);
    currentRankingYear = parseInt(añoVal);
  }

  renderGraficoVentas({ año: currentVentasYear, range: currentFiltroRange });
  renderGraficoDinero({ año: currentDineroYear, range: currentFiltroRange });

  // ranking no cambia con rango (según lo hablado)
  actualizarRankingNavegacion();
  actualizarVentasNavegacion();
  actualizarDineroNavegacion();
}

// =============================
// Helpers ejes "nice"
// =============================
function niceAxisMax(maxVal) {
  if (!isFinite(maxVal) || maxVal <= 0) return 10;
  if (maxVal <= 10) return 10;
  const magnitude = Math.pow(10, Math.floor(Math.log10(maxVal)));
  const candidates = [1,2,5,10];
  for (let c of candidates) {
    const candidate = magnitude * c;
    if (candidate >= maxVal) return candidate;
  }
  return magnitude * 10;
}

// =============================
// Agrupar datos (ventas/dinero por mes) -> arrays length 12
// =============================
function agregarPorMesAnio(gestiones, filtro) {
  const ventasPorMes = new Array(12).fill(0);
  const dineroPorMes = new Array(12).fill(0);

  gestiones.forEach(g => {
    const fecha = g && g.fecha ? new Date(g.fecha) : null;
    if (!fecha || isNaN(fecha)) return;
    const anioG = fecha.getFullYear();
    const mesG = fecha.getMonth();

    if (filtro?.año && parseInt(filtro.año) !== anioG) return;

    const cantidad = safeParseNumber(g.totalCantidad);
    const monto = safeParseNumber(g.total);
    ventasPorMes[mesG] += cantidad;
    dineroPorMes[mesG] += monto;
  });

  return { ventasPorMes, dineroPorMes };
}

// =============================
// Render grafico de VENTAS
// - filtro: { año, mes, range }
// - si mes -> mantenemos 12 labels con 0 en otros meses (evita barra gigante)
// - si range -> mostramos solo los meses en el rango (slice) y sus valores
// =============================
function renderGraficoVentas(filtro = {}) {
  const gestiones = JSON.parse(localStorage.getItem("gestiones")) || [];
  const effectiveYear = filtro.año || currentVentasYear;
  const { ventasPorMes } = agregarPorMesAnio(gestiones, { año: effectiveYear });

  const range = filtro.range || currentFiltroRange || null;
  const mesFinal = (typeof filtro.mes === "number") ? filtro.mes : currentFiltroMes;

  let labels = MESES_CORTOS.slice();
  let data = ventasPorMes.slice();

  if (range && typeof range.from === "number" && typeof range.to === "number") {
    labels = [];
    data = [];
    for (let m = range.from; m <= range.to; m++) {
      labels.push(MESES_CORTOS[m]);
      data.push(ventasPorMes[m] || 0);
    }
  } else if (typeof mesFinal === "number") {
    // mantener 12 labels para que la barra del mes elegido mantenga tamaño normal
    data = data.map((val, i) => (i === mesFinal ? val : 0));
    labels = MESES_CORTOS.slice();
  }

  if (chartVentas) {
    try { chartVentas.destroy(); } catch (e) {}
    chartVentas = null;
  }

  const maxVentas = Math.max(...data);
  const niceMaxVentas = niceAxisMax(maxVentas);

  const ctx = document.getElementById("graficoVentas");
  if (!ctx || !window.Chart) {
    // actualizar resumen aunque no haya chart
    if (range) renderResumenVentas(ventasPorMes, effectiveYear, null, range);
    else renderResumenVentas(ventasPorMes, effectiveYear, mesFinal);
    return;
  }

  try {
    chartVentas = new Chart(ctx.getContext("2d"), {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: `Ventas (${effectiveYear || "todos"})`,
          data,
          backgroundColor: "#28a745",
          maxBarThickness: 48,
          barPercentage: 0.7,
          categoryPercentage: 0.7
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
        scales: {
          x: { ticks: { autoSkip: false } },
          y: {
            beginAtZero: true,
            suggestedMax: niceMaxVentas,
            ticks: { stepSize: Math.max(1, Math.round(niceMaxVentas / 5)) }
          }
        }
      }
    });
  } catch (err) {
    console.error("Error creando chartVentas:", err);
  }

  if (range) renderResumenVentas(ventasPorMes, effectiveYear, null, range);
  else renderResumenVentas(ventasPorMes, effectiveYear, mesFinal);
}

// =============================
// Render grafico de DINERO
// - filtro: { año, mes, range }
// - si mes -> mantenemos 12 puntos con 0 en otros meses (mantener forma)
// - si range -> slice
// =============================
function renderGraficoDinero(filtro = {}) {
  const gestiones = JSON.parse(localStorage.getItem("gestiones")) || [];
  const effectiveYear = filtro.año || currentDineroYear;
  const { dineroPorMes } = agregarPorMesAnio(gestiones, { año: effectiveYear });

  const range = filtro.range || currentFiltroRange || null;
  const mesFinal = (typeof filtro.mes === "number") ? filtro.mes : currentFiltroMes;

  let labels = MESES_CORTOS.slice();
  let data = dineroPorMes.slice();

  if (range && typeof range.from === "number" && typeof range.to === "number") {
    labels = [];
    data = [];
    for (let m = range.from; m <= range.to; m++) {
      labels.push(MESES_CORTOS[m]);
      data.push(dineroPorMes[m] || 0);
    }
  } else if (typeof mesFinal === "number") {
    data = data.map((val, i) => (i === mesFinal ? val : 0));
    labels = MESES_CORTOS.slice();
  }

  if (chartDinero) {
    try { chartDinero.destroy(); } catch (e) {}
    chartDinero = null;
  }

  const maxDinero = Math.max(...data);
  const niceMaxDinero = niceAxisMax(maxDinero);

  const ctx = document.getElementById("graficoDinero");
  if (!ctx || !window.Chart) {
    if (range) renderResumenDinero(dineroPorMes, effectiveYear, null, range);
    else renderResumenDinero(dineroPorMes, effectiveYear, mesFinal);
    return;
  }

  try {
    chartDinero = new Chart(ctx.getContext("2d"), {
      type: "line",
      data: {
        labels,
        datasets: [{
          label: `Ganancias ($) - ${effectiveYear || "todos"}`,
          data,
          borderColor: "#007bff",
          backgroundColor: "rgba(0,123,255,0.08)",
          fill: true,
          tension: 0.2,
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
        scales: {
          x: { ticks: { autoSkip: false } },
          y: {
            beginAtZero: true,
            suggestedMax: niceMaxDinero,
            ticks: {
              stepSize: Math.max(1, Math.round(niceMaxDinero / 5)),
              callback: val => (typeof val === 'number' ? val.toLocaleString('es-AR') : val)
            }
          }
        }
      }
    });
  } catch (err) {
    console.error("Error creando chartDinero:", err);
  }

  if (range) renderResumenDinero(dineroPorMes, effectiveYear, null, range);
  else renderResumenDinero(dineroPorMes, effectiveYear, mesFinal);
}

// =============================
// Resumen de ventas (debajo del gráfico)
// - soporta mes seleccionado y range
// =============================
function renderResumenVentas(ventasPorMesOrData, año, mesSeleccionado = null, range = null) {
  const resumenDiv = document.getElementById("resumenVentas");
  if (!resumenDiv) return;

  let arr;
  if (Array.isArray(ventasPorMesOrData) && ventasPorMesOrData.length === 12) arr = ventasPorMesOrData.slice();
  else arr = Array.isArray(ventasPorMesOrData) ? ventasPorMesOrData.slice() : [Number(ventasPorMesOrData) || 0];

  if (range && typeof range.from === "number" && typeof range.to === "number") {
    const meses = [];
    const vals = [];
    for (let m = range.from; m <= range.to; m++) {
      meses.push(MESES_CORTOS[m]);
      vals.push(arr[m] || 0);
    }
    const totalRango = vals.reduce((a,b)=>a+b,0);
    let html = `<div class="resumen-wrap" style="overflow:auto; padding:8px 6px;">`;
    html += `<div style="display:flex; gap:8px; white-space:nowrap; align-items:center;">`;
    meses.forEach(mn => html += `<div style="min-width:90px; text-align:center; padding:6px; background:#fafafa; border-radius:6px; border:1px solid #eee;">${mn}</div>`);
    html += `</div>`;
    html += `<div style="display:flex; gap:8px; margin-top:6px; white-space:nowrap; align-items:center;">`;
    vals.forEach(v => html += `<div style="min-width:90px; text-align:center; padding:8px; font-weight:700; background:#fff; border-radius:6px; border:1px solid #eee;">${v}</div>`);
    html += `</div>`;
    html += `<div style="margin-top:8px; font-weight:700;">Total (${año || ''}) del rango: ${totalRango.toLocaleString('es-AR')}</div>`;
    html += `</div>`;
    resumenDiv.innerHTML = html;
    return;
  }

  if (typeof mesSeleccionado === "number") {
    const val = (Array.isArray(arr) && arr.length === 12) ? arr[mesSeleccionado] : (arr[0] || 0);
    resumenDiv.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:6px;">
        <div style="font-weight:700; text-align:center;">${MESES_CORTOS[mesSeleccionado]}</div>
        <div style="font-size:20px; font-weight:700; text-align:center;">${val.toLocaleString('es-AR')}</div>
        <div style="margin-top:6px; font-weight:700;">Total ${año || ''}: ${val.toLocaleString('es-AR')}</div>
      </div>
    `;
    return;
  }

  const ventasPorMes = (arr.length === 12) ? arr : (function() {
    const out = new Array(12).fill(0);
    for (let i = 0; i < Math.min(arr.length,12); i++) out[i] = arr[i];
    return out;
  })();

  const totalAno = ventasPorMes.reduce((a,b) => a + b, 0);
  if (ventasPorMes.every(v => v === 0)) {
    resumenDiv.innerHTML = `<div style="padding:10px;color:#555;">No hay ventas registradas para ${año || 'el rango seleccionado'}.</div>`;
    return;
  }

  let html = `<div class="resumen-wrap" style="overflow:auto; padding:8px 6px;">`;
  html += `<div style="display:flex; gap:8px; white-space:nowrap; align-items:center;">`;
  for (let i = 0; i < 12; i++) {
    html += `<div style="min-width:90px; text-align:center; padding:6px; background:#fafafa; border-radius:6px; border:1px solid #eee;">${MESES_CORTOS[i]}</div>`;
  }
  html += `</div>`;

  html += `<div style="display:flex; gap:8px; margin-top:6px; white-space:nowrap; align-items:center;">`;
  for (let i = 0; i < 12; i++) {
    html += `<div style="min-width:90px; text-align:center; padding:8px; font-weight:700; background:#fff; border-radius:6px; border:1px solid #eee;">${ventasPorMes[i]}</div>`;
  }
  html += `</div>`;

  html += `<div style="margin-top:8px; font-weight:700;">Total ${año || ''}: ${totalAno.toLocaleString('es-AR')}</div>`;
  html += `</div>`;
  resumenDiv.innerHTML = html;
}

// =============================
// Resumen de dinero (debajo del gráfico)
// =============================
function renderResumenDinero(dineroPorMesOrData, año, mesSeleccionado = null, range = null) {
  const resumenDiv = document.getElementById("resumenDinero") || document.getElementById("dineroSeparador");
  if (!resumenDiv) return;

  let arr;
  if (Array.isArray(dineroPorMesOrData) && dineroPorMesOrData.length === 12) arr = dineroPorMesOrData.slice();
  else arr = Array.isArray(dineroPorMesOrData) ? dineroPorMesOrData.slice() : [Number(dineroPorMesOrData) || 0];

  if (range && typeof range.from === "number" && typeof range.to === "number") {
    const meses = [];
    const vals = [];
    for (let m = range.from; m <= range.to; m++) {
      meses.push(MESES_CORTOS[m]);
      vals.push(arr[m] || 0);
    }
    const totalRango = vals.reduce((a,b)=>a+b,0);
    let html = `<div class="resumen-wrap" style="overflow:auto; padding:8px 6px;">`;
    html += `<div style="display:flex; gap:8px; white-space:nowrap; align-items:center;">`;
    meses.forEach(mn => html += `<div style="min-width:90px; text-align:center; padding:6px; background:#fafafa; border-radius:6px; border:1px solid #eee;">${mn}</div>`);
    html += `</div>`;
    html += `<div style="display:flex; gap:8px; margin-top:6px; white-space:nowrap; align-items:center;">`;
    vals.forEach(v => html += `<div style="min-width:90px; text-align:center; padding:8px; font-weight:700; background:#fff; border-radius:6px; border:1px solid #eee;">$ ${Number(v).toLocaleString('es-AR')}</div>`);
    html += `</div>`;
    html += `<div style="margin-top:8px; font-weight:700;">Total (${año || ''}) del rango: $ ${Number(totalRango).toLocaleString('es-AR')}</div>`;
    html += `</div>`;
    resumenDiv.innerHTML = html;
    return;
  }

  if (typeof mesSeleccionado === "number") {
    const val = (Array.isArray(arr) && arr.length === 12) ? arr[mesSeleccionado] : (arr[0] || 0);
    resumenDiv.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:6px;">
        <div style="font-weight:700; text-align:center;">${MESES_CORTOS[mesSeleccionado]}</div>
        <div style="font-size:20px; font-weight:700; text-align:center;">$ ${Number(val).toLocaleString('es-AR')}</div>
        <div style="margin-top:6px; font-weight:700;">Total ${año || ''}: $ ${Number(val).toLocaleString('es-AR')}</div>
      </div>
    `;
    return;
  }

  const dineroPorMes = (arr.length === 12) ? arr : (function() {
    const out = new Array(12).fill(0);
    for (let i = 0; i < Math.min(arr.length,12); i++) out[i] = arr[i];
    return out;
  })();

  const totalAno = dineroPorMes.reduce((a,b) => a + b, 0);
  if (dineroPorMes.every(v => v === 0)) {
    resumenDiv.innerHTML = `<div style="padding:10px;color:#555;">No hay ingresos registrados para ${año || 'el rango seleccionado'}.</div>`;
    return;
  }

  let html = `<div class="resumen-wrap" style="overflow:auto; padding:8px 6px;">`;
  html += `<div style="display:flex; gap:8px; white-space:nowrap; align-items:center;">`;
  for (let i = 0; i < 12; i++) {
    html += `<div style="min-width:90px; text-align:center; padding:6px; background:#fafafa; border-radius:6px; border:1px solid #eee;">${MESES_CORTOS[i]}</div>`;
  }
  html += `</div>`;

  html += `<div style="display:flex; gap:8px; margin-top:6px; white-space:nowrap; align-items:center;">`;
  for (let i = 0; i < 12; i++) {
    html += `<div style="min-width:90px; text-align:center; padding:8px; font-weight:700; background:#fff; border-radius:6px; border:1px solid #eee;">$ ${Number(dineroPorMes[i]).toLocaleString('es-AR')}</div>`;
  }
  html += `</div>`;

  html += `<div style="margin-top:8px; font-weight:700;">Total ${año || ''}: $ ${Number(totalAno).toLocaleString('es-AR')}</div>`;
  html += `</div>`;
  resumenDiv.innerHTML = html;
}

// -----------------------------
// Funciones nuevas / reemplazo
// -----------------------------

/**
 * calcularTopAnimales(gestiones, filtro)
 * Devuelve un array con los 5 tipos fijos y su cantidad total (según filtro año/mes).
 * Resultado: [{ nombre: "Toros Angus", cantidad: 10 }, ...] ordenado desc por cantidad.
 */
function calcularTopAnimales(gestiones, filtro = {}) {
  const categorias = {
    "Toros Angus": 0,
    "Toros Hereford": 0,
    "Vaquillonas Angus": 0,
    "Vaquillonas Hereford": 0,
    "Caballos": 0
  };

  (gestiones || []).forEach(g => {
    const fecha = g && g.fecha ? new Date(g.fecha) : null;
    if (!fecha || isNaN(fecha)) return;
    const anioG = fecha.getFullYear();
    const mesG = fecha.getMonth();

    if (filtro?.año && parseInt(filtro.año) !== anioG) return;
    if (typeof filtro?.mes === "number" && filtro.mes !== mesG) return;

    (g.detalle || []).forEach(d => {
      const cat = (d.categoria || "").toString().toLowerCase();
      const cantidad = parseInt(d.cantidad) || 0;

      if (cat.includes("toro") && cat.includes("angus")) categorias["Toros Angus"] += cantidad;
      else if (cat.includes("toro") && cat.includes("hereford")) categorias["Toros Hereford"] += cantidad;
      else if (cat.includes("vaquillona") && cat.includes("angus")) categorias["Vaquillonas Angus"] += cantidad;
      else if (cat.includes("vaquillona") && cat.includes("hereford")) categorias["Vaquillonas Hereford"] += cantidad;
      else if (cat.includes("caballo")) categorias["Caballos"] += cantidad;
      // NO agregamos "Otros" — pediste solo los 5 fijos.
    });
  });

  // Convertir a array y ordenar desc
  const arr = Object.keys(categorias).map(k => ({ nombre: k, cantidad: categorias[k] }));
  arr.sort((a,b) => b.cantidad - a.cantidad || a.nombre.localeCompare(b.nombre));
  return arr;
}

/**
 * renderTopAnimales(gestiones, filtro)
 * Inserta los datos en la tabla #tablaAnimalesMasVendidos (tbody).
 */
function renderTopAnimales(gestiones, filtro = {}) {
  const tabla = document.querySelector("#tablaAnimalesMasVendidos tbody");
  if (!tabla) return;

  const arr = calcularTopAnimales(gestiones, filtro);

  // Si todas las cantidades son 0 -> mostrar mensaje
  const totalAll = arr.reduce((s,i) => s + i.cantidad, 0);
  if (!totalAll) {
    tabla.innerHTML = `<tr><td colspan="3">No hay datos aún.</td></tr>`;
    return;
  }

  let html = "";
  arr.forEach((it, idx) => {
    html += `
      <tr>
        <td>${idx+1}</td>
        <td>${it.nombre}</td>
        <td>${it.cantidad}</td>
      </tr>
    `;
  });

  tabla.innerHTML = html;
}

// =============================
// Renderizado del ranking (agrupa por comprador)
// =============================
function renderRanking(filtro = {}) {
  const gestiones = JSON.parse(localStorage.getItem("gestiones")) || [];
  const mapa = new Map();

  const categoriasClave = [
    "Toros Angus","Toros Hereford","Vaquillonas Angus","Vaquillonas Hereford","Caballos"
  ];

  gestiones.forEach(g => {
    const fecha = g && g.fecha ? new Date(g.fecha) : null;
    if (!fecha || isNaN(fecha)) return;
    const anioG = fecha.getFullYear();
    const mesG = fecha.getMonth();

    if (filtro?.año && parseInt(filtro.año) !== anioG) return;
    if (typeof filtro?.mes === "number" && filtro.mes !== mesG) return;

    (g.detalle || []).forEach(d => {
      const buyer = (d.comprador || "sin nombre").toString().trim() || "sin nombre";
      const row = mapa.get(buyer) || { totalAnimals:0, totalMoney:0, categories: {} };
      const cat = (d.categoria || "").toString().toLowerCase();
      const cantidad = parseInt(d.cantidad) || 0;
      const importe = safeParseNumber(d.importe);

      row.totalAnimals += cantidad;
      row.totalMoney += importe;

      let hit = null;
      if (cat.includes("toro") && cat.includes("angus")) hit = "Toros Angus";
      else if (cat.includes("toro") && cat.includes("hereford")) hit = "Toros Hereford";
      else if (cat.includes("vaquillona") && cat.includes("angus")) hit = "Vaquillonas Angus";
      else if (cat.includes("vaquillona") && cat.includes("hereford")) hit = "Vaquillonas Hereford";
      else if (cat.includes("caballo")) hit = "Caballos";

      const catName = hit || null; // si no matchea, ignoramos (no sumamos "Otros")
      if (catName) row.categories[catName] = (row.categories[catName] || 0) + cantidad;

      mapa.set(buyer, row);
    });
  });

  const arrayRanking = Array.from(mapa.entries())
    .map(([comprador, data]) => ({ comprador, ...data }))
    .sort((a,b) => b.totalAnimals - a.totalAnimals || b.totalMoney - a.totalMoney);

  const tbody = document.querySelector("#tablaRanking tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  if (arrayRanking.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9">No hay datos para el rango seleccionado.</td></tr>`;
  } else {
    arrayRanking.forEach((r, idx) => {
      const cells = categoriasClave.map(cat => `<td>${(r.categories[cat] || 0)}</td>`).join("");
      const rowHtml = `
        <tr>
          <td>${idx+1}</td>
          <td>${r.comprador}</td>
          ${cells}
          <td>${r.totalAnimals}</td>
          <td>$ ${Number(r.totalMoney).toLocaleString("es-AR")}</td>
        </tr>
      `;
      tbody.insertAdjacentHTML("beforeend", rowHtml);
    });
  }

  // --- Actualizar tabla "Animales más vendidos" con el mismo filtro usado para el ranking ---
  const filtroParaTop = {
    año: filtro.año || currentRankingYear,
    mes: (typeof filtro.mes === 'number') ? filtro.mes : currentRankingMonth
  };
  renderTopAnimales(gestiones, filtroParaTop);
}

// =============================
// Navegación del Ranking (mes a mes)
// =============================
function actualizarRankingNavegacion() {
  const titulo = document.getElementById("rankingTitulo");
  if (titulo) titulo.textContent = `🏆 Ranking ${MESES_CORTOS[currentRankingMonth]} ${currentRankingYear}`;
  renderRanking({ año: currentRankingYear, mes: currentRankingMonth });
}

function inicializarRankingNav() {
  const prevBtn = document.getElementById("rankingPrev");
  const nextBtn = document.getElementById("rankingNext");
  if (prevBtn) prevBtn.addEventListener("click", () => {
    currentRankingMonth--;
    if (currentRankingMonth < 0) { currentRankingMonth = 11; currentRankingYear--; }
    actualizarRankingNavegacion();
  });
  if (nextBtn) nextBtn.addEventListener("click", () => {
    currentRankingMonth++;
    if (currentRankingMonth > 11) { currentRankingMonth = 0; currentRankingYear++; }
    actualizarRankingNavegacion();
  });
}

// =============================
// Navegación de Ventas (año a año) - independiente
// =============================
function actualizarVentasNavegacion() {
  const ventasTitulo = document.getElementById("ventasTitulo");
  if (ventasTitulo) ventasTitulo.textContent = `📊 Ventas por Mes y Año - ${currentVentasYear}`;
  renderGraficoVentas({ año: currentVentasYear, mes: currentFiltroMes, range: currentFiltroRange });
}

function inicializarVentasNav() {
  const prevBtn = document.getElementById("ventasPrev");
  const nextBtn = document.getElementById("ventasNext");
  if (prevBtn) prevBtn.addEventListener("click", () => {
    currentVentasYear--;
    actualizarVentasNavegacion();
  });
  if (nextBtn) nextBtn.addEventListener("click", () => {
    currentVentasYear++;
    actualizarVentasNavegacion();
  });
}

// =============================
// Navegación de Dinero (año a año) - independiente
// =============================
function actualizarDineroNavegacion() {
  const dineroTitulo = document.getElementById("dineroTitulo");
  if (dineroTitulo) dineroTitulo.textContent = `💰 Dinero Acumulado - ${currentDineroYear}`;
  renderGraficoDinero({ año: currentDineroYear, mes: currentFiltroMes, range: currentFiltroRange });
}

function inicializarDineroNav() {
  const prevBtn = document.getElementById("dineroPrev");
  const nextBtn = document.getElementById("dineroNext");
  if (prevBtn) prevBtn.addEventListener("click", () => {
    currentDineroYear--;
    actualizarDineroNavegacion();
  });
  if (nextBtn) nextBtn.addEventListener("click", () => {
    currentDineroYear++;
    actualizarDineroNavegacion();
  });
}
// =============================
// INICIALIZACIÓN GLOBAL LIMPIA
// =============================
document.addEventListener("DOMContentLoaded", () => {
  console.log("[estadisticas] iniciado");

  const btnAplicar = document.getElementById("btnAplicar");
  const btnRango = document.getElementById("btnAplicarRango");
  const volverBtn = document.getElementById("volverMenuEstadisticas");

  if (btnAplicar) btnAplicar.addEventListener("click", aplicarFiltros);
  if (btnRango) btnRango.addEventListener("click", aplicarRangoMeses);
  if (volverBtn) volverBtn.addEventListener("click", mostrarMenuPrincipal);

  if (typeof cargarFiltros === "function") cargarFiltros();

  currentRankingYear = new Date().getFullYear();
  currentRankingMonth = new Date().getMonth();

  if (typeof inicializarRankingNav === "function") inicializarRankingNav();
  if (typeof inicializarVentasNav === "function") inicializarVentasNav();
  if (typeof inicializarDineroNav === "function") inicializarDineroNav();

  console.log("[estadisticas] listo ✅");
});

// =============================
// RECARGA GENERAL
// =============================
function recargarTodo() {
  if (typeof renderTablaResultados === "function") renderTablaResultados();

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

// =============================
// Recargar Todo
// =============================
function recargarTodo() {
  // Resultados
  if (typeof renderTablaResultados === "function") {
    renderTablaResultados();
  }

  // Estadísticas
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

