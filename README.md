# Home Assistant - Drag Card
A button for Home Assistant which can be dragged in four directions to trigger four actions.

<picture>
  <img width="250" alt="Preview" src="https://github.com/BlackCube4/HomeAssistant-DragButtonCard/blob/main/DragCard.gif">
</picture>


## Card Options
#### Configuration Options
| Name | Default Value | Description |
|------|---------------|-------------|
| type ***(required)*** | | `custom:drag-card`.
| maxDrag | 100 | The maximum distance the button can be dragged in px
| stopSpeedFactor | 1 | The speed at which the button will reach its max drag distance
| repeatTime | 200 | Rrapid fire interval time in ms
| holdTime | 800 | Time until hold action gets activated in ms
| maxMultiClicks | 2 | Max amount of MultiClicks to register
| multiClickTime | 300 | Time between clicks to activate multi click in ms
| deadzone | 20 | Radius in which a swipe action won't be recognized
| isStandalone | true | Dectivate if your drag button is integrated into another card
| padding | 15px |  Padding of the card
| cardHeight | 150px | Height of the card
| height | 100% | Height of the button
| width | 100% | Width of the button
| backgroundColor | '#1D1E21' | Background color of the Button
| borderRadius | '15px' | Radius of the rounded edges

#### Entity Options
| Name | Description |
|------|-------------|
| entityUp | Button/Switch/Skript that gets activated/toggled when swiping up the button.
| entityDown | Button/Switch/Skript that gets activated/toggled when swiping down the button.
| entityLeft | Button/Switch/Skript that gets activated/toggled when swiping left on button.
| entityRight | Button/Switch/Skript that gets activated/toggled when swiping right on button.
| entityCenter | Button/Switch/Skript that gets activated/toggled when clicking on the button.
| entityDouble | Button/Switch/Skript that gets activated/toggled when double clicking on the button.
| entityTriple | Button/Switch/Skript that gets activated/toggled when triple clicking up on the button.
| entityQuadruple | Button/Switch/Skript that gets activated/toggled when quadruple clicking up on the button.
| entityHold | Button/Switch/Skript that gets activated/toggled when clicking the button for a long time without swiping.

#### Icon Options
| Name | Description |
|------|-------------|
| icoDefault | The icon that gets displayed by default.
| icoUp | The icon that gets displayed when swiping up.
| icoDown | The icon that gets displayed when swiping left.
| icoLeft | The icon that gets displayed when swiping right.
| icoRight | The icon that gets displayed when swiping down.
| icoCenter | The icon that gets displayed when clicking on the button.
| icoDouble | The icon that gets displayed when double clicking on the button.
| icoTriple | The icon that gets displayed when triple clicking on the button.
| icoQuadruple | The icon that gets displayed when quadruple clicking on the button.
| icoHold | The icon that gets displayed when holding down the button.

- Install Node.js (which includes npm (Node Package Manager) if you haven't already)
- Open a command prompt or terminal and navigate to the project folder.
- npm install
- npm run build