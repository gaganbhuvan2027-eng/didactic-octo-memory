import { createClient } from '@/lib/supabase/server'
import DashboardNavbar from '@/components/dashboard-navbar'
import Link from 'next/link'
import { Card } from '@/components/ui/card'

export default async function MyBatchDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <main className="min-h-screen bg-white">
        <DashboardNavbar />
        <div className="pt-20 px-4 max-w-7xl mx-auto">
          <p className="text-gray-700">Please <Link href="/auth">sign in</Link> to view this batch.</p>
        </div>
      </main>
    )
  }

  const batchId = params.id

  // Check membership (optional guard)
  const { data: membership, error: membershipError } = await supabase
    .from('batch_members')
    .select('id')
    .eq('batch_id', batchId)
    .eq('user_id', user.id)
    .limit(1)

  if (membershipError) {
    console.error('Error verifying membership:', membershipError)
  }

  if (!membership || membership.length === 0) {
    return (
      <main className="min-h-screen bg-white">
        <DashboardNavbar />
        <div className="pt-20 px-4 max-w-7xl mx-auto">
          <Card className="p-6">
            <div className="text-center text-gray-600">You are not a member of this batch.</div>
            <div className="mt-4 text-center"><Link href="/my-batches" className="text-blue-600">Back to My Batches</Link></div>
          </Card>
        </div>
      </main>
    )
  }

  // Fetch batch and members
  const { data: batchData, error: batchError } = await supabase
    .from('batches')
    .select(`
      *,
      batch_members ( id, user_id, added_at, user:user_id (id, name, email) ),
      join_code
    `)
    .eq('id', batchId)
    .single()

  if (batchError) {
    console.error('Error fetching batch:', batchError)
    return (
      <main className="min-h-screen bg-white">
        <DashboardNavbar />
        <div className="pt-20 px-4 max-w-7xl mx-auto">
          <Card className="p-6">
            <div className="text-center text-gray-600">Batch not found.</div>
            <div className="mt-4 text-center"><Link href="/my-batches" className="text-blue-600">Back to My Batches</Link></div>
          </Card>
        </div>
      </main>
    )
  }

  const batch = batchData

  // Fetch scheduled interviews for this batch (pending and upcoming)
  const nowIso = new Date().toISOString()
  const { data: interviews, error: interviewsError } = await supabase
    .from('scheduled_interviews')
    .select(`*, scheduled_by:scheduled_by_id (id, name), institution:institution_id (id, name)`)
    .eq('batch_id', batchId)
    .eq('status', 'pending')
    .gte('scheduled_date', nowIso)
    .order('scheduled_date', { ascending: true })

  if (interviewsError) console.error('Error fetching scheduled interviews:', interviewsError)

  // Fetch courses added to this batch
  const { data: batchCoursesData, error: batchCoursesError } = await supabase
    .from('batch_courses')
    .select('*')
    .eq('batch_id', batchId)

  if (batchCoursesError) console.error('Error fetching batch courses for member view:', batchCoursesError)

  // Map course ids to course details from lib/courses
  const streams = (await import('@/lib/courses')).default
  const detailedCourses = (batchCoursesData || []).map((row: any) => {
    const courseId = row.course_id
    let details: any = null
    for (const s of streams) {
      const sc = s.subcourses.find((x: any) => x.id === courseId)
      if (sc) {
        details = { ...sc, streamId: s.id, streamTitle: s.title }
        break
      }
    }
    return { id: row.id, course_id: courseId, created_at: row.created_at, details }
  })

  return (
    <main className="min-h-screen bg-white">
      <DashboardNavbar />
      <div className="pt-20 px-4 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">{batch.name}</h1>
            <p className="text-gray-600 mt-1">{batch.description || 'No description'}</p>
          </div>
          <div>
            <Link href="/my-batches" className="text-blue-600">Back to My Batches</Link>
          </div>
        </div>

        {batch.join_code && (
          <Card className="p-4 mb-6">
            <div className="font-medium">Join Code</div>
            <div className="text-xl font-semibold mt-2">{batch.join_code}</div>
          </Card>
        )}

        <Card className="p-4 mb-6">
          <div className="font-medium mb-2">Upcoming practice sessions</div>
          {(!interviews || interviews.length === 0) ? (
            <div className="text-gray-500">No upcoming practice sessions for this batch.</div>
          ) : (
            <div className="space-y-3">
              {interviews.map((iv: any) => (
                <div key={iv.id} className="p-3 border rounded flex items-center justify-between">
                  <div>
                    <div className="font-medium">{iv.title || iv.institution?.name || 'Interview'}</div>
                    <div className="text-sm text-gray-500">Scheduled by: {iv.scheduled_by?.name || '—'}</div>
                    <div className="text-sm text-gray-500">When: {new Date(iv.scheduled_date).toLocaleString()}</div>
                  </div>
                  <div>
                    <Link href={`/interview/${iv.interview_type || 'custom'}`} className="text-blue-600">Open</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-4 mb-6">
          <div className="font-medium mb-2">Course Contents</div>
          {(!detailedCourses || detailedCourses.length === 0) ? (
            <div className="text-gray-500">No courses added to this batch yet.</div>
          ) : (
            <div className="space-y-3">
              {detailedCourses.map((c: any) => (
                <div key={c.id} className="p-3 border rounded flex items-center justify-between">
                  <div>
                    <div className="font-medium">{c.details?.name || c.course_id}</div>
                    <div className="text-sm text-gray-500">{c.details?.info || ''}</div>
                    <div className="text-xs text-gray-400">Stream: {c.details?.streamTitle || '—'}</div>
                  </div>
                  <div>
                    <Link href={`/my-batches/${batch.id}/courses/${c.course_id}`} className="text-blue-600">Open course</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-4 mb-6">
          <div className="font-medium mb-2">Members ({batch.batch_members?.length || 0})</div>
          <div className="space-y-2">
            {(batch.batch_members || []).map((m: any) => (
              <div key={m.id} className="flex items-center justify-between p-2 border rounded">
                <div>
                  <div className="font-medium">{m.user?.name || m.user?.email}</div>
                  <div className="text-sm text-gray-500">{m.user?.email}</div>
                </div>
                <div className="text-xs text-gray-400">Added: {new Date(m.added_at).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </Card>


      </div>
    </main>
  )
}