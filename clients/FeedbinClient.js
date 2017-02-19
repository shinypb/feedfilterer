const request = require('request');
const FeedClient = require('../FeedClient');
const FeedItem = require('../FeedItem');

module.exports = class FeedbinClient extends FeedClient {
    constructor(credentials) {
        super();

        if (!credentials.username) throw new Error('Set credentials.username in configuration file');
        if (!credentials.password) throw new Error('Set credentials.password in configuration file');

        this.username = credentials.username;
        this.password = credentials.password;

        this.ensureAuthenticated()
            .then(() => console.log('FeedbinClient: Credentials OK'))
            .catch((e) => console.error('FeedbinClient: credentials rejected'));
    }

    ensureAuthenticated() {
        if (!this.ensureAuthenticatedPromise) {
            this.ensureAuthenticatedPromise = this.makeApiRequest('https://api.feedbin.com/v2/authentication.json')
                .then(({response, body}) => {
                    if (response.statusCode == 200) {
                        return null;
                    } else if (response.statusCode == 401) {
                        throw new Error('Invalid credentials');
                    } else {
                        throw new Error('Unexpected status code: ' + response.statusCode);
                    }
                });
        }

        return this.ensureAuthenticatedPromise;
    }

    makeApiRequest(url, method = 'get', params = {}) {
        return new Promise((resolve, reject) => {

            function callback(error, response, body) {
                if (error) {
                    reject(new Error('Got error when talking to API: ' + err));
                }

                resolve({
                    response: response,
                    body: body,
                });
            }

            request[method](url, callback)
                .auth(this.username, this.password)
                .form(params)
        });
    }

    getUnreadItems() {
        return this.ensureAuthenticated()
            .then(() => {
                console.log('FeedbinClient: getting list of unread items');
                return this.makeApiRequest('https://api.feedbin.com/v2/unread_entries.json')
                    .then(({response, body}) => {
                        if (response.statusCode !== 200) throw new Error('Unexpected response code: ' + response.statusCode);

                        return JSON.parse(body);
                    })
                    .then((unreadItemIds) => {
                        console.log('FeedbinClient: there are ' + unreadItemIds.length + ' unread items');

                        const MAX_IDS_PER_FETCH = 100; // Feedbin's undocumented limit

                        let promises = chunkify(unreadItemIds, MAX_IDS_PER_FETCH).map((idSubset) => {
                            return this.makeApiRequest('https://api.feedbin.com/v2/entries.json?ids=' + idSubset.join(','))
                                .then(({response, body}) => {
                                    if (response.statusCode !== 200) throw new Error('Unexpected response code: ' + response.statusCode);

                                    let feedbinEntries = JSON.parse(body);
                                    return feedbinEntries.map((feedbinEntry) => {
                                        return new FeedItem(feedbinEntry.id, feedbinEntry.title, feedbinEntry.content, feedbinEntry.url);
                                    });
                                });
                        });
                        console.log('FeedbinClient: fetching entries in chunks of ' + MAX_IDS_PER_FETCH + ', which means ' + promises.length + ' API calls');

                        return Promise.all(promises).then((chunkedFeedbinEntries) => {
                            let flattenedFeedbinEntries = chunkedFeedbinEntries.reduce((flattedArray, chunk) => {
                                return flattedArray.concat(chunk);
                            }, []);

                            console.log('FeedbinClient: all fetches complete; got ' + flattenedFeedbinEntries.length + ' items total');
                            return flattenedFeedbinEntries;
                        }).catch((err) => { console.error(err); });
                    }).catch((err) => { console.error(err); });
            });
    }

    markItemAsRead(item) {
        return this.makeApiRequest('https://api.feedbin.com/v2/unread_entries.json?unread_entries=' + item.itemId, 'delete').then(() => null);
    }
}

function chunkify(arr, maxCount) {

    let chunks = [];

    function worker(arr) {
        if (arr.length <= maxCount) {
            chunks.push(arr);
        } else {
            chunks.push(arr.slice(0, maxCount));
            worker(arr.slice(maxCount, Infinity));
        }
    }

    worker(arr);

    return chunks;
}
