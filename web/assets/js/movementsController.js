/*========================================================================================================
    |   MOVEMENTS CONTROLLER
    |   Autor: SERGIO ARIAS BLANCO 2ºDAW
==========================================================================================================
    |   Controlador de la operativa CRUD de movimientos.
    |   Gestiona la visualización y la interacción con la interfaz. 
==========================================================================================================*/

"use strict"; // Activa el modo estricto de JavaScript, que sirve para evitar errores y malas prácticas, haciendo el código más seguro y fácil de depurar. 

//URL del servicio REST que maneja los eventos
const SERVICE_URL = "http://localhost:8080/CRUDBankServerSide/webresources/movement"; 

//Constante global para formatear cantidades monetarias. 
const euroFormatter = new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR"
});


//TEMPORAL (PARA REALIZAR PRUEBAS SIN UNIÓN DE PÁGINAS)
//Guarda un valor de prueba en sessionStorage, simulando un inicio de sesión y la selección de una cuenta. 
sessionStorage.setItem("selectedAccountId", "2654785441"); 
sessionStorage.setItem("selectedAccountType", "Standard");
/*========================================================================================================
    |   FUNCIÓN MANEJADORA PARA CREAR MOVIMIENTOS
==========================================================================================================
    |   Se llama cuando el usuario pulsa el botón Create Movement
    |   Prepara la capa para introducir un nuevo movimiento.  
==========================================================================================================*/

function createMovementsHandler (){
        const movementForm = document.getElementById("movementForm");
        movementForm.reset(); // Limpia cualquier dato previo en el formulario
        const movementModal = document.getElementById("movementModal");
        document.getElementById("modalTitle").textContent = "Create Movement"; //Cambia el título de la capa
        movementModal.style.display = "flex"; //Muestra la capa
    }




/*========================================================================================================
    |   FUNCIÓN MANEJADORA PARA CANCELAR MOVIMIENTOS
==========================================================================================================
    |   Se llama cuando el usuario pulsa el botón cancel
    |   Oculta la capa y resetea los campos
==========================================================================================================*/

function cancelMovementsForm (){
        const movementModal = document.getElementById("movementModal");
        movementModal.style.display = "none"; // Oculta la capa
        /*movementForm.reset();*/ 
    }




/*========================================================================================================
    |   FUNCIÓN MANEJADORA PARA CERRAR SESIÓN
==========================================================================================================
    |   Se llama cuando el usuario pulsa el botón logout
    |   Finaliza la sesión y vuelve al login
==========================================================================================================*/

function logoutMovements (){
        sessionStorage.clear(); // Borra los datos de la sesión
        window.location.href = "index.html"; // Redirige a la página de login
    }
    



/*========================================================================================================
    |   FUNCIÓN PARA CARGAR LOS DATOS DEL USUARIO
==========================================================================================================
    |   Muestra el ID de la cuenta en la interfaz
    |   Extrae el valor del sessionStorage y lo coloca en el HTML
==========================================================================================================*/

function loadAccountFromSession() {
    const accountId = sessionStorage.getItem("accountId");
    
    if (accountId) {
        document.getElementById("accountId").textContent = accountId;
    }
}

function getSelectedAccountType(){
    const accountId = sessionStorage.getItem("selectedAccountId");
    const accountType = sessionStorage.getItem("selectedAccountType");
    return {accountId, accountType}
}


// ============================================================
// FETCH MOVEMENTS POR ACCOUNT
// ============================================================
    async function fetchMovements(accountId) {
        const response = await fetch(`${SERVICE_URL}/account/${accountId}`, {
            method: "GET",
            headers: { "Accept": "application/json" }
        });

        if (!response.ok) throw new Error("Error fetching movements");
        return await response.json();
    }
    
// ============================================================
// GENERADOR DE FILAS
// ============================================================
    function* movementRowGenerator(movements, lastMovementMap) {
        for (const movement of movements) {
            const row = document.createElement("div");
            row.className = "table-row";

            const fields = ["timestamp", "amount", "balance", "description"];
            for (const field of fields) {
                const cell = document.createElement("div");
                // FORMATEO DE FECHA
                if (field === "timestamp"){
                    const date = new Date(movement.timestamp);
                    cell.textContent = date.toLocaleString();
                }
                else if (field === "amount" || field === "balance"){
                    cell.textContent = euroFormatter.format(movement[field]);
                    cell.classList.add("text-right"); 
                }
                else {
                    cell.textContent = movement[field];
                }
                row.appendChild(cell);
            }

            // Actions
            const actions = document.createElement("div");
            actions.className = "actions";

            const isLast = lastMovementMap[movement.accountId] === movement.id;
            if (isLast) {

                actions.innerHTML = `
                <button class="icon-btn icon-btn--delete" title="Delete">
                    <svg viewBox="0 0 24 24">
                        <path d="M3 6h18" />
                        <path d="M8 6V4h8v2" />
                        <path d="M6 6l1 14h10l1-14" />
                        <path d="M10 11v6" />
                        <path d="M14 11v6" />
                    </svg>
                </button>
            `;

                const button = actions.querySelector("button");
                
                button.movement = movement;
                
                button.addEventListener("click", handleDeleteMovement);
            }

            

            row.appendChild(actions);
            yield row;
        }
    }
    
