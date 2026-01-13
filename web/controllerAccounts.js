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
   CONSTANTES
================================================================================
*/
const CUSTOMER_ID = sessionStorage.getItem("customer.id");
const SERVICE_URL =
    "http://localhost:8080/CRUDBankServerSide/webresources/account";
let accounts = [];


/*
================================================================================
   DEMO CUSTOMER (SIMULACIÓN DE SESIÓN)
================================================================================
*/
sessionStorage.setItem("customer.id", "102263301");
sessionStorage.setItem("userName", "Carlos");


/*
================================================================================
   DOM
================================================================================
*/
//Este código se ejecuta cuando el HTML ya está cargado. Evitamos errores de “elemento no encontrado”
document.addEventListener("DOMContentLoaded", () => { /*ESTO A FUNCION*/
    loadUserFromSession(); //muestra el usuario
    loadAccounts(); //carga las cuentas del servidor
});

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

    //Comprobación de errores -> Comprueba si la respuesta fue correcta (status 200). 
    //Si no, lanza un error.
    if (!response.ok) {
        throw new Error("Error al obtener las cuentas");
    }

    //Convierte la respuesta del servidor en un objeto JavaScript
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

        //Fila (equivalente a <tr>)
        const row = document.createElement("div");
        row.className = "table-row";

        //Campos que se van a mostrar -> Lista de propiedades del objeto account
        const fields = [
            "id",
            "description",
            "type",
            "balance",
            "beginBalance",
            "creditLine"
        ];

        //Creación de celdas -> Crea una celda por cada campo e inserta el valor correspondiente (equivalente a <td>)
        for (const field of fields) {
            const cell = document.createElement("div");
            cell.className = "table-cell";
            cell.textContent = account[field];
            row.appendChild(cell);
        }

        /* =========================
           ACTIONS CELL
        ========================= */
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

        /* =========================
           EVENT LISTENERS
           (FORMA QUE HA PEDIDO EL PROFESOR)
        ========================= */
        let buttons = actionsCell.getElementsByTagName("button");

        for (const but of buttons) {
            if (but.classList.contains("icon-btn--delete")) {
                but.addEventListener("click", deleteAccount);
            }

            /*if (but.classList.contains("icon-btn--edit")) {
                but.addEventListener("click", editAccount);
            }*/
        }
                
        //Devuelve una fila cada vez, permite que el controller vaya insertando filas poco a poco.
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

        const accountsHTML = accountRowGenerator(accounts);

        for (const row of accountsHTML) {
            container.appendChild(row);
        }

        //Manejo básico de errores (mejorar más adelante)
    } catch (error) {
        alert(error.message);
    }
}



/*
function editAccount(event) {
    const accountId = event.currentTarget.dataset.accountId;
    alert("Edit account: " + accountId);
}
 */


function deleteAccount(event) {
    const accountId = event.target.dataset.accountId;

    if (!accountId) return;

    alert("Borrar cuenta con id: " + accountId);

    // Aquí más adelante irá el fetch DELETE
}
