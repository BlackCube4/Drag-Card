# Home Assistant - Drag Card
A customizable draggable button card for Home Assistant with directional swipe actions, multi-click support, and smooth animations.

![Drag Card Preview](https://github.com/BlackCube4/HomeAssistant-DragButtonCard/blob/main/DragCard.gif)

## ✨ Features

- **Directional swipe actions** (up, down, left, right)
- **Multi-click support** (single, double, triple, quadruple click)
- **Long press/hold action**
- **Custom icons** for each action state
- **Smooth spring animations**
- **Fully customizable** appearance and behavior
- **Works with** buttons, scripts, lights, switches, and covers

## 📦 Installation

### HACS (Recommended)
1. Open HACS in your Home Assistant
2. Go to "Frontend" section
3. Click "+ Explore & Download Repositories"
4. Search for "Drag Card"
5. Click "Download" and restart Home Assistant

### Manual Installation
1. Download the latest release from [GitHub Releases](https://github.com/BlackCube4/HomeAssistant-DragButtonCard/releases)
2. Copy `drag-card.js` to your `config/www` directory
3. Add the following to your Lovelace configuration:

```yaml
resources:
  - url: /local/drag-card.js
    type: module
```

## 🚀 Build From Source
1. Install Node.js (which includes npm)
2. git clone https://github.com/BlackCube4/HomeAssistant-DragButtonCard.git
3. Open a terminal and navigate to the project folder
4. Run:
   ```bash
   npm install
   npm run build

## 🛠 Configuration
#### Basics/Appearance
| Name | Type | Default | Description |
|------|------|---------|-------------|
| type | string | ***(required)*** | `custom:drag-card`
| padding | string | 15px | Card padding
| cardWidth | string | 100% | Width of the card
| cardHeight | string | 150px | Height of the card
| buttonWidth | string | 100% | Width of the button
| buttonHeight | string | 100% | Height of the button
| iconSize | string | 80% | Size of icons relative to button
| cardBackgroundColor | string | HA card background | Background color of the card
| cardBorderRadius | string | HA card radius | Border radius of the card
| cardBoxShadow | string | HA card shadow |	Box shadow of the card
| buttonBackgroundColor | string | HA card background | Background color of the button
| buttonBorderRadius | string | HA card radius | Border radius of the button
| buttonBoxShadow | string | HA card shadow | Box shadow of the button

#### Behavior Settings
| Name | Type | Default | Description |
|------|------|---------|-------------|
| maxDrag | number | 100 | Maximum drag distance in pixels
| returnTime | number | 200 | Return animation duration in ms
| springDamping | number | 2 | Controls spring animation (≥2 = no bounce)
| repeatTime | number | 200 | Rapid fire interval for hold action in ms
| holdTime | number | 800 | Time until hold action triggers in ms
| multiClickTime | number | 300 | Time between clicks for multi-click in ms
| deadzone | number | 20 | Radius where swipe actions won't register
| lockNonEntityDirs | boolean | true | Disable dragging in directions without entities

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