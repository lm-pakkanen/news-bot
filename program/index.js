const Discord = require('discord.js');
const client = new Discord.Client();

const DatabaseCL = require('./database').Database;
const Scheduler = require("./scheduler");
const Validator = require('./validator').Validator;
const constants = require("./constants");

const Private = require('./private');
const BotPass = Private.BotPass;
const AdminID = Private.AdminID;

const Database = new DatabaseCL();

client.login(BotPass);

client.on("ready", () => {

    console.log("Bot connected!");

    client.on("message", (message) => {

        /* Split command by space */
        let args = message.toString().split(" ");

        let command, commandResponse;

        switch (command = args[0]){
            case '!help':
                try {
                    if (!Validator.validateArguments([args[1]])){
                        commandResponse = GetBotCommands();
                    } else {
                        commandResponse = GetBotCommand(args[1]);
                    }
                    message.reply(commandResponse);
                } catch (error) {
                    console.error(error);
                    message.reply("Something went wrong while getting commands.");
                }
                break;
            case '!addchannel':
                if (!Validator.validateArguments([args[1], message.channel.id])){
                    return message.reply("Invalid arguments in command.");
                }
                Database.AddChannel(args[1], message.channel.id)
                    .then(() => { message.reply("Channel successfully added!"); })
                    .catch(error => {
                        console.error(error);
                        message.reply("Something went wrong while adding channel.");
                    });
                break;
            case '!removechannel':
                if (!Validator.validateArguments([args[1], message.channel.id])){
                    return message.reply("Invalid arguments in command.");
                }
                Database.RemoveChannel(args[1], message.channel.id)
                    .then(() => { message.reply("Channel successfully removed."); })
                    .catch((error) => {
                        console.error(error);
                        message.reply("Something went wrong while removing channel.");
                    });
                break;
            case '!getupdate':
                if (!Validator.validateArguments([args[1]])){
                    return message.reply("Invalid arguments in command.");
                }
                message.reply("Getting update article, please wait...");
                Scheduler.SendUpdate(args[1],[message.channel.id])
                    .catch((error) => {
                        console.error(error);
                        message.reply("Something went wrong while getting update.");
                    });
                break;
            case '!schedulestart':
                if (message.author.id === AdminID){
                    try {
                        commandResponse = Scheduler.StartSchedule();
                        message.reply(commandResponse);
                    } catch (error) {
                        console.error(error);
                        message.reply("Something went wrong while starting CRON schedule.");
                    }
                } else { message.reply("You're not authorized to use this command."); }
                break;
            case '!schedulestop':
                if (message.author.id === AdminID){
                    try {
                        commandResponse = Scheduler.StopSchedule();
                        message.reply(commandResponse);
                    } catch (error) {
                        console.error(error);
                        message.reply("Something went wrong while stopping CRON schedule.");
                    }
                } else { message.reply("You're not authorized to use this command."); }
                break;
            default:
                /* Invalid command entered */
                if (command.startsWith("!")){
                    message.reply("Unknown command: " + command + "\nIf you need help, type \"!help\"");
                }
                break;
        }
    });
});

function SendMessage(channel, message, embed = false){
    if (embed){ client.channels.get(channel).send(message, embed); }
    else { client.channels.get(channel).send(message); }
}

function GetBotCommands() {
    let output = "";

    output += "To learn more about a command, type \"!help <command>\".\n";
    output += "Here are all of my commands:\n\n";
    for (let key in constants.BotCommands) {
        output += constants.BotCommands[key]["command"] + "\n";
    }

    return output;
}
function GetBotCommand(command){
    let output = "";

    /* Remove exclamation mark */
    if (command.indexOf("!") === 0) { command = command.substr(1); }

    command = constants.BotCommands[command];

    /* If command exists.. */
    if (command) {
        output += "\nCommand:      " + command["command"] + "\n";
        output += "Description:    " + command["description"] + "\n\n";
        output += "Syntax:             " + command["syntax"] + "\n";
        output += "Example:          " + command["example"] + "\n";

        if (command["argvalues"]) {
            output += "Possible argument values:\n" + command["argvalues"] + "\n";
        }

        output += "\nIf a command parameter includes a question mark (?), that parameter is optional.";
    } else {
        throw new Error("Invalid arguments in command.");
    }

    return output;
}

module.exports.SendMessage = SendMessage;