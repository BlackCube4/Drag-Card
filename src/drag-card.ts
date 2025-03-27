interface DragCardConfig {
    entityUp?: string;
    entityDown?: string;
    entityLeft?: string;
    entityRight?: string;
    entityCenter?: string;
    entityHold?: string;
    entityDouble?: string;
    entityTriple?: string;
    entityQuadruple?: string;
    entityFivefold?: string;
    entitySixfold?: string;

    icoDefault?: string;
    icoUp?: string;
    icoRight?: string;
    icoDown?: string;
    icoLeft?: string;
    icoCenter?: string;
    icoHold?: string;
    icoDouble?: string;
    icoTriple?: string;
    icoQuadruple?: string;
    icoFivefold?: string;
    iconSixfold?: string;

    maxDrag?: number;
    stopSpeedFactor?: number;
    repeatTime?: number;
    holdTime?: number;
    maxMultiClicks?: number;
    multiClickTime?: number;
    deadzone?: number;

    isStandalone?: boolean;
    padding?: string;
    cardHeight?: string;

    height?: string;
    width?: string;
    backgroundColor?: string;
    borderRadius?: string;

    iconSize?: string;
}

interface HomeAssistant {
    callService: (domain: string, service: string, data: { entity_id: string }) => Promise<void>;
}

class DragCard extends HTMLElement {
    static getConfigElement(): HTMLElement {
        return document.createElement('drag-card-editor');
    }
    private _hass: HomeAssistant | null = null;
    private isDragging: boolean = false;
    private initialX: number = 0;
    private initialY: number = 0;
    private currentX: number = 0;
    private currentY: number = 0;
    private diffX: number = 0;
    private diffY: number = 0;
    private offsetX: number = 0;
    private offsetY: number = 0;
    private actionCounter: number = 0;
    private distanceMouse: number = 0;
    private clickCount: number = 0;
    private lastClick: number | null = null;
    private lastClickType: Event | null = null;

    // Configuration properties
    private entityUp: string | null = null;
    private entityDown: string | null = null;
    private entityLeft: string | null = null;
    private entityRight: string | null = null;
    private entityCenter: string | null = null;
    private entityHold: string | null = null;
    private entityDouble: string | null = null;
    private entityTriple: string | null = null;
    private entityQuadruple: string | null = null;
    private entityFivefold: string | null = null;
    private entitySixfold: string | null = null;

    // Icon properties
    private icoDefault: string | null = null;
    private icoUp: string | null = null;
    private icoRight: string | null = null;
    private icoDown: string | null = null;
    private icoLeft: string | null = null;
    private icoCenter: string | null = null;
    private icoHold: string | null = null;
    private icoDouble: string | null = null;
    private icoTriple: string | null = null;
    private icoQuadruple: string | null = null;
    private icoFivefold: string | null = null;
    private icoSixfold: string | null = null;

    // Drag and interaction properties
    private maxDrag: number = 100;
    private stopSpeedFactor: number = 1;
    private repeatTime: number = 200;
    private holdTime: number = 800;
    private maxMultiClicks: number = 2;
    private multiClickTime: number = 300;
    private deadzone: number = 20;
    private stopSpeed: number = 0;

    // UI properties
    private isStandalone: boolean = false;
    private padding: string | null = null;
    private cardHeight: string | null = null;
    private height: string | null = null;
    private width: string | null = null;
    private backgroundColor: string | null = null;
    private borderRadius: string | null = null;
    private iconSize: string = "80%";

    // DOM elements
    private card: HTMLElement | null = null;
    private dragButtonOrigin: HTMLElement | null = null;
    private dragButton: HTMLElement | null = null;
    private rippleElement: HTMLElement | null = null;
    private computedStyle: CSSStyleDeclaration | null = null;
    private rippleComputedStyle: CSSStyleDeclaration | null = null;
    private iconContainer: HTMLElement | null = null;

    // Intervals and timeouts
    private repeatHoldDetection: number | null = null;
    private repeatAction: number | null = null;
    private handleClick: number | null = null;
    private handleFadeOut: number | null = null;
    private interval: number | null = null;
    private iconTimeout: number | null = null;

    // Typing additional properties
    private startTime: number = 0;
    private rippleRadius: number = 0;
    private newScale: number = 0;
    private currentTop: number = 0;
    private currentLeft: number = 0;

