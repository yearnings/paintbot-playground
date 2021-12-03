
let machine: Machine;
let tool: Tool;
let canvas: Canvas;
let img: p5.Image;

function preload() {
  img = loadImage('img/salsa_120.jpg');
}

function setup() {
  // This is the global P5 renderer, not the paintbot canvas
  createCanvas(windowWidth, windowHeight);
  rectMode("corner").noFill().frameRate(30);

  // roughly 6.5ft
  machine = new Machine(1980, 1980, 100);
  tool = machine.tool;
  
  // A 4ft paintbot canvas, inset 200mm
  canvas = machine.addCanvas({
    width: 1220,
    height: 1220
  }, 200, 200);

  addPadding();
  scaleToWindow();
  
  machine.render();
  instructions();

  // Show me dat salsa
  img.loadPixels();
  image(img, 50, 50);
  // Salsa to paint
  const colors = img.pixels.reduce((rows,thisPx,ind) => {
    const row = Math.floor(ind/img.width);
    rows[row] = [].concat((rows[row]) || [], thisPx);
    return rows;
  })

  // Turn a color into tuple of loggable strings to display a colored square in the console.
  const loggableColor = (c: p5.Color) => [`%c -`, `background: ${c}; color:${c}`];
  const loggableColorRow = (cArr: p5.Color[], row: number) => {
    // Make a string of %refs to each style and a small string -- 
    // that the style can be applied to (longer strings = longer color blocks)
    const textString = cArr.map((_,i) => `%c.`).join('');
    const styleStrings = cArr.map(c => `background: ${c}; color:${c}; font-size: 10px; line-height:8px; font-family: monospace;`);
    // Return an array of strings that can be spread into a console.log();
    // It begins with one giant string with the correct number of style refs,
    // followed by a string describing each style ref.
    return [textString, ...styleStrings]
  }
  
  // img.pixels is a flat array of sequential rgba numbers,
  // so img.pixels.length == img.width*4 (because r,g,b,a);
  // 
  // Spread the pixel array into a mutable clone because
  // we're gonna splice values off of it repeatedly, and
  // don't want to disturb the actual pixel array.
  const mutablePixels = [...img.pixels];

  // Start by converting the quads into colors.
  // This array will also be mutated by pixelRows 
  const mutablePixelColors = [...Array(img.pixels.length)].map( () => {
    // Shave the first 4 elements off the mutable array
    const [r, g, b, a] = mutablePixels.splice(0, 4);
    const c = color(r,g,b,a);
    // console.log(...loggableColor(r));
    return c;
  });

  // Break the flat array of colors into separate rows
  const pixelCols = [...Array(img.width)].map(_ => {
    // Shave the first 4 elements off the mutable array
    const col = mutablePixelColors.splice(0, img.height);
    return col;
  });

 [...Array(img.height)].forEach((_, rowIndex) => {
   const rowColors = pixelCols[rowIndex];
  //  if(rowIndex%2==0) 
    console.log(...loggableColorRow(rowColors, rowIndex));
 })
}

/**
 * Instructions to the tool are sent at setup time
 * and executed by tool.run() during draw time.
 */

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

/**
 * Runs when the browser is resized
 */
function windowResized() {
  // for whatever reason, this function dislikes getting padding
  resizeCanvas(windowWidth, windowHeight);
  scaleToWindow();
  machine.render();
  tool.reset();
  instructions();
}

/**
 * Modify the drawing area with axis inversion, padding, etc.
 */
function addPadding() {
  translate(50,50);
}

function invertY(){
  translate(0, height);     // set origin to bottom left
  scale(1, -1);             // invert Y axis
}

/**
 * Scale the entire application so that the full machine 
 * is in view, regardless of how big it is.
 * 
 * Don't scale the window in draw() if it's already
 * being scaled during window resize. They'll both 
 * happen and cause proportions to be wrong.
 */
function scaleToWindow(){
  // -100 to accomodate for padding
  const minScaleX = ( width - 100) / machine.width;
  const minScaleY = ( height - 100) / machine.height;
  const xTooBig = minScaleX < 1;
  const yTooBig = minScaleY < 1;
  let useScale;
  if(xTooBig || yTooBig){
    useScale = Math.min(minScaleX, minScaleX);
  } else {
    useScale = Math.max(minScaleY, minScaleX);
  }

  scale(useScale, useScale);
  tool.scale = useScale;
}