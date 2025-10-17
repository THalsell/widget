import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Donation Widget Platform</h1>
          <p className="mt-2 text-gray-600">Embeddable donation forms powered by Stripe</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* Demo Card */}
          <Link href="/demo" className="block">
            <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow p-6 h-full border-2 border-transparent hover:border-blue-500">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Live Demo</h2>
              <p className="text-gray-600">Try out the donation widget with test Stripe data</p>
              <div className="mt-4 text-blue-600 font-medium">View Demo →</div>
            </div>
          </Link>

          {/* Widget Test Card */}
          <a href="/test-embed.html" className="block">
            <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow p-6 h-full border-2 border-transparent hover:border-green-500">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Embeddable Widget</h2>
              <p className="text-gray-600">Test the widget as it appears on external websites</p>
              <div className="mt-4 text-green-600 font-medium">Test Widget →</div>
            </div>
          </a>

          {/* Documentation Card */}
          <a href="/WIDGET_EMBED_GUIDE.md" target="_blank" className="block">
            <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow p-6 h-full border-2 border-transparent hover:border-purple-500">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Documentation</h2>
              <p className="text-gray-600">Complete integration guide for developers</p>
              <div className="mt-4 text-purple-600 font-medium">Read Docs →</div>
            </div>
          </a>

          {/* Admin Dashboard Card */}
          <Link href="/admin" className="block">
            <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow p-6 h-full border-2 border-transparent hover:border-orange-500">
              <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg mb-4">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Admin Dashboard</h2>
              <p className="text-gray-600">View donation statistics and manage donors</p>
              <div className="mt-4 text-orange-600 font-medium">View Dashboard →</div>
            </div>
          </Link>

        </div>

        {/* Features Section */}
        <div className="mt-12 bg-white rounded-xl shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">One-time & Recurring Donations</h3>
                <p className="mt-1 text-gray-600">Support both single and subscription-based donations</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">Stripe Integration</h3>
                <p className="mt-1 text-gray-600">Secure payment processing with Stripe Elements</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">Embeddable Widget</h3>
                <p className="mt-1 text-gray-600">Easy iframe-based integration for any website</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">Multiple Display Modes</h3>
                <p className="mt-1 text-gray-600">Modal overlay or inline embedding options</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">Fee Coverage Option</h3>
                <p className="mt-1 text-gray-600">Let donors optionally cover processing fees</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">Custom Causes</h3>
                <p className="mt-1 text-gray-600">Support multiple donation causes and campaigns</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Start */}
        <div className="mt-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-md p-8 text-white">
          <h2 className="text-2xl font-bold mb-4">Quick Start</h2>
          <p className="mb-6 text-blue-100">Add this to your website to get started:</p>
          <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm overflow-x-auto">
            <pre className="text-green-400">{`<script src="https://your-domain.com/widget-loader.js"></script>
<script>
  DonationWidget.init({
    siteId: 'your-site-id',
    trigger: '#donate-button',
    mode: 'modal'
  });
</script>`}</pre>
          </div>
        </div>
      </div>
    </main>
  );
}
