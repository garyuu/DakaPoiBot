const moment = require('moment-timezone');

const SPECIFIED_TIMEZONE = ["America/New_York", "Asia/Taipei", "Asia/Tokyo"];

const OUTPUT_FORMAT = "YYYY-MM-DD HH:mm:ss";
const DATE_REGEX = /^((\d+)-)?(\d+)-(\d+)$/;
const TIME_REGEX = /^(\d+):(\d+)(:(\d+))?$/;
const DATETIME_FORMAT = /^((\d+-)?\d+-\d+T)?(\d+:\d+)(:\d+)?$/;
// Aliases for accessing timezone key.
const TIMEZONE_ALIASES = {};
// The string to display as name for the key.
const TIMEZONE_DISPLAY = {};

class Time {
    constructor() {
        this.addTimeZone("America/New_York", ["美東", "est", "westamerica", "westus", "westusa", "wus"]);
        this.addTimeZone("Asia/Taipei", ["臺北", "臺灣", "台灣", "台北", "taipei", "tw", "taiwan"]);
        this.addTimeZone("Asia/Tokyo", ["東京", "日本", "tokyo", "japan", "jp"]);
    }

    addTimeZone(timezone, aliases) {
        TIMEZONE_ALIASES[timezone.toLowerCase()] = timezone;
        aliases.map(x => TIMEZONE_ALIASES[x.toLowerCase()] = timezone);
        if (aliases.length > 0)
            TIMEZONE_DISPLAY[timezone] = aliases[0];
        else
            TIMEZONE_DISPLAY[timezone] = timezone;
    }

    async execute(args) {
        let result;
        let timezone;
        let date;
        let time;
        const len = args.length;
        if (len == 0) {
            // Show 3 specific current time
            result = this.showCurrentAllSpecificZoneTime();
        } else {
            if (len >= 1) {
                // Show assigned zone current time
                timezone = this.checkValidTimeZone(args[0]);
                if (timezone == null)
                    throw "Time [execute] Timezone invalid.";
            }
            if (len == 1) {
                result = this.showCurrentAssignedZoneTime(timezone);
            } else {
                // Show 3 specific assigned time, use date of today
                date = this.checkValidDate(args[1]);
                if (date == null)
                    time = this.checkValidTime(args[1]);
                else
                    time = this.checkValidTime(args[2]);
                if (time == null)
                    throw "Time [execute] Date or time format incorrect.";
                result = this.convertToAllSpecificZoneTime(timezone, date, time);
            }
        }
        if (result == null) 
            throw "Time [execute] result is NULL!";
        let message = result.reduce((x, y) => {
            return x + y.name + ": " + y.string + "\n";
        }, "");
        return {
            error: 0,
            data: "```\n" + message + "```"
        };
    }

    checkValidTimeZone(timezone) {
        const tz = timezone.toLowerCase();
        if (tz in TIMEZONE_ALIASES)
            return TIMEZONE_ALIASES[tz];
        else
            return null;
    }

    checkValidDate(date) {
        const result = date.match(DATE_REGEX);
        if (result == null)
            return null;
        const dateVO = {};
        let i = 2;
        if (result.length > 4)
            dateVO.year = result[i++];
        dateVO.month = result[i++];
        dateVO.date = result[i++];
        return dateVO;
    }

    checkValidTime(time) {
        const result = time.match(TIME_REGEX);
        if (result == null)
            return null;
        const timeVO = {};
        timeVO.hour = result[1];
        timeVO.minute = result[2];
        if (result.length > 4)
            timeVO.second = result[4];
        return timeVO;
    }

    showCurrentAllSpecificZoneTime() {
        const self = this;
        const result = [];
        const time = moment();
        for (let timezone of SPECIFIED_TIMEZONE) { 
            result.push({
                name: self.getTimeZoneDisplay(timezone),
                string: time.tz(timezone).format(OUTPUT_FORMAT)
            });
        }
        return result;
    }

    showCurrentAssignedZoneTime(timezone) {
        const self = this;
        const time = moment.tz(timezone);
        return [{
            name: self.getTimeZoneDisplay(timezone),
            string: time.format(OUTPUT_FORMAT)
        }];
    }

    convertToAllSpecificZoneTime(timezone, date, time) {
        const self = this;
        const result = [];
        const current = moment.tz(timezone);
        const dateTimeObject = {
            year: date != null && 'year' in date ? date.year : current.year(),
            month: date != null && 'month' in date ? date.month - 1 : current.month(),
            date: date != null && 'date' in date ? date.date : current.date(),
            hour: time != null && 'hour' in time ? time.hour : 0,
            minute: time != null && 'minute' in time ? time.minute : 0,
            second: time != null && 'second' in time ? time.second : 0
        };
        const targetTime = moment.tz(dateTimeObject, timezone);
        for (let timezone of SPECIFIED_TIMEZONE) { 
            result.push({
                name: self.getTimeZoneDisplay(timezone),
                string: targetTime.tz(timezone).format(OUTPUT_FORMAT)
            });
        }
        return result;
    }

    getTimeZoneDisplay(timezone) { 
        if (timezone in TIMEZONE_DISPLAY)
            return TIMEZONE_DISPLAY[timezone];
        else
            return timezone;
    }
}

module.exports = new Time();
