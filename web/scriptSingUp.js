/**
 ==========================================================
 Script_SignUp
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
// |   EVENTOS PRINCIPALES                                  |
// ==========================================================

  // Esperar que todo el HTML esté cargado antes de tocar el DOM
  document.addEventListener("DOMContentLoaded", () => {
    // Guardar referencias a elementos que se usarán varias veces
    const form = document.getElementById("signupForm");
    const cancelBtn = document.getElementById("cancelBtn");

    // ----------------------------------------------------------------------------
    // CONFIGURAR COMPORTAMIENTO DE LOS ICONOS DE OJO (mostrar/ocultar contraseñas)
    // ----------------------------------------------------------------------------
    document.querySelectorAll(".toggle-password").forEach(icon => {
      // Escuchar el evento "click" en cada icono de ojo
      icon.addEventListener("click", togglePasswordVisibility); 
      // Al hacer clic, se ejecuta la función que alterna entre mostrar u ocultar la contraseña
    });

    //----------------------------------------------------------------
    // CONFIGURAR VALIDACIONES AUTOMÁTICAS DE LOS CAMPOS DEL FORMILARIO
    //----------------------------------------------------------------
    form.querySelectorAll("input").forEach(input => {
      // Al hacer clic o enfocar un campo de texto (focus)
      input.addEventListener("focus", () => {
        // Cambiar el fondo del campo para indicar que está activo
        input.style.backgroundColor = "#ffffff"; 
        clearError(input.id); // Eliminar cualquier mensaje de error previo de ese campo
      });

      // Al perder el foco del campo (blur)
      input.addEventListener("blur", () => {
        // Cambiar el fondo del campo a su color original
        input.style.backgroundColor = "#ecebeb";
        validateField(input.id); // Validar el contenido introducido según las reglas definidas
      });
    });

    // ------------------------------------------------------
    // Envío del formulario (botón "Sign Up")
    // ------------------------------------------------------
    // Al intentar enviar el formulario, se ejecuta la función "handleSignUp"
    // Esta función valida todos los campos y, si son válidos, envía los datos al servidor
    form.addEventListener("submit", handleSignUp);


    // ------------------------------------------------------
    // Cancelar registro (botón "Cancel")
    // ------------------------------------------------------
    // Al hacer clic en el botón "Cancel", se ejecuta la función "handleCancel"
    // que pregunta al usuario si desea cancelar y redirige a la página principal si confirma
    cancelBtn.addEventListener("click", handleCancel);
  });


// ==========================================================
// |   FUNCIONES DE VALIDACIÓN                              |
// ==========================================================

/*************************************************************************************
 * FUNCTION VALIDATEFIELD:
 * Valida un campo específico del formulario según su ID.
 * Aplica expresiones regulares (RegExp) y reglas lógicas personalizadas.
 * @param {string} id - Identificador del campo a validar.
 * @returns {boolean} - Devuelve true si el campo es válido, false en caso contrario.
 *************************************************************************************/
function validateField(id) {
  // Obtener el campo y su valor
  const field = document.getElementById(id);
  const value = field.value.trim();
  const errorSpan = document.getElementById(`error-${id}`);
  let errorMsg = "";

  // ------------------------------------------------------
  // Reglas de validación específicas para cada campo
  // ------------------------------------------------------
  switch (id) {
    case "firstName":
    case "lastName":
    case "city":
      // Solo letras y espacios
      if (!new RegExp("^[A-Za-z\\s]+$").test(value)) {
        errorMsg = "*Enter only letters and spaces.\n*Do not enter numbers or special characters.";
      }
      break;

    case "middleInitial":
      // Solo una letra (no obligatorio)
      if (value && !new RegExp("^[A-Za-z]{1}$").test(value)) {
        errorMsg = "*Enter only one letter.\n*Do not enter numbers, spaces, or special characters.";
      }
      break;

    case "street":
      // Letras, números y espacios
      if (!new RegExp("^[A-Za-z0-9\\s]+$").test(value)) {
        errorMsg = "*Enter only letters, numbers, and spaces.\n*Do not enter symbols or special characters.";
      }
      break;

    case "state":
      // Dos letras (abreviatura tipo CA, NY)
      if (!new RegExp("^[A-Za-z]{2}$").test(value)) {
        errorMsg = "*Enter only letters.\n*Do not enter numbers, spaces, or special characters.";
      }
      break;

    case "zip":
      // 4 a 10 dígitos numéricos
      if (!new RegExp("^\\d{4,10}$").test(value)) {
        errorMsg = "*Enter only digits (4 to 10 numbers).\n*Do not enter letters, spaces, or special characters.";
      }
      break;

    case "phone":
      // 6 a 15 dígitos numéricos
      if (!new RegExp("^\\d{6,15}$").test(value)) {
        errorMsg = "*Enter only digits (6 to 15 numbers).\n*Do not enter letters, spaces, or special characters.";
      }
      break;

    case "email":
      // Formato estándar de correo electrónico
      if (!new RegExp("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[A-Za-z]{2,}$").test(value)) {
        errorMsg = "*Enter a valid email address (e.g., user@example.com).\n*Do not enter spaces or invalid characters.";
      }
      break;

    case "password":
      // Al menos una mayúscula, una minúscula, un número, un símbolo y mínimo 8 caracteres
      if (!new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z\\d])([^\\s]){8,}$").test(value)) {
        errorMsg =
          "*Password must have at least 8 characters, including uppercase, lowercase, numbers, and one special character.\n*Do not include spaces.";
      }
      break;

    case "confirmPassword":
      // Debe coincidir exactamente con el campo "password"
      const passValue = document.getElementById("password").value.trim();
      if (value !== passValue) {
        errorMsg = "*Passwords do not match.\n*Please re-enter the same password.";
      }
      break;
  }

  // ------------------------------------------------------
  // Mostrar u ocultar mensaje de error según resultado
  // ------------------------------------------------------
  if (errorMsg) {
    // Mostrar mensaje de error
    showError(id, errorMsg);
    return false;
  } else {
    // Eliminar error si el campo es válido
    clearError(id);
    return true;
  }
}


