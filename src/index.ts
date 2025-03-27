import { DragCard } from './components/drag-card.component';
import { DragCardEditor } from './components/drag-card-editor.component';

// Define custom elements
customElements.define("drag-card", DragCard);
customElements.define('drag-card-editor', DragCardEditor);

// Update card registration
(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
    type: 'drag-card',
    name: 'Drag Card',
    description: 'A custom button with multiple functions depending on the drag direction',
    preview: true,
    configurable: true,
    documentationURL: 'https://github.com/your-repo/drag-card'
});