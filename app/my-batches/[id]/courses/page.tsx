import { createClient } from '@/lib/supabase/server'
import DashboardNavbar from '@/components/dashboard-navbar'
import Link from 'next/link'
import { Card } from '@/components/ui/card'

export default async function BatchCoursesListPage({ params, searchParams }: { params: { id: string }, searchParams: { q?: string, page?: string } }) {
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

  const _maybeParams: any = params
  const _resolved = _maybeParams && typeof _maybeParams.then === 'function' ? await _maybeParams : _maybeParams
  const batchId = _resolved?.id
  const q = (searchParams?.q || '').toString().trim().toLowerCase()
  const pageNum = parseInt((searchParams?.page as string) || '1', 10) || 1
  const perPage = 6

  // Verify membership
  const { data: membership } = await supabase
    .from('batch_members')
    .select('id')
    .eq('batch_id', batchId)
    .eq('user_id', user.id)
    .limit(1)

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

  // Fetch batch courses
  const { data: batchCoursesData, error: batchCoursesError } = await supabase
    .from('batch_courses')
    .select('*')
    .eq('batch_id', batchId)

  if (batchCoursesError) console.error('Error fetching batch courses:', batchCoursesError)

  const streams = (await import('@/lib/courses')).default

  // Map to detailed courses and fetch lesson previews/count (server-side initial data)
  const detailed = await Promise.all((batchCoursesData || []).map(async (row: any) => {
    const courseId = row.course_id
    let details: any | null = null
    for (const s of streams) {
      const sc = s.subcourses.find((x: any) => x.id === courseId)
      if (sc) {
        details = { ...sc, streamId: s.id, streamTitle: s.title }
        break
      }
    }

    let lessonCount = 0
    let previews: any[] = []
    try {
      // get previews (limit 3)
      const { data: previewRows, error: previewError } = await supabase
        .from('course_lessons')
        .select('lesson_slug, title, content, "order"')
        .eq('course_id', courseId)
        .order('order', { ascending: true })
        .limit(3)
      if (previewError) {
        console.error('Error fetching lesson previews:', previewError)
      } else if (previewRows) {
        previews = previewRows.map((r: any) => ({ id: r.lesson_slug, title: r.title, content: r.content }))
      }

      // get count (use exact count)
      const { data: countData, error: countError, count } = await supabase
        .from('course_lessons')
        .select('id', { count: 'exact' })
        .eq('course_id', courseId)
      if (countError) {
        console.error('Error fetching lesson count:', countError)
      } else if (typeof count === 'number') {
        lessonCount = count
      } else if (Array.isArray(countData)) {
        lessonCount = countData.length
      }
    } catch (err) {
      console.error('Error reading course lessons:', err)
    }

    return { course_id: courseId, details, lessonCount, previews }
  }))

  // Render client-side component to allow instant search and load-more
  const CoursesListClient = (await import('./CoursesListClient')).default

  // Apply search filter
  const filtered = detailed.filter((c: any) => {
    if (!q) return true
    const name = (c.details?.name || '').toString().toLowerCase()
    const info = (c.details?.info || '').toString().toLowerCase()
    const stream = (c.details?.streamTitle || '').toString().toLowerCase()
    return name.includes(q) || info.includes(q) || stream.includes(q) || (c.course_id || '').toString().toLowerCase().includes(q)
  })

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  const currentPage = Math.min(Math.max(1, pageNum), totalPages)
  const pageItems = filtered.slice((currentPage - 1) * perPage, currentPage * perPage)

  return (
    <main className="min-h-screen bg-white">
      <DashboardNavbar />
      <div className="pt-20 px-4 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Courses in this batch</h1>
            <p className="text-gray-600 mt-1">All courses assigned to this batch are listed below. Click a course to view full content.</p>
          </div>
          <div>
            <Link href="/my-batches" className="text-blue-600">Back to My Batches</Link>
          </div>
        </div>

        {/* Render client component for instant search and load-more */}
        <CoursesListClient batchId={batchId} initialCourses={detailed} />

      </div>
    </main>
  )
}