    constructor() {
        super();
        this.stopSpeed = this.maxDrag * this.stopSpeedFactor;
    }

    set hass(hass: HomeAssistant) {
        this._hass = hass;
    }

    connectedCallback(): void {
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
                    width: ${this.iconSize};
                    height: ${this.iconSize};
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
        this.dragButtonOrigin = this.querySelector("#dragButtonOrigin");
        this.dragButton = this.querySelector("#dragButton");
        this.rippleElement = this.querySelector("#ripple");
        this.iconContainer = this.querySelector("#iconContainer");

        if (!this.card || !this.dragButtonOrigin || !this.dragButton || !this.rippleElement || !this.iconContainer) return;

        if (this.cardHeight != null) {
            this.card.style.height = this.cardHeight;
        }
        if (this.padding != null) {
            this.card.style.padding = this.padding;
        }
        
        if (this.isStandalone == false) {
            this.card.outerHTML = this.card.innerHTML;
        }
        
        if (this.maxDrag == null) { this.maxDrag = 100; }
        if (this.stopSpeedFactor == null) { this.stopSpeedFactor = 1; }
        if (this.repeatTime == null) { this.repeatTime = 200; }
        if (this.holdTime == null) { this.holdTime = 800; }
        if (this.maxMultiClicks == null) { this.maxMultiClicks = 2; }
        if (this.multiClickTime == null) { this.multiClickTime = 300; }
        if (this.deadzone == null) { this.deadzone = 20; }
        
        this.stopSpeed = this.maxDrag * this.stopSpeedFactor;

        if (this.height != null) { this.dragButtonOrigin.style.height = this.height; }
        if (this.width != null) { this.dragButtonOrigin.style.width = this.width; }

        if (this.backgroundColor != null) { this.dragButton.style.backgroundColor = this.backgroundColor; }
        if (this.borderRadius != null) { this.dragButton.style.borderRadius = this.borderRadius; }

        if (this.icoDefault != null) {
            this.setIcon(this.icoDefault);
        } else if (this.icoCenter != null) {
            this.setIcon(this.icoCenter);
        } else {
            this.setIcon('mdi:alert');
        }

        this.computedStyle = window.getComputedStyle(this.dragButton);
        this.rippleComputedStyle = window.getComputedStyle(this.rippleElement);
        this.addEventListeners();
    }

    setIcon(icon: string | null): void {
        if (!this.iconContainer) return;
        if (icon != null) {
            if (icon.startsWith("/local/")) {
                this.iconContainer.outerHTML = '<div id="iconContainer"><img id="image" src="' + icon + '" alt="Image"></img></div>';
            } else {
                this.iconContainer.outerHTML = '<div id="iconContainer"><ha-icon id="icon" icon="' + icon + '"></ha-icon></div>';
            }
        }
    }

    addEventListeners(): void {
        if (!this.dragButton) return;
        this.dragButton.addEventListener("touchstart", this.handleTouchStart.bind(this), { passive: true });
        this.dragButton.addEventListener("touchmove", this.handleTouchMove.bind(this), { passive: true });
        this.dragButton.addEventListener("touchend", this.handleTouchEnd.bind(this), { passive: true });
        this.dragButton.addEventListener("mousedown", this.handleMouseDown.bind(this));
        document.addEventListener("mousemove", this.handleMouseMove.bind(this));
        document.addEventListener("mouseup", this.handleMouseUp.bind(this));
    }

    handleTouchStart(event: TouchEvent): void {
        const touch = event.touches[0];
        if (!this.dragButton) return;
        this.offsetX = touch.clientX - this.dragButton.offsetLeft;
        this.offsetY = touch.clientY - this.dragButton.offsetTop;
        this.handleStart(touch);
    }

    handleTouchMove(event: TouchEvent): void {
        if (this.isDragging) {
            this.currentX = event.touches[0].clientX;
            this.currentY = event.touches[0].clientY;
            this.handleDrag();
        }
    }

    handleTouchEnd(event: TouchEvent): void {
        this.lastClickType = event;
        this.handleEnd();
    }

    handleMouseDown(event: MouseEvent): void {
        if (Date.now() - (this.lastClick || 0) < 200 && this.lastClickType instanceof TouchEvent)
            return;
        if (!this.dragButton) return;
        this.offsetX = event.offsetX;
        this.offsetY = event.offsetY;
        this.handleStart(event);
    }

