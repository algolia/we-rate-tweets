## A sample application using Twitter OAuth and Algolia Search. 

### You'll need a few things to get started on your own remix:
- Twitter app to insert your Twitter Consumer Key & Secret, Twitter Access Key & Secret. 
- Algolia account with your search key and app id

### What is this used for?
We use Twitter authenticate a user, on successful authentication of a user we kick off a series of actions prior to bringing the user to a success page with a cookie set.

Once we recieve success with kick of a series of promises with `fetchUserTimeline` that takes the username from the parameters of the successful authentication. This starts a call with a promise to Twitter's `GET_USER_TIMELINE` to grab the users last 200 tweets. Once we successful recieve the timeline, we start resolve with another promise to `pullRelevantData` iterate over each tweet and grab the information we find relevant and build a tweet object. Once this is resolved, we start another promise to `sendTimelineToAlgolia` where we send our consolidated tweets to Algolia to create an index. Upon resolving this function, we start another *final* promise to `setAlgoliaIndexAndSettings` to let Algolia know about our settings, like custom rankings. Now that is complete we resolve our promise we started with in `fetchUserTimeline` and display a search box to the user.

## How to Remix into your own! 🎏
- Hit that sweet sweet remix link 
- Sign up for a Twitter app account [here](https://apps.twitter.com/app/new) and add your credentials in the .env file
- Sign up for an Algolia account [here](https://www.algolia.com/cc/glitch) and add your credentials in the .env file

et voilà! You can now authorize tweets on your account and the code will create an index in your Algolia account under the name `usertimeline` and you can choose different options from here. 

Tweet at us for what you create, [Algolia Tweets](https://twitter.com/algolia) we'd love to check it out!
