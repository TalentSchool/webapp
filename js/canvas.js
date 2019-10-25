// canvas.js für Dreiecksbeziehungen
// by Linus Schöb

// Funktionen für die Grafische Darstellung der Aufgabe
// und der low bis midlevel Berrechnung von 2D Zeug

const CANVAS = {
    canvasElem: null,
    width: window.innerWidth,
    height: window.innerHeight,
    origin: {x: 0, y: 0},
    axisDirections: {x: 1, y: 1},
    scale: {x: 1, y: 1},
    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    },
    makeCoordinatesystem(offset={x: 10, y: 10}) {
        ctx.strokeStyle = "black";
        // configure the HTML5 Canvas as cooridnatesystem
        // origin in the bottom left
        ctx.translate(offset.x, this.height-offset.y);
        this.origin = {x: offset.x, y: this.height-offset.y};
        // positive y is upwards
        ctx.scale(1, -1);
        this.axisDirections = {x: 1, y: -1};
        // draw axis
        ctx.beginPath();
        ctx.moveTo(0, -offset.y);
        ctx.lineTo(0, this.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-offset.x, 0);
        ctx.lineTo(this.width, 0);
        ctx.stroke();
    },
    modScale(x, y=x) {
        ctx.scale(x, y);
        this.scale.x *= x;
        this.scale.y *= y;
    },
    init() {
        this.canvasElem = document.getElementById("canvas");
        ctx = this.canvasElem.getContext("2d");
        this.ctx = ctx;
        this.canvasElem.width  = this.width;
        this.canvasElem.height = this.height;
        ctx.imageSmoothingEnabled = false;
        coords = document.getElementById("coordinates");
        CANVAS.canvasElem.addEventListener('mousemove', displayCoordinates)
    }
};
var ctx;


// === CLASSES ===

// Polygon
class Polygon {
    constructor(points) {
        this.points = points.map(p => new Vector(p));
    }

    draw() {
        ctx.beginPath();
        ctx.moveTo(this.points[0].x, this.points[0].y);
        for (const point of this.points) {
            ctx.lineTo(point.x, point.y);
        }
        ctx.closePath();
        ctx.fill();
        return this;
    }
    move(dx, dy) {
        let newPoints = [];
        for (const p of this.points) {
            newPoints.push(new Vector(
                p.x + dx,
                p.y + dy
            ));
        }
        this.points = newPoints;
        return this;
    }
    rotate(a, center) {
        this.points = this.points.map(p => p.rotate(a, center));
        return this;
    }
    mirror() {
        this.points = this.points.map(p => {p.x *= -1; return p;});
        return this;
    }
    outerRect() {
        let left   = Math.min(...this.points.map(p => p.x));
        let right  = Math.max(...this.points.map(p => p.x));
        let top    = Math.min(...this.points.map(p => p.y));
        let bottom = Math.max(...this.points.map(p => p.y));
        return new Rect(left, top, right-left, bottom-top);
    }
    collide(otherPoly) {
        // https://www.youtube.com/watch?v=_cK66fBVReE
        if (!this.outerRect().collide(otherPoly.outerRect())) {return false;}
        let vectors = this.edges().concat(otherPoly.edges());
        vectors = vectors.map(v => new Vector(-v.y, v.x));
        let colliding = true;
        for (const v of vectors) {
            let scalarsPoly1 = this.points.map(p => v.scalar(p));
            let scalarsPoly2 = otherPoly.points.map(p => v.scalar(p));
            let overlapping = !(
                Math.min(...scalarsPoly1) > Math.max(...scalarsPoly2) ||
                Math.min(...scalarsPoly2) > Math.max(...scalarsPoly1)
            );
            if (!overlapping) {
                colliding = false;
                break;
            }
        }
        return colliding;
    }
    collideWithoutEdges(otherPoly) {
        // gleich wie collide nur, dass sich die Kanten berühren dürfen
        // wenn sich die outerRects nicht überschneiden, überschneiden sie sich auf keinen Fall
        if (!this.outerRect().collide(otherPoly.outerRect())) {return false;}
        // alle Kanten bekommen
        let vectors = this.edges().concat(otherPoly.edges());
        // alle Kanten-Vektoren um 90° drehen
        vectors = vectors.map(v => new Vector(-v.y, v.x));
        let colliding = true;
        for (const v of vectors) {
            // Skalarprodukte (Skp) von allen Punkten auf allen Vectoren berrechnen
            let scalarsPoly1 = this.points.map(p => v.scalar(p));
            let scalarsPoly2 = otherPoly.points.map(p => v.scalar(p));
            // die Polygone überlappen sich, 
            // wenn das kleinsten Skp des einen Polygons größer ist als das größte Skp des anderen
            let overlapping = !(
                Math.min(...scalarsPoly1) >= Math.max(...scalarsPoly2) ||
                Math.min(...scalarsPoly2) >= Math.max(...scalarsPoly1)
            );
            if (!overlapping) {
                colliding = false;
                break;
            }
        }
        return colliding;
    }
    edges() {
        return this.points.map((p, i, arr) => vectorFromPoints(p, arr[(i+1)%arr.length]));
    }
    getLines() {
        let lines = [];
        for (let i = 0; i < this.points.length; i++) {
            lines.push(new Line(this.points[i], this.points[(i+1) % this.points.length]));
        }
        return lines;
    }
    getInnerAngles() {
        let angles = this.edges().map(e => e.getAngle()); // angles of edges
        let differences = angles.map((a, i, l) => getDifferenceBetweenAngles(a, l[(i+1)%l.length])); // differences between these angles
        let innerAngles = differences.map(d => d%Math.PI).map(d => d<0 ? d+Math.PI : d); // put between 0 and PI
        innerAngles.push(...innerAngles.splice(0, innerAngles.length-1)); // rotate so that indeces of angles and points match
        return innerAngles;
    }
}

