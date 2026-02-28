export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="text-2xl font-bold text-gray-900">MockZen</div>
        </div>
      </nav>

      <div className="pt-20 pb-8 px-4 sm:px-6 lg:px-8 h-[calc(100vh-80px)] flex flex-col">
        <div className="flex-1 flex flex-col">
          <div className="mb-4 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-96"></div>
          </div>
          <div className="flex-1 bg-gray-100 rounded-lg animate-pulse"></div>
        </div>
      </div>
    </div>
  )
}
