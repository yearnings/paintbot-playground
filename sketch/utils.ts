/**
 * Print an image to the console as a series of styled lines
 */
function imageToConsole(img: p5.Image){
  img.loadPixels();
  const colors = img.pixels.reduce((rows, thisPx, ind) => {
    const row = Math.floor(ind / img.width);
    rows[row] = [].concat((rows[row]) || [], thisPx);
    return rows;
  })

  // Turn a color into tuple of loggable strings to display a colored square in the console.
  const loggableColor = (c: p5.Color) => [`%c -`, `background: ${c}; color:${c}`];
  const loggableColorRow = (cArr: p5.Color[], row: number) => {
    // Make a string of %refs to each style and a small string -- 
    // that the style can be applied to (longer strings = longer color blocks)
    const textString = cArr.map((_, i) => `%c.`).join('');
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
  const mutablePixelColors = [...Array(img.pixels.length)].map(() => {
    // Shave the first 4 elements off the mutable array
    const [r, g, b, a] = mutablePixels.splice(0, 4);
    const c = color(r, g, b, a);
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
