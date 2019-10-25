export interface Station {
	id: number,
	pos?: {x: number, y: number},
	title: string
}
export interface Train {
	id: number,
	pos: number,
	v: number,
	section: Section,
	route: Route,
	TP?: number
}
export interface Section {
	id: number,
	a: Station,
	b: Station,
	time: number,
	length: number
}
export interface Route {
	id: number,
	stations: Station[],
	departureOffsets: number[],
	startTimes: number[],
	title: string
}

interface APIAnswer {
	response: any,
	code?: string,
	message?: string
}

const BASEURL = "https://api.bahnify.marvnet.de/";
export async function getObject(endpoint: string) {
	let url = BASEURL + endpoint;
	let res = await fetch(url);
	let obj = <APIAnswer>await res.json();
	if (res.status !== 200) {console.error(obj.message);}
	return obj.response;
}

export async function getTrain(id: number): Promise<Train> {
	return await getObject(`trains/${id}`);
}
export async function getAllTrains(): Promise<Train[]> {
	return await getObject(`trains/all`);
}

export async function getSection(id: number): Promise<Section> {
	return await getObject(`sections/${id}`);
}
export async function getAllSections(): Promise<Section[]> {
	return await getObject(`sections/all`);
}

export async function getRoute(id: number): Promise<Route> {
	return await getObject(`routes/${id}`);
}
export async function getAllRoutes(): Promise<Route[]> {
	return await getObject(`routes/all`);
}

export async function getStation(id: number): Promise<Station> {
	return await getObject(`stations/${id}`);
}
export async function getAllStations(): Promise<Station[]> {
	return await getObject(`stations/all`);
}

export async function getAllTrainsOnRoute(routeID: number): Promise<Train[]> {
	return await getObject(`trains/route/${routeID}`);
}