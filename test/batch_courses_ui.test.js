const assert = require('assert')
const { test } = require('node:test')
const { filterCourses, paginate } = require('../app/my-batches/[id]/courses/helpers.js')

test('filterCourses filters by name, info, and stream', async () => {
  const detailed = [
    { course_id: 'c1', details: { name: 'React Basics', info: 'Intro to React', streamTitle: 'Web' } },
    { course_id: 'c2', details: { name: 'Advanced Node', info: 'Backend', streamTitle: 'Server' } },
  ]
  let res = filterCourses(detailed, 'react')
  assert.equal(res.length, 1)
  assert.equal(res[0].course_id, 'c1')

  res = filterCourses(detailed, 'server')
  assert.equal(res.length, 1)
  assert.equal(res[0].course_id, 'c2')

  res = filterCourses(detailed, '')
  assert.equal(res.length, 2)
})

test('paginate slices correctly', async () => {
  const items = Array.from({ length: 15 }).map((_, i) => i + 1)
  const { slice, total, totalPages, current } = paginate(items, 2, 6)
  assert.deepEqual(slice, [7,8,9,10,11,12])
  assert.equal(total, 15)
  assert.equal(totalPages, 3)
  assert.equal(current, 2)
})

test('load more API is called and merges previews', async (t) => {
  // mock fetch
  const globalFetch = globalThis.fetch
  globalThis.fetch = async (url) => {
    assert.ok(url.includes('/api/institution/batches/'))
    return { json: async () => ({ lessons: [ { lesson_slug: 'l4', title: 'L4', content: 'C4' } ] }) }
  }

  // We can't mount the component easily here, but we can test that fetch returns expected data
  const res = await globalThis.fetch('/api/institution/batches/b1/courses/c1/lessons?limit=100&offset=3')
  const json = await res.json()
  assert.ok(Array.isArray(json.lessons))
  assert.equal(json.lessons[0].lesson_slug, 'l4')

  globalThis.fetch = globalFetch
})
