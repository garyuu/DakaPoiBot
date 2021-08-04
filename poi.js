require('dotenv').config();
const util = require('util');
const urlRegex = require('url-regex');
const discord = require('discord.js');
const { configure, getLogger } = require('log4js');

const client = new discord.Client(['MESSAGE', 'REACTION']);
configure(require('./log4js.json'));
const logger = getLogger();
const prefix = process.env.BOT_PREFIX;
const lang = require('./' + process.env.BOT_LANG + '.json');
const db = new (require('./lib/db_access.js'))(process.env.DATABASE_URL);


const app = {
    client: client,
    getLogger: getLogger,
    prefix: prefix,
    lang: lang,
    db: db,
};
const Command = require('./lib/command')(app);
const FixTwitter = require('./lib/fix_twitter')(app);
const URLFilter = require('./lib/url_filter')(app);
const KeywordsTrigger = require('./lib/keywords')(app);
const EmojiTrigger = require('./lib/emoji_trigger')(app);

app.emojiTrigger = EmojiTrigger;


if (process.env.DEBUG) {
    const send = discord.TextChannel.prototype.send;
    discord.TextChannel.prototype.send = function (content, options) {
        return send.call(this, "[DEBUG] " + content, options);
    };
}

function deleteMessage(message) {
    if (message.deletable) {
        for (let role of message.member.roles.values())
            if (role.name.toLowerCase() === 'cybersecurity')
                return;
        message.delete()
            .catch(e => { logger.warn(e); });
    }
}

client.once('ready', () => {
    client.user.setActivity("Poi, help");
    logger.info(lang.system.ready);
});

client.on('message', async (message) => {
    // Only make response in specific channels on debug mode
    if (process.env.DEBUG && !message.channel.name.toLowerCase().includes('bot'))
        return;

    // Ignore message sent by bot.
    if (message.author.bot)
        return;
    
    // Mentioned message.
    if (message.mentions.users.has(client.user.id)) {
        message.channel.send(lang.response.mention);
        return;
    }

    // Main commands.
    if (message.content.startsWith(prefix)) {
        const args = message.content.slice(prefix.length).trim().replace(/\s+/g, ' ').split(' ');
        const command = args.shift();
        Command.execute(message, command, args)
            .catch(e => {
                logger.error(`[MAIN] ${e}`);
                message.channel.send(lang.response.unexperror);
            });
        return;
    }

    // Url filter.
    const hasURL = urlRegex().test(message.content);
    if (hasURL) {
        // Fix twitter video
        let newMsg = FixTwitter.fix(message);
        newMsg = URLFilter.filter(newMsg);
        if (message.content !== newMsg) {
            message.channel.send(util.format(lang.response.filteredMessage, message.author.id, newMsg));
            deleteMessage(message)
            return;
        }
        // Continue if no url is modified.
    }

    // Special Key Word
    KeywordsTrigger.trigger(message, hasURL);
});

async function onReactionChange(react, user, isAdd) {
    if (react.partial) {
        try {
            await react.fetch();
        } catch (e) {
            logger.console.warn(`Fetching message failed. ${e}`);
            return;
        }
    }
    EmojiTrigger.trigger(react, user, isAdd);
}

client.on('messageReactionAdd', async (react, user) => {
    if (user.bot) return;
    onReactionChange(react, user, true);
});

client.on('messageReactionRemove', async (react, user) => {
    if (user.bot) return;
    onReactionChange(react, user, false);
});

client.on('messageUpdate', async (oldMsg, newMsg) => {
    if (newMsg.author.bot && !newMsg.author.equals(client.user))
        return;
    const content = FixTwitter.fix(newMsg);
    if (newMsg.content !== content) {
        if (newMsg.author.equals(client.user))
            newMsg.edit(content);
        else {
            newMsg.channel.send(util.format(lang.response.filteredMessage, newMsg.author.id, content));
            deleteMessage(newMsg);
            return;
        }
    }
});

client.login(process.env.BOT_TOKEN);
