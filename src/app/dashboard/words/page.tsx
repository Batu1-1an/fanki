import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerComponentClient } from '@/lib/supabase/server'
import WordManagementDashboard from '@/components/words/WordManagementDashboard'

export default async function WordsPage() {
  const supabase = await createServerComponentClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                ← Back to Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 mt-2">My Words</h1>
              <p className="text-gray-600">
                Manage your vocabulary collection
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <WordManagementDashboard />
        </div>
      </main>
    </div>
  )
}
