const blacklist = {
    "*": [
        'fbclid'
    ],
    "facebook": [
        'eid',
        '__xts__[0]',
        '__tn__',
        'hc_ref'
    ],
    "twitter": [
        'ref_src',
        'ref_url'
    ]
};

const URL_REGEX = /https:\/\/[^\s]*/g;

class URLFilter { 
    filter(raw) {
        raw = raw.replace(URL_REGEX, (match, index, string) => {
            let url = match;
            url = url.replace("m.facebook", "facebook");
            const location = new URL(url);
            for (let host in blacklist) {
                if (host === '*' || location.host.includes(host)) {
                    const params = location.searchParams;
                    for (let name of blacklist[host])
                        if (params.get(name) != null)
                            params.delete(name);
                }
            }
            url = location.toString();
            return url;
        });
        return raw;
    }
}

module.exports = new URLFilter();