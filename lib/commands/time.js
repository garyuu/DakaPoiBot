const request = require('request-promise');

const Time = async function (timeZone) {
    // Just show -5 +8 +9
    let message = "```";
    if (args.length === 0) {
        const result = await getSpecificTime(-5, 8, 9);
        if (result.error < 0) {
            console.error("Time [MAIN] Get time array failed.");
            return result;
        }
        for (let time in result.data) {
            message += `\n
                GMT${time.name.padEnd(3)}: ${time.string}
            `;
        }
    } else {
        const offset = parseInt(timeZone);
        if (isNaN(offset)) {
            console.error("Time [MAIN] Argument should be numeric.")
            return { error: -2 }
        }
        const result = await getTime(offset);
        if (result.error < 0) { 
            console.error("Time [MAIN] Get time failed.");
            return result;
        }
        message += `\n
            GMT${result.data.name.padEnd(3)}: ${result.data.string}
        `;
    }
    message += "\n```";
    return {
        error: 0,
        data: message
    };
}

async function getSpecificTime(...args) {
    const tz = [];
    tz[0] = getTime(-5);
    tz[1] = getTime(8);
    tz[2] = getTime(9);
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

async function getTime(offset) {
    let text = "";
    if (offset > 0)
        text = "-" + Math.round(Math.abs(offset));
    else if (offset < 0)
        text = "+" + Math.round(Math.abs(offset));
    const options = {
        uri: "http://worldtimeapi.org/api/timezone/Etc/GMT" + text,
        json: true
    };
    try {
        const result = await request(options);
        if (result.error)
            return { error: -2 };
        const dateTimePair = result.datetime.split('.')[0].split('T');
        return {
            name: "GMT" + text,
            string: dateTimePair.join(" ")
        };
    } catch (e) {
        return { error: -1 };
    }
}

export default Time;