let express = require('express');
let miniGamesRouter = express.Router();

// const { getAllUsers } = require('../models/users.js')
// const { getAllChallenges } = require('../models/challenges.js')
const { getAllMiniGames } = require('../models/miniGames.js')

miniGamesRouter.get('/', function(req, res) {
    getAllMiniGames().then(miniGames => {
      res.json(miniGames)
    })
  });

module.exports = miniGamesRouter;