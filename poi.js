require('dotenv').config();
const util = require('util');
const discord = require('discord.js');
const client = new discord.Client();
const prefix = process.env.BOT_PREFIX;
const lang = require('./' + process.env.BOT_LANG + '.json');
const db = require('./db_access.js');

client.on("ready", () => {
    console.log(lang.system.ready);
});

client.on("message", (message) => {
    if (message.content.startsWith(prefix)) {
        const args = message.content.slice(prefix.length).split(' ');
        const command = args.shift().toLowerCase();
        switch (command) {
            case 'hello':
            case 'hi':
            case '你好':
            case '妳好':
                message.channel.send('<@' + message.author.id + '> ' + lang.response.hello);
                break;
            case 'join':
            case '加入':
                db.exec_register_user_to_channel(message.channel.id, message.member.displayName, (isError) => {
                    if (isError) {
                        message.channel.send(lang.response.dberror);
                    }
                    else {
                        message.channel.send(util.format(lang.response.successfulJoin, " @" + message.member.displayName));
                    }
                });
                break;
            case 'leave':
            case '離開':
                break;
            default:
                message.channel.send(lang.response.default);
        }
    }
});

client.login(process.env.BOT_TOKEN);
