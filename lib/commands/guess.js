module.exports = {
    aliases: ['guess', '猜'],
    factory: function (app) {
        return new Guess(app);
    }
}

const util = require('util');
const GuessingGame = require('../guessing_game.js');

class Guess {
    constructor(app) {
        this.app = app;
        this.logger = app.getLogger();
    }

    async execute(message, command, args) {
        const guild = message.guild.id;
        if (GuessingGame.isRunning(guild)) {
            if (args.length == 0) {
                const status = GuessingGame.status(guild);
                message.channel.send(util.format(this.app.lang.response.guess.inGame, status.hint, status.history));
            } else {
                try {
                    const result = await GuessingGame.guess(guild, args.shift());
                    let text;
                    if (result.win)
                        text = util.format(this.app.lang.response.guess.win, result.hint);
                    else
                        text = util.format(this.app.lang.response.guess.wrongGuess, result.hint, result.history);
                    message.channel.send(text);
                } catch (e) {
                    this.logger.error(`[Guess] execute() ${e}`);
                    message.channel.send(this.app.lang.response.guess.incorrectFormat);
                }
            }
        } else {
            try {
                await GuessingGame.start(guild);
                message.channel.send(this.app.lang.response.guess.start);
            } catch (e) {
                this.logger.error(`[Guess] execute() ${e}`);
                message.channel.send(this.app.lang.response.guess.errorStart);
            }
        }
    }
}