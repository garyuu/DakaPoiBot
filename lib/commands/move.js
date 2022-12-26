module.exports = {
    aliases: ['move', 'mv', 'moveto', '移動', '移去'],
    factory: function(app) {
        return new Move(app);
    }
}

class Move { 
    constructor(app) {
        this.app = app;
        this.logger = app.getLogger();
    }

    /**
     * 
     * @param {import('discord.js').Message} message 
     * @param {String} command 
     * @param {Array<String>} args 
     */
    async execute(message, command, args) {
        const channelMention = args.shift();
        if (!channelMention) {
            message.channel.send(this.app.lang.response.move.wrongFormat);
            return;
        }
        const channelId = channelMention.slice(2, -1);
        const targetChannel = message.guild.channels.cache.get(channelId);
        const messageId = args.shift() || message.reference.messageId || 0;
        if (!messageId) {
            message.channel.send(this.app.lang.response.move.missingMessage);
            return;
        }
        const originalMessage = await message.channel.messages.fetch(messageId);
        try {
            const content =
                (!message.client.user.equals(originalMessage.author) ?
                    '<@' + originalMessage.author.id + '>\n' : "") + originalMessage.content;
            targetChannel.send(content)
                .catch((e) => {
                    this.logger.error(e);
                    message.channel.send(this.app.lang.response.move.cannotSend);
                })
                .then(() => {
                    this.deleteMessage(originalMessage);
                    this.deleteMessage(message);
                })
        } catch (e) {
            this.logger.error(e);
            message.channel.send(this.app.lang.response.unexperror);
        }
    }

    /**
     * 
     * @param {import('discord.js').Message} message 
     */
    async deleteMessage(message) {
        await message.member.fetch();
        if (message.member.roles.cache.find(role => role.name.toLowerCase().trim() === 'cybersecurity'))
            return;
        message.delete()
            .catch(e => { this.logger.warn(e); });
    }
}