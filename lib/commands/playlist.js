module.exports = {
    aliases: ['playlist', '歌單', '播放清單'],
    factory: function (app) {
        return new Playlist(app);
    }
}

const util = require('util');
const urlRegex = require('url-regex');

class Playlist {
    constructor(app) {
        this.app = app;
        this.logger = app.getLogger();
    }

    async execute(message, command, args) {
        let text;
        if (args.length == 0)
            text = await this.get(message.author.id);
        else
            text = await this.save(message.author.id, args.shift());
        message.channel.send(text);
    }

    async get(id) {
        try {
            const result = await this.app.db.getPlaylist(id)
            if (result.rows.length == 0)
                return this.app.lang.response.noplaylist;
            else
                return util.format(this.app.lang.response.getPlaylist, result.rows[0].url);
        } catch (e) {
            this.logger.error(`[PlayList] get() ${e}`);
            return this.lang.response.dberror;
        }
    }

    async save(id, url) {
        if (urlRegex({ exact: true, strict: true }).test(url)) {
            try {
                await this.app.db.setPlaylist(id, url);
                return this.app.lang.response.setPlaylist;
            } catch (e) {
                this.logger.error(`[PlayList] get() ${e}`);
                return this.app.lang.response.dberror;
            }
        } else {
            return this.app.lang.response.urlerror;
        }
    }
}