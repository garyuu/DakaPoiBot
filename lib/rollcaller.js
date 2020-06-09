////// Deprecated //////

class RollCaller {
    async add(db, lang, message) {
        const guildId = message.guild.id;
        const roles = message.mentions.roles;
        if (roles.length == 0) {
            message.channel.send(lang.response.invalidCommand);
        }
        else {
            let resp = await this.add_role(guildId, roles.first().id);
            message.channel.send(resp);
        }
    }
   
    async remove(db, lang, message) {
        const guildId = message.guild.id;
        const roles = message.mentions.roles;
        if (roles.length == 0) {
            message.channel.send(lang.response.invalidCommand);
        }
        else {
            let resp = await this.remove_role(guildId, roles.first().id);
            message.channel.send(resp);
        }
    }

    async refresh(db, lang, message) {
        const guildId = message.guild.id;
        const roles = message.mentions.roles;
        if (roles.length == 0) {
            message.channel.send(lang.response.invalidCommand);
        }
        else {
            let resp = await this.refresh_member(guildId, roles.first().id);
            message.channel.send(resp);
        }
    }

    async today(db, lang, message) {
        const guildId = message.guild.id;
        const roles = message.mentions.roles;
        if (roles.length == 0) {
            message.channel.send(lang.response.invalidCommand);
        }
        else {
            let resp = await this.today_member(guildId, roles.first().id);
            message.channel.send(resp);
        }
    }

    async next(db, lang, message) {
        const guildId = message.guild.id;
        const roles = message.mentions.roles;
        if (roles.length == 0) {
            message.channel.send(lang.response.invalidCommand);
        }
        else {
            let resp = await this.next_member(guildId, roles.first().id);
            message.channel.send(resp);
        }
    }

    async shuffle(db, lang, message) {
    
    }

    add_role(db, lang, guild, role) {
        return db.exec_add_role(guildId, roles[i].name)
                   .then(() => {
                       message.channel.send(util.format(lang.response.addSuccess, roles[i].name))
                   })
                   .catch((e) => {
                       console.log(e);
                       message.channel.send(util.format(lang.response.addFail, roles[i].name))
                   });
    }
}

module.exports = new RollCaller();