    handleMouseMove(event: MouseEvent): void {
        if (this.isDragging) {
            this.currentX = event.clientX;
            this.currentY = event.clientY;
            this.handleDrag();
        }
    }

    handleMouseUp(event: MouseEvent): void { 
        this.handleEnd(); 
    }

    handleStart(event: MouseEvent | Touch): void {
        if (!this.dragButton || !this.rippleElement || !this.computedStyle) return;
        
        this.dragButton.style.zIndex = '1';
        this.initialX = event.clientX;
        this.initialY = event.clientY;

        const buttonWidth = parseInt(this.computedStyle.getPropertyValue("width"), 10);
        const buttonHeight = parseInt(this.computedStyle.getPropertyValue("height"), 10);

        this.rippleRadius = buttonWidth < buttonHeight 
            ? buttonHeight * 0.2 
            : buttonWidth * 0.2;

        this.rippleElement.style.left = `${this.offsetX - this.rippleRadius}px`;
        this.rippleElement.style.top = `${this.offsetY - this.rippleRadius}px`;
        this.rippleElement.style.width = `${this.rippleRadius * 2}px`;
        this.rippleElement.style.height = `${this.rippleRadius * 2}px`;

        let distEdge: number;
        if (this.offsetX > buttonWidth / 2) {
            if (this.offsetY > buttonHeight / 2)
                distEdge = Math.sqrt((0 - this.offsetX) ** 2 + (0 - this.offsetY) ** 2);
            else
                distEdge = Math.sqrt((0 - this.offsetX) ** 2 + (buttonHeight - this.offsetY) ** 2);
        } else {
            if (this.offsetY > buttonHeight / 2)
                distEdge = Math.sqrt((buttonWidth - this.offsetX) ** 2 + (0 - this.offsetY) ** 2);
            else
                distEdge = Math.sqrt((buttonWidth - this.offsetX) ** 2 + (buttonHeight - this.offsetY) ** 2);
        }

        this.newScale = distEdge / this.rippleRadius;
        
        this.rippleElement.classList.add('expanding');
        this.rippleElement.style.opacity = '0.06';
        this.rippleElement.style.transform = `scale(${this.newScale})`;

        this.isDragging = true;
        this.actionCounter = 0;
        this.distanceMouse = 0;
        this.diffX = 0;
        this.diffY = 0;
        this.startTime = Date.now();

        this.repeatHoldDetection = window.setInterval(() => {
            if (Date.now() - this.startTime >= this.holdTime) {
                this.repeatAction = window.setInterval(() => {
                    this.detectSwipeDirection(this.deadzone * 2, 1);
                }, this.repeatTime);
                if (this.repeatHoldDetection) clearInterval(this.repeatHoldDetection);
            }
        }, 60);
    }

    handleDrag(): void {
        if (!this.dragButton) return;
        
        this.dragButton.style.zIndex = '1';
        this.diffX = this.currentX - this.initialX;
        this.diffY = this.currentY - this.initialY;
        this.distanceMouse = Math.sqrt(this.diffX ** 2 + this.diffY ** 2);
        const normalizedX = this.diffX / this.distanceMouse;
        const normalizedY = this.diffY / this.distanceMouse;
        const dragDistance = (1 - (this.stopSpeed / (this.distanceMouse + this.stopSpeed))) * this.maxDrag;
        this.dragButton.style.cursor = 'grabbing';

        if ((normalizedY > 0 && this.entityDown != null) || (normalizedY < 0 && this.entityUp != null)) {
            this.dragButton.style.top = `${normalizedY * dragDistance}px`;
        } else {
            this.dragButton.style.top = '0px';
        }
        if ((normalizedX > 0 && this.entityRight != null) || (normalizedX < 0 && this.entityLeft != null)) {
            this.dragButton.style.left = `${normalizedX * dragDistance}px`;
        } else {
            this.dragButton.style.left = '0px';
        }
    }

