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
  // ⚡ MOVER AQUÍ: agregar tabla solo cuando se abre la sección
    const tablaResultados = localStorage.getItem("tablaResultadosParaReportes");
    if (tablaResultados) {
      console.log("🟢 Cargando tabla de resultados en reportes...");
      agregarReporte(tablaResultados, "tabla");
      localStorage.removeItem("tablaResultadosParaReportes");
    }

    // Aseguramos que se carguen los reportes previos
    cargarReportesGuardados();
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
  

  // ⚠ Estadísticas desde estadisticas.js ya NO se agregan automáticamente
});


// =============================
// FUNCIONES DE HOJAS Y REPORTES
// =============================
function agregarReporte(contenidoHTML, tipo = "general") {
  console.debug("reportes.js: agregarReporte llamado, tipo=", tipo, "len=", (contenidoHTML||"").length);

  // Asegurar wrapper
  let wrap = document.querySelector(".reportes-hoja-wrap");
  const reportesRoot = document.getElementById("reportes");
  if (!wrap) {
    wrap = document.createElement("div");
    wrap.className = "reportes-hoja-wrap";
    if (reportesRoot) reportesRoot.insertBefore(wrap, reportesRoot.firstChild);
    else document.body.appendChild(wrap);
    console.warn("reportes.js: .reportes-hoja-wrap no existía y fue creado");
  }

  // Buscar hoja actual o crearla
  let hojaActual = wrap.querySelector(".reportes-hoja:last-child");
  if (!hojaActual) {
    hojaActual = crearNuevaHoja();
    wrap.appendChild(hojaActual);
  }

  // Determinar contenedor destino, crearlo si no existe
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

  if (!contenedorDestino) {
    contenedorDestino = document.createElement("div");
    contenedorDestino.className = tipo === "tabla" ? "reportes-tabla" : (tipo === "gestiones" ? "reportes-gestiones" : "reportes-estadisticas");
    hojaActual.appendChild(contenedorDestino);
    console.warn("reportes.js: contenedorDestino creado dinámicamente:", contenedorDestino.className);
  }

  if (contenidoHTML && contenidoHTML.trim()) {
    contenedorDestino.innerHTML += contenidoHTML;
  } else {
    console.warn("reportes.js: contenidoHTML vacío, no se agregó nada");
  }

  // Asegurar el orden fijo y guardar
  reordenarBloques(hojaActual);
  guardarReportes();
}

