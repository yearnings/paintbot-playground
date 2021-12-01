class Canvas {
    constructor(dimensions, x = 0, y = 0) {
        let { width, height, thickness } = dimensions;
        this.width = width;
        this.height = height;
        this.thickness = thickness || 25;
        this.x = x;
        this.y = y;
    }
}
class Machine {
    constructor(width = 500, height = 500, gridSize = 50) {
        this.tool = new Tool();
        this.gallery = [];
        this.width = width;
        this.height = height;
        this.gridSize = gridSize;
    }
    render() {
        background(0);
        this.drawBackground();
        this.drawGrid();
        this.gallery.forEach(c => {
            fill(255);
            noStroke;
            rect(c.x, c.y, c.width, c.height);
        });
    }
    run() {
        this.tool.run();
    }
    addCanvas(dimensions, x = 0, y = 0) {
        const canvas = new Canvas(dimensions, x, y);
        this.gallery.push(canvas);
        return canvas;
    }
    drawBackground() {
        fill(255, 255, 255, 20);
        stroke(255, 50);
        strokeWeight(1);
        rect(0, 0, this.width, this.height);
    }
    drawGrid() {
        noFill();
        stroke(255, 20);
        strokeWeight(1);
        let rowCursorPos = 0;
        let colCursorPos = 0;
        const _drawCell = (x, y) => {
            const boundedWidth = x + this.gridSize < this.width ? this.gridSize : this.width - rowCursorPos;
            const boundedHeight = y + this.gridSize < this.height ? this.gridSize : this.height - colCursorPos;
            rect(x, y, boundedWidth, boundedHeight);
        };
        const _drawRow = () => {
            _drawCell(rowCursorPos, colCursorPos);
            rowCursorPos += this.gridSize;
            if (rowCursorPos >= this.width) {
                rowCursorPos = 0;
                colCursorPos += this.gridSize;
            }
        };
        while (colCursorPos < this.height) {
            _drawRow();
        }
    }
}
class Tool {
    constructor(startX = 0, startY = 0, brush) {
        this.brushIntensity = 0;
        this.brush = {
            shape: 'ROUND',
            minWidth: 1,
            maxWidth: 10,
        };
        this.palette = [
            "#D0231C",
            "#FD6D60",
            "#86BA8D",
            "#F7D48D",
            "#1A877C"
        ];
        this.maxStep = 20;
        this.scale = 1;
        this.location = createVector(0, 0);
        this.target = createVector(0, 0);
        this.getLocation = () => (this.location.copy());
        this.onTarget = () => (this.location.toString() == this.target.toString());
        this.drawMode = 'BOTH';
        this.actions = [];
        this.delay = 50;
        this.lastActionTime = millis();
        this.setCurrentPosition(startX, startY);
        const testColor = color("#00ff00");
        this.selectNearestColor(testColor);
        const testColor2 = color("#ff00ff");
        this.selectNearestColor(testColor2);
    }
    set stepSize(mm) {
        this.maxStep = mm;
    }
    setCurrentPosition(x, y) {
        if (typeof x !== 'number') {
            this.location = x;
        }
        else {
            this.location = createVector(x, y);
        }
    }
    setTargetPosition(x, y) {
        if (typeof x !== 'number') {
            this.location = x;
        }
        else {
            this.target = createVector(x, y);
        }
    }
    set mode(mode) {
        this.drawMode = mode;
    }
    set speed(ms) { this.delay = ms; }
    penUp() {
        this.queue(() => {
            this.brushIntensity = 0;
        });
    }
    penDown(pressure = 1) {
        if (pressure < 0)
            this.penUp();
        if (pressure > 1) {
            console.warn(`Invalid pressure ${pressure}, setting to 1 (maximum)`);
            pressure = 1;
        }
        this.queue(() => {
            this.brushIntensity = pressure;
        });
    }
    changeBrush(brushParams) {
        this.queue(() => {
            this.brush = {
                ...this.brush,
                ...brushParams
            };
        });
    }
    move(x, y) {
        this.queue(() => {
            this.setTargetPosition(x, y);
        });
    }
    moveRelative(xOffset, yOffset) {
        this.queue(() => {
            let futureLocation = this.getLocation();
            this.setTargetPosition(futureLocation.x + xOffset, futureLocation.y + yOffset);
        });
    }
    up(mm) {
        this.moveRelative(this.location.x, this.location.y - mm);
    }
    down(mm) {
        this.moveRelative(this.location.x, this.location.y + mm);
    }
    left(mm) {
        this.moveRelative(this.location.x - mm, this.location.y);
    }
    right(mm) {
        this.moveRelative(this.location.x + mm, this.location.y);
    }
    toCanvas(c) {
        this.move(c.x, c.y);
    }
    drawTowards() {
        const maxMoveAmt = this.maxStep;
        let untraveled = this.target.copy().sub(this.location);
        let forwardStep = untraveled.copy().normalize().mult(this.maxStep);
        let nextLocation;
        if (untraveled.mag() < forwardStep.mag()) {
            nextLocation = this.target.copy();
        }
        else {
            nextLocation = this.location.copy().add(forwardStep);
        }
        this.setPathLineStyle();
        this.scaledLineFromVectors(this.location, nextLocation);
        this.setCurrentPosition(nextLocation);
    }
    scaledLineFromVectors(start, end) {
        scale(this.scale);
        line(start.x, start.y, end.x, end.y);
    }
    setPathLineStyle() {
        if (this.brushIntensity > 0) {
            strokeWeight(4);
            stroke(0, 255, 255, 100);
        }
        else {
            strokeWeight(2);
            stroke(255, 0, 0, 100);
        }
    }
    run() {
        const now = millis();
        const hasBeenLongEnough = now - this.lastActionTime >= this.delay;
        const hasActions = this.actions.length > 0;
        if (this.onTarget() && !hasActions || !hasBeenLongEnough)
            return;
        this.lastActionTime = now;
        if (!this.onTarget()) {
            this.drawTowards();
            return;
        }
        const nextAction = this.actions.shift();
        console.log('Next action:', nextAction);
        nextAction();
    }
    queue(arrowFn) {
        this.actions.push(arrowFn);
    }
    reset() {
        this.actions = [];
        this.setCurrentPosition(0, 0);
        this.setTargetPosition(0, 0);
    }
    selectNearestColor(color) {
        const deltaColor = (a, b) => {
            const deltaChannel = (chFn) => Math.abs(chFn(a) - chFn(b));
            return [
                deltaChannel(red),
                deltaChannel(green),
                deltaChannel(blue)
            ];
        };
        const average = (arr) => (arr.reduce((a, b) => a + b)) / arr.length;
        const deltaColors = this.palette.map(paletteColor => deltaColor(paletteColor, color));
        const averages = deltaColors.map(average);
        const lowestDelta = Math.min(...averages);
        const targetIndex = averages.indexOf(lowestDelta);
        const nearest = this.palette[targetIndex];
        const lowestNumber = (x) => Math.min(...x);
        const lowestSingleDeltas = deltaColors.map(lowestNumber);
        const lowestSingleDelta = lowestNumber(lowestSingleDeltas);
        const otherNearest = this.palette[lowestSingleDeltas.indexOf(lowestSingleDelta)];
        console.log('Comparison color:');
        console.log(`%c ----`, `background: ${color}; color:${color}`);
        console.log('Rankings');
        this.palette.forEach((clr, ind) => {
            const thisDelta = averages[ind];
            console.log(`%c ----`, `background: ${clr}; color:${clr}`, deltaColors[ind].map(Math.round), "=> avg:", Math.round(averages[ind]), " lowest:", lowestSingleDeltas[ind]);
        });
        console.log('Winners:');
        console.log(`%c ----`, `background: ${nearest}; color:${nearest}`, 'nearest');
        console.log(`%c ----`, `background: ${otherNearest}; color:${otherNearest}`, 'othernearest lol');
        return nearest;
    }
}
let machine;
let tool;
let canvas;
let img;
function preload() {
    img = loadImage('img/salsa_120.jpg');
}
function setup() {
    createCanvas(windowWidth, windowHeight);
    rectMode("corner").noFill().frameRate(30);
    machine = new Machine(1980, 1980, 100);
    tool = machine.tool;
    canvas = machine.addCanvas({
        width: 1220,
        height: 1220
    }, 200, 200);
    addPadding();
    scaleToWindow();
    machine.render();
    instructions();
    image(img, 50, 50);
}
function instructions() {
    tool.penUp();
    tool.penDown();
    tool.right(500);
    tool.down(100);
    tool.toCanvas(canvas);
}
function draw() {
    addPadding();
    machine.run();
}
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    scaleToWindow();
    machine.render();
    tool.reset();
    instructions();
}
function addPadding() {
    translate(50, 50);
}
function invertY() {
    translate(0, height);
    scale(1, -1);
}
function scaleToWindow() {
    const minScaleX = (width - 100) / machine.width;
    const minScaleY = (height - 100) / machine.height;
    const xTooBig = minScaleX < 1;
    const yTooBig = minScaleY < 1;
    let useScale;
    if (xTooBig || yTooBig) {
        useScale = Math.min(minScaleX, minScaleX);
    }
    else {
        useScale = Math.max(minScaleY, minScaleX);
    }
    scale(useScale, useScale);
    tool.scale = useScale;
}
//# sourceMappingURL=build.js.map