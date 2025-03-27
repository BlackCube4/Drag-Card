export interface HomeAssistant {
    callService: (domain: string, service: string, data: { entity_id: string }) => Promise<void>;
}