"use strict";

/*========================================================================================================
    |   MOVEMENTS CONTROLLER - CRUD MOVEMENTS
==========================================================================================================
    |   Autor: Grupo Sergio Arias Blanco
    |   Fecha: 02/02/2026
==========================================================================================================
*/

// URL del servicio REST que maneja los movimientos
const SERVICE_URL = "http://localhost:8080/CRUDBankServerSide/webresources/movement"; 

// Formateador de moneda (euros)
const euroFormatter = new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR"
});

let h5pInstance = null;

/*========================================================================================================
    |   FUNCIONES DE ACCESO A DATOS DE LA CUENTA
==========================================================================================================*/

// Función para recoger la el tipo de cuenta
function getSelectedAccount(){
    
    return sessionStorage.getItem("selectedAccount") ? JSON.parse(sessionStorage.getItem("selectedAccount")) : null;
}

// Función para recoger el balance en caso de ser cuenta Standar o de Cŕedito
function getAvailableBalance(balance){
    
    const account = getSelectedAccount();
    
    if(!account) return balance;
    
    return account.creditLine ? balance + Number(account.creditLine) : balance;
}

/*========================================================================================================
    |   FUNCIONES DE CALCULO DE BALANCE
==========================================================================================================*/

// Función para calcular el balance restante tras los movimientos
function calculateBalance(previousBalance, amount, description){
    
    amount = Number(amount) || 0;
    
    const available = getAvailableBalance(previousBalance);

    if(description === "Deposit") return previousBalance + amount;
    
    if(description === "Payment") {
        
        if(amount > available) throw new Error("Saldo insuficiente considerando la línea de crédito.");
        
        return previousBalance - amount; // El balance real se reduce solo del balance principal
    }
    return previousBalance;
}

// Calcula balances acumulados de toda la lista de movimientos 
function calculateAccumulatedBalances(movements, beginBalance) {
    
    let currentBalance = Number(beginBalance) || 0;
    
    return movements.map(m => {
        
        const amount = Number(m.amount) || 0;
        
        const desc = m.description || "";
        
        if(desc === "Deposit") currentBalance += amount;
        
        else if(desc === "Payment") currentBalance -= amount;
        
        return {...m, balance: currentBalance};
    });
}

// Actualiza balance de la cuenta en sessionStorage 
function updateAccountBalanceInSession(newBalance){
    
    const account = getSelectedAccount();
    
    if(!account) return;
    
    account.balance = newBalance;
    
    sessionStorage.setItem("selectedAccount", JSON.stringify(account));
}

