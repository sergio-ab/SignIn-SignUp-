/**
 * validation.js
 * Validación y envío del formulario SIGN UP | NEOBANK
 * Autor: Clara Montaño (estructura basada en la teoría del profesor)
 */

// ========== EVENTOS PRINCIPALES ==========
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("signupForm");
  const cancelBtn = document.getElementById("cancelBtn");

  // Activar comportamiento de mostrar/ocultar contraseña
  document.querySelectorAll(".toggle-password").forEach(icon => {
    icon.addEventListener("click", togglePasswordVisibility);
  });

  // Validación en blur (pérdida de foco)
  form.querySelectorAll("input").forEach(input => {
    input.addEventListener("focus", () => {
      input.style.backgroundColor = "#ffffff";
      clearError(input.id);
    });
    input.addEventListener("blur", () => validateField(input.id));
  });

  // Evento de envío
  form.addEventListener("submit", handleSignUp);

  // Evento cancelar
  cancelBtn.addEventListener("click", handleCancel);
});

// ========== FUNCIONES DE VALIDACIÓN ==========
function validateField(id) {
  const field = document.getElementById(id);
  const value = field.value.trim();
  const errorSpan = document.getElementById(`error-${id}`);
  let errorMsg = "";

  switch (id) {
    case "firstName":
    case "lastName":
    case "city":
      if (!/^[A-Za-z\s]+$/.test(value)) {
        errorMsg = "*Enter only letters and spaces.\n*Do not enter numbers or special characters.";
      }
      break;

    case "middleInitial":
      if (value && !/^[A-Za-z]{1}$/.test(value)) {
        errorMsg = "*Enter only one letter.\n*Do not enter numbers, spaces, or special characters.";
      }
      break;

    case "street":
      if (!/^[A-Za-z0-9\s]+$/.test(value)) {
        errorMsg = "*Enter only letters, numbers, and spaces.\n*Do not enter symbols or special characters.";
      }
      break;

    case "state":
      if (!/^[A-Za-z]{2}$/.test(value)) {
        errorMsg = "*Enter only letters.\n*Do not enter numbers, spaces, or special characters.";
      }
      break;

    case "zip":
      if (!/^\d{4,10}$/.test(value)) {
        errorMsg = "*Enter only digits (4 to 10 numbers).\n*Do not enter letters, spaces, or special characters.";
      }
      break;

    case "phone":
      if (!/^\d{6,15}$/.test(value)) {
        errorMsg = "*Enter only digits (6 to 15 numbers).\n*Do not enter letters, spaces, or special characters.";
      }
      break;

    case "email":
      if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/.test(value)) {
        errorMsg = "*Enter a valid email address (e.g., user@example.com).\n*Do not enter spaces or invalid characters.";
      }
      break;

    case "password":
      if (
        !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d])([^\s]){8,}$/.test(value)
      ) {
        errorMsg =
          "*Password must have at least 8 characters, including uppercase, lowercase, numbers, and one special character.\n*Do not include spaces.";
      }
      break;

    case "confirmPassword":
      const passValue = document.getElementById("password").value.trim();
      if (value !== passValue) {
        errorMsg = "*Passwords do not match.\n*Please re-enter the same password.";
      }
      break;
  }

  if (errorMsg) {
    showError(id, errorMsg);
    return false;
  } else {
    clearError(id);
    return true;
  }
}

/**
 * Limpia mensaje de error
 */
function clearError(id) {
  const errorSpan = document.getElementById(`error-${id}`);
  if (errorSpan) {
    errorSpan.textContent = "";
    errorSpan.style.display = "none";
  }
}

/**
 * Muestra mensaje de error visual
 */
function showError(id, msg) {
  const errorSpan = document.getElementById(`error-${id}`);
  errorSpan.textContent = msg;
  errorSpan.style.display = "block";
  errorSpan.style.background = "rgba(255, 0, 0, 0.08)";
  errorSpan.style.color = "#ff4444";
  errorSpan.style.borderLeft = "3px solid #ff5555";
  errorSpan.style.padding = "4px";
  errorSpan.style.marginTop = "3px";
  errorSpan.style.borderRadius = "4px";
  errorSpan.style.animation = "fadeIn 0.3s ease-in";
} 

// ========== FUNCIONES DE COMPORTAMIENTO ==========
function togglePasswordVisibility(event) {
  const icon = event.currentTarget;
  const targetId = icon.getAttribute("data-target");
  const input = document.getElementById(targetId);

  if (input.type === "password") {
    input.type = "text";
    icon.classList.replace("fa-eye", "fa-eye-slash");
    icon.setAttribute("aria-label", "Hide password");
  } else {
    input.type = "password";
    icon.classList.replace("fa-eye-slash", "fa-eye");
    icon.setAttribute("aria-label", "Show password");
  }
}

// ========== ENVÍO DEL FORMULARIO ==========
async function handleSignUp(event) {
  event.preventDefault();
  event.stopPropagation();

  const form = document.getElementById("signupForm");
  const inputs = form.querySelectorAll("input");
  let allValid = true;

  inputs.forEach(input => {
    const valid = validateField(input.id);
    if (!valid) allValid = false;
  });

  if (!allValid) {
    alert("Please correct the highlighted errors before continuing.");
    return;
  }

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

  try {
    // Mostrar indicador de carga
    alert("Processing your registration…");

    const response = await fetch(
      "http://localhost:8080/CRUDBankServerSide/webresources/customer/signup",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customer),
      }
    );

    if (response.status === 204) {
      alert("✅ User created successfully.");
      window.location.href = "signin.html";
    } else if (response.status === 403) {
      showError("email", "*The email address already exists. Please use another one.");
      document.getElementById("email").focus();
    } else if (response.status === 500) {
      alert("❌ Server error. Please try again later or contact Customer Support (CAW).");
    } else {
      alert("⚠️ Unexpected error, please try later.");
    }
  } catch (error) {
    alert("⚠️ Unexpected error, please try later.");
    console.error(error);
  }
}

// ========== CANCELAR REGISTRO ==========
function handleCancel(event) {
  event.preventDefault();
  const confirmed = confirm("Are you sure you want to cancel the registration?");
  if (confirmed) {
    alert("Registration cancelled. Returning to the home page…");
    window.location.href = "index.html";
  }
}
