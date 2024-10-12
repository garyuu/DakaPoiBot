const urlRegex = require('url-regex');
const fix_twitter = require('./fix_twitter');

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
    "x": [
        '*'
    ],
    "twitter": [
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

/** [toReplace, forReplace, pathToRemove, pathToAdd] */
const domainTable = [
    [/^m.facebook$/i, "facebook", null, null],
    [/^m.gamer.com.tw$/i, "forum.gamer.com.tw", "/forum", null],
];

const excludeTrailingMarksRegex = "(?<![>)}\\]])";
const markdowns = "|<>_*`";
const twitterRecoverEmoji = '💢';

class URLFilter {
    constructor(app) {
        this.app = app;
        this.logger = app.getLogger();
        var rawRegex = urlRegex();
        var newSource = rawRegex.source + excludeTrailingMarksRegex;
        this.urlRegex = new RegExp(newSource, rawRegex.flags);
        this.app.emojiTrigger.on(0, [twitterRecoverEmoji], this.recoverTwitter, this);
    }

    filter(content) {
        content = content.replace(this.urlRegex, (match) => {
            const { url, tail } = this.seperateMarkdown(match);
            const location = new URL(url);
            domainTable.forEach(pattern => {
                const newHostName = location.hostname.replace(pattern[0], pattern[1]);
                if (location.hostname != newHostName) {
                    if (pattern[2])
                        location.pathname = location.pathname.replace(pattern[2], "");
                    if (pattern[3])
                        location.pathname = pattern[3] + location.pathname;
                }
                location.hostname = newHostName;
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
            this.fixTwitter(location);
            if (noSearchParam)
                return location.toString().split('?')[0] + tail;
            return location.toString() + tail;
        });
        return content;
    }

    seperateMarkdown(text) {
        let i;
        for (i = text.length; i > 0; i--) {
            if (!markdowns.includes(text.charAt(i - 1)))
                break;
        }
        return {
            url: text.slice(0, i),
            tail: text.slice(i)
        };
    }

    fixTwitter(url) {
        if ((url.hostname === "x.com" || url.hostname === "twitter.com")
            && !url.toString().includes("/i/spaces/")) {
            url.hostname = this.app.twitterFixerDomain;
            return true;
        }
        return false;
    }

    recoverTwitter(react, user, isOn) {
        if (!isOn || !react.message.editable)
            return;

        if (react.message.partial) {
            const _this = this;
            react.message.fetch()
                .then(msg => {
                    _this.doRecoverTwitter(msg);
                })
                .catch(error => {
                    _this.app.logger.error(error);
                })
        } else {
            this.doRecoverTwitter(react.message);
        }
    }

    doRecoverTwitter(message){
        let changed = false;
        let content = message.content;
        content = content.replace(this.urlRegex, match => {
            const { url, tail } = this.seperateMarkdown(match);
            const location = new URL(url);

            if (location.hostname === this.app.twitterFixerDomain)
            {
                location.hostname = "x.com";
                changed = true;
                return location.toString() + tail;
            }

            return match;
        });

        if (changed)
            message.edit(content);
    }
}

module.exports = function (app) {
    return new URLFilter(app)
};