module.exports = function ExcludeSponsors(item) {
    if (item.title.indexOf('RSS Sponsor:') === 0) return true;
    if (item.title.indexOf('(Sponsor)') === 0) return true;
    if (item.title.indexOf('Sponsor – ') === 0) return true;
    return false;
}
