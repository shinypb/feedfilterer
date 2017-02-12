module.exports = class FeedClient {
    constructor() {}

    getUnreadItems() {
        return Promise.reject(new Error('Not implemented'));
    }

    markItemAsRead(item) {
        return Promise.reject(new Error('Not implemented'));
    }
}
