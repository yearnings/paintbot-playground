type Point = {x:number, y:number};
/**
 * @param shape
 * A brush is either round (sizes correspond to diameter) or
 * rectangular (sizes correspond to side length).
 * 
 * @param angle
 * Rotates the brushstroke by this amount. 
 * EG 45 for a slanted calligraphy-type stroke.
 * 
 * @param minWidth
 * @param maxWidth
 * Min and max width of the brush stroke. Dictate the horizontal
 * size when minV and maxV values are provided, otherwise H values
 * are used for V as well.
 * 
 * @param minHeight
 * @param maxHeight
 * Min and max height of a brush stroke on the vertical axis.
 */

type Brush = {
  shape: 'ROUND' | 'RECT',
  minWidth: number,
  maxWidth: number,
  angle?: number
} | {
  shape: 'ROUND' | 'RECT',
  minWidth: number,
  maxWidth: number,
  angle?: number,
  minHeight?: number,
  maxHeight?: number
}

/**
 * Whether to show the brush results, the tool travel path
 * (including when tool is up), or both (path on top)
 */
type DrawMode = 'PATH' | 'BRUSH' | 'BOTH';

/**
 * Most actions don't fire immediately:
 * They get added to a queue, to facilitate the
 * slicing of large moves (eg long travel distances)
 * into smaller moves that execute in sequenece,
 * with a delay between each step, for animated prints.
 * 
 * The ActionQueue is a stack of instructions that we can
 * push to that will execute when previously queued functions
 * are finished doing their thing.
 */
type QueuedFunction = (...args:any) => void;
type ActionQueue = QueuedFunction[];

/**
 * Describes and maneuvers the drawing tool attached to the Machine.
 */
class Tool {
  // The current draw intensity.
  // Measured as a percentage 0 to 1, where 0 
  // is full pen up and nonzero thru 1.0 are 
  // levels of pressure applied to the canvas
  private brushIntensity: number = 0;
  private brush:Brush = {
    shape: 'ROUND',
    minWidth: 1,
    maxWidth: 10,
  }

  // The max distance that can be traveled with each move
  private maxStep: number = 10;

  // isMoving will be set true when currentX|Y != targetX|Y
  // signaling that there needs to be an animation to the
  // target position before continuing with queued actions
  private isMoving: boolean = false;
  
  // The tool's last location
  private currentX: number; private currentY: number;
  // The tool's current destination
  private targetX: number; private targetY: number;
  // Private – users must change position with move();
  private setCurrentPosition(x:number, y:number){ this.currentX = x; this.currentY = y; }
  private setTargetPosition(x: number, y: number) { this.targetX = x; this.targetY = y; }

  /**
   * See type DrawMode
   */
  private drawMode:DrawMode = 'BOTH';
  public set mode(mode: DrawMode){
    this.drawMode = mode;
  }

  /** 
   * See type ActionQueue
   */
  private actions:ActionQueue = [];
  
  // How long to wait between queued actions
  private delay: number = 50;
  public set speed(ms:number){ this.delay = ms; }

  // Time in MS when the last queued action occured
  private lastActionTime: number;

  /**
   * @param startX 
   * @param startY 
   * @param brush optional brush settings
   */
  constructor(startX: number = 0, startY:number = 0, brush?:Brush){
    this.lastActionTime = millis();
    this.currentX = startX;
    this.currentY = startY;
    console.log("I'm a tool! I mean.. you too, but mostly me.")
  }

  /**
   * Raise the pen
   */
  public penUp() {
    this.queue(() => {
      this.brushIntensity = 0;
    })
  }

  /**
   * Move the tool in contact with the canvas
   * @param pressure optional 0-1 range
   */
  public penDown(pressure:number = 1) {
    // Calculate the actual pressure to use
    if(pressure < 0) this.penUp();
    if(pressure > 1) {
      console.warn(`Easy, psycho. ${pressure} is too much. 1 is enough.`)
      pressure = 1;
    }

    // Queue the brush pressure change
    this.queue(() => {
      this.brushIntensity = pressure;
    });
  }

