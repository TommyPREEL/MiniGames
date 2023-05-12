const Categorie = require("../class/Categorie.js");
const db = require("./_bdd.js");

function getAllProducts(){
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM Products`;
        db.all(sql, [], (err, rows) => {
            if (err) {
                throw err;
            }
            resolve(rows);
        })
    })
}

function getProductById(id){
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM Products WHERE id =?`;
        db.get(sql, [id], (err, row) => {
            if (err) {
                throw err;
            }
            resolve(row);
        });
    })
}

function createProduct(product){
    return new Promise((resolve, reject) => {
        const sql = `INSERT INTO Products (name, quantity, description, price, img) VALUES (?,?,?,?,?)`;
        db.run(sql, [product.name, product.quantity, product.description, product.price, product.img], (err) => {
            if (err) {
                throw err;
            }
            resolve({message: `Product created`});
        });
    })
}

function updateProduct(product){
    return new Promise((resolve, reject) => {
        const sql = `UPDATE Products SET name =?, quantity=?, description =?, price =? WHERE id =?`;
        db.run(sql, [product.name, product.quantity, product.description, product.price, product.id], (err) => {
            if (err) {
                throw err;
            }
            resolve({message: `Product updated`});
        });
    })
}

function deleteProductFromCategorie(id){
    return new Promise((resolve, reject) => {
        const sql = `DELETE FROM Products_Categories WHERE id_products = ?`; 
        db.run(sql, [id], (err) => {
            if (err) {
                throw err;
            }
            resolve({message: `categorie Product deleted`});
        });
    })
}

function deleteProduct(id){
    return new Promise((resolve, reject) => {
        const sql = `DELETE FROM Products WHERE id =?`; 
        db.run(sql ,[id], (err) => {
            if (err) {
                throw err;
            }
            resolve({message: `Product deleted`});
        });
    })
}

function AddCategorieToProduct(id, id_categorie){
    return new Promise((resolve, reject) => {
        const sql = `INSERT INTO Products_Categories (id_products, id_categories) VALUES (?,?)`;
        db.run(sql, [id, id_categorie], (err) => {
            if (err) {
                throw err;
            }
            resolve({message: `Categorie  add for Product `});
        });
    })
}

module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    deleteProductFromCategorie,
    AddCategorieToProduct
}