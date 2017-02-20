/**
 *  @param {FeedItem} item - item to evaluation
 *  @return {Boolean} true if the item should be marked as read
 */
module.exports = function ExampleRule(item) {
    if (item.title === 'Exclude this item') return true;
    if (item.itemUrl === 'https://example.com/') return true;
    if (item.content === 'This is a boring item that should be excluded') return true;
}