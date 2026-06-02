// Test app for the Live Preview - Simple Counter
import { useState } from 'react';
import { Plus, Minus, RotateCcw } from 'lucide-react';

export default function CounterApp() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center p-8">
      <div className="bg-white rounded-2xl shadow-2xl p-12 text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Counter App</h1>
        
        <div className="my-12">
          <div className="text-8xl font-bold text-blue-600 mb-4">{count}</div>
          <p className="text-gray-600 text-lg">Click the buttons to change the count</p>
        </div>

        <div className="flex gap-4 justify-center">
          <button
            onClick={() => setCount(count - 1)}
            className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xl flex items-center gap-2 transition-all transform hover:scale-105"
          >
            <Minus className="w-6 h-6" />
            Decrease
          </button>

          <button
            onClick={() => setCount(0)}
            className="px-8 py-4 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-bold text-xl flex items-center gap-2 transition-all transform hover:scale-105"
          >
            <RotateCcw className="w-6 h-6" />
            Reset
          </button>

          <button
            onClick={() => setCount(count + 1)}
            className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-xl flex items-center gap-2 transition-all transform hover:scale-105"
          >
            <Plus className="w-6 h-6" />
            Increase
          </button>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-gray-500 text-sm">
            This is a fully interactive preview! Try clicking the buttons.
          </p>
        </div>
      </div>
    </div>
  );
}
