/**
 * For graphic processing tasks so general
 * that they're inappropriate for Tool.
 */
class Graphic {
  /**
   * Given a p5.image, load its pixels
   * and return them as an array
   */
  public static pixelsForImage(img: p5.Image){
    img.loadPixels();
    return img.pixels;
  }

  /**
   * Convert a raw p5 number array 
   * (1d number[], 4 channels in a pile)
   * into a 2D color array (rows x cols)
   */
  public static numArrToColorArr(pixelData: number[]){
    // Spread the pixel array into a mutable clone because
    // we're gonna splice values off of it repeatedly, and
    // don't want to disturb the actual pixel array.
    const mutablePixels = [...pixelData];

    // Start by converting the quads into colors.
    // This array will also be mutated by pixelRows 
    const mutablePixelColors = [...Array(pixelData.length)].map(() => {
      // Shave the first 4 elements off the mutable array
      const [r, g, b, a] = mutablePixels.splice(0, 4);
      const colorFromNumbers = color(r, g, b, a);
      return colorFromNumbers;
    });

    // Break the flat array of colors into separate rows
    const pixelRows = [...Array(img.width)].map(() => {
      // Shave the first 4 elements off the mutable array
      const rowColors = mutablePixelColors.splice(0, img.width);
      return rowColors;
    });

    // Return an array of pixelRows, which are (top to bottom)
    // arrays of sequential colors for each row (left to right)
    return pixelRows;
  }

  /**
   * Print a color swatch to the console,
   * optionally followed by a message
   */
  public static logSwatch(color: p5.Color, msg?: string){
    // Print the color, followed by the message or nothing
    console.log([`%c---`, `background: ${color}; color:${color}`], msg || '');
  }

  public static logColorRow(cArr: p5.Color[]) {
    // Make a string of %refs to each style and a small string -- 
    // that the style can be applied to (longer strings = longer color blocks)
    const textString = cArr.map(() => `%c.`).join('');
    const styleStrings = cArr.map(c => `background: ${c}; color:${c}; font-size: 10px; line-height:8px; font-family: monospace;`);
    // Return an array of strings that can be spread into a console.log();
    // It begins with one giant string with the correct number of style refs,
    // followed by a string describing each style ref.
    console.log(textString, ...styleStrings);
  }
}