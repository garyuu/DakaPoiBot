const EM = require('./error_message');
const COMMANDS = require('./commands');

module.exports = function (app) {
    return new Command(app);
}
    
class Command { 
    constructor(app) {
        this.app = app;
        this.logger = app.getLogger();
        this.commands = new Map();
        this.aliases = new Map();

        for (let cmd of Object.values(COMMANDS))
            this.register(cmd);
    }

    async execute(message, command, args) {
        const method = this.getMethod(command);
        if (method == null) {
            message.channel.send(this.app.lang.response.default);
            return;
        }
        try {
            await method.execute(message, command, args);
        } catch (e) {
            this.logger.error(`[Command] execute() Error occurred during executing the command.\n${e}`);
            throw { code: EM.UNEXPECTED_ERROR, data: e };
        }
    }

    register(command) { 
        const { aliases, factory } = command;
        const name = aliases[0].toLowerCase();
        if (!name) {
            this.logger.error(`[Command] register() command name is empty!`);
            return;
        }
        this.logger.info(`[Command] Add command: ${name}`);
        this.commands.set(name, factory(this.app));
        for (let alias of aliases) {
            alias = alias.toLowerCase();
            if (this.aliases.has(alias))
                this.logger.warn(`[Command] register() Alias ${alias} is already assigned to ${this.aliases.get(alias)}. Will be overwrite with ${name}.`);
            this.aliases.set(alias, name);
        }
    }

    getMethod(command) { 
        command = command.toLowerCase();
        if (this.aliases.has(command))
            return this.commands.get(this.aliases.get(command));
        else
            return null;
    }
}