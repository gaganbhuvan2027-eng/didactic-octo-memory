"use client"
import React, { useMemo, useState } from 'react'
import Link from 'next/link'

type LessonPreview = { id: string; title: string; content: string }

type CourseItem = {
  course_id: string
  details: any
  lessonCount: number
  previews: LessonPreview[]
}

export default function CoursesListClient({ batchId, initialCourses }: { batchId: string; initialCourses: CourseItem[] }) {
  const [query, setQuery] = useState('')
  const [courses, setCourses] = useState<CourseItem[]>(initialCourses)
  const [page, setPage] = useState(1)
  const perPage = 6

  const filtered = useMemo(() => {
    const q = (query || '').toLowerCase().trim()
    if (!q) return courses
    return courses.filter((c) => {
      const name = (c.details?.name || '').toString().toLowerCase()
      const info = (c.details?.info || '').toString().toLowerCase()
      const stream = (c.details?.streamTitle || '').toString().toLowerCase()
      return name.includes(q) || info.includes(q) || stream.includes(q) || c.course_id.toLowerCase().includes(q)
    })
  }, [courses, query])

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const pageItems = filtered.slice((page - 1) * perPage, page * perPage)

  async function loadMore(batchId: string, courseId: string, courseIdx: number) {
    try {
      const res = await fetch(`/api/institution/batches/${batchId}/courses/${courseId}/lessons?limit=100&offset=3`, { method: 'GET' })
      const json = await res.json()
      const more: LessonPreview[] = (json.lessons || []).map((r: any) => ({ id: r.lesson_slug, title: r.title, content: r.content }))
      setCourses((prev) => {
        const copy = [...prev]
        const existing = copy[courseIdx]
        if (!existing) return prev
        const mergedPreviews = [...(existing.previews || []), ...more]
        copy[courseIdx] = { ...existing, previews: mergedPreviews, lessonCount: Math.max(existing.lessonCount, mergedPreviews.length) }
        return copy
      })
    } catch (err) {
      console.error('Error loading more lessons:', err)
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1) }} placeholder="Search courses" className="border rounded px-3 py-2" />
      </div>

      <div className="space-y-3">
        {pageItems.map((c, idx) => (
          <div key={c.course_id} className="p-4 border rounded">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-medium">{c.details?.name || c.course_id}</div>
                <div className="text-sm text-gray-500 mt-1">{c.details?.info || ''}</div>
                <div className="text-xs text-gray-400 mt-2">Lessons: {c.lessonCount}</div>

                {(c.previews && c.previews.length > 0) ? (
                  <div className="mt-3 space-y-2">
                    {c.previews.map((p) => (
                      <div key={p.id} className="p-2 border rounded bg-gray-50">
                        <div className="text-sm font-medium">{p.title}</div>
                        <div className="text-xs text-gray-600 mt-1">{p.content?.slice(0, 140)}{p.content?.length > 140 ? '...' : ''}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 text-sm text-gray-500">No previews</div>
                )}

              </div>
              <div className="ml-4 flex flex-col items-end gap-2">
                <Link href={`/my-batches/${batchId}/courses/${c.course_id}`} className="text-blue-600">Open course</Link>
                <button className="text-sm text-blue-600" onClick={() => loadMore(batchId, c.course_id, (page - 1) * perPage + idx)}>Load more</button>
              </div>
            </div>
          </div>
        ))}

        <div className="flex items-center justify-center gap-2 mt-4">
          <button disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className={`px-3 py-1 border rounded ${page === 1 ? 'text-gray-400' : 'text-blue-600'}`}>Prev</button>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button key={i} onClick={() => setPage(i + 1)} className={`px-3 py-1 border rounded ${page === (i + 1) ? 'bg-blue-100' : ''}`}>{i + 1}</button>
          ))}
          <button disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className={`px-3 py-1 border rounded ${page === totalPages ? 'text-gray-400' : 'text-blue-600'}`}>Next</button>
        </div>
      </div>
    </div>
  )
}
