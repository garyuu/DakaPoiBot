require('dotenv').config();
const util = require('util');
const urlRegex = require('url-regex');
const discord = require('discord.js');
const intentsConfig = require('./lib/intents.js');
const { configure, getLogger } = require('log4js');

const DEBUG = Number(process.env.DEBUG);
const RECEIVED_MESSAGE_TYPE = ["DEFAULT", "REPLY"];
const client = new discord.Client({
    intents: intentsConfig
});
configure(require('./log4js.json'));
const logger = {
    log: getLogger(),
    info: function (msg) {
        sendLogMessage(0, msg);
        this.log.info(msg);
    },
    warn: function (msg) {
        sendLogMessage(1, msg);
        this.log.warn(msg);
    },
    error: function (msg) {
        sendLogMessage(2, msg);
        this.log.error(msg);
    },
}

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

let logChannel = null;

app.emojiTrigger = EmojiTrigger;

if (DEBUG) {
    const send = discord.TextChannel.prototype.send;
    discord.TextChannel.prototype.send = function (options) {
        if (typeof options === 'string') {
            return send.call(this, "[DEBUG] " + options);
        } else {
            options.content = "[DEBUG] " + options.content;
            return send.call(this, options);
        }
    };
}

/**
 * 
 * @param {discord.Message} message 
 * @returns 
 */
async function deleteMessage(message) {
    await message.member.fetch();
    if (message.member.roles.cache.find(role => role.name.toLowerCase().trim() === 'cybersecurity'))
        return;
    message.delete()
        .catch(e => { logger.warn(e); });
}

async function sendLogMessage(level, message) {
    if (logChannel != null) {
        switch (level) {
            case 0:
                message = "💬" + message;
                break;
            case 1:
                message = "⚠" + message;
                break;
            case 2:
                message = "<@" + process.env.MANAGER_USER_ID + ">\n⛔" + message;
                break;
        }
        logChannel.send(message);
    }
}

client.once('ready', () => {
    client.user.setActivity("Poi, help");
    client.channels.fetch(process.env.BOT_LOG_CHANNEL_ID)
        .then(channel => {
            logChannel = channel;
            logger.info(lang.system.ready);
        });
});

client.on('guildCreate', (guild) => {
    guild.emojis.fetch();
    guild.roles.fetch();
    guild.members.fetch();
});

client.on('messageCreate', async (message) => {
    try {
        // Only make response in specific channels on debug mode
        if (DEBUG && (!message.channel.name || !message.channel.name.toLowerCase().includes('bot')))
            return;

        // Ignore message sent by bot.
        if (message.author.bot)
            return;

        // Only react when received DEFAULT and REPLY message type
        if (!RECEIVED_MESSAGE_TYPE.includes(message.type))
            return;

        // Don't automatically join unjoined thread
        if (message.channel.isThread() && !message.channel.joined)
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
                .catch(eObj => {
                    logger.error(`[MAIN] ${eObj.data}`);
                    message.channel.send(lang.response.unexperror);
                });
            return;
        }

        // Url filter.
        const hasURL = urlRegex().test(message.content);
        if (hasURL) {
            // Fix twitter embeded
            let newMsg = URLFilter.filter(message.content);
            if (newMsg != null && message.content !== newMsg) {
                const output = util.format(lang.response.filteredMessage, message.author.id, newMsg);
                let promise = null;
                if (message.reference) {
                    const mid = message.reference.messageId;
                    const messageToReply = await message.channel.messages.fetch(mid);
                    promise = messageToReply.reply({ content: output, allowedMentions: { repliedUser: false } })
                } else {
                    promise = message.channel.send(output);
                }
                if (promise != null) {
                    promise.then(filterredMessage => {
                        logger.info(`[Filter] ${filterredMessage.url}\n${message.content}\n=>\n${newMsg}`);
                    });
                }
                await deleteMessage(message);
                return;
            }
            // Continue if no url is modified.
        }

        // Special Key Word
        KeywordsTrigger.trigger(message, hasURL);
    } catch (e) {
        logger.error(e);
    }
});

async function onReactionChange(react, user, isAdd) {
    if (react.partial) {
        try {
            await react.fetch();
        } catch (e) {
            logger.warn(`Fetching message failed. ${e}`);
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
            await deleteMessage(newMsg);
            return;
        }
    }
});

client.login(process.env.BOT_TOKEN);
