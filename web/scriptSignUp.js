/*
 ==========================================================
 scriptSignUp
 Validación y envío del formulario SIGN UP | NEOBANK
 ----------------------------------------------------------
 Autor: Clara Montaño
 ----------------------------------------------------------
 Este script gestiona:
   - La validación individual de los campos del formulario.
   - La visualización de mensajes de error accesibles y coherentes.
   - La interacción de los iconos de "mostrar/ocultar contraseña".
   - El envío de datos al servidor mediante fetch() y el manejo
     de respuestas HTTP (204, 403, 500).
   - La confirmación y cancelación del registro.
 ==========================================================
*/


// ==========================================================
// |   FUNCIONES PRINCIPALES (invocadas desde HTML)         |
// ==========================================================

/*
    |  handleSignUpOnClick -> función principa, gestiona todo el proceso de envío del formulario
*/
function handleSignUpOnClick(event) { //Se ejecuta cuando se hace click en el botón Sign Up.
  try {
    //Evita elcomportamieto por defecto, detiene la propagación
    event.preventDefault();
    event.stopPropagation();

    /*
        |  Busca en el documento un elemento con el atributo id="signupForm" y lo guarda en la variable form.
        |  Permite acceder a todos los campos inputs desde el JS de la siguiente forma:
        |  form.firstName.value -> valor del campo "First Name"
        |  form.email.value -> valor del campo "Email"
    */
    const form = document.getElementById("signupForm");

    /*
        |  Busca en el documento un elemento que tenga ambas clases:
    */
    const btnSubmit = document.querySelector(".btn.accept");

    // Deshabilitar el botón durante el envío
    btnSubmit.disabled = true;

    // Validar todos los campos antes de enviar
    const inputs = form.querySelectorAll("input");
    let allValid = true;

    /*
    -------------------------------------------------------------------------------------
        |  VALIDACIÓN DE TODOS LOS CAMPOS DEL FORMULARIO
    -------------------------------------------------------------------------------------
        |  Función lambda => {...} equivale a function(input){...}
        |  inputs contiene todos los <input> del formulario: nombre, apellidos, email, etc.
        |  forEach, se recorre uno por uno.
        |  A cada uno se le aplica la función validateField() (la que valida según el tipo de campo).
        |  Si alguno devuelve false, significa que ese campo tiene error, y se marca allValid = false.
    */
    inputs.forEach(input => {
      const valid = validateField(input.id);
      if (!valid) allValid = false;
    });

    /*
    -------------------------------------------------------------------------------------
        |  COMBPROBACIÓN GLOBAL ANTES DE CONTINUAR
    -------------------------------------------------------------------------------------
        |  Si allValid es false, significa que hay errores.
        |  Se reactiva el botón (por si se había deshabilitado).
        |  Luego se lanza un throw new Error(...) para que el bloque catch lo capture
        |  y muestre un mensaje en pantalla.
    */
    if (!allValid) {
      btnSubmit.disabled = false;
      throw new Error("Please correct the highlighted errors before continuing.");
    }

    /*
    -------------------------------------------------------------------------------------
        |  CONSTRUCCIÓN DEL OBJETO CUSTOMER
    -------------------------------------------------------------------------------------
        |  Se crea un objeto JS llamado customer que agrupa todos los datos del formulario en una sola estructura.
        |  Este objeto es el que se enviará al servidor en formato JSON mediante la función fetch().
        |  Se usa .value para obtener el texto introducido por el usuario y .trim() para eliminar posibles espacios en blanco
        |  Para garantizar que los datos es´tna organizados y limpios antes de enviarlos al servidor.
    */
    const customer = {
      firstName: form.firstName.value.trim(),
      lastName: form.lastName.value.trim(),
      middleInitial: form.middleInitial.value.trim(),
      street: form.street.value.trim(),
      city: form.city.value.trim(),
      state: form.state.value.trim(),
      zip: form.zip.value.trim(),
      phone: form.phone.value.trim(),
      email: form.email.value.trim(),
      password: form.password.value.trim(),
    };
    /*
    -------------------------------------------------------------------------------------
        |  VALIDACIÓN EXTRA (GLOBAL ANTES DEL ENVÍO)
    -------------------------------------------------------------------------------------
        |  (Validación global, justo antes de enviar los datos al servidor)
        |  Es una validación de seguridad y consistencia a pesar de que después 
        |  de validará cada uno de  los campos para hacerlo visible y cómodo al usuario.
        |  Si algo falla, se lanza otro throw new Error(...).
     */

    const emailRegExp = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegExp.test(customer.email))
      throw new Error("Email has not a valid format.");
    if (customer.email.length > 255)
      throw new Error("Email cannot have more than 255 characters.");
    if (customer.password.length > 255)
      throw new Error("Password cannot have more than 255 characters.");

    /*
    -------------------------------------------------------------------------------------
        |  MOSTRAR MENSAJE DE CARGA
    -------------------------------------------------------------------------------------
        |  Se muestra una capa flotante (el <div id="responseMsg">)
        |  Usa la clase .info para que salga en azul (color informativo).
        |  Indica al usuario que el sistema está trabajando.
     */
    showMessage("Processing your registration...", "info");

    /*
    -------------------------------------------------------------------------------------
        |  ENVÍO DE DATOS AL SERVIDOR
    -------------------------------------------------------------------------------------
        |  Llama a la función que hace la petición fetch() al backend (sendRequestAndProcessResponse)
        |  Le pasa dos cosas:
        |       El objeto customer con los datos a enviar.
        |       El botón btnSubmit, para poder deshabilitarlo y evitar clics dobles mientras se procesa.
     */
    sendRequestAndProcessResponse(customer, btnSubmit);

  } catch (error) { // Si ocurre cualquier error (de validación o de conexión), el catch lo detecta.
    showMessage("Error: " + error.message, "error"); //error.message -> El texto descriptivo del error.
    console.error(error); // muestra el error en la consola del navegador (solo visible para depurar código).
  }
}


