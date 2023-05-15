class User {
    #id
    #email
    #username
    #password
    #is_admin

    constructor(id, email, username, password, is_admin) {
        this.#id = id
        this.#email = email
        this.#username = username
        this.#password = password
        this.#is_admin = is_admin
    }
    get id() {
        return this.#id
    }
    get email() {
        return this.#email
    }
    get username() {
        return this.#username
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
    set email(email) {
        this.#email = email
    }
    set username(username) {
        this.#username = username
    }
    set password(password) {
        this.#password = password
    }
    set is_admin(is_admin) {
        this.#is_admin = is_admin
    }
}

module.exports = User