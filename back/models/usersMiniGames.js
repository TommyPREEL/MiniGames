const db = require("./_bdd.js");

function updateScoreWinner(challenge, score) {
    score++;
    return new Promise((resolve, reject) => {
        const sql = `UPDATE Users_mini_games 
        SET score = ? 
        WHERE id_users = ?
        AND id_mini_games = ?`;
        db.run(sql, [score, challenge.users_winner, challenge.id_mini_games], (err, rows) => {
            if (err) {
                throw err;
            }
            resolve(true);
        })
    })
}

function getScoreWinner(challenge) {
    return new Promise((resolve, reject) => {
        const sql = `SELECT score
        FROM Users_mini_games
        WHERE id_users = ?
        AND id_mini_games = ?`;
        db.all(sql, [challenge.users_winner, challenge.id_mini_games], (err, rows) => {
            if (err) {
                throw err;
            }
            resolve(rows);
        })
    })
}

module.exports = {
    updateScoreWinner,
    getScoreWinner
}