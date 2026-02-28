import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request, { params }: { params: { id: string; courseId: string } }) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Allow institution_admin OR batch member / batch creator to fetch lessons
    const { data: profile } = await supabase.from('users').select('institution_id, user_type').eq('id', user.id).single()

    const _maybeParams: any = params
    const _resolved = _maybeParams && typeof _maybeParams.then === 'function' ? await _maybeParams : _maybeParams
    const batchId = _resolved?.id
    const courseId = _resolved?.courseId

    if (!batchId || !courseId) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

    let authorized = false
    if (profile && profile.user_type === 'institution_admin') {
      authorized = true
    } else {
      // check membership or batch creator
      const { data: batch, error: batchError } = await supabase.from('batches').select('id, created_by_id').eq('id', batchId).single()
      if (!batchError && batch) {
        if (batch.created_by_id === user.id) authorized = true
        else {
          const { data: members, error: membersError } = await supabase.from('batch_members').select('user_id').eq('batch_id', batchId).eq('user_id', user.id).limit(1)
          if (!membersError && members && members.length > 0) authorized = true
        }
      }
    }

    if (!authorized) return NextResponse.json({ error: 'Not authorized' }, { status: 403 })

    // Accept optional limit/offset
    const url = new URL(request.url)
    const limitParam = url.searchParams.get('limit')
    const offsetParam = url.searchParams.get('offset')
    const limit = limitParam ? parseInt(limitParam, 10) : null
    const offset = offsetParam ? parseInt(offsetParam, 10) : null

    let query = supabase.from('course_lessons').select('lesson_slug, title, content, "order"').eq('course_id', courseId).order('order', { ascending: true })
    if (limit !== null) query = query.limit(limit)
    if (offset !== null) query = query.range(offset, offset + (limit || 0) - 1)

    const { data, error } = await query
    if (error) {
      console.error('Error fetching lessons:', error)
      return NextResponse.json({ error: 'Failed to fetch lessons' }, { status: 500 })
    }

    return NextResponse.json({ lessons: data || [] })
  } catch (error: any) {
    console.error('Error in lessons GET API:', error)
    return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: { id: string; courseId: string } }) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('users').select('institution_id, user_type').eq('id', user.id).single()
    if (!profile || profile.user_type !== 'institution_admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const body = await request.json()
    const { lessonSlug, title, content, order } = body

    const _maybeParams: any = params
    const _resolved = _maybeParams && typeof _maybeParams.then === 'function' ? await _maybeParams : _maybeParams
    const courseId = _resolved?.courseId

    if (!courseId || !lessonSlug || !title || !content) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const { data, error } = await supabase.from('course_lessons').insert([{ course_id: courseId, lesson_slug: lessonSlug, title, content, order: order || 0, created_by_id: user.id }]).select()
    if (error) {
      console.error('Error creating lesson:', error)
      return NextResponse.json({ error: 'Failed to create lesson' }, { status: 500 })
    }

    return NextResponse.json({ success: true, lesson: data?.[0] })
  } catch (error: any) {
    console.error('Error in lessons POST API:', error)
    return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string; courseId: string } }) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('users').select('institution_id, user_type').eq('id', user.id).single()
    if (!profile || profile.user_type !== 'institution_admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const body = await request.json()
    const { lessonSlug } = body
    const _maybeParams: any = params
    const _resolved = _maybeParams && typeof _maybeParams.then === 'function' ? await _maybeParams : _maybeParams
    const courseId = _resolved?.courseId

    if (!courseId || !lessonSlug) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

    const { error } = await supabase.from('course_lessons').delete().eq('course_id', courseId).eq('lesson_slug', lessonSlug)
    if (error) {
      console.error('Error deleting lesson:', error)
      return NextResponse.json({ error: 'Failed to delete lesson' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in lessons DELETE API:', error)
    return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 })
  }
}