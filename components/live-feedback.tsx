export default function LiveFeedback() {
  const feedbackItems = [
    { category: "Clarity", score: 85, color: "bg-green-500" },
    { category: "Confidence", score: 72, color: "bg-blue-500" },
    { category: "Pace", score: 90, color: "bg-green-500" },
  ]

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex-1">
      <h3 className="font-bold text-gray-900 mb-3">Live Feedback</h3>
      <div className="space-y-3">
        {feedbackItems.map((item, idx) => (
          <div key={idx}>
            <div className="flex justify-between items-center mb-1">
              <p className="text-sm font-medium text-gray-700">{item.category}</p>
              <p className="text-sm font-bold text-gray-900">{item.score}%</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`${item.color} h-2 rounded-full transition-all duration-300`}
                style={{ width: `${item.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
