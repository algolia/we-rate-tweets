function searchTweets(query) {
	const algoliasearch = require('algoliasearch');
	const client = algoliasearch(process.env.ALGOLIA_APP_ID, process.env.ALGOLIA_ADMIN_KEY);
	const index = client.initIndex('usertimeline');
	return new Promise(function(resolve, reject) {
		index.search(query, {
		  attributesToRetrieve: ['id', 'text', 'url', 'favoriteCount', 'retweetCount'],
		  hitsPerPage: 10
		}, function searchDone(err, content) {
			if (err) reject(err)
			else
        resolve(content)
		});
	});
}
