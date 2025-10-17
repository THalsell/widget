// Entry point for the embeddable widget

interface DonationWidgetConfig {
  [key: string]: unknown;
}

class DonationWidget {
  private container: HTMLElement | null = null;
  private config: DonationWidgetConfig;

  constructor(config: DonationWidgetConfig = {}) {
    this.config = config;
  }

  mount(selector: string) {
    this.container = document.querySelector(selector);
    if (!this.container) {
      console.error(`Widget container not found: ${selector}`);
      return;
    }

    this.render();
  }

  private render() {
    if (!this.container) return;

    // TODO: Implement widget rendering
    this.container.innerHTML = '<button class="donation-widget-btn">Donate</button>';
  }
}

// Expose widget to global scope
declare global {
  interface Window {
    DonationWidget?: typeof DonationWidget;
  }
}

window.DonationWidget = DonationWidget;

export default DonationWidget;
