let machine: Machine;
let tool: Tool;

function setup() {
  createCanvas(windowWidth, windowHeight)
  setOrigin();
  rectMode("corner").noFill().frameRate(30);
  
  machine = new Machine(600, 600,25);
  tool = machine.tool;
  
  machine.show();
  instructions();
}

/**
 * Instructions to the tool are sent at setup time
 * and executed by tool.run() during draw time.
 */

function instructions() {
  tool.move(50,50);
  tool.penDown();
  tool.move(50,100);
  tool.penUp();
  tool.move(100,100);
  tool.move(100,200);
  tool.penDown();
  tool.move(200, 200);
}

function draw() {
  setOrigin();
  tool.run();
}

/**
 * Runs when the browser is resized
 */
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  setOrigin();
  machine.show();
}

/**
 * Modify the drawing area with axis inversion, padding, etc.
 */
function setOrigin() {
  // translate(0, height);     // set origin to bottom left
  // scale(1, -1);             // invert Y axis
  translate(50, 50);           // Pad from the top a bit
}