let express = require('express');
let usersRouter = express.Router();

const User = require('../class/User');
const { getAllUsers, connection, getUserById, createUser, updateUser, deleteUserById} = require('../models/users.js')
// usersRouter.get('/', function(req, res) {
//     getAllUsers().then(users => {
//       res.json({users:users})
//     })
// });


const bodyParser = require('body-parser');
usersRouter.use(bodyParser.json());


usersRouter.get('/details/:id', function(req, res) {
    getUserById(req.params.id).then(user => {
    res.json(user)
    })
});

usersRouter.post('/register', function(req, res) {
    const user = new User(1, req.body.firstname, req.body.lastname, req.body.email, req.body.address, req.body.password, false);
    createUser(user).then(message => {
        if(message.message == 'User created successfully') {
            connection(req.body.email, req.body.password).then(userData => {
                req.session.user = userData;
                res.json(userData)
            })
        }
    })
});

usersRouter.post('/update/:id', function(req, res) {
    const user = new User(req.params.id, req.body.firstname, req.body.lastname, "", req.body.address, req.body.password, false);
    updateUser(user).then(message => {
        res.json(message);
    })
});

usersRouter.post('/delete/:id', function(req, res) {
    deleteUserById(req.params.id).then(message => {
        res.json(message);
    })
});

usersRouter.post('/connect', function(req, res) {
    connection(req.body.email, req.body.password).then(user => {
        if(typeof(user) !== 'undefined') {
            req.session.user = user;
        }
        res.json(user);
    })
});

usersRouter.get('/test', function(req, res) {
    res.json(req.session.user);
});

usersRouter.get('/logout', function(req, res) {
    req.session.destroy();
});
  
module.exports = usersRouter;