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

    const shifts = readShifts(textFile);
    const duplicate = shifts.find(
        s => String(s.driverID) === String(shiftObj.driverID) &&
             s.date === shiftObj.date
    );

    if (duplicate) {
        return {};
    }
    const shiftDuration = getShiftDuration(shiftObj.startTime, shiftObj.endTime);
    const idleTime = getIdleTime(shiftObj.startTime, shiftObj.endTime);
    const activeTime = getActiveTime(shiftDuration, idleTime);
    const quota = metQuota(shiftObj.date, activeTime);

    // create new record (10 properties)
    const newRecord = {
        driverID: shiftObj.driverID,
        driverName: shiftObj.driverName,
        date: shiftObj.date,
        startTime: shiftObj.startTime,
        endTime: shiftObj.endTime,
        shiftDuration: shiftDuration,
        idleTime: idleTime,
        activeTime: activeTime,
        metQuota: quota,
        hasBonus: false
    };
    const lastIndex = shifts
        .map(s => String(s.driverID))
        .lastIndexOf(String(shiftObj.driverID));

    if (lastIndex === -1) {
        // driver not found → append
        shifts.push(newRecord);
    } else {
        // insert after last occurrence
        shifts.splice(lastIndex + 1, 0, newRecord);
    }

    // write back to file
    writeShifts(textFile, shifts);
    return newRecord;
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
    try {
        // 1. Read the file
        const data = fs.readFileSync(textFile, 'utf8');
        
        // 2. Split into lines
        const lines = data.split('\n');
        
        // 3. Map and update the specific row
        const updatedLines = lines.map(line => {
            if (!line.trim()) return line; // Keep empty lines
            
            const columns = line.split(',');
            // Assuming: [0] driverID, [1] date, [2] hasBonus
            if (columns[0].trim() === driverID && columns[1].trim() === date) {
                columns[2] = String(newValue); // Update the value
                return columns.join(',');
            }
            return line;
        });

        // 4. Save back to file
        fs.writeFileSync(textFile, updatedLines.join('\n'), 'utf8');
        
    } catch (err) {
        console.error("Error in setBonus:", err.message);
    }
}

// ============================================================
// Function 7: countBonusPerMonth(textFile, driverID, month)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// month: (typeof string) formatted as mm or m
// Returns: number (-1 if driverID not found)
// ============================================================
function countBonusPerMonth(textFile, driverID, month) {
    try {
        const data = fs.readFileSync(textFile, 'utf8');
        const lines = data.split('\n').filter(line => line.trim() !== '');

        let driverFound = false;
        let bonusCount = 0;
        // Convert input month to a number for easier comparison (handles '05' vs '5')
        const targetMonth = parseInt(month, 10);

        for (let line of lines) {
            // Assuming CSV format: driverID, date (yyyy-mm-dd), hasBonus (true/false)
            const columns = line.split(',');
            if (columns.length < 3) continue;

            const currentDriverID = columns[0].trim();
            const dateStr = columns[1].trim(); // e.g., "2023-05-12"
            const hasBonus = columns[2].trim().toLowerCase() === 'true';

            // Check if this is the driver we are looking for
            if (currentDriverID === driverID) {
                driverFound = true;

                // Extract month from "yyyy-mm-dd"
                const dateParts = dateStr.split('-');
                const currentMonth = parseInt(dateParts[1], 10);

                // If month matches and hasBonus is true, increment count
                if (currentMonth === targetMonth && hasBonus) {
                    bonusCount++;
                }
            }
        }

        // Return -1 if the driver was never seen in the file
        return driverFound ? bonusCount : -1;

    } catch (err) {
        console.error("Error reading file:", err.message);
        return 0; 
    }
}



