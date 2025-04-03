import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { HomeAssistant } from 'custom-card-helpers';
import { fireEvent } from 'custom-card-helpers';

// These are the variables that can be configured by the visual config and are edited by the card
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

    lockNonEntityDirs?: boolean;
    maxDrag?: number;                   // The maximum distance the button can be dragged in px
    returnTime?: number;                // Return animation duration in ms
    springDamping?: number;             // Controls how bouncy the spring is (>=2 -> switch to different function without bounce at all)

    repeatTime?: number;                // rapid fire interval time in ms
    holdTime?: number;                  // time until hold action gets activated in ms
    multiClickTime?: number;            // time between clicks to activate multi click in ms
    deadzone?: number;

    padding?: string;
    cardWidth?: string;
    cardHeight?: string;

    cardBackgroundColor?: string;
    cardBorderRadius?: string;
    cardBoxShadow?: string;

    buttonWidth?: string;
    buttonHeight?: string;

    buttonBackgroundColor?: string;
    buttonBorderRadius?: string;
    buttonBoxShadow?: string;

    iconLargerOnClick?: boolean;
    buttonSmallerOnClick?: boolean;

    iconSize?: string;
}

@customElement('drag-card')
export class DragCard extends LitElement {
    @property({ attribute: false }) 
    hass?: HomeAssistant;

    @state()
    private currentIcon = '';
    @state()
    private config!: DragCardConfig;

    private buttonRealPos = { x: 0, y: 0 };             // "Real" position (without scaling)
    private mouseOffset = { x: 0, y: 0 };               // Mouse offset
    private buttonOrigin = { x: 0, y: 0 };              // Original position
    
    private distance = 0;
    private actionCounter = 0;
    private clickCount = 0;
    private lastClick: number | null = null;
    private maxMultiClicks = 1;
    private isHoldAction = false;

    private transitioned: number | null = null;

    private holdDetection: number | null = null;
    private repeatAction: number | null = null;
    private handleClick: number | null = null;
    private iconTimeout: number | null = null;
    private animationFrameID: number | null = null;

    private button!: HTMLElement;
    private visualButton!: HTMLElement;
    private iconContainer!: HTMLElement;
    private hover!: HTMLElement;
    private ripple!: HTMLElement;

    private boundDragHandler = this.drag.bind(this);
    private boundEndDragHandler = this.endDrag.bind(this);

    firstUpdated() {
        this.button = this.shadowRoot!.querySelector('.drag-button') as HTMLElement;
        this.visualButton = this.button.querySelector('.drag-button-visual') as HTMLElement;
        this.iconContainer = this.button.querySelector('.icon-container') as HTMLElement;
        this.hover = this.button.querySelector('.hover') as HTMLElement;
        this.ripple = this.button.querySelector('.ripple') as HTMLElement;
        this.initOrigin();
    }

    // Here is the css - style part of the code
    static styles = css`
        ha-card {
            padding: var(--drag-card-padding);
            height: var(--drag-card-height);
            width: var(--drag-card-width);

            background-color: var(--drag-card-background-color, var(--ha-card-background, var(--card-background-color)));
            border-radius: var(--drag-card-border-radius, var(--ha-card-border-radius));
            box-shadow: var(--drag-card-box-shadow, var(--ha-card-box-shadow));

            display: flex;
            justify-content: center;
            align-items: center;
        }

        .drag-button {
            position: relative;
            left: 0;
            top: 0;
            height: var(--drag-button-height);
            width: var(--drag-button-width);

            touch-action: none;
            z-index: 0;
            -webkit-tap-highlight-color: transparent;
        }

        .drag-button-visual {
            height: 100%;
            width: 100%;
            position: relative;

            background-color: var(--drag-button-background-color, var(--ha-card-background, var(--card-background-color)));
            border-radius: var(--drag-button-border-radius, var(--ha-card-border-radius));
            box-shadow: var(--drag-button-box-shadow, var(--ha-card-box-shadow));

            transition: transform 0.1s ease;
            overflow: hidden;
            cursor: pointer;
        }

        .hover {
            left: 0;
            top: 0;
            position: absolute;
            width: 100%;
            height: 100%;
            background-color: rgb(255, 255, 255);
            opacity: 0;
            transition: opacity 0.1s ease;
        }
        @media (hover: hover) {
            .hover:hover {
                opacity: 0.01 !important;
            }
        }

        .ripple {
            left: 0;
            top: 0;
            position: absolute;
            border-radius: 50%;
            background-color: rgb(255, 255, 255);
            opacity: 0;
            pointer-events: none;
            /* box-shadow: 0 0 40px 40px rgb(255, 255, 255); //offset-x offset-y softness shadow-size color; */
            transform: scale(1);
        }
        
        .icon-container {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100%;
            height: 100%;
            transition: transform 0.1s ease;
        }

        .icon {
            width: var(--drag-card-icon-size);
            height: var(--drag-card-icon-size);
            --mdc-icon-size: 100%;
        }

        .image {
            object-fit: contain;
            width: var(--drag-card-icon-size);
            height: var(--drag-card-icon-size);
        }
    `;

