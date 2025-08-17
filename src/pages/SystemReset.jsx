import React, { useState } from 'react';
import { 
  clearLocalStorage, 
  clearSessionStorage, 
  performCompleteReset,
  quickDevReset
} from '../utils/systemReset.js';

export default function SystemReset() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleQuickReset = async () => {
    setIsLoading(true);
    setResults(null);
    
    try {
      const result = await quickDevReset();
      setResults(result);
    } catch (error) {
      setResults({ success: false, error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteReset = async () => {
    if (!confirmReset) {
      alert('Please confirm the reset by checking the confirmation box.');
      return;
    }

    setIsLoading(true);
    setResults(null);
    
    try {
      const result = await performCompleteReset({
        clearStorage: true,
        resetDatabase: true,
        resetSettings: true,
        createDemo: false,
        confirmReset: true
      });
      setResults(result);
    } catch (error) {
      setResults({ success: false, error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteResetWithDemo = async () => {
    if (!confirmReset) {
      alert('Please confirm the reset by checking the confirmation box.');
      return;
    }

    setIsLoading(true);
    setResults(null);
    
    try {
      const result = await performCompleteReset({
        clearStorage: true,
        resetDatabase: true,
        resetSettings: true,
        createDemo: true,
        confirmReset: true
      });
      setResults(result);
    } catch (error) {
      setResults({ success: false, error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearStorageOnly = async () => {
    setIsLoading(true);
    setResults(null);
    
    try {
      const localResult = clearLocalStorage();
      const sessionResult = clearSessionStorage();
      
      setResults({
        success: localResult.success && sessionResult.success,
        message: 'Storage cleared successfully',
        results: { localStorage: localResult, sessionStorage: sessionResult }
      });
    } catch (error) {
      setResults({ success: false, error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-xl rounded-lg">
          <div className="px-6 py-8 border-b border-gray-200">
            <h1 className="text-3xl font-bold text-gray-900">System Reset</h1>
            <p className="mt-2 text-gray-600">
              Reset your MedCure system to a fresh state. Choose the reset option that best fits your needs.
            </p>
          </div>

          <div className="px-6 py-8">
            {/* Warning */}
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <strong>Warning:</strong> These actions will permanently delete data and cannot be undone. 
                    Make sure you have backups if needed.
                  </p>
                </div>
              </div>
            </div>

            {/* Reset Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Quick Reset */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">Quick Reset</h3>
                <p className="text-blue-700 mb-4">
                  Clears browser storage and resets settings. Keeps database data intact. 
                  Perfect for development.
                </p>
                <button
                  onClick={handleQuickReset}
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Resetting...' : 'Quick Reset'}
                </button>
              </div>

              {/* Clear Storage Only */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-900 mb-3">Clear Storage Only</h3>
                <p className="text-green-700 mb-4">
                  Only clears browser localStorage and sessionStorage. 
                  Keeps all database data and settings.
                </p>
                <button
                  onClick={handleClearStorageOnly}
                  disabled={isLoading}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Clearing...' : 'Clear Storage'}
                </button>
              </div>

              {/* Complete Reset */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-red-900 mb-3">Complete Reset</h3>
                <p className="text-red-700 mb-4">
                  ⚠️ Removes ALL data including database records, storage, and settings. 
                  System will be completely empty.
                </p>
                <button
                  onClick={handleCompleteReset}
                  disabled={isLoading || !confirmReset}
                  className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Resetting...' : 'Complete Reset'}
                </button>
              </div>

              {/* Complete Reset with Demo */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-purple-900 mb-3">Reset + Demo Data</h3>
                <p className="text-purple-700 mb-4">
                  Complete reset plus creates sample products and admin user. 
                  Good for testing and demonstrations.
                </p>
                <button
                  onClick={handleCompleteResetWithDemo}
                  disabled={isLoading || !confirmReset}
                  className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Resetting...' : 'Reset + Demo Data'}
                </button>
              </div>
            </div>

            {/* Confirmation Checkbox */}
            <div className="mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={confirmReset}
                  onChange={(e) => setConfirmReset(e.target.checked)}
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  I understand that complete resets will permanently delete data and cannot be undone.
                </span>
              </label>
            </div>

            {/* Results */}
            {results && (
              <div className={`rounded-lg p-6 ${
                results.success 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <h3 className={`text-lg font-semibold mb-3 ${
                  results.success ? 'text-green-900' : 'text-red-900'
                }`}>
                  {results.success ? '✅ Reset Successful' : '❌ Reset Failed'}
                </h3>
                
                <p className={`mb-4 ${
                  results.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {results.message || results.error}
                </p>

                {results.success && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-4">
                    <p className="text-blue-800 font-medium">
                      🔄 Please refresh the page to see the changes take effect.
                    </p>
                    <button
                      onClick={() => window.location.reload()}
                      className="mt-2 bg-blue-600 text-white py-1 px-3 rounded text-sm hover:bg-blue-700 transition-colors"
                    >
                      Refresh Page
                    </button>
                  </div>
                )}

                {results.results && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-medium">
                      View detailed results
                    </summary>
                    <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto">
                      {JSON.stringify(results.results, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* Instructions */}
            <div className="mt-8 bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Instructions</h3>
              <ul className="text-sm text-gray-700 space-y-2">
                <li><strong>Quick Reset:</strong> Best for development. Clears cache and resets UI state.</li>
                <li><strong>Clear Storage:</strong> Only removes saved preferences and cache data.</li>
                <li><strong>Complete Reset:</strong> Nuclear option. Removes everything including database.</li>
                <li><strong>Reset + Demo:</strong> Complete reset plus adds sample data for testing.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
