type CanvasDimensions = {
  width: number;
  height: number;
  thickness?:number;
}

/**
 * A canvas represents a paintable area IRL.
 * 
 * Under the hood, a canvas is actually a mask:
 * the entire machine floor is paintable, but
 * the paint is only shown when it's beneath a
 * canvas mask.
 * 
 * Multiple canvases can be added to a machine.
 */
class Canvas{
  /**
   * For realistic z offset
   */
  public thickness: number;
  public width: number;
  public height: number;
  public readonly x: number;
  public readonly y: number;

  constructor(dimensions: CanvasDimensions, x: number = 0, y:number = 0){
    let { width, height, thickness } = dimensions;
    this.width = width;
    this.height = height;
    this.thickness = thickness || 25;

    this.x = x;
    this.y = y;
  }
}