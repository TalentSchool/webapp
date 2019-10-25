import * as API from "./api.js";
import { askForNotificationPermission, notify } from "./notification.js";

const routeInput = <HTMLInputElement>document.getElementById("route");
const stationInput = <HTMLInputElement>document.getElementById("station");
const stationsHitList = <HTMLUListElement>document.getElementById("stationHits");
const routesHitList = <HTMLUListElement>document.getElementById("routeHits");
const runBtn = document.getElementById("runBtn");
const output = document.getElementById("output");
const audio = new Audio('beyond-doubt.mp3');

runBtn.onclick = run;
routeInput.onkeyup = updateRouteSearch;
stationInput.onkeyup = updateStationSearch;

var STATIONS: API.Station[];
var ROUTES: API.Route[];
var SECTIONS: API.Section[];

async function init() {
	STATIONS = await API.getAllStations();
	ROUTES = await API.getAllRoutes();
	SECTIONS = await API.getAllSections();

	routeInput.value = localStorage.route;
	stationInput.value = localStorage.station;

	setInterval(async () => {
		console.log("prüfen...");
		let time = await getNextDeparture();
		if (time < 5*60) {
			if (askForNotificationPermission()) {
				notify(`Dein Zug kommt in ${formatTime(time)} Minuten`);
			}
			fetch("/playsound.php").then(res => res.text()).then(o => console.log(o));
			audio.play();
		}
	}, 3000);
}
init();

async function run() {
	localStorage.route = routeInput.value;
	localStorage.station = stationInput.value;

	let nD = await getNextDeparture();
	output.innerHTML = formatTime(nD) + " Minuten";
}

async function getNextDeparture() {
	let routes = await API.getAllRoutes();
	let route = routes.find(r => r.title == routeInput.value);
	let trainsOnRoute = await API.getAllTrainsOnRoute(route.id);

	let destinationStation = STATIONS.find(s => s.title == stationInput.value);
	let destinationStationIndex = route.stations.findIndex(s => s.id==destinationStation.id);
	let destinationStationDepartureOffset = route.departureOffsets[destinationStationIndex];
	
	// nächsten Zug finden
	let routeLength = getTotalRouteLengthToStation(route);
	let trainsWithTP = trainsOnRoute.map(t => ({...t, TP: getTotalPos(t)}));
	let copiedTrains = trainsOnRoute.map(t => ({...t, TP: t.TP - routeLength}))
	let trains = [...trainsWithTP, ...copiedTrains];
	trains = trains.filter(t => t.TP < getTotalRouteLengthToStation(route, destinationStationIndex));
	let train = trains.reduce((a, b) => a.TP > a.TP ? a : b);
	
	let sec = train.section;
	let remainingSectionDistance = train.v > 0 ? sec.length - train.pos : train.pos;
	let remainingSectionTime = (remainingSectionDistance / sec.length) * sec.time;
	
	let nextStation = train.v > 0 ? sec.b : sec.a;
	let nextStationIndex = route.stations.findIndex(s => s.id==nextStation.id);
	let nextStationDepartureOffset = route.departureOffsets[nextStationIndex];

	let departureDifference = destinationStationDepartureOffset - nextStationDepartureOffset;
	let totalTimeLeft = departureDifference - remainingSectionTime;

	return totalTimeLeft;
}

function getTotalPos(train: API.Train) {
	let sec = train.section;
	let prevStation = train.v > 0 ? sec.b : sec.a;
	let prevStationIndex = train.route.stations.findIndex(s => s.id==prevStation.id);
	let prevDistance = getTotalRouteLengthToStation(train.route, prevStationIndex);
	let remainingSectionDistance = train.v > 0 ? sec.length - train.pos : train.pos;
	let totalPos = prevDistance + remainingSectionDistance;
	return totalPos;
}

function getTotalRouteLengthToStation(route: API.Route, stationIndex: number=route.stations.length) {
	let stations = route.stations.slice(0, stationIndex+1);
	let sections: API.Section[] = [];
	for (let i = 0 ; i < stations.length-1; i++) {
		let a = stations[i];
		let b = stations[i+1];
		sections.push(getSectionWithStations(a, b));
	}
	let length = sections.reduce((d, s) => d+s.length, 0);
	return length;
}

function getSectionWithStations(a: API.Station, b: API.Station) {
	let section = SECTIONS.find(s => (
		(a.id === s.a.id && b.id === s.b.id) ||
		a.id === s.b.id && b.id === s.a.id
	));
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
function setStation(title: string) {
	stationInput.value = title;
	stationsHitList.innerHTML = "";
}
function searchStations(query: string) {
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
function setRoute(title: string) {
	routeInput.value = title;
	routesHitList.innerHTML = "";
}
function searchRoutes(query: string) {
	let regex = new RegExp(query.split("").join(".*"), "i");
	let hits = ROUTES.filter(r => r.title.match(regex));
	return hits;
}

function formatTime(s: number) {
	s = Math.round(s);
	return `${Math.floor(s/60)}:${D2(s % 60)}`;
}
function D2(n: number) {
	return ("0"+n).slice(-2);
}