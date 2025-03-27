import { DragCardConfig } from '../interfaces/drag-card-config.interface';

export class DragCardEditor extends HTMLElement {
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