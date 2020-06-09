module.exports = {
    aliases: ['love', 'loveyou', 'loveu', '我愛你', '我愛妳', '愛你', '愛妳'],
    factory: function(app) {
        return new Love(app);
    }
}

class Love {
    constructor(app) {
        this.app = app;
    }

    async execute(message) {
        if (message.author.username == "Garyuu")
            message.channel.send(this.app.lang.response.loveonichan);
        else
            message.channel.send(this.app.lang.response.nooneloveyou);
    }
}