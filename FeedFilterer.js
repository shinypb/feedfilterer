module.exports = class FeedFilterer {
    constructor(config) {
        if (!config.client) throw new Error('Must provide "client"');
        if (!config.rules) throw new Error('Must provide "rules"');

        this.client = config.client;
        this.rules = config.rules;
    }

    execute() {
        console.log('FeedFilterer: getting unread items');
        this.client.getUnreadItems()
            .then((items) => {
                console.log('FeedFilterer: got ' + items.length + ' items');

                let itemsToMarkAsRead = items.filter((item) => {
                    return this.rules.some((rule) => rule(item));
                });

                if (itemsToMarkAsRead.length > 0) {
                    console.log('FeedFilterer: will mark ' + itemsToMarkAsRead.length + ' items as read');
                } else {
                    console.log('FeedFilterer: nothing to mark as read');
                }
            });
    }
}