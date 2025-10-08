// Entry point for the embeddable widget

class DonationWidget {
  private container: HTMLElement | null = null;
  private config: any;

  constructor(config: any) {
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
(window as any).DonationWidget = DonationWidget;

export default DonationWidget;
