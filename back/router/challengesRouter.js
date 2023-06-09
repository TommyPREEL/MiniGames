let express = require('express');
let challengesRouter = express.Router();

const { getAllUsers } = require('../models/users.js')
const { getAllChallenges, 
  startChallenge,
  challengesListToAccept,
  challengesListSent,
  challengesListDone,
  challengesListReceived,
  challengesListAccepted,
  challengesAccepted,
  challengesList,
  challengesUpdateStatus,
  challengesCancel
} = require('../models/challenges.js');
const { updateScoreWinner,
  getScoreWinner
 } = require('../models/usersMiniGames.js');

challengesRouter.get('/players', function(req, res) {
    getAllUsers().then(users => {
      res.json(users)
    })
});

challengesRouter.get('/list', function(req, res) {
  getAllChallenges().then(challenges => {
    res.json(challenges)
  })
});

challengesRouter.post('/start', function(req, res) {
  startChallenge(req.body).then(message => {
    res.json({message: message})
  })
});

challengesRouter.get('/list_to_accept', function(req, res) {
  challengesListToAccept(req.body).then(rows => {
    res.json(rows)
  })
});

challengesRouter.post('/accept', function(req, res) {
  challengesAccepted(req.body.challenge).then(message => {
    res.json({message: message})
  })
});

challengesRouter.post('/list_sent', function(req, res) {
  challengesListSent(req.body.id_user).then(rows => {
    res.json(rows)
  })
});

challengesRouter.post('/list_done', function(req, res) {
  challengesListDone(req.body.id_user).then(rows => {
    res.json(rows)
  })
});

challengesRouter.post('/list', function(req, res) {
  challengesList(req.body.id_user).then(rows => {
    res.json(rows)
  })
});


challengesRouter.post('/finish', function(req, res) {
  challengesUpdateStatus(req.body.challenge).then(message => {
    // if(message){
      // getScoreWinner(req.body.challenge).then(score => {
      //   console.log(score)
      //   if(score.length === 0){ score = 0}
      //   updateScoreWinner(req.body.challenge, score).then((message) => {
      //     res.json({message: message})
      //   })
      // })
    // }else{
      res.json({message: message})
    // }
  })
});

challengesRouter.post('/cancel', function(req, res) {
  challengesCancel(req.body.challenge).then(response => {
    res.json(response)
  })
});


challengesRouter.post('/list_received', function(req, res) {
  challengesListReceived(req.body.id_user).then(rows => {
    res.json(rows)
  })
});

challengesRouter.post('/list_accepted', function(req, res) {
  challengesListAccepted(req.body.id_user).then(rows => {
    res.json(rows)
  })
});

// challengesRouter.get('/details/:id', function(req, res) {
//     getProductById(req.params.id).then(product => {
//     res.json(product)
//     })
// });

// challengesRouter.post('/add', function(req, res) {
//     const product = new Product(1, req.body.name, req.body.quantity, req.body.description, req.body.price, "/pipe.png");
//     createProduct(product).then(message => {
//         res.json(message)
//     })
// });

// challengesRouter.post('/update/:id', function(req, res) {
//     const product = new Product(req.params.id, req.body.name, req.body.quantity, req.body.description, req.body.price, null);
//     updateProduct(product).then(message => {
//         res.json(message)
//     })
// });

// challengesRouter.post('/delete/:id', function(req, res) {
//     deleteProductFromCategorie(req.params.id).then(message1 => {
//         if (message1 = 'categorie Product deleted') {
//             deleteProduct(req.params.id).then(message2 => {
//                 res.json(message2)
//             })
//         }     
//     })  
// });


// challengesRouter.get('/add/categorie/:id/:id_categorie', function(req, res) {
//     AddCategorieToProduct(req.params.id, req.params.id_categorie).then(message => {
//         res.json(message)
//     })
// });




module.exports = challengesRouter;