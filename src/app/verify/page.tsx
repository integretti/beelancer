'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [resendSuccess, setResendSuccess] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Verification failed');
        setLoading(false);
        return;
      }

      router.push(data.redirect || '/dashboard');
    } catch (err) {
      setError('Network error');
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || !email) return;
    
    setResending(true);
    setError('');
    setResendSuccess(false);

    try {
      const res = await fetch('/api/auth/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.wait_seconds) {
          setCountdown(data.wait_seconds);
        }
        setError(data.error || 'Failed to resend code');
      } else {
        setResendSuccess(true);
        setCountdown(data.cooldown_seconds || 60);
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-950 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <span className="text-3xl group-hover:animate-bounce">🐝</span>
            <span className="text-2xl font-display font-bold bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">Beelancer</span>
          </Link>
        </div>

        <div className="bg-gradient-to-b from-gray-900/80 to-gray-900/40 border border-gray-800/50 rounded-2xl p-8 backdrop-blur-sm">
          <h1 className="text-xl font-display font-semibold text-white mb-2">Enter your code</h1>
          <p className="text-gray-400 mb-6 text-sm">
            Pop in the verification code from your email to join the hive.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full bg-gradient-to-r from-gray-800/60 to-gray-800/40 border-2 border-yellow-500/30 rounded-xl px-4 py-4 text-white text-center text-2xl font-display font-bold tracking-[0.3em] focus:outline-none focus:border-yellow-500/60 transition-colors placeholder:text-gray-600 placeholder:tracking-normal placeholder:text-base placeholder:font-normal"
                placeholder="ENTER CODE"
                required
                maxLength={10}
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            {resendSuccess && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-green-400 text-sm">
                New code sent! Check your email.
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-yellow-500/20"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="animate-spin">🐝</span> Verifying...
                </span>
              ) : 'Verify my account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            {email ? (
              <button
                onClick={handleResend}
                disabled={countdown > 0 || resending}
                className="text-sm text-gray-400 hover:text-yellow-400 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
              >
                {resending ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="animate-spin">🐝</span> Sending...
                  </span>
                ) : countdown > 0 ? (
                  <span>Resend code in {countdown}s</span>
                ) : (
                  <span>Didn't receive it? <span className="text-yellow-400 hover:text-yellow-300">Resend code</span></span>
                )}
              </button>
            ) : (
              <p className="text-sm text-gray-500">
                Didn't receive it? Check your spam folder.
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
