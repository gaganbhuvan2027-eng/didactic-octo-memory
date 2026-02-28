import { createClient } from '@/lib/supabase/server'
import DashboardNavbar from '@/components/dashboard-navbar'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function CourseContentPage({ params }: { params: { id: string; courseId: string } }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <main className="min-h-screen bg-white">
        <DashboardNavbar />
        <div className="pt-20 px-4 max-w-7xl mx-auto">
          <p className="text-gray-700">Please <Link href="/auth">sign in</Link> to view this course.</p>
        </div>
      </main>
    )
  }

  const batchId = params.id
  const courseId = params.courseId

  // Use helper to fetch and authorize access
  const { fetchCourseForMember } = await import('@/lib/courseContentServer')
  const res = await fetchCourseForMember(supabase, user.id, batchId, courseId)

  if (!res.allowed) {
    return (
      <main className="min-h-screen bg-white">
        <DashboardNavbar />
        <div className="pt-20 px-4 max-w-7xl mx-auto">
          <Card className="p-6">
            <div className="text-center text-gray-600">{res.error || 'You are not allowed to view this content.'}</div>
            <div className="mt-4 text-center"><Link href="/my-batches" className="text-blue-600">Back to My Batches</Link></div>
          </Card>
        </div>
      </main>
    )
  }

  const courseDetails = res.course
  const lessons = res.lessons || []


  return (
    <main className="min-h-screen bg-white">
      <DashboardNavbar />
      <div className="pt-20 px-4 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">{courseDetails.name}</h1>
            <p className="text-gray-600 mt-1">Stream: {courseDetails.streamTitle} — Difficulty: {courseDetails.difficulty}</p>
            <p className="text-sm text-gray-500 mt-2">{courseDetails.info}</p>
          </div>
          <div>
            <Link href={`/my-batches/${batchId}`} className="text-blue-600">Back to Batch</Link>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Lessons</CardTitle>
          </CardHeader>
          <CardContent>
            {(!lessons || lessons.length === 0) ? (
              <div className="text-center text-gray-500 py-6">No lessons added to this course yet.</div>
            ) : (
              <div className="space-y-4">
                {lessons.map((l) => (
                  <article key={l.id} id={l.id} className="p-4 border rounded">
                    <h3 className="font-medium">{l.title}</h3>
                    <p className="text-sm text-gray-700 mt-2">{l.content}</p>
                  </article>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
