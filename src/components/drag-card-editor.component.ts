import { LitElement, html, css, TemplateResult, CSSResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ScopedRegistryHost } from '@lit-labs/scoped-registry-mixin';
import { HomeAssistant, LovelaceCardEditor, fireEvent } from 'custom-card-helpers';
import { DragCardConfig } from '../interfaces/drag-card-config.interface';

@customElement('drag-card-editor')
export class DragCardEditor extends ScopedRegistryHost(LitElement) implements LovelaceCardEditor {
  @property({ attribute: false }) public hass?: HomeAssistant;
  
  @state() private _config?: DragCardConfig;
  
  private _initialized = false;
  private _domains = ['button', 'script', 'light', 'switch', 'input_button'];

  static elementDefinitions = {
    // Add any custom element definitions if needed
  }

  firstUpdated(): void {
    this._loadHomeAssistantComponent("ha-entity-picker", { type: "entities", entities: [] });
    this._loadHomeAssistantComponent("ha-icon-picker", { type: "entities", entities: [] });
  }

  async _loadHomeAssistantComponent(component: string, card: {}): Promise<void> {
    const registry = (this.shadowRoot as any)?.customElements;
    if (!registry || registry.get(component)) {
      return;
    } 

    const ch = await (window as any).loadCardHelpers();
    const c = await ch.createCardElement(card);
    await c.constructor.getConfigElement();
    
    registry.define(component, window.customElements.get(component));
  }

  public setConfig(config: any): void {
    this._config = config as DragCardConfig;
  }

  protected shouldUpdate(): boolean {
    if (!this._initialized) {
      this._initialize();
    }
    return true;
  }

  private _initialize(): void {
    if (this.hass === undefined || this._config === undefined) return;
    this._initialized = true;
  }

  protected render(): TemplateResult | void {
    if (!this.hass || !this._config) {
      return html``;
    }

    return html`
      <div class="card-config">
        <div class="tab-content">
          <div class="config-row">
            <mwc-formfield label="Standalone Card">
              <mwc-switch
                .checked=${this._config.isStandalone ?? false}
                .configValue=${'isStandalone'}
                @change=${this._valueChanged}
              ></mwc-switch>
            </mwc-formfield>
          </div>
          ${this._renderTextInput('padding', 'Padding (e.g. 15px)', '')}
          ${this._renderTextInput('cardHeight', 'Card Height (e.g. 150px)', '')}
          ${this._renderTextInput('iconSize', 'Icon Size (e.g. 80%)', '')}
        </div>

        <div class="tab">
          <input type="checkbox" id="entities" class="tab-checkbox">
          <label class="tab-label" for="entities">Entities</label>
          <div class="tab-content">
            ${this._renderEntityPicker('entityUp', 'Swipe Up Entity')}
            ${this._renderEntityPicker('entityDown', 'Swipe Down Entity')}
            ${this._renderEntityPicker('entityLeft', 'Swipe Left Entity')}
            ${this._renderEntityPicker('entityRight', 'Swipe Right Entity')}
            ${this._renderEntityPicker('entityCenter', 'Center Click Entity')}
            ${this._renderEntityPicker('entityDouble', 'Double Click Entity')}
            ${this._renderEntityPicker('entityHold', 'Hold Entity')}
          </div>
        </div>

        <div class="tab">
          <input type="checkbox" id="icons" class="tab-checkbox">
          <label class="tab-label" for="icons">Icons</label>
          <div class="tab-content">
            ${this._renderIconPicker('icoDefault', 'Default Icon', 'mdi:drag-variant')}
            ${this._renderIconPicker('icoUp', 'Up Icon', 'mdi:chevron-up')}
            ${this._renderIconPicker('icoDown', 'Down Icon', 'mdi:chevron-down')}
            ${this._renderIconPicker('icoLeft', 'Left Icon', 'mdi:chevron-left')}
            ${this._renderIconPicker('icoRight', 'Right Icon', 'mdi:chevron-right')}
            ${this._renderIconPicker('icoCenter', 'Center Icon')}
            ${this._renderIconPicker('icoDouble', 'Double Icon')}
            ${this._renderIconPicker('icoHold', 'Hold Icon')}
          </div>
        </div>

        <div class="tab">
          <input type="checkbox" id="advanced" class="tab-checkbox">
          <label class="tab-label" for="advanced">Advanced Settings</label>
          <div class="tab-content">
            ${this._renderNumberInput('maxDrag', 'Max Drag Distance (px)', 100)}
            ${this._renderNumberInput('deadzone', 'Deadzone (px)', 20)}
          </div>
        </div>
      </div>
    `;
  }

  private _renderEntityPicker(configKey: keyof DragCardConfig, label: string): TemplateResult {
    return html`
      <div class="config-row">
        <ha-entity-picker
          .hass=${this.hass}
          .value=${this._config?.[configKey] ?? ''}
          .configValue=${configKey}
          .label=${label}
          .includeDomains=${JSON.stringify(this._domains)}
          @value-changed=${this._valueChanged}
        ></ha-entity-picker>
      </div>
    `;
  }

  private _renderIconPicker(configKey: keyof DragCardConfig, label: string, placeholder = ''): TemplateResult {
    return html`
      <div class="config-row">
        <ha-icon-picker
          .value=${this._config?.[configKey] ?? ''}
          .configValue=${configKey}
          .label=${label}
          .placeholder=${placeholder}
          @value-changed=${this._valueChanged}
        ></ha-icon-picker>
      </div>
    `;
  }

  private _renderNumberInput(configKey: keyof DragCardConfig, label: string, defaultValue: number): TemplateResult {
    return html`
      <div class="config-row">
        <mwc-textfield
          type="number"
          .label=${label}
          .value=${this._config?.[configKey] ?? defaultValue}
          .configValue=${configKey}
          @input=${this._valueChanged}
        ></mwc-textfield>
      </div>
    `;
  }

  private _renderTextInput(configKey: keyof DragCardConfig, label: string, placeholder: string): TemplateResult {
    return html`
      <div class="config-row">
        <mwc-textfield
          type="text"
          .label=${label}
          .value=${this._config?.[configKey] ?? ''}
          .configValue=${configKey}
          .placeholder=${placeholder}
          @input=${this._valueChanged}
        ></mwc-textfield>
      </div>
    `;
  }

  private _valueChanged(ev: Event): void {
    const target = ev.target as any;
    const configValue = target.configValue as keyof DragCardConfig;
    const value = target.checked !== undefined 
      ? target.checked 
      : (target.value || '');

    if (!this._config) return;

    if (this._config[configValue] === value) return;

    const newConfig = {
      ...this._config,
      [configValue]: value,
    };

    this._config = newConfig;

    fireEvent(this, 'config-changed', { config: newConfig });
  }

  static get styles(): CSSResult {
    return css`
      .card-config {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .config-row {
        margin-bottom: 16px;
      }
      .tab {
        border: 1px solid var(--divider-color, #e0e0e0);
        border-radius: 4px;
      }
      .tab-label {
        display: flex;
        justify-content: space-between;
        padding: 1em;
        cursor: pointer;
        font-weight: bold;
        background-color: var(--secondary-background-color);
      }
      .tab-checkbox {
        display: none;
      }
      .tab-content {
        display: none;
        padding: 1em;
      }
      .tab-checkbox:checked ~ .tab-content {
        display: block;
      }
      mwc-textfield, ha-entity-picker, ha-icon-picker {
        width: 100%;
      }
    `;
  }
}