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
class Graphic {
    static pixelsForImage(img) {
        img.loadPixels();
        return img.pixels;
    }
    static numArrToColorArr(pixelData, toGrayscale = false) {
        const mutablePixels = [...pixelData];
        const mutablePixelColors = [...Array(pixelData.length)].map(() => {
            const [r, g, b, a] = mutablePixels.splice(0, 4);
            const colorFromNumbers = color(r, g, b, a);
            if (toGrayscale) {
                return this.rgbToGrayscale(colorFromNumbers);
            }
            else {
                return colorFromNumbers;
            }
            ;
        });
        const pixelRows = [...Array(img.width)].map(() => {
            const rowColors = mutablePixelColors.splice(0, img.width);
            return rowColors;
        });
        return pixelRows;
    }
    static rgbToGrayscale(rgbColor) {
        let sum = 0;
        let rgba = rgbColor.toString().match(/[0-9\.]+/g).map(x => Number(x));
        sum += (rgba[0] * 0.89);
        sum += (rgba[1] * 1.77);
        sum += (rgba[2] * 0.33);
        return color(Math.ceil(sum / 3));
    }
    static imageToColorArr(img, toGrayscale = false) {
        let pixels = this.pixelsForImage(img);
        return this.numArrToColorArr(pixels, toGrayscale);
    }
    static logSwatch(color, msg) {
        console.log([`%c---`, `background: ${color}; color:${color}`], msg || '');
    }
    static logColorRow(cArr) {
        const textString = cArr.map(() => `%c.`).join('');
        const styleStrings = cArr.map(c => `background: ${c}; color:${c}; font-size: 10px; line-height:8px; font-family: monospace;`);
        console.log(textString, ...styleStrings);
    }
    static nearestColor(refColor, palette) {
        const deltaColor = (a, b) => {
            const deltaChannel = (chFn) => Math.abs(chFn(a) - chFn(b));
            return [
                deltaChannel(red),
                deltaChannel(green),
                deltaChannel(blue)
            ];
        };
        const average = (arr) => (arr.reduce((a, b) => a + b)) / arr.length;
        const deltaColors = palette.map(paletteColor => deltaColor(color(paletteColor), refColor));
        const averages = deltaColors.map(average);
        const lowestDelta = Math.min(...averages);
        const targetIndex = averages.indexOf(lowestDelta);
        const nearestByAvg = palette[targetIndex];
        const lowestNumber = (x) => Math.min(...x);
        const lowestSingleDeltas = deltaColors.map(lowestNumber);
        const lowestSingleDelta = lowestNumber(lowestSingleDeltas);
        const nearestByMin = palette[lowestSingleDeltas.indexOf(lowestSingleDelta)];
        if (nearestByMin !== nearestByAvg) {
            if (lowestSingleDelta < 10)
                return nearestByMin;
        }
        return nearestByAvg;
        return nearestByMin;
    }
    static stratify(imgColors, palette) {
        const booleanLayers = [];
        palette.forEach(pColor => {
            const BooleanLayer = imgColors.map(row => {
                return row.map(iColor => {
                    return this.nearestColor(iColor, palette) == pColor;
                });
            });
            const truePixels = BooleanLayer.flat().filter(i => i === true);
            const density = truePixels.length / BooleanLayer.length;
            booleanLayers.push({
                color: pColor,
                data: BooleanLayer,
                density
            });
        });
        const byDensity = (a, b) => {
            if (a.density < b.density)
                return -1;
            if (a.density > b.density)
                return 1;
            return 0;
        };
        return booleanLayers.sort(byDensity);
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
            color: "#000000"
        };
        this.palette = [
            "#D0231C",
            "#FD6D60",
            "#86BA8D",
            "#F7D48D",
            "#1A877C"
        ];
        this.maxStep = 10;
        this.scale = 1;
        this.location = createVector(0, 0);
        this.target = createVector(0, 0);
        this.getLocation = () => (this.location.copy());
        this.onTarget = () => (this.location.toString() == this.target.toString());
        this.drawMode = 'BOTH';
        this.actions = [];
        this.delay = 0;
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
        this.penUp();
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
        scale(this.scale);
        this.brushStrokeFromVectors(this.location, nextLocation);
        this.setPathLineStyle();
        this.lineFromVectors(this.location, nextLocation);
        this.setCurrentPosition(nextLocation);
    }
    brushStrokeFromVectors(start, end) {
        let brushHeight = this.brushIntensity * this.brush.maxWidth;
        let brushWidth = this.maxStep;
        let startX = start.x;
        let startY = start.y;
        fill(this.brush.color);
        noStroke();
        rect(startX, startY, brushWidth, brushHeight);
    }
    lineFromVectors(start, end) {
        line(start.x, start.y, end.x, end.y);
    }
    setPathLineStyle() {
        if (this.brushIntensity > 0) {
            strokeWeight(1);
            stroke(0, 255, 255, 40);
        }
        else {
            strokeWeight(2);
            stroke(255, 0, 0, 40);
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
    grayscaleDensityPixels(img, canvas) {
        const colorArr = Graphic.imageToColorArr(img, true);
        const padding = 20;
        fill(200);
        noStroke();
        rect(canvas.x + padding, canvas.y + padding, canvas.width - (padding * 2), canvas.height - (padding * 2));
        const xResolution = colorArr[0].length;
        const yResolution = colorArr.length;
        const pixelWidth = canvas.width / xResolution;
        const pixelHeight = canvas.height / yResolution;
        colorArr.forEach((row, rowIndex) => {
            row.forEach((color, cellIndex) => {
                const grayColor = Number(color.toString().split('(')[1].split(',')[0]);
                const cellDensity = map(grayColor, 0, 255, 0, 5);
                const cellTopLeftX = (rowIndex * pixelWidth) + canvas.x + padding;
                const cellTopLeftY = (cellIndex * pixelHeight) + canvas.y + padding;
                this.penUp();
                this.move(cellTopLeftX, cellTopLeftY);
                this.penDown();
            });
        });
    }
    basicLinearBlinds(canvas) {
        const padding = 20;
        let flipDir = true;
        fill(20);
        noStroke();
        rect(canvas.x + padding, canvas.y + padding, canvas.width - (padding * 2), canvas.height - (padding * 2));
        const lineInterval = padding * 2;
        const lineXstart = canvas.x + (padding * 2);
        const lineXend = canvas.x + canvas.width - (padding * 2);
        let lineYLeft = canvas.y + (padding * 2);
        let lineYRight = canvas.y + (padding * 2);
        let lineYCutoff = canvas.y + canvas.height - (padding * 2);
        this.changeBrush({
            minWidth: 4,
            maxWidth: 4,
            color: "ffffff"
        });
        [...Array(31)].forEach(_ => {
            let startX = flipDir ? lineXstart : lineXend;
            let endX = !flipDir ? lineXstart : lineXend;
            let leftY = flipDir ? lineYLeft : lineYRight;
            let rightY = !flipDir ? lineYLeft : lineYRight;
            this.penUp();
            this.move(startX, leftY);
            this.penDown();
            this.move(endX, rightY);
            flipDir = !flipDir;
            const randomLeft = (lineInterval * (Math.random())) + (lineInterval * 0.420);
            const randomRight = (lineInterval * (Math.random())) + (lineInterval * 0.469);
            lineYLeft = Math.min(lineYLeft + randomLeft, lineYCutoff);
            lineYRight = Math.min(lineYRight + randomRight, lineYCutoff);
        });
    }
    paintImage(img, canvas) {
        const colorArr = Graphic.imageToColorArr(img);
        const booleanLayersByDensity = Graphic.stratify(colorArr, this.palette);
        const xResolution = colorArr[0].length;
        const yResolution = colorArr.length;
        const pixelWidth = canvas.width / xResolution;
        this.maxStep = pixelWidth;
        const pixelHeight = canvas.height / yResolution;
        this.toCanvas(canvas);
        booleanLayersByDensity.forEach(colorLayer => {
            const pColor = colorLayer.color;
            this.changeBrush({
                color: pColor,
                minWidth: pixelWidth,
                maxWidth: pixelWidth,
                minHeight: pixelHeight,
                maxHeight: pixelHeight
            });
            const padding = 4;
            const colorArr = colorLayer.data;
            const strokePaths = [];
            let penDown = false;
            let startVector;
            let endVector;
            colorArr.forEach((row, rowIndex) => {
                row.forEach((cell, cellIndex) => {
                    const isLastCol = cellIndex < (row.length - 1);
                    const isLastRow = rowIndex < (colorArr.length - 1);
                    const lookAheadH = !isLastCol ? row[cellIndex + 1] : false;
                    const nextRow = !isLastRow ? colorArr[rowIndex + 1] : undefined;
                    let lookAheadV = false;
                    if (nextRow)
                        lookAheadV = nextRow[cellIndex];
                    const cellX = canvas.x + (pixelWidth * cellIndex);
                    const cellY = canvas.y + (pixelHeight * rowIndex);
                    if (cell) {
                        if (!penDown) {
                            startVector = createVector(cellX, cellY);
                            penDown = true;
                        }
                    }
                    if (!lookAheadH) {
                        if (penDown) {
                            endVector = createVector(cellX + pixelWidth, cellY);
                            penDown = false;
                            strokePaths.push([startVector.copy(), endVector.copy()]);
                            startVector = createVector(0, 0);
                            endVector = createVector(0, 0);
                        }
                    }
                });
            });
            strokePaths.forEach(lineVector => {
                this.penUp();
                this.move(lineVector[0].x, lineVector[0].y);
                this.penDown();
                this.move(lineVector[1].x, lineVector[1].y);
            });
        });
    }
    noisyLines(canvas) {
        this.toCanvas(canvas);
        let x;
        let y;
        let r = 120;
    }
}
let machine;
let tool;
let canvas;
let img;
function preload() {
    img = loadImage('img/mona_50.png');
}
function setup() {
    createCanvas(windowWidth, windowHeight);
    rectMode("corner").noFill().frameRate(200);
    machine = new Machine(1980, 1980, 100);
    tool = machine.tool;
    addPadding();
    const scale = scaleToWindow();
    canvas = machine.addCanvas({
        width: 1220,
        height: 1220
    }, 200, 200);
    machine.render();
    instructions();
    image(img, 50, 50);
}
function instructions() {
    tool.penDown();
    tool.toCanvas(canvas);
    tool.paintImage(img, canvas);
    tool.grayscaleDensityPixels(img, canvas);
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
    return scale;
}
//# sourceMappingURL=build.js.map