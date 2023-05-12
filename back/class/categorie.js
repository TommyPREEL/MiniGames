class Categorie {
    #id
    #name
    #img
        constructor(id, name,img) {
          this.id = id;
          this.name = name;
          this.img = img;
        }

    get id() {
        return this.#id
    }
    get name() {
        return this.#name
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
    set img(img) {
        this.#img = img
    }
}

module.exports = Categorie