module.exports = {
    aliases: ['dirty'],
    factory: function(app) {
        return new Dirty(app);
    }
}

class Dirty { 
    constructor(app) {
        this.app = app;
    }

    async execute(message, command) {
        const msg = message.content.replace(this.app.prefix, '').replace(command, '').trim();
        let result = "";
        let skip = false;
        for (let i = 0; i < msg.length; i++) {
            if (skip || msg.charAt(i) == '<') {
                skip = msg.charAt(i) != '>'
                result += msg.charAt(i);
                continue;
            }
            result += msg.charAt(i) + (msg.charCodeAt(i) < 0x0080 ? '' : String.fromCharCode(0x0489));
            const rnd = Math.floor(Math.random() * 10) + 1;
            for (let j = 0; j < rnd; j++) {
                const char = Math.floor(Math.random() * (0x0370 - 0x0300)) + 0x0300;
                result += String.fromCharCode(char);
            }
        }
        message.channel.send(result);
    }
}