/*---------------------------------------------------------
    |   Autor: Clara Montaño Rodríguez
    |   Última modificación: 12/01/2026
-----------------------------------------------------------
    |   CONTROLLER - ACCOUNTS (DEMO CUSTOMER)
    |
    |   - Obtiene TODAS las cuentas del servidor
    |   - Filtra por customerId en el controller
    |   - Genera contenido dinámico con function*
---------------------------------------------------------*/


"use strict"; //Activa el modo estricto de JavaScript.


/*
================================================================================
   DEMO CUSTOMER (SIMULACIÓN DE SESIÓN)
================================================================================
*/
sessionStorage.setItem("customer.id", "1234567890");
sessionStorage.setItem("userName", "Account")
/*
================================================================================
   CONSTANTES
================================================================================
*/
const CUSTOMER_ID = sessionStorage.getItem("customer.id").replace(/[,.]/g, "");
const SERVICE_URL =
    "http://localhost:8080/CRUDBankServerSide/webresources/account";
let accounts = [];


/*
================================================================================
   CREATE / EDIT ACCOUNT - ELEMENTOS DOM
================================================================================
    |   Elementos del DOM relacionados con la creación y edición de cuentas
    |   Se reutiliza el mismo modal para CREATE y EDIT
    |   Se accede a los inputs para:
    |       - Leer valores introducidos por el usuario
    |       - Bloquear / habilitar campos según el tipo de cuenta
    |       - Rellenar datos cuando se edita una cuenta
*/
const btnCreateAccount = document.getElementById("btnCreateAccount");
const accountModal = document.getElementById("accountModal");
const accountForm = document.getElementById("accountForm");
const modalTitle = document.getElementById("modalTitle");

const inputAccountId = document.getElementById("accountId");
const inputDescription = document.getElementById("description");
const inputType = document.getElementById("type");
const inputBeginBalance = document.getElementById("beginBalance");
const inputCreditLine = document.getElementById("creditLine");
const btnCancel = document.getElementById("btnCancel");


/*
================================================================================
   ESTADO DEL MODAL
================================================================================
    |   Variable de control del estado del formulario
    |   false  -> El modal está en modo CREATE
    |   true   -> El modal está en modo EDIT
    |   Se utiliza para:
    |       - Decidir qué acción ejecutar al hacer submit
    |       - Cambiar el comportamiento del formulario
    |       - Bloquear o permitir campos según el caso
*/
let isEditMode = false;


/*
================================================================================
   INIT
================================================================================
    |   La función init se encarga de inicializar la página cuando el DOM está cargado.
*/

document.addEventListener("DOMContentLoaded", init);

async function init() {
    initMessageModal();
    loadUserFromSession();

    btnCreateAccount.addEventListener("click", openCreateAccount);
    btnCancel.addEventListener("click", closeAccountModal);
    accountForm.addEventListener("submit", submitAccountForm);
    inputType.addEventListener("change", handleTypeChange);

    await loadAccounts();
}


/*
================================================================================
   USER (SESSION STORAGE)
================================================================================
    |   Usuario desde sessionStorage
    |   Lee el nombre del usuario guardado al hacer login
    |   Lo muestra en la vista
*/
function loadUserFromSession() {
    const userName = sessionStorage.getItem("userName");
    if (userName) {
        document.getElementById("userName").textContent = userName;
    }
}

