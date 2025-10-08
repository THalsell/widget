/**
 * Donation Widget Loader
 * Embeddable donation widget for external websites
 *
 * Usage:
 * <script src="https://your-domain.com/widget-loader.js"></script>
 * <script>
 *   DonationWidget.init({
 *     siteId: 'your-site-id',
 *     trigger: '#donate-button',
 *     mode: 'modal' // or 'inline'
 *   });
 * </script>
 */

(function() {
  'use strict';

  // Configuration
  let config = {
    siteId: null,
    organizationName: null,
    widgetUrl: window.location.origin + '/widget',
    trigger: null,
    targetElement: null,
    mode: 'modal', // 'modal' or 'inline'
    theme: 'light', // 'light' or 'dark'
    causes: null,
    onSuccess: null,
    onError: null,
    onClose: null,
  };

  let iframe = null;
  let overlay = null;
  let widgetId = 'donation-widget-' + Date.now();

  /**
   * Create the iframe element
   */
  function createIframe() {
    // Build widget URL with parameters
    const params = new URLSearchParams({
      siteId: config.siteId,
      mode: config.mode,
      theme: config.theme,
      widgetId: widgetId,
    });

    if (config.organizationName) {
      params.set('organizationName', config.organizationName);
    }

    const widgetSrc = config.widgetUrl + '?' + params.toString();

    // Create iframe
    iframe = document.createElement('iframe');
    iframe.src = widgetSrc;
    iframe.id = widgetId;
    iframe.style.border = 'none';
    iframe.style.position = 'fixed';
    iframe.style.zIndex = '999999';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.top = '0';
    iframe.style.left = '0';
    iframe.style.display = 'none';
    iframe.allow = 'payment';

    // Modal mode: Add overlay
    if (config.mode === 'modal') {
      // Create overlay
      overlay = document.createElement('div');
      overlay.id = widgetId + '-overlay';
      overlay.style.position = 'fixed';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100%';
      overlay.style.height = '100%';
      overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
      overlay.style.zIndex = '999998';
      overlay.style.display = 'none';

      // Click overlay to close
      overlay.addEventListener('click', function() {
        close();
      });

      document.body.appendChild(overlay);
    }

    // Inline mode: Insert into target element
    if (config.mode === 'inline' && config.targetElement) {
      const targetEl = document.querySelector(config.targetElement);
      if (targetEl) {
        iframe.style.position = 'relative';
        iframe.style.width = '100%';
        iframe.style.height = '600px';
        iframe.style.display = 'block';
        targetEl.appendChild(iframe);
      } else {
        console.error('[DonationWidget] Target element not found:', config.targetElement);
        return;
      }
    } else {
      // Modal mode or no target: Append to body
      document.body.appendChild(iframe);
    }

    return iframe;
  }

  /**
   * Send message to iframe
   */
  function sendMessage(type, data) {
    if (!iframe || !iframe.contentWindow) return;

    iframe.contentWindow.postMessage(
      {
        type: type,
        ...data,
      },
      '*'
    );
  }

  /**
   * Handle messages from iframe
   */
  function receiveMessage(event) {
    // Security: In production, check event.origin
    // if (event.origin !== config.widgetUrl) return;

    const data = event.data;

    switch (data.type) {
      case 'WIDGET_READY':
        // Widget is ready, send configuration
        sendMessage('WIDGET_CONFIG', {
          config: {
            siteId: config.siteId,
            organizationName: config.organizationName,
            mode: config.mode,
            theme: config.theme,
            causes: config.causes,
          },
        });
        break;

      case 'WIDGET_DONATION_SUCCESS':
        console.log('[DonationWidget] Donation successful:', data.data);
        if (typeof config.onSuccess === 'function') {
          config.onSuccess(data.data);
        }
        // Auto-close modal after success (optional)
        // setTimeout(close, 3000);
        break;

      case 'WIDGET_DONATION_ERROR':
        console.error('[DonationWidget] Donation error:', data.error);
        if (typeof config.onError === 'function') {
          config.onError(data.error);
        }
        break;

      case 'WIDGET_MODAL_CLOSED':
        console.log('[DonationWidget] Modal closed by user');
        close();
        if (typeof config.onClose === 'function') {
          config.onClose();
        }
        break;

      case 'WIDGET_RESIZE':
        // Handle dynamic height
        if (data.height && iframe) {
          iframe.style.height = data.height + 'px';
        }
        break;
    }
  }

  /**
   * Open the widget modal
   */
  function open() {
    if (!iframe) {
      console.error('[DonationWidget] Widget not initialized');
      return;
    }

    if (config.mode === 'modal') {
      if (overlay) overlay.style.display = 'block';
      iframe.style.display = 'block';
      document.body.style.overflow = 'hidden'; // Prevent background scroll
    }

    sendMessage('WIDGET_OPEN', {});
  }

  /**
   * Close the widget modal
   */
  function close() {
    if (!iframe) return;

    if (config.mode === 'modal') {
      if (overlay) overlay.style.display = 'none';
      iframe.style.display = 'none';
      document.body.style.overflow = ''; // Restore scroll
    }

    sendMessage('WIDGET_CLOSE', {});
  }

  /**
   * Setup event listeners
   */
  function setupListeners() {
    // Listen for messages from iframe
    window.addEventListener('message', receiveMessage);

    // Setup trigger element
    if (config.trigger) {
      const triggerEl = document.querySelector(config.trigger);
      if (triggerEl) {
        triggerEl.addEventListener('click', function(e) {
          e.preventDefault();
          open();
        });
      } else {
        console.error('[DonationWidget] Trigger element not found:', config.trigger);
      }
    }

    // Handle ESC key to close modal
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && config.mode === 'modal') {
        close();
      }
    });
  }

  /**
   * Initialize the widget
   */
  function init(options) {
    // Validate required options
    if (!options || !options.siteId) {
      console.error('[DonationWidget] siteId is required');
      return;
    }

    // Merge options with defaults
    config = Object.assign({}, config, options);

    // Override widget URL if provided
    if (options.widgetUrl) {
      config.widgetUrl = options.widgetUrl;
    }

    // Create iframe
    createIframe();

    // Setup event listeners
    setupListeners();

    // Auto-open for inline mode
    if (config.mode === 'inline') {
      open();
    }

    console.log('[DonationWidget] Initialized with config:', config);
  }

  /**
   * Destroy the widget
   */
  function destroy() {
    if (iframe && iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
    if (overlay && overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }

    window.removeEventListener('message', receiveMessage);

    iframe = null;
    overlay = null;

    console.log('[DonationWidget] Destroyed');
  }

  // Public API
  window.DonationWidget = {
    init: init,
    open: open,
    close: close,
    destroy: destroy,
    version: '1.0.0',
  };

  console.log('[DonationWidget] Loader ready');
})();
