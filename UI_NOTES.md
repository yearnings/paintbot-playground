# Notes on the UI I should build

## Image
### Upload

### Processing type
I can imagine a complex version of this that applies separate transform layers, EG you pick TWO processes to both happen, stacked in z space. This is out of scope for now. Just one process, a-la-plotterfun.

#### Processing subsettings
The exact nature of these will vary by processing type

  *Resolution parameters*
  Currently I am providing images that are pre pixelated in photoshop, at eg 80x80 res. In the future, I want to be able to provide EG a 1000x1000 image and have the downres happen within the program, displaying the result. This is relevant to the current grid-style of image generation, but may not apply to every kind of operation in the future.

  *Color selection*
  * how many colors are the image broken into
  * what are those colors?
  * what is their order?
  * what are the threshold between colors?

  *Other params*
  * UI for the mis acctrs of a paint process
    **Important concept:** Draw process args shuld be typed / defined in a way that is UI-aware, eg modeled in a GUI friendly way, possibly with inbuilt hints/markup etc.

## Machine
* Drawable area bounds
* Machine bounds (optional)

## Canvas
X Y and Z size, background color, placement on machine.

## Tool Home Area
We haven't gotten far enough to model this yet, but soon. This has two sub-areas
* Tool home: where different tools live and are swapped
* Paint home: where different paints live and are tested.
  * I think of this process in terms of hooks: there is a paint load process, and then things like dragging out, shaking, waiting, eg are processes that can be `called by` / `attached to` the `afterPaintLoad` event hook.

## Simulation / preview params
* bool Show move lines
* bool Show tool (eg rect shaped like brush tip)
* Move speed (0 = instant display)