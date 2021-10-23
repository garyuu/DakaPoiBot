module.exports = function (app, message, args, onEnd) {
    return new Jianken(app, message, args, onEnd);
}

const TEXTLIST = [
    "つのまきじゃんけん...",
    "ＳＴＡＲＴ！",
    "勝利者：",
    "這次沒有人贏poi",
    "最終結果：",
];

const EMOJIS = {
    SPECIAL: ['watame'],
    OPTIONS: ['✌️','✊','🖐️'],
    RARE: ['👆','🤘','☝️','🖕'],
}

class Jianken extends require('./gamebase') {
    constructor(app, message, args, onEnd) {
        super(app, message, onEnd);
        this.init();
        this.selections = new Map();
    }

    async init() {
        this.text = TEXTLIST[0];
        const message = this.trackingMessages[0] = await this.channel.send(this.text);
        await this.prepareOptions();
        this.app.emojiTrigger.on(message.id, EMOJIS.OPTIONS, this.onTrigger, this);
        this.gameTimeout = setTimeout(this.showResult.bind(this), 10000);
        this.showAnimation();
    }

    async prepareOptions() {
        for (let opt of EMOJIS.OPTIONS)
            await this.trackingMessages[0].react(opt);
    }

    onTrigger(reaction, user, isOn) {
        if (isOn) {
            if (this.selections.has(user.id)) {
                this.selections.get(user.id).emojiName = reaction.emoji.name;
            } else {
                this.selections.set(user.id, {
                    user: user,
                    emojiName: reaction.emoji.name,
                });
            }
        }
    }

    async showAnimation() {
        if (this.isEnd) return;
        const message = this.trackingMessages[0];
        this.text += TEXTLIST[1];
        await message.edit(this.text);
        if (this.isEnd) return;

        const emojiArray = this.getEmojiArray();
        this.interval = setInterval(this.showEmojiArray.bind(this, emojiArray), 1000);
    }

    getEmojiArray() {
        const message = this.trackingMessages[0];
        if (!message.guild) 
            return EMOJIS.OPTIONS;
        
        const ary = Array.from(EMOJIS.OPTIONS);
        EMOJIS.SPECIAL.forEach((name) => {
            const item = message.guild.emojis.cache.find(emoji => emoji.name === name);
            if (item)
                ary.push(item.toString());
        });
        return ary;
    }

    showEmojiArray(emojiArray) {
        if (this.isEnd) return;
        let emojiText = "";
        for (let i = 0; i < 10; i++)
            emojiText += emojiArray[Math.floor(Math.random() * emojiArray.length)];
        this.trackingMessages[0].edit(this.text + '\n' + emojiText)
            .catch(this.logger.warn.bind(this, "[Jianken] showEmojiArray() Edit message failed.\n"));
    }

    async showResult() {
        this.gameEnd();
        const rnd = Math.floor(Math.random() * 100);
        let result = -1;
        
        if (rnd < 32) result = 0;
        else if (rnd < 64) result = 1;
        else if (rnd < 96) result = 2;

        let resultEmoji;
        if (result < 0)
            resultEmoji = EMOJIS.RARE[Math.floor(Math.random() * EMOJIS.RARE.length)];
        else
            resultEmoji = EMOJIS.OPTIONS[result];
        await this.trackingMessages[0].edit(this.text + '\n' + resultEmoji);
        
        const selectionList = [];
        EMOJIS.OPTIONS.forEach(() => {
            selectionList.push([]);
        });
        for (const data of this.selections.values()) {
            const { user, emojiName } = data;
            const index = EMOJIS.OPTIONS.indexOf(emojiName);
            selectionList[index].push(user);
        }

        let resultText = TEXTLIST[4] + resultEmoji;

        if (result >= 0) {
            const winIndex = (result + 1) % 3;
            if (selectionList[winIndex].length > 0) {
                const text = selectionList[winIndex].reduce((str, user) => {
                    return str += ` <@${user.id}>`;
                }, TEXTLIST[2]);
                resultText += '\n' + text;
            } else
                resultText += '\n' + TEXTLIST[3];
        } else
            resultText += '\n' + TEXTLIST[3];


        let detailTextAry = [];
        for (let i = 0; i < EMOJIS.OPTIONS.length; i++) {
            detailTextAry.push(EMOJIS.OPTIONS[i] + ': ' + selectionList[i].map(x => x.username).join(', '));
        }
        const detailText = detailTextAry.join('\n');

        this.channel.send(resultText + '\n' + detailText);
    }

    gameEnd() {
        this.app.emojiTrigger.off(this.trackingMessages[0].id);
        if (this.gameTimeout)
            clearTimeout(this.gameTimeout);
        if (this.interval)
            clearInterval(this.interval);
        super.gameEnd();
    }
}