var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as API from "./api.js";
import { askForNotificationPermission, notify } from "./notification.js";
const routeInput = document.getElementById("route");
const stationInput = document.getElementById("station");
const stationsHitList = document.getElementById("stationHits");
const routesHitList = document.getElementById("routeHits");
const runBtn = document.getElementById("runBtn");
const output = document.getElementById("output");
const audio = new Audio('beyond-doubt.mp3');
runBtn.onclick = run;
routeInput.onkeyup = updateRouteSearch;
stationInput.onkeyup = updateStationSearch;
var STATIONS;
var ROUTES;
var SECTIONS;
function init() {
    return __awaiter(this, void 0, void 0, function* () {
        STATIONS = yield API.getAllStations();
        ROUTES = yield API.getAllRoutes();
        SECTIONS = yield API.getAllSections();
        routeInput.value = localStorage.route;
        stationInput.value = localStorage.station;
        setInterval(() => __awaiter(this, void 0, void 0, function* () {
            console.log("prüfen...");
            let time = yield getNextDeparture();
            if (time < 5 * 60) {
                if (askForNotificationPermission()) {
                    notify(`Dein Zug kommt in ${formatTime(time)} Minuten`);
                }
                // fetch("/playsound.php").then(res => res.text()).then(o => console.log(o));
                audio.play();
            }
        }), 3000);
    });
}
init();
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        localStorage.route = routeInput.value;
        localStorage.station = stationInput.value;
        let nD = yield getNextDeparture();
        output.innerHTML = formatTime(nD) + " Minuten";
    });
}
function getNextDeparture() {
    return __awaiter(this, void 0, void 0, function* () {
        let routes = yield API.getAllRoutes();
        let route = routes.find(r => r.title == routeInput.value);
        let trainsOnRoute = yield API.getAllTrainsOnRoute(route.id);
        let destinationStation = STATIONS.find(s => s.title == stationInput.value);
        let destinationStationIndex = route.stations.findIndex(s => s.id == destinationStation.id);
        let destinationStationDepartureOffset = route.departureOffsets[destinationStationIndex];
        // nächsten Zug finden
        let routeLength = getTotalRouteLengthToStation(route);
        let trainsWithTP = trainsOnRoute.map(t => (Object.assign(Object.assign({}, t), { TP: getTotalPos(t) })));
        let copiedTrains = trainsOnRoute.map(t => (Object.assign(Object.assign({}, t), { TP: t.TP - routeLength })));
        // let trains = [...trainsWithTP, ...copiedTrains];
        let trains = trainsWithTP;
        trains = trains.filter(t => t.TP < getTotalRouteLengthToStation(route, destinationStationIndex));
        if (trains.length === 0)
            return 107;
        let train = trains.reduce((a, b) => a.TP > a.TP ? a : b);
        let sec = train.section;
        let remainingSectionDistance = train.v > 0 ? sec.length - train.pos : train.pos;
        let remainingSectionTime = (remainingSectionDistance / sec.length) * sec.time;
        // console.log(remainingSectionDistance, remainingSectionTime);
        let nextStation = train.v > 0 ? sec.b : sec.a;
        let nextStationIndex = route.stations.findIndex(s => s.id == nextStation.id);
        let nextStationDepartureOffset = route.departureOffsets[nextStationIndex];
        let departureDifference = destinationStationDepartureOffset - nextStationDepartureOffset;
        let totalTimeLeft = departureDifference + remainingSectionTime;
        return totalTimeLeft;
    });
}
function getTotalPos(train) {
    let sec = train.section;
    let prevStation = train.v > 0 ? sec.b : sec.a;
    let prevStationIndex = train.route.stations.findIndex(s => s.id == prevStation.id);
    let prevDistance = getTotalRouteLengthToStation(train.route, prevStationIndex);
    let finishedSectionDistance = train.v > 0 ? train.pos : (sec.length - train.pos);
    let totalPos = prevDistance + finishedSectionDistance;
    // console.log(prevDistance, finishedSectionDistance, totalPos);
    return totalPos;
}
function getTotalRouteLengthToStation(route, stationIndex = route.stations.length - 2) {
    let stations = route.stations.slice(0, stationIndex + 1);
    let sections = [];
    for (let i = 0; i < stations.length - 1; i++) {
        let a = stations[i];
        let b = stations[i + 1];
        sections.push(getSectionWithStations(a, b));
    }
    let length = sections.reduce((d, s) => d + s.length, 0);
    return length;
}
function getSectionWithStations(a, b) {
    let section = SECTIONS.find(s => ((a.id === s.a.id && b.id === s.b.id) ||
        a.id === s.b.id && b.id === s.a.id));
    return section;
}
// === Suche ===
function updateStationSearch() {
    let hits = searchStations(stationInput.value);
    stationsHitList.innerHTML = "";
    for (const h of hits) {
        let li = document.createElement("li");
        li.innerHTML = h.title;
        li.onclick = e => setStation(h.title);
        stationsHitList.appendChild(li);
    }
}
function setStation(title) {
    stationInput.value = title;
    stationsHitList.innerHTML = "";
}
function searchStations(query) {
    let regex = new RegExp(query.split("").join(".*"), "i");
    let hits = STATIONS.filter(s => s.title.match(regex));
    return hits;
}
function updateRouteSearch() {
    let hits = searchRoutes(routeInput.value);
    routesHitList.innerHTML = "";
    for (const h of hits) {
        let li = document.createElement("li");
        li.innerHTML = h.title;
        li.onclick = e => setRoute(h.title);
        routesHitList.appendChild(li);
    }
}
function setRoute(title) {
    routeInput.value = title;
    routesHitList.innerHTML = "";
}
function searchRoutes(query) {
    let regex = new RegExp(query.split("").join(".*"), "i");
    let hits = ROUTES.filter(r => r.title.match(regex));
    return hits;
}
function formatTime(s) {
    s = Math.round(s);
    return `${Math.floor(s / 60)}:${D2(s % 60)}`;
}
function D2(n) {
    return ("0" + n).slice(-2);
}
//# sourceMappingURL=main.js.map