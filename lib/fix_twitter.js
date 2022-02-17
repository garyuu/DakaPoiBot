/**
 * @typedef {import('discord.js').MessageEmbed} Embed
 */

class FixTwitter {
    constructor(app) {
        this.app = app
    }

    fix(message) {
        let content = message.content;
        // Skip if already fixed or not twitter
        // if (message.content.includes('fxtwitter') || !message.content.includes('twitter'))
        //     return content;
        // if (this.isEmbedTypeVideo(message.embeds))
        //     content = content.replace('twitter', 'fxtwitter');
        return content;
    }

    /**
     * 
     * @param {import('discord.js').MessageEmbed[]} embeds 
     */
    isEmbedTypeVideo(embeds) {
        if (embeds.length == 0)
            return false;
        const embed = embeds[0];
        if (!embed.image)
            return false;
        if (embed.image.url.includes(':large'))
            return false;
        if (embed.image.url.includes('video'))
            return true;
        if (embed.description.includes('https://t.co/'))
            return true;
        return false;
    }
}

module.exports = function (app) {
    return new FixTwitter(app)
};