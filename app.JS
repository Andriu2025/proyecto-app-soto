// app.js  (gestión de navegación / login / botones "volver")
// =============================

// Mostrar el formulario de registro
function mostrarRegistro() {
  const loginBox = document.getElementById("loginBox");
  const registerBox = document.getElementById("registerBox");
  if (loginBox) loginBox.style.display = "none";
  if (registerBox) registerBox.style.display = "block";
}

// Mostrar el formulario de login
function mostrarLogin() {
  const loginBox = document.getElementById("loginBox");
  const registerBox = document.getElementById("registerBox");
  if (registerBox) registerBox.style.display = "none";
  if (loginBox) loginBox.style.display = "block";
}

// Manejo de registro (simulado)
document.addEventListener("DOMContentLoaded", () => {
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", function(e) {
      e.preventDefault();
      alert("Usuario registrado correctamente (aquí se guardará en la base de datos).");
      mostrarLogin();
    });
  }

  // Manejo inicio de sesión
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", function(e) {
      e.preventDefault();
      const usuario = document.getElementById("usuario").value;
      const contraseña = document.getElementById("contraseña").value;

      if (usuario && contraseña) {
        alert("Bienvenido, " + usuario);
        // Ocultar contenedor de login/registro y mostrar menú principal
        const contenedor1 = document.getElementById("contenedor1");
        const menuPrincipal = document.getElementById("menuPrincipal");
        const loginBox = document.getElementById("loginBox");
        if (loginBox) loginBox.style.display = "none";
        if (contenedor1) contenedor1.style.display = "none";
        if (menuPrincipal) menuPrincipal.style.display = "block";

        // Si existe función para cargar historial/estado, llamarla
        try {
          if (typeof window.mostrarHistorial === "function") {
            window.mostrarHistorial();
          }
          // cargarResultados queda a cargo de quien llame a mostrarResultados
        } catch (e) {
          console.warn("mostrarHistorial no disponible", e);
        }
      } else {
        alert("Por favor, completa usuario y contraseña.");
      }
    });
  }

  // Botón "Volver al menú" desde ANIMALES (usa id -> no pise otras funciones)
  const btnVolverAnimales = document.getElementById("volverMenuAnimales");
  if (btnVolverAnimales) {
    btnVolverAnimales.addEventListener("click", () => {
      // Ocultar secciones que puedan quedar abiertas
      const animales = document.getElementById("animales");
      const resultados = document.getElementById("resultados");
      const estadisticas = document.getElementById("estadisticas");
      const menu = document.getElementById("menuPrincipal");
      if (animales) animales.style.display = "none";
      if (resultados) resultados.style.display = "none";
      if (estadisticas) estadisticas.style.display = "none";
      if (menu) menu.style.display = "block";

      // Intentar recalcular totales si existe la función
      try { if (typeof window.actualizarTotales === "function") window.actualizarTotales(); } catch (e) {}
    });
  }

  // Botón "Volver al menú" desde RESULTADOS (usa id distinto)
  const btnVolverResultados = document.getElementById("volverMenuResultados");
  if (btnVolverResultados) {
    btnVolverResultados.addEventListener("click", () => {
      const animales = document.getElementById("animales");
      const resultados = document.getElementById("resultados");
      const estadisticas = document.getElementById("estadisticas");
      const menu = document.getElementById("menuPrincipal");
      if (animales) animales.style.display = "none";
      if (resultados) resultados.style.display = "none";
      if (estadisticas) estadisticas.style.display = "none";
      if (menu) menu.style.display = "block";

      // opcional: si existe función global para recargar algo
      try { if (typeof window.actualizarTotales === "function") window.actualizarTotales(); } catch (e) {}
    });
  }

  // Botón "Volver al menú" desde ESTADÍSTICAS (usa id específico)
  const btnVolverEstadisticas = document.getElementById("volverMenuEstadisticas");
  if (btnVolverEstadisticas) {
    btnVolverEstadisticas.addEventListener("click", () => {
      const animales = document.getElementById("animales");
      const resultados = document.getElementById("resultados");
      const estadisticas = document.getElementById("estadisticas");
      const menu = document.getElementById("menuPrincipal");
      if (animales) animales.style.display = "none";
      if (resultados) resultados.style.display = "none";
      if (estadisticas) estadisticas.style.display = "none";
      if (menu) menu.style.display = "block";

      // Si hay que actualizar totales, mantenerlo
      try { if (typeof window.actualizarTotales === "function") window.actualizarTotales(); } catch (e) {}
    });
  }

  // Botón "Volver al menú" desde REPORTES (usa id específico)
  const btnVolverReportes = document.getElementById("volverMenuReportes");
  if (btnVolverReportes) {
    btnVolverReportes.addEventListener("click", () => {
      const reportes = document.getElementById("reportes");
      const menu = document.getElementById("menuPrincipal");
      if (reportes) reportes.style.display = "none";
      if (menu) menu.style.display = "block";
    });
  }

  // Cerrar sesión
  window.cerrarSesion = function() {
    const menuPrincipal = document.getElementById("menuPrincipal");
    const animales = document.getElementById("animales");
    const resultados = document.getElementById("resultados");
    const estadisticas = document.getElementById("estadisticas");
    const contenedor1 = document.getElementById("contenedor1");
    const loginBox = document.getElementById("loginBox");
    const registerBox = document.getElementById("registerBox");
    const reportes = document.getElementById("reportes");

    if (menuPrincipal) menuPrincipal.style.display = "none";
    if (animales) animales.style.display = "none";
    if (resultados) resultados.style.display = "none";
    if (estadisticas) estadisticas.style.display = "none";
    if (reportes) reportes.style.display = "none";
    if (contenedor1) contenedor1.style.display = "block";
    if (loginBox) loginBox.style.display = "block";
    if (registerBox) registerBox.style.display = "none";

    // limpiar campos por seguridad
    try {
      const usuario = document.getElementById("usuario");
      const contraseña = document.getElementById("contraseña");
      if (usuario) usuario.value = "";
      if (contraseña) contraseña.value = "";
    } catch (e) {}
  };

  // Al cargar la app, si existe mostrarHistorial, llamala para que el historial aparezca
  try {
    if (typeof window.mostrarHistorial === "function") {
      window.mostrarHistorial();
    }
  } catch (e) {
    // no interrumpimos si no existe
  }
});

// =============================
// SECCIÓN REPORTES
// =============================
window.mostrarReportes = function() {
  const animales = document.getElementById("animales");
  const resultados = document.getElementById("resultados");
  const estadisticas = document.getElementById("estadisticas");
  const menu = document.getElementById("menuPrincipal");
  const reportes = document.getElementById("reportes");

  if (animales) animales.style.display = "none";
  if (resultados) resultados.style.display = "none";
  if (estadisticas) estadisticas.style.display = "none";
  if (menu) menu.style.display = "none";
  if (reportes) reportes.style.display = "block";
};








