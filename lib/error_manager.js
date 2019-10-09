const ERROR_CODE = {
    UNEXPECTED_ERROR: -1,
    
    GAME_STATE_NOT_MATCH: -100,

    GAME_JOIN_DUPLICATED: -110,
    GAME_JOIN_FULL: -111,

    GAME_LEAVE_NOT_EXIST: -120,
    
    GAME_START_NOT_ENOUGH: -130,

    GAME_PLAYER_NOT_EXIST: -140,
    GAME_PLAYER_NOT_TAKE_TURN: -141,
};

class ErrorManager { 
    constructor() { 

    }

    getErrorMessage(errorCode) { 

    }
}

Object.assign(ErrorManager, ERROR_CODE);

export default new ErrorManager();