/* 
================================================================================
   FETCH ACCOUNTS (JSON)
================================================================================
    |   Fetch de cuentas (JSON)
    |   Hace una petición GET al servidor
    |   Pide explícitamente los datos en formato JSON
    |   Usamos async para hacer más legible el código evitando el uso de muchos .then()
*/
async function fetchAccounts() {
    const response = await fetch(SERVICE_URL, {
        method: "GET",
        headers: {
            "Accept": "application/json"
        }
    });

    if (!response.ok) {
        throw new Error("Error al obtener las cuentas");
    }

    return await response.json();
}
/*
================================================================================
   FUNCIÓN GENERADORA
================================================================================
    |   Produce elementos uno a uno usando yield
    |   Permite generar filas dinámicamente
    |   No crea todo de golpe
    |   for() -> Recorre el array de cuentas recibido del servidor
*/
function* accountRowGenerator(accounts) {
    for (const account of accounts) {

        const row = document.createElement("div");
        row.className = "table-row";

        const fields = [
            "id",
            "description",
            "type",
            "balance",
            "beginBalance",
            "creditLine"
        ];

        for (const field of fields) {
            const cell = document.createElement("div");
            cell.className = "table-cell";

            // 🔑 CAMBIO CLAVE: el tipo se deduce del creditLine
            if (field === "type") {
                cell.textContent = account.creditLine > 0
                    ? "CREDIT"
                    : "STANDARD";
            } else {
                cell.textContent = account[field];
            }

            row.appendChild(cell);
        }

        const actionsCell = document.createElement("div");
        actionsCell.className = "actions";

        actionsCell.innerHTML =
            `<button 
                class="icon-btn icon-btn--edit"
                data-account-id="${account.id}"
                title="Edit"
            >
                <i class="fa-regular fa-pen-to-square"></i>
            </button>

            <button 
                class="icon-btn icon-btn--delete"
                data-account-id="${account.id}"
                title="Delete"
            >
                <svg viewBox="0 0 24 24">
                    <path d="M3 6h18" />
                    <path d="M8 6V4h8v2" />
                    <path d="M6 6l1 14h10l1-14" />
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                </svg>
            </button>`;

        row.appendChild(actionsCell);

        let buttons = actionsCell.getElementsByTagName("button");

        for (const but of buttons) {
            if (but.classList.contains("icon-btn--delete")) {
                but.addEventListener("click", deleteAccount);
            }

            if (but.classList.contains("icon-btn--edit")) {
                but.addEventListener("click", editAccount);
            }
        }

        yield row;
    }
}

/*
================================================================================
   BUILD VIEW (EQUIVALENTE A <tbody>)
================================================================================
    |   Construcción de la vista (tbody)
    |   Obtiene datos -> const accounts
    |   Prepara el contenedor -> const container
    |   Usa la función generadora -> const generator
*/
async function loadAccounts() {
    try {
        accounts = await fetchAccounts();
        const container = document.getElementById("accountsContainer");
        container.innerHTML = "";

        for (const row of accountRowGenerator(accounts)) {
            container.appendChild(row);
        }
    } catch (error) {
        showMessage("Error", error.message);
    }
}


/*
================================================================================
   CREATE ACCOUNT
================================================================================
    |   Abre el modal en modo CREAR cuenta
    |   Inicializa el formulario con valores por defecto
    |   Desactiva campos que no deben modificarse
*/
function openCreateAccount() {
    isEditMode = false;
    modalTitle.textContent = "Create Account";
    accountForm.reset();

    inputAccountId.value = "";
    inputBeginBalance.value = 0;
    inputBeginBalance.disabled = true;

    inputType.disabled = false;
    inputCreditLine.disabled = true;

    accountModal.style.display = "flex";
}


/*
================================================================================
   EDIT ACCOUNT
================================================================================
    |   Abre el modal en modo EDICIÓN
    |   Obtiene la cuenta seleccionada a partir de su id
    |   Rellena el formulario con los datos existentes
    |   Bloquea los campos que no deben modificarse
*/
function editAccount(event) {
    const accountId = event.currentTarget.dataset.accountId;
    const account = accounts.find(acc => acc.id == accountId);

    if (!account) {
        showMessage("Error", "Cuenta no encontrada");
        return;
    }

    isEditMode = true;
    modalTitle.textContent = "Edit Account";

    inputAccountId.value = account.id;
    inputDescription.value = account.description;
    inputType.value = account.type;
    inputBeginBalance.value = account.beginBalance;
    inputCreditLine.value = account.creditLine;

    inputBeginBalance.disabled = true;
    inputType.disabled = true;

    handleTypeChange();
    accountModal.style.display = "flex";
}


/*
================================================================================
   SUBMIT CREATE / EDIT
================================================================================
    |   Gestiona el envío del formulario del modal
    |   Valida los datos introducidos por el usuario
    |   Decide si se crea o se edita una cuenta según el estado del modal
    |   Realiza la llamada REST correspondiente (POST o PUT)
    |   Muestra mensajes de éxito o error y recarga la tabla
*/
/*
================================================================================
   SUBMIT CREATE / EDIT
================================================================================
*/
async function submitAccountForm(event) {
    event.preventDefault();

    const description = inputDescription.value.trim();
    const type = inputType.value;
    let creditLine = 0;

    if (!description) {
        showMessage("Error", "La descripción es obligatoria");
        return;
    }

    // ============================
    // TRADUCIR SELECTOR A CREDITLINE
    // ============================
    if (type === "CREDIT") {
        creditLine = parseInt(inputCreditLine.value, 10);

        if (isNaN(creditLine) || creditLine <= 0) {
            showMessage("Error", "La línea de crédito debe ser mayor que 0");
            return;
        }
    } else {
        creditLine = 0;
    }


    try {
        let response;

        if (isEditMode) {
            response = await fetch(SERVICE_URL, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: inputAccountId.value,
                    description: description,
                    beginBalance: inputBeginBalance.value,
                    balance: accounts.find(a => a.id == inputAccountId.value).balance,
                    creditLine: creditLine,
                    customerId: CUSTOMER_ID
                })
            });
        } else {
            // ============================
            // CREATE - PAYLOAD CORRECTO
            // ============================
            const payload = {
                id: Math.floor(Math.random() * 100000000),
                description: description,
                balance: 0,
                creditLine: creditLine,
                beginBalance: 0,
                beginBalanceTimestamp: new Date().toISOString().split(".")[0] + "Z",


                type: type,

                customers: [
                    { id: parseInt(CUSTOMER_ID, 10) }
                ]
            };

            response = await fetch(SERVICE_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
        }

        if (!response.ok) {
            throw new Error("Error al guardar la cuenta");
        }

        closeAccountModal();
        showMessage(
            "Cuenta guardada",
            isEditMode
                ? "La cuenta se ha actualizado correctamente"
                : "La cuenta se ha creado correctamente"
        );

        await loadAccounts();

    } catch (error) {
        showMessage("Error", error.message);
    }
}