// ============================================================
// Function 8: getTotalActiveHoursPerMonth(textFile, driverID, month)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// month: (typeof number)
// Returns: string formatted as hhh:mm:ss
// ============================================================
function getTotalActiveHoursPerMonth(textFile, driverID, month) {
    try {
        const data = fs.readFileSync(textFile, 'utf8');
        const lines = data.split('\n').filter(line => line.trim() !== '');

        let totalSeconds = 0;

        for (let line of lines) {
            const columns = line.split(',');
            if (columns.length < 3) continue;

            const currentDriverID = columns[0].trim();
            const dateStr = columns[1].trim();
            const activeTimeStr = columns[2].trim();

            if (currentDriverID === driverID) {

                const monthInFile = parseInt(dateStr.split('-')[1], 10);
                
                if (monthInFile === month) {

                    const [h, m, s] = activeTimeStr.split(':').map(Number);
                    totalSeconds += (h * 3600) + (m * 60) + s;
                }
            }
        }

        // 4. Convert total seconds back to hhh:mm:ss
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        // Use padStart to ensure 2 digits for minutes and seconds
        const hDisplay = String(hours).padStart(2, '0');
        const mDisplay = String(minutes).padStart(2, '0');
        const sDisplay = String(seconds).padStart(2, '0');

        return `${hDisplay}:${mDisplay}:${sDisplay}`;

    } catch (err) {
        console.error("Error:", err.message);
        return "00:00:00";
    }
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
    try {

        const rateData = fs.readFileSync(rateFile, 'utf8').split('\n');
        let dayOff = "";
        let standardQuota = 0;

        for (let line of rateData) {
            if (!line.trim()) continue;
            const [id, rate, quota, offDay] = line.split(',');
            if (id.trim() === driverID) {
                standardQuota = parseFloat(quota);
                dayOff = offDay.trim().toLowerCase(); 
                break;
            }
        }

        const shiftData = fs.readFileSync(textFile, 'utf8').split('\n');
        let totalRequiredSeconds = 0;

        for (let line of shiftData) {
            if (!line.trim()) continue;
            const [id, dateStr] = line.split(',');
            
            if (id.trim() === driverID) {
                const dateObj = new Date(dateStr.trim());
                const currentMonth = dateObj.getMonth() + 1; 
                
                if (currentMonth === month) {
                    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
                    
                    if (dayName === dayOff) continue;

                    let dailyQuota = standardQuota;
                    const dayOfMonth = dateObj.getDate();
                    if (month === 4 && dayOfMonth >= 10 && dayOfMonth <= 30) {
                        dailyQuota = 6;
                    }

                    totalRequiredSeconds += dailyQuota * 3600;
                }
            }
        }
        const bonusSeconds = bonusCount * 2 * 3600;
        totalRequiredSeconds = Math.max(0, totalRequiredSeconds - bonusSeconds);

        // 4. Format to hhh:mm:ss
        const hours = Math.floor(totalRequiredSeconds / 3600);
        const minutes = Math.floor((totalRequiredSeconds % 3600) / 60);
        const seconds = totalRequiredSeconds % 60;

        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    } catch (err) {
        console.error("Error:", err.message);
        return "00:00:00";
    }
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
    try {
        const toSeconds = (timeStr) => {
            const [h, m, s] = timeStr.split(':').map(Number);
            return (h * 3600) + (m * 60) + s;
        };
        const actualSec = toSeconds(actualHours);
        const requiredSec = toSeconds(requiredHours);
        if (actualSec >= requiredSec) {
            return getDriverBasePay(driverID, rateFile);
        }
        const rateData = fs.readFileSync(rateFile, 'utf8').split('\n');
        let basePay = 0;
        let tier = 0;

        for (let line of rateData) {
            if (!line.trim()) continue;
            const parts = line.split(',');
            if (parts[0].trim() === driverID) {
                tier = parseInt(parts[4]);
                basePay = parseInt(parts[5]);
                break;
            }
        }
        let missingSec = requiredSec - actualSec;

        let allowanceSec = 0;
        if (tier === 2) {
            allowanceSec = 20 * 3600;
        } 
        let billableSec = Math.max(0, missingSec - allowanceSec);

        const billableFullHours = Math.floor(billableSec / 3600);

        const deductionRatePerHour = Math.floor(basePay / 185);
        const salaryDeduction = billableFullHours * deductionRatePerHour;

        return basePay - salaryDeduction;

    } catch (err) {
        console.error("Error in getNetPay:", err.message);
        return 0;
    }
}

function getDriverBasePay(driverID, rateFile) {
    const data = fs.readFileSync(rateFile, 'utf8').split('\n');
    for (let line of data) {
        const parts = line.split(',');
        if (parts[0].trim() === driverID) return parseInt(parts[5]);
    }
    return 0;
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
