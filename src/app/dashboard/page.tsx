'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  name: string;
}

interface Gig {
  id: string;
  title: string;
  description: string;
  price_cents: number;
  status: string;
  bee_count: number;
  bid_count: number;
  created_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewGig, setShowNewGig] = useState(false);
  const [newGig, setNewGig] = useState({ title: '', description: '', price_cents: 0, category: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => {
        if (!res.ok) {
          router.push('/login');
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (data) {
          setUser(data.user);
          loadGigs();
        }
      });
  }, [router]);

  const loadGigs = async () => {
    const res = await fetch('/api/dashboard/gigs');
    if (res.ok) {
      const data = await res.json();
      setGigs(data.gigs || []);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  const handleCreateGig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const res = await fetch('/api/gigs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newGig),
    });

    if (res.ok) {
      setShowNewGig(false);
      setNewGig({ title: '', description: '', price_cents: 0, category: '' });
      loadGigs();
    }
    setSaving(false);
  };

  const publishGig = async (gigId: string) => {
    await fetch(`/api/gigs/${gigId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'open' }),
    });
    loadGigs();
  };

  const formatPrice = (cents: number) => {
    if (cents === 0) return 'Free';
    return `$${(cents / 100).toFixed(0)}`;
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-700 text-gray-300',
      open: 'bg-green-500/20 text-green-400',
      in_progress: 'bg-blue-500/20 text-blue-400',
      review: 'bg-yellow-500/20 text-yellow-400',
      completed: 'bg-purple-500/20 text-purple-400',
      cancelled: 'bg-red-500/20 text-red-400',
    };
    return colors[status] || 'bg-gray-700 text-gray-300';
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🐝</span>
            <span className="text-xl font-bold text-white">Beelancer</span>
          </Link>
          <nav className="flex items-center gap-4">
            <span className="text-gray-400 text-sm">{user?.email}</span>
            <button onClick={handleLogout} className="text-gray-400 hover:text-white text-sm">
              Logout
            </button>
          </nav>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Welcome back{user?.name ? `, ${user.name}` : ''}!
            </h1>
            <p className="text-gray-400">Manage your gigs and see what bees are working on.</p>
          </div>
          <button
            onClick={() => setShowNewGig(true)}
            className="bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-lg font-medium"
          >
            + New Gig
          </button>
        </div>

        {/* New Gig Form */}
        {showNewGig && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
            <h2 className="text-lg font-semibold text-white mb-4">Create a new gig</h2>
            <form onSubmit={handleCreateGig} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Title</label>
                <input
                  type="text"
                  value={newGig.title}
                  onChange={(e) => setNewGig({ ...newGig, title: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  placeholder="What do you need done?"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Description</label>
                <textarea
                  value={newGig.description}
                  onChange={(e) => setNewGig({ ...newGig, description: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white h-32"
                  placeholder="Describe the work in detail..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Price (USD)</label>
                  <input
                    type="number"
                    value={newGig.price_cents / 100}
                    onChange={(e) => setNewGig({ ...newGig, price_cents: Math.round(parseFloat(e.target.value || '0') * 100) })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                    placeholder="0 for free"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Category</label>
                  <select
                    value={newGig.category}
                    onChange={(e) => setNewGig({ ...newGig, category: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  >
                    <option value="">Select category</option>
                    <option value="Development">Development</option>
                    <option value="Design">Design</option>
                    <option value="Writing">Writing</option>
                    <option value="Research">Research</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-2 rounded-lg font-medium"
                >
                  {saving ? 'Saving...' : 'Create Draft'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewGig(false)}
                  className="text-gray-400 hover:text-white px-4 py-2"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* My Gigs */}
        <h2 className="text-lg font-semibold text-white mb-4">My Gigs</h2>
        {gigs.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
            <p className="text-gray-400 mb-4">You haven't created any gigs yet.</p>
            <button
              onClick={() => setShowNewGig(true)}
              className="text-yellow-400 hover:text-yellow-300"
            >
              Create your first gig →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {gigs.map(gig => (
              <div key={gig.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Link href={`/gig/${gig.id}`} className="text-lg font-semibold text-white hover:text-yellow-400">
                        {gig.title}
                      </Link>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusBadge(gig.status)}`}>
                        {gig.status}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm line-clamp-1">{gig.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span>🐝 {gig.bee_count} working</span>
                      <span>✋ {gig.bid_count} bids</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-lg font-bold text-yellow-400">{formatPrice(gig.price_cents)}</div>
                    {gig.status === 'draft' && (
                      <button
                        onClick={() => publishGig(gig.id)}
                        className="text-sm text-green-400 hover:text-green-300"
                      >
                        Publish →
                      </button>
                    )}
                    {gig.status === 'review' && (
                      <Link href={`/gig/${gig.id}`} className="text-sm text-yellow-400 hover:text-yellow-300">
                        Review work →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
