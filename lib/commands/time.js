const request = require('request-promise');

const SPECIFIED_TIMEZONE = [-5, 8, 9];


const DATETIME_FORMAT = /^((\d+-)?\d+-\d+T)?(\d+:\d+)(:\d+)?$/;
// Aliases for accessing timezone key.
const TIMEZONE_ALIASES = {};
// Named timezone key to offset.
const TIMEZONE_TABLE = {};
// The string to display as name for the key.
const TIMEZONE_DISPLAY = {};

function addTimeZone(offset, name, ...aliases) { 
    TIMEZONE_ALIASES[name] = name;
    aliases.map(x => TIMEZONE_ALIASES[x] = name);
    TIMEZONE_TABLE[name] = offset
    if (aliases.length > 0)
        TIMEZONE_DISPLAY[name] = aliases[0];
}

addTimeZone(-5, "est", "美東", "westamerica", "westus", "westusa", "wus");
addTimeZone(8, "taipei", "臺北", "臺灣", "台灣", "台北", "tw", "taiwan");
addTimeZone(9, "tokyo", "東京", "日本", "japan", "jp");

const Time = async function (args) {
    let message = "";
    const len = args.length;
    if (len > 1) {
        // Show converted zone time
        const offset = getTimeOffset(args[0]);
        if (offset == null) {
            console.error("Time [MAIN] Offset should be numeric or specific name.");
            return { error: -2 };
        }
        const timeString = args[1];
        if (!timeString.match(DATETIME_FORMAT)) { 
            console.error("Time [MAIN] Datetime format must be YYYY-MM-DDTHH:mm:ss");
            return { error: -3 };
        }
        const dateAndTime = timeString.split('T');
        const currentTime = new Date(Date.now());
        const timeZoneOffset = offset + currentTime.getTimezoneOffset() / 60;
        const currentSpecificTime = new Date(Date.now() - timeZoneOffset * 3600000);
        const datetimeInfo = {
            year: currentSpecificTime.getUTCFullYear(),
            month: currentSpecificTime.getUTCMonth() + 1,
            day: currentSpecificTime.getUTCDate(),
            hour: 0,
            min: 0,
            sec: 0
        };
        if (dateAndTime.length > 1) {
            const dateArray = dateAndTime[0].split('-');
            let i = 0;
            if (dateArray.length > 2)
                datetimeInfo.year = parseInt(dateArray[i++]);
            datetimeInfo.month = parseInt(dateArray[i++])
            datetimeInfo.day = parseInt(dateArray[i])
        }
        const timeArray = dateAndTime[dateAndTime.length - 1].split(':');
        let j = 0;
        datetimeInfo.hour = parseInt(timeArray[j++])
        datetimeInfo.min = parseInt(timeArray[j++])
        if (timeArray.length > 2)
            datetimeInfo.sec = parseInt(timeArray[j]);
        const result = convertToSpecificTimezone(datetimeInfo, offset, SPECIFIED_TIMEZONE);
        for (let time of result) {
            message += `${time.name}: ${time.string}\n`;
        }
    } else if (len > 0) {
        // Show assigned zone current time
        const offset = getTimeOffset(args[0]);
        if (offset == null) {
            console.error("Time [MAIN] Offset should be numeric or specific name.")
            return { error: -2 }
        }
        const result = await getTime(offset);
        if (result.error < 0) {
            console.error("Time [MAIN] Get time failed.");
            return result;
        }
        message += `${result.name}: ${result.string}\n`;
    } else {
        // Show 3 specific current time
        const result = await getSpecificTime(SPECIFIED_TIMEZONE);
        if (result.error < 0) {
            console.error("Time [MAIN] Get time array failed.");
            return result;
        }
        for (let time of result.data) {
            message += `${time.name}: ${time.string}\n`;
        }
    }
    message = "```\n" + message + "```";
    return {
        error: 0,
        data: message
    };
}

function convertToSpecificTimezone(info, offset, target) {
    const result = [];
    for (let i = 0; i < target.length; i++) { 
        result[i] = {
            name: getTimeDisplay(target[i]),
            string: getStringByInfo(info, target[i] - offset)
        }
    }
    return result;
}

function getStringByInfo(info, offset) {
    const date = new Date(Date.UTC(info.year, info.month - 1, info.day, info.hour + offset, info.min, info.sec));
    let dateString = date.toISOString();
    dateString = dateString.replace('T', ' ');
    dateString = dateString.split('.')[0];
    return dateString;
}

async function getSpecificTime(args) {
    const tz = [];
    for (let i = 0; i < args.length; i++)
        tz[i] = getTime(args[i]);
    try {
        array = await Promise.all(tz);
        return {
            error: 0,
            data: array
        };
    } catch (e) {
        return { error: -1 };
    }
}

function getTimeOffset(name) {
    if (isNaN(name)) {
        name = name.toLowerCase();
        if (name in TIMEZONE_ALIASES)
            return TIMEZONE_TABLE[TIMEZONE_ALIASES[name]];
    } else {
        return parseInt(name);
    }
    console.error(`Time [getTimeOffset] Invalid name: ${name}`)
    return null;
}

function getTimeDisplay(offset) {
    for (let key in TIMEZONE_TABLE) { 
        if (TIMEZONE_TABLE[key] == offset) {
            if (key in TIMEZONE_DISPLAY)
                return TIMEZONE_DISPLAY[key];
            else
                break;
        }
    }
    return "GMT" + `${offset}`.padStart(2).padEnd(3);
}

async function getTime(name) {
    const offset = getTimeOffset(name);
    const reversed = -offset;
    let text = parseInt(reversed);
    if (reversed > 0)
        text = "+" + text;
    const options = {
        uri: "http://worldtimeapi.org/api/timezone/Etc/GMT" + text,
        json: true
    };
    try {
        const result = await request(options);
        if (result.error)
            return { error: -2 };
        const dateTimePair = result.datetime.split('.')[0].split('T');
        let timeZoneName = getTimeDisplay(offset);
        return {
            name: timeZoneName,
            string: dateTimePair.join(" ")
        };
    } catch (e) {
        return { error: -1 };
    }
}

module.exports = Time;
