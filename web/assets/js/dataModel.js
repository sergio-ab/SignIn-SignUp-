/*========================================================================================================
    |   MODELO DE DATOS
    |   Archivo común para Customer (Melanic Ramos), Account (Clara Montaño) y Movement (Sergio Arias)
==========================================================================================================
    |   Define las clases de datos para Customer, Account y Movements.
==========================================================================================================*/


/*========================================================================================================
    |   --CLASS CUSTOMER--
    |   Representa un cliente del banco.
    |   Contiene toda la información personal y de contacto del cliente. 
    |   Cada instancia corresponde a un cliente único
 ========================================================================================================*/
export class Customer { 
// Usando "export", conseguimos que las clases sean públicas, pudiendo importarlas desde otros archivos. 
    constructor(id, firstName, lastName, middleInitial, street, city, state, zip, phone, email, password) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.middleInitial = middleInitial;
        this.street = street;
        this.city = city;
        this.state = state;
        this.zip = zip;
        this.phone = phone;
        this.email = email;
        this.password = password;
    }
    toJSON(){
       return {
        id: this.id,
        firstName: this.firstName,
        lastName: this.lastName,
        middleInitial: this.middleInitial,
        street: this.street,
        city: this.city,
        state: this.state,
        zip: this.zip,
        phone: this.phone,
        email: this.email,
        password: this.password
    };
    }
}

/*========================================================================================================
    |   --CLASS ACCOUNT--
    |   Representa una cuenta bancaria de un cliente.
    |   Contiene toda la información financiera de la cuenta. 
    |   Mantiene la relación con el cliente propietario mediante "customerId".
 ========================================================================================================*/
export class Account {
    constructor(id, description, balance, creditLine, beginBalance, beginBalanceTimestamp, type, customerId) {
        this.id = id;
        this.description = description;
        this.balance = balance;
        this.creditLine = creditLine;
        this.beginBalance = beginBalance;
        this.beginBalanceTimestamp = beginBalanceTimestamp;
        this.type = type; // "STANDARD" O "CREDIT"
        this.customerId = customerId; // ID del cliente propietario
    }
    toJSON() {
       return {
        id: this.id,
        description: this.description,
        balance: this.balance,
        creditLine: this.creditLine,
        beginBalance: this.beginBalance,
        beginBalanceTimestamp: this.beginBalanceTimestamp,
        type: this.type,
        customerId: this.customerId
    };
    }
}

/*========================================================================================================
    |   --CLASS MOVEMENT--
    |   Representa un movimiento financiero en una cuenta bancaria.
    |   Puede ser un ingreso (amount positivo) o una retirada (amount negativo).
    |   Contiene la referencia a la cuenta a la que pertenece mediante "accountId".
 ========================================================================================================*/
export class Movement {
    constructor(id, timestamp, amount, balance, description, accountId) {
        this.id = id;
        this.timestamp = timestamp;
        this.amount = amount; // Positivo = ingreso, Negativo = retirada.
        this.balance = balance; // Saldo restante tras el movimiento.
        this.description = description;
        this.accountId = accountId; // ID de la cuenta asociada. 
    }
    toJSON() {
       return {
        id: this.id,
        timestamp: this.timestamp,
        amount: this.amount,
        balance: this.balance, 
        description: this.description,
        accountId: this.accountId
    };
   }
}