  /**
   * @param brushParams
   * Description of the new brush. When only a partial
   * description is provided, the unspecicified values
   * will be reused from the current brush.
   */
  public changeBrush(brushParams: Partial<Brush>){
    this.queue(() => {
      this.brush = {
        ...this.brush, // start with old values
        ...brushParams // spread in new values
      }
    }); 
  }
  
  /**
   * @param x
   * @param y
   * Move the tool to a new position, drawing if appropriate
   * 
   */
  public move(x: number, y: number){
    // Under the hood, this queues a target change and the
    // actual move is managed later by this.drawTowards()
    this.queue(
      () => { 
        this.setTargetPosition(x,y)
        this.isMoving = true;
      }
    )
  }

  /**
   * Draw a line towards this.targetX|Y, going no farther than this.maxStep
   */
  private drawTowards(){
    const maxMoveAmt = this.maxStep;
    
    if ((this.currentX != this.targetX) || (this.currentY != this.targetY)) {
      this.isMoving = true;
      
      // move towards target by no more than the max amt;
      let nextX, nextY;

      // set the next X and Y points to be the current location +
      // the max move amount, unless that move would overshoot the
      // target location, at which point just go to the target.
      if(this.currentX < this.targetX) {
        nextX = Math.min( (this.currentX + maxMoveAmt), this.targetX )
      } else {
        nextX = Math.max((this.currentX - maxMoveAmt), this.targetX)
      }

      if (this.currentY < this.targetY) {
        nextY = Math.min((this.currentY + maxMoveAmt), this.targetY)
      } else {
        nextY = Math.max((this.currentY - maxMoveAmt), this.targetY)
      }

      // Draw
      this.setPathLineStyle();
      line(this.currentX, this.currentY, nextX, nextY);
      
      // Update the current position
      this.setCurrentPosition(nextX, nextY);

    } else {
      // console.log('Done moving')
      this.isMoving = false;
    }
  }

  /**
   * Set the dashes and colors for toolpath drawing
   */
  private setPathLineStyle(){
    // Set and apply the stroke weight + weight-dependent dash pattern
    const weight = 2;
    strokeWeight(weight);
    // @ts-ignore TS doesn't know that we'll be in a canvas with a drawingContext,
    drawingContext.setLineDash([weight*2, weight*3]);
    if (this.brushIntensity > 0) {
      stroke(0, 255, 255)
      
    } else {
      stroke(255, 0, 0)
    } 
  }

  /**
   * When in timed/animated mode, call run() inside draw() to
   * move the clock forward one tick, executing timed actions.
   */
  public run():void{
    const now = millis();

    // Quit early if there's nothing to do or we ran too recently
    const hasBeenLongEnough = now - this.lastActionTime >= this.delay;
    const hasActions = this.actions.length > 0;
    if(!hasActions || !hasBeenLongEnough) return;

    // If we didn't bail early, update to reflect that we're running now
    this.lastActionTime = now;
    
    // if we're not at the target yet, keep drawing towards
    // the target position until we arrive.
    if(this.isMoving){ 
      this.drawTowards();
      return;
    } 

    // Otherwise, pull and execute the next queued action.
    // (Some of these actions will update the target, which
    // will flip us back into isMoving mode)
    
    // shift() both removes the item from the array
    // AND returns it into this variable.
    const nextAction = this.actions.shift();
    nextAction();
    
    
  }

  /**
   * All Tool actions are passed throgh queue()
   * regardless of whether timed mode is being used.
   * 
   * Previously, when a non-timed mode was supported,
   * queue() was transparent: functions could skip the
   * queue and execute immediately.
   * 
   * @param arrowFn
   * move(0,0) should be passed in like 
   * () => {move(0,0)}
   */
  private queue(arrowFn:QueuedFunction){
    this.actions.push(arrowFn);
  }
}