    // Default configuration for values that are not modified by the user
    // This method is called when:
    //   1. The card is first loaded with its configuration
    //   2. The configuration is updated (e.g., through the card editor)
    //   3. The card is restored from the dashboard

    setConfig(config: DragCardConfig) {
        if (!config) throw new Error('Invalid configuration');

        this.config = {
            maxDrag: 100,
            returnTime: 200,
            springDamping: 2,
            repeatTime: 200,
            holdTime: 800,
            multiClickTime: 300,
            deadzone: 20,
            lockNonEntityDirs: true,
            iconLargerOnClick: false,
            buttonSmallerOnClick: true,
            ...config
        };

        this.style.setProperty('--drag-card-padding', this.config.padding ?? '15px');
        this.style.setProperty('--drag-card-width', this.config.cardWidth ?? '100%');
        this.style.setProperty('--drag-card-height', this.config.cardHeight ?? '150px');

        if (this.config.cardBackgroundColor) { this.style.setProperty('--drag-card-background-color', this.config.cardBackgroundColor); }
        if (this.config.cardBorderRadius) { this.style.setProperty('--drag-card-border-radius', this.config.cardBorderRadius); }
        if (this.config.cardBoxShadow) { this.style.setProperty('--drag-card-box-shadow', this.config.cardBoxShadow); }

        this.style.setProperty('--drag-button-width', this.config.buttonWidth ?? '100%');
        this.style.setProperty('--drag-button-height', this.config.buttonHeight ?? '100%');

        if (this.config.buttonBackgroundColor) { this.style.setProperty('--drag-button-background-color', this.config.buttonBackgroundColor); }
        if (this.config.buttonBorderRadius) { this.style.setProperty('--drag-button-border-radius', this.config.buttonBorderRadius); }
        if (this.config.buttonBoxShadow) { this.style.setProperty('--drag-button-box-shadow', this.config.buttonBoxShadow); }

        this.style.setProperty('--drag-card-icon-size', this.config.iconSize ?? '80%');
        
        this.currentIcon = this.config.icoDefault || "";

        // Calculate maxMultiClicks based on configured entities
        this.maxMultiClicks = 1; // Default to single click
        if (this.config.entityQuadruple) {
            this.maxMultiClicks = 4;
        } else if (this.config.entityTriple) {
            this.maxMultiClicks = 3;
        } else if (this.config.entityDouble) {
            this.maxMultiClicks = 2;
        }

        console.log("maxMultiClicks: ", this.maxMultiClicks);

        this.initOrigin()
    }

    // This is the render part (html) here the main structure of the card is defined
    render() {
        if (!this.config) return html`<div>No configuration</div>`;

        return html`
            <ha-card>
                <div class="drag-button"
                    @pointerdown=${this.startDrag}>
                    <div class="drag-button-visual">         
                        <div class="icon-container">
                            ${this.renderIcon()}
                        </div>
                        <div class="hover"></div>
                        <div class="ripple"></div>
                    </div>
                </div>
            </ha-card>
        `;
    }

    renderIcon() {
        if (!this.currentIcon) return html``;
        
        return this.currentIcon.startsWith("/local/") 
            ? html`<img class="image" src=${this.currentIcon} alt="Image"></img>`
            : html`<ha-icon class="icon" .icon=${this.currentIcon}></ha-icon>`;
    }

