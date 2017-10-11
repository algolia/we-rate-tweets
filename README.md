## A sample application using Twitter OAuth and Algolia Search. 

### What is this used for?
We use Twitter authenticate a user, on successful authentication of a user we kick off a series of actions prior to bringing the user to a success page with a cookie set.

Once we receive success we kick of a series of promises with fetchAndIndexTweets that takes the username from the parameters of the successful authentication. This calls getTweets starts a call with a promise to Twitter's GET_USER_TIMELINE to grab the user's last 200 tweets. Once we successfully receive the timeline, we resolve with another promise to indexTweets which takes in our Twitter username, our response from Twitter and the Algolia client. We initiate an index specifically for that user named from their username; push the settings via pushAlgoliaIndexSettings and then we iterate over the tweets to build and push objects for Algolia. Once this is complete, we render our success page and a user is able to start searching their top tweets.

# How to Remix into your own! 🎏
- Hit that sweet sweet remix link 
- Sign up for a Twitter app account [here](https://apps.twitter.com/app/new) and add your credentials in the .env file
- Sign up for an Algolia account [here](https://www.algolia.com/cc/glitch) and add your credentials in the .env file

## Sign up for a Twitter account 🐦
You only need a few things to get started with a Twitter app, so let's get started! Once we land on this page:
[Screenshot of homepage]
We want to fill that in with your application name, can be anything, but your user will see it when they are authorizing. Choose something like `awesome_twitter_search_app`, it must be under 32 characters. 
Then we fill out a quick description like `app to authorize twitter to look at my tweets`, it must be under 200 characters.
Final step! We need a URL, so let's use the one Glitch auto-generates for us like `	https://dazzling-brick.glitch.me`. Be sure to grab the `https://` prefix!
After creation, you'll see a summary of your applciation credentials. Navigate to the Keys and Access Tokens tab and you'll be grabbing _four_ keys for your `.env` file.
[Screenshot of Access Token tab]
Consumer Key (API Key) should go with your `TWITTER_CONSUMER_KEY`
Consumer Secret (API Secret) should go with your `TWITTER_CONSUMER_SECRET`

Next, you'll need to create an access token (just with one click!).
[Screenshot of blank access token]
Once you create those, you can fill in your other two Twitter keys needed.
Access Token should go with your `TWITTER_ACCESS_KEY`
Access Token Secret should go with your `TWITTER_ACCESS_TOKEN_SECRET`

You're all set from the Twitter side! Let's move onto Algolia.

## Sign up for an Algolia account 🔎
We have a few more steps and then we can begin! First, we'll bring you to our sign up page, where you can create a new account with your own password, or use GitHub or Google authentication.
[Sign Up Page Screenshot]
Once you have successfully signed in, you'll see your dashboard!
[Dashboard screen shot]
Navigate to your API Keys on the left hand side of the screen, you'll be grabbing _three_ keys for your `.env` file.
[API Keys screenshot]
Application ID should go with your `ALGOLIA_APP_ID`
Search-Only API Key should go with your `ALGOLIA_SEARCH_API_KEY`
Admin API Key should go with your `ALGOLIA_ADMIN_API_KEY`

Okay, you're all set! Your app should be purring, green lighted, ready to go! 

et voilà! You can now authorize tweets on your account and the code will create an index in your Algolia account under the name `tweets` and you can choose different options from here. 

Tweet at us for what you create, [Algolia Tweets](https://twitter.com/algolia) we'd love to check it out!

## Deep dive into functions 

We use the `GET_USER_TIMELINE` from Twitter within our `getTweets` function; we are including the `screen_name` we obtain from the OAuth, the `count` of tweets we want to retrieve and `include_rts` to be false to only show us our original tweets.

[Source](https://glitch.com/edit/#!/regal-class?path=server/helpers/twitter.js:6:0)

```
    const params = { screen_name: user.username, count: 200, include_rts: false };
    twitterClient.get('statuses/user_timeline', params, function(error, tweets, response) {
      if (error) {
        reject(error);
      } else {
        resolve(tweets);
      }
    });
```

We take the big response from Twitter and create our own object to send to Algolia with `tweetsToAlgoliaObjects`; we iterate over each tweet response and then return that object.

[Source](https://glitch.com/edit/#!/regal-class?path=server/helpers/algolia.js:36:0)

```
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
      total_count: tweet.retweet_count + tweet.favorite_count,
      url: `https://twitter.com/${tweet.user.username}/status/${tweet.id_str}`
    };
    algoliaObjects.push(algoliaObject);
  }
  return algoliaObjects;
}
```

We need to `setSettings` with Algolia to really make this valuable. We added a custom ranking, that ranks the number of RT's to be the top result back. 

[Source](https://glitch.com/edit/#!/regal-class?path=server/helpers/algolia.js:69:6)
```
index.setSettings({
   // tweets will be ranked by total count with retweets
   // counting more that other interactions, falling back to date
      customRanking: ['desc(total_count)', 'desc(retweet_count)', 'desc(created_at)'],
   // return these attributes for dislaying in search results
      attributesToRetrieve: [
        'text', 'url', 'retweet_count', 'total_count']
});
```

We only want the text of the tweet to be searchable, rather than the date, geo location or any other data we have. So we set that in the `searchableAttributes` within our `setSettings`.

[Source](https://glitch.com/edit/#!/regal-class?path=server/helpers/algolia.js:64:6)
```
// only the text of the tweet should be searchable
  searchableAttributes: ['text'],
// only highlight results in the text field
  attributesToHighlight: ['text'],
```

To clean up our search, we want to ignore plurals for anything in English or French. You can add more languages here if you prefer. 

[Source](https://glitch.com/edit/#!/regal-class?path=server/helpers/algolia.js:75:6)
```
index.set_settings({
  ignorePlurals: ['en', 'fr']
});
```

## Remix Ideas
So what’s next?
We’ve done the building blocks for this application, but there is so much more you can do! Some of our ideas include:
- Changing the Twitter API call to be able to fetch a user's entire timeline with multiple page calls.
- Add sentiment analysis and use faceting to apply a filter
- Allow index to be multi-tenant.