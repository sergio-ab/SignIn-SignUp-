// Función para mostrar mensajes globales de éxito/error
function showResponseMessage(message, type) {
  //obtenemos el elemento <div> con id "responseMsg" que sirve para mostrar mensajes
  const msgBox = document.getElementById("responseMsg");
  //cambiamos el contenido de texto del cuadro a lo que queramos mostrar
  msgBox.textContent = message;
  //asignamos la clase segun el tipo de mensaje, algo que permite cambiar el color con css
  msgBox.className = type ? type + " show" : ""; // 'success' o 'error'
  //si hay mensaje, lo mostramos y si no, lo ocultamos. 
  msgBox.style.display = message ? "block" : "none";
}

// Función auxiliar para mostrar/ocultar mensajes de error a cada campo
function showError(id, message) {
  //obtenemos el <span> que se encuentra junto al input, usando su id
  const span = document.getElementById(id);
  //ponemos el texto de error en ese <span>
  span.textContent = message;
  //si hay mensaje se muestra y si no, se oculta
  span.style.display = message ? "block" : "none";
}

//validación y envío del formulario
//función que se ejecuta cuando hacemos click en "signIn"
function handleSignInOnClick(event) {
  try {
    //obtenemos los inputs de email y de contraseña
    const tfEmail = document.getElementById("email");
    const tfPassword = document.getElementById("password");
    //obtenemos el formulario completo
    const signInForm = document.getElementById("signInForm");

    //expresión regular que se utiliza para verificar que el email tenga el formato correcto
    const emailRegExp = new RegExp("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$");

    //evitamos que el formulario se envíe de forma automática y recargue la página
    event.preventDefault();
    event.stopPropagation();

    //limpiamos los errores anteriores en los campos
    showError("error-email", "");
    showError("error-password", "");

    showResponseMessage("",""); //limpiar el mensaje global

    /*
    document.getElementById("error-email").textContent = "";
    document.getElementById("error-password").textContent = "";
    */
    //validamos que los campos no estén vacíos
    if (tfEmail.value.trim() === "" || tfPassword.value.trim() === "")
      throw new Error("Email and password must be filled.");

    //validmaos que la longitud máxima sea de 255 caracteres
    if (tfEmail.value.length > 255)
      throw new Error("Email cannot have more than 255 characters.");
    if (tfPassword.value.length > 255)
      throw new Error("Password cannot have more than 255 characters.");

    //validamos el formato del email con la expresión regular
    if (!emailRegExp.exec(tfEmail.value.trim()))
      throw new Error("Email has not a valid format.");

    //si todo es correcto, se llama a la funcion que hace la petición al servidor
    sendRequestAndProcessResponse();

  } catch (error) {
    //si ocurre un error, se determina a que campo pertenece y se muestra el mensaje
    if (error.message.toLowerCase().includes("email")) {
      /*document.getElementById("error-email").textContent = error.message;*/
      showError("error-email", error.message);
    } else if (error.message.toLowerCase().includes("password")) {
      /*document.getElementById("error-password").textContent = error.message;*/
      showError("error-password", error.message);
    } else {
      //para cualquier otro error general
      /*document.getElementById("error-password").textContent = error.message;*/
      showError("error-password", error.message);
    }
  }
}


// Petición GET al servidor y manejo de respuestas
function sendRequestAndProcessResponse() {
  //se obtiene el formulario y los campos de email y contraseña
  const signInForm = document.getElementById("signInForm");
  const tfEmail = document.getElementById("email");
  const tfPassword = document.getElementById("password");

  //guarda los valores limpios (sin espacios en blanco al inicio o al final)
  const valueTfEmail = tfEmail.value.trim();
  const valueTfPassword = tfPassword.value.trim();

  //usamos fetch para hacer la petición de GET al servidor
  fetch(
    signInForm.action +
      `${encodeURIComponent(valueTfEmail)}/${encodeURIComponent(valueTfPassword)}`,
    {
      method: "GET", //metodo GET
      headers: {
        "Content-Type": "application/xml",//indicamos que esperamos un XML
      },
    }
  ).then((response) => {
      // Verificar que hay conexión con servidor y se lanzan los errores correspondientes
      if (!response.ok) {
        if (response.status === 401) throw new Error("Wrong credentials!!");
        else if (response.status === 500) throw new Error("Server Error. Please try later!!");
        else throw new Error("Failed to fetch from server!");
      }
      return response;
    })
    .then(() => {
      //si sale bien, mostramos el mensaje de exito de inicio
      /*document.getElementById("error-password").textContent =
        "Customer signed in successfully!";*/
      showResponseMessage("Customer signed in successfully!", "success");
      setTimeout(() => {
      window.location.href = 'main.html';
      }, 500);
    })
    .catch((error) => {
      //si sale cualquier error, se muestra en el mensaje global en rojo
      /*document.getElementById("error-password").textContent =
        "Error: " + error.message;*/
      showResponseMessage("Error: " + error.message, "error");
    });
}

