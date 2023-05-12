class Order {
    #id
    #id_users
    #orders_date
    #total_price
    #status
        constructor(id, id_users, orders_date, total_price, status) {
          this.id = id;
          this.id_users = id_users;
          this.orders_date = orders_date;
          this.total_price = total_price;
          this.status = status;
        }

    get id() {
        return this.#id
    }
    get id_users() {
        return this.#id_users
    }
    get orders_date() {
        return this.#orders_date
    }
    get total_price() {
        return this.#total_price
    }
    get status() {
        return this.#status
    }
    set id(id) {
        this.#id = id
    }
    set id_users(id_users) {
        this.#id_users = id_users
    }
    set orders_date(orders_date) {
        this.#orders_date = orders_date
    }
    set total_price(total_price) {
        this.#total_price = total_price
    }
    set status(status) {
        this.#status = status
    }
}

module.exports = Order