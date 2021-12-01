/**
 * The paint robot's print area
 */
class Machine {
  public readonly width: number;
  public readonly height: number;
  public readonly gridSize: number;
  public readonly tool: Tool = new Tool();
  /**
   * The gallery is readable so you can script Tool
   * movement against canvas position without having
   * to go through Machine or Tool as an intermediary.
   */
  public readonly gallery:Canvas[] = [];


  /**
   * 
   * @param width in mm
   * @param height in mm
   * @param gridSize in mm
   */
  constructor(
    width: number = 500, height: number = 500, gridSize: number = 50
  ){
    this.width = width;
    this.height = height;
    this.gridSize = gridSize;
  }

  /**
   * Render the machine background
   */
  public render(){
    background(0);
    this.drawBackground();
    this.drawGrid();

    // Draw each canvas
    this.gallery.forEach(c => {
      // Canvas backgrounds only offered in white ATM
      fill(255);
      noStroke;
      rect(c.x, c.y, c.width, c.height);
    });
  }

  /**
   * Run the machine, which runs the tool
   * and manages canvases
   */
  public run(){
    this.tool.run();
  }

  /**
   * Add a canvas to the machine.
   * 
   * @param dimensions
   * @param x optional 
   * @param y optional
   * 
   * @returns a reference to the created canvas
   */
  public addCanvas(dimensions:CanvasDimensions, x: number = 0, y:number = 0){
    const canvas = new Canvas(dimensions, x, y);
    this.gallery.push(canvas);
    return canvas;
  }
  
  /**
   * Draw the background (just a filled rectangle)
   */
  private drawBackground(){
    // Machine background style
    fill(255, 255, 255, 20);
    stroke(255, 50);
    strokeWeight(1);
    // Canvas background
    rect(0, 0, this.width, this.height);
  }

  /**
   * Draw the lined sectiond of the background
   */
  private drawGrid(){
    // Cell drawing styles
    noFill();
    stroke(255, 20);
    strokeWeight(1);

    let rowCursorPos = 0;
    let colCursorPos = 0;

    const _drawCell = (x: number, y: number) => {
      const boundedWidth = x + this.gridSize < this.width ? this.gridSize : this.width - rowCursorPos;
      const boundedHeight = y + this.gridSize < this.height ? this.gridSize : this.height - colCursorPos;
      rect(x, y, boundedWidth, boundedHeight);
    }

    const _drawRow = () => {
      _drawCell(rowCursorPos, colCursorPos);
      rowCursorPos += this.gridSize;
      if (rowCursorPos >= this.width) {
        rowCursorPos = 0;
        colCursorPos += this.gridSize;
      }
    }

    // while(rowCursorPos < this.width){
    while (colCursorPos < this.height) {
      _drawRow();
    }
  }
}