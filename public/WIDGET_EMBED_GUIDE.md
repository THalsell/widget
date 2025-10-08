# Donation Widget - Embedding Guide

## Overview

The Donation Widget allows any website to accept donations with a simple script tag. The widget runs in an isolated iframe and communicates with the host page using postMessage.

## Quick Start

### Step 1: Add the Script

Add this script tag to your website's `<head>` or before the closing `</body>` tag:

```html
<script src="https://your-domain.com/widget-loader.js"></script>
```

### Step 2: Initialize the Widget

#### Modal Mode (Recommended)

Shows a button that opens a donation modal overlay:

```html
<button id="donate-btn">Donate Now</button>

<script>
  DonationWidget.init({
    siteId: 'your-site-id',
    trigger: '#donate-btn',
    mode: 'modal'
  });
</script>
```

#### Inline Mode

Embeds the widget directly into your page:

```html
<div id="donation-widget"></div>

<script>
  DonationWidget.init({
    siteId: 'your-site-id',
    targetElement: '#donation-widget',
    mode: 'inline'
  });
</script>
```

## Configuration Options

```javascript
DonationWidget.init({
  // Required
  siteId: 'your-site-id',          // Your unique identifier (can be any string)

  // Display Mode
  mode: 'modal',                    // 'modal' or 'inline' (default: 'modal')
  trigger: '#donate-button',        // CSS selector for trigger (modal mode)
  targetElement: '#widget-div',     // CSS selector for container (inline mode)

  // Customization
  organizationName: 'My Org',       // Override org name
  theme: 'light',                   // 'light' or 'dark' (default: 'light')

  // Callbacks
  onSuccess: function(data) {       // Called when donation succeeds
    console.log('Donation successful!', data);
  },
  onError: function(error) {        // Called on error
    console.error('Donation failed:', error);
  },
  onClose: function() {             // Called when modal closes
    console.log('Modal closed');
  }
});
```

## API Methods

### `DonationWidget.init(options)`

Initializes the widget with the given configuration.

**Parameters:**
- `options` (Object): Configuration object (see above)

**Example:**
```javascript
DonationWidget.init({
  siteId: 'nonprofit-xyz',
  trigger: '#donate-button',
  mode: 'modal'
});
```

### `DonationWidget.open()`

Programmatically opens the donation modal (modal mode only).

**Example:**
```javascript
// Open the modal from your own code
document.querySelector('.my-button').addEventListener('click', function() {
  DonationWidget.open();
});
```

### `DonationWidget.close()`

Programmatically closes the donation modal.

**Example:**
```javascript
// Close the modal after 10 seconds
setTimeout(function() {
  DonationWidget.close();
}, 10000);
```

### `DonationWidget.destroy()`

Removes the widget from the page and cleans up all event listeners.

**Example:**
```javascript
// Destroy the widget when no longer needed
DonationWidget.destroy();
```

## Events & Callbacks

### onSuccess

Called when a donation is successfully completed.

**Parameters:**
```javascript
{
  intentId: 'pi_xxx',      // Payment/Setup Intent ID
  amount: 2000,            // Amount in cents
  cause: {                 // Selected cause
    id: 'general',
    name: 'General Fund'
  },
  frequency: 'monthly'     // 'once', 'monthly', or 'yearly'
}
```

**Example:**
```javascript
DonationWidget.init({
  siteId: 'my-site',
  onSuccess: function(data) {
    // Show thank you message
    alert('Thank you for donating $' + (data.amount / 100));

    // Track with analytics
    gtag('event', 'donation', {
      value: data.amount / 100,
      currency: 'USD'
    });

    // Update UI
    document.querySelector('#thank-you').style.display = 'block';
  }
});
```

### onError

Called when a donation fails or an error occurs.

**Parameters:**
```javascript
string // Error message
```

**Example:**
```javascript
DonationWidget.init({
  siteId: 'my-site',
  onError: function(error) {
    console.error('Donation error:', error);
    alert('Donation failed: ' + error);
  }
});
```

### onClose

Called when the user closes the modal (modal mode only).

**Example:**
```javascript
DonationWidget.init({
  siteId: 'my-site',
  onClose: function() {
    console.log('User closed the donation modal');
  }
});
```

## Display Modes

### Modal Mode

**Best for:** Most websites, especially those where donations aren't the primary focus.

**Features:**
- Overlays the entire page
- User can close by clicking outside, pressing ESC, or clicking the X button
- Doesn't affect page layout
- Mobile-friendly

**Example:**
```html
<button id="donate-btn" class="my-donate-button">
  Support Our Cause
</button>

<script src="/widget-loader.js"></script>
<script>
  DonationWidget.init({
    siteId: 'my-nonprofit',
    trigger: '#donate-btn',
    mode: 'modal'
  });
</script>
```

