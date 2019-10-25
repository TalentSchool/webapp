export function askForNotificationPermission() {
    if (!("Notification" in window)) {
        alert("This browser does not support system notifications");
        return false;
    }
    else if (Notification.permission === "granted") {
        return true;
    }
    else if (Notification.permission !== 'denied') {
        Notification.requestPermission(function (permission) {
            if (permission == "granted") {
                return true;
            }
            else
                return false;
        });
    }
}
export function notify(text) {
    new Notification(text);
}
//# sourceMappingURL=notification.js.map