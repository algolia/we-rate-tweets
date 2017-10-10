const express = require('express');
const Twitter = require('twitter');
const nunjucks = require('nunjucks');
const passport = require('passport');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const cookieParser = require('cookie-parser');
const algoliasearch = require('algoliasearch');
const passportTwitter = require('passport-twitter');

// read environment variables
require('dotenv').config();

// put twitter and algolia functions in a separate file for readability
const apiHelpers = require('./server/api-helpers');

// configure the twitter client
const twitterClient = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

// create the algolia client from env variables
const algoliaClient = algoliasearch(
  process.env.ALGOLIA_APP_ID,
  process.env.ALGOLIA_ADMIN_KEY);

// use passport for twitter oauth authentication
// pass appropriate keys for twitter authentication
const TwitterStrategy = passportTwitter.Strategy;
passport.use(new TwitterStrategy({
  consumerKey: process.env.TWITTER_CONSUMER_KEY,
  consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
  callbackURL: process.env.PROJECT_DOMAIN ?
    `https://${process.env.PROJECT_DOMAIN}.glitch.me/login/twitter/return`:
    'http://localhost:3000/login/twitter/return'
},
  function(token, tokenSecret, profile, cb) {
    return cb(null, profile);
  }
));
passport.serializeUser(function(user, done) {
  done(null, user.username);
});
passport.deserializeUser(function(username, done) {
  done(null, { username: username });
});

// create the express app
const app = express();

// configure express and passport
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(cookieSession({
  name: 'we-rate-cookies',
  secret: 'we-love-cookies'
}));
app.use(passport.initialize());
app.use(passport.session());

// index route
app.get('/', function(request, response) {
  response.send(nunjucks.render(
    'views/index.html'
  ));
});

// clear the cookie if the user logs off
app.get('/logout', function(request, response) {
  request.logout();
  response.redirect('/');
});

// authenticate with Twitter
app.get('/auth/twitter', passport.authenticate('twitter'));

// redirect to setcookie following a successful OAuth callback
app.get('/login/twitter/return',
  passport.authenticate('twitter', { failureRedirect: '/' }),
  function(request, response) {
    // fetch the user's twitter timeline and index it with algolia
    apiHelpers.populateIndexfromTimeline(request.user, twitterClient, algoliaClient).then(function() {
      response.redirect('/success');
    }).catch(function(err) {
      console.error('twitter to algolia failed', err);
      response.redirect('/');
    });
  }
);

// if cookie exists, success. otherwise, user is redirected to index
app.get('/success', requireUser, function(request, response) {
  response.send(nunjucks.render(
    'views/success.html',
    { user: request.user }
  ));
});

// listen for requests :)
var listener = app.listen(process.env.PORT, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});

function requireUser(req, res, next) {
  if (!req.isAuthenticated()) {
    res.redirect('/');
  } else {
    next();
  }
};
