/* 
<!------------------------------------------------------------------------------
    |   Autor: Clara Montaño Rodríguez
    |   Última modificación: 08/01/2026
--------------------------------------------------------------------------------
    |   CONTROLLER
    |   
    |   
    |   
    |   
------------------------------------------------------------------------------->
 */


/* 
================================================================================
       |FUNCIÓN GENERADORA
================================================================================
 */


function* accountRowGenerator(accounts) {
    for (const account of accounts) {

        // Fila (equivalente a <tr>)
        const row = document.createElement("div");
        row.className = "grid grid--row";

        // Campos (equivalente a <td>)
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
            cell.textContent = account[field];
            row.appendChild(cell);
        }

        // Actions (solo visual, sin lógica todavía)
        const actions = document.createElement("div");
        actions.className = "actions";

        // Se inserta el HTML de los botones de acción (editar y borrar) 
        // dentro del contenedor de acciones
        // Rutas SVG que definen la forma del icono de eliminar (escribir/papelera)
        actions.innerHTML = `
            <button class="icon-btn icon-btn--edit" title="Edit">
                <i class="fa-regular fa-pen-to-square"></i>
            </button>

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

        row.appendChild(actions);

        // yield devuelve la fila generada para insertarla dinámicamente en el DOM
        yield row;
    }
}