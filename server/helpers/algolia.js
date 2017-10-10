module.exports = {
  indexTweets: indexTweets
};

// fetch tweets from twitter, configure the algolia index, and
// convert the tweets to algolia objects, and upload them to the index
function indexTweets(user, tweets, algoliaClient) {

  // this promise will resolve once all steps complete, or
  // reject if any step has an error
  return new Promise(function(resolve, reject) {

    // the algolia index name contains the user's twitter handle,
    // so that tweets from different users remain separate
    let algoliaIndexName = `tweets-${user.username}`;
    let algoliaIndex = algoliaClient.initIndex(algoliaIndexName);

    // push the algolia index settings
    pushAlgoliaIndexSettings(algoliaIndex).then(() => {
      // convert tweets to algolia objects
      let algoliaObjects = tweetsToAlgoliaObjects(tweets);
      // add the objects in one bulk API call for best speed
      algoliaIndex.addObjects(algoliaObjects, function(err, content) {
        if (err) {
          reject(err);
        } else {
          resolve(content);
        }
      });
    });
  });
}

// convert an twitter API tweet object to the algolia record
// we will upload and use for the search
function tweetsToAlgoliaObjects(tweets) {
  const algoliaObjects = [];
  // iterate over tweets and build the algolia record
  for (var i = 0; i < tweets.length; i++){
    var tweet = tweets[i];
    var algoliaObject = {
      // use id_str not id (an int), as this int gets truncated in JS
      // the objectID is the key for the algolia record, and mapping
      // tweet id to object ID guarantees only one copy of the tweet in algolia
      objectID: tweet.id_str,
      id: tweet.id_str,
      text: tweet.text,
      created_at: Date.parse(tweet.created_at) / 1000,
      favorite_count: tweet.favorite_count,
      retweet_count: tweet.retweet_count,
      reply_count: tweet.reply_count,
      quote_count: tweet.quote_count,
      url: `https://twitter.com/${tweet.user.username}/status/${tweet.id_str}`
    };
    algoliaObjects.push(algoliaObject);
  }
  return algoliaObjects;
}

// algolia index settings can be set via the API
function pushAlgoliaIndexSettings(index) {
  return new Promise(function(resolve, reject) {
    index.setSettings({
      // only the text of the tweet should be searchable
      searchableAttributes: ['text'],
      // tweets should be ranked by retweet and then favorite count
      customRanking: ['desc(retweet_count)', 'desc(favorite_count)', 'desc(created_at)'],
      // return these attributes by default when a search is made
		  attributesToRetrieve: ['id', 'text', 'url', 'favorite_count', 'retweet_count'],
      // make plural and singular matches count the same for these langs
      ignorePlurals: ['en', 'fr']
    }, function(err, content) {
      if (err) {
        reject(err);
      } else {
        resolve(content);
      }
    });
  });
}
