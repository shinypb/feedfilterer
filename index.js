const fs = require('fs');
const path = require('path');

// Read configuration
const configFilePath = path.join(process.env.HOME, '.feedfilterer');
if (!fs.existsSync(configFilePath)) {
    console.error('Missing configuration file -- expected to find it at ' + configFilePath);
    process.exit(1);
}
const configFileRawData = fs.readFileSync(configFilePath).toString();

let config;
try {
    config = JSON.parse(configFileRawData);
} catch (e) {
    console.error('Unable to parse config file: ' + e.message);
    process.exit(1);
}

// Validate the configuration file
if (typeof config.client !== 'string') {
    console.error('Configuration file should include a "client" value');
    process.exit(1);
}
if (typeof config.clientConfiguration !== 'object') {
    console.error('Configuration file should include a "clientConfiguration" value');
    process.exit(1);
}
if (config.hasOwnProperty('rulesPath')) {
    if (typeof config.rulesPath !== 'string') {
        console.error('"rulesPath" in configuration file should be a string');
        process.exit(1);
    }
}

// Enumerate all available clients
const clientsPath = path.join(__dirname, 'clients');
const validClients = fs.readdirSync(clientsPath).filter((filename) => {
    return /Client\.js$/.test(filename);
}).map((filename) => {
    return filename.replace(/Client\.js$/, '');
});

// Instantiate the client we want to use
if (!validClients.includes(config.client)) {
    console.error('Unable to find a client for ' + config.client + '; available clients: ' + validClients.join(', '));
    process.exit(1);
}

const ClientClass = require('./clients/' + config.client + 'Client');
let client = new ClientClass(config.clientConfiguration);

// Load the rules
const rulesPath = normalizeAndExpandTildesInPath(config.rulesPath) || path.join(__dirname, 'rules');
if (!fs.existsSync(rulesPath)) {
    console.error('Expected to find rules at ' + rulesPath);
    process.exit(1);
}
const rules = fs.readdirSync(rulesPath).filter((filename) => {
    return /\.js$/.test(filename);
}).map((filename) => {
    try {
        return require(path.join(rulesPath, filename));
    } catch (e) {
        console.warn('Unable to load rule ' + filename + '; skipping it. (Error: ' + e.message + ')');
        return null;
    }
}).filter((ruleFunction) => {
    return (typeof ruleFunction == 'function');
});

if (process.argv.includes('-h') || process.argv.includes('--help')) {
    console.log('usage: node index.js [-d / --dry-run] [-h / --help] [-v / --verbose-mode]');
    process.exit();
}

const isDryRun = (process.argv.includes('-d') || process.argv.includes('--dry-run'));
const verboseMode = (process.argv.includes('-v') || process.argv.includes('--verbose'));

let rulesReadable = rules.map((rule) => rule.name).join(', ');
console.log('Using ' + config.client + ' client');
console.log('Loaded ' + rules.length + ' rules from ' + rulesPath + ': ' + rulesReadable);

if (isDryRun) console.log('This is a dry-run');
if (verboseMode) console.log('Verbose mode enabled');

const FeedFilterer = require('./FeedFilterer');
let ff = new FeedFilterer({
    client: client,
    rules: rules,
    isDryRun: isDryRun,
    verboseMode: verboseMode,
});

ff.execute();

function normalizeAndExpandTildesInPath(filename) {
    if (!filename) return filename;

    const expandedFilename = filename.split('/').map((chunk) => {
        return (chunk === '~') ? process.env.HOME : chunk;
    }).join('/');

    return path.normalize(expandedFilename);
}
