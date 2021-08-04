const urlRegex = require('url-regex');

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
        'ref_url',
        's'
    ],
    "youtube": [
        'feature',
        'ab_channel'
    ]
};

const domainTable = [
    [/m.facebook/i, "facebook"]
];

const markdowns = '|<>_*';

class URLFilter {
    constructor(app) {
        this.app = app;
        this.logger = app.getLogger();
    }

    filter(content) {
        content = content.replace(urlRegex(), (match) => {
            const { url, tail } = this.seperateMarkdown(match);
            const location = new URL(url);
            domainTable.forEach(pattern => {
                location.hostname = location.hostname.replace(pattern[0], pattern[1]);
            });
            const params = location.searchParams;
            for (let host in blacklist)
                if (host === '*' || location.hostname.includes(host))
                    for (let name of blacklist[host])
                        params.delete(name)
            return location.toString() + tail;
        });
        return content;
    }

    seperateMarkdown(text) {
        let i;
        for (i = text.length; i > 0; i--) {
            if (!markdowns.includes(text.charAt(i-1)))
                break;
        }
        return {
            url: text.slice(0, i),
            tail: text.slice(i)
        };
    }
}

module.exports = function (app) {
    return new URLFilter(app)
};