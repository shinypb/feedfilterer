module.exports = class FeedClient {
    constructor() {}

    /**
     *  Returns an array of FeedItem instances.
     *  @return {Promise.<FeedItem[]>}
     */
    getUnreadItems() {
        return Promise.reject(new Error('Not implemented'));
    }

    /*
     *  Marks the given feed item as read.
     *  @param {FeedItem} item - item to mark as unread
     *  @return {Promise} resolved when item has been marked as read
     */
    markItemAsRead(item) {
        return Promise.reject(new Error('Not implemented'));
    }
}
