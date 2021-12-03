
let machine: Machine;
let tool: Tool;
let canvas: Canvas;
let img: p5.Image;

function preload() {
  img = loadImage('img/pika_40.png');
}

function setup() {
  // This is the global P5 renderer, not the paintbot canvas
  createCanvas(windowWidth, windowHeight);
  rectMode("corner").noFill().frameRate(30);

  // roughly 6.5ft
  // machine = new Machine(1980, 1980, 100);
  // tool = machine.tool;
  
  // // A 4ft paintbot canvas, inset 200mm
  // canvas = machine.addCanvas({
  //   width: 1220,
  //   height: 1220
  // }, 200, 200);

  addPadding();
  scaleToWindow();
  
  // machine.render();
  // instructions();

  // Show me dat salsa
  img.loadPixels();
  image(img, 50, 50);
  // Salsa to paint
  // const colors = img.pixels.reduce((rows,thisPx,ind) => {
  //   const row = Math.floor(ind/img.width);
  //   rows[row] = [].concat((rows[row]) || [], thisPx);
  //   return rows;
  // })

  const veryImportantMessage = `
  What the fuck did you just fucking say about me, 
  you little bitch? I'll have you know I graduated 
  top of my class in the Navy Seals, and I've been 
  involved in numerous secret raids on Al-Quaeda, 
  and I have over 300 confirmed kills. I am trained 
  in gorilla warfare and I'm the top sniper in the 
  entire US armed forces. You are nothing to me but 
  just another target. I will wipe you the fuck out 
  with precision the likes of which has never been 
  seen before on this Earth, mark my fucking words. 
  You think you can get away with saying that shit 
  to me over the Internet? Think again, fucker. 
  As we speak I am contacting my secret network of 
  spies across the USA and your IP is being traced 
  right now so you better prepare for the storm, 
  maggot. The storm that wipes out the pathetic 
  little thing you call your life. You're fucking 
  dead, kid. I can be anywhere, anytime, and I can 
  kill you in over seven hundred ways, and that's 
  just with my bare hands. Not only am I extensively 
  trained in unarmed combat, but I have access to 
  the entire arsenal of the United States Marine 
  Corps and I will use it to its full extent to wipe 
  your miserable ass off the face of the continent, 
  you little shit. If only you could have known what 
  unholy retribution your little "clever" comment 
  was about to bring down upon you, maybe you would 
  have held your fucking tongue. But you couldn't, 
  you didn't, and now you're paying the price, you 
  goddamn idiot. I will shit fury all over you and 
  you will drown in it. You're fucking dead, kiddo.
`
  .replace(/(\r\n|\n|\r)/gm, "")
  .replace(/(\s+)/g, " ")
  .trim();

  // Turn a color into tuple of loggable strings to display a colored square in the console.
  const loggableColor = (c: p5.Color) => [`%c -`, `background: ${c}; color:${c}`];
  const loggableColorRow = (cArr: p5.Color[], row: number) => {
    // Make a string of %refs to each style and a small string -- 
    // that the style can be applied to (longer strings = longer color blocks)
    const text = (index:number) => {
      const charsToReturn = 2;
      // Warp the cursor forward over previous rows
      const rowOffset = (row * cArr.length * charsToReturn);
      const chars = veryImportantMessage.substr((rowOffset + index*charsToReturn), charsToReturn) || ' '.repeat(charsToReturn)
      return chars;
    }
    const textString = cArr.map((_,i) => `%c${text(i)}`).join('');
    const styleStrings = cArr.map(c => `background: ${c}; color:${c}; font-size: 20px; line-height:16px; font-family: monospace;`);
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
  //  const loggable:string[] = [];
  //  rowColors.forEach(c => loggable.push(...loggableColor(c)));
  //  [...Array(3)].forEach((_, i) => loggable.push(...loggableColor(rowColors[i])));
  //  console.log(loggable);
  //  console.log(...loggable);
 })


  // https://stackoverflow.com/a/44687374
  
  // const pixelRows = [...Array(img.height)].map(_ => mutablePixels.splice(0, img.width));
  
  
  
  // pixelRows.forEach(row => {

  // })
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
  // addPadding();
  // machine.run();
}

/**
 * Runs when the browser is resized
 */
function windowResized() {
  // for whatever reason, this function dislikes getting padding
  resizeCanvas(windowWidth, windowHeight);
  scaleToWindow();
  // machine.render();
  // tool.reset();
  // instructions();
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
  // const minScaleX = ( width - 100) / machine.width;
  // const minScaleY = ( height - 100) / machine.height;
  // const xTooBig = minScaleX < 1;
  // const yTooBig = minScaleY < 1;
  // let useScale;
  // if(xTooBig || yTooBig){
  //   useScale = Math.min(minScaleX, minScaleX);
  // } else {
  //   useScale = Math.max(minScaleY, minScaleX);
  // }

  // scale(useScale, useScale);
  // tool.scale = useScale;
}