let express = require('express');
let app = express();
const bodyParser = require("body-parser");
let challengesRouter = require('./router/challengesRouter');
let tournamentsRouter = require('./router/tournamentsRouter');
let usersRouter = require('./router/usersRouter');
let notificationsRouter = require('./router/notificationsRouter');


// app.set("view engine", "ejs");


// let session = require('express-session')

// app.use(session({ secret: 'keyboard cat', cookie: { maxAge: 60000 }}))

// app.get('/', function(req, res) {
//   res.render('home');
// });

app.set("views", "./views");
app.use(bodyParser.json());

/* Use routers */

app.use('/api/challenges', challengesRouter)
app.use('/api/tournaments', tournamentsRouter)
app.use('/api/users', usersRouter)
app.use('/api/notifications', notificationsRouter)




/* Open the server */
app.listen(5000, () => {
  console.log("Server start (http://localhost:5000/) !");
});