// ==========================================================
// |   FUNCIÓN CANCELAR "handleCancelOnClick"               |
// ==========================================================
function handleCancelOnClick(event) {
  event.preventDefault(); //Evitar que se envíe por defecto
  // confirm() función nativa de JS abre una ventana emergente del navegador con dos botones: 
  // “OK” y “Cancel”.
  const confirmCancel = confirm("Are you sure you want to cancel the registration?");
  if (confirmCancel) {
    // Si el usuario confirma, muestras el mensaje y rediriges.
    // Si no, no pasa nada (se queda en la página).
    showMessage("Registration cancelled. Returning to the home page...", "info");
    // setTimeout función nativa de JS que ejecuta el bloque de código despus de un tiempo determinado 1500
    // tiempo en milisegundos= 1,5 segundos, tiempo que tarda en enviarle a la página index 
    // para que de tiempo a mostrar el mensaje
    setTimeout(() => (window.location.href = "index.html"), 1500);
  }
}


// ==========================================================
// |   FUNCIONES AUXILIARES                                |
// ==========================================================
/*
    |  Enviar los datos del cliente (customer) al servidor mediante fetch()
    |  y mostrar el resultado al usuario (éxito, error del servidor o error de conexión).
    |  customer -> es el objeto con los datos del formulario (nombre, email, etc.).
    |  btnSubmit -> referencia al botón Sign Up, que se desactiva mientras se envían los datos.
*/

