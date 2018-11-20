# FeedFilterer

FeedFilterer allows you to write rules (JavaScript functions) that will mark feed items as read on your behalf.

## Why would I ever want this?
Maybe you subscribe to a great Apple-watching blog that goes bananas over baseball from time to time ([rule](https://gist.github.com/shinypb/c2e507e92d5453813af9bfaa8e51373e)). Or maybe you're subscribed to several feeds that tend to link to the same stuff as each other and wish the same links didn't show up over and over ([rule](https://gist.github.com/shinypb/80d795161ff502ab5010fb31d3ba3dd7)).

Whatever it is, FeedFilterer makes it pretty easy to exclude those items from your feed reader. The
sky's the limit.

## Supported feed reading services

Right now, FeedFilterer only supports FeedBin, but adding support for a new feed reading service is
pretty straightforward (see **Extensibility**, below). Pull requests to add support for more services
would be welcome.

## Installation
````
$ npm install
````

## Configuration
FeedFilterer reads its configuration from `~/.feedfilterer`. You can find an example configuration
in [ExampleConfigFile.json](./ExampleConfigFile.json).

### Required configuration fields
The configuration file requires the following fields to be present:

#### `client`
This is the name of one of the clients in the [clients](./clients) directory, without the `Client.js`
suffix. For example, if you wanted to use a client called `ExampleClient.js`, your configuration
file's `client` value should be `Example`.

#### `clientConfiguration`
This object will be passed in to the client when it is instantiated. The fields that are required
will vary from client to client, but for the FeedbinClient, it should have `username` and `password`
fields.

### Optional configuration fields
You can optionally include the following:

#### `rulesPath`
Specifies the location for rules to be loaded from; if this is omitted, the rules in the
[rules](./rules) subdirectory will be loaded.

## Usage

FeedFilterer is a command line tool. Once you have it set up, you have to run it periodically to
clear the junk out of your feeds. (Your humble author has a cronjob set up to run it every 10
minutes during waking hours.)

### Dry run (won't actually mark things as read)
````
$ ./feedfilterer --dry-run --verbose
````

### For real (be careful — there's no undo)
````
$ ./feedfilterer --verbose
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
To add a new rule, create a new JavaScript file in your [rules](./rules) directory that exports a
single function. This function should accept a `FeedItem` and return true if the item should be
marked as read.
