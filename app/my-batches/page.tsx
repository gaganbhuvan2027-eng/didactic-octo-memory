import { createClient } from '@/lib/supabase/server'
import DashboardNavbar from '@/components/dashboard-navbar'
import { Card } from '@/components/ui/card'
import Link from 'next/link'

export default async function MyBatchesPage() {
  console.log('[v0] MyBatches page loading')
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <main className="min-h-screen bg-white">
        <DashboardNavbar />
        <div className="pt-20 px-4 max-w-7xl mx-auto">
          <p className="text-gray-700">Please <Link href="/auth">sign in</Link> to view your batches.</p>
        </div>
      </main>
    )
  }

  // Fetch batches where the current user is a member (safe two-step query)
  const { data: membership, error: membershipError } = await supabase
    .from('batch_members')
    .select('batch_id')
    .eq('user_id', user.id)

  if (membershipError) {
    console.error('Error fetching batch membership:', membershipError)
  }

  const batchIds = (membership || []).map((m: any) => m.batch_id)

  let userBatches: any[] = []
  if (batchIds.length > 0) {
    const { data: batches, error: batchesError } = await supabase
      .from('batches')
      .select('id, name, description, created_at')
      .in('id', batchIds)
      .order('created_at', { ascending: false })

    if (batchesError) {
      console.error('Error fetching batches:', batchesError)
    }

    userBatches = batches || []
  }

  return (
    <main className="min-h-screen bg-white">
      <DashboardNavbar />
      <div className="pt-20 px-4 max-w-7xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">My Batches</h1>

        {userBatches.length === 0 ? (
          <Card className="p-6">
            <div className="text-center text-gray-600">Ask Your Institute Admin Get Added to Batches</div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userBatches.map((b: any) => (
              <Link key={b.id} href={`/my-batches/${b.id}/courses`}>
                <Card className="p-4 cursor-pointer hover:shadow-lg">
                  <div className="font-medium text-lg">{b.name}</div>
                  <div className="text-sm text-gray-500 mt-1">{b.description || 'No description'}</div>
                  <div className="text-xs text-gray-400 mt-2">Created: {new Date(b.created_at).toLocaleDateString()}</div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
