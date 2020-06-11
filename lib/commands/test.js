module.exports = {
    aliases: ['test'],
    factory: function(app) {
        return new Test(app);
    }
}

const emojis = [
    '🇦',
    '🇧',
    '🇨',
    '🇩',
];

const chars = "ABCD";

class Test {
    constructor(app) {
        this.app = app;
        this.logger = app.getLogger();
    }

    async execute(message, command, args) {
        const msg = await message.channel.send('||ABCDEFG||');
        msg.awaitReactions((reaction, user) => {
            console.warn(reaction.emoji.name);
            return true;
        }, { time: 15000 })
            .then(c => console.log('end', c.array()))
            .catch(console.error);
        msg.react('🇦');
        // this.app.emojiTrigger.on(msg.id, emojis, this.onClick, this);
        // const array = [];
        // emojis.forEach((emoji) => {
        //     array.push(msg.react(emoji));
        // });
        // await Promise.all(array)
        //     .catch(this.logger.error.bind(this));
    }

    async onClick(react, user, isOn) {
        const { message, emoji } = react;
        if (message.partial) {
            try {
                await message.fetch();
            } catch (e) {
                this.logger.warn(`Fetch message failed. ${e}`);
                return;
            }
        }
        if (!message.editable) return;
        for (let i = 0; i < emojis.length; i++) {
            if (emoji.name === emojis[i]) {
                let text = message.content;
                text = text.slice(0, i + 10) + (isOn ? chars.charAt(i) : ' ') + text.slice(i + 11);
                message.edit(text);
                break;
            }
        }
    }
}