class User {
    #id
    #firstname
    #lastname
    #email
    #address
    #password
    #is_admin

    constructor(id, firstname, lastname, email, address, password, is_admin) {
        this.#id = id
        this.#firstname = firstname
        this.#lastname = lastname
        this.#email = email
        this.#address = address
        this.#password = password
        this.#is_admin = is_admin
    }
    get id() {
        return this.#id
    }
    get firstname() {
        return this.#firstname
    }
    get lastname() {
        return this.#lastname
    }
    get email() {
        return this.#email
    }
    get address() {
        return this.#address
    }
    get password() {
        return this.#password
    }
    get is_admin() {
        return this.#is_admin
    }
    set id(id) {
        this.#id = id
    }
    set firstname(firstname) {
        this.#firstname = firstname
    }
    set lastname(lastname) {
        this.#lastname = lastname
    }
    set email(email) {
        this.#email = email
    }
    set address(address) {
        this.#address = address
    }
    set password(password) {
        this.#password = password
    }
    set is_admin(is_admin) {
        this.#is_admin = is_admin
    }
}

module.exports = User