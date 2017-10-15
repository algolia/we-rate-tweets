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

// use passport for twitter oauth authentication
// pass appropriate keys for twitter authentication
if (process.env.TWITTER_CONSUMER_KEY &&
    process.env.TWITTER_CONSUMER_SECRET) {
  const TwitterStrategy = passportTwitter.Strategy;
  passport.use(new TwitterStrategy({
    consumerKey: process.env.TWITTER_CONSUMER_KEY,
    consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
    callbackURL: process.env.PROJECT_DOMAIN ? `https://${process.env.PROJECT_DOMAIN}.glitch.me/login/twitter/return` : 'http://localhost:3000/login/twitter/return'
  }, (token, tokenSecret, profile, cb) => {
    return cb(null, profile);
  }));
}

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

// add middleware that checks for all necessary environment variables
// if some are missing, like right after a remix, show a helpful error page
app.use(requireEnvironmentVariables);

// show an error page when something goes wrong
app.use((error, request, response, next) => {
  console.error('An error occurred', error);
  response.status(500).send(nunjucks.render('error.html', {
    message: error.message,
    detail: error.detail
  }));
});

// index route
app.get('/', (request, response) => {
  response.send(nunjucks.render('index.html', getTemplateContext(request)));
});

// index the tweets of a user
app.get('/:username/tweets/indexing', requireUser, requireIndexingOfOtherTimelines, (request, response) => {
  response.send(nunjucks.render('tweets/indexing.html', getTemplateContext(request, request.params.username)));
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
  algoliaHelper.queryIndex("", username, algoliaClient()).then(() => {
    response.send(nunjucks.render('tweets/search.html',
      getTemplateContext(request, username)));
  }).catch((err) => {
    // if the index doesn't exist, redirect to the indexing page
    response.redirect(`/${username}/tweets/indexing`);
  });
});

// called by a fetch request in the browser to index the tweets
// indexes the tweets of the username specified in params
app.post('/:username/tweets/index', requireUser, requireIndexingOfOtherTimelines, (request, response) => {
  const username = request.params.username;
  // create and configure the algolia index
  algoliaHelper.configureIndex(username, algoliaClient()).then(() => {
    // fetch the user's twitter timeline and index it with algolia
    return twitterHelper.getTweets(username, twitterClient()).then(tweets => {
      // once we have the tweets, index them
      return algoliaHelper.indexTweets(username, tweets, algoliaClient()).then(() => {
        response.json({ ok: true, count: tweets.length });
      });
    });
  }).catch((err) => {
    console.error('Indexing tweets failed', err);
    response.status(500).json({ error: err });
  });
});

// show the error page for 404 errors - this must go after the routes
app.use((request, response, next) => {
  response.status(404).send(nunjucks.render('error.html', {
    message: '404 Not Found',
    detail: 'If you really want this page to exist, just remix the app ;)'
  }));
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

function requireEnvironmentVariables(request, response, next) {
  if (algoliaClient() && twitterClient()) {
    next();
  } else {
    throw {
      message: "One or more environment variables is missing",
      detail: "Don't worry! If you just remixed, this is normal. See the README for further instructions."
    };
  }
}

// by default, indexing can only be triggered for the logged in twitter user
// remixes can change this by setting the ALLOW_INDEXING_OF_OTHER_TIMELINES
// environment variable to a non-empty value like "1"
function requireIndexingOfOtherTimelines(request, response, next) {
  if (process.env.ALLOW_INDEXING_OF_OTHER_TIMELINES) {
    next();
  } else {
    // the logged in username and the requested username must match
    if (request.user.username === request.params.username) {
      next();
    } else {
      console.warn('Indexing tweets for the non-logged in user must be explicitly allowed by an environment variable.');
      response.redirect('/');
    }
  }
}

function getTemplateContext(request, username) {
  return {
    user: request.user,
    request: {
      // if a username is passed, use that, otherwise use the
      // logged in user's username if there is one
      authenticated: request.isAuthenticated(),
      username: username ? username : (request.user ? request.user.username : ""),
    },
    algolia: {
      index_name: `tweets-${username}`,
      app_id: process.env.ALGOLIA_APP_ID,
      search_api_key: process.env.ALGOLIA_SEARCH_API_KEY
    },
    environment: {
      project_domain: process.env.PROJECT_DOMAIN,
      allow_indexing_of_other_timelines: process.env.ALLOW_INDEXING_OF_OTHER_TIMELINES
    }
  };
}

// create the algolia client from env variables, or null if they're not set
// doing a check avoids crashing the glitch app on a new remix
function algoliaClient() {
  if (process.env.ALGOLIA_APP_ID &&
      process.env.ALGOLIA_ADMIN_API_KEY &&
      process.env.ALGOLIA_SEARCH_API_KEY) {
    return algoliasearch(process.env.ALGOLIA_APP_ID, process.env.ALGOLIA_ADMIN_API_KEY);
  } else {
    console.warn('One or more Algolia environment variables missing.');
    return null;
  }
}

// create the twitter client from env variables, or return null if they're not set
// doing a check avoids crashing the glitch app on a new remix
function twitterClient() {
  if (process.env.TWITTER_CONSUMER_KEY &&
      process.env.TWITTER_CONSUMER_SECRET &&
      process.env.TWITTER_ACCESS_KEY &&
      process.env.TWITTER_ACCESS_TOKEN_SECRET) {
    return new Twitter({
      consumer_key: process.env.TWITTER_CONSUMER_KEY,
      consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
      access_token_key: process.env.TWITTER_ACCESS_KEY,
      access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
    });
  } else {
    console.warn('One or more Twitter environment variables missing.');
    return null;
  }
}