    detectSwipeDirection(deadzone: number, holdMode: number): void {
        if (!this.dragButton) return;
        
        if (this.iconTimeout) clearTimeout(this.iconTimeout);

        if (this.distanceMouse < deadzone) {
            if (holdMode == 1 && this.actionCounter == 0) {
                console.log("hold");
                if (this.entityHold != null) {
                    this.setIcon(this.icoHold);
                    this.callCorrectService(this.entityHold);
                }
                this.handleEnd();
            }
            if (holdMode == 0) {
                this.clickCount++;
                this.lastClick = Date.now();
                if (this.handleClick) clearInterval(this.handleClick);
                this.handleClick = window.setInterval(() => {
                    if (Date.now() - (this.lastClick || 0) >= this.multiClickTime || this.clickCount == this.maxMultiClicks) {
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
                        if (this.handleClick) clearInterval(this.handleClick);
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
        this.actionCounter++;
        this.iconTimeout = window.setTimeout(() => {
            this.setIcon(this.icoDefault);
        }, 3000);
    }

    callCorrectService(id: string): void {
        const parts = id.split(".");
        if (!this._hass) return;

        if (parts[0] === "button") {
            this._hass.callService('button', 'press', { entity_id: id });
        } else if (parts[0] === "script") {
            this._hass.callService('script', 'turn_on', { entity_id: id });
        } else {
            this._hass.callService(parts[0], 'toggle', { entity_id: id });
        }
    }

    handleEnd(): void {
        if (!this.dragButton || !this.rippleElement) return;
        
        this.dragButton.style.cursor = 'pointer';
        if (this.isDragging) {
            this.isDragging = false;
            if (this.repeatAction == null)
                this.detectSwipeDirection(this.deadzone, 0);
            
            if (this.repeatAction) clearInterval(this.repeatAction);
            if (this.repeatHoldDetection) clearInterval(this.repeatHoldDetection);
            if (this.interval) clearInterval(this.interval);
            this.repeatAction = null;
            if (this.handleFadeOut) clearInterval(this.handleFadeOut);
            
            this.handleFadeOut = window.setInterval(() => {
                if (Date.now() - this.startTime >= 200) {
                    this.rippleElement?.classList.remove('expanding');
                    if (this.rippleElement) {
                        this.rippleElement.style.width = `${this.newScale * this.rippleRadius * 2}px`;
                        this.rippleElement.style.height = `${this.newScale * this.rippleRadius * 2}px`;
                        this.rippleElement.style.left = `${this.offsetX - this.newScale * this.rippleRadius}px`;
                        this.rippleElement.style.top = `${this.offsetY - this.newScale * this.rippleRadius}px`;
                        this.rippleElement.style.transform = 'scale(1)';
                        this.rippleElement.style.opacity = '0';
                    }
                    if (this.handleFadeOut) clearInterval(this.handleFadeOut);
                }
            }, 20);
            this.easeOut(200);
        }
    }

    easeOut(duration: number): void {
        if (!this.dragButton || !this.computedStyle) return;
        
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
        
        this.interval = window.setInterval(() => {
            let time = i / loops;
            let currentValue = (time - 1) ** 2;
            i++;
            
            this.dragButton!.style.top = `${normalizedX * (currentValue * distanceDiv)}px`;
            this.dragButton!.style.left = `${normalizedY * (currentValue * distanceDiv)}px`;
            
            if (time >= 1) {
                this.dragButton!.style.top = '0px';
                this.dragButton!.style.left = '0px';
                this.dragButton!.style.zIndex = '0';
                if (this.interval) clearInterval(this.interval);
            }
        }, steptime);
    }

    setConfig(config: DragCardConfig): void {
        this.entityUp = config.entityUp ?? null;
        this.entityDown = config.entityDown ?? null;
        this.entityLeft = config.entityLeft ?? null;
        this.entityRight = config.entityRight ?? null;
        this.entityCenter = config.entityCenter ?? null;
        this.entityHold = config.entityHold ?? null;
        this.entityDouble = config.entityDouble ?? null;
        this.entityTriple = config.entityTriple ?? null;
        this.entityQuadruple = config.entityQuadruple ?? null;
        this.entityFivefold = config.entityFivefold ?? null;
        this.entitySixfold = config.entitySixfold ?? null;
        
        this.icoDefault = config.icoDefault ?? null;
        this.icoUp = config.icoUp ?? null;
        this.icoRight = config.icoRight ?? null;
        this.icoDown = config.icoDown ?? null;
        this.icoLeft = config.icoLeft ?? null;
        this.icoCenter = config.icoCenter ?? null;
        this.icoHold = config.icoHold ?? null;
        this.icoDouble = config.icoDouble ?? null;
        this.icoTriple = config.icoTriple ?? null;
        this.icoQuadruple = config.icoQuadruple ?? null;
        this.icoFivefold = config.icoFivefold ?? null;
        this.icoSixfold = config.iconSixfold ?? null;

        this.maxDrag = config.maxDrag ?? 100;
        this.stopSpeedFactor = config.stopSpeedFactor ?? 1;
        this.repeatTime = config.repeatTime ?? 200;
        this.holdTime = config.holdTime ?? 800;
        this.maxMultiClicks = config.maxMultiClicks ?? 2;
        this.multiClickTime = config.multiClickTime ?? 300;
        this.deadzone = config.deadzone ?? 20;

        this.isStandalone = config.isStandalone ?? false;
        this.padding = config.padding ?? null;
        this.cardHeight = config.cardHeight ?? null;
        this.height = config.height ?? null;
        this.width = config.width ?? null;
        this.backgroundColor = config.backgroundColor ?? null;
        this.borderRadius = config.borderRadius ?? null;
        this.iconSize = config.iconSize ?? "80%";

        this.connectedCallback();
    }

    static getStubConfig(ha: any): DragCardConfig {
        return {
            entityLeft: 'button.ir_control_left',
            entityRight: 'button.ir_control_right',
            entityUp: 'button.ir_control_volume_up',
            entityDown: 'button.ir_control_volume_down',
            entityCenter: 'button.ir_control_enter',
            maxMultiClicks: 2,
            isStandalone: true,
            icoDefault: "mdi:drag-variant",
        };
    }
}








class DragCardEditor extends HTMLElement {
    private _config?: DragCardConfig;
    private _hass?: any;
  
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
    }
  
    setConfig(config: DragCardConfig) {
      this._config = config;
      this.render();
    }
  
    set hass(hass: any) {
      this._hass = hass;
      this.render();
    }
  
    render() {
      if (!this.shadowRoot || !this._config) return;
  
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            padding: 10px;
          }
          .config-container {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }
          .config-section {
            border: 1px solid var(--divider-color, #e0e0e0);
            border-radius: 4px;
            padding: 16px;
          }
          .config-section h3 {
            margin: 0 0 16px 0;
            font-size: 16px;
            border-bottom: 1px solid var(--divider-color, #e0e0e0);
            padding-bottom: 8px;
          }
          .config-row {
            display: flex;
            flex-direction: column;
            margin-bottom: 16px;
          }
          ha-entity-picker,
          ha-icon-picker,
          paper-input {
            width: 100%;
          }
          ha-formfield {
            display: flex;
            align-items: center;
          }
        </style>
        <div class="config-container">
          <div class="config-section">
            <h3>Card Settings</h3>
            <div class="config-row">
              <ha-formfield label="Standalone Card">
                <ha-switch
                  id="standalone-switch"
                  .checked="${this._config.isStandalone ?? false}"
                ></ha-switch>
              </ha-formfield>
            </div>
          </div>
  
          <div class="config-section">
            <h3>Entities</h3>
            <div class="config-row">
              <ha-entity-picker
                id="entity-center"
                label="Center Click Entity"
                .hass="${this._hass}"
                .value="${this._config.entityCenter ?? ''}"
                .includeDomains="${JSON.stringify(['button', 'script', 'light', 'switch', 'input_button'])}"
              ></ha-entity-picker>
            </div>
            <div class="config-row">
              <ha-entity-picker
                id="entity-up"
                label="Swipe Up Entity"
                .hass="${this._hass}"
                .value="${this._config.entityUp ?? ''}"
                .includeDomains="${JSON.stringify(['button', 'script', 'light', 'switch', 'input_button'])}"
              ></ha-entity-picker>
            </div>
            <div class="config-row">
              <ha-entity-picker
                id="entity-down"
                label="Swipe Down Entity"
                .hass="${this._hass}"
                .value="${this._config.entityDown ?? ''}"
                .includeDomains="${JSON.stringify(['button', 'script', 'light', 'switch', 'input_button'])}"
              ></ha-entity-picker>
            </div>
            <div class="config-row">
              <ha-entity-picker
                id="entity-left"
                label="Swipe Left Entity"
                .hass="${this._hass}"
                .value="${this._config.entityLeft ?? ''}"
                .includeDomains="${JSON.stringify(['button', 'script', 'light', 'switch', 'input_button'])}"
              ></ha-entity-picker>
            </div>
            <div class="config-row">
              <ha-entity-picker
                id="entity-right"
                label="Swipe Right Entity"
                .hass="${this._hass}"
                .value="${this._config.entityRight ?? ''}"
                .includeDomains="${JSON.stringify(['button', 'script', 'light', 'switch', 'input_button'])}"
              ></ha-entity-picker>
            </div>
            <div class="config-row">
              <ha-entity-picker
                id="entity-hold"
                label="Hold Entity"
                .hass="${this._hass}"
                .value="${this._config.entityHold ?? ''}"
                .includeDomains="${JSON.stringify(['button', 'script', 'light', 'switch', 'input_button'])}"
              ></ha-entity-picker>
            </div>
          </div>
  
          <div class="config-section">
            <h3>Icons</h3>
            <div class="config-row">
              <ha-icon-picker
                id="icon-default"
                label="Default Icon"
                .value="${this._config.icoDefault ?? 'mdi:drag-variant'}"
              ></ha-icon-picker>
            </div>
            <div class="config-row">
              <ha-icon-picker
                id="icon-center"
                label="Center Icon"
                .value="${this._config.icoCenter ?? ''}"
              ></ha-icon-picker>
            </div>
          </div>
  
          <div class="config-section">
            <h3>Advanced Settings</h3>
            <div class="config-row">
              <paper-input
                id="max-drag"
                label="Max Drag Distance (px)"
                type="number"
                .value="${this._config.maxDrag ?? 100}"
              ></paper-input>
            </div>
            <div class="config-row">
              <paper-input
                id="deadzone"
                label="Deadzone (px)"
                type="number"
                .value="${this._config.deadzone ?? 20}"
              ></paper-input>
            </div>
          </div>
        </div>
      `;
  
      this.addEventListeners();
    }
  
    private addEventListeners() {
      if (!this.shadowRoot) return;
  
      // Standalone switch
      const standaloneSwitch = this.shadowRoot.querySelector('#standalone-switch') as any;
      if (standaloneSwitch) {
        standaloneSwitch.addEventListener('change', (ev: Event) => this._valueChanged(ev, 'isStandalone'));
      }
  
      // Entity pickers
      const entityIds = [
        'entity-center', 'entity-up', 'entity-down', 
        'entity-left', 'entity-right', 'entity-hold'
      ];
      entityIds.forEach(id => {
        const entityPicker = this.shadowRoot!.querySelector(`#${id}`) as any;
        if (entityPicker) {
          const configKey = id.replace('entity-', 'entity') as keyof DragCardConfig;
          entityPicker.addEventListener('value-changed', (ev: Event) => this._valueChanged(ev, configKey));
        }
      });
  
      // Icon pickers
      const iconIds = ['icon-default', 'icon-center'];
      iconIds.forEach(id => {
        const iconPicker = this.shadowRoot!.querySelector(`#${id}`) as any;
        if (iconPicker) {
          const configKey = id.replace('icon-', 'ico') as keyof DragCardConfig;
          iconPicker.addEventListener('value-changed', (ev: Event) => this._valueChanged(ev, configKey));
        }
      });
  
      // Paper inputs
      const inputIds = ['max-drag', 'deadzone'];
      inputIds.forEach(id => {
        const input = this.shadowRoot!.querySelector(`#${id}`) as any;
        if (input) {
          const configKey = id.replace('-', '') as keyof DragCardConfig;
          input.addEventListener('value-changed', (ev: Event) => this._valueChanged(ev, configKey));
        }
      });
    }
  
    private _valueChanged(ev: Event, key: keyof DragCardConfig) {
      if (!this._config) return;
  
      const target = ev.target as any;
      const value = target.checked !== undefined ? target.checked : target.value;
      
      if (this._config[key] === value) return;
  
      const newConfig = {
        ...this._config,
        [key]: value,
      };
  
      this._config = newConfig;
  
      this.dispatchEvent(
        new CustomEvent("config-changed", {
          detail: { config: newConfig },
          bubbles: true,
          composed: true
        })
      );
    }
  }

customElements.define("drag-card", DragCard);
customElements.define('drag-card-editor', DragCardEditor);

// Update card registration
(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: 'drag-card',
  name: 'Drag Card',
  description: 'A custom button with multiple functions depending on the drag direction',
  preview: true,
  configurable: true, // This enables the visual editor
  documentationURL: 'https://github.com/your-repo/drag-card'
});