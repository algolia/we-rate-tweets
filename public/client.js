function calculateEngagementEmoji(number){
  switch (true) {
    case (number <= 0):
      return '😏 0/10 keep tweeting'
    break;
    case (number >= 1 && number <= 5):
      return `${(number + 2)}/10 🎭 Would RT`
    break;
    case (number >= 5 && number <= 9):
      return `${(number + 3)}/10 💖 Would Like`
    break;
    case (number >= 9 && number <= 15):
      return `${(number + 4)}/10 🤘 Would like & RT`
    break;
    case (number >= 15 && number <= 20):
      return `${(number + 5)}/10 🐬 Would DM`
    break;
    case (number < 200):
      return `${(number + 2)}/10 💥🎉 Would discuss IRL`
    break;
    default:
      return '😍 bring faves back'
  }
  console.log(number);
}

const weRateTweets = window.weRateTweets;
const search = instantsearch({
  appId: weRateTweets.algolia.app_id,
  apiKey: weRateTweets.algolia.search_api_key,
  indexName: `tweets-${weRateTweets.user.username}`,
  urlSync: false,
  searchParameters: {
    hitsPerPage: 9
  }
});

search.addWidget(
  instantsearch.widgets.searchBox({
    container: '#search-box',
    placeholder: 'Search your tweets'
  })
);

search.addWidget(
  instantsearch.widgets.pagination({
    container: '#pagination-container',
    scrollTo: false
  })
);

search.addWidget(
  instantsearch.widgets.hits({
    container: '#hits-container',
    cssClasses: {
      root: 'list-none flex-container flex-dir-row p-small no-p-l no-p-r',
      item: 'flex-it-3 p-small'
    },
    templates: {
      empty: `
        <p class='fill-white p-xlarge elevation1'>
          <strong>No results found...</strong>
          is this something you've tweeted about recently?
        </p>`,
      item: function(hit) {
        return `
          <div class="fill-white elevation1 p-xlarge text-left radius6 card-border">
            <div class="card-border-line gradient-dark"></div>
            <p>
              <a href="${hit.url}" target="_blank" class="no-decoration color-portage">
                ${hit._highlightResult.text.value}
              </a>
            </p>
            <span class="adulationScore color-bunting">
              <i class="twitter-icon inline vertical-align-middle"></i>
              &nbsp; ${calculateEngagementEmoji(hit.total_count)}
            </span>
          </div>
        `;
      }
    }
  })
);

search.start();
