const ErrorManager = require('./error_manager');

// 4 bit indicate a pattern (TLRB)
const FRAME_CHARS = [
    "   ┌ ┐─┬ │└├┘┤┴┼",
    "   ╔ ╗═╦ ║╚╠╝╣╩╬",
    "       ╤   ╟ ╢╧"
];
const FRAME_SOLID = 0;
const FRAME_DOUBLE = 1;
const FRAME_DOUBLE_SOLID = 2;

const ROW_SYMBOL = "1234567";
const COL_SYMBOL = "ABCDEFG";
const PLAYER_SYMBOL = "#$*&";
const ASAAM_SYMBOL = "↑←→↓"

const DIRECTION = {
    TOP: 0,
    LEFT : 1,
    RIGHT : 2,
    BOTTOM : 3
}

const DIE_FACE = [1, 2, 2, 3, 3, 4];

const COL_EDGE_ROUTE = [
    [{ position: "A1", direction: DIRECTION.RIGHT }, { position: "B7", direction: DIRECTION.TOP }],
    [{ position: "C1", direction: DIRECTION.BOTTOM }, { position: "A7", direction: DIRECTION.TOP }],
    [{ position: "B1", direction: DIRECTION.BOTTOM }, { position: "D7", direction: DIRECTION.TOP }],
    [{ position: "E1", direction: DIRECTION.BOTTOM }, { position: "C7", direction: DIRECTION.TOP }],
    [{ position: "D1", direction: DIRECTION.BOTTOM }, { position: "F7", direction: DIRECTION.TOP }],
    [{ position: "G1", direction: DIRECTION.BOTTOM }, { position: "E7", direction: DIRECTION.TOP }],
    [{ position: "F1", direction: DIRECTION.BOTTOM }, { position: "G7", direction: DIRECTION.LEFT }]
];

const ROW_EDGE_ROUTE = [
    [{ position: "A1", direction: DIRECTION.BOTTOM }, { position: "G2", direction: DIRECTION.LEFT }],
    [{ position: "A3", direction: DIRECTION.RIGHT }, { position: "G1", direction: DIRECTION.LEFT }],
    [{ position: "A2", direction: DIRECTION.RIGHT }, { position: "G4", direction: DIRECTION.LEFT }],
    [{ position: "A5", direction: DIRECTION.RIGHT }, { position: "G3", direction: DIRECTION.LEFT }],
    [{ position: "A4", direction: DIRECTION.RIGHT }, { position: "G6", direction: DIRECTION.LEFT }],
    [{ position: "A7", direction: DIRECTION.RIGHT }, { position: "G5", direction: DIRECTION.LEFT }],
    [{ position: "A6", direction: DIRECTION.RIGHT }, { position: "G7", direction: DIRECTION.TOP }]
];

const BOARD_TEMPLATE = `
      A   B   C   D   E   F   G
  ┌───┐   ┌───┐   ┌───┐   ┌───┐
  │ %%%%%%%%%%%%%%%%%%%%%%%%%%%%%
1 └─%%%%%%%%%%%%%%%%%%%%%%%%%%%%%─┐
    %%%%%%%%%%%%%%%%%%%%%%%%%%%%% │
2 ┌─%%%%%%%%%%%%%%%%%%%%%%%%%%%%%─┘
  │ %%%%%%%%%%%%%%%%%%%%%%%%%%%%%
3 └─%%%%%%%%%%%%%%%%%%%%%%%%%%%%%─┐ 
    %%%%%%%%%%%%%%%%%%%%%%%%%%%%% │
4 ┌─%%%%%%%%%%%%%%%%%%%%%%%%%%%%%─┘
  │ %%%%%%%%%%%%%%%%%%%%%%%%%%%%%
5 └─%%%%%%%%%%%%%%%%%%%%%%%%%%%%%─┐
    %%%%%%%%%%%%%%%%%%%%%%%%%%%%% │
6 ┌─%%%%%%%%%%%%%%%%%%%%%%%%%%%%%─┘
  │ %%%%%%%%%%%%%%%%%%%%%%%%%%%%%
7 └─%%%%%%%%%%%%%%%%%%%%%%%%%%%%%─┐
    %%%%%%%%%%%%%%%%%%%%%%%%%%%%% │
      └───┘   └───┘   └───┘   └───┘
`;

