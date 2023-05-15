const db = require("./_bdd.js");

function getAllUsers(){
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM Users`;
        db.all(sql, [], (err, rows) => {
            if (err) {
                throw err;
            }
            resolve(rows);
        })
    })
}

function getUserById(id){
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM Users WHERE id =?`;
        db.get(sql, [id], (err, row) => {
            if (err) {
                throw err;
            }
            resolve(row);
        })
    })
}

function createUser(user){
    return new Promise((resolve, reject) => {
        const sql = `INSERT INTO Users (email, username, password, is_admin) VALUES (?,?,?,?)`;
        db.run(sql, [user.email, user.username, user.password, user.is_admin], (err) => {
            if (err) {
                throw err;
            }
            resolve({message: `User created successfully`});

        })
    })
}

// function updateUser(user){
//     return new Promise((resolve, reject) => {
//         const sql = `UPDATE Users SET lastname =?, firstname=?, password =?, address= ? WHERE id =?`;
//         db.run(sql, [user.lastname, user.firstname, user.password , user.address, user.id], (err) => {
//             if (err) {
//                 throw err;
//             }
//             resolve({message: `User ${user.firstname} updated`});
//         })
//     })
// }

// function deleteUserById(id){
//     return new Promise((resolve, reject) => {
//         const sql = `DELETE FROM Users WHERE id =?`;
//         db.run(sql, [id], (err, rows) => {
//             if (err) {
//                 throw err;
//             }
//             resolve({message: `User deleted`});
//         })
//     })
// }

function connection(username, password){
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM Users WHERE username =? AND password =?`;
        db.get(sql, [username, password], (err, row) => {
            if (err) {
                throw err;
            }
            resolve(row);
        })
    })
}

function checkUserExists(email, username){
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM Users WHERE email = ? OR username = ?`;
        db.get(sql, [email, username], (err, row) => {
            if (err) {
                throw err;
            }
            let exist = null
            if(typeof(row) === 'undefined') {
                exist = false;
            }else{
                exist = true;
            }
            resolve(exist);
        })
    })
};

module.exports = {
    getAllUsers,
    getUserById,
    createUser,
    // updateUser,
    // deleteUserById,
    connection,
    checkUserExists
}