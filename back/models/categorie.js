const db = require("./_bdd.js");

function getAllCategories(){
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM Categories`;
        db.all(sql, [], (err, rows) => {
            if (err) {
                throw err;
            }
            resolve(rows);
        })
    })
}

function getCategorieById(id){
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM Categories WHERE id =?`;
        db.get(sql, [id], (err, row) => {
            if (err) {
                throw err;
            }
            resolve(row);
        });
    })
}

function createCategorie(categorie){
    return new Promise((resolve, reject) => {
        const sql = `INSERT INTO Categories (name) VALUES (?)`;
        db.run(sql, [categorie.name], (err) => {
            if (err) {
                throw err;
            }
            resolve({message: `categorie ${categorie.name} created`});
        });
    })
}

function updateCategorie(id, categorie){
    return new Promise((resolve, reject) => {
        const sql = `UPDATE Categories SET name =? WHERE id =?`;
        db.run(sql, [categorie.name, id], (err) => {
            if (err) {
                throw err;
            }
            resolve({message: `categorie ${categorie.name} updated`});
        });
    })
}

function deleteCategorie(id){
    return new Promise((resolve, reject) => {
        const sql = `DELETE FROM Categories WHERE id =?`;
        db.run(sql, [id], (err) => {
            if (err) {
                throw err;
            }
            resolve({message: `categorie deleted`});
        });
    })
}

function deleteProductsInCategorie(id){
    return new Promise((resolve, reject) => {
        const sql = `DELETE FROM Products_Categories WHERE id_categories =?`;
        db.run(sql, [id], (err) => {
            if (err) {
                throw err;
            }
            resolve({message: `Products in this category have been deleted`});
        });
    })
}


function getProductsByCategorie(id){
    return new Promise((resolve, reject) => {
        const sql = `SELECT *
        FROM Products p
        JOIN Products_Categories pc ON p.id = pc.id_products
        WHERE pc.id_categories = ?`;
        db.all(sql, [id], (err, rows) => {
            if (err) {
                throw err;
            }
            resolve(rows);
        });
    })
}




module.exports = {
    getAllCategories,
    getCategorieById,
    createCategorie,
    updateCategorie,
    deleteCategorie,
    getProductsByCategorie,
    deleteProductsInCategorie
}