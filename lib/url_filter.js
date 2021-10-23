const urlRegex = require('url-regex');

const blacklist = {
    "*": [
        'fbclid'
    ],
    "facebook": [
        'eid',
        '__xts__[0]',
        '__tn__',
        'hc_ref',
        'set'
    ],
    "twitter": [
        // 'ref_src',
        // 'ref_url',
        // 's',
        // 't',
        '*'
    ],
    "youtube": [
        'feature',
        'ab_channel',
        'attr_tag'
    ],
    "reddit": [
        '*'
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
            let noSearchParam = false;
            for (let host in blacklist) {
                if (host === '*' || location.hostname.includes(host)) {
                    for (let name of blacklist[host]) {
                        if (name === '*') {
                            noSearchParam = true;
                            break;
                        }
                        params.delete(name);
                    }
                }
            }
            if (noSearchParam)
                return location.toString().split('?')[0] + tail;
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