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
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const hour = String(currentDate.getHours()).padStart(2, '0');
    const minute = String(currentDate.getMinutes()).padStart(2, '0');
    const second = String(currentDate.getSeconds()).padStart(2, '0');
    const formattedDateTime = `${year}-${month}-${day} ${hour}:${minute}:${second}`;
    return new Promise((resolve, reject) => {
        const sql = `INSERT INTO Challenges (id_users_challenger, id_users_challenged, id_mini_games, status, challenges_date) VALUES (?, ?, ?, ?, ?);`;
        db.run(sql, [challenge.challenger.id_users, challenge.challenged.id_users, challenge.challenge.id_mini_games, status.WAITING, formattedDateTime], (err, rows) => {
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
        db.all(sql, [id_users, status.WAITING], (err, rows) => {
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