    private initOrigin() {
        if (!this.button) return;
        const rect = this.button.getBoundingClientRect();
        this.buttonOrigin = { 
            x: rect.left + rect.width/2, 
            y: rect.top + rect.height/2 }; 
        this.buttonRealPos = { 
            x: this.buttonOrigin.x, 
            y: this.buttonOrigin.y };
        }
    
    /*##################################################
    #                                                  #
    #           Start of the drag action               #
    #                                                  #
    ##################################################*/

    // This function is called when the mouse or touch is pressed down
    // It sets the initial position and starts the drag action
    private startDrag(event: any) {
        this.button.style.zIndex = '1';
        if (this.config.buttonSmallerOnClick) this.visualButton.style.transform = "scale(0.95)";
        if (this.config.iconLargerOnClick) this.iconContainer.style.transform = "scale(1.1)";
        if (event.pointerType != 'touch') this.hover.style.opacity = "0.01";

        // Cancel any ongoing return animation
        if (this.animationFrameID) {
            cancelAnimationFrame(this.animationFrameID);
            this.animationFrameID = null;
        }
        
        const rect = this.button.getBoundingClientRect();
        const buttonWidth = rect.width;
        const buttonHeight = rect.height;

        // Get the mouse/finger position relative to the doc
        const mouseDocument = {
            x: event.touches ? event.touches[0].clientX : event.clientX,
            y: event.touches ? event.touches[0].clientY : event.clientY };

        this.mouseOffset = {
            x: mouseDocument.x - this.buttonRealPos.x,
            y: mouseDocument.y - this.buttonRealPos.y };

        // Get the mouse/finger position relative to the button
        const mouseButton = {
            x: mouseDocument.x - rect.left,
            y: mouseDocument.y - rect.top };

        // Set ripple start radius to 10% of longer side
        let rippleRadius = 0;
        if (buttonWidth < buttonHeight) rippleRadius = buttonHeight * 0.20;
        else rippleRadius = buttonWidth * 0.20;
        this.ripple.style.left = mouseButton.x - rippleRadius + 'px';
        this.ripple.style.top = mouseButton.y - rippleRadius + 'px';
        this.ripple.style.width = rippleRadius*2 + 'px';
        this.ripple.style.height = rippleRadius*2 + 'px';

        // Get distance to furthest corner (Set ripple end radius)
        if (mouseButton.x > buttonWidth/2){
            if (mouseButton.y > buttonHeight/2) var distCorner = Math.sqrt((mouseButton.x) **2 + (mouseButton.y) ** 2); //top left
            else var distCorner = Math.sqrt((mouseButton.x) **2 + (buttonHeight - mouseButton.y) ** 2); //buttom left
        } else {
            if (mouseButton.y > buttonHeight/2) var distCorner = Math.sqrt((buttonWidth - mouseButton.x) **2 + (mouseButton.y) ** 2); //top right
            else var distCorner = Math.sqrt((buttonWidth - mouseButton.x) **2 + (buttonHeight - mouseButton.y) ** 2); //bottom right
        }
        let newScale = distCorner/rippleRadius;

        // Reset ripple scale without transition
        this.ripple.style.transition = 'none';
        this.ripple.style.transform = 'scale(1)';
        this.ripple.style.opacity = '0.02';
        
        // Force a reflow to ensure the reset is applied before the next change
        void this.ripple.offsetHeight;
        
        // Reapply transition and set new scale
        this.ripple.style.transition = 'transform 0.3s ease-in, opacity 0.3s';
        this.ripple.style.transform = 'scale(' + newScale + ')';
        this.ripple.style.opacity = '0.04';

        document.addEventListener('pointermove', this.boundDragHandler);
        document.addEventListener('pointerup', this.boundEndDragHandler);

        this.actionCounter = 0;
        this.isHoldAction = false;

        this.holdDetection = window.setTimeout(() => {
            this.isHoldAction = true;
            this.detectSwipeDirection((this.config.deadzone!) * 2, 1);
            this.repeatAction = window.setInterval(() => {
                this.detectSwipeDirection((this.config.deadzone!) * 2, 1);
            }, this.config.repeatTime!);
        }, this.config.holdTime!);
    }