// Exportar explícito por si otro script busca window.agregarReporte
window.agregarReporte = agregarReporte;

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
// =============================
// REPARTIR GESTIONES EN HOJAS (robusto, preserva cuadro de resultados)
// Reemplazar la función antigua por esta versión
// =============================
function repartirGestionesEnHojas() {
  const hojaWrap = document.querySelector(".reportes-hoja-wrap");
  if (!hojaWrap) return;

  // 1) Limpiar hojas vacías antiguas
  if (typeof limpiarHojasVacias === "function") limpiarHojasVacias();

  // 2) Recolectar todas las gestiones existentes (de todas las hojas)
  const todasGestiones = [];
  document.querySelectorAll(".reportes-gestiones").forEach(cont => {
    Array.from(cont.children).forEach(child => {
      if (child.nodeType === 1 && child.innerText.trim()) {
        todasGestiones.push(child);
      }
    });
  });

  // Si no hay gestiones, nada que repartir
  if (!todasGestiones.length) {
    // Asegurarse que exista al menos una hoja con estructura
    let primera = hojaWrap.querySelector(".reportes-hoja");
    if (!primera) {
      primera = crearNuevaHoja();
      hojaWrap.appendChild(primera);
    }
    return;
  }

  // 3) Asegurarnos de tener una primer hoja limpia con su .reportes-tabla y .reportes-gestiones
  // Eliminamos TODAS las hojas y creamos la primera limpia (evita residuos de estados anteriores)
  while (hojaWrap.firstChild) hojaWrap.removeChild(hojaWrap.firstChild);
  const primeraHoja = crearNuevaHoja();
  hojaWrap.appendChild(primeraHoja);

  const contTabla = primeraHoja.querySelector(".reportes-tabla");
  let contGestionesActual = primeraHoja.querySelector(".reportes-gestiones");
  if (!contGestionesActual) {
    contGestionesActual = document.createElement("div");
    contGestionesActual.className = "reportes-gestiones";
    primeraHoja.appendChild(contGestionesActual);
  }

  // 4) Medidor oculto para calcular alturas reales (no visible)
  const medidor = document.createElement("div");
  medidor.style.visibility = "hidden";
  medidor.style.position = "absolute";
  medidor.style.left = "-9999px";
  medidor.style.top = "0";
  medidor.style.width = `${primeraHoja.offsetWidth}px`;
  document.body.appendChild(medidor);

  // Estimación de espacio útil: altura interior aproximada de la hoja
  // (usamos getBoundingClientRect para medición robusta)
  function alturaUtilHoja(hoja) {
    const rect = hoja.getBoundingClientRect();
    const style = getComputedStyle(hoja);
    const paddingTop = parseFloat(style.paddingTop || 0);
    const paddingBottom = parseFloat(style.paddingBottom || 0);
    // dejamos margen de seguridad (10%)
    return rect.height - paddingTop - paddingBottom;
  }

  const espacioMax = alturaUtilHoja(primeraHoja) * 0.95;
  let alturaAcumulada = contGestionesActual.scrollHeight;

  // 5) Insertar cada gestión en la primer hoja posible sin tocar la tabla (la tabla queda en .reportes-tabla)
  for (const item of todasGestiones) {
    // medir altura del item con el medidor
    const clone = item.cloneNode(true);
    medidor.appendChild(clone);
    // forzar reflow
    const altura = clone.getBoundingClientRect().height || clone.offsetHeight || 0;
    medidor.innerHTML = "";

    if (alturaAcumulada + altura > espacioMax) {
      // no entra: crear hoja nueva y colocar la gestión ahí
      const nueva = crearNuevaHoja();
      hojaWrap.appendChild(nueva);
      const nuevoCont = nueva.querySelector(".reportes-gestiones");
      if (!nuevoCont) {
        const divG = document.createElement("div");
        divG.className = "reportes-gestiones";
        nueva.appendChild(divG);
        divG.appendChild(item);
      } else {
        nuevoCont.appendChild(item);
      }
      // actualizar hoja actual y acumulado
      alturaAcumulada = item.getBoundingClientRect().height || item.offsetHeight || 0;
    } else {
      // entra en la hoja actual
      contGestionesActual.appendChild(item);
      alturaAcumulada += altura;
    }
  }

  // 6) limpieza del medidor y de hojas vacías
  if (document.body.contains(medidor)) document.body.removeChild(medidor);
  if (typeof limpiarHojasVacias === "function") limpiarHojasVacias();

  // 7) Garantizar que la tabla de resultados esté visible en la PRIMERA hoja
  // Si la tabla fue guardada en localStorage (fallback) o pasada por agregarReporte,
  // se asegura su presencia en la .reportes-tabla de la primera hoja.
  const primera = hojaWrap.querySelector(".reportes-hoja");
  if (primera) {
    const tablaDestino = primera.querySelector(".reportes-tabla");
    // si existe tabla guardada en localStorage temporal (tu fallback), insertarla aquí
    const tablaGuardada = localStorage.getItem("tablaResultadosParaReportes");
    if (tablaGuardada && tablaDestino && !tablaDestino.querySelector("table")) {
      tablaDestino.innerHTML = tablaGuardada;
      // limpiar localStorage (si querés mantener, comentalo)
      localStorage.removeItem("tablaResultadosParaReportes");
    }
    // Asegurar visibilidad y llevar al usuario a la hoja (para que "veas" el cuadro)
    primera.style.display = "block";
    primera.style.opacity = "1";
    try { primera.scrollIntoView({ behavior: "smooth", block: "start" }); } catch(e) {}
  }
}


// =============================
// EXPORTAR A PDF (robusto, corta correctamente el contenido largo)
// =============================
const btnExportPdf = document.getElementById("btnExportPdf");
if (btnExportPdf) {
  btnExportPdf.addEventListener("click", async () => {
    if (typeof limpiarHojasVacias === "function") limpiarHojasVacias();
    await generarPDFporHojas();
  });
}

