module.exports = {
    aliases: ['game', '遊戲', '玩'],
    factory: function (app) {
        return new Game(app);
    }
}

const GameMap = new Map([
    ['jianken', require('../games/jianken.js')],
]);

class Game {
    constructor(app) {
        this.app = app;
        this.logger = app.getLogger();
        this.table = new Map();
    }

    async execute(message, command, args) {
        const id = (message.guild ? message.guild.id : message.author.id) + '/' + message.channel.id;
        const action = args.shift();
        if (!action) {
            message.channel.send(this.app.lang.response.game.wrongFormat);
            return;
        }
        try {
            switch (action.toLowerCase()) {
                case 'create':
                    await this.createGame(message, action, args, id);
                    break;
                case 'stop':
                    await this.stopGame(message, action, args, id);
                    break;
                default:
                    message.channel.send(this.app.lang.response.game.wrongFormat);
                    return;
            }
        } catch (e) {
            this.logger.error(`[Game] execute() unexpected error. ${e}`);
            throw e;
        }
    }

    async createGame(message, action, args, id) {
        if (this.table.has(id)) {
            this.logger.warn(`[Game] createGame() this channel already has a game.`);
            message.channel.send(this.app.lang.response.game.createDuplicated);
            return;
        }

        const key = args.shift().toLowerCase();
        if (!key || !GameMap.has(key)) {
            this.logger.warn(`[Game] createGame() No such game ${key} exist.`);
            message.channel.send(this.app.lang.response.game.noSuchGame);
            return;
        }

        const factory = GameMap.get(key);
        try {
            const game = await factory(this.app, message, args, this.onEnd.bind(this, id));
            this.table.set(id, game);
        } catch (e) {
            this.logger.error(`[Game] createGame() Create game failed. ${e}`);
        }
    }

    async stopGame(message, action, args, id) {
        if (!this.table.has(id)) {
            this.logger.warn(`[Game] stopGame() this channel has no game.`);
            message.channel.send(this.app.lang.response.game.noGameExist);
            return;
        }
        try {
            await this.table.get(id).stop();
        } catch (e) {
            this.logger.error(`[Game] stopGame() Stop game failed. ${e}`);
        } finally {
            this.table.delete(id);
        }
    }

    onEnd(id) {
        if (this.table.has(id))
            this.table.delete(id);
    }
}