module.exports = class FeedItem {
    constructor(itemId, title, content, itemUrl) {
        if (!itemId) throw new Error('Item must have an ID');

        this.itemId = itemId;
        this.title = title || '';
        this.content = content || '';
        this.itemUrl = itemUrl || '';
    }
}
