
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