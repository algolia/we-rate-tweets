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
        var bird = birds[Math.floor(Math.random() * birds.length)];
        try {
          var timeDisplay = moment(new Date(hit.created_at * 1000)).format("MMM D 'YY, h:mma");
          var ratingTier = calculateRatingTier(hit.total_count);
          return `
            <div class="fill-white elevation1 p-xlarge text-left radius6 card-border pos-rel">
              <div class="card-border-line gradient-dark"></div>
              <p>
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
              </span>
                <div class="tweet-rating color-mulberry text-sm text-bold" title="Rating based on number of retweets + likes">
                  <span class="rating-row">
                    <span class="emoji-rating">${ratemoji[ratingTier]}</span>
                    <img class="emoji-bubble" src="/images/emoji-bubble.svg">
                    <span class="rating-text">${ratingTier}/10</span>
                  </span>
                  <img class="bird bird-${bird}" src="/images/${bird}.svg">
                </div>
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

var birds = ['hector', 'elisabeth', 'george'];

// tweets are rated on a linear scale from 1-10 and a base-10 logrithmic
// scale beyond that. in your remix, change the emojis to suit your preference!
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

// return the number for 0-10
// return 11-15 for 11-100
// return base 10 log over 100
// this helps us space out the high ratings
function calculateRatingTier(number) {
  var ratingTier;
  if (number === 0) {
    ratingTier = 0;
  } else if (number >= 1 && number <= 10) {
    ratingTier = number;
  } else if (number >= 11 && number <= 19) {
    ratingTier = 11;
  } else if (number >= 12 && number <= 39) {
    ratingTier = 12;
  } else if (number >= 40 && number <= 59) {
    ratingTier = 13;
  } else if (number >= 60 && number <= 79) {
    ratingTier = 14;
  } else if (number >= 80 && number <= 99) {
    ratingTier = 15;
  } else {
    ratingTier = 15 - 1 + Math.floor(Math.log10(number));
  }
  return ratingTier;
}
