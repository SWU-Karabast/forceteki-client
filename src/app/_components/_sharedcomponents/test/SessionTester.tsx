// components/SessionTester.jsx
import { useSession, signOut, getSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import type { Session } from 'next-auth';

// Extend Session type to include our custom properties

// Define the type for session check results
interface SessionCheckResult {
    timestamp: string;
    hasSession: boolean;
    userId: string | null;
    status: string;
    manual?: boolean;
    type?: string;
    statusCode?: number;
    message?: string;
}

export default function SessionTester() {
    const { data: session, status } = useSession() as {
        data: Session | null,
        status: 'loading' | 'authenticated' | 'unauthenticated'
    };
    const [countdown, setCountdown] = useState(30);
    const [sessionCheckResults, setSessionCheckResults] = useState<SessionCheckResult[]>([]);

    // Countdown timer based on your 60-second maxAge
    useEffect(() => {
        if (session) {
            setCountdown(30); // Reset countdown when session exists
            const timer = setInterval(() => {
                setCountdown(prev => Math.max(0, prev - 1));
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [session]);

    const manualSessionCheck = async () => {
        const currentSession = await getSession() as Session | null;
        console.log('Manual session check:', currentSession);

        const timestamp = new Date().toLocaleTimeString();
        setSessionCheckResults(prev => [
            {
                timestamp,
                hasSession: !!currentSession,
                userId: currentSession?.user?.id || null,
                status: currentSession ? 'Active' : 'Expired',
                manual: true
            },
            ...prev.slice(0, 9)
        ]);
    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Session Expiration Tester</h2>

            {/* Current Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-800">Session Status</h3>
                    <p className="text-2xl font-bold text-blue-600">{status}</p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-800">Time Remaining</h3>
                    <p className={`text-2xl font-bold ${countdown < 20 ? 'text-red-600' : 'text-green-600'}`}>
                        {countdown}s
                    </p>
                    {countdown < 20 && countdown > 0 && (
                        <p className="text-sm text-red-500 mt-1">⚠️ Expiring soon!</p>
                    )}
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-purple-800">User ID</h3>
                    <p className="text-sm font-mono text-purple-600">
                        {session?.user?.id || 'None'}
                    </p>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 mb-6">
                <button
                    onClick={manualSessionCheck}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                >
                    Check Session Now
                </button>
                <button
                    onClick={() => window.location.reload()}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
                >
                    Refresh Page
                </button>
                <button
                    onClick={() => signOut()}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
                >
                    Sign Out
                </button>
            </div>

            {/* Session Check Results */}
            <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">Session Check History</h3>
                {sessionCheckResults.length === 0 ? (
                    <p className="text-gray-500 italic">No checks performed yet</p>
                ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {sessionCheckResults.map((result, index) => (
                            <div
                                key={index}
                                className={`flex justify-between items-center p-2 rounded text-sm ${
                                    result.status === 'Active' || result.status === 'Success'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                }`}
                            >
                                <span className="font-medium">
                                    {result.timestamp}
                                    {result.manual && ' (Manual)'}
                                    {result.type === 'API_TEST' && ' (API Test)'}
                                </span>
                                <span className="text-xs">
                                    {result.type === 'API_TEST'
                                        ? `${result.statusCode}: ${result.message}`
                                        : `${result.status} - ID: ${result.userId || 'None'}`
                                    }
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Current Session Details */}
            {session && (
                <details className="mt-6">
                    <summary className="cursor-pointer font-semibold text-gray-700 hover:text-gray-900">
                        Current Session Details (Click to expand)
                    </summary>
                    <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto max-h-60 text-gray-800">
                        {JSON.stringify(session, null, 2)}
                    </pre>
                </details>
            )}

            {/* Instructions */}
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                <h4 className="font-semibold text-yellow-800 mb-2">How to Test:</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Your session expires after 30 seconds (maxAge setting)</li>
                    <li>• Watch the countdown timer - when it hits 0, session should expire</li>
                    <li>• Use &#34;Check Session Now&#34; to manually verify session status</li>
                    <li>• Try &#34;Test Protected API&#34; before and after expiration</li>
                    <li>• Auto-checks happen every 10 seconds</li>
                </ul>
            </div>
        </div>
    );
}