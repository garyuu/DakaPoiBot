module.exports = class GameBase {
    constructor(app, message, onEnd) {
        this.app = app;
        this.logger = app.getLogger('game');
        this.host = message.author.id;
        this.channel = message.channel;
        this.onEnd = onEnd;
        this.trackingMessages = [];
    }

    gameEnd() {
        this.isEnd = true;
        if (this.onEnd)
            this.onEnd();
    }

    async stop() {
        this.gameEnd();
        for (let message of this.trackingMessages) {
            await message.reactions.removeAll()
                .catch(this.logger.warn.bind(this, "[GameBase] stop() Cannot remove reactions.\n"));
            if (message.editable)
                message.edit(this.app.lang.response.game.cancel);
        }
    }
}