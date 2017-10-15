const emojiRegex = require('emoji-regex')();
const urlRegex = /(?:https?|ftp):\/\/[\n\S]+/g;

module.exports = {
  queryIndex: queryIndex,
  indexTweets: indexTweets,
  configureIndex: configureIndex
};

// fetch tweets from twitter, configure the algolia index, and
// convert the tweets to algolia objects, and upload them to the index
function indexTweets(username, tweets, algoliaClient) {

  // this promise will resolve once all steps complete, or
  // reject if any step has an error
  return new Promise((resolve, reject) => {

    // the algolia index name contains the user's twitter handle,
    // so that tweets from different users remain separate
    var algoliaIndexName = indexName(username);
    var algoliaIndex = algoliaClient.initIndex(algoliaIndexName);

    // convert tweets to algolia objects
    var algoliaObjects = tweetsToAlgoliaObjects(tweets);
    // add the objects in one bulk API call for best speed
    algoliaIndex.addObjects(algoliaObjects, (err, content) => {
      if (err) {
        reject(err);
      } else {
        // indexing is async on the algolia side
        // use waitTask to return only when it is finished
        algoliaIndex.waitTask(content.taskID, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve(content);
          }
        });
      }
    });
  });
}

// query the index of this user's tweets
function queryIndex(query, username, algoliaClient) {
  return new Promise((resolve, reject) => {

    // the algolia index name contains the user's twitter handle,
    var algoliaIndexName = indexName(username);
    var algoliaIndex = algoliaClient.initIndex(algoliaIndexName);
    algoliaIndex.search({ query: query }, (err, content) => {
      if (err) {
        reject(err);
      } else {
        resolve(content);
      }
    });
  });
}

// algolia index settings can be set via the API
function configureIndex(username, algoliaClient) {
  return new Promise((resolve, reject) => {

    // the algolia index name contains the user's twitter handle,
    // so that tweets from different users remain separate
    var algoliaIndexName = indexName(username);
    var algoliaIndex = algoliaClient.initIndex(algoliaIndexName);

    algoliaIndex.setSettings({
      // only the text of the tweet should be searchable
      searchableAttributes: ['unordered(text)'],
      // only highlight results in the text field
      attributesToHighlight: ['text'],
      // tweets will be ranked by total count with retweets
      // counting more that other interactions, falling back to date
      customRanking: ['desc(total_count)', 'desc(retweet_count)', 'desc(created_at)'],
      // return these attributes for dislaying in search results
      attributesToRetrieve: ['id_str', 'text', 'created_at',
        'retweet_count', 'favorite_count', 'total_count',
        'user.name', 'user.screen_name', 'user.profile_image_url'],
      // make plural and singular matches count the same for these langs
      ignorePlurals: ['en', 'fr']
    }, (err, content) => {
      if (err) {
        reject(err);
      } else {
        resolve(content);
      }
    });
  });
}

// convert an twitter API tweet object to the algolia record
// we will upload and use for the search
function tweetsToAlgoliaObjects(tweets) {
  var algoliaObjects = [];
  // iterate over tweets and build the algolia record
  for (var i = 0; i < tweets.length; i++) {
    var tweet = tweets[i];
    var text = tweet.full_text;
    // remove emojis, as they might not display correctly
    var cleanText = text.replace(emojiRegex, '');
    // remove urls, as we don't want to search nor display them
    cleanText = cleanText.replace(urlRegex, '');
    // create the record that will be sent to algolia if there is text to index
    if (cleanText.trim().length > 0) {
      var algoliaObject = {
        // use id_str not id (an int), as this int gets truncated in JS
        // the objectID is the key for the algolia record, and mapping
        // tweet id to object ID guarantees only one copy of the tweet in algolia
        objectID: tweet.id_str,
        id_str: tweet.id_str,
        text: cleanText,
        created_at: Date.parse(tweet.created_at) / 1000,
        favorite_count: tweet.favorite_count,
        retweet_count: tweet.retweet_count,
        total_count: tweet.retweet_count + tweet.favorite_count,
        user: {
          name: tweet.user.name,
          screen_name: tweet.user.screen_name,
          profile_image_url: tweet.user.profile_image_url
        }
      };
      algoliaObjects.push(algoliaObject);
    }
  }
  return algoliaObjects;
}

function indexName(username) {
  return `tweets-${username}`
}
