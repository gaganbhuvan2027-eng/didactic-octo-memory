import streams from './courses'

export async function fetchCourseForMember(supabase: any, userId: string, batchId: string, courseId: string) {
  if (!userId) return { allowed: false, status: 401, error: 'Unauthorized' }

  // Validate batch exists
  const { data: batch, error: batchError } = await supabase.from('batches').select('id,created_by_id').eq('id', batchId).single()
  if (batchError || !batch) return { allowed: false, status: 404, error: 'Batch not found' }

  // Check membership
  const { data: members, error: membersError } = await supabase.from('batch_members').select('user_id').eq('batch_id', batchId).eq('user_id', userId).limit(1)
  if (membersError) return { allowed: false, status: 500, error: 'Failed to check membership' }

  const isMember = members && members.length > 0
  const isCreator = batch.created_by_id === userId
  if (!isMember && !isCreator) return { allowed: false, status: 403, error: 'Not a member' }

  // Check course attached to batch
  const { data: rows, error: courseError } = await supabase.from('batch_courses').select('course_id').eq('batch_id', batchId).eq('course_id', courseId).limit(1)
  if (courseError) return { allowed: false, status: 500, error: 'Failed to fetch batch course' }
  if (!rows || rows.length === 0) return { allowed: false, status: 404, error: 'Course not added to batch' }

  // Resolve course details
  let found: any = null
  outer: for (const s of streams) {
    for (const sc of s.subcourses) {
      if (sc.id === courseId) {
        found = { ...sc, streamId: s.id, streamTitle: s.title }
        break outer
      }
    }
  }

  if (!found) return { allowed: false, status: 404, error: 'Course id not found' }

  // Try fetching lessons from DB
  const { data: lessonRows, error: lessonError } = await supabase
    .from('course_lessons')
    .select('lesson_slug, title, content, order')
    .eq('course_id', courseId)
    .order('order', { ascending: true })

  if (lessonError) {
    console.error('Error fetching course lessons:', lessonError)
  }

  let lessons = [] as any[]
  if (lessonRows && lessonRows.length > 0) {
    lessons = lessonRows.map((r: any) => ({ id: r.lesson_slug, title: r.title, content: r.content }))
  } else {
    // Fallback placeholder lessons
    lessons = [
      { id: 'intro', title: 'Introduction', content: `Welcome to ${found.name}.` },
      { id: 'lesson-1', title: 'Lesson 1', content: `Core concepts for ${found.name}.` },
    ]
  }

  return { allowed: true, status: 200, course: found, lessons }
}
