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

client.once('ready', () => {
    client.user.setActivity("Poi, help");
    logger.info(lang.system.ready);
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
            let newMsg = URLFilter.filter(message.content);
            if (message.content !== newMsg) {
                const output = util.format(lang.response.filteredMessage, message.author.id, newMsg);
                if (message.reference) {
                    const mid = message.reference.messageId;
                    const messageToReply = await message.channel.messages.fetch(mid);
                    messageToReply.reply({ content: output, allowedMentions: { repliedUser: false } });
                } else {
                    message.channel.send(output);
                }
                await deleteMessage(message);
                return;
            }
            // Continue if no url is modified.
        }

        // Special Key Word
        KeywordsTrigger.trigger(message, hasURL);
    } catch (e) {
        console.warn(e);
    }
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
            await deleteMessage(newMsg);
            return;
        }
    }
});

client.login(process.env.BOT_TOKEN);
