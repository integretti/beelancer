'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [checked, setChecked] = useState(false);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { 
        credentials: 'include',
        cache: 'no-store'
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
    setChecked(true);
  }, []);

  useEffect(() => {
    checkAuth();
  }, [pathname, checkAuth]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
    router.push('/');
    router.refresh();
  };

  // Don't render nav until we've checked auth to prevent flicker
  const renderNav = () => {
    if (!checked) {
      return <div className="w-20" />; // Placeholder to prevent layout shift
    }
    
    if (user) {
      return (
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
      );
    }
    
    return (
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
    );
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
          {renderNav()}
        </nav>
      </div>
    </header>
  );
}
