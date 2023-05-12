const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./db/tp_e_commerce6.db", err => {
    if (err) {
        return console.error(err.message);
    }
    console.log("Connection done to 'tp_e_commerce.db'");
});
  
// const sql_create = `CREATE TABLE Products(
//    id INTEGER,
//    name TEXT,
//    quantity INTEGER,
//    description TEXT,
//    price NUMERIC(15,2)  ,
//    PRIMARY KEY(id)
// );

// CREATE TABLE Categories(
//    id INTEGER,
//    name TEXT,
//    PRIMARY KEY(id)
// );

// CREATE TABLE Users(
//    id INTEGER,
//    firstname TEXT,
//    lastname TEXT,
//    email TEXT,
//    address TEXT,
//    password TEXT,
//    PRIMARY KEY(id)
// );

// CREATE TABLE Orders(
//    id_1 INTEGER,
//    id INTEGER,
//    orders_date NUMERIC,
//    total_price NUMERIC(15,2)  ,
//    PRIMARY KEY(id_1, id),
//    FOREIGN KEY(id_1) REFERENCES Users(id)
// );

// CREATE TABLE Products_Categories(
//    id INTEGER,
//    id_1 INTEGER,
//    PRIMARY KEY(id, id_1),
//    FOREIGN KEY(id) REFERENCES Products(id),
//    FOREIGN KEY(id_1) REFERENCES Categories(id)
// );

// CREATE TABLE Product_Orders(
//    id INTEGER,
//    id_2 INTEGER,
//    id_1 INTEGER,
//    PRIMARY KEY(id, id_2, id_1),
//    FOREIGN KEY(id) REFERENCES Products(id),
//    FOREIGN KEY(id_2, id_1) REFERENCES Orders(id_1, id)
// );`;

// function setDatabase(db){
//     db.run(sql_create, err => {
//         if (err) {
//             return console.error(err.message);
//         }
//         console.log("Database created successfully");
//         });
        
//         const sql_insert = `INSERT INTO Products (id, name, quantity, description, price) VALUES
//             (1, 'Livre', 10, 'Premier de la série', 7.50),
//             (2, 'Food', 20, 'Je sais pas', 2),
//             (3, 'Micro', 5, 'Micro fort', 49.90);`;
        
//         db.run(sql_insert, err => {
//         if (err) {
//             return console.error(err.message);
//         }
//         console.log("Fill in the database successfully");
//         });
// }

// setDatabase(db);

module.exports = db;