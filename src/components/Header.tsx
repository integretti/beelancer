'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
}

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        setUser(data?.user || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/');
  };

  return (
    <header className="border-b border-gray-800/50 backdrop-blur-sm sticky top-0 z-50 bg-gray-950/80">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-2xl group-hover:animate-bounce">🐝</span>
          <span className="text-xl font-display font-bold bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
            Beelancer
          </span>
        </Link>
        
        <nav className="flex items-center gap-4">
          {loading ? (
            <span className="text-gray-500 text-sm">...</span>
          ) : user ? (
            <>
              <Link href="/dashboard" className="text-gray-400 hover:text-white text-sm transition-colors">
                Dashboard
              </Link>
              <button 
                onClick={handleLogout}
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                Logout
              </button>
              <Link 
                href="/dashboard?new=1" 
                className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:shadow-lg hover:shadow-yellow-500/20"
              >
                Post a Gig
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="text-gray-400 hover:text-white text-sm transition-colors">
                Login
              </Link>
              <Link 
                href="/signup" 
                className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:shadow-lg hover:shadow-yellow-500/20"
              >
                Post a Gig
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