// random Polygons
function randomPolygon(minPs, maxPs, size) {
    let points = [];
    let pointAmount = randomIntBetween(minPs, maxPs);
    for (let i = 0; i < pointAmount; i++) {
        points.push({
            x: randomIntBetween(0, size),
            y: randomIntBetween(0, size)
        });
    }
    poly = new Polygon(points);
    return poly;
}
function randomConvexPolygon(minPs, maxPs, size) {
    let points = [];
    let pointAmount = randomIntBetween(minPs, maxPs);
    for (let i = 0; i < pointAmount; i++) {
        points.push(randomVector(-(size/2), (size/2)));
    }
    points = points.sort((a, b) => {
        return a.getAngle() - b.getAngle();
    });
    let vectors = [];
    for (let i = 0; i < points.length; i++) {
        vectors.push(vectorFromPoints(points[i], points[(i+1).loop(0, points.length-1)]));
    }
    vectors = vectors.sort((a, b) => {
        return a.getAngle() - b.getAngle();
    });
    newPoints = [{x: 0, y: 0}];
    for (const v of vectors) {
        newPoints.push({
            x: newPoints[newPoints.length-1].x + v.x,
            y: newPoints[newPoints.length-1].y + v.y
        });
    }
    poly = new Polygon(newPoints)
    return poly;
}

// Vector
class Vector {
    constructor(x, y) {
        if (x!==undefined && y!==undefined) { // got two coordinates
            this.x = x;
            this.y = y;
        } else { // got {x: 0, y: 0}
            this.x = x.x;
            this.y = x.y;
        }
    }

    add(oVec) {
        this.x += oVec.x;
        this.y += oVec.y;
        return this;
    }

    getAngle() {
        return Math.atan2(this.y, this.x);
    }
    distanceTo(line) {
        // https://stackoverflow.com/questions/849211/shortest-distance-between-a-point-and-a-line-segment
        if(line.getLength() === 0) {return distanceBetween(this, line.p1);}
        let t = ((this.x-line.p1.x)*(line.p2.x-line.p1.x)+(this.y-line.p1.y)*(line.p2.y-line.p1.y))/line.getLength().sqr();
        t = Math.max(0, Math.min(1, t));
        let distance = distanceBetween(
            this, {
                x: line.p1.x + t * (line.p2.x -line.p1.x),
                y: line.p1.y + t * (line.p2.y -line.p1.y)
            }
        );
        return distance;
    }
    scalar(p) {
        return this.x * p.x + this.y * p.y;
    }
    toString() {
        return this.x + "-" + this.y;
    }
    isEqual(otherVector) {
        return (this.x === otherVector.x && this.y === otherVector.y);
    }
    isOnLine(line) {
        let f = line.getFunction();
        //     f(x)   =   m     x      + t
        let isOnFunction = Math.round(this.y, 8) === Math.round((f.m * this.x + f.t), 8);
        let isInRange = this.x >= f.minX && this.x <= f.maxX;
        return isOnFunction && isInRange;
    }
    rotate(a, center={x:0, y:0}) {
        // rotate this vector by angle a counterclockwise around center
        a*=-1; // negate a
        const sin = Math.sin(a);
        const cos = Math.cos(a);
        const { x, y } = this;
        this.x = Math.round( (cos * (x - center.x)) + (sin * (y - center.y)) + center.x , 8 );
        this.y = Math.round( (cos * (y - center.y)) - (sin * (x - center.x)) + center.y , 8 );
        return this;
    }
    draw(startPoint={x: 0, y: 0}, width=10, color="#CC0000") {
        // https://stackoverflow.com/a/26080467

        let angle = this.getAngle();
        
        //style
        let headlen = width*2;
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = width;

        //starting path of the arrow from the start square to the end square and drawing the stroke
        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(this.x+startPoint.x, this.y+startPoint.y);
        ctx.stroke();

        //starting a new path from the head of the arrow to one of the sides of the point
        ctx.beginPath();
        ctx.moveTo(this.x+startPoint.x, this.y+startPoint.y);
        ctx.lineTo(this.x+startPoint.x-headlen*Math.cos(angle-Math.PI/7),this.y+startPoint.y-headlen*Math.sin(angle-Math.PI/7));

        //path from the side point of the arrow, to the other side point
        ctx.lineTo(this.x+startPoint.x-headlen*Math.cos(angle+Math.PI/7),this.y+startPoint.y-headlen*Math.sin(angle+Math.PI/7));

        //path from the side point back to the tip of the arrow, and then again to the opposite side point
        ctx.lineTo(this.x+startPoint.x, this.y+startPoint.y);
        ctx.lineTo(this.x+startPoint.x-headlen*Math.cos(angle-Math.PI/7),this.y+startPoint.y-headlen*Math.sin(angle-Math.PI/7));

        //draws the paths created above
        ctx.stroke();
        ctx.fill();
    }
}