// ============================================================
// CARGA DE MOVIMIENTOS
// ============================================================
    async function loadMovements() {
        try {
            const accountId = sessionStorage.getItem("selectedAccountId");

            if (!accountId) {
                alert("No account selected. Please provide an accountId in sessionStorage.");
                return;
            }

            const movements = await fetchMovements(accountId);

            // Crear mapa con último movimiento de cada cuenta
            const lastMovementMap = {};
            movements.forEach(m => {
                lastMovementMap[m.accountId] = m.id;
            });

            movementsContainer.innerHTML = "";
            for (const row of movementRowGenerator(movements, lastMovementMap)) {
                movementsContainer.appendChild(row);
            }

            document.getElementById("totalMovements").textContent = movements.length;
            const totalBalance = calculateBalance(movements);
            document.getElementById("totalBalance").textContent = euroFormatter.format(totalBalance);

        } catch (err) {
            alert(err.message);
        }
    }
   

// ============================================================
// CREAR MOVIMIENTO
// ============================================================
 async function handleCreateMovement(event) {
    event.preventDefault();

    try {
        const amount = parseFloat(document.getElementById("amount").value);
        const description = document.getElementById("description").value;
        const accountId = sessionStorage.getItem("selectedAccountId");

        if (isNaN(amount)) throw new Error("Amount must be a number");
        if (!description) throw new Error("Description cannot be empty");
        if (!accountId) throw new Error("Account not selected");

        const movements = await fetchMovements(accountId);
                
        //const type = document.getElementById("type").value;
        const previousBalance = calculateBalance(movements);
        
        let totalBalance;
        
        if (description === "Deposit") {
            totalBalance = previousBalance + amount;
        }
        
        if (description === "Payment") {
            //Cuenta estándar 
            if (amount > previousBalance) {
                throw new Error("Saldo insuficiente. Ingrese otra cantidad menor.")
            }
            totalBalance = previousBalance - amount; 
        }

        const timestamp = new Date().toISOString();

        const movementData = {
            amount,
            balance: totalBalance,
            //balance: newBalance,
            description,
            timestamp
        };

        const response = await fetch(`${SERVICE_URL}/${accountId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(movementData)
        });

        if (!response.ok) throw new Error("Error creating movement");

        movementModal.style.display = "none";
        alert("Movimiento creado correctamente");
        loadMovements();
        

    } catch (error) {
        alert("Error: " + error.message);
    }
}
/*//////////////////////////////////////////////////////////////////////////////*/
 function handleDeleteMovement(event) {
     const button = event.currentTarget;
     const movement = button.movement;
     
     const confirmation = confirm("¿Quiere eliminar este movimiento?");
     if (!confirmation) return;
     
     deleteMovement(movement)
             .then(function () {
                 alert("Movimiento borrado correctamente");
                 loadMovements();
     })
             .catch(function (err) {
                 alert(err.message);
     });
 }
 
 
// ============================================================
// BORRAR MOVIMIENTO
// ============================================================
    async function deleteMovement(movement) {
        if (!movement) throw new Error("Movimiento inválido");

        const url = `${SERVICE_URL}/${movement.id}`;

        const response = await fetch(url, {
            method: "DELETE",
            headers: { "Accept": "application/json" }
        });

        if (!response.ok) throw new Error("Error al borrar movimiento");

        return;
        
    }
    
function calculateBalance(movements) {
    return movements.reduce(function(balance, movement) {
        if (movement.description === "Deposit") {
            return balance + movement.amount;
        }
        
        if (movement.description === "Payment") {
            return balance - movement.amount;
        }
        
        return balance;
    }, 0);
}

 function initializeMovements (){

    const movementModal = document.getElementById("movementModal");
    const movementForm = document.getElementById("movementForm");
    const btnCreateMovement = document.getElementById("btnCreateMovement");
    const btnCancel = document.getElementById("btnCancel");
    const btnLogout = document.getElementById("btnLogout");
    const movementsContainer = document.getElementById("movementsContainer");
    movementForm.addEventListener("submit", handleCreateMovement);
    // ============================================================
    // BOTONES MODAL
    // ============================================================

    btnCreateMovement.addEventListener("click", createMovementsHandler);

    btnCancel.addEventListener("click", cancelMovementsForm);

    btnLogout.addEventListener("click", logoutMovements);
    
    //TEMPORAL PARA MOSTRAR EL ID DE LA CUENTA EN LA PÁGINA DE MOVIMIENTOS
    const accountId = sessionStorage.getItem("selectedAccountId");
    const accountType = sessionStorage.getItem("selectedAccountType");
    
    if (accountId) {
        document.getElementById("accountId").textContent = `${accountType} (${accountId})`;  
    }

    loadMovements();
}
document.addEventListener("DOMContentLoaded", initializeMovements);
