// Entry point for the embeddable widget

interface DonationSuccessData {
  amount: number;
  currency: string;
  donorName?: string;
  donorEmail?: string;
  transactionId: string;
}

interface WidgetConfig {
  siteId: string;
  trigger?: string | HTMLElement;
  mode?: 'modal' | 'inline';
  theme?: 'light' | 'dark';
  widgetUrl?: string; // Custom widget URL (defaults to window.location.origin in production)
  onSuccess?: (data: DonationSuccessData) => void;
  onError?: (error: string) => void;
  onClose?: () => void;
}

class DonationWidgetInstance {
  private config: WidgetConfig;
  private iframe: HTMLIFrameElement | null = null;
  private overlay: HTMLElement | null = null;
  private triggerElement: HTMLElement | null = null;
  private widgetId: string;

  constructor(config: WidgetConfig) {
    this.config = {
      mode: 'modal',
      theme: 'light',
      ...config,
    };
    this.widgetId = `donation-widget-${Date.now()}`;
    this.init();
  }

  private init() {
    // Set up trigger element
    if (this.config.trigger) {
      if (typeof this.config.trigger === 'string') {
        this.triggerElement = document.querySelector(this.config.trigger);
      } else {
        this.triggerElement = this.config.trigger;
      }

      if (this.triggerElement) {
        this.triggerElement.addEventListener('click', () => this.open());
      }
    }

    // Create iframe and overlay (hidden initially)
    if (this.config.mode === 'modal') {
      this.createModalElements();
    } else {
      this.createInlineElements();
    }

    // Listen for messages from iframe
    window.addEventListener('message', this.handleMessage.bind(this));
  }

  private getWidgetUrl(): string {
    // Use custom URL if provided, otherwise use current origin
    const baseUrl = this.config.widgetUrl || window.location.origin;
    const params = new URLSearchParams({
      siteId: this.config.siteId,
      mode: this.config.mode || 'modal',
      theme: this.config.theme || 'light',
      widgetId: this.widgetId,
    });
    return `${baseUrl}/widget?${params.toString()}`;
  }

  private createModalElements() {
    // Create overlay
    this.overlay = document.createElement('div');
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: none;
      z-index: 9998;
      align-items: center;
      justify-content: center;
    `;

    // Create iframe
    this.iframe = document.createElement('iframe');
    this.iframe.src = this.getWidgetUrl();
    this.iframe.style.cssText = `
      width: 90%;
      max-width: 500px;
      height: 90%;
      max-height: 700px;
      border: none;
      border-radius: 12px;
      background: white;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    `;

    this.overlay.appendChild(this.iframe);
    document.body.appendChild(this.overlay);

    // Close on overlay click
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.close();
      }
    });
  }

  private createInlineElements() {
    // For inline mode, create container if trigger is provided
    if (this.triggerElement) {
      this.iframe = document.createElement('iframe');
      this.iframe.src = this.getWidgetUrl();
      this.iframe.style.cssText = `
        width: 100%;
        height: 600px;
        border: none;
        border-radius: 8px;
      `;
      this.triggerElement.appendChild(this.iframe);
    }
  }

  private handleMessage(event: MessageEvent) {
    // In production, verify event.origin matches your widget domain
    if (event.data.widgetId !== this.widgetId) {
      return; // Message not for this widget instance
    }

    switch (event.data.type) {
      case 'WIDGET_READY':
        // Widget iframe is ready
        break;

      case 'WIDGET_DONATION_SUCCESS':
        if (this.config.onSuccess) {
          this.config.onSuccess(event.data.data);
        }
        break;

      case 'WIDGET_DONATION_ERROR':
        if (this.config.onError) {
          this.config.onError(event.data.error);
        }
        break;

      case 'WIDGET_MODAL_CLOSED':
        this.close();
        break;
    }
  }

  public open() {
    if (this.config.mode === 'modal' && this.overlay) {
      this.overlay.style.display = 'flex';
      // Send message to iframe to open
      if (this.iframe && this.iframe.contentWindow) {
        this.iframe.contentWindow.postMessage(
          { type: 'WIDGET_OPEN', widgetId: this.widgetId },
          '*'
        );
      }
    }
  }

  public close() {
    if (this.config.mode === 'modal' && this.overlay) {
      this.overlay.style.display = 'none';
      if (this.config.onClose) {
        this.config.onClose();
      }
    }
  }

  public destroy() {
    // Clean up
    if (this.overlay) {
      this.overlay.remove();
    }
    if (this.triggerElement) {
      this.triggerElement.removeEventListener('click', () => this.open());
    }
    window.removeEventListener('message', this.handleMessage);
  }
}

// Global widget manager
class DonationWidgetManager {
  private instances: Map<string, DonationWidgetInstance> = new Map();

  init(config: WidgetConfig): DonationWidgetInstance {
    const instanceId = config.trigger?.toString() || 'default';

    // Clean up existing instance if any
    if (this.instances.has(instanceId)) {
      this.instances.get(instanceId)?.destroy();
    }

    const instance = new DonationWidgetInstance(config);
    this.instances.set(instanceId, instance);
    return instance;
  }

  // Legacy mount method for backwards compatibility
  mount(selector: string, config: Partial<WidgetConfig> = {}) {
    return this.init({
      siteId: config.siteId || 'demo-site',
      trigger: selector,
      ...config,
    });
  }
}

// Expose widget to global scope
declare global {
  interface Window {
    DonationWidget?: DonationWidgetManager;
  }
}

const widgetManager = new DonationWidgetManager();
window.DonationWidget = widgetManager;

export default widgetManager;
