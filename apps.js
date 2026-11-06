
/* =====================================================
   ANDYARTIS
   JavaScript principal
   Estudio Digital de Arte
===================================================== */


/* =====================================================
   1. VARIABLES GENERALES
===================================================== */

const $ = (selector) => document.querySelector(selector);

const pantallas = {
    bienvenida: "pantallaBienvenida",
    registro: "pantallaRegistro",
    perfil: "pantallaPerfil",
    inicio: "pantallaInicio",
    categorias: "pantallaCategorias",
    solicitud: "pantallaSolicitud",
    solicitudes: "pantallaSolicitudes",
    seguimiento: "pantallaSeguimiento",
    notificaciones: "pantallaNotificaciones",
    admin: "pantallaAdmin",
    administrar: "pantallaAdministrarSolicitud",
    configuracion: "pantallaConfiguracion",
    recuperar: "pantallaRecuperar"
};

let usuarioActual = null;
let cuentaDemo = null;
let solicitudSeleccionada = null;
let archivoReferenciaActual = null;
let fotoPerfilActual = null;

let solicitudes = [];
let notificaciones = [];

const CLAVE_SOLICITUDES = "andyartis_solicitudes_demo";
const CLAVE_NOTIFICACIONES = "andyartis_notificaciones_demo";
const CLAVE_PERFIL = "andyartis_perfil_demo";


/* =====================================================
   2. FUNCIONES AUXILIARES
===================================================== */

function guardarDatos(clave, datos) {
    try {
        sessionStorage.setItem(clave, JSON.stringify(datos));
        return true;
    } catch (error) {
        console.error("No se pudieron guardar los datos:", error);
        alert("No fue posible guardar la información en esta sesión.");
        return false;
    }
}

function leerDatos(clave, valorPredeterminado = []) {
    try {
        const datos = sessionStorage.getItem(clave);
        return datos ? JSON.parse(datos) : valorPredeterminado;
    } catch (error) {
        console.error("Error al leer los datos:", error);
        return valorPredeterminado;
    }
}

function escaparHTML(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, caracter => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[caracter]);
}

function generarId() {
    if (window.crypto && crypto.randomUUID) {
        return crypto.randomUUID();
    }

    return Date.now().toString(36) +
        Math.random().toString(36).slice(2);
}

function fechaActual() {
    return new Date().toLocaleDateString("es-MX");
}

function guardarSolicitudes() {
    guardarDatos(CLAVE_SOLICITUDES, solicitudes);
}

function guardarNotificaciones() {
    guardarDatos(CLAVE_NOTIFICACIONES, notificaciones);
}

function guardarPerfil() {
    if (usuarioActual) {
        guardarDatos(CLAVE_PERFIL, usuarioActual);
    }
}


/* =====================================================
   3. NAVEGACIÓN ENTRE PANTALLAS
===================================================== */

