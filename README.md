# FeedFilterer

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
