module.exports = function ExcludePodcastAnnouncements(item) {
    if (item.title.indexOf('#') >= 0) {
        if (item.content.indexOf('This week on') >= 0 && item.content.indexOf('relay.fm') >= 0) {
            return true;
        }
    }

    if (/^Appearance: /.test(item.title)) {
        if (item.content.indexOf('I joined') >= 0) {
            return true;
        }
    }

    if (item.title.indexOf('(Podcast)') === 0) return true;

    return false;
}