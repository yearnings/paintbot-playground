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
        this.maxStep = 20;
        this.location = createVector(0, 0);
        this.target = createVector(0, 0);
        this.onTarget = () => (this.location.toString() == this.target.toString());
        this.drawMode = 'BOTH';
        this.actions = [];
        this.delay = 50;
        this.lastActionTime = millis();
        this.setCurrentPosition(startX, startY);
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
        this.lineFromVectors(this.location, nextLocation);
        this.setCurrentPosition(nextLocation);
    }
    lineFromVectors(start, end) {
        line(start.x, start.y, end.x, end.y);
    }
    setPathLineStyle() {
        const weight = 2;
        strokeWeight(weight);
        if (this.brushIntensity > 0) {
            stroke(0, 255, 255);
        }
        else {
            stroke(255, 0, 0);
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
}
let machine;
let tool;
let canvas;
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
}
function instructions() {
    tool.penDown();
    tool.move(100, 160);
    tool.move(160, 100);
    tool.move(80, 50);
    tool.move(40, 80);
    tool.move(40, 200);
    tool.move(200, 200);
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
}
//# sourceMappingURL=build.js.map