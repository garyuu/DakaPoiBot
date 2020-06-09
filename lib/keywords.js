module.exports = function (app) {
    return new KeywordsTrigger(app);
};

class KeywordsTrigger {
    constructor(app) {
        this.app = app;
        this.logger = app.getLogger();
    }

    trigger(message) {
        let temp;

        if (message.content.includes("噁心") || message.content.toLowerCase() == "ot") {
            message.channel.send(this.app.lang.response.yuck);
            return;
        }
        
        if (message.content.includes("馬英九")) {
            message.channel.send(this.app.lang.response.mayingjo);
            return;
        }

        if (message.content == "嗚") {
            message.channel.send(this.app.lang.response.nyan);
            return;
        }
        
        if ((temp = message.content.match(/888+/))) {
            const rand = 1 + Math.random() * 0.4 - 0.2;
            const count = Math.round(temp[0].length * rand);
            message.channel.send('8'.repeat(count));
        }
    }
}