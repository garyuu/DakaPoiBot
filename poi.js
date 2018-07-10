require('dotenv').config();
const discord = require('discord.js');
const client = new discord.Client();
const prefix = process.env.BOT_PREFIX;
const lang = require('./' + process.env.BOT_LANG + '.json');

client.on("ready", () => {
    console.log(lang.system.ready);
});

client.on("message", (message) => {
    if (message.content.startsWith(prefix)) {
        const args = message.content.slice(prefix.length).split(' ');
        const command = args.shift().toLowerCase();
        switch (command) {
            case 'hello':
                message.channel.send(lang.response.hello);
                break;
            default:
                message.channel.send(lang.response.default);
        }
    }
});

client.login(process.env.BOT_TOKEN);
