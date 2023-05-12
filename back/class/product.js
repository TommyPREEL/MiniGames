class Product {
    #id
    #name
    #quantity
    #description
    #price
    #img
        constructor(id, name, quantity, description, price,img) {
          this.id = id;
          this.name = name;
          this.quantity = quantity;
          this.description = description;
          this.price = price;
          this.img = img;
        }

    get id() {
        return this.#id
    }
    get name() {
        return this.#name
    }
    get quantity() {
        return this.#quantity
    }
    get description() {
        return this.#description
    }
    get price() {
        return this.#price
    }
    get img() {
        return this.#img
    }
    set id(id) {
        this.#id = id
    }
    set name(name) {
        this.#name = name
    }
    set quantity(quantity) {
        this.#quantity = quantity
    }
    set description(description) {
        this.#description = description
    }
    set price(price) {
        this.#price = price
    }
    set img(img) {
        this.#img = img
    }
}

module.exports = Product