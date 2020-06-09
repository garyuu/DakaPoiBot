module.exports = {
    aliases: ['roll', 'dice', '檢定', '丟'],
    factory: function (app) {
        return new Roll(app);
    }
}

const util = require('util');
const Dice = require('../dice_roller.js');

class Roll {
    constructor(app) {
        this.app = app;
        this.logger = app.getLogger();
    }

    async execute(message, command, args) {
        const diceRegex = /^\s*[1-9]\d*([Dd][1-9]\d*)?(\s*(\+|-)\s*[1-9]\d*([Dd][1-9]\d*)?)*\s*$/;
        let exp = args.join('');
        if (exp.match(diceRegex) != null) {
            try {
                exp = exp.replace(/\s+/g, '');
                let valueArray = exp.split(/(\+|-)/);
                for (let i in valueArray) {
                    if (isNaN(valueArray[i]) && valueArray[i].match(/\+|-/) == null) {
                        let pair = valueArray[i].split(/[Dd]/);
                        valueArray[i] = Dice.roll(pair[0], pair[1]);
                    }
                }
                const equal = valueArray.join(' ');
                const sum = eval(equal);
                message.channel.send(util.format(this.app.lang.response.dice.result, equal, sum));
            } catch (e) {
                this.logger.error(`[Roll] execute() ${e}`);
                message.channel.send(this.app.lang.response.dice.wrongFormat);
            }
        } else {
            message.channel.send(this.app.lang.response.dice.wrongFormat)
        }
    }
}