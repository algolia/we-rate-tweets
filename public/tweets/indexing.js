// make the correct URL based on the username context
var indexUrl = '/' + window.weRateTweets.request.username + '/tweets/index';
// wait at least 2 seconds before animating the next step
var fetchPromise = fetch(indexUrl, { method: 'POST', credentials: 'include' });
var timePromise = new Promise(function(resolve, reject) {
  setTimeout(function() { resolve(); }, 2000);
});
Promise.all([fetchPromise, timePromise]).then(function(response) {
  if (response[0].status === 200) {
    document.getElementById('please-stand-by').style = 'display: none;';
    document.getElementById('yay-success').style = 'display: block;';
  } else {
    alert('Blergh. Indexing and rating the tweets failed. Please check the logs for more information.')
  }
});
