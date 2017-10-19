## We Rate Tweets - Search your tweets and learn Algolia

We Rate Tweets is a search-as-you-type experience for exploring your twitter timeline. Tweets are sorted by their total of retweets and likes, not chronologically. This makes it possible to see your most popular tweets at a glance, while increasing the chance that the first search result is the one you were looking for.

Tweets are fetched from the twitter API and then indexed with Algolia. We Rate Tweets is a good way to learn how Algolia works, including how data is structured, indexed, and made searchable on the UI. All of the code is open source, commented for readability, and ready for you to remix. You can give it a test drive before you remix by visiting [https://we-rate-tweets.glitch.me](https://we-rate-tweets.glitch.me).

# How to Remix 🎏

First, hit that sweet, sweet remix link. Your remix won't have environment variables yet, but that's ok, it will soon!

## Create a new Twitter API application 🐦

Click here to go to the [new twitter application page](https://apps.twitter.com/app/new). Once you're there:

![Twitter Signup](public/images/twitterSignUp.png "Twitter Signup")

Fill in the application's name and description. They can be as simple as `sampleTwitterGlitchApplication` and `This app makes tweets searchable with Algolia`. In the URL field, use the one Glitch auto-generated for your remix, which will look like `https://dazzling-brick.glitch.me`. Be sure to grab the `https://` prefix!

After creation, you'll see a page with the credentials for your new application.

![Twitter Application Success](public/images/twitterApplicationSuccess.png "Twitter Application Success")

We recommend that you change the access level to "Read" as that's the only scope needed.

![Twitter Application Success](public/images/twitterRWAccess.png "Twitter Read Write Access")

Navigate to the *Keys and Access Tokens* tab create an access token. Then grab the _four_ keys shown and prepare to copy them to your Glitch app's your `.env` file.

![Twitter Env Keys](public/images/twitterKeysWithReadOnly.png "Twitter Keys")

Here's how to map the keys into the `.env` file:

- `TWITTER_CONSUMER_KEY` - Consumer Key (API Key)  
- `TWITTER_CONSUMER_SECRET` - Consumer Secret (API Secret)
- `TWITTER_ACCESS_KEY` - Access Token
- `TWITTER_ACCESS_TOKEN_SECRET` - Access Token Secret

That's it for Twitter! Let's move on to Algolia.

## Create a new Algolia application 🔎

If you don't already have an Algolia account, you can [sign up here](https://www.algolia.com/cc/glitch) and redeem a special offer for the Glitch community.

![Algolia Signup](public/images/algoliaSignupGlitchGitHubOauthSmall.png "Algolia Signup")

During the sign up process, you'll create a new Algolia application. If you were already an Algolia user, you can create a new application from inside the Algolia Dashboard.

Once you have your new application, navigate to your API Keys on the left hand side of the screen. Copy _three_ values into your Glitch application's `.env` file.

![Algolia API keys](public/images/algoliaAPIkeysMarkedUp.png "Algolia API keys")

Here's how to map the keys into the `.env` file:

- `ALGOLIA_APP_ID` - Application ID
- `ALGOLIA_SEARCH_API_KEY` - Search-only API key
- `ALGOLIA_ADMIN_API_KEY` - Admin API key

Once Glitch has applied your changes, you can visit the live version of your app and see the first page. Assuming everything is configured correctly, you can authenticate with Twitter and start searching your tweets!

The tweets will be stored in your Algolia application inside of an index called `tweets-username` where `username` is your twitter account handle.

## Remix Possibilities

There are several benefits to remixing We Rate Tweets, which include indexing a larger number of tweets, indexing any public twitter timeline, and full customization of the look and feel, including the emojis are used for rating the tweets.

### Amount of tweets indexed

Change the value of the `NUMBER_OF_TWEETS_TO_FETCH` environment variable. The maximum value that tweets that twitter lets you fetch historically for a user is 3,200. Note that the real amount that are indexed will be lower, as retweets are not included.

### Searching other users' timelines

In your remix, you can index timelines for users other than the logged in user, just set `ALLOW_INDEXING_OF_OTHER_TIMELINES` to `1`. An input box will appear near the bottom of the tweets search page that will let you index and search the tweets of other users.

### Rating emojis

The emojis that map to the rating of each tweet can be found in `public/search.js`. Change any of them to create a more personal experience.

``` javascript
var ratemoji = {
  0:  "💩",
  1:  "😖",
  2:  "😣",
  3:  "😦",
  4:  "😒",
  5:  "😞",
  6:  "😐",
  7:  "😑",
  8:  "🙃",
  9:  "😏",
  10: "🤔",
  11: "😌", // 11 - 19
  12: "🙂", // 20 - 39
  13: "😃", // 40 - 59
  14: "😃", // 60 - 79
  15: "🤓", // 80 - 99
  16: "😅", // 100 - 999
  17: "😂", // 1,000 - 9,999
  18: "😘", // 10,000 - 99,999
  19: "😍", // 100,000 - 999,999
  20: "🦄"  // 1,000,000 - 9,999,999
}
```

## Getting help

If you run into any issues using or remixing this app, let us know on [Algolia's Community Forum](https://discourse.algolia.com/) and we'll be happy to help. Happy remixing!
