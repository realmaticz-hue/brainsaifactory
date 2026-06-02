import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { FacebookOAuthDiagnostic } from '../components/FacebookOAuthDiagnostic';

export default function FacebookOAuthHelp() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <a
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-all mb-6 text-gray-700 font-semibold"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to App
        </a>

        {/* Main Diagnostic */}
        <FacebookOAuthDiagnostic />

        {/* Additional Resources */}
        <div className="mt-8 grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-6 border-2 border-blue-200">
            <h3 className="font-bold text-blue-900 mb-3 text-lg">📚 Documentation</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/docs/FACEBOOK_OAUTH_SETUP.md" target="_blank" className="text-blue-600 hover:underline">
                  → Complete Facebook OAuth Setup Guide
                </a>
              </li>
              <li>
                <a href="/docs/OAUTH_HTTPS_FIX_SUMMARY.md" target="_blank" className="text-blue-600 hover:underline">
                  → HTTPS Security Fix Summary
                </a>
              </li>
              <li>
                <a href="https://developers.facebook.com/docs/facebook-login" target="_blank" className="text-blue-600 hover:underline">
                  → Facebook Official Documentation
                </a>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-xl p-6 border-2 border-green-200">
            <h3 className="font-bold text-green-900 mb-3 text-lg">✅ Quick Checklist</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center gap-2">
                <input type="checkbox" className="w-4 h-4" />
                <span>Copied my redirect URI</span>
              </li>
              <li className="flex items-center gap-2">
                <input type="checkbox" className="w-4 h-4" />
                <span>Opened Facebook Developers</span>
              </li>
              <li className="flex items-center gap-2">
                <input type="checkbox" className="w-4 h-4" />
                <span>Found Facebook Login → Settings</span>
              </li>
              <li className="flex items-center gap-2">
                <input type="checkbox" className="w-4 h-4" />
                <span>Added URI to "Valid OAuth Redirect URIs"</span>
              </li>
              <li className="flex items-center gap-2">
                <input type="checkbox" className="w-4 h-4" />
                <span>Clicked "Save Changes"</span>
              </li>
              <li className="flex items-center gap-2">
                <input type="checkbox" className="w-4 h-4" />
                <span>Tried connecting again</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Common Mistakes */}
        <div className="mt-8 bg-white rounded-xl p-6 border-2 border-orange-200">
          <h3 className="font-bold text-orange-900 mb-4 text-lg">⚠️ Common Mistakes to Avoid</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold text-red-700 mb-2">❌ DON'T:</h4>
              <ul className="space-y-1 text-gray-700">
                <li>• Use http:// instead of https://</li>
                <li>• Add extra spaces in the URI</li>
                <li>• Forget to click "Save Changes"</li>
                <li>• Use a different domain</li>
                <li>• Add the wrong path</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-green-700 mb-2">✅ DO:</h4>
              <ul className="space-y-1 text-gray-700">
                <li>• Copy the URI exactly as shown</li>
                <li>• Use the "Copy" button</li>
                <li>• Save your changes in Facebook</li>
                <li>• Wait a few seconds after saving</li>
                <li>• Try connecting again</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