// alternative constructors
function vectorFromPoints(p1, p2) {
    return new Vector(
        p2.x - p1.x,
        p2.y - p1.y
    );
}
function vectorFromString(string) {
    let coordinates = string.split("-");
    return new Vector(Number(coordinates[0]), Number(coordinates[1]));
}
function vectorFromAngle(angle, length=1) {
    return new Vector(length*Math.cos(angle), length * Math.sin(angle));
}

// random Vector
function randomVector(min=-1, max=1) {
    return new Vector(
        randomBetween(min, max),
        randomBetween(min, max)
    );
}

// general vector functions
function distanceBetween(p1, p2) {
    return Math.sqrt((p2.x-p1.x).sqr() + (p2.y-p1.y).sqr());
}
function getDifferenceBetweenAngles(a, b) {
    // get the difference angle to turn from the first angle(vector) to the second
    // regarding to take the shortest way
    let dif = b - a;
    if (dif < -Math.PI) {dif+=2*Math.PI} // if too small go other way around
    else if (dif > Math.PI) {dif-=2*Math.PI} // if too big go other way around
    return dif;
}

// Line
class Line {
    constructor(p1, p2) {
        this.p1 = new Vector(p1);
        this.p2 = new Vector(p2);
        this.points = [this.p1, this.p2];
    }

    draw() {
        ctx.beginPath();
        ctx.moveTo(this.p1.x, this.p1.y);
        ctx.lineTo(this.p2.x, this.p2.y);
        ctx.stroke();
    }
    toPolygon() {
        return new Polygon([
            this.p1,
            this.p2
        ]);
    }
    outerRect() {
        let left   = Math.min(...this.points.map(p => p.x));
        let right  = Math.max(...this.points.map(p => p.x));
        let top    = Math.min(...this.points.map(p => p.y));
        let bottom = Math.max(...this.points.map(p => p.y));
        return new Rect(left, top, right-left, bottom-top);
    }
    getLength() {
        return distanceBetween(this.p1, this.p2);
    }
    getFunction() {
        return mathFunctionFromPoints(this.p1, this.p2);
    }
    sortClosestPointsOf(points) {
        points = points.sort((a, b) => {
            return a.distanceTo(this) - b.distanceTo(this);
        });
        return points;
    }
    collide(otherPoly) {
        if (!this.outerRect().collide(otherPoly.outerRect())) {return false;}
        let lineVector = vectorFromPoints(this.p1, this.p2);
        let edges = otherPoly.edges()
            .concat([lineVector, new Vector(-lineVector.y, lineVector.x)]);
        let colliding = true;
        for (const e of edges) {
            let v = new Vector(-e.y, e.x);
            // Skalarprodukte (Skp) von allen Punkten auf allen Vektoren berrechnen
            let scalarsLine = this.points.map(p => v.scalar(p));
            let scalarsPoly = otherPoly.points.map(p => v.scalar(p));
            // die Polygone überlappen sich, 
            // wenn das kleinsten Skp des einen Polygons größer ist als das größte Skp des anderen
            let overlapping = !(
                Math.min(...scalarsLine) > Math.max(...scalarsPoly) ||
                Math.min(...scalarsPoly) > Math.max(...scalarsLine)
            );
            if (!overlapping) {
                colliding = false;
                break;
            }
        }
        return colliding;
    }
    collideWithoutEdges(otherPoly) {
        if (!this.outerRect().collide(otherPoly.outerRect())) {return false;}
        let lineVector = vectorFromPoints(this.p1, this.p2);
        let edges = otherPoly.edges()
            .concat([lineVector, new Vector(-lineVector.y, lineVector.x)]);
        let colliding = true;
        for (const e of edges) {
            let v = new Vector(-e.y, e.x);
            // Skalarprodukte (Skp) von allen Punkten auf allen Vektoren berrechnen
            let scalarsLine = this.points.map(p => v.scalar(p));
            let scalarsPoly = otherPoly.points.map(p => v.scalar(p));
            // die Polygone überlappen sich, 
            // wenn das kleinsten Skp des einen Polygons größer ist als das größte Skp des anderen
            let overlapping = !(
                Math.min(...scalarsLine) >= Math.max(...scalarsPoly) ||
                Math.min(...scalarsPoly) >= Math.max(...scalarsLine)
            );
            if (!overlapping) {
                colliding = false;
                break;
            }
        }
        return colliding;
    }
}

