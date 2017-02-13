const env = require('process').env;
const ExcludePodcastAnnouncements = require('./rules/ExcludePodcastAnnouncements');
const ExcludeSponsors = require('./rules/ExcludeSponsors');
const FeedbinClient = require('./clients/FeedbinClient');
const FeedFilterer = require('./FeedFilterer');

if (!env.FEEDBIN_USERNAME) throw new Error('Set FEEDBIN_USERNAME environment variable');
if (!env.FEEDBIN_PASSWORD) throw new Error('Set FEEDBIN_PASSWORD environment variable');
let client = new FeedbinClient(env.FEEDBIN_USERNAME, env.FEEDBIN_PASSWORD);

let isDryRun = (env.DRY_RUN == '1')
let ff = new FeedFilterer({
    client: client,
    rules: [ ExcludePodcastAnnouncements, ExcludeSponsors ],
    isDryRun: isDryRun
});

ff.execute();