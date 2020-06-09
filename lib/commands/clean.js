module.exports = {
    aliases: ['clean', 'clear', '清理', '打掃'],
    factory: function(app) {
        return new Clean(app);
    }
}

const MAX_CLEAN_COUNT = 20;

class Clean { 
    constructor(app) {
        this.app = app;
        this.logger = app.getLogger();
    }

    async execute(message, command, args) {
        let limit = MAX_CLEAN_COUNT;
        if (args.length > 0) {
            const l = parseInt(args.shift());
            if (l < 1)
                return;
            else if (limit > l)
                limit = l;
        }
        try {
            const msgs = await message.channel.fetchMessages({ limit: limit });
            for (let m of msgs.array()) {
                // Delete if the author is this bot, or have the prefix that trigger this bot.
                if (m.deletable && (m.author.id == this.app.client.user.id || m.content.startsWith(this.app.prefix)))
                    m.delete()
                        .catch((e => this.logger.warn(e)).bind(this));
            }
        } catch (e) {
            this.logger.error(e);
        }
    }
}