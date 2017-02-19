# FeedFilterer

FeedFilterer allows you to write rules that will mark feed items as read on your behalf. Use it to
filterer out common things that personally you: your humble author, for example, doesn't want to see
people's podcast announcement, because he has already subscribed to their podcasts in a different
app. The specific things you want to skip are likely to be different than what anyone else would
like to skip, so FeedFilterer is made to be tinkered with (see **Extensibility**, below).

## Installation
````
$ npm install
````

## Configuration
FeedFilterer reads its configuration from `~/.feedfilterer`. You can find an example configuration
in [ExampleConfigFile.json](./ExampleConfigFile.json).

The configuration file requires the following fields to be present:

### `client`
This is the name of one of the clients in the [clients](./clients) directory, without the `Client.js`
suffix. For example, if you wanted to use a client called `ExampleClient.js`, your configuration
file's `client` value should be `Example`.

### `clientConfiguration`
This object will be passed in to the client when it is instantiated. The fields that are required
will vary from client to client, but for the FeedbinClient, it should have `username` and `password`
fields.

## Usage (dry run — won't actually mark things as read)
````
$ node index.js --dry-run
````

## Usage (for real — actually mark things as read)
````
$ node index.js
````

# Extensibility
FeedFilterer is intentionally very modular:

## Adding support for new feed reading services
To add support for a new feed service, add a new subclass of [FeedClient](./FeedClient.js) in the
[clients](./clients) directory. Feed clients must support two methods:

- `getUnreadItems` returns a Promise that is resolved with an array of [FeedItem](./FeedItem.js)s.
This array should contain representations of all of the unread items in all of the feeds that the
user is subscribed to.

- `markItemAsRead` should accept a single `FeedItem` instance and mark that item as read on the feed
reading service. It should return a Promise that has been resolved when the item has been marked as
read.

## Adding new rules to mark things as read
To add a new rule, create a new JavaScript file in the [rules](./rules) directory that exports a
single function. This function should accept a `FeedItem` and return true if the item should be
marked as read.