function sendRequestAndProcessResponse(customer, btnSubmit) {
  
  /*-------------------------------------
      |   fetch -> PETICIÓN AL SERVIDOR
  -------------------------------------*/
  /* 
      |  fetch() devuelve una promesa (Promise).
      |  Una promesa en JavaScript representa una operación asíncrona que puede tener tres estados:
      |   pending -> en curso
      |   fulfilled -> completada correctamente
      |   rejected -> falló (por error o problema de red)

      |  La cadena completa de promesas:
      |       fetch(...)        Hace la petición asíncrona
      |       .then(...)        Procesa la respuesta (si llega)
      |       .catch(...)       Captura errores lanzados o problemas de conexión
      |       .finally(...);    Ejecuta acciones finales (activar botón, limpiar, etc.)
  */
  fetch("http://localhost:8080/CRUDBankServerSide/webresources/customer", {
    method: "POST", // mediante el método POST envía datos nuevos al servidor
    headers: { "Content-Type": "application/json" }, //Especifica que el contenido es JSON.
    body: JSON.stringify(customer), // Convierte el objeto JS en texto JSON antes de enviarlo.
  })

  //------------------------------------
  // PROCESAR LA RESPUESTA DEL SERVIDOR
  //------------------------------------
  .then(function(response) {

      /* |---------------------------------
         |  CASO 1 → HTTP 204 (No Content)
         |---------------------------------
         |  Significa que el servidor ha recibido los datos correctamente 
         |  y el usuario se ha registrado con éxito.
         |  Entonces:
         |      Muestra un mensaje global verde (tipo “success”)
         |      Espera 1,5 segundos para que el usuario lo lea
         |      Redirige automáticamente a la página "signin.html"
      */
      if (response.status === 204) { 
        showMessage("User created successfully!", "success");
        // SESIONSTORAGE -> Guarda el email para autocompletar el Sign In
        sessionStorage.setItem("signupEmail", customer.email);

        // Espera 1,5 segundos y redirige al Sign In
        setTimeout(function() {
          window.location.href = "signin.html";
        }, 1500);

      /* |---------------------------------
         |  CASO 2 → HTTP 403 (Forbidden)
         |---------------------------------
         |  El servidor rechaza la petición porque el email ya existe
         |  en la base de datos (usuario duplicado).
         |  Entonces:
         |      Muestra un mensaje de error bajo el campo “Email” usando la función showError().
         |      Lanza una excepción con throw new Error() 
         |      para que el bloque .catch() muestre el mensaje global.
      */
      } else if (response.status === 403) {
        showError("email", "*The email address already exists. Please use another one.");
        throw new Error("User registration failed: Email address already exists.");

      /* |---------------------------------
         |  CASO 3 → HTTP 500 (Server Error)
         |---------------------------------
         |  El servidor ha fallado internamente (error en el backend o base de datos).
         |  Entonces:
         |      Lanza un nuevo error con un mensaje claro para el usuario.
         |      El error será capturado más adelante por el bloque .catch().
      */
      } else if (response.status === 500) {
        throw new Error("Server error. Please try again later or contact Customer Support.");

      /* |---------------------------------
         |  CASO 4 → Cualquier otro código de estado
         |---------------------------------
         |  Si la respuesta no coincide con los casos anteriores, se considera un error inesperado.
         |  Entonces:
         |      Lanza un error genérico (“Unexpected error”)
         |      Para asegurar que el .catch() lo maneje correctamente.
      */
      } else {
        throw new Error("Unexpected error, please try later.");
      }

  })

    /*
        |  .catch() -> Se ejecuta si fetch() falla (por ejemplo, no hay conexión)
        |  o si dentro del .then() se lanzó un error con throw new Error().
        |  Muestra un mensaje global en rojo para informar al usuario.
    */
  .catch(function(error) { //El parámetro error recibe el objeto del error (automáticamente proporcionado por JavaScript).
    //Declara una variable para almacenar el texto que se mostrará al usuario.
    //Se usa para personalizar el mensaje según el tipo de error.
    var userMessage;

    // Si no hay conexión o el servidor no responde
    if (error.message === "Failed to fetch") {
        // Mensaje comprensible para el usuario
      userMessage = "Cannot connect to the server. Please check your connection or try again later.";
    } else {
      userMessage = "Error: " + error.message;
    }
    // Llamada a la función showMessage() para mostrar un mensaje global apliando el estilo definido en css .msg-box.error
    showMessage(userMessage, "error");
  })

  // .finally -> se ejecuta siempre, haya éxito o error
  .finally(function() { //Abre el bloque que siempre se ejecutará, tanto si: el .then() se completó correctamente, o si el .catch() capturó un error.
    btnSubmit.disabled = false; //Vuelve a activar el botón “Sign Up”. Lo habíamos desactivado previamente
    // El .finally() se encarga de volverlo a habilitar cuando todo termina, sin duplicar formularios.
  });
}

// ==========================================================
// |   FUNCIÓN SHOWMESSAGE                                  |
// ==========================================================
/*
    |  Muestra un mensaje global (capa flotante centrada)
    |  success -> verde, error -> rojo, info -> azul.
*/

function showMessage(text, type) {
  // Busca el elemento <div id="responseMsg"> en el HTML.
  // Ese <div> es la caja del mensaje global, inicialmente invisible (display:none).
  var msgBox = document.getElementById("responseMsg");
  // Busca el <p id="responseText"> que hay dentro del div.
  // Ahí se colocará el texto del mensaje.
  var msgText = document.getElementById("responseText");

  // Inserta el texto recibido por parámetro (text) dentro del <p>.
  msgText.textContent = text;
  // plica las clases CSS: Siempre tendrá msg-box (la base del estilo).
  // Añade además el tipo (success, error o info).
  msgBox.className = "msg-box " + type;
  // Cambia el estilo de la caja para hacerla visible.
  // Antes estaba oculta (display:none).
  msgBox.style.display = "block";
}


