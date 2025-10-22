// =============================
// CAMBIO DE VISTAS
// =============================

function mostrarAnimales() {
  document.getElementById("menuPrincipal").style.display = "none";
  document.getElementById("animales").style.display = "block";
}

// =============================
// VARIABLES GLOBALES
// =============================

let gestiones = JSON.parse(localStorage.getItem("gestiones")) || [];
let idGestionEditando = null; // para saber si estoy editando una gestión

// =============================
// FORMATEAR FECHA
// =============================

function formatFecha(fechaStored) {
  const d = new Date(fechaStored);
  if (!isNaN(d)) {
    return d.toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    });
  }
  return String(fechaStored);
}

// =============================
// FUNCIONES DE TABLA (DETALLE)
// =============================

// Actualizar totales de la tabla
function actualizarTotales() {
  const tableBody = document.querySelector("#animalesTable tbody");
  let total = 0;
  let totalCantidad = 0;
  let totalKg = 0;

  Array.from(tableBody.rows).forEach(row => {
    const cantidad = parseInt(row.cells[4].textContent) || 0;
    const importe = parseFloat(row.cells[7].textContent.replace("$","").replace(/\./g,"")) || 0;
    const impKg = parseFloat(row.cells[8].textContent) || 0;

    total += importe;
    totalCantidad += cantidad;
    totalKg += impKg;
  });

  const promedio = totalCantidad ? total / totalCantidad : 0;
  const promedioKg = totalCantidad ? totalKg / totalCantidad : 0;

  document.getElementById("total").textContent = `$ ${total.toLocaleString("es-AR")}`;
  document.getElementById("promedio").textContent = `$ ${promedio.toLocaleString("es-AR")}`;
  document.getElementById("totalCantidad").textContent = totalCantidad;
  document.getElementById("totalKg").textContent = totalKg.toLocaleString("es-AR");
  document.getElementById("promedioKg").textContent = promedioKg.toLocaleString("es-AR");
}

// NUEVO: Editar fila individual
window.editarFila = function(btn) {
  const fila = btn.parentElement.parentElement;
  const celdas = fila.children;
  document.getElementById("comprador").value = celdas[0].textContent;
  document.getElementById("categoria").value = celdas[1].textContent;
  document.getElementById("codigoCategoria").value = celdas[2].textContent;
  document.getElementById("corral").value = celdas[3].textContent;
  document.getElementById("cantidad").value = celdas[4].textContent;
  document.getElementById("caravana").value = celdas[5].textContent;
  document.getElementById("precio").value = parseFloat(celdas[6].textContent.replace("$","").replace(/\./g,"")) || 0;
  document.getElementById("impKg").value = parseFloat(celdas[8].textContent) || 0;
  document.getElementById("formaPago").value = celdas[9].textContent;
  document.getElementById("cuit").value = celdas[10].textContent;
  document.getElementById("precioCombustible").value = parseFloat(celdas[11].textContent.replace("$","").replace(/\./g,"")) || 0;
  document.getElementById("lugarEntrega").value = celdas[12].textContent;
  document.getElementById("localidad").value = celdas[13].textContent;

  fila.remove();
  alert("Ahora podés editar la fila y volver a agregarla.");
};

// NUEVO: Eliminar fila individual
window.eliminarFila = function(btn) {
  const fila = btn.parentElement.parentElement;
  fila.remove();
  actualizarTotales();
};

