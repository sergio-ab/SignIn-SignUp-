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

const accountId = sessionStorage.getItem("selectedAccountId");

/*
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
        window.location.href = "accounts.html"; // Redirige a la página de accounts
    }



/*========================================================================================================
    |   FUNCIÓN MANEJADORA DE INFORMACIÓN
==========================================================================================================
    |   Muestra información sobre el funcionamiento de la página de movimientos
==========================================================================================================*/
function showInfoBtnHandler() {
    const infoLayer = document.getElementById("infoLayer");
    infoLayer.style.display = "flex";

    // Inicializar H5P si aún no se ha cargado
    const h5pContainer = document.getElementById('h5p-container');
    if (!h5pContainer.hasChildNodes()) {
        const options = {
            h5pJsonPath: '/Test/assets/h5p-content', // Cambiar a tu ruta H5P
            frameJs: '/Test/assets/h5p-player/frame.bundle.js',
            frameCss: '/Test/assets/h5p-player/styles/h5p.css',
            librariesPath: '/Test/assets/h5p-libraries'
        };
        new H5PStandalone.H5P(h5pContainer, options);
    }
}

// Cerrar capa al hacer clic fuera del contenido
document.getElementById("infoLayer").addEventListener("click", function(event) {
    // Verificamos si el clic fue fuera del contenido de la capa
    if (event.target === this) {
        document.getElementById("infoLayer").style.display = "none";
    }
});

// Botón cerrar capa
document.getElementById("btnCloseInfoLayer").addEventListener("click", () => {
    document.getElementById("infoLayer").style.display = "none";
});





function getSelectedAccount(){
    const account = sessionStorage.getItem("selectedAccount");
    return account ? JSON.parse(account) : null;
}

function getBaseAccountBalance(movements){
    if(movements && movements.length > 0) {
        return movements[movements.length -1].balance;
    }
    const account = getSelectedAccount();
    return account ? Number(account.beginBalance) : 0;
}

function getAvailableBalance(balance){
    const account = getSelectedAccount();
    
    if(!account) return balance;
    
    if(account.creditLine && account.creditLine > 0){
        return balance + Number(account.creditLine);
    }
    
    return balance;
}

function calculateBalance(previousBalance, amount, description){
    if(description === "Deposit"){
        return previousBalance + amount;
    }
    
    if(description === "Payment"){
        if(amount > previousBalance){
            throw new Error("Saldo insuficiente. Ingrese otra cantidad menor.");
        }
        return previousBalance - amount;
    }
    
    return previousBalance;
}

function updateAccountBalanceInSession(Balance){
    const account = getSelectedAccount();
    if(!account) return;
    
    account.balance = Balance;
    
    sessionStorage.setItem(
            "selectedAccount", JSON.stringify(account)
            );
}


function getCreditLineText(){
    const account = getSelectedAccount();
    
    if(!account || !account.creditLine || account.creditLine <= 0){
        return "";
    }
    
    return `(${euroFormatter.format(account.creditLine)} crédito)`;
}



async function updateAccountBalanceInBackend(newBalance){
    const account = getSelectedAccount();
    if (!account) return;

    account.balance = newBalance;
    //console.log("Payload que voy a enviar al backend:", JSON.stringify(account, null, 2));


    const response = await fetch(
        "http://localhost:8080/CRUDBankServerSide/webresources/account",
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(account)
        }
    );
    //const text = await response.text();
    //console.log("Status:", response.status, "Response body:", text);


    if (!response.ok) {
        throw new Error("Error actualizando el balance de la cuenta");
    }

    // mantener sessionStorage consistente
    sessionStorage.setItem("selectedAccount", JSON.stringify(account));
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
            const baseBalance = getBaseAccountBalance(movements);
            const totalBalance = getAvailableBalance(baseBalance);
            const creditLineText= getCreditLineText();
            document.getElementById("totalBalance").innerHTML = euroFormatter.format(totalBalance) + (creditLineText ? `<br><small>${creditLineText}</small>` : "");

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
        const previousBalance = getBaseAccountBalance(movements);
        
        const Balance = calculateBalance(previousBalance, amount, description);
        
        let totalBalance;
        
        if (description === "Deposit") {
            totalBalance = previousBalance + amount;
        }
        
        if (description === "Payment") {
            //Cuenta estándar 
            if (amount > previousBalance) {
                throw new Error("Saldo insuficiente. Ingrese otra cantidad menor.");
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


        await updateAccountBalanceInBackend(Balance);
        updateAccountBalanceInSession(Balance);
        
        
        movementModal.style.display = "none";
        alert("Movimiento creado correctamente");
        await loadMovements();
        

    } catch (error) {
        alert("Error: " + error.message);
    }
}
/*//////////////////////////////////////////////////////////////////////////////*/
async function handleDeleteMovement(event) {
    const button = event.currentTarget;
    const movement = button.movement;

    const confirmation = confirm("¿Quiere eliminar este movimiento?");
    if (!confirmation) return;

    try {
        await deleteMovement(movement);
        
        const remainingMovements = await fetchMovements(accountId);
        const newBalance = getBaseAccountBalance(remainingMovements);

        // actualizar cuenta
        
        updateAccountBalanceInSession(newBalance);
        await updateAccountBalanceInBackend(newBalance);
        

        alert("Movimiento borrado correctamente");
        await loadMovements();

    } catch (err) {
        alert("Error: " + err.message);
    }
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

 function initializeMovements (){

    const movementModal = document.getElementById("movementModal");
    const movementForm = document.getElementById("movementForm");
    const btnCreateMovement = document.getElementById("btnCreateMovement");
    const btnCancel = document.getElementById("btnCancel");
    const btnLogout = document.getElementById("btnLogout");
    const movementsContainer = document.getElementById("movementsContainer");
    const btnInfo = document.getElementById("btnInfo");
    movementForm.addEventListener("submit", handleCreateMovement);
    // ============================================================
    // BOTONES MODAL
    // ============================================================

    btnCreateMovement.addEventListener("click", createMovementsHandler);

    btnCancel.addEventListener("click", cancelMovementsForm);

    btnLogout.addEventListener("click", logoutMovements);
    
    btnInfo.addEventListener("click", showInfoBtnHandler);
    
    //TEMPORAL PARA MOSTRAR EL ID DE LA CUENTA EN LA PÁGINA DE MOVIMIENTOS
    const accountId = sessionStorage.getItem("selectedAccountId");
    const accountType = sessionStorage.getItem("selectedAccountType");
    
    if (accountId) {
        document.getElementById("accountId").textContent = `${accountType} (${accountId})`;  
    }

    loadMovements();
}
document.addEventListener("DOMContentLoaded", initializeMovements);