    // This function is called when the mouse or touch is moved
    // It calculates the distance moved and updates the position of the button
    private drag(event: any) {        
        event.preventDefault();
        document.body.style.cursor = 'grabbing';
        this.visualButton.style.cursor = 'grabbing';

        // Get the mouse/finger position relative to the doc
        const mouseDocument = { x: event.touches ? event.touches[0].clientX : event.clientX,
                                y: event.touches ? event.touches[0].clientY : event.clientY };
        
        // Update real position (without scaling)
        this.buttonRealPos = { x: mouseDocument.x - this.mouseOffset.x,
                                y: mouseDocument.y - this.mouseOffset.y }
        
        // Calculate distance from origin
        const d = { x: this.buttonRealPos.x - this.buttonOrigin.x,
                    y: this.buttonRealPos.y - this.buttonOrigin.y };
        this.distance = Math.sqrt(d.x*d.x + d.y*d.y);

        // Apply resistance
        let scale = this.config.maxDrag! / (this.config.maxDrag! + this.distance);

        // Update displayed position with scaling
        this.updatePosition(d.x * scale, d.y * scale);
    }
    

    // This function detects the swipe direction/multi-click and changes the icon
    // It also triggers callService() for the configured entity
    private detectSwipeDirection(deadzone: number, holdMode: number) {
        //console.log("detectSwipeDirection")
        if (!this.config || !this.hass) return;

        if (this.iconTimeout) clearTimeout(this.iconTimeout);

        if (this.distance < deadzone) {
            if (holdMode == 1 && this.actionCounter == 0) {
                console.log("hold")
                if (this.config.entityHold) {
                    this.currentIcon = this.config.icoHold || '';
                    this.callService(this.config.entityHold);
                }
                this.endDrag();
            }
            if (holdMode == 0) {
                this.clickCount++;
                this.lastClick = Date.now();
                if (this.handleClick) clearInterval(this.handleClick);

                this.handleClick = window.setInterval(() => {
                    if (Date.now() - this.lastClick! >= (this.config.multiClickTime!) || this.clickCount == (this.maxMultiClicks)) {
                        console.log('clickCount: ' + this.clickCount);

                        switch (this.clickCount) {
                            case 1:
                                this.callService(this.config.entityCenter!);
                                this.currentIcon = this.config.icoCenter || '';
                                break;
                            case 2:
                                this.callService(this.config.entityDouble!);
                                this.currentIcon = this.config.icoDouble || '';
                                break;
                            case 3:
                                this.callService(this.config.entityTriple!);
                                this.currentIcon = this.config.icoTriple || '';
                                break;
                            case 4:
                                this.callService(this.config.entityQuadruple!);
                                this.currentIcon = this.config.icoQuadruple || '';
                                break;
                        }

                        this.clickCount = 0;
                        clearInterval(this.handleClick!);
                    }
                }, 20);
            }
        } else if (Math.abs(this.buttonRealPos.x) > Math.abs(this.buttonRealPos.y)) {
            if (this.buttonRealPos.x > 0) {
                if (this.config.entityRight) {
                    this.currentIcon = this.config.icoRight || this.currentIcon;
                    this.callService(this.config.entityRight);
                    console.log("swipe right ")
                }
            } else {
                if (this.config.entityLeft) {
                    this.currentIcon = this.config.icoLeft || this.currentIcon;
                    this.callService(this.config.entityLeft);
                    console.log("swipe left ")
                }
            }
        } else {
            if (this.buttonRealPos.y > 0) {
                if (this.config.entityDown) {
                    this.currentIcon = this.config.icoDown || this.currentIcon;
                    this.callService(this.config.entityDown);
                    console.log("swipe down ")
                }
            } else {
                if (this.config.entityUp) {
                    this.currentIcon = this.config.icoUp || this.currentIcon;
                    this.callService(this.config.entityUp);
                    console.log("swipe up ")
                }
            }
        }
        
        this.actionCounter++;
        this.iconTimeout = window.setTimeout(() => {
            this.currentIcon = this.config?.icoDefault || this.config?.icoCenter || 'mdi:alert';
        }, 3000);
    }