async function generarPDFporHojas() {
  const jsPDF = window.jspdf?.jsPDF;
  if (!jsPDF) {
    alert("Error: jsPDF no está disponible. Verifica que el script está cargado.");
    return;
  }

  const hojaWrap = document.querySelector(".reportes-hoja-wrap");
  if (!hojaWrap) {
    alert("No se encontró el contenedor principal de reportes (.reportes-hoja-wrap).");
    return;
  }

  // Forzamos ancho A4 antes de renderizar para evitar recortes laterales
  hojaWrap.style.maxWidth = "210mm";
  hojaWrap.style.boxSizing = "border-box";

  // Parámetros PDF / márgenes (mm)
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const margenSup = 12;
  const margenInf = 12;
  const margenIzq = 12;
  const margenDer = 12;
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const anchoUtilMM = pdfWidth - margenIzq - margenDer;
  const altoUtilMM = pdfHeight - margenSup - margenInf;

  // render scale (calidad)
  const RENDER_SCALE = 2;

  // Convierte mm útiles a px según el canvas que vamos a obtener (se calculará por hoja)
  const hojas = Array.from(hojaWrap.querySelectorAll(".reportes-hoja"))
    .filter(h => h && h.offsetParent !== null);

  if (!hojas.length) {
    alert("No hay hojas visibles para exportar.");
    return;
  }

  for (let idx = 0; idx < hojas.length; idx++) {
    const hoja = hojas[idx];

    // 1) Renderizamos la hoja entera con html2canvas
    const canvas = await html2canvas(hoja, {
      scale: RENDER_SCALE,
      useCORS: true,
      backgroundColor: "#ffffff",
      scrollX: 0,
      scrollY: 0,
      windowWidth: document.documentElement.scrollWidth,
      windowHeight: hoja.scrollHeight
    });

    const canvasW = canvas.width;
    const canvasH = canvas.height;

    // px por mm según ancho útil
    const pxPerMM = canvasW / anchoUtilMM;
    const altoUtilPx = Math.floor(altoUtilMM * pxPerMM);

    // 2) calculamos posiciones de corte "seguras" (no cortar dentro de un .reportes-gestiones > elemento)
    // tomamos todos los elementos hijos relevantes (tabla y cada item de gestiones)
    const safePositions = [0]; // comienza en 0
    // elementos que NO queremos cortar: cada hijo directo de .reportes-gestiones y .reportes-tabla
    const tabla = hoja.querySelector(".reportes-tabla");
    if (tabla) {
      const r = tabla.getBoundingClientRect();
      const topRel = Math.round((tabla.offsetTop / hoja.scrollHeight) * canvasH);
      safePositions.push(topRel);
    }
    const gestionesCont = hoja.querySelectorAll(".reportes-gestiones > *");
    gestionesCont.forEach(el => {
      if (!(el instanceof HTMLElement)) return;
      const topPx = Math.round(el.offsetTop * (canvasH / hoja.scrollHeight));
      safePositions.push(topPx);
      // también añadimos final del elemento como candidate (para cortar después de éste)
      const bottomPx = Math.round((el.offsetTop + el.offsetHeight) * (canvasH / hoja.scrollHeight));
      safePositions.push(bottomPx);
    });

    // añadimos el final del canvas
    safePositions.push(canvasH);

    // === NUEVO BLOQUE: detectar tablas grandes y forzar salto entre ellas ===
const tablas = hoja.querySelectorAll(".reportes-tabla table");
if (tablas.length > 1) {
  tablas.forEach(tabla => {
    const rect = tabla.getBoundingClientRect();
    const topPx = Math.round(tabla.offsetTop * (canvasH / hoja.scrollHeight));
    const bottomPx = Math.round((tabla.offsetTop + tabla.offsetHeight) * (canvasH / hoja.scrollHeight));
    
    // Si la tabla mide más de una hoja, marcamos su parte superior y final
    if (bottomPx - topPx > altoUtilPx) {
      safePositions.push(topPx);
      safePositions.push(bottomPx);
    } else {
      // Si la tabla es más chica, forzamos salto antes de la siguiente
      safePositions.push(bottomPx + 20); // deja un margen entre tablas
    }
  });
}

    // normalizar y ordenar posiciones únicas
    const uniq = Array.from(new Set(safePositions)).sort((a,b)=>a-b);

    // 3) Crear cortes basados en safePositions respetando altoUtilPx
    const slices = [];
    let currentStart = 0;
    for (let i = 1; i < uniq.length; i++) {
      const candidate = uniq[i];
      // si el candidato supera el tamaño de página desde currentStart, lo usamos como corte (o el ultimo que quede < limite)
      if (candidate - currentStart > altoUtilPx) {
        // buscamos el corte más cercano antes del límite (retrocedemos en uniq para no cortar dentro)
        let j = i - 1;
        while (j > 0 && uniq[j] - currentStart > altoUtilPx) j--;
        const cut = (uniq[j] === currentStart) ? currentStart + altoUtilPx : uniq[j];
        // si cut == currentStart (no avanzamos), forzamos un corte en altoUtilPx
        const safeCut = (cut === currentStart) ? Math.min(canvasH, currentStart + altoUtilPx) : cut;
        slices.push({ top: currentStart, height: safeCut - currentStart });
        currentStart = safeCut;
      }
    }
    // resto final
    if (currentStart < canvasH) slices.push({ top: currentStart, height: canvasH - currentStart });

    // 4) Dibujar cada slice en tempCanvas y agregar al PDF
    const tempCanvas = document.createElement("canvas");
    const tctx = tempCanvas.getContext("2d");
    tempCanvas.width = canvasW;

    for (let s = 0; s < slices.length; s++) {
      const top = Math.max(0, Math.floor(slices[s].top));
      const h = Math.max(1, Math.floor(slices[s].height));
      tempCanvas.height = h;
      tctx.clearRect(0, 0, canvasW, h);
      tctx.drawImage(canvas, 0, top, canvasW, h, 0, 0, canvasW, h);

      const imgData = tempCanvas.toDataURL("image/jpeg", 0.95);
      const renderHeightMM = h / pxPerMM;

      // agregamos página al PDF y posicionamos respetando márgenes
      if (idx > 0 || s > 0) pdf.addPage();
      pdf.addImage(imgData, "JPEG", margenIzq, margenSup, anchoUtilMM, renderHeightMM);
    }

    // allow GC
  }

  // 5) guardar
  pdf.save("Reportes_Sistema.pdf");

  // limpiamos el estilo que forzamos
  hojaWrap.style.maxWidth = "";
}

