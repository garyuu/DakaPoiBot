module.exports = function (app) {
    return new EmojiTrigger(app);
};

class EmojiTrigger {
    constructor(app) {
        this.app = app;
        this.logger = app.getLogger();
        this.table = new Map();
        this.omniEvents = new Set();
    }

    on(mid, emojis, callback, target) {
        const event = {
            emojis: emojis,
            callback: callback,
            target: target,
        };
        if (mid === 0)
            this.omniEvents.add(event);
        else 
            this.table.set(mid, event);
    }

    off(mid) {
        this.table.delete(mid);
    }

    trigger(react, user, isOn) {
        const mid = react.message.id;
        if (this.table.has(mid)) {
            const event = this.table.get(mid);
            this.invokeEvent(event, react, user, isOn);
        }
        this.omniEvents.forEach(x => {
            this.invokeEvent(x, react, user, isOn);
        });
    }

    invokeEvent(event, react, user, isOn) {
        if (event.emojis.includes(react.emoji.name) && event.callback != null)
            event.callback.call(event.target, react, user, isOn);
    }
}