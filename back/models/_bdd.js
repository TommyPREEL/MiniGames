const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./db/miniGames.db", err => {
    if (err) {
        return console.error(err.message);
    }
    console.log("Connection done to your database");
});

module.exports = db;