/****************************************************************************
 * FUNCTION CLEARERROR:
 * Limpia el mensaje de error asociado a un campo específico.
 * @param {string} id - Identificador del campo cuyo error se debe eliminar.
 ****************************************************************************/

function clearError(id) {
  // Busca el elemento <span> del error
  const errorSpan = document.getElementById(`error-${id}`);
  if (errorSpan) {
    // Borra el texto del mensaje de error.
    errorSpan.textContent = "";
    // // Oculta el contenedor del error
    errorSpan.style.display = "none";
  }
}

/*************************************************************
 * FUNCTION SHOWERROR
 * Muestra el mensaje de error bajo el campo correspondiente.
 * Aplica estilos visuales coherentes con el diseño NEOBANK.
 * @param {string} id - Identificador del campo con error.
 * @param {string} msg - Texto del mensaje de error.
 *************************************************************/
// Define la función llamada showError, que recibe dos datos: id (identificador del campo que tiene el error ej: email, zip...) y msg (el texto del mensaje de error a mostrar).
function showError(id, msg) {
  // Busca el elemento <span> en el HTML que corresponde a ese campo. Por ejemplo, si el id es "email", busca: <span id="error-email"></span>
  const errorSpan = document.getElementById(`error-${id}`);
  // Inserta el texto del mensaje de error dentro del <span>.
  errorSpan.textContent = msg;
  // Hace visible el mensaje de error en pantalla
  errorSpan.style.display = "block";
  // Aplica estilos visuales al mensaje:
  errorSpan.style.background = "rgba(255, 0, 0, 0.08)";
  errorSpan.style.color = "#ff4444";
  errorSpan.style.borderLeft = "3px solid #ff4d4d";
  errorSpan.style.padding = "6px 10px";
  errorSpan.style.marginTop = "4px";
  errorSpan.style.borderRadius = "4px";
  // Aplica una animación (definida en el CSS con @keyframes fadeIn)
  errorSpan.style.animation = "fadeIn 0.3s ease-in";
}


// ==========================================================
// |   FUNCIONES DE COMPORTAMIENTO (INTERFAZ DE USUARIO)    |
// ==========================================================

/******************************************************************************************
 * FUNCTION TOGGLEPASSWORDVISIBILITY
 * Alterna la visibilidad de la contraseña.
 * Cambia el tipo del input (password/text) y actualiza el icono y el atributo aria-label.
 * @param {Event} event - Evento click sobre el icono del ojo.
 ******************************************************************************************/

function togglePasswordVisibility(event) {
  // Obtener el icono y el input asociado
  // Hace referencia al icono (el elemento que generó el evento)
  const icon = event.currentTarget;
  // Obtiene el ID del campo al que controla
  const targetId = icon.getAttribute("data-target");
  // Busca el input correspondiente (por ejemplo: "password" o "confirmPassword")
  const input = document.getElementById(targetId);

  // Si la contraseña está oculta, mostrarla
  if (input.type === "password") {
    input.type = "text"; // Mostrar texto
    icon.classList.replace("fa-eye", "fa-eye-slash"); // Cambiar icono
    icon.setAttribute("aria-label", "Hide password"); // Actualizar etiqueta accesible
  } 
  // Si la contraseña está visible, ocultarla
  else {
    input.type = "password";
    icon.classList.replace("fa-eye-slash", "fa-eye");
    icon.setAttribute("aria-label", "Show password");
  }
}

// ==========================================================
// |   ENVÍO DEL FORMULARIO Y RESPUESTA DEL SERVIDOR        |
// ==========================================================

