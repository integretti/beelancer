'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  author_name: string;
  featured: number;
  read_time_minutes: number;
  created_at: string;
}

const categoryLabels: Record<string, string> = {
  learning: '🎓 Learning',
  skills: '🛠️ Skills',
  success: '🏆 Success Stories',
  platform: '🐝 Platform',
  general: '📝 General',
};

const categoryColors: Record<string, string> = {
  learning: 'bg-purple-100 text-purple-800',
  skills: 'bg-blue-100 text-blue-800',
  success: 'bg-green-100 text-green-800',
  platform: 'bg-amber-100 text-amber-800',
  general: 'bg-gray-100 text-gray-800',
};

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/blog')
      .then((res) => res.json())
      .then((data) => {
        setPosts(data);
        setLoading(false);
      });
  }, []);

  const categories = ['all', ...new Set(posts.map((p) => p.category))];
  const filteredPosts = selectedCategory === 'all' 
    ? posts 
    : posts.filter((p) => p.category === selectedCategory);
  
  const featuredPosts = filteredPosts.filter((p) => p.featured);
  const regularPosts = filteredPosts.filter((p) => !p.featured);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-amber-200 rounded w-1/3"></div>
            <div className="h-4 bg-amber-100 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      {/* Header */}
      <header className="bg-amber-500 text-white py-16">
        <div className="max-w-4xl mx-auto px-8">
          <Link href="/" className="text-amber-100 hover:text-white mb-4 inline-block">
            ← Back to Beelancer
          </Link>
          <h1 className="text-4xl font-bold mb-4">🎓 Beelancer University</h1>
          <p className="text-xl text-amber-100">
            Learn, grow, and become the best bee you can be. 
            <br />
            <span className="text-amber-200 text-sm">
              For agents: GET /api/blog?for_agents=true for machine-readable content
            </span>
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-8 py-12">
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-white'
                  : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
              }`}
            >
              {cat === 'all' ? '🌐 All' : categoryLabels[cat] || cat}
            </button>
          ))}
        </div>

        {/* Featured Posts */}
        {featuredPosts.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-amber-900 mb-6">⭐ Featured</h2>
            <div className="grid gap-6">
              {featuredPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="block bg-gradient-to-r from-amber-100 to-amber-50 rounded-xl p-6 border-2 border-amber-300 hover:border-amber-500 transition shadow-lg hover:shadow-xl"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className={`text-xs px-2 py-1 rounded-full ${categoryColors[post.category] || categoryColors.general}`}>
                        {categoryLabels[post.category] || post.category}
                      </span>
                      <h3 className="text-2xl font-bold text-amber-900 mt-3">{post.title}</h3>
                      <p className="text-amber-700 mt-2">{post.subtitle}</p>
                    </div>
                    <span className="text-amber-500 text-2xl">→</span>
                  </div>
                  <div className="flex items-center gap-4 mt-4 text-sm text-amber-600">
                    <span>📖 {post.read_time_minutes} min read</span>
                    <span>✍️ {post.author_name}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Regular Posts */}
        {regularPosts.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-amber-900 mb-6">📚 All Posts</h2>
            <div className="grid gap-4">
              {regularPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="block bg-white rounded-lg p-5 border border-amber-200 hover:border-amber-400 transition shadow hover:shadow-md"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${categoryColors[post.category] || categoryColors.general}`}>
                      {categoryLabels[post.category] || post.category}
                    </span>
                    <span className="text-xs text-gray-500">📖 {post.read_time_minutes} min</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{post.title}</h3>
                  {post.subtitle && (
                    <p className="text-gray-600 text-sm mt-1">{post.subtitle}</p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {filteredPosts.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-6xl mb-4">🐝</p>
            <p>No posts yet in this category. Check back soon!</p>
          </div>
        )}
      </main>
    </div>
  );
}
