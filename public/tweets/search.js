// create reference to global variables to make the glitch editor happy
var instantsearch = window.instantsearch;
var moment = window.moment;

// the object set by the server containing valuable configuration info
var weRateTweets = window.weRateTweets;

// create an instantsearch instance with our app id and api key
var search = instantsearch({
  appId: weRateTweets.algolia.app_id,
  apiKey: weRateTweets.algolia.search_api_key,
  indexName: weRateTweets.algolia.index_name,
  urlSync: true,
  searchParameters: {
    hitsPerPage: 9
  }
});

// connect the search box on our HTML page
search.addWidget(
  instantsearch.widgets.searchBox({
    container: '#search-box',
    placeholder: 'Search @' + weRateTweets.request.username + '\'s tweets...'
  })
);

// connect a pagination widget for browsing results
search.addWidget(
  instantsearch.widgets.pagination({
    container: '#pagination-container',
    scrollTo: false
  })
);

// connect a stats widget to show total number of results
search.addWidget(
  instantsearch.widgets.stats({
    container: '#stats-container'
  })
);

// connect the container where hits will be displayed
search.addWidget(
  instantsearch.widgets.hits({
    container: '#hits-container',
    cssClasses: {
      root: 'list-none flex-container flex-dir-row p-small no-p-l no-p-r',
      item: 'flex-it-3 p-small'
    },
    templates: {
      // this template is shown when there are no results
      empty: `
        <p class='fill-white p-xlarge elevation1'>
          <strong>No results found...</strong>
          is this something you've tweeted about recently?
        </p>`,
      // this is the main template, each search hit is passed into it
      item: function(hit) {
        try {
          let timeDisplay = moment(new Date(hit.created_at * 1000)).format("MMM D 'YY, h:mma");
          return `
            <div class="fill-white elevation1 p-xlarge text-left radius6 card-border pos-rel">
              <div class="card-border-line gradient-dark"></div>
              <p>
                <a class="color-bunting" href="https://twitter.com/${hit.user.name}"><strong>${hit.user.name}</strong></a>
                <a class="text-muted" href="https://twitter.com/${hit.user.screen_name}">@${hit.user.screen_name}</a>
                <span class="spacer8"></span>
                <span class="hit-text">${hit._highlightResult.text.value}</span>
              </p>
              <span class="hit-footer color-portage text-sm">
                <img class="twitter-icon" src="/images/twitter-retweet.png"> ${hit.retweet_count}
                &middot;
                <img class="twitter-icon" src="/images/twitter-heart.png"> ${hit.favorite_count}
                &middot;
                <a href="https://twitter.com/${hit.user.screen_name}/status/${hit.id_str}" target="_blank" class="no-decoration color-portage">
                  ${timeDisplay}
                </a>
                <div class="tweet-rating color-mulberry text-sm text-bold" title="We Rate Tweets Ranking Score">
                  ${calculateEngagementEmoji(hit.total_count)}
                </div>
              </span>
            </div>
          `;
        } catch (e) {
          console.warn("Couldn't render hit", hit, e);
          return "";
        }
      }
    }
  })
);

// kick off the first search
search.start();

// wire up the controls for visiting/indexing another timeline
// only if this is allowed at the app level
if (weRateTweets.environment.allow_indexing_of_other_timelines) {
  // navigate to the search page of a different user timeline
  function searchOtherUser() {
    var value = document.getElementById('other-user-input').value;
    if (value) {
      value = value.replace(/@/, '');
      document.location.href = '/' + value + '/tweets/search';
    }
  }

  // wire up the other user button
  document.getElementById('other-user-button').onclick = searchOtherUser;
  document.getElementById('other-user-input').addEventListener('keypress', function(event) {
    if (event.keyCode === 13)
      searchOtherUser();
  });
}

// helper functions

// return a random integer in the range 0 through n - 1
function randomInt(n) {
    return Math.floor(Math.random() * n);
}

// return a random element from an array
function randomElement(array) {
    return array[randomInt(array.length)];
}
// choose the right emoji for the tweet based on its total_count
function calculateEngagementEmoji(number) {
  const cheekyComments = ['Excellent content', 'The hero we need', 'Industry Leader',
  'WowWowWow', 'So on fleek', 'That tweet... It me',
  'TBH...', 'Perf!', 'Amaze!']

  switch (true) {
    case (number >= 0 && number <= 9):
      return `${randomElement(cheekyComments)}: ${number}/10 😏 keep tweetering`;
    break;
    case (number >= 10 && number <= 100):
      return `${randomElement(cheekyComments)}: 11/10 🎭 Would share with others`;
    break;
    case (number >= 101 && number <= 500):
      return `${randomElement(cheekyComments)}: 12/10 💖 Would press da heart`;
    break;
    case (number >= 501 && number <= 1000):
      return `${randomElement(cheekyComments)}: 13/10🤘 Would love all things`;
    break;
    case (number >= 1001 && number <= 2000):
      return `${randomElement(cheekyComments)}: 14/10 🦄 Hundo percent, would DirectMessage`;
    break;
    default:
      return `${randomElement(cheekyComments)}: 15/10 💥🎉 Would find you and discuss IRL`;
  }
}
