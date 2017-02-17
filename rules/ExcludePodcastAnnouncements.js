module.exports = function ExcludePodcastAnnouncements(item) {
    if (item.content.indexOf('relay.fm') >= 0) {
        if (item.title.indexOf('#') >= 0) {
            return true;
        }
        if (/^MPU \d+: /.test(item.title)) {
            return true;
        }
    }

    if (/^Appearance: /.test(item.title)) {
        if (item.content.indexOf('I joined') >= 0) {
            return true;
        }
    }

    if (item.title.indexOf('(Podcast)') === 0) return true;
    if (item.title.indexOf('Podcast: ') === 0) return true;

    return false;
}