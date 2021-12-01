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

  constructor(width: number, height: number, thickness?:number){
    this.width = width;
    this.height = height;
    this.thickness = thickness || 25;
  }
}