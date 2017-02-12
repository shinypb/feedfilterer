const request = require('request');
const FeedClient = require('./FeedClient');
const FeedItem = require('./FeedItem');

module.exports = class FeedbinClient extends FeedClient {
    constructor(username, password) {
        super();

        this.username = username;
        this.password = password;

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

    makeApiRequest(url, params = {}, method = 'get') {
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
                        console.log('FeedbinClient: unread item ids = ' + unreadItemIds.length);

                        const MAX_IDS_PER_FETCH = 100; // Feedbin's undocumented limit
                        // TODO: make multiple requests until we have gotten everything, rather than
                        // only looking at the first 100 items.
                        return this.makeApiRequest('https://api.feedbin.com/v2/entries.json?ids=' + unreadItemIds.slice(0, MAX_IDS_PER_FETCH).join(','))
                            .then(({response, body}) => {
                                if (response.statusCode !== 200) throw new Error('Unexpected response code: ' + response.statusCode);

                                let feedbinEntries = JSON.parse(body);
                                console.log('FeedbinClient: fetched ' + feedbinEntries.length + ' entries');
                                return feedbinEntries.map((feedbinEntry) => {
                                    return new FeedItem(feedbinEntry.id, feedbinEntry.title, feedbinEntry.content, feedbinEntry.url);
                                });
                            });
                    });
            });
    }

    markItemAsRead(item) {
        return Promise.reject(new Error('Not implemented'));
    }
}