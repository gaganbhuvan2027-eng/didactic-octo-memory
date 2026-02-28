import { createClient } from '@/lib/supabase/server'
import DashboardNavbar from '@/components/dashboard-navbar'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { redirect } from 'next/navigation'

// Client component to start scheduled interview
import StartScheduledInterviewButton from '@/components/start-scheduled-interview-button'
// Client component to render live-updating scheduled interviews
import InstitutionScheduledList from '@/components/institution-scheduled-list'

export default async function InstitutionInterviewsPage({ searchParams }: { searchParams?: { id?: string } }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    // Not signed in
    return (
      <main className="min-h-screen bg-white">
        <DashboardNavbar />
        <div className="pt-20 px-4 max-w-7xl mx-auto">
          <p className="text-gray-700">Please <Link href="/auth">sign in</Link> to view scheduled interviews.</p>
        </div>
      </main>
    )
  }

  // Determine institution id: prefer query param, else user's profile
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const requestedInstId = resolvedSearchParams?.id

  const { data: profile } = await supabase.from('users').select('institution_id').eq('id', user.id).single()
  const institutionId = requestedInstId || profile?.institution_id

  if (!institutionId) {
    return (
      <main className="min-h-screen bg-white">
        <DashboardNavbar />
        <div className="pt-20 px-4 max-w-7xl mx-auto">
          <h1 className="text-2xl font-semibold mb-2">Scheduled interviews</h1>
          <p className="text-gray-600">You haven't joined an institute yet.</p>
        </div>
      </main>
    )
  }

  // Fetch upcoming scheduled interviews for the institution
  const now = new Date().toISOString()

  const { data: interviews, error } = await supabase
    .from('scheduled_interviews')
    .select(`*, member:member_id(id, name, email), scheduled_by:scheduled_by_id(name)`)
    .eq('institution_id', institutionId)
    .gte('scheduled_date', now)
    .order('scheduled_date', { ascending: true })

  if (error) {
    console.error('Error fetching scheduled interviews:', error)
    return (
      <main className="min-h-screen bg-white">
        <DashboardNavbar />
        <div className="pt-20 px-4 max-w-7xl mx-auto">
          <h1 className="text-2xl font-semibold mb-2">Scheduled interviews</h1>
          <p className="text-red-600">Failed to load scheduled interviews.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white">
      <DashboardNavbar />
      <div className="pt-20 px-4 max-w-7xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">Scheduled interviews</h1>

        {/* Client-side live list that polls for updates */}
        {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
        {/* @ts-ignore */}
        <InstitutionScheduledList initial={interviews || []} institutionId={institutionId} />
      </div>
    </main>
  )
}
