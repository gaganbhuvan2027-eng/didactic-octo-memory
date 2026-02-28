export function filterCourses(detailed: any[], q: string) {
  const qq = (q || '').toLowerCase().trim()
  if (!qq) return detailed
  return detailed.filter((c: any) => {
    const name = (c.details?.name || '').toString().toLowerCase()
    const info = (c.details?.info || '').toString().toLowerCase()
    const stream = (c.details?.streamTitle || '').toString().toLowerCase()
    return name.includes(qq) || info.includes(qq) || stream.includes(qq) || (c.course_id || '').toString().toLowerCase().includes(qq)
  })
}

export function paginate<T>(items: T[], page: number, perPage: number) {
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  const current = Math.min(Math.max(1, page), totalPages)
  const slice = items.slice((current - 1) * perPage, current * perPage)
  return { slice, total, totalPages, current }
}
