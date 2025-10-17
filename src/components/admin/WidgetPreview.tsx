'use client';

interface Cause {
  id: string;
  name: string;
  description: string;
}

interface WidgetPreviewProps {
  organizationName: string;
  primaryColor: string;
  borderRadius: string;
  allowRecurring?: boolean;
  allowCoverageFee?: boolean;
  causes?: Cause[];
}

export default function WidgetPreview({
  organizationName,
  primaryColor,
  borderRadius,
  allowRecurring = true,
  allowCoverageFee = true,
  causes = [],
}: WidgetPreviewProps) {
  // Map borderRadius to Tailwind classes
  const radiusClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
  };

  const radiusClass = radiusClasses[borderRadius as keyof typeof radiusClasses] || 'rounded-md';

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Preview Label */}
      <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
          Live Preview
        </p>
      </div>

      {/* Widget Preview */}
      <div className="p-6">
        {/* Header */}
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Support {organizationName}
        </h2>
        <p className="text-gray-600 mb-6">
          Your donation helps us continue our mission
        </p>

        {/* Amount Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Amount
          </label>
          <div className="grid grid-cols-3 gap-2">
            {['$5', '$10', '$15', '$20', '$25', '$30'].map((amount, idx) => (
              <button
                key={amount}
                disabled
                className={`px-4 py-2 border-2 text-sm font-medium transition-colors ${radiusClass} ${
                  idx === 3
                    ? 'text-white'
                    : 'border-gray-300 text-gray-700 bg-white'
                }`}
                style={idx === 3 ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}
              >
                {amount}
              </button>
            ))}
          </div>
        </div>

        {/* Frequency Selection */}
        {allowRecurring && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Frequency
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['One-time', 'Monthly', 'Yearly'].map((freq, idx) => (
                <button
                  key={freq}
                  disabled
                  className={`px-3 py-2 border-2 text-sm font-medium transition-colors ${radiusClass} ${
                    idx === 0
                      ? 'text-white'
                      : 'border-gray-300 text-gray-700 bg-white'
                  }`}
                  style={idx === 0 ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}
                >
                  {freq}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Cause Selection */}
        {causes.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select a Cause (Optional)
            </label>
            <select
              disabled
              className={`w-full px-3 py-2 border border-gray-300 bg-white text-gray-700 ${radiusClass}`}
            >
              {causes.map((cause) => (
                <option key={cause.id} value={cause.id}>
                  {cause.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Fee Coverage */}
        {allowCoverageFee && (
          <div className="mb-6">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                disabled
                className="mt-1 w-4 h-4 rounded"
                style={{ accentColor: primaryColor }}
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-900">
                  Cover processing fees
                </span>
                <p className="text-xs text-gray-500 mt-1">
                  Add $0.88 to help cover transaction costs
                </p>
              </div>
            </label>
          </div>
        )}

        {/* Continue Button */}
        <button
          disabled
          className={`w-full px-6 py-3 ${radiusClass} font-medium text-white transition-opacity hover:opacity-90`}
          style={{ backgroundColor: primaryColor }}
        >
          Continue to Payment
        </button>

        {/* Powered By */}
        <p className="text-center text-xs text-gray-500 mt-4">
          Powered by Your Widget Platform
        </p>
      </div>
    </div>
  );
}
