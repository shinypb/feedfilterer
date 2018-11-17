const fs = require('fs');
const path = require('path');
const request = require('request');
const FeedClient = require('../FeedClient');
const FeedItem = require('../FeedItem');

const CACHE_DIRECTORY_PATH = path.join(process.env.TMPDIR, 'FeedFiltererFeedbinClientCache');

module.exports = class FeedbinClient extends FeedClient {
    constructor(credentials) {
        super();

        if (!credentials.username) throw new Error('Set credentials.username in configuration file');
        if (!credentials.password) throw new Error('Set credentials.password in configuration file');

        this.username = credentials.username;
        this.password = credentials.password;

        this.useCache = initializeCache();

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
                    reject(new Error('Got error when talking to API: ' + error));
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

                        // Fetch items from cache
                        let cachedItems = this.useCache ? unreadItemIds.map(getItemFromCache).filter(isDefined) : [];
                        let cachedItemIds = cachedItems.map((item) => item.itemId);
                        let itemIdsToFetch = unreadItemIds.filter((itemId) => {
                            return !cachedItemIds.includes(itemId);
                        });

                        if (this.useCache) {
                            console.log('FeedbinClient: got ' + cachedItems.length + ' from cache; fetching ' + itemIdsToFetch.length + ' from API');
                        }

                        const MAX_IDS_PER_FETCH = 100; // Feedbin's undocumented limit

                        let promises = chunkify(itemIdsToFetch, MAX_IDS_PER_FETCH).map((idSubset) => {
                            return this.makeApiRequest('https://api.feedbin.com/v2/entries.json?ids=' + idSubset.join(','))
                                .then(({response, body}) => {
                                    if (response.statusCode !== 200) throw new Error('Unexpected response code: ' + response.statusCode);

                                    let feedbinEntries = JSON.parse(body);
                                    return feedbinEntries.map((feedbinEntry) => {
                                        return new FeedItem(feedbinEntry.id, feedbinEntry.title, feedbinEntry.content, feedbinEntry.url, feedbinEntry.author);
                                    });
                                });
                        });
                        console.log('FeedbinClient: fetching entries in chunks of ' + MAX_IDS_PER_FETCH + ', which means ' + promises.length + ' API calls');

                        return Promise.all(promises).then((chunkedFeedbinEntries) => {
                            let flattenedFeedbinEntries = chunkedFeedbinEntries.reduce((flattedArray, chunk) => {
                                return flattedArray.concat(chunk);
                            }, cachedItems);

                            console.log('FeedbinClient: all fetches complete; got ' + flattenedFeedbinEntries.length + ' items total');

                            if (this.useCache) {
                                console.log('FeedbinClient: writing ' + itemIdsToFetch.length + ' items to cache');
                                flattenedFeedbinEntries.forEach((item) => {
                                    if (!itemIdsToFetch.includes(item.itemId)) return; // already cached

                                    writeItemToCache(item);
                                });

                                cleanCache(unreadItemIds);
                            }

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

function initializeCache() {
    if (fs.existsSync(CACHE_DIRECTORY_PATH)) return true;

    try {
        fs.mkdirSync(CACHE_DIRECTORY_PATH);
        return true;
    } catch (e) {
        console.warn('FeedbinClient: error creating cache directory; disabling cache: ' + e.message);
        return false;
    }
}

function makeCacheFilenameForItemId(id) {
    return path.join(CACHE_DIRECTORY_PATH, id + '.json');
}

function getItemFromCache(id) {
    let cacheFilename = makeCacheFilenameForItemId(id);
    if (!fs.existsSync(cacheFilename)) return;

    try {
        let jsonData = fs.readFileSync(cacheFilename).toString();
        let data = JSON.parse(jsonData);
        return new FeedItem(data.itemId, data.title, data.content, data.itemUrl, data.author);
    } catch (e) {
        console.warn('FeedbinClient: item #' + item.itemId + ' exists in cache but is not readable: ' + e.message);
    }
}

function writeItemToCache(item) {
        let cacheFilename = makeCacheFilenameForItemId(item.itemId);
        let data = JSON.stringify({
            itemId: item.itemId,
            title: item.title,
            content: item.content,
            itemUrl: item.itemUrl,
            author: item.author,
        });

        try {
            fs.writeFileSync(cacheFilename, data);
        } catch (e) {
            console.warn('FeedbinClient: error writing item #' + item.itemId + ' to cache: ' + e.message);
        }
}

function isDefined(val) {
    return typeof val !== 'undefined';
}

function cleanCache(itemIds) {
    const allCachedItems = fs.readdirSync(CACHE_DIRECTORY_PATH).filter((filename) => {
        return /\.json$/.test(filename);
    }).map((filename) => {
        let itemId = filename.replace(/\.json$/, '');
        return makeCacheFilenameForItemId(itemId);
    });

    const cacheFilenamesToKeep = itemIds.map(makeCacheFilenameForItemId);
    const cacheFilenamesToDelete = allCachedItems.filter((cacheFilename) => {
        return !cacheFilenamesToKeep.includes(cacheFilename);
    });

    if (cacheFilenamesToDelete.length > 0) {
        console.log('FeedbinClient: cleaning up ' + cacheFilenamesToDelete.length + ' old items from cache');
    }

    cacheFilenamesToDelete.forEach((filename) => {
        try {
            fs.unlinkSync(filename);
        } catch (e) {
            console.warn('FeedbinClient: error removing obsolete cache file ' + filename + ' from cache: ' + e.message);
        }
    });
}