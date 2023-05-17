const db = require("./_bdd.js");

const status = {
    ACCEPT : "ACCEPT",
    WAITING : "WAITING",
    FINISHED : "FINISHED"
}

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

function startChallenge(challenge){
    return new Promise((resolve, reject) => {
        const sql = `INSERT INTO Challenges (id_users_challenger, id_users_challenged, id_mini_games, status) VALUES (?, ?, ?, ?);`;
        db.run(sql, [challenge.challenger.id_users, challenge.challenged.id_users, challenge.challenge.id_mini_games, status.WAITING], (err, rows) => {
            if (err) {
                throw err;
            }
            resolve('PASSED');
        })
    })
}

function challengesListToAccept(id_user){
    return new Promise((resolve, reject) => {
        const sql = `SELECT * from challenges JOIN Users ON id_users = id_users_challenger JOIN Users ON id_users = id_users_challenged WHERE id_users_challenged = ? AND status = ?`;
        db.all(sql, [challenge.challenged.id_users, status.WAITING], (err, rows) => {
            if (err) {
                throw err;
            }
            resolve(rows);
        })
    })
}

module.exports = {
    getAllChallenges,
    startChallenge,
    challengesListToAccept
}