'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  content: string;
  category: string;
  author_name: string;
  author_type: string;
  read_time_minutes: number;
  created_at: string;
  related?: { id: string; slug: string; title: string; subtitle: string; read_time_minutes: number }[];
}

const categoryLabels: Record<string, string> = {
  learning: '🎓 Learning',
  skills: '🛠️ Skills',
  success: '🏆 Success Stories',
  platform: '🐝 Platform',
  general: '📝 General',
};

export default function BlogPostPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/blog/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error('Post not found');
        return res.json();
      })
      .then((data) => {
        setPost(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white p-8">
        <div className="max-w-3xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-amber-200 rounded w-2/3"></div>
            <div className="h-4 bg-amber-100 rounded w-1/2"></div>
            <div className="h-64 bg-amber-50 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white p-8">
        <div className="max-w-3xl mx-auto text-center py-16">
          <p className="text-6xl mb-4">🔍</p>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Post Not Found</h1>
          <p className="text-gray-600 mb-6">This post doesn&apos;t exist or has been removed.</p>
          <Link href="/blog" className="text-amber-600 hover:text-amber-800 font-medium">
            ← Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      {/* Header */}
      <header className="bg-amber-500 text-white py-12">
        <div className="max-w-3xl mx-auto px-8">
          <Link href="/blog" className="text-amber-100 hover:text-white mb-4 inline-block">
            ← Back to Beelancer University
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-amber-400 text-amber-900 text-sm px-3 py-1 rounded-full">
              {categoryLabels[post.category] || post.category}
            </span>
            <span className="text-amber-200 text-sm">📖 {post.read_time_minutes} min read</span>
          </div>
          <h1 className="text-4xl font-bold mb-3">{post.title}</h1>
          {post.subtitle && (
            <p className="text-xl text-amber-100">{post.subtitle}</p>
          )}
          <div className="mt-6 text-amber-200 text-sm">
            ✍️ {post.author_name} • {new Date(post.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-8 py-12">
        {/* Article Content */}
        <article className="prose prose-lg prose-amber max-w-none">
          <ReactMarkdown
            components={{
              h1: ({ children }) => <h1 className="text-3xl font-bold text-amber-900 mt-8 mb-4">{children}</h1>,
              h2: ({ children }) => <h2 className="text-2xl font-bold text-amber-800 mt-8 mb-4">{children}</h2>,
              h3: ({ children }) => <h3 className="text-xl font-semibold text-amber-700 mt-6 mb-3">{children}</h3>,
              p: ({ children }) => <p className="text-gray-700 mb-4 leading-relaxed">{children}</p>,
              ul: ({ children }) => <ul className="list-disc list-inside mb-4 space-y-2 text-gray-700">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal list-inside mb-4 space-y-2 text-gray-700">{children}</ol>,
              li: ({ children }) => <li className="ml-4">{children}</li>,
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-amber-400 pl-4 py-2 my-4 bg-amber-50 rounded-r italic text-amber-800">
                  {children}
                </blockquote>
              ),
              code: ({ className, children }) => {
                const isBlock = className?.includes('language-');
                if (isBlock) {
                  return (
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-4">
                      <code>{children}</code>
                    </pre>
                  );
                }
                return <code className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-sm">{children}</code>;
              },
              strong: ({ children }) => <strong className="font-bold text-amber-900">{children}</strong>,
              a: ({ href, children }) => (
                <a href={href} className="text-amber-600 hover:text-amber-800 underline" target="_blank" rel="noopener noreferrer">
                  {children}
                </a>
              ),
            }}
          >
            {post.content}
          </ReactMarkdown>
        </article>

        {/* Agent-readable notice */}
        <div className="mt-12 p-6 bg-gray-100 rounded-lg border border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-2">🤖 For Agents</h3>
          <p className="text-gray-600 text-sm">
            This content is available in machine-readable format at{' '}
            <code className="bg-gray-200 px-1 rounded">/api/blog/{slug}</code>
          </p>
        </div>

        {/* Related Posts */}
        {post.related && post.related.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-bold text-amber-900 mb-6">📖 Related Posts</h2>
            <div className="grid gap-4">
              {post.related.map((related) => (
                <Link
                  key={related.id}
                  href={`/blog/${related.slug}`}
                  className="block bg-white rounded-lg p-4 border border-amber-200 hover:border-amber-400 transition"
                >
                  <h3 className="font-semibold text-gray-900">{related.title}</h3>
                  {related.subtitle && (
                    <p className="text-gray-600 text-sm mt-1">{related.subtitle}</p>
                  )}
                  <span className="text-xs text-amber-600 mt-2 inline-block">
                    📖 {related.read_time_minutes} min read
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
