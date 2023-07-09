let express = require('express');
let app = express();
const bodyParser = require("body-parser");
let challengesRouter = require('./router/challengesRouter');
let miniGamesRouter = require('./router/miniGamesRouter');
let tournamentsRouter = require('./router/tournamentsRouter');
let usersRouter = require('./router/usersRouter');
let notificationsRouter = require('./router/notificationsRouter');
const cors = require("cors");

const corsOptions = {
  origin: '*'
};
// Cors header settings
app.use(cors(corsOptions));

// app.set("view engine", "ejs");



app.use(cors(corsOptions));
let session = require('express-session')

app.use(session({ secret: 'keyboard cat', cookie: { maxAge: 60000 }}))

// app.get('/', function(req, res) {
//   res.render('home');
// });

app.set("views", "./views");
app.use(bodyParser.json());

/* Use routers */

app.use('/api/challenges', challengesRouter)
app.use('/api/miniGames', miniGamesRouter)
app.use('/api/tournaments', tournamentsRouter)
app.use('/api/users', usersRouter)
app.use('/api/notifications', notificationsRouter)



/* Open the server */
app.listen(5000, () => {
  console.log("Server start (http://192.168.91.120:5000/) !");
});