    // This function uses the Home Assistant API to call the correct service for the entity
    private callService(entityId: string) {
        if (!this.hass || !entityId) return;

        const [domain] = entityId.split('.');
        switch (domain) {
            case 'button':
                this.hass.callService('button', 'press', { entity_id: entityId });
                break;
            case 'script':
                this.hass.callService('script', 'turn_on', { entity_id: entityId });
                break;
            default:
                this.hass.callService(domain, 'toggle', { entity_id: entityId });
        }
    }

    // This function is called when the mouse or touch is released
    // It resets the button position and stops the drag action
    private endDrag() {
        //console.log("endDrag");
        document.body.style.cursor = '';
        this.visualButton.style.cursor = 'pointer';
        if (this.config.buttonSmallerOnClick) this.visualButton.style.transform = "scale(1)";
        if (this.config.iconLargerOnClick) this.iconContainer.style.transform = "scale(1)";
        this.hover.style.opacity = "0";

        this.ripple.style.opacity = '0';

        document.removeEventListener('pointermove', this.boundDragHandler);
        document.removeEventListener('pointerup', this.boundEndDragHandler);
        
        if (this.isHoldAction == false) this.detectSwipeDirection(this.config.deadzone!, 0);

        if (this.repeatAction) clearInterval(this.repeatAction); 
        if (this.holdDetection) clearTimeout(this.holdDetection);

        // Animate return if not at origin
        if (this.buttonRealPos.x !== this.buttonOrigin.x || this.buttonRealPos.y !== this.buttonOrigin.y) {
            this.animateReturn();
        }
    }

    // This function animates the button back to the center of the card
    private animateReturn() {
        const startButtonReturn = { x : this.buttonRealPos.x,
                                    y : this.buttonRealPos.y };
        const startTime = performance.now();

        const animate = (timestamp: number) => {
            // Check if we're still supposed to animate (might have been interrupted by new drag)
            if (!this.animationFrameID) return;

            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / this.config.returnTime!, 1);
            
            let eased: number = 0;
            // Spring easing - starts fast and ends with a gentle settle
            if (this.config.springDamping! >= 2) {
                // without bounce
                eased = 1 - Math.pow(1 - progress, 1.675);
            }
            else {
                //spring like
                eased = 1 - Math.pow(2, -10 * progress) * Math.cos(progress * Math.PI * 2 / this.config.springDamping!);
            }
            
            // Update real position
            this.buttonRealPos = { x : startButtonReturn.x + (this.buttonOrigin.x - startButtonReturn.x) * eased,
                                     y : startButtonReturn.y + (this.buttonOrigin.y - startButtonReturn.y) * eased };
            
            // Calculate distance from origin
            const d = { x: this.buttonRealPos.x - this.buttonOrigin.x,
                        y: this.buttonRealPos.y - this.buttonOrigin.y};
            this.distance = Math.sqrt(d.x*d.x + d.y*d.y);

            // Apply resistance
            let scale = this.config.maxDrag! / (this.config.maxDrag! + this.distance);

            // Update displayed position with scaling
            this.updatePosition(d.x * scale, d.y * scale);

            if (progress < 1) this.animationFrameID = requestAnimationFrame(animate);
            else this.button.style.zIndex = '0';
        }
        this.animationFrameID = requestAnimationFrame(animate);
    }

    private updatePosition(x: number, y: number) {
        // Reset pos for non existent entity directions
        if(this.config.lockNonEntityDirs){
            if((y > 0 && this.config.entityDown == null) || (y < 0 && this.config.entityUp == null))
                y = 0;
            if((x > 0 && this.config.entityRight == null) || (x < 0 && this.config.entityLeft == null))
                x = 0;
        }

        // Update displayed position with scaling applied
        this.button.style.transform = `translate(${x}px, ${y}px)`;
    }

    // Required by Lovelace to show configuration UI
    static getConfigElement() {
        return document.createElement("drag-card-editor");
    }

    // Default configuration for new cards with all the default values for variables
    static getStubConfig(): Partial<DragCardConfig> {
        return {
            entityUp: 'button.volume_up',
            entityDown: 'button.volume_down',
            entityLeft: 'button.control_left',
            entityRight: 'button.control_right',
            entityCenter: 'button.control_enter',
            icoDefault: 'mdi:drag-variant',
            icoUp: 'mdi:chevron-up',
            icoDown: 'mdi:chevron-down',
            icoLeft: 'mdi:chevron-left',
            icoRight: 'mdi:chevron-right',
            icoCenter: 'mdi:circle-medium',
        };
    }
}













