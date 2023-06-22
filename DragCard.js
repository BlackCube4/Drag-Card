class DragCard extends HTMLElement {
    constructor() {
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

        this.maxDrag = 100;         //the maximum distance the button can be dragged in px
        this.stopSpeedFactor = 1;   //the speed at which the button will reach its max drag distance
        this.repeatTime = 200;      //rapid fire interval time in ms
        this.holdTime = 800;        //time until hold action gets activated in ms
        this.multiClickTime = 300;  //time between clicks to activate multi click in ms
        this.maxMultiClicks = 2;    //max amount of MultiClicks to register
        this.deadzone = 30;         //distance in px until click action will be triggert
        this.lastClick = null;      //value to store the last click time
        this.lastClickType = null;
        this.stopSpeed = this.maxDrag * this.stopSpeedFactor;
    }

    set hass(hass) {
        this._hass = hass;
    }

    connectedCallback() {
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
                    border-radius: 10px;
                    top: 0px;
                    left: 0px;
                    width: 100%;
                    height: 100%;
                    background-color: #1D1E21;
                    box-shadow: var(--ha-card-box-shadow);
                    touch-action: none;
                    overflow: hidden;
                    cursor: pointer;
                    z-index: 1;
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
                #icon {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    height: 68%;
                    fill: rgb(255, 255, 255);
                    pointer-events: none;
                }
            </style>
            <!--<ha-card id="dragButtonContainer">-->
                <div id="dragButtonOrigin">
                    <div id="dragButton">
                        <div id="ripple"></div>
                        <svg id="icon" viewBox="0 0 24 24"><path d="M14 12L10 8V11H2V13H10V16M22 12A10 10 0 0 1 2.46 15H4.59A8 8 0 1 0 4.59 9H2.46A10 10 0 0 1 22 12Z" /></svg>
                        <!--<img src="/local/icons/power_on.svg" alt="Image">-->
                    </div>
                </div>
            <!--</ha-card>-->
        `;
        this.divElement = this.querySelector("#dragButton");
        this.rippleElement = this.querySelector("#ripple");
        this.icon = this.querySelector("#icon");
        this.computedStyle = window.getComputedStyle(this.divElement);
        this.rippleComputedStyle = window.getComputedStyle(this.rippleElement);
        this.addEventListeners();
    }

    addEventListeners() {
        this.divElement.addEventListener("touchstart", this.handleTouchStart.bind(this), { passive: true });
        this.divElement.addEventListener("touchmove", this.handleTouchMove.bind(this), { passive: true });
        this.divElement.addEventListener("touchend", this.handleTouchEnd.bind(this), { passive: true });
        this.divElement.addEventListener("mousedown", this.handleMouseDown.bind(this));
        document.addEventListener("mousemove", this.handleMouseMove.bind(this));
        document.addEventListener("mouseup", this.handleMouseUp.bind(this));
    }

    handleTouchStart(event) {
        event = event.touches[0];
        this.offsetX = event.clientX - this.divElement.offsetLeft;
        this.offsetY = event.clientY - this.divElement.offsetTop;
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
        this.diffX = this.currentX - this.initialX;
        this.diffY = this.currentY - this.initialY;
        this.distanceMouse = Math.sqrt(this.diffX ** 2 + this.diffY ** 2);
        const normalizedX = this.diffX / this.distanceMouse;
        const normalizedY = this.diffY / this.distanceMouse;
        const dragDistance = (1-(this.stopSpeed / (this.distanceMouse + this.stopSpeed))) * this.maxDrag;
        this.divElement.style.cursor = 'grabbing';
        this.divElement.style.top = normalizedY * dragDistance + 'px';
        this.divElement.style.left = normalizedX * dragDistance + 'px';
    }

    detectSwipeDirection(deadzone, holdMode) {
        //console.log(this.distanceMouse);
        if (this.distanceMouse < deadzone) {
            //console.log(Date.now() - this.startTime + "time " + this.holdTime + "hold");
            this.icon.innerHTML = '<path d="M14 12L10 8V11H2V13H10V16M22 12A10 10 0 0 1 2.46 15H4.59A8 8 0 1 0 4.59 9H2.46A10 10 0 0 1 22 12Z"/>';
            if (holdMode == true && this.actionCounter == 0) {
                console.log("hold");
                if (this.entityHold != null)
                    this._hass.callService('button', 'press', {entity_id: this.entityHold,});
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
                            this._hass.callService('button', 'press', {entity_id: this.entityCenter,});
                        } else if (this.clickCount == 2 && this.entityDouble != null)
                            this._hass.callService('button', 'press', {entity_id: this.entityDouble,});
                        else if (this.clickCount == 3 && this.entityTriple != null)
                            this._hass.callService('button', 'press', {entity_id: this.entityTriple,});
                        else if (this.clickCount == 4 && this.entityQuadruple != null)
                            this._hass.callService('button', 'press', {entity_id: this.entityQuadruple,});
                        else if (this.clickCount == 5 && this.entityFivefold != null)
                            this._hass.callService('button', 'press', {entity_id: this.entityFivefold,});
                        else if (this.clickCount == 6 && this.entitySixfold != null)
                            this._hass.callService('button', 'press', {entity_id: this.entitySixfold,});
                        this.clickCount = 0;
                        clearInterval(this.handleClick);
                    }
                }, 20);
            }
        } else if (Math.abs(this.diffX) > Math.abs(this.diffY)) {
            if (this.diffX > 0) {
                console.log("swipe right");
                this.icon.innerHTML = '<path d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z"/>';
                if (this.entityRight != null)
                    this._hass.callService('button', 'press', {entity_id: this.entityRight,});
            } else {
                console.log("swipe left");
                this.icon.innerHTML = '<path d="M15.41,16.58L10.83,12L15.41,7.41L14,6L8,12L14,18L15.41,16.58Z"/>';
                if (this.entityLeft != null)
                    this._hass.callService('button', 'press', {entity_id: this.entityLeft,});
            }
        } else {
            if (this.diffY > 0) {
                console.log("swipe down");
                this.icon.innerHTML = '<path d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z"/>';
                if (this.entityDown != null)
                    this._hass.callService('button', 'press', {entity_id: this.entityDown,});
            } else {
                console.log("swipe up");
                this.icon.innerHTML = '<path d="M7.41,15.41L12,10.83L16.59,15.41L18,14L12,8L6,14L7.41,15.41Z"/>';
                if (this.entityUp != null)
                    this._hass.callService('button', 'press', {entity_id: this.entityUp,});
            }
        }
        this.actionCounter++
    }

    handleEnd() {
        this.divElement.style.cursor = 'pointer';
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
            this.divElement.style.top = normalizedX * (currentValue * distanceDiv) + 'px';
            this.divElement.style.left = normalizedY * (currentValue * distanceDiv) + 'px';
            if (time >= 1) {
                this.divElement.style.top = 0 + 'px';
                this.divElement.style.left = 0 + 'px';
                clearInterval(this.interval);
            }
        }, steptime);
    }

    setConfig(config) {
        if (!config.entityLeft || !config.entityRight) {
            throw new Error("You need to define entityLeft and entityRight");
        }
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

        this.maxMultiClicks = config.maxMultiClicks;

        this.upIcon = config.upIcon;
        this.downIcon = config.downIcon;
        this.leftIcon = config.leftIcon;
        this.rightIcon = config.rightIcon;
    }

    static getEditorConfig() {
        return {
            type: 'entity',
            name: 'Drag Card',
            icon: 'mdi:arrow-expand-all',
            config: {
                entity1: '',
                entity2: ''
            },
        };
    }

    static getStubConfig(ha) {
        return {
            type: 'custom:drag-card',
            entityLeft: 'button.ir_control_left',
            entityRight: 'button.ir_control_right',
            entityUp: 'button.ir_control_volume_up',
            entityDown: 'button.ir_control_volume_down',
            entityCenter: 'button.ir_control_enter',
            maxMultiClicks: '2',
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