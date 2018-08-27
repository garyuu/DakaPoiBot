require('dotenv').config();
const util = require('util');
const discord = require('discord.js');
const client = new discord.Client();
const prefix = process.env.BOT_PREFIX;
const lang = require('./' + process.env.BOT_LANG + '.json');
//const db = new require('./db_access.js')(process.env.DATABASE_URL);
//const caller = require('./rollcaller.js');

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
                message.channel.send(util.format(lang.response.hello, '<@' + message.author.id + '> '));
                break;
                /*
            case 'add':
                caller.add(db, lang, message);
                break;
            case 'remove':
                caller.remove(db, lang, message);
                break;
            case 'refresh':
                caller.refresh(db, lang, message);
                break;
            case 'today':
                caller.today(db, lang, message);
                break;
            case 'next':
                caller.next(db, lang, message);
                break;
            case 'shuffle':
                caller.shuffle(db, lang, message);
                break;
                */
            default:
                message.channel.send(lang.response.default);
        }
    }
    else if (message.content.search("噁心") != -1 || message.content.toLowerCase() == ("ot")) {
        message.channel.send(lang.response.yuck);
    }
    else if (message.content.search("馬英九") != -1) {
        message.channel.send(lang.response.mayingjo);
    }
});

client.login(process.env.BOT_TOKEN);