/*========================================================================================================
    |   FUNCIONES PARA ACTUALIZAR CUENTA EN BACKEND (JSON)
==========================================================================================================*/
async function putAccountWithUpdatedBalance(idAccount, movements) {
    try {
        // Obtener cuenta completa en JSON
        const response = await fetch(
            `http://localhost:8080/CRUDBankServerSide/webresources/account/${idAccount}`,
            {
                method: "GET",
                headers: { "Accept": "application/json" }
            }
        );

        if (!response.ok) {
            throw new Error("No se pudo obtener la cuenta");
        }

        const account = await response.json();

        // Calcular nuevo balance
        const newBalance = movements.length
            ? Number(movements[movements.length - 1].balance)
            : Number(account.beginBalance) || 0;

        // Actualizar balance en el objeto cuenta
        account.balance = newBalance;

        // Enviar PUT con la cuenta completa en JSON
        const putResponse = await fetch(
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

        if (!putResponse.ok) {
            
            throw new Error("Error al actualizar la cuenta en backend");
        }

        // Actualizar sessionStorage
        sessionStorage.setItem("selectedAccount", JSON.stringify(account));

    } catch (err) {
        console.error(err);
        alert("Error actualizando cuenta: " + err.message);
    }
}


/*========================================================================================================
    |   FUNCIONES DE INTERFAZ
==========================================================================================================*/
function createMovementsHandler (){
    
    const movementForm = document.getElementById("movementForm");
    
    movementForm.reset();
    
    const movementModal = document.getElementById("movementModal");
    
    document.getElementById("modalTitle").textContent = "Create Movement";
    
    movementModal.style.display = "flex";
}

function cancelMovementsForm (){
    
    document.getElementById("movementModal").style.display = "none";
    
}

function logoutMovements (){
    
    window.location.href = "accounts.html";
    
}

/*========================================================================================================
    |   FUNCIONES CRUD MOVEMENTS
==========================================================================================================*/
async function fetchMovements(accountId) {
    
    const response = await fetch(`${SERVICE_URL}/account/${accountId}`, {
        method: "GET",
        headers: { "Accept": "application/json" }
    });
    
    if (!response.ok) throw new Error("Error fetching movements");
    
    return await response.json();
}

function* movementRowGenerator(movements, lastMovementMap) {
    
    for (const movement of movements) {
        
        const row = document.createElement("div");
        
        row.className = "table-row";

        const fields = ["timestamp","amount","balance","description"];
        
        for(const field of fields){
            
            const cell = document.createElement("div");
            
            if(field === "timestamp") cell.textContent = new Date(movement.timestamp).toLocaleString();
            
            else if(field === "amount" || field === "balance"){
                
                cell.textContent = euroFormatter.format(movement[field] || 0);
                
                cell.classList.add("text-right");
                
            } else cell.textContent = movement[field] || "";
            
            row.appendChild(cell);
        }

        const actions = document.createElement("div");
        
        actions.className = "actions";
        
        const isLast = lastMovementMap[movement.accountId] === movement.id;
        
        if(isLast){
            
            actions.innerHTML = `
                <button class="icon-btn icon-btn--delete" title="Delete">
                    <svg viewBox="0 0 24 24">
                        <path d="M3 6h18"/>
                        <path d="M8 6V4h8v2"/>
                        <path d="M6 6l1 14h10l1-14"/>
                        <path d="M10 11v6"/>
                        <path d="M14 11v6"/>
                    </svg>
                </button>`;
            
            const button = actions.querySelector("button");
            
            button.movement = movement;
            
            button.addEventListener("click", handleDeleteMovement);
        }
        row.appendChild(actions);
        
        yield row;
    }
}

async function loadMovements() {
    
    try {
        
        const account = getSelectedAccount();
        
        if(!account) return;

        const movements = await fetchMovements(account.id);
        
        const movementsWithBalance = calculateAccumulatedBalances(movements, account.beginBalance);

        const lastMovementMap = {};
        
        movementsWithBalance.forEach(m => lastMovementMap[m.accountId] = m.id);

        const container = document.getElementById("movementsContainer");
        
        container.innerHTML = "";
        
        for(const row of movementRowGenerator(movementsWithBalance, lastMovementMap)){
            
            container.appendChild(row);
        }

        document.getElementById("totalMovements").textContent = movements.length;
        
        const totalBalance = getAvailableBalance(
            movementsWithBalance.length
                ? movementsWithBalance[movementsWithBalance.length -1].balance
                : Number(account.beginBalance) || 0
        );

        document.getElementById("totalBalance").textContent = euroFormatter.format(totalBalance);

    } catch(err){
        
        alert(err.message);
    }
}

/* Crear movimiento */
async function handleCreateMovement(event){
    
    event.preventDefault();
    
    try{
        const account = getSelectedAccount();
        
        if(!account) throw new Error("Cuenta no seleccionada");

        const amount = parseFloat(document.getElementById("amount").value);
        
        const description = document.getElementById("description").value;

        if(isNaN(amount) || !description) throw new Error("Datos inválidos");

        const movements = await fetchMovements(account.id);
        
        const movementsWithBalance = calculateAccumulatedBalances(movements, account.beginBalance);
        
        const previousBalance = movementsWithBalance.length
            ? movementsWithBalance[movementsWithBalance.length -1].balance
            : Number(account.beginBalance) || 0;

        const newBalance = calculateBalance(previousBalance, amount, description);
        
        const timestamp = new Date().toISOString();
        
        const movementData = { amount, balance: newBalance, description, timestamp };

        const response = await fetch(`${SERVICE_URL}/${account.id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Accept": "application/json" },
            body: JSON.stringify(movementData)
        });
        
        if(!response.ok) throw new Error("Error creando movimiento");

        updateAccountBalanceInSession(newBalance);
        
        await putAccountWithUpdatedBalance(account.id, [...movementsWithBalance, movementData]);

        document.getElementById("movementModal").style.display = "none";
        
        alert("Movimiento creado correctamente");
        
        await loadMovements();

    } catch(err){
        alert("Error: " + err.message);
    }
}

/* Eliminar movimiento */
async function handleDeleteMovement(event){
    
    const button = event.currentTarget;
    
    const movement = button.movement;
    
    if(!confirm("¿Quiere eliminar este movimiento?")) return;

    try{
        // Borrar movimiento en backend
        const response = await fetch(`${SERVICE_URL}/${movement.id}`, {
            method: "DELETE",
            headers: { "Accept": "application/json" }
        });
        if(!response.ok) throw new Error("Error al borrar movimiento");

        // Recalcular balance en frontend
        const account = getSelectedAccount();
        
        const movements = await fetchMovements(account.id);
        
        const movementsWithBalance = calculateAccumulatedBalances(movements, account.beginBalance);
        
        const newBalance = movementsWithBalance.length
            ? movementsWithBalance[movementsWithBalance.length -1].balance
            : Number(account.beginBalance) || 0;

        updateAccountBalanceInSession(newBalance);
        
        await putAccountWithUpdatedBalance(account.id, movementsWithBalance);

        alert("Movimiento borrado correctamente");
        
        await loadMovements();

    } catch(err){
        alert("Error: " + err.message);
    }
}

/*========================================================================================================
    |   INICIALIZACION
==========================================================================================================*/
function initializeMovements (){
    
    const movementForm = document.getElementById("movementForm");
    
    document.getElementById("btnCreateMovement").addEventListener("click", createMovementsHandler);
    
    document.getElementById("btnCancel").addEventListener("click", cancelMovementsForm);
    
    document.getElementById("btnLogout").addEventListener("click", logoutMovements);
    
    const btnInfo = document.getElementById("btnInfo");
        if (btnInfo) {
            btnInfo.addEventListener("click", showVideoHelpMovment);
        }

    
    movementForm.addEventListener("submit", handleCreateMovement);

    // Mostrar ID de la cuenta en cabecera
    const account = getSelectedAccount();
    
    if(account) document.getElementById("accountId").textContent = `${account.type} (${account.id})`;

    loadMovements();
}

// ========================================================
// TOGGLE STYLE CRUD (Principal / Verde)
// ========================================================

// Referencias a los enlaces de estilo
const mainStyle = document.getElementById("mainStyle"); // Marrón
const altStyle = document.getElementById("altStyle");   // Verde
const btnToggleStyle = document.getElementById("btnToggleStyle");

// Solo añadir listener si el botón existe
if (btnToggleStyle) {
    btnToggleStyle.addEventListener("click", toggleCRUDStyle);
}

function toggleCRUDStyle() {
    if (!mainStyle || !altStyle) {
        console.error("Hojas de estilo no encontradas");
        return;
    }

    // Si el verde estaba activo, volvemos al marrón
    if (altStyle.disabled === false) {
        altStyle.disabled = true;
        mainStyle.disabled = false;
        localStorage.setItem("crudStyle", "main");
        console.log("Estilo principal activado");
    } else {
        // Activamos verde
        altStyle.disabled = false;
        mainStyle.disabled = true;
        localStorage.setItem("crudStyle", "green");
        console.log("Estilo verde activado");
    }
}

// Restaurar preferencia guardada
(function restoreCRUDStyle() {
    if (!mainStyle || !altStyle) return;

    var saved = localStorage.getItem("crudStyle");

    if (saved === "green") {
        altStyle.disabled = false;
        mainStyle.disabled = true;
    } else {
        altStyle.disabled = true;
        mainStyle.disabled = false;
    }
})();

/*HELP INTERACTIVE VIDEO*/
function showVideoHelpMovment() {
    const el = document.getElementById('h5p-container');
    if (!h5pInstance) {
    const options = {
        h5pJsonPath: '/NeoBank/assets/h5p-helpMovements', 
        frameJs: '/NeoBank/assets/h5p-player/frame.bundle.js',
        frameCss: '/NeoBank/assets/h5p-player/styles/h5p.css',
        librariesPath: '/NeoBank/assets/h5p-libraries' 
        };
    h5pInstance = new H5PStandalone.H5P(el, options);
        el.style.display = "flex";
        document.body.style.overflow = "hidden"; // Evita scroll al abrir
        
        // Configuramos el listener de cierre SOLO una vez al crear la instancia
        setupClickOutside();
        return;  
    }
    toggleDisplay(el);
}

function toggleDisplay(el) {
    if (window.getComputedStyle(el).display === "none") {
        el.style.setProperty("display", "flex", "important");
        document.body.style.overflow = "hidden";
    } else {
        el.style.setProperty("display", "none", "important");
        document.body.style.overflow = "auto";
    }
}

function setupClickOutside() {
    const el = document.getElementById('h5p-container');
    el.addEventListener('click', (e) => {
        if (e.target === el) {
            toggleDisplay(el);
        }
    });
}



document.addEventListener("DOMContentLoaded", initializeMovements);

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        const el = document.querySelector(".h5p-container");
        if (el && window.getComputedStyle(el).display !== "none") {
            el.style.setProperty("display", "none", "important");
            document.body.style.overflow = "auto";
        }
    }
});


