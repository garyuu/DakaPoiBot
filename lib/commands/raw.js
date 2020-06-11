module.exports = {
    aliases: ['raw'],
    factory: function (app) {
        return new Raw(app);
    }
}

const util = require('util');

class Raw {
    constructor(app) {
        this.app = app;
        this.logger = app.getLogger();
    }

    async execute(message, command) {
        const string = message.content.slice(this.app.prefix.length).trimStart().slice(command.length);
        console.log(string);
        message.channel.send(util.format(this.app.lang.response.rawText, string));
    }
}