var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const BASEURL = "https://api.bahnify.marvnet.de/";
export function getObject(endpoint) {
    return __awaiter(this, void 0, void 0, function* () {
        let url = BASEURL + endpoint;
        let res = yield fetch(url);
        let obj = yield res.json();
        if (res.status !== 200) {
            console.error(obj.message);
        }
        return obj.response;
    });
}
export function getTrain(id) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield getObject(`trains/${id}`);
    });
}
export function getAllTrains() {
    return __awaiter(this, void 0, void 0, function* () {
        return yield getObject(`trains/all`);
    });
}
export function getSection(id) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield getObject(`sections/${id}`);
    });
}
export function getAllSections() {
    return __awaiter(this, void 0, void 0, function* () {
        return yield getObject(`sections/all`);
    });
}
export function getRoute(id) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield getObject(`routes/${id}`);
    });
}
export function getAllRoutes() {
    return __awaiter(this, void 0, void 0, function* () {
        return yield getObject(`routes/all`);
    });
}
export function getStation(id) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield getObject(`stations/${id}`);
    });
}
export function getAllStations() {
    return __awaiter(this, void 0, void 0, function* () {
        return yield getObject(`stations/all`);
    });
}
export function getAllTrainsOnRoute(routeID) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield getObject(`trains/route/${routeID}`);
    });
}
//# sourceMappingURL=api.js.map