// ==========================================================
// |   FUNCIÓN CLOSEMESSAGE                                 |
// ==========================================================
/*
    |  Oculta el cuadro de mensaje cuando el usuario hace clic en la “×”.
*/
function closeMessage() {
  // Busca la misma caja de mensaje global en el DOM.
  var msgBox = document.getElementById("responseMsg");
  // La oculta de nuevo, igual que estaba al principio. (Es lo que pasa cuando haces clic en el botón “×” del HTML:
  msgBox.style.display = "none";
}



// ==========================================================
// |   FUNCIÓN VALIDATEFIELD: VALIDACIONES POR CAMPO (onblur)                     |
// ==========================================================
/*
    |  Se usa <span> en lugar de <div> para mostrar errores breves
    |  bajo cada campo sin alterar el flujo visual del formulario.
    |  
    |  (Validación campo por campo, cuando el usuario sale del input, pierde el foco, o antes de enviar)
    |  OBJETIVO: Dar retroalimentación inmediata, campo a campo al usuario al ser un formulario largo.
    |  Se ejecuta alperder el foco ONBLUR o antes de enviar cuando se recorren los inputs con validateField().
*/

function validateField(id) {
  const field = document.getElementById(id); // Busca el campo <input> según su id (por ejemplo "email" o "zip").
  const value = field.value.trim(); // Obtiene el texto que escribió el usuario y le quita los espacios del principio y del final.
  //Inicializa una variable vacía donde se guardará el mensaje de error si el valor no cumple la validación.
  let errorMsg = "";



// =====================
// |   SWITCH          |
// =====================
/*
    |  Reglas de validación específicas
    |  Cada case define una expresión regular (RegExp) que comprueba el formato permitido.
    |  Si la validación no pasa (test(value) devuelve false), se asigna un mensaje de error.
*/

  switch (id) {
    case "firstName":
    case "lastName":
    case "city":
      if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(value))
        errorMsg = "* Enter only letters (including accents) and spaces.<br>* Do not enter numbers or special characters.";
      break;
    case "middleInitial":
      if (value && !/^[A-Za-z]{1}$/.test(value))
        errorMsg = "* Enter only one letter.<br>* Do not enter numbers, spaces, or special characters.";
      break;
    case "street":
      if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9\s/º]+$/.test(value))
        errorMsg = "* Enter only letters (including accents), numbers, spaces, '/' and 'º'.<br>* Do not enter other symbols or special characters.";
      break;

    case "state":
      if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(value))
        errorMsg = "* Enter only letters (including accents) and spaces.<br>* Do not enter numbers or special characters.";
      break;
    case "zip":
      if (!/^\d{4,10}$/.test(value))
        errorMsg = "* Enter only digits (4 to 10 numbers).<br>* Do not enter letters, spaces, or special characters.";
      break;
    case "phone":
      if (!/^\d{6,15}$/.test(value))
        errorMsg = "* Enter only digits (6 to 15 numbers).<br>* Do not enter letters, spaces, or special characters.";
      break;
    case "email":
      if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/.test(value))
        errorMsg = "* Enter a valid email address (e.g., user@example.com).<br>* Do not enter spaces or invalid characters.";
      break;
    case "password":
      if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d])([^\s]){8,}$/.test(value))
        errorMsg = "* Password must have at least 8 characters, including uppercase, lowercase, numbers, and one special character.<br>* Do not include spaces.";
      break;
    case "confirmPassword":
      const passValue = document.getElementById("password").value.trim();
      if (value !== passValue)
        errorMsg = "* Passwords do not match.<br>* Please re-enter the same password.";
      break;
  }

  if (errorMsg) { // Si hay error, se llama a showError(id, errorMsg) para mostrarlo debajo del campo.
    showError(id, errorMsg);
    return false;
  } else { // Si no hay error, se limpia el mensaje anterior con clearError(id).
    clearError(id);
    return true;
  } // El valor devuelto (true o false) permite a la función principal saber si todos los campos son válidos antes de enviar el formulario.
}

// ==========================================================
// |   FUNCIÓN SHOWERROR                                    |
// ==========================================================
/*
    |  Muestra el mensaje de error bajo el campo correspondiente.
    |  Recibe dos parámetros:
    |       id -> el identificador del campo que tiene el error (por ejemplo "email" o "zip").
    |       msg -> el texto del mensaje de error a mostrar.
    |  Busca el <span> asociado a ese campo (por ejemplo, si id = "email", buscará el elemento con id="error-email").
    |  Se ejecuta alperder el foco ONBLUR o antes de enviar cuando se recorren los inputs con validateField().
*/