// =============================
// EVENTOS AL CARGAR EL DOM
// =============================

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("animalForm");
  const tableBody = document.querySelector("#animalesTable tbody");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    // Obtener valores del formulario
    const comprador = document.getElementById("comprador").value;
    const categoria = document.getElementById("categoria").value;
    const codigoCategoria = document.getElementById("codigoCategoria").value;
    const corral = document.getElementById("corral").value;
    const cantidad = parseInt(document.getElementById("cantidad").value) || 1;
    const caravana = document.getElementById("caravana").value;
    const precio = parseFloat(document.getElementById("precio").value) || 0;
    const impKg = parseFloat(document.getElementById("impKg").value) || 0;
    const formaPago = document.getElementById("formaPago").value;
    const cuit = document.getElementById("cuit").value;
    const precioCombustible = parseFloat(document.getElementById("precioCombustible").value) || 0;
    const lugarEntrega = document.getElementById("lugarEntrega").value;
    const localidad = document.getElementById("localidad").value;

    // Importe en $
    const importe = precio * cantidad;

    // Agregar fila a la tabla con botones Editar / Eliminar
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${comprador}</td>
      <td>${categoria}</td>
      <td>${codigoCategoria}</td>
      <td>${corral}</td>
      <td>${cantidad}</td>
      <td>${caravana}</td>
      <td>$ ${precio.toLocaleString("es-AR")}</td>
      <td>$ ${importe.toLocaleString("es-AR")}</td>
      <td>${impKg}</td>
      <td>${formaPago}</td>
      <td>${cuit}</td>
      <td>$ ${precioCombustible.toLocaleString("es-AR")}</td>
      <td>${lugarEntrega}</td>
      <td>${localidad}</td>
      <td>
        <button onclick="editarFila(this)">✏</button>
        <button onclick="eliminarFila(this)">🗑</button>
      </td>
    `;
    tableBody.appendChild(row);

    // Actualizar totales
    actualizarTotales();

    // Limpiar formulario
    form.reset();
  });
});

// =============================
// HISTORIAL DE GESTIONES
// =============================

// =============================
// GUARDAR GESTIÓN (con mes y año)
// =============================
document.getElementById("guardarGestion").addEventListener("click", () => {
  const tableBody = document.querySelector("#animalesTable tbody");
  if (!tableBody || tableBody.rows.length === 0) {
    alert("No hay datos cargados para guardar la gestión.");
    return;
  }

  const detalle = Array.from(tableBody.rows).map(row => ({
    comprador: row.cells[0]?.textContent,
    categoria: row.cells[1]?.textContent,
    codigo: row.cells[2]?.textContent,
    corral: row.cells[3]?.textContent,
    cantidad: row.cells[4]?.textContent,
    caravana: row.cells[5]?.textContent,
    precio: row.cells[6]?.textContent,
    importe: row.cells[7]?.textContent,
    impKg: row.cells[8]?.textContent,
    formaPago: row.cells[9]?.textContent,
    cuit: row.cells[10]?.textContent,
    precioCombustible: row.cells[11]?.textContent,
    lugarEntrega: row.cells[12]?.textContent,
    localidad: row.cells[13]?.textContent
  }));

  const total = detalle.reduce((acc, d) => acc + (parseFloat(d.importe.replace("$", "").replace(/\./g, "").replace(",", ".")) || 0), 0);
  const totalCantidad = detalle.reduce((acc, d) => acc + (parseInt(d.cantidad) || 0), 0);
  const totalKg = detalle.reduce((acc, d) => acc + (parseFloat(d.impKg.replace(",", ".")) || 0), 0);
  const promedio = totalCantidad ? total / totalCantidad : 0;
  const promedioKg = totalCantidad ? totalKg / totalCantidad : 0;

  const ahora = new Date();
  const meses = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const mes = meses[ahora.getMonth()];
  const anio = ahora.getFullYear();

  if (idGestionEditando) {
    const gestionIndex = gestiones.findIndex(g => g.id === idGestionEditando);
    if (gestionIndex !== -1) {
      gestiones[gestionIndex] = {
        ...gestiones[gestionIndex],
        detalle,
        total,
        promedio,
        totalCantidad,
        totalKg,
        promedioKg,
        fechaEdicion: Date.now(),
        mes,
        anio
      };
    }
    idGestionEditando = null;
    alert("Gestión editada correctamente ✅");
  } else {
    const gestion = {
      id: Date.now(),
      fecha: Date.now(),
      detalle,
      total,
      promedio,
      totalCantidad,
      totalKg,
      promedioKg,
      mes,
      anio
    };
    gestiones.push(gestion);
    alert("Gestión guardada correctamente ✅");
  }

  localStorage.setItem("gestiones", JSON.stringify(gestiones));
  tableBody.innerHTML = "";
  actualizarTotales();
  mostrarHistorial();
});

// =============================
// MOSTRAR HISTORIAL AGRUPADO POR MES (versión actualizada - envío a reportes seguro)
// =============================
function mostrarHistorial() {
  const listaHistorial = document.getElementById("listaHistorial");
  listaHistorial.innerHTML = "";

  if (gestiones.length === 0) {
    listaHistorial.innerHTML = "<p>No hay gestiones guardadas aún.</p>";
    return;
  }

  // Agrupar por año-mes
  const agrupado = {};
  gestiones.forEach(g => {
    let mes = g.mes;
    let anio = g.anio;

    if (!mes || !anio) {
      const fecha = new Date(g.fecha);
      const meses = ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
                     "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
      mes = meses[fecha.getMonth()];
      anio = fecha.getFullYear();
      g.mes = mes;
      g.anio = anio;
    }

    const clave = `${mes} ${anio}`;
    if (!agrupado[clave]) agrupado[clave] = [];
    agrupado[clave].push(g);
  });

  const clavesOrdenadas = Object.keys(agrupado).reverse();

  clavesOrdenadas.forEach(clave => {
    const contenedorMes = document.createElement("div");
    contenedorMes.style.marginBottom = "20px";

    // Título del mes con checkbox oculto
    const tituloMesDiv = document.createElement("div");
    tituloMesDiv.style.display = "flex";
    tituloMesDiv.style.alignItems = "center";

    const titulo = document.createElement("h3");
    titulo.textContent = clave;
    titulo.style.background = "#ececec";
    titulo.style.padding = "6px";
    titulo.style.borderRadius = "6px";
    titulo.style.flex = "1";

    const checkMes = document.createElement("input");
    checkMes.type = "checkbox";
    checkMes.style.display = "none"; // oculto inicialmente
    checkMes.classList.add("checkMes");
    checkMes.style.width = "16px";
    checkMes.style.height = "16px";
    checkMes.style.marginLeft = "6px";

    // Evento: seleccionar/desmarcar todas las gestiones de ese mes
    checkMes.addEventListener("change", () => {
      const checksGestiones = contenedorMes.querySelectorAll(".checkGestion");
      checksGestiones.forEach(chk => chk.checked = checkMes.checked);
    });

    tituloMesDiv.appendChild(titulo);
    tituloMesDiv.appendChild(checkMes);
    contenedorMes.appendChild(tituloMesDiv);

    // Gestiones del mes
    agrupado[clave].forEach(g => {
      const item = document.createElement("div");
      item.style.border = "1px solid #ccc";
      item.style.borderRadius = "6px";
      item.style.padding = "8px";
      item.style.marginTop = "8px";
      item.style.background = "#f9f9f9";
      item.style.display = "flex";
      item.style.alignItems = "flex-start";

      // Checkbox por cada gestión (inicialmente oculto)
      const checkGestion = document.createElement("input");
      checkGestion.type = "checkbox";
      checkGestion.style.display = "none";
      checkGestion.classList.add("checkGestion");
      checkGestion.dataset.gestionId = g.id;
      checkGestion.style.width = "16px";
      checkGestion.style.height = "16px";
      checkGestion.style.marginRight = "6px";
      checkGestion.style.marginTop = "4px";

      // Contenido de la gestión (NO tocar estos botones ni sus onclick)
      let filasHTML = "<ul>";
      g.detalle.forEach(d => {
        filasHTML += `
          <li>
            <strong>${d.comprador}</strong> | 
            ${d.categoria} (${d.codigo}) | 
            Corral: ${d.corral} | 
            Cant: ${d.cantidad} | 
            Caravana: ${d.caravana} | 
            Precio: ${d.precio} | 
            Importe: ${d.importe} | 
            Kg: ${d.impKg} | 
            Pago: ${d.formaPago} | 
            CUIT: ${d.cuit} | 
            Combustible: ${d.precioCombustible} | 
            Entrega: ${d.lugarEntrega} | 
            Localidad: ${d.localidad}
          </li>`;
      });
      filasHTML += "</ul>";

      const fechaEdicionHTML = g.fechaEdicion ? `<br><span>Editado: ${formatFecha(g.fechaEdicion)}</span>` : '';

      const contenidoGestion = document.createElement("div");
      contenidoGestion.innerHTML = `
        <div>
          <strong>${formatFecha(g.fecha)}</strong>${fechaEdicionHTML}<br>
          ${filasHTML}
          <hr>
          <strong>Totales:</strong><br>
          Cantidad: ${g.totalCantidad} animales |
          Total: $${g.total.toLocaleString("es-AR")} |
          Promedio: $${g.promedio.toLocaleString("es-AR")} |
          Total Kg: ${g.totalKg.toLocaleString("es-AR")} |
          Promedio Kg: ${g.promedioKg.toLocaleString("es-AR")}
        </div>
        <div style="margin-top:6px;">
          <button onclick="verGestion(${g.id})">👁 Ver</button>
          <button onclick="editarGestion(${g.id})">✏ Editar</button>
          <button onclick="eliminarGestion(${g.id})">🗑 Eliminar</button>
        </div>
      `;

      item.appendChild(checkGestion);
      item.appendChild(contenidoGestion);
      contenedorMes.appendChild(item);
    });

    listaHistorial.appendChild(contenedorMes);
  });

  // =============================
  // BUSCADOR POR MES Y AÑO
  // =============================
  let buscadorContainer = document.getElementById("buscadorHistorial");
  if (!buscadorContainer) {
    buscadorContainer = document.createElement("div");
    buscadorContainer.id = "buscadorHistorial";
    buscadorContainer.style.marginBottom = "15px";
    buscadorContainer.innerHTML = `
      <label>Buscar por Mes:
        <select id="filtroMes">
          <option value="">-- Todos --</option>
          <option value="Enero">Enero</option>
          <option value="Febrero">Febrero</option>
          <option value="Marzo">Marzo</option>
          <option value="Abril">Abril</option>
          <option value="Mayo">Mayo</option>
          <option value="Junio">Junio</option>
          <option value="Julio">Julio</option>
          <option value="Agosto">Agosto</option>
          <option value="Septiembre">Septiembre</option>
          <option value="Octubre">Octubre</option>
          <option value="Noviembre">Noviembre</option>
          <option value="Diciembre">Diciembre</option>
        </select>
      </label>
      <label style="margin-left:10px;">Año:
        <input type="number" id="filtroAnio" placeholder="Ej: 2025" style="width:80px;">
      </label>
      <button id="btnFiltrarHistorial">🔍 Buscar</button>
      <button id="btnLimpiarFiltro">🧹 Limpiar</button>
    `;

    document.getElementById("historial").insertBefore(
      buscadorContainer,
      document.getElementById("listaHistorial")
    );

    document.getElementById("btnFiltrarHistorial").addEventListener("click", () => {
      const mes = document.getElementById("filtroMes").value;
      const anio = document.getElementById("filtroAnio").value;
      filtrarHistorial(mes, anio);
    });

    document.getElementById("btnLimpiarFiltro").addEventListener("click", () => {
      document.getElementById("filtroMes").value = "";
      document.getElementById("filtroAnio").value = "";
      mostrarHistorial(); // recarga completo
    });
  }


  // =============================
  // Panel Confirmar y Cancelar
  // =============================
  let panelReportes = document.getElementById("panelSeleccionReportes");
  if (!panelReportes) {
    panelReportes = document.createElement("div");
    panelReportes.id = "panelSeleccionReportes";
    panelReportes.style.display = "none";
    panelReportes.style.marginBottom = "10px";

    const btnConfirmar = document.createElement("button");
    btnConfirmar.id = "btnConfirmarReportes";
    btnConfirmar.textContent = "✅ Confirmar";

    const btnCancelar = document.createElement("button");
    btnCancelar.id = "btnCancelarReportes";
    btnCancelar.textContent = "❌ Cancelar";
    btnCancelar.style.marginLeft = "6px";

    panelReportes.appendChild(btnConfirmar);
    panelReportes.appendChild(btnCancelar);

    document.getElementById("historial").insertBefore(panelReportes, document.getElementById("listaHistorial"));

    // =============================
    // Eventos Confirmar / Cancelar
    // =============================
    btnCancelar.addEventListener("click", () => {
      document.querySelectorAll(".checkMes, .checkGestion").forEach(chk => chk.style.display = "none");
      panelReportes.style.display = "none";
      document.querySelectorAll(".checkMes, .checkGestion").forEach(chk => chk.checked = false);
    });

    btnConfirmar.addEventListener("click", () => {
      const gestionesSeleccionadas = [];
      document.querySelectorAll(".checkGestion:checked").forEach(chk => {
        const id = parseInt(chk.dataset.gestionId);
        const g = gestiones.find(gest => gest.id === id);
        if (g) gestionesSeleccionadas.push(g);
      });

      if (gestionesSeleccionadas.length === 0) {
        alert("No seleccionaste ninguna gestión.");
        return;
      }

      // =============================
      // Envío al reporte (HOJA ÚNICA - SIN PAGINACIÓN AUTOMÁTICA)
      // =============================
      // Obtener o crear la hoja última (hoja única que se alarga)
      let hojaActual = document.querySelector(".reportes-hoja-wrap .reportes-hoja:last-child");
      if (!hojaActual) {
        hojaActual = crearNuevaHoja();
        document.querySelector(".reportes-hoja-wrap").appendChild(hojaActual);
      }

      // Asegurarse de que exista el contenedor de gestiones
      let contenedorGestiones = hojaActual.querySelector(".reportes-gestiones");
      if (!contenedorGestiones) {
        contenedorGestiones = document.createElement("div");
        contenedorGestiones.className = "reportes-gestiones";
        hojaActual.appendChild(contenedorGestiones);
      }

      // Agregar cada gestión directamente al contenedor de gestiones (sin clonar nodos del historial)
      gestionesSeleccionadas.forEach(g => {
        let detalleHTML = "<ul>";
        g.detalle.forEach(d => {
          detalleHTML += `
            <li>
              <strong>${d.comprador}</strong> | 
              ${d.categoria} (${d.codigo}) | 
              Cant: ${d.cantidad} | 
              Caravana: ${d.caravana} | 
              Precio: ${d.precio} | 
              Importe: ${d.importe} | 
              Pago: ${d.formaPago}
            </li>`;
        });
        detalleHTML += "</ul>";

        const contenido = `
          <h4>${g.mes} ${g.anio} - ${formatFecha(g.fecha)}</h4>
          ${detalleHTML}
          <strong>Total:</strong> $${g.total.toLocaleString("es-AR")} |
          <strong>Cantidad:</strong> ${g.totalCantidad} |
          <strong>Promedio:</strong> $${g.promedio.toLocaleString("es-AR")}
          <hr>
        `;

        // Insertar HTML directamente: mantiene los listeners externos intactos
        contenedorGestiones.insertAdjacentHTML('beforeend', contenido);
      });

      // Reordenar solo los contenedores principales para asegurar el orden visual:
      const tabla = hojaActual.querySelector(".reportes-tabla");
      const estadisticas = hojaActual.querySelector(".reportes-estadisticas");
      if (tabla) hojaActual.appendChild(tabla);
      if (contenedorGestiones) hojaActual.appendChild(contenedorGestiones);
      if (estadisticas) hojaActual.appendChild(estadisticas);

      // Mostrar la sección de reportes (sin alterar nada más)
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

      // Limpiar visuales del historial (ocultar checks)
      document.querySelectorAll(".checkMes, .checkGestion").forEach(chk => {
        chk.style.display = "none";
        chk.checked = false;
      });
      panelReportes.style.display = "none";

      // Guardar cambios en reportes
      if (typeof guardarReportes === "function") guardarReportes();
    });
  }

  // =============================
  // Botón Agregar a Reportes
  // =============================
  const btnAgregarReportes = document.getElementById("abrirSeleccionReportes");
  if (btnAgregarReportes) {
    btnAgregarReportes.addEventListener("click", () => {
      document.querySelectorAll(".checkMes, .checkGestion").forEach(chk => chk.style.display = "inline-block");
      panelReportes.style.display = "block";
    });
  }
}



//nueva función para borrar gestión y refrescar vista
function borrarGestion(id) {
  let gestiones = JSON.parse(localStorage.getItem("gestiones")) || [];
  gestiones = gestiones.filter(g => g.id !== id);
  localStorage.setItem("gestiones", JSON.stringify(gestiones));

  mostrarHistorial(); // refresca historial
  recargarTodo();     // refresca resultados + estadísticas
}

// =============================
// GESTIONES (VER, EDITAR, ELIMINAR)
// =============================

// VER GESTIÓN
window.verGestion = function (id) {
  const gestion = gestiones.find(g => g.id === id);
  if (gestion) {
    const tableBody = document.querySelector("#animalesTable tbody");
    tableBody.innerHTML = ""; // limpiar tabla antes de mostrar

    gestion.detalle.forEach(d => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${d.comprador}</td>
        <td>${d.categoria}</td>
        <td>${d.codigo}</td>
        <td>${d.corral}</td>
        <td>${d.cantidad}</td>
        <td>${d.caravana}</td>
        <td>${d.precio}</td>
        <td>${d.importe}</td>
        <td>${d.impKg}</td>
        <td>${d.formaPago}</td>
        <td>${d.cuit}</td>
        <td>${d.precioCombustible}</td>
        <td>${d.lugarEntrega}</td>
        <td>${d.localidad}</td>
        <td>
          <button onclick="editarFila(this)">✏</button>
          <button onclick="eliminarFila(this)">🗑</button>
        </td>
      `;
      tableBody.appendChild(row);
    });
    actualizarTotales(); // recalcular al cargar la gestión
  }
};

