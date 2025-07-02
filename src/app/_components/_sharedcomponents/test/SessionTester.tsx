// components/SessionTester.jsx
import { useSession, signOut, getSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import type { Session } from 'next-auth';

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
    expiresAt?: string;
    expiresIn?: string;

}

export default function SessionTester() {
    const { data: session, status, update } = useSession();
    const [countdown, setCountdown] = useState<number>(0);
    const [sessionCheckResults, setSessionCheckResults] = useState<SessionCheckResult[]>([]);

    // Countdown timer based on your 60-second maxAge
    useEffect(() => {
        if (session?.expiresAt) {
            const updateCountdown = () => {
                const expiresAt = new Date(session.expiresAt).getTime();
                const now = Date.now();
                const secondsRemaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
                setCountdown(secondsRemaining);
            };

            updateCountdown();
            const timer = setInterval(updateCountdown, 1000);

            return () => clearInterval(timer);
        }
    }, [session]);

    const formatTimeRemaining = (seconds: number): string => {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (days > 0) {
            return `${days}d ${hours}h ${minutes}m ${secs}s`;
        } else if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`;
        } else {
            return `${minutes}m ${secs}s`;
        }
    };

    const extendSession = async () => {
        console.log('Extending session by 2 months...');
        await update({ userId: session?.user?.userId });
    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">2-Month Sliding Session Tester</h2>

            {/* Current Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-800">Session Status</h3>
                    <p className="text-2xl font-bold text-blue-600">{status}</p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-800">Time Remaining</h3>
                    <p className={`text-2xl font-bold ${countdown < 86400 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatTimeRemaining(countdown)}
                    </p>
                    {countdown < 86400 && countdown > 0 && (
                        <p className="text-sm text-red-500 mt-1">⚠️ Less than 1 day remaining!</p>
                    )}
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-purple-800">User ID</h3>
                    <p className="text-sm font-mono text-purple-600">
                        {session?.user?.id || 'None'}
                    </p>
                </div>
            </div>

            {/* Expiration Details */}
            {session?.expiresAt && (
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <h3 className="font-semibold text-gray-800 mb-2">Session Expiration</h3>
                    <p className="text-sm text-gray-600">
                        Expires at: <span className="font-mono">{new Date(session.expiresAt).toLocaleString()}</span>
                    </p>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 mb-6">
                <button
                    onClick={extendSession}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
                    disabled={!session}
                >
                    Extend Session (+2 months)
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

            {/* Instructions */}
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                <h4 className="font-semibold text-yellow-800 mb-2">How This Works:</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Your session starts with a 2-month expiration</li>
                    <li>• Every time you visit the site, it resets to 2 months</li>
                    <li>• The reset happens automatically when syncing with the server</li>
                    <li>• Use &rdquo;Extend Session&#34; to manually trigger a 2-month reset</li>
                    <li>• If you don&#39;t visit for 2 months, you&#39;ll need to log in again</li>
                </ul>
            </div>
        </div>
    );
}