const TITLE = `
    _   __  _   ___   ___    _   _    ___  __  _ __
  / \\,' /.' \\ / o | / o | .' \\ / //7/ _/,'_/ /// /
 / \\,' // o //  ,' /  ,' / o //  ,'/ _// /_ / \` / 
/_/ /_//_n_//_/\`_\\/_/\`_\\/_n_//_/\\\\/___/|__//_n_/
`;

const SCOREBOARD_TEMPLATE = `
┌───────────────────────┐
│ Player % %%%%%%%%%%%% │
│ Carpet: %%   Coin: %% │
└───────────────────────┘
`;

const STATE = {
    PREPARE: 0,
    START: 1,
    CARPET: 2,
    END: 3
};

export default class Marrakech { 
    constructor() {
        this.state = 0;
        this.currentOrder = 0;
        this.endFlag = false;
        this.players = [];
        this.order = [];
        this.asaam = null;
        this.lines = [];
        this.board = [];
        this.areaDP = [];
        for (let i = 0; i < 7; i++) { 
            this.board.push(new Array(7).fill(-1));
            this.areaDP.push(new Array(7).fill(0));
        }
        this.dieIndex = 0;
        this.area = 0
        this.pay = 0;
    }

    //#region Display
    displayPlayers() { 
        let result = "Players in game:";
        for (let p of this.players)
            result += "\n" + p.name;
        return result;
    }

    displayGameScreen() { 

    }

    //#endregion Display

    //#region Public Command
    join(id, name) {
        if (this.state !== STATE.PREPARE)
            return { status: ErrorManager.GAME_STATE_NOT_MATCH };
        const len = this.players.length;
        if (len >= 4)
            return { status: ErrorManager.GAME_JOIN_FULL };
        this.players.push({
            id: id,
            name: name,
            symbol: "",
            carpets: 0,
            coins: 0
        });
        return { status: 0 };
    }

    leave(id) { 
        if (this.state !== STATE.PREPARE)
            return { status: ErrorManager.GAME_STATE_NOT_MATCH };
        for (let i = 0; i < this.players.length; i++) { 
            if (this.players[i].id === id) { 
                this.players = this.players.splice(i, 1);
                return 0;
            }
        }
        return { status: ErrorManager.GAME_LEAVE_NOT_EXIST };
    }

    start() { 
        if (this.state !== STATE.PREPARE)
            return { status: ErrorManager.GAME_STATE_NOT_MATCH };
        const len = this.players.length;
        let carpets = 0;
        if (len === 3)
            carpets = 12;
        else if (len === 4)
            carpets = 15;
        // 2-player game WIP
        else
            return { status: ErrorManager.GAME_START_NOT_ENOUGH };
        for (let i = 0; i < len; i++) {
            this.players[i].symbol = PLAYER_SYMBOL[i];
            this.players[i].carpets = carpets;
            this.players[i].coins = 30;
        }
        this.order = this.getRandomOrder(len);
        this.currentOrder = 0;
        this.asaam = { position: "D4", direction: DIRECTION.TOP };
        this.state = STATE.START;
        return { status: 0 };
    }

    end() { 
        if (this.state !== STATE.START || this.state !== STATE.CARPET)
            return { status: ErrorManager.GAME_STATE_NOT_MATCH };
        return { status: 0 };
    }

    move(id, direction) { 
        if (this.state !== STATE.START)
            return { status: ErrorManager.GAME_STATE_NOT_MATCH };
        const index = this.getPlayerIndex(id);
        if (index < 0)
            return { status: ErrorManager.GAME_PLAYER_NOT_EXIST };
        if (index !== this.order[this.currentOrder])
            return { status: ErrorManager.GAME_PLAYER_NOT_TAKE_TURN };
        if ((this.asaam.direction ^ 3) === direction) // XOR with 0x11 = opposite direction
            return { status: ErrorManager.GAME_INVALID_ACTION };
        // Roll the die
        this.dieIndex = this.random(6);
        const position = this.getXY(this.asaam.position);
        const dieValue = DIE_FACE[this.dieIndex];
        this.asaam = this.getAfterMoveStatus(position, direction, dieValue);
        // Check and pay
        this.payForArea();
        this.state = STATE.CARPET;
        return { status: 0 };
    }

