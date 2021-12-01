/**
 * The paint robot's print area
 */
class Machine {
  width: number;
  height: number;
  gridSize: number;
  public tool: Tool = new Tool();

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

  public show(){
    background(0);
    this.drawBackground();
    this.drawGrid();
  }

  private drawBackground(){
    // Machine background style
    fill(255, 255, 255, 20);
    stroke(255, 50);
    strokeWeight(1);
    // Canvas background
    rect(0, 0, this.width, this.height);
  }

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
        console.log('next');
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