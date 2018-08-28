require('dotenv').config();
const util = require('util');
const discord = require('discord.js');
const client = new discord.Client();
const prefix = process.env.BOT_PREFIX;
const lang = require('./' + process.env.BOT_LANG + '.json');
const urlRegex = require('url-regex');
const db = new (require('./db_access.js'))(process.env.DATABASE_URL);
//const caller = require('./rollcaller.js');

let Guess = require('./lib/guessing_game.js');

client.on("ready", () => {
    console.log(lang.system.ready);
});

client.on("message", (message) => {
    if (message.author.bot)
        return;
    if (message.content.startsWith(prefix)) {
        const args = message.content.slice(prefix.length).trim().replace(/\s+/g, ' ').split(' ');
        const command = args.shift().toLowerCase();
        switch (command) {
            /* Hello {{{ */
            case 'hello':
            case 'hi':
            case '你好':
            case '妳好':
                if (message.author.username == "Garyuu")
                    message.channel.send(util.format(lang.response.helloonichan, '<@' + message.author.id + '> '));
                else
                    message.channel.send(util.format(lang.response.hello, '<@' + message.author.id + '> '));
                break;
            /* }}} */

            /* RollCaller {{{ *
            case 'add':
                caller.add(db, lang, message);
                break;
            case 'remove':
                caller.remove(db, lang, message);
                break;
            case 'refresh':
                caller.refresh(db, lang, message);
                break;
            case 'today':
                caller.today(db, lang, message);
                break;
            case 'next':
                caller.next(db, lang, message);
                break;
            case 'shuffle':
                caller.shuffle(db, lang, message);
                break;
            /* }}} */

            /* Love {{{ */
            case '我愛你':
            case '我愛妳':
            case '愛你':
            case '愛妳':
                if (message.author.username == "Garyuu")
                    message.channel.send(lang.response.loveonichan);
                else
                    message.channel.send(lang.response.nooneloveyou);
                break;
            /* }}} */

            /* Playlist {{{ */
            case 'playlist':
            case '歌單':
            case '播放清單':
                if (args.length == 0) {
                    db.getPlaylist(message.author.id)
                        .then((result) => {
                            if (result.rows.length == 0)
                                message.channel.send(lang.response.noplaylist);
                            else
                                message.channel.send(util.format(lang.response.getPlaylist, result.rows[0].url));
                        })
                        .catch((e) => {
                            console.log(e);
                            message.channel.send(lang.response.dberror);
                        });
                }
                else {
                    const url = args.shift();
                    if (urlRegex({exact: true, strict: true}).test(url)) {
                        db.setPlaylist(message.author.id, url)
                            .then((result) => {
                                message.channel.send(lang.response.setPlaylist);
                            })
                            .catch((e) => {
                                console.log(e);
                                message.channel.send(lang.response.dberror);
                            });
                    }
                    else {
                        message.channel.send(lang.response.urlerror)
                    }
                }
                break;
            /* }}} */

            /* Number Guessing {{{*/
            case 'guess':
            case '猜':
                const guild = message.guild.id;
                if (Guess.isRunning(guild)) {
                    if (args.length == 0) {
                        const status = Guess.status(guild);
                        message.channel.send(util.format(lang.response.guess.inGame, status.hint, status.history));
                    }
                    else {
                        Guess.guess(guild, args.shift())
                            .then((result) => {
                                if (result.win) {
                                    message.channel.send(util.format(lang.response.guess.win, result.hint));
                                }
                                else {
                                    message.channel.send(util.format(lang.response.guess.wrongGuess, result.hint, result.history));
                                }
                            })
                            .catch((e) => {
                                message.channel.send(lang.response.guess.incorrectFormat);
                            });
                    }
                }
                else {
                    Guess.start(guild)
                        .then((result) => {
                            message.channel.send(lang.response.guess.start);
                        })
                        .catch((e) => {
                            message.channel.send(lang.response.guess.errorStart);
                        });
                }
                break;
            //}}}
            default:
                message.channel.send(lang.response.default);
        }
    }
    else if (message.content.includes("噁心") || message.content.toLowerCase() == ("ot")) {
        message.channel.send(lang.response.yuck);
    }
    else if (message.content.includes("馬英九")) {
        message.channel.send(lang.response.mayingjo);
    }
});

client.login(process.env.BOT_TOKEN);
