const router = require("express").Router();
const UserModel = require('../models/User.model')
const bcrypt = require('bcryptjs');


router.get('/logout', (req, res, next) => {

  // This line will delete the session from your mongo DB
    req.session.destroy()

    // This is how we set global variables for hbs files.
    req.app.locals.isLoggedIn = false;

    res.redirect('/')
})

// Handles GET requests to /signin and shows a form
router.get('/signin', (req, res, next) => {
    res.render('auth/signin.hbs')
})

// Handles GET requests to /signup and shows a form
router.get('/signup', (req, res, next) => {
  res.render('auth/signup.hbs')
})

// Handles POST requests to /signup and registers the user in DB
router.post('/signup', (req, res, next) => {
    const {username, email, password} = req.body

    // ------------------------------------------------
    // SERVER SIDE VALIDATION IN ROUTES
    // ------------------------------------------------


    if (!username || !email || !password) {
        res.render('auth/signup.hbs', {error: 'Please enter all fields'})
        // To tell JS to come out off this function
        return;
    }

    // Check for email 
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    // check if the email does not match the regex
    if ( !re.test(email)) {
      res.render('auth/signup.hbs', {error: 'Email not in valid format'})
      // To tell JS to come out off this function
      return;
    }


    //check for strong passwords
    let passRegEx = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,16}$/
    if (!passRegEx.test(password)) {
      res.render('auth/signup.hbs', {error: 'Password needs to have a special character a number and be 6-16 characters'})
      // To tell JS to come out off this function
      return;
    }

    // ------------------------------------------------
    // ------------------------------------------------

    // Generates a salt
    const salt = bcrypt.genSaltSync(10);

    // Uses the salt and your password to create a hashed password
    const hash = bcrypt.hashSync(password, salt);

    UserModel.create({username, email, password: hash})
      .then(() => {
          res.redirect('/')
      })
      .catch((err) => {
          next(err)
      })



      // ASYNC WAY to encrypt 
      /* 
      bcrypt.genSalt(10)
        .then(() => {
            return bcrypt.hash(password, salt)
        })
        .then((hash) => {
            return  UserModel.create({username, email, password: hash})
        })
        .then(() => {
            //Do something
        })
        .catch((err) => {
            next(err)
        })
       */ 


})

// Handles POST requests to /signin and allows user to access private pages of the app
router.post('/signin', (req, res, next) => {
    const {email, password} = req.body

    // check if the email is in the DB
          // verify the pass
    
    UserModel.findOne({email})
        .then((user) => {
           if (user) {
              //If the email does exist 
              //bcrypt.compareSync( PASSWORD_FROM_PAGE, PASSWORD_FROM_DB);
              //  You can destructure this as well
              //  const {password: passwordFromDB} = user
              let isValid = bcrypt.compareSync( password, user.password);
              console.log(isValid)
              if (isValid) {
                  // If password matches
                  // We will redirect the user to a /profile page
                  // userName = user.username

                  /*
                  NEVER DO THIS.
                  DONT OVERRIDE THE SESSION

                  req.session = {
                    
                  }
                  */

                  // Create a new key/value pair in your req.session object
                  req.session.loggedInUser = user

                  // This is how we set global variables for hbs files.
                  req.app.locals.isLoggedIn = true;

                  res.redirect('/profile')
              }  
              else {
                  // If password does not match
                  res.render('auth/signin', {error: 'Invalid password'})
              }  
           } 
           else {
              //If the email does not exist 
             res.render('auth/signin', {error: 'Email does not exists'})
           }
        })
        .catch((err) => {
            next(err)
        })      
})

// Create a custom function/middleware just for authentication
function checkLoggedIn(req, res, next){
  if ( req.session.loggedInUser) {
      next()
  }
  else{
    res.redirect('/signin')
  }
}


// Handles GET requests to /profile and shows a cool page
router.get('/profile', checkLoggedIn, (req, res, next) => {

      res.render('auth/profile.hbs', {name:  req.session.loggedInUser.username})
})

module.exports = router;
