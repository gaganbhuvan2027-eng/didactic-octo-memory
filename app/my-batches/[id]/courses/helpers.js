function filterCourses(detailed, q) {
  const qq = (q || '').toLowerCase().trim()
  if (!qq) return detailed
  return detailed.filter((c) => {
    const name = (c.details && c.details.name || '').toString().toLowerCase()
    const info = (c.details && c.details.info || '').toString().toLowerCase()
    const stream = (c.details && c.details.streamTitle || '').toString().toLowerCase()
    return name.includes(qq) || info.includes(qq) || stream.includes(qq) || (c.course_id || '').toString().toLowerCase().includes(qq)
  })
}

function paginate(items, page, perPage) {
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  const current = Math.min(Math.max(1, page), totalPages)
  const slice = items.slice((current - 1) * perPage, current * perPage)
  return { slice, total, totalPages, current }
}

module.exports = { filterCourses, paginate }