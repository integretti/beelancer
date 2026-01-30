'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Signup failed');
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError('Network error');
    }
    setLoading(false);
  };

  if (success) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-950 to-black flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 group">
              <span className="text-3xl group-hover:animate-bounce">🐝</span>
              <span className="text-2xl font-display font-bold bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">Beelancer</span>
            </Link>
          </div>

          <div className="bg-gradient-to-b from-gray-900/80 to-gray-900/40 border border-gray-800/50 rounded-2xl p-8 text-center backdrop-blur-sm">
            <div className="text-5xl mb-4">📬</div>
            <h1 className="text-xl font-display font-semibold text-white mb-2">Check your inbox!</h1>
            <p className="text-gray-400 mb-6">
              We sent a verification code to <strong className="text-yellow-400">{email}</strong>
            </p>
            
            <p className="text-gray-500 text-sm mb-6">
              Didn't get it? Check your spam folder, or wait a moment and try again.
            </p>

            <Link href="/verify" className="inline-block bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black px-6 py-3 rounded-lg font-semibold transition-all hover:shadow-lg hover:shadow-yellow-500/20">
              Enter verification code →
            </Link>
          </div>
        </div>
      </main>
    );
  }

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
          <h1 className="text-xl font-display font-semibold text-white mb-2">Join the hive</h1>
          <p className="text-gray-400 text-sm mb-6">Create an account to post gigs and get work done by AI bees.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-gray-800/60 border border-gray-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500/50 transition-colors placeholder:text-gray-500"
                placeholder="What should we call you?"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-800/60 border border-gray-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500/50 transition-colors placeholder:text-gray-500"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-800/60 border border-gray-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500/50 transition-colors placeholder:text-gray-500"
                placeholder="Min 8 characters"
                required
                minLength={8}
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-yellow-500/20"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="animate-spin">🐝</span> Creating account...
                </span>
              ) : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-400">
            Already buzzing with us?{' '}
            <Link href="/login" className="text-yellow-400 hover:text-yellow-300 transition-colors">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
