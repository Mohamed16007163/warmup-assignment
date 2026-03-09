const fs = require("fs");

// ============================================================
// Function 1: getShiftDuration(startTime, endTime)
// startTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// endTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// Returns: string formatted as h:mm:ss
// ============================================================
function getShiftDuration(startTime, endTime) {
    function helper(t) {
        let parts = t.split(" "); // ["10:30:00", "pm"]
        let timeParts = parts[0].split(":");
        let h = Number(timeParts[0]);
        let m = Number(timeParts[1]);
        let s = Number(timeParts[2]);
        let period = parts[1].toLowerCase();

        // Convert to 24-hour format
        if (period === "pm" && h !== 12) h += 12;
        if (period === "am" && h === 12) h = 0;

        // Return total seconds from start of day
        return h * 3600 + m * 60 + s;
    }

    let startTotalSeconds = helper(startTime);
    let endTotalSeconds = helper(endTime);

    let diff = endTotalSeconds - startTotalSeconds;

    // Handle shifts that cross over midnight (e.g., 11pm to 1am)
    if (diff < 0) {
        diff += 24 * 3600; // Add 24 hours worth of seconds
    }

    let h = Math.floor(diff / 3600);
    let m = Math.floor((diff % 3600) / 60);
    let s = diff % 60;

    // Standardize to HH:mm:ss with padding
    const pad = (num) => String(num).padStart(2, '0');

    return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

// ============================================================
// Function 2: getIdleTime(startTime, endTime)
// startTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// endTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// Returns: string formatted as h:mm:ss
// ============================================================
function getIdleTime(startTime, endTime) {

    function toSeconds(t) {
        let p = t.toLowerCase().split(" ");
        let time = p[0].split(":");

        let h = parseInt(time[0]);
        let m = parseInt(time[1]);
        let s = parseInt(time[2]);

        if (p[1] === "pm" && h !== 12) h += 12;
        if (p[1] === "am" && h === 12) h = 0;

        return h*3600 + m*60 + s;
    }

    let start = toSeconds(startTime);
    let end = toSeconds(endTime);

    let startLimit = 8 * 3600;      
    let endLimit = 22 * 3600;       

    let idle = 0;

    if (start < startLimit)
        idle += startLimit - start;

    if (end > endLimit)
        idle += end - endLimit;

    let h = Math.floor(idle / 3600);
    let m = Math.floor((idle % 3600) / 60);
    let s = idle % 60;

    if (m < 10) m = "0" + m;
    if (s < 10) s = "0" + s;

    return h + ":" + m + ":" + s;
}

// ============================================================
// Function 3: getActiveTime(shiftDuration, idleTime)
// shiftDuration: (typeof string) formatted as h:mm:ss
// idleTime: (typeof string) formatted as h:mm:ss
// Returns: string formatted as h:mm:ss
// ============================================================
function getActiveTime(shiftDuration, idleTime) {
    function toSeconds(t) {
        let time = t.split(":");
        let h = parseInt(time[0]);
        let m = parseInt(time[1]);
        let s = parseInt(time[2]);
        return h*3600 + m*60 + s;
    }
    let active = toSeconds(shiftDuration) - toSeconds(idleTime);
     let h = Math.floor(active / 3600);
    let m = Math.floor((active % 3600) / 60);
    let s = active % 60;

    if (m < 10) m = "0" + m;
    if (s < 10) s = "0" + s;

    return h + ":" + m + ":" + s;
}

// ============================================================
// Function 4: metQuota(date, activeTime)
// date: (typeof string) formatted as yyyy-mm-dd
// activeTime: (typeof string) formatted as h:mm:ss
// Returns: boolean
// ============================================================
function metQuota(date, activeTime){

    let t = activeTime.split(":");
    let active = t[0]*3600 + t[1]*60 + t[2]*1;

    let normal = 8*3600 + 24*60;
    let eid = 6*3600;

    if(date >= "2025-04-10" && date <= "2025-04-30")
        return active >= eid;

    return active >= normal;
}

// ============================================================
// Function 5: addShiftRecord(textFile, shiftObj)
// textFile: (typeof string) path to shifts text file
// shiftObj: (typeof object) has driverID, driverName, date, startTime, endTime
// Returns: object with 10 properties or empty object {}
// ============================================================
function addShiftRecord(textFile, shiftObj) {
    // TODO: Implement this function
}

// ============================================================
// Function 6: setBonus(textFile, driverID, date, newValue)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// date: (typeof string) formatted as yyyy-mm-dd
// newValue: (typeof boolean)
// Returns: nothing (void)
// ============================================================
function setBonus(textFile, driverID, date, newValue) {
    // TODO: Implement this function
}

// ============================================================
// Function 7: countBonusPerMonth(textFile, driverID, month)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// month: (typeof string) formatted as mm or m
// Returns: number (-1 if driverID not found)
// ============================================================
function countBonusPerMonth(textFile, driverID, month) {
    // TODO: Implement this function
}

// ============================================================
// Function 8: getTotalActiveHoursPerMonth(textFile, driverID, month)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// month: (typeof number)
// Returns: string formatted as hhh:mm:ss
// ============================================================
function getTotalActiveHoursPerMonth(textFile, driverID, month) {
    // TODO: Implement this function
}

// ============================================================
// Function 9: getRequiredHoursPerMonth(textFile, rateFile, bonusCount, driverID, month)
// textFile: (typeof string) path to shifts text file
// rateFile: (typeof string) path to driver rates text file
// bonusCount: (typeof number) total bonuses for given driver per month
// driverID: (typeof string)
// month: (typeof number)
// Returns: string formatted as hhh:mm:ss
// ============================================================
function getRequiredHoursPerMonth(textFile, rateFile, bonusCount, driverID, month) {
    // TODO: Implement this function
}

// ============================================================
// Function 10: getNetPay(driverID, actualHours, requiredHours, rateFile)
// driverID: (typeof string)
// actualHours: (typeof string) formatted as hhh:mm:ss
// requiredHours: (typeof string) formatted as hhh:mm:ss
// rateFile: (typeof string) path to driver rates text file
// Returns: integer (net pay)
// ============================================================
function getNetPay(driverID, actualHours, requiredHours, rateFile) {
    // TODO: Implement this function
}

module.exports = {
    getShiftDuration,
    getIdleTime,
    getActiveTime,
    metQuota,
    addShiftRecord,
    setBonus,
    countBonusPerMonth,
    getTotalActiveHoursPerMonth,
    getRequiredHoursPerMonth,
    getNetPay
};
