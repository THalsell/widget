'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function AdminNav() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function getUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || null);
      }
    }
    getUser();
  }, []);

  async function handleLogout() {
    setLoading(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Error logging out:', error);
      setLoading(false);
    }
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <Link href="/admin" className="text-xl font-bold text-gray-900">
              Donation Widget
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-6">
            <Link
              href="/admin"
              className="text-gray-700 hover:text-gray-900"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/widgets"
              className="text-gray-700 hover:text-gray-900"
            >
              Widgets
            </Link>

            {/* User Menu */}
            <div className="flex items-center gap-4 ml-4 pl-4 border-l border-gray-200">
              {userEmail && (
                <span className="text-sm text-gray-600">{userEmail}</span>
              )}
              <button
                onClick={handleLogout}
                disabled={loading}
                className="px-3 py-1.5 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded disabled:opacity-50"
              >
                {loading ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
