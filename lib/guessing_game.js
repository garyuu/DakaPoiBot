class GuessingGame {
    constructor() {
        this.answerNumber = "";
        this.answer = [];
        this.guessLog = [];
        this.hint = "0A0B";
        this.generateAnswer();
    }

    generateAnswer() {
        let n = 10;
        for (let i = 1; i <= 4; i++, n--) {
            let id = Math.floor(Math.random() * n);
            while(this.answer[id] !== undefined) {
                id = (id + 1) % 10;
            }
            this.answer[id] = i;
            this.answerNumber += id;
        }
    }
    
    status() {
        let obj = {
            hint: this.hint,
            history: this.guessLog.join()
        }
        return obj;
    }

    guess(input) {
        if (!this.inputFormat(input))
            return Promise.reject("Incorrect input format");
        return new Promise(((resolve, reject) => {
            let ary = [];
            for (let i = 0; i < 4; i++) {
                const id = parseInt(input.charAt(i));
                if (ary[id] !== undefined) {
                    reject("Incorrect input format");
                    return;
                }
                else {
                    ary[id] = i + 1;
                }
            }
            let A = 0;
            let B = 0;
            for (let i = 0; i < 10; i++) {
                if (this.answer[i] != undefined) {
                    if (ary[i] != undefined) {
                        if (this.answer[i] == ary[i])
                            A++;
                        else
                            B++;
                    }
                }
            }
            this.hint = A == 4 ? this.answerNumber : (A + "A" + B + "B");
            this.guessLog.push(input);
            let output = this.status();
            output.win = (A == 4);
            resolve(output);
        }).bind(this));
    }

    inputFormat(input) {
        return (input.match(/^\d\d\d\d$/) != null);
    }
}

class GuessingGameManager {
    constructor() {
        this.games = new Map();
    }

    isRunning(guild) {
        return this.games.has(guild);
    }

    start(guild) {
        return new Promise((resolve, reject) => {
            try {
                this.games.set(guild, new GuessingGame());
                resolve();
            }
            catch(e) {
                reject(e);
            }
        });
    }

    stop(guild) {
        this.games.delete(guild);
    }

    guess(guild, input) {
        return this.games.get(guild).guess(input)
                .then(((result) => {
                    if (result.win == true)
                        this.stop(guild);
                    return result;
                }).bind(this));
    }

    status(guild) {
        return this.games.get(guild).status();
    }
}

module.exports = new GuessingGameManager();
