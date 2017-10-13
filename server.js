const express = require('express');
const Twitter = require('twitter');
const nunjucks = require('nunjucks');
const passport = require('passport');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const cookieParser = require('cookie-parser');
const algoliasearch = require('algoliasearch');
const passportTwitter = require('passport-twitter');

// only do if not running on glitch
if (!process.env.PROJECT_DOMAIN) {
  // read environment variables (only necessary locally, not on Glitch)
  require('dotenv').config();
}

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
const algoliaClient = algoliasearch(process.env.ALGOLIA_APP_ID, process.env.ALGOLIA_ADMIN_API_KEY);

// use passport for twitter oauth authentication
// pass appropriate keys for twitter authentication
const TwitterStrategy = passportTwitter.Strategy;
passport.use(new TwitterStrategy({
  consumerKey: process.env.TWITTER_CONSUMER_KEY,
  consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
  callbackURL: process.env.PROJECT_DOMAIN ? `https://${process.env.PROJECT_DOMAIN}.glitch.me/login/twitter/return` : 'http://localhost:3000/login/twitter/return'
}, (token, tokenSecret, profile, cb) => {
  return cb(null, profile);
}));
passport.serializeUser((user, done) => {
  done(null, user.username);
});
passport.deserializeUser((username, done) => {
  done(null, { username: username });
});

// create the express app
const app = express();

// configure express and passport
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cookieSession({
  name: 'we-rate-cookies',
  secret: 'we-love-cookies'
}));
app.use(passport.initialize());
app.use(passport.session());

// don't cache templates b/c server restart is needed to pickup changes
// when running local not on glitch
nunjucks.configure('views', {
  app: app, noCache: true
});

// index route
app.get('/', (request, response) => {
  response.send(nunjucks.render('index.html'));
});

// processing route, for the user to wait while we index tweets
app.get('/patience', requireUser, (request, response) => {
  response.send(nunjucks.render('patience.html'));
});

// clear the cookie if the user logs off
app.get('/logout', (request, response) => {
  request.logout();
  response.redirect('/');
});

// send to twitter to authenticate
app.get('/auth/twitter', passport.authenticate('twitter'));

// receive authenticated twitter user and index tweets
app.get('/login/twitter/return', passport.authenticate('twitter', { failureRedirect: '/' }), (request, response) => {
  response.redirect('/patience');
});

app.post('/tweets/index', requireUser, (request, response) => {
  // create and configure the algolia index
  algoliaHelper.pushAlgoliaIndexSettings(request.user, algoliaClient).then(() => {
    // fetch the user's twitter timeline and index it with algolia
    return fetchAndIndexTweets(request, response).then(() => {
      response.json({ ok: true });
    });
  }).catch((err) => {
    console.error('twitter to algolia failed', err);
    response.status(500).json({ error: err });
  });
});

// primary page for search tweets, accessible to an authenticated user
app.get('/tweets', requireUser, (request, response) => {
  renderTweetsPageForUsername(request.user.username, request, response);
});

// page for shared tweets, accessible to anyone
app.get('/:username/tweets', (request, response) => {
  renderTweetsPageForUsername(request.params.username, request, response);
});

// listen for requests :)
const listener = app.listen(process.env.PORT, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});

function requireUser(request, response, next) {
  if (!request.isAuthenticated()) {
    response.redirect('/');
  } else {
    next();
  }
};

// helper function to push data from twitter to algolia
function fetchAndIndexTweets(request, response) {
  return twitterHelper.getTweets(request.user, twitterClient).then(tweets => {
    return algoliaHelper.indexTweets(request.user, tweets, algoliaClient);
  });
}

// render the tweets page for the username passed in,
// which might be the authenticated user or a user specified in request params
function renderTweetsPageForUsername(username, request, response) {
  // check first to make sure the index exists by making an empty query
  // if the index doesn't exist, serve a 404
  algoliaHelper.queryIndex("", { username: username }, algoliaClient).then(() => {
    response.send(nunjucks.render('tweets.html', {
      user: request.user,
      request: {
        username: username
      },
      algolia: {
        index_name: `tweets-${username}`,
        app_id: process.env.ALGOLIA_APP_ID,
        search_api_key: process.env.ALGOLIA_SEARCH_API_KEY
      } }));
  }).catch((err) => {
    console.log(err);
    response.status(404).send("Not found");
  });
}
