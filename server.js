const express = require('express');
const Twitter = require('twitter');
const nunjucks = require('nunjucks');
const passport = require('passport');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const cookieParser = require('cookie-parser');
const algoliasearch = require('algoliasearch');
const passportTwitter = require('passport-twitter');

// read environment variables (only necessary locally, not on Glitch)
require('dotenv').config();

// put twitter and algolia functions in separate files for readability
const twitterHelper = require('./server/helpers/twitter');
const algoliaHelper = require('./server/helpers/algolia');

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
  process.env.ALGOLIA_ADMIN_API_KEY);

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

// send to twitter to authenticate
app.get('/auth/twitter', passport.authenticate('twitter'));

// receive authenticated twitter user and index tweets
app.get('/login/twitter/return',
  passport.authenticate('twitter', { failureRedirect: '/' }),
  function(request, response) {
    // fetch the user's twitter timeline and index it with algolia
    fetchAndIndexTweets(request, response).then(function() {
      // it can take a few milliseconds for the records to be searchable,
      // and we want to make sure they are when then next page loads
      setTimeout(function() {
        response.redirect('/success');
      }, 1000);
    }).catch(function(err) {
      console.error('twitter to algolia failed', err);
      response.redirect('/');
    });
  }
);

// allow an already-authenticated user to reindex their tweets
app.get('/reindex', requireUser, function(request, response) {
  fetchAndIndexTweets(request, response).then(function() {
    response.redirect('/success');
  }).catch(function(err) {
    console.error('twitter to algolia reindexing failed', err);
    response.redirect('/');
  });
});

// primary page for search tweets, accessible to an authenticated user
app.get('/success', requireUser, function(request, response) {
  response.send(nunjucks.render(
    'views/success.html',
    { user: request.user,
      algolia: {
        app_id: process.env.ALGOLIA_APP_ID,
        search_api_key: process.env.ALGOLIA_SEARCH_API_KEY
    } }
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

// helper function to push data from twitter to algolia
function fetchAndIndexTweets(request, response) {
  return twitterHelper.getTweets(request.user, twitterClient).then((tweets) => {
    return algoliaHelper.indexTweets(request.user, tweets, algoliaClient);
  });
}