/*##################################################
#                                                  #
#               Drag-Card Editor                   #
#                                                  #
##################################################*/

// This is the support class for the visual configuration editor
@customElement('drag-card-editor')
export class DragCardEditor extends LitElement {
    @property({ attribute: false }) hass?: HomeAssistant;
    @property({ attribute: false }) config?: DragCardConfig;

    // These are filters for entity selector drop-downs
    private _domains = ['button', 'script', 'light', 'switch', 'cover'];
    private _domains2 = ['light', 'cover'];

    static styles = css`
        .config-section { margin-bottom: 16px; }
        .config-row { margin-bottom: 8px; }
        .tab {
            border: 1px solid var(--divider-color);
            border-radius: 4px;
            margin-bottom: 16px;
        }
        .tab-label {
            display: flex;
            justify-content: space-between;
            padding: 1em;
            cursor: pointer;
            font-weight: bold;
            background-color: var(--secondary-background-color);
        }
        .tab-content { padding: 1em; }
        ha-formfield { display: block; margin-bottom: 8px; }
    `;

    setConfig(config: DragCardConfig) {
        this.config = config;
    }

    // This funciton gets called when anything about the config gets changed
    private _valueChanged(event: Event) {
        if (!this.config || !this.hass) return;
        const target = event.target as any;
        const configKey = target.configValue as keyof DragCardConfig;
        if (!configKey) return;
        
        // List of numeric configuration keys
        const numericKeys = [
            'maxDrag', 'returnTime', 'springDamping', 'repeatTime', 
            'holdTime', 'multiClickTime', 'deadzone'
        ];

        // Get the value, checking for empty string
        let value: any;
        if ('checked' in target) {
            value = target.checked;
        } else {
            value = (event as CustomEvent).detail?.value ?? target.value;
            // Convert empty string to undefined
            if (value == "" || value == " " || value == "none" || value == "-") { value = undefined; }
            // Convert to number if this is a numeric field
            else if (numericKeys.includes(configKey)) { value = Number(value); }

        }

        if (this.config[configKey] === value) return;
        const newConfig = { ...this.config, [configKey]: value };
        this.config = newConfig;
        this.requestUpdate();
        fireEvent(this, "config-changed", { config: newConfig });
    }      
      
