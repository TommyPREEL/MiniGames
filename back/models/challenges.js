const db = require("./_bdd.js");

function getAllChallenges(){
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM Challenges`;
        db.all(sql, [], (err, rows) => {
            if (err) {
                throw err;
            }
            resolve(rows);
        })
    })
}

module.exports = {
    getAllChallenges
}