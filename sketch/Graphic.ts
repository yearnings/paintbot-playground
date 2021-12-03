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
   * Given a p5.Image (which can be unloaded),
   * load pixels, convert to color array, return.
   */
  public static imageToColorArr(img: p5.Image){
    const pixels = this.pixelsForImage(img);
    return this.numArrToColorArr(pixels);
  }

  /**
   * Print a color swatch to the console,
   * optionally followed by a message
   */
  public static logSwatch(color: p5.Color, msg?: string){
    // Print the color, followed by the message or nothing
    console.log([`%c---`, `background: ${color}; color:${color}`], msg || '');
  }

  /**
   * Print a row of colors to the console
   */
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
  /**
   * For a single pixel's color, find the nearest
   * color in the palette
   */
  public static nearestColor(refColor: p5.Color, palette:Palette) {
    // Given two colors, return an array with the delta
    // between values in each channel of each color
    const deltaColor = (a: p5.Color, b: p5.Color) => {
      // Apply a color extraction fn eg `red()` and return delta
      const deltaChannel = (chFn: Function) => Math.abs(chFn(a) - chFn(b));
      return [
        deltaChannel(red),
        deltaChannel(green),
        deltaChannel(blue)
      ];
    }

    const average = (arr: number[]) => (arr.reduce((a, b) => a + b)) / arr.length;

    // for each color in the palette, find the delta for each channel
    const deltaColors = palette.map(paletteColor => deltaColor(color(paletteColor), refColor));

    // --------------------
    // Nearest by average
    // Highly consistent, to the point of being sterile.
    // --------------------

    // then the average delta across all channels
    const averages = deltaColors.map(average);

    // the nearest color is the one with the lowest average delta across all channels    
    const lowestDelta = Math.min(...averages);
    const targetIndex = averages.indexOf(lowestDelta);
    const nearestByAvg = palette[targetIndex];

    // --------------------
    // Nearest by closest single delta
    // Chaotic, to the point of looking more random than artful
    // --------------------

    // Another strategy... instead of avg delta, the single most encouraging delta
    const lowestNumber = (x: number[]) => Math.min(...x);
    // the lowest delta channel for each color
    const lowestSingleDeltas = deltaColors.map(lowestNumber);
    const lowestSingleDelta = lowestNumber(lowestSingleDeltas);
    // The location in the palette corresponding to the location of the lowest channel delta
    const nearestByMin = palette[lowestSingleDeltas.indexOf(lowestSingleDelta)];

    // --------------------
    // Settle differences between algos
    // It's critical that these be determinstic:
    // If you try and use randomness, there's a good
    // chance that the two colors it could be will get
    // the other color during each of their check passes,
    // leaving the square empty.
    // --------------------
    
    // If they disagree, settle the score lazily but deterministically
    if(nearestByMin !== nearestByAvg){
      if(lowestSingleDelta < 10) return nearestByMin;
    }

    // Otherwise just use by avg
    return nearestByAvg;
    
    


    // -------
    // Log both options when algos disagree
    // I haven't tuned or optimized this at all. Avg could be the worse algo.
    // -------
    // if (nearestByAvg !== nearestByMin) {
    //   console.log('FYI: color similarity algos disagree:')
    //   console.log(`%c ----`, `background: ${refColor}; color:${refColor}`);
    //   console.log(`%c ----`, `background: ${nearestByAvg}; color:${nearestByAvg}`, `Nearest by average (used)`);
    //   console.log(`%c ----`, `background: ${nearestByMin}; color:${nearestByMin}`, 'Nearesty by single delta');
    //   console.log(`If single delta consistently picks better than average, change which algo is used.`);
    //   console.log('')
    // }

    return nearestByMin;
  }

  /**
   * Split an image into layers for each palette.
   */
  public static stratify(imgColors: p5.Color[][], palette: Palette){
    type BooleanLayer = {
      // The palette color this is for
      color: string;
      // ratio of filled pixels to total pixels for this color
      density: number;
      // actual 2D boolean array
      data: boolean[][]
    }

    /**
     * An array of boolean color arrays for each image.
     * 
     * A boolean color array is like an alpha channel/mask
     * for a given palette color. It will be true when a
     * pixel in imgColors should be painted that palette color,
     * and false otherwise.
     */
    const booleanLayers:BooleanLayer[] = [];
    palette.forEach(pColor => {
      // Convert colors
      const BooleanLayer = imgColors.map(row => {
        return row.map(iColor => {
          return this.nearestColor(iColor, palette) == pColor
        })
      });

      // Calc density
      const truePixels = BooleanLayer.flat().filter(i => i === true);
      const density =  truePixels.length / BooleanLayer.length;

      // Build data object
      booleanLayers.push({
        color: pColor,
        data: BooleanLayer,
        density
      })
    })

    // For sorting by density
    const byDensity = (a:BooleanLayer, b:BooleanLayer) => {
      if(a.density < b.density) return -1;
      if(a.density > b.density) return 1;
      return 0;
    }

    // Return the densest layers earlierst in the array
    return booleanLayers.sort(byDensity);
  }
}