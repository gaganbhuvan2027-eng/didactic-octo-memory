import { createClient } from '@/lib/supabase/server'
import DashboardNavbar from '@/components/dashboard-navbar'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import ProfileModal from '@/components/profile-modal'
import QuickAction from '@/components/quick-action'

export default async function MyInstitutePage() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    // User not authenticated — redirect to auth
    return (
      <main className="min-h-screen bg-white">
        <DashboardNavbar />
        <div className="pt-20 px-4 max-w-7xl mx-auto">
          <p className="text-gray-700">Please <Link href="/auth">sign in</Link> to view your institute.</p>
        </div>
      </main>
    )
  }

  // Fetch user's profile to get institution_id
  const { data: profile } = await supabase.from('users').select('institution_id').eq('id', user.id).single()

  const institutionId = profile?.institution_id

  if (!institutionId) {
    return (
      <main className="min-h-screen bg-white">
        <DashboardNavbar />
        <div className="pt-20 px-4 max-w-7xl mx-auto">
          <h1 className="text-2xl font-semibold mb-2">My Institute</h1>
          <p className="text-gray-600">You haven't joined an institute yet.</p>
          <p className="mt-4"><Link href="/profile">Go to Profile to join an institute</Link></p>
        </div>
      </main>
    )
  }

  const { data: institution, error: instErr } = await supabase.from('institutions').select('id, name, email_domain, created_at').eq('id', institutionId).single()

  if (instErr || !institution) {
    return (
      <main className="min-h-screen bg-white">
        <DashboardNavbar />
        <div className="pt-20 px-4 max-w-7xl mx-auto">
          <h1 className="text-2xl font-semibold mb-2">My Institute</h1>
          <p className="text-gray-600">Could not load your institute.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white">
      <DashboardNavbar />
      <div className="pt-20 px-4 max-w-7xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">My Institute</h1>
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold">{institution.name}</h2>
          <p className="text-sm text-gray-600 mt-1">Domain: {institution.email_domain || '—'}</p>
          <p className="text-sm text-gray-600 mt-1">Created: {new Date(institution.created_at).toLocaleDateString()}</p>
        </Card>

        <div>
          <h3 className="text-lg font-semibold mb-2">Quick actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <QuickAction href={`/institution-interviews?id=${institution.id}`}>
              <Card className="p-4 cursor-pointer">Scheduled interviews</Card>
            </QuickAction>
            <QuickAction href="/my-batches">
              <Card className="p-4 cursor-pointer">My Batches</Card>
            </QuickAction>
            {/* Open profile as a modal */}
            <ProfileModal>
              <Card className="p-4 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>Manage my profile</div>
                </div>
              </Card>
            </ProfileModal>
          </div>
        </div>
      </div>
    </main>
  )
}
