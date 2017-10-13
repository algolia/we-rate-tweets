module.exports = {
  getTweets: getTweets
};

function getTweetsOlderThan(maxId, user, twitterClient) {
  return new Promise(function (resolve, reject) {
    var params = { screen_name: user.username, count: 200, include_rts: false };
    if (maxId > -1) {
      params.max_id = maxId;
    }
    twitterClient.get('statuses/user_timeline', params, function (error, tweets, response) {
      if (error) {
        reject(error);
      } else {
        resolve(tweets);
      }
    });
  });
}

// fetch tweets from the twitter API
function getTweets(user, twitterClient) {
  return new Promise(function (resolve, reject) {
    // fetch the last 200 tweets from this user, not including retweets
    const allTweets = [];
    var lastId;
    getTweetsOlderThan(-1, user, twitterClient).then((tweets) => {
      if (tweets.length > 0) {
        allTweets.push(...tweets);
        var oldestTweet = tweets[tweets.length - 1];
        getTweetsOlderThan(oldestTweet.id_str, user, twitterClient).then((tweets) => {
          allTweets.push(...tweets);
          resolve(allTweets);
        });
      } else {
        resolve(tweets);
      }
    })
  });
}
