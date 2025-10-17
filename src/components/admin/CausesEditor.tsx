'use client';

interface Cause {
  id: string;
  name: string;
  description: string;
}

interface CausesEditorProps {
  causes: Cause[];
  onChange: (causes: Cause[]) => void;
}

export default function CausesEditor({ causes, onChange }: CausesEditorProps) {
  const addCause = () => {
    const newCause: Cause = {
      id: `cause-${Date.now()}`,
      name: '',
      description: '',
    };
    onChange([...causes, newCause]);
  };

  const removeCause = (id: string) => {
    onChange(causes.filter(c => c.id !== id));
  };

  const updateCause = (id: string, field: 'name' | 'description', value: string) => {
    onChange(
      causes.map(c => c.id === id ? { ...c, [field]: value } : c)
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <label className="block text-sm font-medium text-gray-700">
          Donation Causes
        </label>
        <button
          type="button"
          onClick={addCause}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          + Add Cause
        </button>
      </div>

      {causes.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-500 text-sm mb-2">No causes added yet</p>
          <button
            type="button"
            onClick={addCause}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Add your first cause
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {causes.map((cause, index) => (
            <div key={cause.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex justify-between items-start mb-3">
                <span className="text-sm font-medium text-gray-500">
                  Cause {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeCause(cause.id)}
                  className="text-red-600 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Cause Name *
                  </label>
                  <input
                    type="text"
                    value={cause.name}
                    onChange={(e) => updateCause(cause.id, 'name', e.target.value)}
                    placeholder="e.g., Building Campaign"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={cause.description}
                    onChange={(e) => updateCause(cause.id, 'description', e.target.value)}
                    placeholder="e.g., Help us build our new community center"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-500 mt-2">
        Donors will be able to choose which cause to support
      </p>
    </div>
  );
}
