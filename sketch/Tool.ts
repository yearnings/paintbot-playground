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
 * All sizes in millimeters.
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
  private maxStep: number = 20;
  public set stepSize(mm:number){
    this.maxStep = mm;
  }

  /**
   * Tool vectors need to be scaled, but the P5 
   * renderer deforms when scaled at drawtime,
   * so the machine keeps track of the scale
   * for use when plotting lines.
   */
  public scale: number = 1;
  // The tool's current location
  private location: p5.Vector = createVector(0,0);
  // The tool's destination
  private target: p5.Vector = createVector(0,0);
  // Private – users must change position with move();
  private setCurrentPosition(x:number | p5.Vector, y?:number){ 
    // Lazy vector discernment
    if(typeof x !== 'number'){
      this.location = x;
    } else {
      this.location = createVector(x,y)
    }
  }
  private setTargetPosition(x: number | p5.Vector, y?: number) { 
    // Lazy vector discernment
    if(typeof x !== 'number'){
      this.location = x;
    } else {
      this.target = createVector(x,y)
    }
  }

  // returns false when not on target,
  // signaling that there needs to be an animation to the
  // target position before continuing with queued actions
  // Stringed because as objects comparison will always be false
  private onTarget = () => (this.location.toString() == this.target.toString());

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
    this.setCurrentPosition(startX, startY);
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
      console.warn(`Invalid pressure ${pressure}, setting to 1 (maximum)`)
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
   * Move the tool to a new position, drawing if appropriate
   */
  public move(x: number, y: number){
    // Under the hood, this queues a target change and the
    // actual move is managed later by this.drawTowards()
    this.queue(
      () => { 
        this.setTargetPosition(x,y)
      }
    )
  }

  /**
   * 
   * 
   */
  public up(mm: number){ this.move(this.location.x, this.location.y - mm) }
  public down(mm: number){ this.move(this.location.x, this.location.y + mm) }
  public left(mm: number){ this.move(this.location.x - mm, this.location.y) }
  public right(mm: number){ this.move(this.location.x + mm, this.location.y) }

  /**
   * Move the tool to the origin (top left) of a given canvas;
   */
  public toCanvas(c:Canvas){
    this.move(c.x, c.y);
  }

  /**
   * Draw a line towards this.target, moving no farther than this.maxStep
   * 
   * Vector math via
   * https://stackoverflow.com/questions/48250639/making-an-object-move-toward-the-cursor-javascript-p5-js
   */
  private drawTowards(){
    const maxMoveAmt = this.maxStep;
    
    // Vector representing the untraveled portion of the line:
    // the target less the current location
    let untraveled = this.target.copy().sub(this.location);
    // The vector representing maxSteps forward from the current location
    let forwardStep = untraveled.copy().normalize().mult(this.maxStep);
    
    // when the length of the next step would overshoot 
    // the target, use the target in place of the overshot
    // location for the final move.
    // 
    // Note that these compare magnitude (length) not raw vector
    
    let nextLocation;
    if(untraveled.mag() < forwardStep.mag()) {
      nextLocation = this.target.copy();
    } else {
      nextLocation = this.location.copy().add(forwardStep);
    }

    this.setPathLineStyle();
    this.scaledLineFromVectors(this.location, nextLocation);
    
    // Update the current position
    this.setCurrentPosition(nextLocation.setHeading(0));
  }

  /**
   * Draw a line between two vectors, adjusting scale
   * to account for window / renderer resizing.
   */
  private scaledLineFromVectors(start: p5.Vector, end: p5.Vector){
    scale(this.scale);
    line(start.x, start.y, end.x, end.y);
  }

  /**
   * Set the styles colors for toolpath drawing.
   * 
   * Dash styles here may get rekt when lines get segmented.
   */
  private setPathLineStyle(){
    // Set and apply the stroke weight + weight-dependent dash pattern
    if (this.brushIntensity > 0) {
      strokeWeight(4);
      stroke(0, 255, 255, 100)
      
    } else {
      strokeWeight(2);
      stroke(255, 0, 0, 100)
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
    if(this.onTarget() && !hasActions || !hasBeenLongEnough) return;

    // console.log(Math.round(this.location.x), Math.round(this.target.x));
    // If we didn't bail early, update to reflect that we're running now
    this.lastActionTime = now;
    
    // if we're not at the target yet, keep drawing towards
    // the target position until we arrive.
    if(!this.onTarget()){ 
      // console.log('Moving:', Math.round(this.location.x), Math.round(this.location.y), '=>', Math.round(this.target.x), Math.round(this.target.y));
      this.drawTowards();
      return;
    } 

    // Otherwise, pull and execute the next queued action.
    // (Some of these actions will update the target, which
    // will flip us back into onTarget mode)
    
    // shift() both removes the item from the array
    // AND returns it into this variable.
    const nextAction = this.actions.shift();
    console.log('Next action:', nextAction);
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
   * fnName(arg1,arg2) should be passed in like 
   * () => {fnName(arg1,arg2)}
   */
  private queue(arrowFn:QueuedFunction){
    this.actions.push(arrowFn);
  }

  public reset(){
    this.actions = [];
    this.setCurrentPosition(0,0);
    this.setTargetPosition(0,0);
  }
}