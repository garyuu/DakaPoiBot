const discord = require('discord.js');

module.exports = [
    discord.Intents.FLAGS.GUILDS,
    discord.Intents.FLAGS.GUILD_MEMBERS,
    discord.Intents.FLAGS.GUILD_MESSAGES,
    discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    discord.Intents.FLAGS.DIRECT_MESSAGES,
    discord.Intents.FLAGS.DIRECT_MESSAGE_REACTIONS
];