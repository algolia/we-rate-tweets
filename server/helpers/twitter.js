module.exports = {
  getTweets: getTweets
};

// the highest amount of tweets you can ask twitter for per API call
// the real amount you get back isn't 200 but 200 minus all retweets
const MAX_TWEETS_PER_FETCH = 200;

// how far back in the timeline to go - the hard twitter API limit is 3200
// the real amount of tweets added to the index will be the number you
// put here minus all retweets; chance the NUMBER_OF_TWEETS_TO_FETCH
// environment variable to fetch more or less tweets, default is 400
const NUMBER_OF_TWEETS_TO_FETCH = process.env.NUMBER_OF_TWEETS_TO_FETCH || 400;

// fetch tweets from the twitter API
function getTweets(username, twitterClient) {
  const iterations = Math.ceil(NUMBER_OF_TWEETS_TO_FETCH / MAX_TWEETS_PER_FETCH);
  return getTweetsOlderThan([], iterations, -1, username, twitterClient);
}

// recursive method that runs iterationsLeft number of times, adding tweets found
// to an array, changing the max_id value to keep getting older tweets
function getTweetsOlderThan(allTweets, iterationsLeft, maxTweetId, username, twitterClient) {
  return new Promise(function (resolve, reject) {
    if (iterationsLeft === 0) {
      resolve(allTweets);
      return;
    }
    var params = { screen_name: username, count: MAX_TWEETS_PER_FETCH,
      include_rts: false, tweet_mode: "extended" };
    if (maxTweetId > -1) {
      params.max_id = maxTweetId;
    }
    twitterClient.get('statuses/user_timeline', params, function (error, tweets, response) {
      if (error) {
        reject(error);
        return;
      }
      if (tweets.length === 0) {
        resolve(allTweets);
        return;
      }
      allTweets.push(...tweets);
      var oldestTweet = tweets[tweets.length - 1];
      getTweetsOlderThan(allTweets, iterationsLeft - 1, oldestTweet.id_str, username, twitterClient).then(() => {
        resolve(allTweets);
      }).catch((err) => {
        reject(err);
      })
    });
  });
}
