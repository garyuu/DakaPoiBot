const ERROR_CODE = {
    OK: 200,

    // Common
    UNEXPECTED_ERROR:  { code: -1, inMsg: "Uxexpected error. {0}", outMsg: "發生奇怪的事了poi..." },
    DATABASE_ERROR:    { code: -2, inMsg: "Database error. {0}", outMsg: "資料庫怪怪的，哥哥救命poi" },
    COMMAND_NOT_FOUND: { code: -3, inMsg: "Command {0} not found" },

    // Game
    GAME_STATE_NOT_MATCH:      { code: -1000, inMsg: "Game State does not match. Game id: {0}, state: {1}, action: {2}.", outMsg: "遊戲不是這樣玩的poi!" },
    GAME_JOIN_DUPLICATED:      { code: -1010, inMsg: "User {1} already in game {0}.", outMsg: "你已經要跟 poi 一起玩了" },
    GAME_JOIN_FULL:            { code: -1011, inMsg: "Game {0} is full.", outMsg: "遊戲人數已經滿了 poi..." },
    GAME_LEAVE_NOT_EXIST:      { code: -1012, inMsg: "User {1} not in game {0}.", outMsg: "你沒有說要跟 poi 一起玩啊?" },
    GAME_START_NOT_ENOUGH:     { code: -1013, inMsg: "Game {0} has not enough players.", outMsg: "人數還不夠，快找更多人過來poi!" },
    GAME_PLAYER_NOT_EXIST:     { code: -1020, inMsg: "Game {0} has no player {1}." },
    GAME_PLAYER_NOT_TAKE_TURN: { code: -1021, inMsg: "Game {0} is not player {1}'s turn.", outMsg: "還沒輪到你poi" },
    GAME_ACTION_INVALID:       { code: -1022, inMsg: "Game {0} has no action {1}." },
};

function format(msg, ex) { 
    if (Array.isArray(ex)) {
        for (let i = 0; i < ex.length; i++) 
            msg = msg.replace(`{${i}}`, ex[i]);
    } else
        msg = msg.replace(`{0}`, ex);
    return msg;
}

function parseMessage(err, extras) {
    if (err.code != ERROR_CODE.OK) {
        extras = err;
        err = ERROR_CODE.UNEXPECTED_ERROR;
    }
    err = Object.assign({}, err);
    err.inMsg = format(err.inMsg, extras);
    if (err.outMsg)
        err.outMsg = format(err.outMsg, extras);
    else
        err.outMsg = "";
    console.error(`[${err.code}] ${err.inMsg}`);
    return { code: err.code, msg: err.outMsg };
}

module.exports = ERROR_CODE;
module.exports.parseMessage = parseMessage;