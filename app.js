// ℹ️ Gets access to environment variables/settings
// https://www.npmjs.com/package/dotenv
require("dotenv/config");

// ℹ️ Connects to the database
require("./db");

// Handles http requests (express is node js framework)
// https://www.npmjs.com/package/express
const express = require("express");

// Handles the handlebars
// https://www.npmjs.com/package/hbs
const hbs = require("hbs");

const app = express();

// ℹ️ This function is getting exported from the config folder. It runs most middlewares
require("./config")(app);

// default value for title local
const projectName = "basic-auth";
const capitalized = (string) =>
  string[0].toUpperCase() + string.slice(1).toLowerCase();

app.locals.title = `${capitalized(projectName)} created with Ironlauncher`;

// If you want to set a default value to `isLoggedIn`
// Set it based on the value in your session

/*
app.use((req, res) => {
  req.app.locals.isLoggedIn = !!req.session.loggedInUser;
})
*/

// ----------------------------------------
// This is where we set up our session and use connect-mongo to store it in our DB

const session = require('express-session');
const MongoStore = require('connect-mongo');

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false, 
  cookie: {
    maxAge: 1000 * 24* 60 * 60 // your cookie will be cleared after these seconds
  },
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || "mongodb://localhost/basic-auth",
    // Time to Live for sessions in DB. After that time it will delete it!
    ttl: 24* 60 * 60 // your session will be cleared after these seconds
  })
}));


// {"cookie":{"originalMaxAge":86400000,"expires":"2021-06-30T12:36:13.665Z","httpOnly":true,"path":"/"},"loggedInUser":{"_id":"60db13b54101101ebc4a3697","username":"mp","email":"test1@test.com","password":"$2a$10$.Cyl.ydqL.G41FUOOi0Yte4wbEvUDD3tb/61NMTKJSBfgP3RzX4N.","__v":0}}


// -----------------------------------------

// MAKE ALL PAGES PRIVATE BY DEFAULT
/*
app.use((req, res, next) => {
  if ( req.session.loggedInUser) {
      next()
  }
  else{
    res.redirect('/signin')
  }
})
*/

// 👇 Start handling routes here
const index = require("./routes/index");
app.use("/", index);

const authRoutes = require('./routes/auth.routes')
app.use("/", authRoutes);


// ❗ To handle errors. Routes that don't exist or errors that you handle in specific routes
require("./error-handling")(app);

module.exports = app;