/*
================================================================================
   DELETE ACCOUNT / DELETE
================================================================================
    |   Gestiona la eliminación de una cuenta desde la tabla
    |   Obtiene el ID de la cuenta a partir del botón pulsado
    |   Muestra una confirmación previa al borrado
    |   Realiza la llamada DELETE al servicio REST
    |   Controla el error cuando la cuenta tiene movimientos
    |   Muestra mensajes de éxito o error y recarga la tabla
*/
async function deleteAccount(event) {
    const accountId = event.currentTarget.dataset.accountId;

    showConfirm(
        "Eliminar cuenta",
        `¿Seguro que deseas eliminar la cuenta ${accountId}?`,
        async function () {
            try {
                const response = await fetch(
                    `${SERVICE_URL}/${accountId}`,
                    { method: "DELETE" }
                );

                if (response.status === 409) {
                    throw new Error(
                        "No se puede eliminar la cuenta porque tiene movimientos"
                    );
                }

                if (!response.ok) {
                    throw new Error("Error al eliminar la cuenta");
                }

                showMessage("Cuenta eliminada", "Cuenta eliminada correctamente");
                await loadAccounts();

            } catch (error) {
                showMessage("Error", error.message);
            }
        }
    );
}



/*
================================================================================
   UTILIDADES MODAL
================================================================================
    |   Funciones auxiliares del modal de creación / edición de cuentas
    |   Controlan la apertura, cierre y comportamiento dinámico del formulario
    |   No realizan llamadas al servidor
    |   Solo gestionan la interfaz de usuario (UI)
*/
function closeAccountModal() {
    accountModal.style.display = "none";
}

function handleTypeChange() {
    if (inputType.value === "CREDIT") {
        inputCreditLine.disabled = false;
    } else {
        inputCreditLine.value = "";
        inputCreditLine.disabled = true;
    }
}


/*
================================================================================
   MESSAGE ERROR / CONFIRMACIÓN (CAPA)
================================================================================
    |   Sistema de mensajes reutilizable para toda la aplicación
    |   Sustituye a alert() y confirm() del navegador
    |   Muestra mensajes de error, información y confirmación
    |   Se presenta como una capa centrada (overlay)
    |   No accede al servidor ni modifica datos
*/
let messageOverlay;
let messageTitle;
let messageText;
let btnConfirm;
let btnCloseMessage;

function initMessageModal() {
    messageOverlay = document.getElementById("messageOverlay");
    messageTitle = document.getElementById("messageTitle");
    messageText = document.getElementById("messageText");
    btnConfirm = document.getElementById("btnConfirm");
    btnCloseMessage = document.getElementById("btnCloseMessage");

    btnCloseMessage.addEventListener("click", closeMessage);
}

function showMessage(title, text) {
    messageTitle.textContent = title;
    messageText.textContent = text;
    btnConfirm.style.display = "none";
    messageOverlay.style.display = "flex";
}

function showConfirm(title, text, onConfirm) {
    messageTitle.textContent = title;
    messageText.textContent = text;
    btnConfirm.style.display = "inline-block";

    // ✅ Necesario: evita “onConfirm is not a function”
    btnConfirm.onclick = async function () {
        closeMessage();
        if (typeof onConfirm === "function") {
            await onConfirm();
        }
    };

    messageOverlay.style.display = "flex";
}

function closeMessage() {
    messageOverlay.style.display = "none";
    btnConfirm.style.display = "none";
    btnConfirm.onclick = null;
}