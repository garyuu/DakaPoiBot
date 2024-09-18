module.exports = {
    aliases: ['twitter', 'tw', 'x'],
    factory: function (app) {
        return new TwitterToggle(app);
    }
}

const util = require('util');

const fixerList = ['fixupx.com', 'fixvx.com'];
let currentIndex = 0;

class TwitterToggle {
    constructor(app) {
        this.app = app;
        this.logger = app.getLogger();
        app.twitterFixerDomain = fixerList[currentIndex];
    }

    async execute(message, command, args) {
        currentIndex = (currentIndex + 1) % fixerList.length;
        this.app.twitterFixerDomain = fixerList[currentIndex];
        message.channel.send(util.format(this.app.lang.response.twitter.toggle, this.app.twitterFixerDomain));
    }
}