// EDITAR GESTIÓN
window.editarGestion = function (id) {
  const gestion = gestiones.find(g => g.id === id);
  if (gestion) {
    const tableBody = document.querySelector("#animalesTable tbody");
    tableBody.innerHTML = ""; // limpiar tabla antes de cargar la gestión

    gestion.detalle.forEach(d => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${d.comprador}</td>
        <td>${d.categoria}</td>
        <td>${d.codigo}</td>
        <td>${d.corral}</td>
        <td>${d.cantidad}</td>
        <td>${d.caravana}</td>
        <td>${d.precio}</td>
        <td>${d.importe}</td>
        <td>${d.impKg}</td>
        <td>${d.formaPago}</td>
        <td>${d.cuit}</td>
        <td>${d.precioCombustible}</td>
        <td>${d.lugarEntrega}</td>
        <td>${d.localidad}</td>
        <td>
          <button onclick="editarFila(this)">✏</button>
          <button onclick="eliminarFila(this)">🗑</button>
        </td>
      `;
      tableBody.appendChild(row);
    });

    idGestionEditando = id; // ✅ Guardar el ID de la gestión
    actualizarTotales();
    alert("Ahora podés editar la gestión y volver a guardarla.");
  }
};

// ELIMINAR GESTIÓN
window.eliminarGestion = function (id) {
  const gestion = gestiones.find(g => g.id === id);
  if (!gestion) return;

  const confirmar = confirm(`¿Seguro que querés eliminar la gestión del ${formatFecha(gestion.fecha)}?`);
  if (!confirmar) return;

  gestiones = gestiones.filter(g => g.id !== id);
  mostrarHistorial();

  alert("Gestión eliminada correctamente ✅");
};


// =============================
// FUNCIÓN FILTRAR HISTORIAL
// =============================
function filtrarHistorial(mes, anio) {
  let gestiones = JSON.parse(localStorage.getItem("gestiones")) || [];
  let filtradas = gestiones;

  if (mes) filtradas = filtradas.filter(g => g.mes === mes);
  if (anio) filtradas = filtradas.filter(g => g.anio == anio);

  if (filtradas.length === 0) {
    alert("No se encontraron gestiones para ese mes/año.");
    return;
  }

  // mostrar solo las filtradas (reutilizando el render)
  const original = gestiones;
  window.gestiones = filtradas;
  mostrarHistorial();
  window.gestiones = original; // restaurar
}


