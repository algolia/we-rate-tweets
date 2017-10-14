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

// index the tweets of a user other than the authenticated user
app.get('/:username/tweets/indexing', requireUser, (request, response) => {
  response.send(nunjucks.render('tweets/indexing.html', getTemplateContext(request.params.username, request)));
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
  response.redirect(`/${request.user.username}/tweets/indexing`);
});

// page for shared tweets, accessible to anyone
app.get('/:username/tweets/search', (request, response) => {
  // check first to make sure the index exists by making an empty query
  const username = request.params.username;
  algoliaHelper.queryIndex("", username, algoliaClient).then(() => {
    response.send(nunjucks.render('tweets/search.html',
      getTemplateContext(username, request)));
  }).catch((err) => {
    // if the index doesn't exist, redirect to the indexing page
    response.redirect(`/${username}/tweets/indexing`);
  });
});

// called by a fetch request in the browser to index the tweets
// indexes the tweets of the username specified in params
app.post('/:username/tweets/index', requireUser, (request, response) => {
  const username = request.params.username;
  // create and configure the algolia index
  algoliaHelper.configureIndex(username, algoliaClient).then(() => {
    // fetch the user's twitter timeline and index it with algolia
    return twitterHelper.getTweets(username, twitterClient).then(tweets => {
      // once we have the tweets, index them
      return algoliaHelper.indexTweets(username, tweets, algoliaClient).then(() => {
        response.json({ ok: true });
      });
    });
  }).catch((err) => {
    console.error('twitter to algolia failed', err);
    response.status(500).json({ error: err });
  });
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

function getTemplateContext(username, request) {
  return {
    user: request.user,
    request: {
      username: username
    },
    algolia: {
      index_name: `tweets-${username}`,
      app_id: process.env.ALGOLIA_APP_ID,
      search_api_key: process.env.ALGOLIA_SEARCH_API_KEY
    }
  };
}
