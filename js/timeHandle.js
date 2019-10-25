// -- timeHandle --
// Deutsche Formatierung von Zeit
export function now() { return new Date(); }
export function datum(date = now()) {
    var d = date.getDate();
    var m = date.getMonth();
    if (d < 10) {
        d = "0" + d;
    }
    else {
        d = d;
    }
    if (m < 9) {
        m = "0" + (m + 1);
    }
    else {
        m = m + 1;
    }
    var dT = d + "." + m + "." + date.getFullYear();
    return dT;
}
export function zeit(date = now()) {
    var min, h;
    if (date.getMinutes() < 10) {
        h = "0" + date.getHours();
    }
    else {
        h = date.getHours();
    }
    if (date.getMinutes() < 10) {
        min = "0" + date.getMinutes();
    }
    else {
        min = date.getMinutes();
    }
    var dT = h + ":" + min;
    return dT;
}
export function wochentag(date = now()) {
    var weekDays = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
    return weekDays[date.getDay()];
}
//# sourceMappingURL=timeHandle.js.map