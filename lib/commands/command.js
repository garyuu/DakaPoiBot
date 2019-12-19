class Command { 
    constructor() { 
        this.commands = {};
        this.aliases = {};
        // Time
        this.register(require('./time.js'), 'time', '時間');
    }

    async execute(command, args) {
        const method = this.getMethod(command);
        if (method == null) { 
            console.error("Command [execute] Command not found.");
            return { error: -1 };
        }
        try {
            return await method(args);
        } catch (e) {
            console.error("Command [execute] Error occurred during executing the command.");
            throw e;
        }
    }

    register(method, name, ...aliases) { 
        this.commands[name] = method;
        this.aliases[name] = name;
        for (let alias of aliases)
            this.aliases[alias] = name;
    }

    getMethod(command) { 
        if (command in this.aliases)
            return this.commands[this.aliases[command]];
        else
            return null;
    }
}

module.exports = new Command();