    // This is the html structure for the visual configuration editor
    render() {
        if (!this.config || !this.hass) return html`<div>No configuration</div>`;

        return html`
            <div class="config-container">
                <div class="config-section">
                    <h3>Card Settings</h3>
                    ${this.renderTextInput('padding', 'Padding')}
                    ${this.renderTextInput('cardWidth', 'Card Width')}
                    ${this.renderTextInput('cardHeight', 'Card Height')}
                    ${this.renderTextInput('cardBackgroundColor', 'Background Color')}
                    ${this.renderTextInput('cardBorderRadius', 'Border Radius')}
                    ${this.renderTextInput('cardBoxShadow', 'Box Shadow')} 

                    ${this.renderTextInput('buttonHeight', 'Button Height')}
                    ${this.renderTextInput('buttonWidth', 'Button Width')}
                    ${this.renderTextInput('buttonBackgroundColor', 'Button Background Color')}
                    ${this.renderTextInput('buttonBorderRadius', 'Button Border Radius')}
                    ${this.renderTextInput('buttonBoxShadow', 'Button Box Shadow')}
                    
                    ${this.renderTextInput('iconSize', 'Icon Size')}
                </div>

                <div class="tab">
                    <div class="tab-label">Entities</div>
                    <div class="tab-content">
                        ${this.renderEntityPicker('entityUp', 'Swipe Up')}
                        ${this.renderEntityPicker('entityDown', 'Swipe Down')}
                        ${this.renderEntityPicker('entityLeft', 'Swipe Left')}
                        ${this.renderEntityPicker('entityRight', 'Swipe Right')}
                        ${this.renderEntityPicker('entityCenter', 'Center Click')}
                        ${this.renderEntityPicker('entityDouble', 'Double Click')}
                        ${this.renderEntityPicker('entityHold', 'Hold Action')}
                    </div>
                </div>

                <div class="tab">
                    <div class="tab-label">Icons</div>
                    <div class="tab-content">
                        ${this.renderIconPicker('icoDefault', 'Default Icon')}
                        ${this.renderIconPicker('icoUp', 'Up Icon')}
                        ${this.renderIconPicker('icoDown', 'Down Icon')}
                        ${this.renderIconPicker('icoLeft', 'Left Icon')}
                        ${this.renderIconPicker('icoRight', 'Right Icon')}
                        ${this.renderIconPicker('icoCenter', 'Center Icon')}
                        ${this.renderIconPicker('icoHold', 'Hold Icon')}
                        ${this.renderIconPicker('icoDouble', 'Double Click Icon')}
                    </div>
                </div>

                <div class="tab">
                    <div class="tab-label">Advanced</div>
                    <div class="tab-content">
                        ${this.renderCheckbox('lockNonEntityDirs', 'Lock Non-Entity Directions', true)}
                        ${this.renderNumberInput('maxDrag', 'Max Drag', 100)}
                        ${this.renderNumberInput('returnTime', 'Return Time', 200)}
                        ${this.renderNumberInput('springDamping', 'Spring Damping', 2)}
                        ${this.renderNumberInput('repeatTime', 'Repeat Time', 200)}
                        ${this.renderNumberInput('holdTime', 'Hold Time', 800)}
                        ${this.renderNumberInput('multiClickTime', 'Multi-click Time', 300)}
                        ${this.renderNumberInput('deadzone', 'Deadzone', 20)}
                    </div>
                </div>
            </div>
        `;
    }

    // These are the building blocks for the configurator html
    private renderEntityPicker(configKey: keyof DragCardConfig, label: string, domain?: any) {
        return html`
            <ha-selector
                .hass=${this.hass}
                .label=${label}
                .selector=${{ entity: domain ? { domain } : {} }}
                .configValue=${configKey}
                .value=${this.config?.[configKey] || ""}
                @value-changed=${this._valueChanged}
            ></ha-selector>
        `;
    }
    private renderIconPicker(configKey: keyof DragCardConfig, label: string) {
        return html`
            <ha-icon-picker
                .hass=${this.hass}
                .label=${label}
                .configValue=${configKey}
                .value=${this.config![configKey] || ""}
                @value-changed=${this._valueChanged}
            ></ha-icon-picker>
        `;
    }
    private renderNumberInput(configKey: keyof DragCardConfig, label: string, defaultValue: number = 0) {
        return html`
            <ha-textfield
                .configValue=${configKey}
                .label=${label}
                type="number"
                .value=${this.config![configKey] || defaultValue}
                @input=${this._valueChanged}
            ></ha-textfield>
        `;
    }
    private renderTextInput(configKey: keyof DragCardConfig, label: string, defaultValue: string = "") {
        return html`
            <ha-textfield
                .label=${label}
                .configValue=${configKey}
                .value=${this.config![configKey] || defaultValue}
                @input=${this._valueChanged}
            ></ha-textfield>
        `;
    }
    private renderCheckbox(configKey: keyof DragCardConfig, label: string, defaultValue: boolean = false) {
        return html`
            <ha-formfield .label=${label}>
                <ha-switch
                    .checked=${this.config![configKey] !== undefined ? this.config![configKey] : defaultValue}
                    .configValue=${configKey}
                    @change=${this._valueChanged}
                ></ha-switch>
            </ha-formfield>
        `;
    }
}












declare global {
    interface HTMLElementTagNameMap {
        'drag-card-editor': DragCardEditor;
    }
}

(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
    type: 'drag-card',
    name: 'Drag Card',
    description: 'A draggable button with directional actions',
    preview: true,
    documentationURL: 'https://github.com/BlackCube4/Drag-Card'
});