    place(direction, expand) { 
        
    }
    // #endregion Public Command

    getRandomOrder(bound) { 
        const ary = [];
        while (bound > 0) { 
            const rnd = this.random(bound--);
            const tmp = rnd + (ary[rnd] || 0);
            ary[rnd] = bound - rnd + (ary[bound] || 0);
            ary[bound] = tmp;
        }
        return ary;
    }

    random(bound, offset) { 
        offset = offset || 0;
        return Math.floor(Math.random() * bound) + offset;
    }

    getPlayerIndex(id) { 
        for (let i = 0; i < this.players.length; i++)
            if (this.players[i].id === id)
                return i;
        return -1;
    }

    getXY(position) { 
        const x = COL_SYMBOL.indexOf(position[0]);
        const y = ROW_SYMBOL.indexOf(position[1]);
        return { x: x, y: y };
    }

    getLineStatus(a, b) { 
        const pair = [a, b].sort();
        return this.lines[pair[0]] !== undefined && this.lines[pair[0]].includes(pair[1]);
    }

    setLineStatus(a, b, status) { 
        const pair = [a, b].sort();
        if (this.lines[pair[0]] === undefined)
            this.lines[pair[0]] = [];
        if (this.lines[pair[0]].includes(pair[1])) {
            if (status) return;
            this.lines[pair[0]].push(pair[1]);
        }
        else {
            if (!status) return;
            this.lines[pair[0]] = this.lines[pair[0]].splice(this.lines[pair[0]].indexOf(pair[1]), 1);
        }
    }

    getAfterMoveStatus(position, direction, blocks) { 
        if (((direction + 1) ^ 2) > 0) { // Horizontal
            if ((direction ^ 2) === 0) { // Left
                position.x -= blocks;
                const diff = 0 - position.x;
                if (diff > 0) { 
                    const edge = ROW_EDGE_ROUTE[position.y][0];
                    if (diff === 1)
                        return edge;
                    else
                        return this.getAfterMoveStatus(this.getXY(edge.position), edge.direction, diff - 1);
                }
            }
            else {  // Right
                position.x += blocks;
                const diff = position.x - 6;
                if (diff > 0) { 
                    const edge = ROW_EDGE_ROUTE[position.y][1];
                    if (diff === 1)
                        return edge;
                    else
                        return this.getAfterMoveStatus(this.getXY(edge.position), edge.direction, diff - 1);
                }
            }
        }
        else { // Vertical
            if ((direction ^ 2) === 0) { // Top
                position.y -= blocks;
                const diff = 0 - position.y;
                if (diff > 0) { 
                    const edge = ROW_EDGE_ROUTE[position.x][0];
                    if (diff === 1)
                        return edge;
                    else
                        return this.getAfterMoveStatus(this.getXY(edge.position), edge.direction, diff - 1);
                }
            }
            else {  // Bottom
                position.y += blocks;
                const diff = position.y - 6;
                if (diff > 0) {
                    const edge = ROW_EDGE_ROUTE[position.x][1];
                    if (diff === 1)
                        return edge;
                    else
                        return this.getAfterMoveStatus(this.getXY(edge.position), edge.direction, diff - 1);
                }
            }
        }
    }

    getAreaSize(x, y, value) {
        if (x < 0 || x > 6 || y < 0 || y > 6 || this.board[x][y] !== value || this.areaDP[x][y] > 0)
            return 0;
        this.areaDP[x][y] = 1;
        return 1 +
            this.getAreaSize(x - 1, y, value) +
            this.getAreaSize(x + 1, y, value) +
            this.getAreaSize(x, y - 1, value) +
            this.getAreaSize(x, y + 1, value);
    }

    payForArea() { 
        const targetId = this.board[x][y];
        if (targetId < 0)
            return;
        for (let row of this.areaDP)
            row.fill(0);
        this.area = this.getAreaSize(x, y, targetId);
        const current = this.players[this.order[this.currentOrder]];
        const target = this.players[targetId];
        this.pay = current.coins < this.area ? current.coins : this.area;
        current.coins -= this.pay;
        target.coins += this.pay;
    }


}