// Validar email al perder el foco
function validateEmailOnBlur() {
  try {
    const tfEmail = document.getElementById("email");
    const emailRegExp = new RegExp("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$");

    if (tfEmail.value.trim() === "")
      throw new Error("Email must be filled.");
    if (tfEmail.value.length > 255)
      throw new Error("Email cannot have more than 255 characters.");
    if (!emailRegExp.exec(tfEmail.value.trim()))
      throw new Error("Email has not a valid format.");

    //si todo está correcto, borramos errores previos
    /*document.getElementById("error-email").textContent = "";*/
    showError("error-email", "");
  } catch (error) {
    /*document.getElementById("error-email").textContent = error.message;*/
    showError("error-email", error.message);
  }
}

// Validar contraseña al perder el foco
function validatePasswordOnBlur() {
  try {
    const tfPassword = document.getElementById("password");

    if (tfPassword.value.trim() === "")
      throw new Error("Password must be filled.");
    if (tfPassword.value.length > 255)
      throw new Error("Password cannot have more than 255 characters.");

    //si está correcto, se borran los errores previos
    /*document.getElementById("error-password").textContent = "";*/
    showError("error-password", "");
  } catch (error) {
    /*document.getElementById("error-password").textContent = error.message;*/
    showError("error-password", error.message);
  }
}

// Función para mostrar/ocultar la contraseña al hacer clic en el icono
function togglePasswordVisibility() {
  const passwordField = document.getElementById("password");  // Accedemos al campo de contraseña por su ID
  const icon = document.getElementById("toggle-password");     // Accedemos al icono por su ID

  // Si la contraseña está oculta, mostramos el texto; si está visible, la ocultamos
  if (passwordField.type === "password") {
    passwordField.type = "text";  // Cambiamos a texto
    icon.setAttribute("aria-label", "Ocultar contraseña");  // Cambiamos la etiqueta para accesibilidad
    icon.classList.remove("fa-eye");
    icon.classList.add("fa-eye-slash");  // Cambiamos el icono a 'ojo cerrado'
  } else {
    passwordField.type = "password";  // Volvemos a ocultar la contraseña
    icon.setAttribute("aria-label", "Mostrar contraseña");  // Actualizamos la etiqueta para accesibilidad
    icon.classList.remove("fa-eye-slash");
    icon.classList.add("fa-eye");  // Icono de 'ojo abierto'
  }
}

// Botón Cancelar: limpia campos y mensajes
function handleCancelOnClick() {
  //limpia los valores de lo inputs
  document.getElementById("email").value = "";
  document.getElementById("password").value = "";

  //limpia los mensajes de error
  /*document.getElementById("error-email").textContent = "";
  document.getElementById("error-password").textContent = "";*/
  showError("error-email", "");
  showError("error-password", "");
  //limpia cualquier mensaje global
  showResponseMessage("", "");
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 500);
}

// Asociar el clic del icono solo cuando el documento haya cargado completamente
window.onload = function() {

  const icon = document.getElementById("toggle-password");
  if (icon) {
    icon.onclick = togglePasswordVisibility;
  }
};

/*Función ToggleStyle para el cambio entre style.css y style2.css*/
/*
  Permite alternar entre el estilo principal y el alternativo.
  Guarda la preferencia en localStorage para recordar la elección del usuario.
*/

function toggleStyle(){
  const mainStyle = document.querySelector('link[href="assets/css/style.css"]');
  const altStyle = document.querySelector('link[href="assets/css/style2.css"]');

  if (altStyle.disabled){
    mainStyle.disabled = true; 
    altStyle.disabled = false;
    localStorage.setItem("activeStyle", "alt");
    console.log("Estilo alternativo activado"); 
  }

  else {
    altStyle.disabled = true; 
    mainStyle.disabled = false; 
    localStorage.setItem("activeStyle", "main");
    console.log("Estilo principal activado");
  }
}


/*
  Aplicar el estilo recordado al cargar la página.
*/

/*
    Comprueba si el usuario ya había seleccionado un estilo previamente.
    Si lo hay, lo aplica automaticamente al cargar la página.
*/

(function restoreStylePreference(){
  const active = localStorage.getItem("activeStyle");
  const mainStyle = document.querySelector('link[href="assets/css/style.css"]');
  const altStyle = document.querySelector('link[href="assets/css/style2.css"]');

  if (active === "alt") {
    mainStyle.disabled = true;
    altStyle.disabled = false; 
  }

  else {
    altStyle.disabled = true;
    mainStyle.disabled = false; 
  }
})();

// Rellenar email guardado desde SignUp
(function applySavedEmail() {
  const emailInput = document.getElementById("email");
  const savedEmail = sessionStorage.getItem("signupEmail");

  console.log("Recuperado de sessionStorage:", savedEmail);

  if (emailInput && savedEmail) {
    emailInput.value = savedEmail;

    // Poner el foco en la contraseña
    const passwordInput = document.getElementById("password");
    if (passwordInput) passwordInput.focus();

    console.log("✅ Email aplicado correctamente en SignIn");
  }
})();