// === Mini Word - Guardado temporal ===
const reportesHoja = document.getElementById('reportesHoja');
if (reportesHoja) {
  // Guardar automáticamente el contenido
  reportesHoja.addEventListener('input', () => {
    localStorage.setItem('contenidoReporte', reportesHoja.innerHTML);
  });

  // Restaurar al cargar la página
  window.addEventListener('load', () => {
    const guardado = localStorage.getItem('contenidoReporte');
    if (guardado) reportesHoja.innerHTML = guardado;
  });
}

// =============================
// DETECTAR Y PRESERVAR TEXTO/TÍTULO MANUAL
// =============================

function guardarTextoManual() {
  const hoja = document.querySelector(".reportes-hoja");
  if (!hoja) return;

  // Solo tomamos texto que esté ANTES de la tabla
  const bloques = Array.from(hoja.childNodes);
  let textoManual = "";

  for (const nodo of bloques) {
    if (nodo.classList && nodo.classList.contains("reportes-tabla")) break;
    if (nodo.nodeType === Node.ELEMENT_NODE || nodo.nodeType === Node.TEXT_NODE) {
      textoManual += nodo.outerHTML || nodo.textContent;
    }
  }

  if (textoManual.trim()) {
    localStorage.setItem("textoManualReporte", textoManual);
  }
}

function restaurarTextoManual() {
  const hoja = document.querySelector(".reportes-hoja");
  if (!hoja) return;

  const textoManual = localStorage.getItem("textoManualReporte");
  if (!textoManual) return;

  const tabla = hoja.querySelector(".reportes-tabla");
  if (!tabla) return;

  // Si el texto ya está presente, no duplicar
  if (hoja.innerHTML.includes(textoManual.trim())) return;

  // Insertamos el texto antes de la tabla
  const contenedor = document.createElement("div");
  contenedor.innerHTML = textoManual;
  hoja.insertBefore(contenedor, tabla);
}

// Guardar texto manual cuando el usuario escriba
document.addEventListener("input", (e) => {
  if (e.target.closest(".reportes-hoja")) guardarTextoManual();
});

// Restaurar texto al cargar o reordenar
window.addEventListener("load", restaurarTextoManual);



