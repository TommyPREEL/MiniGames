const db = require("./_bdd.js");

function getAllMiniGames(){
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM Minigames`;
        db.all(sql, [], (err, rows) => {
            if (err) {
                throw err;
            }
            resolve(rows);
        })
    })
}

module.exports = {
    getAllMiniGames
}