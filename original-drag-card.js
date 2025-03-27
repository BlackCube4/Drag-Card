class DragCard extends HTMLElement {

    constructor() {
        //console.log("constructor");
        super();
        this.isDragging = false;
        this.initialX = 0;
        this.initialY = 0;
        this.currentX = 0;
        this.currentY = 0;
        this.diffX = 0;
        this.diffY = 0;
        this.offsetX = 0;
        this.offsetY = 0;
        this.actionCounter = 0;
        this.distanceMouse = 0;
        this.clickCount = 0;

        this.lastClick = null;      //value to store the last click time
        this.lastClickType = null;
    }
    
    set hass(hass) {
        //console.log("hass");
        this._hass = hass;
    }

    connectedCallback() {
        //console.log("connectedCallback");

        this.innerHTML = `
            <style>
                #dragButtonContainer {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 150px;
                    padding: 15px;
                }
                #dragButtonOrigin {
                    width: 100%;
                    height: 100%;
                }
                #dragButton {
                    position: relative;
                    border-radius: var(--ha-card-border-radius);
                    top: 0px;
                    left: 0px;
                    width: 100%;
                    height: 100%;
                    background-color: var(--card-background-color);
                    box-shadow: var(--ha-card-box-shadow);
                    touch-action: none;
                    overflow: hidden;
                    cursor: pointer;
                    z-index: 0;
                }
                #ripple {
                    position: absolute;
                    border-radius: 50%;
                    background-color: rgb(255, 255, 255);
                    opacity: 0;
                    pointer-events: none;
                    transition: opacity 0.2s;
                }
                #ripple.expanding {
                    transition: transform 0.2s, opacity 0.05s;
                }
                #iconContainer {    
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    pointer-events: none;
                    // padding: 10px;
                    box-sizing: border-box;
                }
                #icon {
                    width: 80%;
                    height: 80%;
                    --mdc-icon-size: 100%;
                    // pointer-events: none;
                }
                #image {
                    // pointer-events: none;
                    object-fit: contain;
                }
            </style>
            <ha-card id="dragButtonContainer">
                <div id="dragButtonOrigin">
                    <div id="dragButton">
                        <div id="ripple"></div>
                        <div id="iconContainer">
                            <ha-icon id="icon"></ha-icon>
                            <img id="image" alt="Image"></img>
                        </div>
                    </div>
                </div>
            </ha-card>
        `;
        this.card = this.querySelector("#dragButtonContainer");
        if (this.cardHeight != null) {this.card.style.height = this.cardHeight}
        if (this.padding != null) {this.card.style.padding = this.padding}
        
        if (this.isStandalone == false) {this.card.outerHTML = this.card.innerHTML}
        
        if (this.maxDrag == null) {this.maxDrag = 100}
        if (this.stopSpeedFactor == null) {this.stopSpeedFactor = 1}
        if (this.repeatTime == null) {this.repeatTime = 200}
        if (this.holdTime == null) {this.holdTime = 800}
        if (this.maxMultiClicks == null) {this.maxMultiClicks = 2}
        if (this.multiClickTime == null) {this.multiClickTime = 300}
        if (this.deadzone == null) {this.deadzone = 20}
        
        this.stopSpeed = this.maxDrag * this.stopSpeedFactor;

        this.dragButtonOrigin = this.querySelector("#dragButtonOrigin");
        if (this.height != null) {this.dragButtonOrigin.style.height = this.height}
        if (this.width != null) {this.dragButtonOrigin.style.width = this.width}

        this.dragButton = this.querySelector("#dragButton");
        if (this.backgroundColor != null) {this.dragButton.style.backgroundColor = this.backgroundColor}
        if (this.borderRadius != null) {this.dragButton.style.borderRadius = this.borderRadius}

        this.rippleElement = this.querySelector("#ripple");
        if (this.icoDefault != null) {
            this.setIcon(this.icoDefault)
        } else if (this.icoCenter != null) {
            this.setIcon(this.icoCenter)
        } else {
            this.setIcon('mdi:alert')
        }

        this.computedStyle = window.getComputedStyle(this.dragButton);
        this.rippleComputedStyle = window.getComputedStyle(this.rippleElement);
        this.addEventListeners();
    }

    setIcon(icon) {
        this.iconContainer = this.querySelector("#iconContainer");
        if (icon != null) {
            if (icon.startsWith("/local/")){
                //console.log(this.iconContainer.outerHTML)
                this.iconContainer.outerHTML = '<div id="iconContainer"><img id="image" src="' + icon + '" alt="Image"></img></div>';
            } else {
                //console.log(this.iconContainer.outerHTML)
                this.iconContainer.outerHTML = '<div id="iconContainer"><ha-icon id="icon" icon="' + icon + '"></ha-icon></div>';
            }
        }
    }

    addEventListeners() {
        this.dragButton.addEventListener("touchstart", this.handleTouchStart.bind(this), { passive: true });
        this.dragButton.addEventListener("touchmove", this.handleTouchMove.bind(this), { passive: true });
        this.dragButton.addEventListener("touchend", this.handleTouchEnd.bind(this), { passive: true });
        this.dragButton.addEventListener("mousedown", this.handleMouseDown.bind(this));
        document.addEventListener("mousemove", this.handleMouseMove.bind(this));
        document.addEventListener("mouseup", this.handleMouseUp.bind(this));
    }

    handleTouchStart(event) {
        event = event.touches[0];
        this.offsetX = event.clientX - this.dragButton.offsetLeft;
        this.offsetY = event.clientY - this.dragButton.offsetTop;
        //console.log('touchStart ' + event);
        this.handleStart(event);
    }

    handleTouchMove(event) {
        if (this.isDragging) {
            this.currentX = event.touches[0].clientX;
            this.currentY = event.touches[0].clientY;
            this.handleDrag();
        }
    }

    handleTouchEnd(event) {
        this.lastClickType = event;
        this.handleEnd();
    }

    handleMouseDown(event) {
        if (Date.now() - this.lastClick < 200 && this.lastClickType == '[object TouchEvent]')
            return;
        this.offsetX = event.offsetX;
        this.offsetY = event.offsetY;
        //console.log('mouseStart ' + event);
        this.handleStart(event);
    }

    handleMouseMove(event) {
        if (this.isDragging) {
            this.currentX = event.clientX;
            this.currentY = event.clientY;
            this.handleDrag();
        }
    }

    handleMouseUp(event) {this.handleEnd()}

    handleStart(event) {
        //console.log('start');
        this.dragButton.style.zIndex = '1';
        this.initialX = event.clientX;
        this.initialY = event.clientY;
        //console.log('x' + this.offsetX + ' Y' + this.offsetY)
        var buttonWidth = this.computedStyle.getPropertyValue("width");
        buttonWidth = parseInt(buttonWidth, 10);
        var buttonHeight = this.computedStyle.getPropertyValue("height");
        buttonHeight = parseInt(buttonHeight, 10);
        if (buttonWidth < buttonHeight)
            this.rippleRadius = buttonHeight * 0.2;
        else
            this.rippleRadius = buttonWidth * 0.2;
        //console.log(rippleRadius)
        this.rippleElement.style.left = this.offsetX - this.rippleRadius + 'px';
        this.rippleElement.style.top = this.offsetY - this.rippleRadius + 'px';
        this.rippleElement.style.width = this.rippleRadius*2 + 'px';
        this.rippleElement.style.height = this.rippleRadius*2 + 'px';
        if (this.offsetX > buttonWidth/2){
            if (this.offsetY > buttonHeight/2)
                var distEdge = Math.sqrt((0 - this.offsetX) **2 + (0 - this.offsetY) ** 2); //unten rechts
            else
                var distEdge = Math.sqrt((0 - this.offsetX) **2 + (buttonHeight - this.offsetY) ** 2); //oben rechts
        } else {
            if (this.offsetY > buttonHeight/2)
                var distEdge = Math.sqrt((buttonWidth - this.offsetX) **2 + (0 - this.offsetY) ** 2); //unten links
            else
                var distEdge = Math.sqrt((buttonWidth - this.offsetX) **2 + (buttonHeight - this.offsetY) ** 2); //oben links
        }
        this.newScale = distEdge/this.rippleRadius
        
        //console.log('dist:' + distEdge)
        this.rippleElement.classList.add('expanding');
        this.rippleElement.style.opacity = '0.06'
        this.rippleElement.style.transform = 'scale(' + this.newScale + ')'

        this.isDragging = true;
        this.actionCounter = 0;
        this.distanceMouse = 0;
        this.diffX = 0;
        this.diffY = 0;
        this.startTime = Date.now();

        this.repeatHoldDetection = setInterval(() => {
            if (Date.now() - this.startTime >= this.holdTime){
                this.repeatAction = setInterval(() => {
                    this.detectSwipeDirection( this.deadzone*2, 1);
                }, this.repeatTime);
                clearInterval(this.repeatHoldDetection);
            }
        }, 60);
    }

    handleDrag() {
        this.dragButton.style.zIndex = '1';
        this.diffX = this.currentX - this.initialX;
        this.diffY = this.currentY - this.initialY;
        this.distanceMouse = Math.sqrt(this.diffX ** 2 + this.diffY ** 2);
        const normalizedX = this.diffX / this.distanceMouse;
        const normalizedY = this.diffY / this.distanceMouse;
        const dragDistance = (1-(this.stopSpeed / (this.distanceMouse + this.stopSpeed))) * this.maxDrag;
        this.dragButton.style.cursor = 'grabbing';
        //console.log('X' + normalizedX + ' Y' + normalizedY);
        if((normalizedY > 0 && this.entityDown != null) || (normalizedY < 0 && this.entityUp != null)) {
            this.dragButton.style.top = normalizedY * dragDistance + 'px';
        } else {
            this.dragButton.style.top = 0 + 'px';
        }
        if((normalizedX > 0 && this.entityRight != null) || (normalizedX < 0 && this.entityLeft != null)) {
            this.dragButton.style.left = normalizedX * dragDistance + 'px';
        } else {
            this.dragButton.style.left = 0 + 'px';
        }
    }

    detectSwipeDirection(deadzone, holdMode) {
        clearTimeout(this.iconTimeout);
        //console.log(this.distanceMouse);
        //console.log(this.icon.outerHTML)
        if (this.distanceMouse < deadzone) {
            //console.log(Date.now() - this.startTime + "time " + this.holdTime + "hold");
            if (holdMode == true && this.actionCounter == 0) {
                console.log("hold");
                if (this.entityHold != null) {
                    this.setIcon(this.icoHold)
                    this.callCorrectService(this.entityHold);
                }
                this.handleEnd()
            }
            if (holdMode == false){
                this.clickCount++;
                this.lastClick = Date.now();
                clearInterval(this.handleClick);
                this.handleClick = setInterval(() => {
                    if (Date.now() - this.lastClick >= this.multiClickTime || this.clickCount==this.maxMultiClicks) {
                        console.log('clickCount: ' + this.clickCount);
                        if (this.clickCount == 1 && this.entityCenter != null) {
                            this.setIcon(this.icoCenter);
                            this.callCorrectService(this.entityCenter);
                        } else if (this.clickCount == 2 && this.entityDouble != null) {
                            this.setIcon(this.icoDouble);
                            this.callCorrectService(this.entityDouble);
                        } else if (this.clickCount == 3 && this.entityTriple != null) {
                            this.setIcon(this.icoTriple);
                            this.callCorrectService(this.entityTriple);
                        } else if (this.clickCount == 4 && this.entityQuadruple != null) {
                            this.setIcon(this.icoQuadruple);
                            this.callCorrectService(this.entityQuadruple);
                        } else if (this.clickCount == 5 && this.entityFivefold != null) {
                            this.setIcon(this.icoFivefold);
                            this.callCorrectService(this.entityFivefold);
                        } else if (this.clickCount == 6 && this.entitySixfold != null) {
                            this.setIcon(this.icoSixfold);
                            this.callCorrectService(this.entitySixfold);
                        }
                        this.clickCount = 0;
                        clearInterval(this.handleClick);
                    }
                }, 20);
            }
        } else if (Math.abs(this.diffX) > Math.abs(this.diffY)) {
            if (this.diffX > 0) {
                console.log("swipe right");
                if (this.entityRight != null) {
                    this.setIcon(this.icoRight);
                    this.callCorrectService(this.entityRight);
                }
            } else {
                console.log("swipe left");
                if (this.entityLeft != null) {
                    this.setIcon(this.icoLeft);
                    this.callCorrectService(this.entityLeft);
                }
            }
        } else {
            if (this.diffY > 0) {
                console.log("swipe down");
                if (this.entityDown != null) {
                    this.setIcon(this.icoDown);
                    this.callCorrectService(this.entityDown);
                }
            } else {
                console.log("swipe up");
                if (this.entityUp != null) {
                    this.setIcon(this.icoUp);
                    this.callCorrectService(this.entityUp);
                }
            }
        }
        this.actionCounter++
        this.iconTimeout = setTimeout(() => {
            this.setIcon(this.icoDefault)
        }, 3000);
    }

    callCorrectService(id) {
        let parts = id.split(".");
        if (parts[0] == "button") {
            this._hass.callService('button', 'press', {entity_id: id});
        } else if (parts[0] == "script") {
            this._hass.callService('script', 'turn_on', {entity_id: id})
        } else {
            this._hass.callService(parts[0], 'toggle', {entity_id: id})
        }
    }

    handleEnd() {
        this.dragButton.style.cursor = 'pointer';
        if (this.isDragging) {
            this.isDragging = false;
            if (this.repeatAction == null)
                this.detectSwipeDirection( this.deadzone, 0);
            //console.log('Ende: ' + this.clickCount);
            clearInterval(this.repeatAction);
            clearInterval(this.repeatHoldDetection);
            clearInterval(this.interval);
            this.repeatAction = null;
            clearInterval(this.handleFadeOut);
            this.handleFadeOut = setInterval(() => {
                if (Date.now() - this.startTime >= 200) {
                    this.rippleElement.classList.remove('expanding');
                    this.rippleElement.style.width = this.newScale*this.rippleRadius*2 + 'px'
                    this.rippleElement.style.height = this.newScale*this.rippleRadius*2 + 'px'
                    this.rippleElement.style.left = this.offsetX - this.newScale*this.rippleRadius + 'px';
                    this.rippleElement.style.top = this.offsetY - this.newScale*this.rippleRadius + 'px';
                    this.rippleElement.style.transform = 'scale(1)'
                    this.rippleElement.style.opacity = '0';
                    clearInterval(this.handleFadeOut);
                }
            }, 20);
            this.easeOut(200);
        }
    }

    easeOut(duration) {
        const topValue = this.computedStyle.getPropertyValue("top");
        this.currentTop = parseInt(topValue, 10);
        const leftValue = this.computedStyle.getPropertyValue("left");
        this.currentLeft = parseInt(leftValue, 10);
        const distanceDiv = Math.sqrt(this.currentTop ** 2 + this.currentLeft ** 2);
        const steptime = 15;
        const loops = duration / steptime;
        const normalizedX = this.currentTop / distanceDiv;
        const normalizedY = this.currentLeft / distanceDiv;
        let i = 0;
        this.interval = setInterval(() => {
            let time = i / loops;
            let currentValue = (time - 1) ** 2;
            i++;
            //console.log(normalizedX * (currentValue * distanceDiv) + 'px')
            this.dragButton.style.top = normalizedX * (currentValue * distanceDiv) + 'px';
            this.dragButton.style.left = normalizedY * (currentValue * distanceDiv) + 'px';
            if (time >= 1) {
                this.dragButton.style.top = 0 + 'px';
                this.dragButton.style.left = 0 + 'px';
                this.dragButton.style.zIndex = '0';
                clearInterval(this.interval);
            }
        }, steptime);
    }

    setConfig(config) {
        //console.log("setConfig");
        //if (!config.entityLeft || !config.entityRight) {
        //    throw new Error("You need to define entityLeft and entityRight");
        //}
        this.entityUp = config.entityUp;
        this.entityDown = config.entityDown;
        this.entityLeft = config.entityLeft;
        this.entityRight = config.entityRight;
        this.entityCenter = config.entityCenter;
        this.entityHold = config.entityHold;
        this.entityDouble = config.entityDouble;
        this.entityTriple = config.entityTriple;
        this.entityQuadruple = config.entityQuadruple;
        this.entityFivefold = config.entityFivefold;
        this.entitySixfold = config.entitySixfold;
        
        this.icoDefault = config.icoDefault;
        this.icoUp = config.icoUp;
        this.icoRight = config.icoRight;
        this.icoDown = config.icoDown;
        this.icoLeft = config.icoLeft;
        this.icoCenter = config.icoCenter;
        this.icoHold = config.icoHold;
        this.icoDouble = config.icoDouble;
        this.icoTriple = config.icoTriple;
        this.icoQuadruple = config.icoQuadruple;
        this.icoFivefold = config.icoFivefold;
        this.icoSixfold = config.iconSixfold;

        this.maxDrag = config.maxDrag;                  //the maximum distance the button can be dragged in px
        this.stopSpeedFactor = config.stopSpeedFactor;  //the speed at which the button will reach its max drag distance
        this.repeatTime = config.repeatTime;            //rapid fire interval time in ms
        this.holdTime = config.holdTime;                //time until hold action gets activated in ms
        this.maxMultiClicks = config.maxMultiClicks;    //max amount of MultiClicks to register
        this.multiClickTime = config.multiClickTime;    //time between clicks to activate multi click in ms
        this.deadzone = config.deadzone;

        this.isStandalone = config.isStandalone;
        this.padding = config.padding;
        this.cardHeight = config.cardHeight;

        this.height = config.height;
        this.width = config.width;
        this.backgroundColor = config.backgroundColor;
        this.borderRadius = config.borderRadius;

        this.connectedCallback()
    }

    static getStubConfig(ha) {
        //console.log("getEditorConfig");
        return {
            type: 'custom:drag-card',
            entityLeft: 'button.ir_control_left',
            entityRight: 'button.ir_control_right',
            entityUp: 'button.ir_control_volume_up',
            entityDown: 'button.ir_control_volume_down',
            entityCenter: 'button.ir_control_enter',
            maxMultiClicks: '2',
            isStandalone: 'true',
        };
    }
}

customElements.define("drag-card", DragCard);

window.customCards = window.customCards || [];
window.customCards.push({
    type: 'drag-card',
    name: 'Drag Card',
    description: 'A custom button with multible funktions depending on the drag direction',
    preview: true,
});
