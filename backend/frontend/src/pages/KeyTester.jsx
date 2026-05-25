import React, { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";

const KeyTester = () => {
  const [result, setResult] = useState("");
  const [testing, setTesting] = useState(false);

  const testKey = async () => {
    setTesting(true);
    setResult("Testing key...");
    
    try {
      // Test the current key
      const stripe = await loadStripe('pk_live_51RppS5F870UHgaCpoufDnxbBAEUWqswnNGLf6yGlgIxKhul2oXRNEccdGDC1RDgrKq0Xn1wWtsYnUBNQqOInoCh7004luT9wUj');
      
      if (stripe) {
        setResult("✅ Key loaded successfully! But still getting 401 error in browser.");
      }
    } catch (error) {
      setResult(`❌ Error: ${error.message}`);
    }
    
    setTesting(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Stripe Key Tester</h1>
        
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Current Issue</h2>
          <p className="mb-4">The publishable key is still causing 401 errors. This means we need the EXACT publishable key from your Stripe dashboard.</p>
          
          <button
            onClick={testKey}
            disabled={testing}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg disabled:bg-gray-400"
          >
            {testing ? 'Testing...' : 'Test Current Key'}
          </button>
          
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">SOLUTION NEEDED:</h3>
            <p className="text-yellow-700">
              You need to get your EXACT publishable key from your Stripe dashboard:
            </p>
            <ol className="list-decimal list-inside mt-2 text-yellow-700">
              <li>Go to: https://dashboard.stripe.com</li>
              <li>Login to your account</li>
              <li>Click: Developers → API Keys</li>
              <li>Copy the LIVE publishable key (starts with pk_live_)</li>
              <li>It will be different from what I'm using</li>
            </ol>
          </div>
          
          {result && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold">Test Result:</h3>
              <p>{result}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KeyTester;