### Inline Mode

**Best for:** Dedicated donation pages or when you want the widget always visible.

**Features:**
- Embedded directly in page content
- Flows with your page layout
- Always visible (no open/close)
- Responsive to container width

**Example:**
```html
<div class="donation-section">
  <h2>Support Our Mission</h2>
  <div id="donation-widget-container"></div>
</div>

<script src="/widget-loader.js"></script>
<script>
  DonationWidget.init({
    siteId: 'my-nonprofit',
    targetElement: '#donation-widget-container',
    mode: 'inline'
  });
</script>
```

## Advanced Usage

### Multiple Widgets on Same Page

```javascript
// Modal widget
DonationWidget.init({
  siteId: 'general-fund',
  trigger: '#donate-general',
  mode: 'modal'
});

// Inline widget
// Note: You'll need to load the script twice or manage instances manually
```

### Custom Styling

The widget runs in an iframe, so host page styles don't affect it. To customize:

1. Request a custom theme from your account dashboard
2. Or use the `theme` option:

```javascript
DonationWidget.init({
  siteId: 'my-site',
  theme: 'dark'  // 'light' or 'dark'
});
```

### Analytics Integration

```javascript
DonationWidget.init({
  siteId: 'my-site',
  onSuccess: function(data) {
    // Google Analytics 4
    gtag('event', 'purchase', {
      transaction_id: data.intentId,
      value: data.amount / 100,
      currency: 'USD',
      items: [{
        item_name: data.cause.name,
        price: data.amount / 100,
        quantity: 1
      }]
    });

    // Facebook Pixel
    fbq('track', 'Purchase', {
      value: data.amount / 100,
      currency: 'USD'
    });

    // Custom tracking
    fetch('/api/track-donation', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
});
```

## Testing

### Test Page

A test page is available at `/test-embed.html` with live examples of both modal and inline modes.

Visit: `http://localhost:3000/test-embed.html`

### Test Cards

Use these Stripe test cards (when in test mode):

- **Success:** 4242 4242 4242 4242
- **Requires 3D Secure:** 4000 0025 0000 3155
- **Declined:** 4000 0000 0000 9995

Any future expiry date, any 3-digit CVC, any ZIP code.

## Security

### iframe Isolation

The widget runs in an isolated iframe, which means:

- ✅ Widget styles won't conflict with your page
- ✅ Widget JavaScript won't interfere with your code
- ✅ Payment information never touches your page
- ✅ PCI compliance is handled by the widget

### Communication

The widget and host page communicate using `postMessage`, which is:

- ✅ Secure cross-origin communication
- ✅ Browser standard
- ✅ One-way data flow (host → widget → host)

**Note:** In production, implement origin validation in your widget configuration.

## Troubleshooting

### Widget doesn't appear

1. Check browser console for errors
2. Verify `siteId` is correct
3. Ensure trigger/targetElement selector exists
4. Check that script loaded successfully

### Modal doesn't open

1. Verify `mode: 'modal'` is set
2. Check `trigger` selector matches your button
3. Ensure button exists when script runs
4. Try calling `DonationWidget.open()` manually

### Inline widget too small/large

```javascript
// Set custom height
document.querySelector('#donation-widget-container').style.height = '800px';
```

### Events not firing

1. Check callback functions are defined correctly
2. Verify donation completes successfully
3. Check browser console for errors
4. Ensure callbacks are in the `init()` config

## Browser Support

- ✅ Chrome (latest 2 versions)
- ✅ Firefox (latest 2 versions)
- ✅ Safari (latest 2 versions)
- ✅ Edge (latest 2 versions)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## FAQ

**Q: Can I customize the widget colors?**
A: Yes, use the `theme` option or request a custom theme.

**Q: Does this work on mobile?**
A: Yes, the widget is fully responsive and mobile-optimized.

**Q: Can I accept recurring donations?**
A: Yes, the widget supports one-time, monthly, and yearly donations.

**Q: Is it secure?**
A: Yes, all payment processing is handled by Stripe. No payment data touches your server.

**Q: Can I use this on multiple pages?**
A: Yes, add the script to all pages where you want the widget.

**Q: What about GDPR/privacy?**
A: The widget is GDPR-compliant. See your Stripe settings for data handling.

## Support

For issues or questions:
- Email: support@your-domain.com
- Documentation: https://docs.your-domain.com
- GitHub: https://github.com/your-org/widget

## Changelog

### v1.0.0 (Current)
- Initial release
- Modal and inline modes
- postMessage communication
- Event callbacks
- Theme support