function mostrarPantalla(nombre) {

    const idPantalla = pantallas[nombre];

    if (!idPantalla) {
        console.warn("La pantalla no existe:", nombre);
        return;
    }

    // Las pantallas privadas requieren una sesión.
    const pantallasPrivadas = [
        "perfil",
        "inicio",
        "categorias",
        "solicitud",
        "solicitudes",
        "seguimiento",
        "notificaciones",
        "admin",
        "administrar",
        "configuracion"
    ];

    if (pantallasPrivadas.includes(nombre) && !usuarioActual) {
        alert("Primero debes iniciar sesión.");
        nombre = "bienvenida";
    }

    // El panel de artista no se habilita con una cuenta de cliente.
    if (
        (nombre === "admin" || nombre === "administrar") &&
        (!usuarioActual || usuarioActual.rol !== "artista")
    ) {
        alert("El panel de artista requiere una cuenta autorizada.");
        return;
    }

    Object.values(pantallas).forEach(id => {
        const pantalla = document.getElementById(id);

        if (pantalla) {
            pantalla.hidden = true;
        }
    });

    const pantallaActiva = document.getElementById(pantallas[nombre]);

    if (pantallaActiva) {
        pantallaActiva.hidden = false;
    }

    actualizarEncabezado();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

function actualizarEncabezado() {

    const encabezado = $(".encabezado");

    if (!encabezado) return;

    const navegacion = encabezado.querySelector(".navegacion");
    const acciones = encabezado.querySelector(".acciones-encabezado");

    if (!usuarioActual) {
        if (navegacion) navegacion.hidden = true;
        if (acciones) acciones.hidden = true;
    } else {
        if (navegacion) navegacion.hidden = false;
        if (acciones) acciones.hidden = false;
    }
}


// Navegación de botones con data-page.

document.addEventListener("click", event => {

    const boton = event.target.closest("[data-page]");

    if (!boton) return;

    const pagina = boton.dataset.page;

    mostrarPantalla(pagina);
});


/* =====================================================
   4. REGISTRO DE CUENTA - MODO DE DEMOSTRACIÓN
===================================================== */

const formRegistro = $("#formRegistro");

if (formRegistro) {

    formRegistro.addEventListener("submit", event => {

        event.preventDefault();

        const nombre = $("#registroNombre").value.trim();
        const apellidos = $("#registroApellidos").value.trim();
        const correo = $("#registroCorreo").value.trim().toLowerCase();
        const password = $("#registroPassword").value;
        const confirmar = $("#registroConfirmar").value;
        const terminos = $("#aceptarTerminos").checked;

        if (!nombre || !apellidos || !correo || !password) {
            alert("Completa todos los campos.");
            return;
        }

        if (password.length < 8) {
            alert("La contraseña debe tener al menos 8 caracteres.");
            return;
        }

        if (password !== confirmar) {
            alert("Las contraseñas no coinciden.");
            return;
        }

        if (!terminos) {
            alert("Debes aceptar las condiciones de uso.");
            return;
        }

        // Cuenta temporal para pruebas.
        // No se almacena la contraseña.
        cuentaDemo = {
            nombre,
            apellidos,
            correo
        };

        usuarioActual = {
            nombre,
            apellidos,
            correo,
            pais: "",
            descripcion: "",
            rol: "cliente"
        };

        guardarPerfil();

        formRegistro.reset();

        alert(
            "¡Registro de demostración completado!\n\n" +
            "Ahora puedes personalizar tu perfil."
        );

        cargarPerfilEnFormulario();

        mostrarPantalla("perfil");

    });

}


/* =====================================================
   5. INICIO DE SESIÓN - MODO DE DEMOSTRACIÓN
===================================================== */

const formLogin = $("#formLogin");

if (formLogin) {

    formLogin.addEventListener("submit", event => {

        event.preventDefault();

        const correo = $("#loginCorreo").value.trim().toLowerCase();
        const password = $("#loginPassword").value;

        if (!correo || !password) {
            alert("Ingresa tu correo y contraseña.");
            return;
        }

        // Esta comprobación solo funciona durante la sesión actual.
        // La autenticación real se conectará con Firebase.

        if (!cuentaDemo || cuentaDemo.correo !== correo) {
            alert(
                "No encontramos una cuenta de demostración registrada " +
                "en esta sesión.\n\n" +
                "Puedes crear una cuenta para probar la aplicación."
            );
            return;
        }

        // No guardamos ni comparamos contraseñas localmente.
        // Este acceso es únicamente una simulación visual.
        usuarioActual = {
            nombre: cuentaDemo.nombre,
            apellidos: cuentaDemo.apellidos,
            correo: cuentaDemo.correo,
            pais: "",
            descripcion: "",
            rol: "cliente"
        };

        cargarPerfilGuardado();

        $("#loginPassword").value = "";

        alert(
            "Acceso de demostración.\n\n" +
            "La autenticación segura se configurará con Firebase."
        );

        actualizarNombreUsuario();
        mostrarPantalla("inicio");

    });

}


/* =====================================================
   6. RECUPERACIÓN DE CONTRASEÑA
===================================================== */

const formRecuperar = $("#formRecuperar");

if (formRecuperar) {

    formRecuperar.addEventListener("submit", event => {

        event.preventDefault();

        const correo = $("#recuperarCorreo").value.trim();

        if (!correo) {
            alert("Escribe tu correo electrónico.");
            return;
        }

        alert(
            "La recuperación de contraseña todavía no está conectada.\n\n" +
            "Más adelante configuraremos Firebase Authentication " +
            "para enviar el enlace de recuperación."
        );

        formRecuperar.reset();

    });

}


/* =====================================================
   7. CARGAR Y GUARDAR PERFIL
===================================================== */

function cargarPerfilGuardado() {

    if (!usuarioActual) return;

    const perfilGuardado = leerDatos(CLAVE_PERFIL, null);

    if (
        perfilGuardado &&
        perfilGuardado.correo === usuarioActual.correo
    ) {
        usuarioActual = {
            ...usuarioActual,
            ...perfilGuardado
        };
    }

    actualizarNombreUsuario();
}

function cargarPerfilEnFormulario() {

    if (!usuarioActual) return;

    $("#perfilNombre").value = usuarioActual.nombre || "";
    $("#perfilApellidos").value = usuarioActual.apellidos || "";
    $("#perfilPais").value = usuarioActual.pais || "";
    $("#perfilDescripcion").value = usuarioActual.descripcion || "";

    if (fotoPerfilActual) {
        $("#vistaFotoPerfil").src = fotoPerfilActual;
    }
}

function actualizarNombreUsuario() {

    const elemento = $("#nombreUsuario");

    if (elemento && usuarioActual) {
        elemento.textContent = usuarioActual.nombre || "artista";
    }
}

const formPerfil = $("#formPerfil");

if (formPerfil) {

    formPerfil.addEventListener("submit", event => {

        event.preventDefault();

        if (!usuarioActual) {
            alert("Inicia sesión para editar tu perfil.");
            return;
        }

        usuarioActual.nombre = $("#perfilNombre").value.trim();
        usuarioActual.apellidos = $("#perfilApellidos").value.trim();
        usuarioActual.pais = $("#perfilPais").value;
        usuarioActual.descripcion = $("#perfilDescripcion").value.trim();

        if (fotoPerfilActual) {
            usuarioActual.foto = fotoPerfilActual;
        }

        if (guardarDatos(CLAVE_PERFIL, usuarioActual)) {

            actualizarNombreUsuario();

            alert("¡Tu perfil se ha actualizado en esta sesión!");

            mostrarPantalla("inicio");
        }

    });

}


/* =====================================================
   8. FOTO DE PERFIL Y VISTA PREVIA
===================================================== */

const inputFotoPerfil = $("#fotoPerfil");

if (inputFotoPerfil) {

    inputFotoPerfil.addEventListener("change", () => {

        const archivo = inputFotoPerfil.files[0];

        if (!archivo) return;

        if (!archivo.type.startsWith("image/")) {
            alert("Selecciona un archivo de imagen.");
            inputFotoPerfil.value = "";
            return;
        }

        if (archivo.size > 5 * 1024 * 1024) {
            alert("La fotografía debe pesar menos de 5 MB.");
            inputFotoPerfil.value = "";
            return;
        }

        const lector = new FileReader();

        lector.onload = () => {

            fotoPerfilActual = lector.result;

            $("#vistaFotoPerfil").src = fotoPerfilActual;

        };

        lector.onerror = () => {
            alert("No se pudo leer la fotografía.");
        };

        lector.readAsDataURL(archivo);

    });

}


/* =====================================================
   9. SELECCIÓN DE CATEGORÍAS
===================================================== */

document.addEventListener("click", event => {

    const boton = event.target.closest("[data-category]");

    if (!boton) return;

    if (!usuarioActual) {
        alert("Inicia sesión para solicitar un dibujo.");
        mostrarPantalla("bienvenida");
        return;
    }

    const categoria = boton.dataset.category;

    $("#solicitudCategoria").value = categoria;

    mostrarPantalla("solicitud");

});


/* =====================================================
   10. IMAGEN DE REFERENCIA
===================================================== */

const inputReferencia = $("#imagenReferencia");

if (inputReferencia) {

    inputReferencia.addEventListener("change", () => {

        const archivo = inputReferencia.files[0];

        archivoReferenciaActual = null;

        const vista = $("#vistaImagenReferencia");

        if (!archivo) {
            vista.hidden = true;
            vista.removeAttribute("src");
            return;
        }

        if (!archivo.type.startsWith("image/")) {
            alert("Selecciona una imagen válida.");
            inputReferencia.value = "";
            vista.hidden = true;
            return;
        }

        if (archivo.size > 8 * 1024 * 1024) {
            alert("La imagen debe pesar menos de 8 MB.");
            inputReferencia.value = "";
            vista.hidden = true;
            return;
        }

        const lector = new FileReader();

        lector.onload = () => {

            archivoReferenciaActual = archivo;

            vista.src = lector.result;
            vista.hidden = false;

        };

        lector.onerror = () => {
            alert("No se pudo leer la imagen.");
        };

        lector.readAsDataURL(archivo);

    });

}


/* =====================================================
   11. CREAR SOLICITUD DE DIBUJO
===================================================== */

const formSolicitud = $("#formSolicitud");

if (formSolicitud) {

    formSolicitud.addEventListener("submit", event => {

        event.preventDefault();

        if (!usuarioActual) {
            alert("Inicia sesión antes de enviar una solicitud.");
            return;
        }

        const categoria = $("#solicitudCategoria").value;
        const titulo = $("#solicitudTitulo").value.trim();
        const descripcion = $("#solicitudDescripcion").value.trim();

        const estiloSeleccionado = document.querySelector(
            'input[name="estiloDibujo"]:checked'
        );

        if (!categoria || !titulo || !descripcion || !estiloSeleccionado) {
            alert("Completa los datos de tu solicitud.");
            return;
        }

        const nuevaSolicitud = {

            id: generarId(),

            cliente: {
                nombre: usuarioActual.nombre,
                apellidos: usuarioActual.apellidos,
                correo: usuarioActual.correo
            },

            categoria,
            titulo,
            descripcion,
            estilo: estiloSeleccionado.value,

            nombreImagen: archivoReferenciaActual
                ? archivoReferenciaActual.name
                : "",

            fechaSolicitud: fechaActual(),

            fechaEntrega: "",

            estado: "Pendiente",

            mensajeArtista: "",

            creada: new Date().toISOString()

        };

        solicitudes.unshift(nuevaSolicitud);

        if (!guardarDatos(CLAVE_SOLICITUDES, solicitudes)) {
            solicitudes.shift();
            return;
        }

        crearNotificacion(
            "Solicitud enviada",
            "Tu solicitud de dibujo se registró en esta sesión.",
            nuevaSolicitud.id
        );

        formSolicitud.reset();

        archivoReferenciaActual = null;

        $("#vistaImagenReferencia").hidden = true;
        $("#vistaImagenReferencia").removeAttribute("src");

        alert(
            "¡Tu solicitud se registró correctamente!\n\n" +
            "En esta versión de demostración, los datos solo se guardan " +
            "durante la sesión actual del navegador."
        );

        mostrarPantalla("solicitudes");

        mostrarMisSolicitudes();

    });

}


/* =====================================================
   12. MOSTRAR SOLICITUDES DEL CLIENTE
===================================================== */

function mostrarMisSolicitudes() {

    const contenedor = $("#listaSolicitudes");

    if (!contenedor || !usuarioActual) return;

    const misSolicitudes = solicitudes.filter(
        solicitud => solicitud.cliente.correo === usuarioActual.correo
    );

    if (misSolicitudes.length === 0) {

        contenedor.innerHTML = `
            <div class="mensaje-vacio">
                <h3>Aún no tienes solicitudes</h3>
                <p>Cuando envíes una solicitud aparecerá aquí.</p>
                <button type="button" data-page="categorias">
                    Solicitar un dibujo
                </button>
            </div>
        `;

        return;
    }

    contenedor.innerHTML = "";

    misSolicitudes.forEach(solicitud => {

        const tarjeta = document.createElement("article");

        tarjeta.className = "tarjeta-categoria";

        tarjeta.innerHTML = `
            <div style="padding:20px;">
                <h3>${escaparHTML(solicitud.titulo)}</h3>

                <p>
                    Categoría: ${escaparHTML(solicitud.categoria)}
                </p>

                <p>
                    Estado: <strong>${escaparHTML(solicitud.estado)}</strong>
                </p>

                <p>
                    Fecha: ${escaparHTML(solicitud.fechaSolicitud)}
                </p>

                <button type="button" data-ver-solicitud="${escaparHTML(solicitud.id)}">
                    Ver seguimiento
                </button>
            </div>
        `;

        contenedor.appendChild(tarjeta);

    });

}

document.addEventListener("click", event => {

    const boton = event.target.closest("[data-ver-solicitud]");

    if (!boton) return;

    abrirSeguimiento(boton.dataset.verSolicitud);

});


/* =====================================================
   13. SEGUIMIENTO DE SOLICITUD
===================================================== */

function abrirSeguimiento(id) {

    const solicitud = solicitudes.find(item => item.id === id);

    if (!solicitud) {
        alert("No encontramos esta solicitud.");
        return;
    }

    if (
        !usuarioActual ||
        (
            solicitud.cliente.correo !== usuarioActual.correo &&
            usuarioActual.rol !== "artista"
        )
    ) {
        alert("No tienes permiso para consultar esta solicitud.");
        return;
    }

    solicitudSeleccionada = id;

    $("#estadoDibujo").textContent = solicitud.estado;

    $("#fechaSolicitud").textContent = solicitud.fechaSolicitud;

    $("#fechaEntrega").textContent =
        solicitud.fechaEntrega || "Pendiente";

    $("#mensajeArtista").textContent =
        solicitud.mensajeArtista || "Todavía no hay mensajes.";

    mostrarPantalla("seguimiento");

}


/* =====================================================
   14. CREAR NOTIFICACIONES
===================================================== */

function crearNotificacion(titulo, mensaje, solicitudId = "") {

    const nuevaNotificacion = {

        id: generarId(),

        titulo,
        mensaje,

        solicitudId,

        fecha: fechaActual(),

        leida: false

    };

    notificaciones.unshift(nuevaNotificacion);

    guardarNotificaciones();

    mostrarNotificaciones();

}


/* =====================================================
   15. MOSTRAR NOTIFICACIONES
===================================================== */

function mostrarNotificaciones() {

    const contenedor = $("#listaNotificaciones");

    if (!contenedor) return;

    if (notificaciones.length === 0) {

        contenedor.innerHTML = "<p>No tienes notificaciones nuevas.</p>";

        return;
    }

    contenedor.innerHTML = "";

    notificaciones.forEach(notificacion => {

        const elemento = document.createElement("article");

        elemento.innerHTML = `
            <h3>${escaparHTML(notificacion.titulo)}</h3>

            <p>${escaparHTML(notificacion.mensaje)}</p>

            <small>${escaparHTML(notificacion.fecha)}</small>

            ${
                notificacion.solicitudId
                ? `<button type="button" data-ver-solicitud="${escaparHTML(notificacion.solicitudId)}">
                    Consultar solicitud
                   </button>`
                : ""
            }
        `;

        contenedor.appendChild(elemento);

    });

}


/* =====================================================
   16. PANEL PRIVADO DE ARTISTA
===================================================== */

function mostrarPanelArtista() {

    if (!usuarioActual || usuarioActual.rol !== "artista") {
        alert("No tienes autorización para acceder al panel de artista.");
        return;
    }

    const pendientes = solicitudes.filter(
        item => item.estado === "Pendiente"
    ).length;

    const aceptadas = solicitudes.filter(
        item => item.estado === "Aceptada" || item.estado === "En proceso"
    ).length;

    const terminadas = solicitudes.filter(
        item => item.estado === "Terminada"
    ).length;

    $("#totalSolicitudes").textContent = solicitudes.length;

    $("#solicitudesPendientes").textContent = pendientes;

    $("#solicitudesAceptadas").textContent = aceptadas;

    $("#solicitudesTerminadas").textContent = terminadas;

    const contenedor = $("#listaAdminSolicitudes");

    if (!contenedor) return;

    if (solicitudes.length === 0) {

        contenedor.innerHTML = "<p>Aún no se han recibido solicitudes.</p>";

        return;
    }

    contenedor.innerHTML = "";

    solicitudes.forEach(solicitud => {

        const tarjeta = document.createElement("article");

        tarjeta.className = "tarjeta-categoria";

        tarjeta.style.padding = "20px";
        tarjeta.style.marginBottom = "15px";

        tarjeta.innerHTML = `
            <h3>${escaparHTML(solicitud.titulo)}</h3>

            <p>
                Cliente:
                ${escaparHTML(solicitud.cliente.nombre)}
                ${escaparHTML(solicitud.cliente.apellidos)}
            </p>

            <p>
                Correo:
                ${escaparHTML(solicitud.cliente.correo)}
            </p>

            <p>
                Categoría:
                ${escaparHTML(solicitud.categoria)}
            </p>

            <p>
                Estado:
                ${escaparHTML(solicitud.estado)}
            </p>

            <button type="button" data-administrar="${escaparHTML(solicitud.id)}">
                Administrar solicitud
            </button>
        `;

        contenedor.appendChild(tarjeta);

    });

}


/* =====================================================
   17. ABRIR ADMINISTRACIÓN DE UNA SOLICITUD
===================================================== */

document.addEventListener("click", event => {

    const boton = event.target.closest("[data-administrar]");

    if (!boton) return;

    if (!usuarioActual || usuarioActual.rol !== "artista") {
        alert("Acceso exclusivo para la artista.");
        return;
    }

    const solicitud = solicitudes.find(
        item => item.id === boton.dataset.administrar
    );

    if (!solicitud) return;

    solicitudSeleccionada = solicitud.id;

    $("#datosSolicitudAdmin").innerHTML = `
        <h3>${escaparHTML(solicitud.titulo)}</h3>

        <p>
            Cliente:
            ${escaparHTML(solicitud.cliente.nombre)}
            ${escaparHTML(solicitud.cliente.apellidos)}
        </p>

        <p>
            Correo:
            ${escaparHTML(solicitud.cliente.correo)}
        </p>

        <p>
            Categoría:
            ${escaparHTML(solicitud.categoria)}
        </p>

        <p>
            Descripción:
            ${escaparHTML(solicitud.descripcion)}
        </p>

        <p>
            Estilo:
            ${escaparHTML(solicitud.estilo)}
        </p>

        <p>
            Imagen de referencia:
            ${escaparHTML(solicitud.nombreImagen || "No adjuntada")}
        </p>
    `;

    $("#adminEstado").value = solicitud.estado;

    $("#adminFechaEntrega").value = solicitud.fechaEntrega || "";

    $("#adminMensaje").value = solicitud.mensajeArtista || "";

    mostrarPantalla("administrar");

});


/* =====================================================
   18. ACTUALIZAR SOLICITUD DESDE EL PANEL ARTISTA
===================================================== */

const formAdministrar = $("#formAdministrarSolicitud");

if (formAdministrar) {

    formAdministrar.addEventListener("submit", event => {

        event.preventDefault();

        if (!usuarioActual || usuarioActual.rol !== "artista") {
            alert("No tienes autorización para realizar estos cambios.");
            return;
        }

        const solicitud = solicitudes.find(
            item => item.id === solicitudSeleccionada
        );

        if (!solicitud) {
            alert("No se encontró la solicitud.");
            return;
        }

        const estadoAnterior = solicitud.estado;

        const nuevoEstado = $("#adminEstado").value;

        const nuevaFecha = $("#adminFechaEntrega").value;

        const nuevoMensaje = $("#adminMensaje").value.trim();

        if (nuevaFecha) {

            const fechaElegida = new Date(nuevaFecha + "T00:00:00");

            const hoy = new Date();

            hoy.setHours(0, 0, 0, 0);

            if (fechaElegida < hoy) {
                alert("La fecha de entrega no puede estar en el pasado.");
                return;
            }

        }

        solicitud.estado = nuevoEstado;

        solicitud.fechaEntrega = nuevaFecha;

        solicitud.mensajeArtista = nuevoMensaje;

        if (!guardarDatos(CLAVE_SOLICITUDES, solicitudes)) {
            return;
        }

        if (estadoAnterior !== nuevoEstado || nuevaFecha || nuevoMensaje) {

            crearNotificacion(
                "Actualización de tu dibujo",
                "Tu solicitud ahora está en estado: " +
                nuevoEstado +
                (nuevaFecha ? ". Fecha estimada: " + nuevaFecha : "") +
                (nuevoMensaje ? ". Mensaje: " + nuevoMensaje : ""),
                solicitud.id
            );

        }

        alert("La solicitud se actualizó en esta sesión.");

        mostrarPanelArtista();

        mostrarPantalla("admin");

    });

}


/* =====================================================
   19. MODO OSCURO Y MODO CLARO
===================================================== */

function cambiarTema() {

    document.body.classList.toggle("modo-claro");

    const modoClaro = document.body.classList.contains("modo-claro");

    try {
        sessionStorage.setItem(
            "andyartis_tema",
            modoClaro ? "claro" : "oscuro"
        );
    } catch (error) {
        console.warn("No se pudo guardar el tema.", error);
    }

}

function cargarTema() {

    const tema = sessionStorage.getItem("andyartis_tema");

    if (tema === "claro") {
        document.body.classList.add("modo-claro");
    }

}

$("#btnTema")?.addEventListener("click", cambiarTema);

$("#btnCambiarTema")?.addEventListener("click", cambiarTema);


/* =====================================================
   20. CERRAR SESIÓN
===================================================== */

const botonCerrarSesion = $("#btnCerrarSesion");

if (botonCerrarSesion) {

    botonCerrarSesion.addEventListener("click", () => {

        if (!usuarioActual) return;

        const confirmar = confirm(
            "¿Estás seguro de que deseas cerrar sesión?"
        );

        if (!confirmar) return;

        usuarioActual = null;

        fotoPerfilActual = null;

        archivoReferenciaActual = null;

        $("#formLogin")?.reset();

        actualizarEncabezado();

        alert("Has cerrado la sesión de demostración.");

        mostrarPantalla("bienvenida");

    });

}


/* =====================================================
   21. CARGAR INFORMACIÓN INICIAL
===================================================== */

function iniciarAndyartis() {

    solicitudes = leerDatos(CLAVE_SOLICITUDES, []);

    notificaciones = leerDatos(CLAVE_NOTIFICACIONES, []);

    usuarioActual = null;

    cargarTema();

    actualizarEncabezado();

    mostrarNotificaciones();

    mostrarPantalla("bienvenida");

    console.log("Andyartis se ha iniciado correctamente.");

}

iniciarAndyartis();


/* =====================================================
   FIN DEL JAVASCRIPT DE ANDYARTIS
===================================================== */
