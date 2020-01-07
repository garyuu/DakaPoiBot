require('dotenv').config();
const util = require('util');
const discord = require('discord.js');
const client = new discord.Client();
const prefix = process.env.BOT_PREFIX;
const lang = require('./' + process.env.BOT_LANG + '.json');
const urlRegex = require('url-regex');
const db = new (require('./db_access.js'))(process.env.DATABASE_URL);
const exec = require('child_process').exec;
//const caller = require('./rollcaller.js');

const Command = require('./lib/commands/command.js');
const URLFilter = require('./lib/url_filter');
let Guess = require('./lib/guessing_game.js');
let Dice = require('./lib/dice_roller.js');
let temp;

client.on("ready", () => {
    client.user.setActivity("Poi, help");
    console.log(lang.system.ready);
});

client.on("message", (message) => {
    if (message.author.bot)
        return;
    if (message.mentions.users.has(client.user.id))
        message.channel.send(lang.response.mention);
    else if (message.content.startsWith(prefix)) {
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
            case 'love':
            case 'loveyou':
            case 'loveu':
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
                    if (urlRegex({ exact: true, strict: true }).test(url)) {
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

            /* Roll Dice {{{*/
            case 'roll':
            case 'dice':
            case '檢定':
            case '丟':
                const diceRegex = /^\s*[1-9]\d*([Dd][1-9]\d*)?(\s*(\+|-)\s*[1-9]\d*([Dd][1-9]\d*)?)*\s*$/;
                let exp = args.join('');
                if (exp.match(diceRegex) != null) {
                    const rollDice = new Promise((resolve, reject) => {
                        exp = exp.replace(/\s+/g, '');
                        let valueArray = exp.split(/(\+|-)/);
                        for (let i in valueArray) {
                            if (isNaN(valueArray[i]) && valueArray[i].match(/\+|-/) == null) {
                                let pair = valueArray[i].split(/[Dd]/);
                                valueArray[i] = Dice.roll(pair[0], pair[1]);
                            }
                        }
                        const equal = valueArray.join(' ');
                        const sum = eval(equal);
                        resolve({
                            equal: equal,
                            sum: sum
                        });
                    })
                        .then((result) => {
                            message.channel.send(util.format(lang.response.dice.result, result.equal, result.sum));
                        })
                        .catch((e) => {
                            console.log(e);
                            message.channel.send(lang.response.dice.wrongFormat)
                        });
                }
                else {
                    message.channel.send(lang.response.dice.wrongFormat)
                }
                break;
            //}}}

            /* Help {{{*/
            case 'help':
            case '說明':
                message.channel.send(lang.help.join('\n'));
                break;
            //}}}

            /* Clean {{{*/
            case 'clean':
            case '清除':
                let limit = 20;
                if (args.length > 0) {
                    const l = parseInt(args.shift());
                    if (l < 1)
                        return;
                    else if (l < 20)
                        limit = l;
                }
                message.channel.fetchMessages({ limit: limit })
                    .then((msgs) => {
                        for (let m of msgs.array()) {
                            if (m.deletable && (m.author.id == client.user.id || m.content.startsWith(prefix)))
                                m.delete();
                        }
                    })
                    .catch((e) => {
                        console.log(e);
                    });
                break;
            //}}}

            /* Dirty {{{*/
            case 'dirty':
                const msg = message.content.slice(prefix.length + command.length + 1).trim();
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
                /*
                const result = exec('python3 dirtyWordGenerator.py "' + msg + '"', (e, out, err) => {
                    if (e) {
                        console.error(e);
                        return;
                    }
                    message.channel.send(out);
                    console.log(err);
                });
                */
                break;
            //}}}

            default:
                Command.execute(command, args)
                    .then((msg) => {
                        message.channel.send(msg.data);
                    })
                    .catch((e) => {
                        console.error(e);
                        message.channel.send(lang.response.default);
                    });
        }
    }
    /* Special Key Word {{{*/
    else if (message.content.includes("://")) {
        const newURL = URLFilter.filter(message.content);
        if (message.content === newURL)
            return;
        message.channel.send(`<@${message.author.id}>:\n${newURL}`);
        if (message.deletable) {
            for (let role of message.member.roles.values())
                if (role.name.toLowerCase() === 'cybersecurity')
                    return;
            message.delete();
        }
    }
    else if (message.content.includes("噁心") || message.content.toLowerCase() == "ot") {
        message.channel.send(lang.response.yuck);
    }
    else if (message.content.includes("馬英九")) {
        message.channel.send(lang.response.mayingjo);
    }
    else if (message.content == "嗚") {
        message.channel.send(lang.response.nyan);
    }
    else if ((temp = message.content.match(/888+/)) != null) {
        let rand = 1 + Math.random() * 0.4 - 0.2;
        message.channel.send("8".repeat(Math.round(temp[0].length * rand)));
    }
    //}}}
});

client.login(process.env.BOT_TOKEN);
