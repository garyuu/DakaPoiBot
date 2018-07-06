require('dotenv').config();
const discord = require('discord.js');
const client = new discord.Client();

client.on("ready", () => {
    console.log("I am ready Poi!");
});

client.on("message", (message) => {
    if (message.content.startsWith("Poi, ")) {
        message.channel.send("Poi!!");
    }
});

client.login(process.env.BOT_TOKEN)
