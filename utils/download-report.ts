// PDF generation using browser canvas
export function downloadInterviewReportPDF(analysis: any, interviewType: string) {
  const date = new Date().toLocaleDateString()
  const time = new Date().toLocaleTimeString()
  const rawType = interviewType || ''
  const isOtherInterview = rawType.startsWith('other-')
  const displayType = isOtherInterview
    ? rawType.replace('other-', '').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : interviewType

  // Create PDF content as HTML
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>MockZen Interview Report</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #1a1a1a; }
        .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #2563eb; }
        .header h1 { color: #2563eb; font-size: 28px; margin-bottom: 5px; }
        .header p { color: #666; font-size: 14px; }
        .score-card { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px; }
        .score-card .score { font-size: 64px; font-weight: bold; }
        .score-card .label { font-size: 18px; opacity: 0.9; }
        .metrics { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 30px; }
        .metric { background: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb; }
        .metric .name { color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
        .metric .value { color: #1e293b; font-size: 24px; font-weight: bold; margin-top: 5px; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #1e293b; font-size: 18px; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #e2e8f0; }
        .section p { color: #475569; line-height: 1.7; }
        .list { list-style: none; }
        .list li { padding: 10px 0; padding-left: 25px; position: relative; border-bottom: 1px solid #f1f5f9; }
        .list li:last-child { border-bottom: none; }
        .list.strengths li::before { content: "✓"; position: absolute; left: 0; color: #22c55e; font-weight: bold; }
        .list.improvements li::before { content: "→"; position: absolute; left: 0; color: #2563eb; font-weight: bold; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 12px; }
        @media print { body { padding: 20px; } .score-card { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>MockZen Interview Report</h1>
        <p>${displayType} | ${date} at ${time}</p>
      </div>
      
      <div class="score-card">
        <div class="score">${analysis.overall_score}</div>
        <div class="label">Overall Score out of 100</div>
      </div>
      
      <div class="metrics">
        <div class="metric">
          <div class="name">Communication</div>
          <div class="value">${analysis.communication_score}/100</div>
        </div>
        <div class="metric">
          <div class="name">Confidence</div>
          <div class="value">${analysis.confidence_score}/100</div>
        </div>
        ${isOtherInterview ? `
        <div class="metric">
          <div class="name">Response Quality</div>
          <div class="value">${analysis.problem_solving_score ?? analysis.overall_score}/100</div>
        </div>
        ` : `
        <div class="metric">
          <div class="name">Technical Knowledge</div>
          <div class="value">${analysis.technical_score}/100</div>
        </div>
        <div class="metric">
          <div class="name">Problem Solving</div>
          <div class="value">${analysis.problem_solving_score || 'N/A'}</div>
        </div>
        ${analysis.dsa_score ? `<div class="metric"><div class="name">DSA Skills</div><div class="value">${analysis.dsa_score}/100</div></div>` : ''}
        `}
      </div>
      
      <div class="section">
        <h2>Executive Summary</h2>
        <p>${analysis.detailed_feedback || 'No detailed feedback available.'}</p>
      </div>
      
      <div class="section">
        <h2>Key Strengths</h2>
        <ul class="list strengths">
          ${(analysis.strengths || []).map((s: any) => {
            const text = typeof s === 'string' ? s : (s && typeof s === 'object' && (s.term || s.meaning) ? [s.term, s.meaning].filter(Boolean).join(': ') : String(s ?? ''))
            return `<li>${text}</li>`
          }).join('')}
        </ul>
      </div>
      
      <div class="section">
        <h2>Areas for Improvement</h2>
        <ul class="list improvements">
          ${(analysis.improvements || []).map((s: any) => {
            const text = typeof s === 'string' ? s : (s && typeof s === 'object' && (s.term || s.meaning) ? [s.term, s.meaning].filter(Boolean).join(': ') : String(s ?? ''))
            return `<li>${text}</li>`
          }).join('')}
        </ul>
      </div>
      
      <div class="section">
        <h2>Recommendations</h2>
        <p>Based on your performance, we recommend focusing on the areas listed above. Practice regularly with MockZen to track your progress and improve your interview skills.</p>
      </div>
      
      <div class="footer">
        <p>Generated by MockZen AI Interview Platform</p>
        <p>This report is confidential and intended for the recipient only.</p>
      </div>
    </body>
    </html>
  `

  printToPDF(htmlContent, `interview-report-${interviewType.replace(/\s+/g, '-')}-${Date.now()}.pdf`)
}

export function downloadResumeReportPDF(result: any, fileName: string) {
  const date = new Date().toLocaleDateString()
  const time = new Date().toLocaleTimeString()
  
  // Handle both 'score' and 'overall_score' field names
  const overallScore = result.score || result.overall_score || 0
  const atsScore = result.ats_score || result.atsScore || 0

  const sectionsHTML = (result.sections || []).map((s: any) => `
    <div class="section-card">
      <div class="section-header">
        <span class="section-name">${s.name}</span>
        <span class="section-score ${s.score >= 80 ? 'good' : s.score >= 60 ? 'okay' : 'needs-work'}">${s.score}/100</span>
      </div>
      <p class="section-feedback">${s.feedback}</p>
    </div>
  `).join('')

  const keywordsHTML = result.keyword_analysis ? `
    <div class="section">
      <h2>Keyword Analysis</h2>
      <div class="keyword-grid">
        <div class="keyword-box found">
          <h4>Keywords Found</h4>
          <p>${(result.keyword_analysis.found_keywords || []).join(', ') || 'None detected'}</p>
        </div>
        <div class="keyword-box missing">
          <h4>Recommended Keywords</h4>
          <p>${(result.keyword_analysis.missing_keywords || []).join(', ') || 'None suggested'}</p>
        </div>
      </div>
    </div>
  ` : ''

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>MockZen Resume Scan Report</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #1a1a1a; }
        .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #2563eb; }
        .header h1 { color: #2563eb; font-size: 28px; margin-bottom: 5px; }
        .header p { color: #666; font-size: 14px; }
        .scores-row { display: flex; gap: 20px; margin-bottom: 30px; }
        .score-card { flex: 1; padding: 25px; border-radius: 12px; text-align: center; color: white; }
        .score-card.overall { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); }
        .score-card.ats { background: linear-gradient(135deg, #059669 0%, #047857 100%); }
        .score-card .score { font-size: 48px; font-weight: bold; }
        .score-card .label { font-size: 14px; opacity: 0.9; margin-top: 5px; }
        .summary-box { background: #f0f9ff; border-left: 4px solid #2563eb; padding: 20px; margin-bottom: 30px; border-radius: 0 8px 8px 0; }
        .summary-box p { color: #1e40af; line-height: 1.6; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #1e293b; font-size: 18px; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #e2e8f0; }
        .section p { color: #475569; line-height: 1.7; }
        .section-card { background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 10px; }
        .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .section-name { font-weight: 600; color: #1e293b; }
        .section-score { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
        .section-score.good { background: #dcfce7; color: #166534; }
        .section-score.okay { background: #fef3c7; color: #92400e; }
        .section-score.needs-work { background: #fee2e2; color: #991b1b; }
        .section-feedback { color: #64748b; font-size: 14px; }
        .list { list-style: none; }
        .list li { padding: 10px 0; padding-left: 25px; position: relative; border-bottom: 1px solid #f1f5f9; }
        .list li:last-child { border-bottom: none; }
        .list.strengths li::before { content: "✓"; position: absolute; left: 0; color: #22c55e; font-weight: bold; }
        .list.improvements li::before { content: "→"; position: absolute; left: 0; color: #2563eb; font-weight: bold; }
        .keyword-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
        .keyword-box { padding: 15px; border-radius: 8px; }
        .keyword-box.found { background: #dcfce7; }
        .keyword-box.missing { background: #fef3c7; }
        .keyword-box h4 { font-size: 12px; text-transform: uppercase; margin-bottom: 8px; color: #374151; }
        .keyword-box p { font-size: 13px; color: #4b5563; }
        .detailed-feedback { background: #f8fafc; padding: 20px; border-radius: 8px; margin-top: 15px; }
        .detailed-feedback p { white-space: pre-wrap; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 12px; }
        @media print { body { padding: 20px; } .score-card { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>MockZen Resume Scan Report</h1>
        <p>File: ${fileName} | ${date} at ${time}</p>
      </div>
      
      <div class="scores-row">
        <div class="score-card overall">
          <div class="score">${overallScore}</div>
          <div class="label">Overall Score</div>
        </div>
        ${atsScore ? `
        <div class="score-card ats">
          <div class="score">${atsScore}</div>
          <div class="label">ATS Compatibility</div>
        </div>
        ` : ''}
      </div>
      
      <div class="summary-box">
        <p><strong>Summary:</strong> ${result.summary}</p>
      </div>
      
      <div class="section">
        <h2>Section-by-Section Analysis</h2>
        ${sectionsHTML}
      </div>
      
      <div class="section">
        <h2>Key Strengths</h2>
        <ul class="list strengths">
          ${(result.strengths || []).map((s: any) => {
            const text = typeof s === 'string' ? s : (s && typeof s === 'object' && (s.term || s.meaning) ? [s.term, s.meaning].filter(Boolean).join(': ') : String(s ?? ''))
            return `<li>${text}</li>`
          }).join('')}
        </ul>
      </div>
      
      <div class="section">
        <h2>Priority Improvements</h2>
        <ul class="list improvements">
          ${(result.improvements || []).map((s: any) => {
            const text = typeof s === 'string' ? s : (s && typeof s === 'object' && (s.term || s.meaning) ? [s.term, s.meaning].filter(Boolean).join(': ') : String(s ?? ''))
            return `<li>${text}</li>`
          }).join('')}
        </ul>
      </div>
      
      ${keywordsHTML}
      
      ${(result.ideal_jobs?.roles?.length > 0 || result.ideal_jobs?.companies?.length > 0) ? `
      <div class="section">
        <h2>Ideal Jobs for You</h2>
        <p style="color: #64748b; margin-bottom: 10px;">Based on your resume, these roles and companies are a good fit:</p>
        ${result.ideal_jobs.roles?.length ? `<p><strong>Recommended Roles:</strong> ${result.ideal_jobs.roles.map((id: string) => id.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())).join(', ')}</p>` : ''}
        ${result.ideal_jobs.companies?.length ? `<p><strong>Recommended Companies:</strong> ${result.ideal_jobs.companies.map((id: string) => id.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())).join(', ')}</p>` : ''}
      </div>
      ` : ''}
      
      ${result.detailed_feedback ? `
      <div class="section">
        <h2>Detailed Feedback</h2>
        <div class="detailed-feedback">
          <p>${result.detailed_feedback}</p>
        </div>
      </div>
      ` : ''}
      
      <div class="footer">
        <p>Generated by MockZen AI Resume Scanner</p>
        <p>Use this feedback to optimize your resume for better job opportunities.</p>
      </div>
    </body>
    </html>
  `

  printToPDF(htmlContent, `resume-report-${Date.now()}.pdf`)
}

// Performance Report PDF
export function downloadPerformanceReportPDF(performanceData: any) {
  const date = new Date().toLocaleDateString()
  const time = new Date().toLocaleTimeString()

  const byTypeHTML = (performanceData.byType || []).map((item: any) => `
    <div class="type-card">
      <h4>${item.type}</h4>
      <div class="type-stats">
        <span>Completed: <strong>${item.completed}</strong></span>
        <span>Avg Score: <strong>${item.avgScore}%</strong></span>
        <span>Best: <strong>${item.bestScore}%</strong></span>
      </div>
    </div>
  `).join('')

  const strengthsHTML = (performanceData.strengths || []).map((item: any) => `
    <div class="strength-item">
      <span class="skill-name">${item.skill}</span>
      <span class="skill-score">${item.score}%</span>
    </div>
  `).join('')

  const improvementsHTML = (performanceData.areasToImprove || []).map((item: any) => `
    <div class="improvement-item">
      <strong>${item.area}</strong>
      <p>${item.description || ''}</p>
    </div>
  `).join('')

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>MockZen Performance Report</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #1a1a1a; }
        .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #2563eb; }
        .header h1 { color: #2563eb; font-size: 28px; margin-bottom: 5px; }
        .header p { color: #666; font-size: 14px; }
        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 30px; }
        .stat-card { background: #f8fafc; padding: 20px; border-radius: 8px; text-align: center; }
        .stat-card .value { font-size: 32px; font-weight: bold; color: #2563eb; }
        .stat-card .label { font-size: 12px; color: #64748b; margin-top: 5px; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #1e293b; font-size: 18px; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #e2e8f0; }
        .type-card { background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 10px; }
        .type-card h4 { color: #1e293b; margin-bottom: 8px; }
        .type-stats { display: flex; gap: 20px; font-size: 14px; color: #64748b; }
        .type-stats strong { color: #1e293b; }
        .strength-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
        .skill-name { color: #1e293b; }
        .skill-score { font-weight: bold; color: #22c55e; }
        .improvement-item { padding: 12px; background: #fef3c7; border-radius: 8px; margin-bottom: 10px; }
        .improvement-item strong { color: #92400e; }
        .improvement-item p { color: #78716c; font-size: 13px; margin-top: 5px; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 12px; }
        @media print { body { padding: 20px; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>MockZen Performance Report</h1>
        <p>Generated on ${date} at ${time}</p>
      </div>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="value">${performanceData.overall?.totalInterviews || 0}</div>
          <div class="label">Total Interviews</div>
        </div>
        <div class="stat-card">
          <div class="value">${performanceData.overall?.averageScore || 0}%</div>
          <div class="label">Average Score</div>
        </div>
        <div class="stat-card">
          <div class="value">${performanceData.overall?.highestScore || 0}%</div>
          <div class="label">Highest Score</div>
        </div>
        <div class="stat-card">
          <div class="value">${performanceData.overall?.lowestScore || 0}%</div>
          <div class="label">Lowest Score</div>
        </div>
        <div class="stat-card">
          <div class="value">${performanceData.overall?.totalTimeSpent || '0h'}</div>
          <div class="label">Time Spent</div>
        </div>
        <div class="stat-card">
          <div class="value">${performanceData.overall?.improvementRate || '0%'}</div>
          <div class="label">Improvement</div>
        </div>
      </div>
      
      ${performanceData.byType && performanceData.byType.length > 0 ? `
      <div class="section">
        <h2>Performance by Interview Type</h2>
        ${byTypeHTML}
      </div>
      ` : ''}
      
      ${performanceData.strengths && performanceData.strengths.length > 0 ? `
      <div class="section">
        <h2>Your Strengths</h2>
        ${strengthsHTML}
      </div>
      ` : ''}
      
      ${performanceData.areasToImprove && performanceData.areasToImprove.length > 0 ? `
      <div class="section">
        <h2>Areas for Improvement</h2>
        ${improvementsHTML}
      </div>
      ` : ''}
      
      <div class="footer">
        <p>Generated by MockZen AI Interview Platform</p>
        <p>Keep practicing to improve your interview skills!</p>
      </div>
    </body>
    </html>
  `

  printToPDF(htmlContent, `performance-report-${Date.now()}.pdf`)
}

// Legacy text-based download functions (kept for fallback)
export function downloadInterviewReport(analysis: any, interviewType: string) {
  downloadInterviewReportPDF(analysis, interviewType)
}

export function downloadResumeReport(result: any, fileName: string) {
  downloadResumeReportPDF(result, fileName)
}

export function downloadPerformanceReport(performanceData: any) {
  downloadPerformanceReportPDF(performanceData)
}

function printToPDF(htmlContent: string, filename: string) {
  // Create a new window with the HTML content
  const printWindow = window.open('', '_blank', 'width=800,height=600')
  
  if (!printWindow) {
    // Fallback: download as HTML if popup blocked
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename.replace('.pdf', '.html')
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    return
  }

  printWindow.document.write(htmlContent)
  printWindow.document.close()

  // Wait for content to load, then trigger print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print()
      // Close the window after printing (user can cancel to keep it open)
    }, 250)
  }
}
