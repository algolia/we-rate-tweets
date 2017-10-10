module.exports = {
  getTweets: getTweets
};

// fetch tweets from the twitter API
function getTweets(user, twitterClient) {
  return new Promise(function(resolve, reject) {
    // fetch the last 200 tweets from this user, not including retweets
    const params = { screen_name: user.username, count: 200, include_rts: false };
    twitterClient.get('statuses/user_timeline', params, function(error, tweets, response) {
      if (error) {
        reject(error);
      } else {
        resolve(tweets);
      }
    });
  });
}
