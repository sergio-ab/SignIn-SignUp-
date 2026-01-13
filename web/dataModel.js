/******************************
 * MODELO DE DATOS
 * Archivo común para Customer, Account y Movement
 ******************************/

// ========= CUSTOMER =========
export class Customer {
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
}

// ========= ACCOUNT =========
export class Account {
    constructor(id, description, balance, creditLine, beginBalance, beginBalanceTimestamp, type) {
        this.id = id;
        this.description = description;
        this.balance = balance;
        this.creditLine = creditLine;
        this.beginBalance = beginBalance;
        this.beginBalanceTimestamp = beginBalanceTimestamp;
        this.type = type;
    }
}

// ========= MOVEMENT =========
export class Movement {
    constructor(id, timestamp, amount, balance, description, accountId) {
        this.id = id;
        this.timestamp = timestamp;
        this.amount = amount;
        this.balance = balance;
        this.description = description;
        this.accountId = accountId;
    }

    // Devuelve "CREDIT" o "DEBIT" según el monto
    getType() {
        return this.amount >= 0 ? "CREDIT" : "DEBIT";
    }
}
