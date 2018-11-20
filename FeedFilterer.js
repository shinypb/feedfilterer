module.exports = class FeedFilterer {
    constructor(config) {
        if (!config.client) throw new Error('Must provide "client"');
        if (!config.rules) throw new Error('Must provide "rules"');

        this.client = config.client;
        this.rules = config.rules;
        this.isDryRun = config.isDryRun;
        this.verboseMode = config.verboseMode;
    }

    execute() {
        console.log('FeedFilterer: getting unread items');
        this.client.getUnreadItems()
            .then((items) => {
                console.log('FeedFilterer: got ' + items.length + ' items');

                let itemsToMarkAsRead = items.filter((item) => {
                    if (this.verboseMode) {
                        console.log(`#${item.itemId} ''${(item.title || '').replace(/\s+/g, ' ').trim()}'' <${item.itemUrl}>`);
                    }
                    return this.rules.some((rule) => rule(item));
                });

                if (itemsToMarkAsRead.length > 0) {
                    console.log('FeedFilterer: will mark ' + itemsToMarkAsRead.length + ' items as read');

                    let promises = itemsToMarkAsRead.map((item) => {
                        console.log('Marking item as read: #' + item.itemId + ' ' + item.title + ' ' + item.itemUrl + '\n' + item.content + '\n\n\n\n');
                        if (this.isDryRun) {
                            console.log('FeedFilterer: (not actually marking as read)');
                            return Promise.resolve();
                        } else {
                            return this.client.markItemAsRead(item);
                        }
                    });

                    Promise.all(promises).then(() => {
                        console.log('FeedFilter: finished marking items as read');
                    });

                } else {
                    console.log('FeedFilterer: nothing to mark as read');
                }
            });
    }
}