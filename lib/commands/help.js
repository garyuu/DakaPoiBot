module.exports = {
    aliases: ['help', '說明'],
    factory: function(app) {
        return new Help(app);
    }
}

class Help { 
    constructor(app) {
        this.app = app;
    }

    async execute(message) {
        message.channel.send(this.app.lang.help.join('\n'));
    }
}