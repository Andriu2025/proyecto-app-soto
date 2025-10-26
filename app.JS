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

// -----------------------------
// Registro + Login seguro (CryptoJS) - reemplaza los handlers viejos
// -----------------------------
document.addEventListener("DOMContentLoaded", () => {

  const registerForm = document.getElementById("registerForm");
  const loginForm = document.getElementById("loginForm");

  // -------- REGISTRO (con clave maestra) --------
  if (registerForm) {
    registerForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const usuario = registerForm.querySelector("input[placeholder='Usuario nuevo']").value.trim();
      const email = registerForm.querySelector("input[placeholder='Email']").value.trim();
      const pass = registerForm.querySelector("input[placeholder='Contraseña']").value.trim();
      const pass2 = registerForm.querySelector("input[placeholder='Confirmar contraseña']").value.trim();
      const codigoVerificacionInput = registerForm.querySelector("#codigoVerificacion");
      const codigoVerificacion = codigoVerificacionInput ? codigoVerificacionInput.value.trim() : "";

      if (!usuario || !email || !pass || !pass2) {
        alert("Por favor, completa todos los campos.");
        return;
      }
      if (pass !== pass2) {
        alert("Las contraseñas no coinciden.");
        return;
      }

      const usuarios = JSON.parse(localStorage.getItem("usuarios") || "[]");

      // evitar emails repetidos
      if (usuarios.find(u => u.email === email)) {
        alert("Este email ya está registrado.");
        return;
      }

      // manejar master key
      const storedMasterHash = localStorage.getItem("masterKeyHash");
      if (storedMasterHash) {
        // si ya existe master => pedir codigo
        if (!codigoVerificacion) {
          alert("Debes ingresar el código de verificación para registrar una nueva cuenta.");
          return;
        }
        const codigoHash = CryptoJS.SHA256(codigoVerificacion).toString();
        if (codigoHash !== storedMasterHash) {
          alert("Código de verificación incorrecto. No se puede registrar.");
          return;
        }
      } else {
        // primera vez: crear masterKey = codigoVerificacion (si puso) o pass
        const nuevaMaster = codigoVerificacion || pass;
        const nuevaMasterHash = CryptoJS.SHA256(nuevaMaster).toString();
        localStorage.setItem("masterKeyHash", nuevaMasterHash);
        // opcional: avisar al dueño
        alert("🔐 Clave maestra creada. Guárdala: la necesitarás para permitir futuros registros.");
      }

      // cifrar contraseña con CryptoJS (misma "clave-secreta" en login)
      const passCifrada = CryptoJS.AES.encrypt(pass, "clave-secreta").toString();

      // guardar usuario
      usuarios.push({ usuario, email, pass: passCifrada });
      localStorage.setItem("usuarios", JSON.stringify(usuarios));

      // iniciar sesión automáticamente y mostrar menú
      sessionStorage.setItem("usuarioActivo", usuario);

      // mostrar menú
      const contenedor1 = document.getElementById("contenedor1");
      const loginBox = document.getElementById("loginBox");
      const registerBox = document.getElementById("registerBox");
      const menuPrincipal = document.getElementById("menuPrincipal");
      if (loginBox) loginBox.style.display = "none";
      if (registerBox) registerBox.style.display = "none";
      if (contenedor1) contenedor1.style.display = "none";
      if (menuPrincipal) menuPrincipal.style.display = "block";

      alert("✅ Usuario registrado e iniciado en sesión correctamente.");
    });
  }

  // -------- LOGIN (verifica con usuarios en localStorage) --------
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const usuario = document.getElementById("usuario").value.trim();
      const contraseña = document.getElementById("contraseña").value.trim();

      if (!usuario || !contraseña) {
        alert("Por favor, completa usuario y contraseña.");
        return;
      }

      const usuarios = JSON.parse(localStorage.getItem("usuarios") || "[]");

      // buscar usuario por nombre (o podés cambiar a buscar por email)
      const user = usuarios.find(u => u.usuario === usuario);

      if (!user) {
        alert("Usuario no encontrado.");
        return;
      }

      // descifrar contraseña y comparar
      let passDescifrada = "";
      try {
        passDescifrada = CryptoJS.AES.decrypt(user.pass, "clave-secreta").toString(CryptoJS.enc.Utf8);
      } catch (err) {
        console.error("Error al descifrar:", err);
      }

      if (passDescifrada !== contraseña) {
        alert("Contraseña incorrecta.");
        return;
      }

      // todo correcto: iniciar sesión
      sessionStorage.setItem("usuarioActivo", usuario);

      // mostrar menú
      const contenedor1 = document.getElementById("contenedor1");
      const loginBox = document.getElementById("loginBox");
      const menuPrincipal = document.getElementById("menuPrincipal");
      if (loginBox) loginBox.style.display = "none";
      if (contenedor1) contenedor1.style.display = "none";
      if (menuPrincipal) menuPrincipal.style.display = "block";

      alert("Bienvenido, " + usuario);
      // cargar historial si existe la función
      try {
        if (typeof window.mostrarHistorial === "function") window.mostrarHistorial();
      } catch (e) { console.warn(e); }
    });
  }

  // Sesión persistente en esta pestaña (si ya había)
  const usuarioActivo = sessionStorage.getItem("usuarioActivo");
  if (usuarioActivo) {
    const contenedor1 = document.getElementById("contenedor1");
    const menuPrincipal = document.getElementById("menuPrincipal");
    if (contenedor1) contenedor1.style.display = "none";
    if (menuPrincipal) menuPrincipal.style.display = "block";
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


// =============================
// BOTÓN DE CONTACTO (animado)
// =============================

// Esperamos a que cargue todo el DOM
document.addEventListener("DOMContentLoaded", () => {
  const btnContacto = document.getElementById("btnContacto");
  const panelContacto = document.getElementById("panelContacto");

  if (btnContacto && panelContacto) {
    // Mostrar/ocultar con animación
    btnContacto.addEventListener("click", (e) => {
      e.stopPropagation();

      if (panelContacto.classList.contains("visible")) {
        // Si ya está visible, lo ocultamos
        panelContacto.classList.remove("visible");
        setTimeout(() => (panelContacto.style.display = "none"), 300);
      } else {
        // Si no, lo mostramos con animación
        panelContacto.style.display = "block";
        setTimeout(() => panelContacto.classList.add("visible"), 10);
      }
    });

    // Si se hace clic fuera, se cierra automáticamente
    document.addEventListener("click", (e) => {
      if (!btnContacto.contains(e.target) && !panelContacto.contains(e.target)) {
        if (panelContacto.classList.contains("visible")) {
          panelContacto.classList.remove("visible");
          setTimeout(() => (panelContacto.style.display = "none"), 300);
        }
      }
    });
  }
});






