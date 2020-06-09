module.exports = {
    aliases: ['hello', 'hi', '你好', '妳好', '安安', '哈囉'],
    factory: function(app) {
        return new Hello(app);
    }
}

const util = require('util');

class Hello { 
    constructor(app) {
        this.app = app;
    }

    async execute(message) {
        if (message.author.username == "Garyuu")
            message.channel.send(util.format(this.app.lang.response.helloonichan, `<@${message.author.id}>`));
        else
            message.channel.send(util.format(this.app.lang.response.hello, `<@${message.author.id}> `));
    }
}