/***********************************************************************************************
 * FUNCTION HANDLESIGNUP
 * --------------------------------------------------------------------------------------------
 * Valida el formulario SIGN UP, crea el objeto JSON con los datos introducidos
 * y realiza una petición POST al servidor RESTful. 
 * Gestiona las respuestas HTTP (204, 403, 500) y muestra mensajes adecuados.
 * Usa try/catch para capturar errores de validación o conexión.
 * @param {Event} event - Evento "submit" del formulario.
 ***********************************************************************************************/

async function handleSignUp(event) {
  try {
    // ------------------------------------------------------
    // Prevenir comportamiento por defecto del formulario
    // ------------------------------------------------------
    // Evitar el envío automático del formulario
    event.preventDefault();
    // Detener la propagación del evento
    event.stopPropagation();

    // ------------------------------------------------------
    // Obtener referencias a elementos
    // ------------------------------------------------------
    // Captura el formulario principal (<form id="signupForm">) 
    const form = document.getElementById("signupForm");
    // Captura el contenedor de mensajes globales (éxito, error, info)
    const msgBox = document.getElementById("responseMsg");
    // Obtiene una lista de todos los campos <input> dentro del formulario
    const inputs = form.querySelectorAll("input");
    // Variable de control que indica si todos los campos han sido validados correctamente
    let allValid = true;

    // ------------------------------------------------------
    // Validación individual de campos
    // ------------------------------------------------------
    inputs.forEach(input => {
      const valid = validateField(input.id);
      // Si no es válido, marca el formulario como incorrecto
      if (!valid) allValid = false;
    });

    if (!allValid) {
      throw new Error("Please correct the highlighted errors before continuing.");
    }

    // ------------------------------------------------------
    // Construir objeto customer (JSON)
    // ------------------------------------------------------
    // Recoge y limpia (trim) todos los valores introducidos por el usuario
    const customer = {
      firstName: form.firstName.value.trim(),
      lastName: form.lastName.value.trim(),
      middleInitial: form.middleInitial.value.trim(),
      street: form.street.value.trim(),
      city: form.city.value.trim(),
      state: form.state.value.trim(),
      zip: form.zip.value.trim(),
      countryCode: form.countryCode.value,
      phone: form.phone.value.trim(),
      email: form.email.value.trim(),
      password: form.password.value.trim(),
    };

    // ------------------------------------------------------
    // Validar longitud y campos básicos
    // ------------------------------------------------------
    // Evita que los campos excedan la longitud máxima permitida.
    if (customer.email.length > 255)
      throw new Error("Email cannot have more than 255 characters.");
    if (customer.password.length > 255)
      throw new Error("Password cannot have more than 255 characters.");

    // ------------------------------------------------------
    // Validar formato del email con RegExp
    // ------------------------------------------------------
    // Se usa el constructor new RegExp() para verificar que el email
    // cumple con el formato estándar (usuario@dominio.extensión).
    const emailRegExp = new RegExp("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[A-Za-z]{2,}$");
    if (!emailRegExp.exec(customer.email)) {
      throw new Error("Email has not a valid format.");
    }

    // ------------------------------------------------------
    // Mostrar mensaje temporal de carga
    // ------------------------------------------------------
    // Informa al usuario que los datos se están procesando.
    msgBox.className = "info";
    msgBox.textContent = "Processing your registration...";
    msgBox.style.display = "block";

    // ------------------------------------------------------
    // Petición fetch al servidor
    // ------------------------------------------------------
    // Envía los datos del cliente al servidor NEOBANK
    // en formato JSON mediante una solicitud POST.
    const response = await fetch(
      "http://localhost:8080/CRUDBankServerSide/webresources/customer/signup",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customer),
      }
    );

    // ------------------------------------------------------
    // Procesar respuesta HTTP
    // -----------------------------------------------------
    // Dependiendo del código de estado, se muestran mensajes
    // adecuados o se lanzan errores personalizados.-
    if (response.status === 204) {
      msgBox.className = "success";
      msgBox.textContent = "✅ User created successfully!";
      setTimeout(() => (window.location.href = "signin.html"), 1500);
    } else if (response.status === 403) {
      showError("email", "*The email address already exists. Please use another one.");
      form.email.focus();
      throw new Error("Duplicate email address.");
    } else if (response.status === 500) {
      throw new Error("❌ Server error. Please try again later or contact support.");
    } else {
      throw new Error("⚠️ Unexpected error, please try later.");
    }
    
  } catch (error) {
    // ------------------------------------------------------
    // Capturar y mostrar errores (validación o conexión)
    // ------------------------------------------------------
    const msgBox = document.getElementById("responseMsg");
    msgBox.className = "error";
    msgBox.textContent = "Error: " + error.message;
    msgBox.style.display = "block";
    console.error(error);
  }
}