function showError(id, msg) {
  const errorSpan = document.getElementById(`error-${id}`);
  if (errorSpan) { // Comprueba que el <span> existe en el HTML antes de intentar modificarlo
    errorSpan.innerHTML = msg; // Usa .innerHTML para poder interpretar etiquetas HTML dentro del mensaje, por ejemplo <br> para hacer saltos de línea.
    errorSpan.style.display = "block"; // Hace que el span se muestre (porque normalmente está oculto con display: none; cuando no hay errores).
    // Estilos aplicados dinámicamente:
    // Cada una de las siguientes líneas da estilo visual al mensaje de error, 
    // directamente desde JavaScript (sin necesidad de CSS externo).
    errorSpan.style.color = "#ff4444";
    errorSpan.style.backgroundColor = "rgba(0, 0, 0, 0.15)";
    errorSpan.style.borderLeft = "3px solid #ff5555";
    errorSpan.style.borderRadius = "6px";
    errorSpan.style.padding = "4px 6px";
    errorSpan.style.marginTop = "4px";
    errorSpan.style.transition = "all 0.3s ease"; // animación suave (fade)
  }
}


// ==========================================================
// |   FUNCIÓN CLEARERROR                                   |
// ==========================================================
/*
    |  Limpia el mensaje de error del campo cuando se corrige.
    |  Recibe un parámetro id, que es el identificador del campo que se ha validado 
    |  (por ejemplo "email" o "zip").
    |  Busca el elemento <span> donde podría haber un mensaje de error.
    |  (Por ejemplo, si id = "email", selecciona el elemento con id="error-email").
    |  Busca el <span> asociado a ese campo (por ejemplo, si id = "email", buscará el elemento con id="error-email").
*/
function clearError(id) {
  const errorSpan = document.getElementById(`error-${id}`);
  if (errorSpan) { // Comprueba que el elemento <span> existe en el HTML antes de intentar modificarlo.
    errorSpan.textContent = ""; // Usa .textContent porque en este caso no necesita interpretar etiquetas HTML.
    errorSpan.style.display = "none"; // Oculta completamente el span del mensaje de error, para que el diseño del formulario vuelva a su aspecto normal.
    errorSpan.style.borderLeft = "none"; // Elimina el borde rojo que se había aplicado al mostrar el error, devolviendo al span su estilo neutro.
  }
}



// ==========================================================
// |   FUNCIÓN TOGGLEPASSWORDVIDIBILITY                     |
// ==========================================================
/*
    |  Se ejecuta cada vez que el usuario hace clic en el icono del ojo (<i class="fa-eye"> 
    |  o <i class="fa-eye-slash">) dentro del campo de contraseña.
    |  Se le pasa el parámetro event, que contiene la información del clic:
    |  qué elemento lo provocó, en qué parte del documento ocurrió, etc.
*/

/**
 * Muestra u oculta la contraseña.
 */
function togglePasswordVisibility(event) {
  const icon = event.target; // event.target es el elemento HTML exacto que el usuario ha pulsado. En este caso, será el icono <i> del ojo.
  const targetId = icon.getAttribute("data-target"); // Se obtiene el valor del atributo data-target, que indica a qué campo de contraseña afecta el icono.
  // Busca el campo <input> correspondiente a ese targetId
  const input = document.getElementById(targetId);

  if (input.type === "password") { // Comprueba si el campo está actualmente ocultando el texto (modo contraseña).
    input.type = "text"; // Cambia el tipo del campo a text, haciendo visible la contraseña. El texto introducido ahora se mostrará sin ocultar con puntos o asteriscos.
    icon.classList.remove("fa-eye"); // Quita la clase fa-eye (ojo abierto)
    icon.classList.add("fa-eye-slash"); // Añade fa-eye-slash (ojo tachado)
    icon.setAttribute("aria-label", "Hide password"); // Cambia el texto alternativo para los lectores de pantalla a “Hide password”, indicando que si el usuario pulsa de nuevo, ocultará la contraseña.
  } else { // Caso contrario -> Si la contraseña está visible (type="text"),
    input.type = "password"; // La vuelve a ocultar (type="password")
    icon.classList.remove("fa-eye-slash"); // Quita fa-eye-slash (ojo tachado)
    icon.classList.add("fa-eye"); // Añade la clase fa-eye (ojo abierto)
    icon.setAttribute("aria-label", "Show password"); // Actualiza el texto accesible a “Show password”
  }
}