// MathFunction
// only straights in this format: y = mx + t
class MathFunction {
    constructor(m, t) {
        this.m = m;
        if (!isFinite(m)) {
            // if function is vertical, t represents the x of the graph
            this.x = t;
        } else {
            this.t = t;
        }
    }

    getPointFromX(x) {
        if (!isFinite(this.m)) {
            return (x === this.x);
        }
        let y = this.m * x + this.t;
        return new Vector(x, y);
    }
    getPointFromY(y) {
        if (this.m === 0) {
            return (y === this.t);
            // true = all points with that y are on this
            // false = no point with that y are on this
        } else if (!isFinite(this.m)) {
            return new Vector(this.x, y);
        }
        // y = mx + t -> x = (y-t) / m
        let x = (y - this.t) / this.m;
        return new Vector(x, y);
    }
    containsPoint(p) {
        return (p.y === this.m * p.x + this.t)
    }
    toString() {
        return `f(x)=${this.m}x+${this.t}`;
    }
}

// alternative constructors
function mathFunctionFromPoints(p1, p2) {
    if (p1.x === p2.x) {
        // horizontal ; m = Infinity
        return new MathFunction(Infinity, p1.x);
    } else if (p1.y === p2.y) {
        // vertical ; m = 0
        return new MathFunction(0, p1.y);
    }
    // m = Δy / Δx
    let m = (p1.y - p2.y) / (p1.x - p2.x);
    // y = mx + t -> t = y - mx
    let t = p1.y - (m * p1.x);
    return new MathFunction(m, t);
}


// Rect
class Rect extends Polygon {
    constructor(x, y, w, h) {
        super([{x: x, y: y}, {x: x, y: y+h}, {x: x+w, y: y+h}, {x: x+w, y: y}]);
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }

    draw() {
        ctx.fillRect(this.x, this.y, this.w, this.h);
    }
    stroke() {
        ctx.strokeRect(this.x, this.y, this.w, this.h);
    }
    collide(otherRect) {
        if (otherRect instanceof Rect) {
            return !(
                this.x > otherRect.x + otherRect.w ||
                otherRect.x > this.x + this.w      ||
                this.y > otherRect.y + otherRect.h ||
                otherRect.y > this.y + this.h
            );
        } else {return super.collide(otherRect);}
    }
}

// Circle
class Circle {
    constructor(x, y, r=10) {
        this.x = x;
        this.y = y;
        this.r = r;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, 2*Math.PI);
        ctx.closePath();
        ctx.fill();
    }
    stroke() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, 2*Math.PI);
        ctx.stroke();
    }
}

// Path
class Path {
    constructor(points) {
        this.points = points.map(p => new Vector(p));
    }

    draw() {
        for (let i = 0; i < this.points.length-1; i++) {
            new Line(this.points[i], this.points[i+1]).draw();
        }
    }
    getLength() {
        let length = 0;
        for (let i = 0; i < this.points.length-1; i++) {
            length += Line(points[i], points[i+1]).getLength();
        }
        return length;
    }
}


// === Debug Helpers ===
// Show Cursor Coordinates
var coords;
function displayCoordinates(e) {
    let rect = CANVAS.canvasElem.getBoundingClientRect();
    let pos = {
        x: Math.round((e.clientX - rect.left - CANVAS.origin.x) * CANVAS.axisDirections.x / CANVAS.scale.x),
        y: Math.round((e.clientY - rect.top  - CANVAS.origin.y) * CANVAS.axisDirections.y / CANVAS.scale.y)
    };
    coords.innerHTML = `{x: ${pos.x}, y: ${pos.y}}`;
};