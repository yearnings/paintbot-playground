class Canvas {
    constructor(width, height, thickness) {
        this.width = width;
        this.height = height;
        this.thickness = thickness || 25;
    }
}
class Machine {
    constructor(width = 500, height = 500, gridSize = 50) {
        this.tool = new Tool();
        this.width = width;
        this.height = height;
        this.gridSize = gridSize;
    }
    show() {
        background(0);
        this.drawBackground();
        this.drawGrid();
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
                console.log('next');
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
        this.maxStep = 10;
        this.isMoving = false;
        this.drawMode = 'BOTH';
        this.actions = [];
        this.delay = 50;
        this.lastActionTime = millis();
        this.currentX = startX;
        this.currentY = startY;
        console.log("I'm a tool! I mean.. you too, but mostly me.");
    }
    set stepSize(mm) {
        this.maxStep = mm;
    }
    setCurrentPosition(x, y) { this.currentX = x; this.currentY = y; }
    setTargetPosition(x, y) { this.targetX = x; this.targetY = y; }
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
            console.warn(`Easy, psycho. ${pressure} is too much. 1 is enough.`);
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
            this.isMoving = true;
        });
    }
    drawTowards() {
        const maxMoveAmt = this.maxStep;
        if ((this.currentX != this.targetX) || (this.currentY != this.targetY)) {
            this.isMoving = true;
            let nextX, nextY;
            if (this.currentX < this.targetX) {
                nextX = Math.min((this.currentX + maxMoveAmt), this.targetX);
            }
            else {
                nextX = Math.max((this.currentX - maxMoveAmt), this.targetX);
            }
            if (this.currentY < this.targetY) {
                nextY = Math.min((this.currentY + maxMoveAmt), this.targetY);
            }
            else {
                nextY = Math.max((this.currentY - maxMoveAmt), this.targetY);
            }
            this.setPathLineStyle();
            line(this.currentX, this.currentY, nextX, nextY);
            this.setCurrentPosition(nextX, nextY);
        }
        else {
            this.isMoving = false;
        }
    }
    setPathLineStyle() {
        const weight = 2;
        strokeWeight(weight);
        drawingContext.setLineDash([weight * 2, weight * 3]);
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
        if (!hasActions || !hasBeenLongEnough)
            return;
        this.lastActionTime = now;
        if (this.isMoving) {
            this.drawTowards();
            return;
        }
        const nextAction = this.actions.shift();
        nextAction();
    }
    queue(arrowFn) {
        this.actions.push(arrowFn);
    }
    reset() {
        this.actions = [];
        this.currentX = 0;
        this.currentY = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.isMoving = false;
    }
}
let machine;
let tool;
function setup() {
    let canvas = createCanvas(windowWidth, windowHeight);
    rectMode("corner").noFill().frameRate(30);
    machine = new Machine(1980, 1980, 100);
    tool = machine.tool;
    addPadding();
    scaleToWindow();
    machine.show();
    instructions();
}
function instructions() {
    tool.move(50, 50);
    tool.penDown();
    tool.move(50, 100);
    tool.penUp();
    tool.move(100, 100);
    tool.move(100, 200);
    tool.penDown();
    tool.move(200, 200);
}
function draw() {
    addPadding();
    tool.run();
}
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    scaleToWindow();
    machine.show();
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