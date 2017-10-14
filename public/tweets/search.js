// the object set by the server containing valuable configuration info
const weRateTweets = window.weRateTweets;

// create an instantsearch instance with our app id and api key
const search = instantsearch({
  appId: weRateTweets.algolia.app_id,
  apiKey: weRateTweets.algolia.search_api_key,
  indexName: weRateTweets.algolia.index_name,
  urlSync: false,
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
          return `
            <div class="fill-white elevation1 p-xlarge text-left radius6 card-border">
              <div class="card-border-line gradient-dark"></div>
              <p>
                <span>
                  <strong><a target="_blank" href="https://twitter.com/${hit.user.screen_name}">@${hit.user.screen_name}</a></strong>:
                  ${hit._highlightResult.text.value}</span>
                <br>
                <a href="https://twitter.com/${hit.user.screen_name}/status/${hit.id_str}" target="_blank" class="no-decoration color-portage">
                  ${moment(new Date(hit.created_at * 1000)).format("MMM D, h:mma")}
                </a>
              </p>
              <span class="color-bunting">
                <i class="twitter-icon inline vertical-align-middle"></i>
                &nbsp; ${calculateEngagementEmoji(hit.total_count)}
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

// wire up the other user button
document.getElementById('other-user-button').onclick = function(event) {
  var value = document.getElementById('other-user-input').value;
  if (value) {
    value = value.replace(/@/, '');
    document.location.href = '/' + value + '/tweets/search';
  }
}

// helper functions

// choose the right emoji for the tweet based on its total_count
function calculateEngagementEmoji(number) {
  switch (true) {
    case (number <= 0):
      return '😏 0/10 keep tweeting';
    break;
    case (number >= 1 && number <= 5):
      return `${(number)}/10 🎭 Would RT`;
    break;
    case (number >= 5 && number <= 9):
      return `${(number)}/10 💖 Would Like`;
    break;
    case (number >= 9 && number <= 15):
      return `${(number)}/10 🤘 Would like & RT`;
    break;
    case (number >= 15 && number <= 20):
      return `${(number)}/10 🐬 Would DM`;
    break;
    default:
      return `${(number)}/10 💥🎉 Would discuss IRL`;
  }
}
