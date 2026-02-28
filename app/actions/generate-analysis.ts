'use server'

import { createRestClient } from '@/lib/supabase/rest-client'
import { generateText } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import { createClient } from '@/lib/supabase/server';

const groqClient = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

const supabaseAdmin = createRestClient({ useServiceRole: true })

interface SupabaseResult<T> {
  data: T | null;
  error: any | null;
}

export async function generateAnalysis(interviewId: string, interviewType: string, questionsSkipped: number = 0) {
  const supabase = await createClient();
  try {
    console.log("[v0] Generating analysis for interview:", interviewId)

    if (!interviewId) {
      throw new Error("Interview ID is required")
    }

    const { data: responses, error: responsesError }: SupabaseResult<any[]> = await supabaseAdmin
      .from("interview_responses")
      .select("*")
      .eq("interview_id", interviewId)
      .order("question_number", { ascending: true })

    if (responsesError) {
      console.error("[v0] Error fetching responses:", responsesError)
      throw new Error("Failed to fetch responses")
    }

    // Add immediate null check for responses
    if (!responses) {
      console.log("[v0] No responses data found (null), treating as no participation.")
      // Proceed to the no participation logic (which is already present and will handle setting analysis)
    }

    // Exclude placeholder answers (no real transcription/participation)
    const isPlaceholderAnswer = (a: string) => {
      if (!a || typeof a !== "string") return true;
      const s = a.toLowerCase().trim();
      return (
        s.includes("transcription pending") ||
        s.includes("user's recorded response - transcription pending") ||
        s === "no speech detected"
      );
    };
    const answeredQuestions = responses ? responses.filter(
      (r: any) =>
        r.answer &&
        r.answer.trim() !== "" &&
        !r.answer.toUpperCase().includes("[SKIPPED]") &&
        !isPlaceholderAnswer(r.answer)
    ).length : 0;

    let interviewQuestionCount = 0;
    let interviewRound: string | null = null;
    try {
      const { data: interviewData, error: interviewError } = await supabase
        .from("interviews")
        .select("question_count, round")
        .eq("id", interviewId)
        .single();

      if (interviewError) {
        console.error("[v0] Error fetching interview question_count:", interviewError);
      }

      if (interviewData) {
        if (interviewData.question_count) interviewQuestionCount = interviewData.question_count;
        if (interviewData.round) interviewRound = interviewData.round;
      }
    } catch (err) {
      console.error("[v0] Unexpected error fetching interview data:", err);
    }

    const totalQuestions = interviewQuestionCount > 0 ? interviewQuestionCount : (responses ? responses.length : 0);
    console.log(`[v0] totalQuestions: ${totalQuestions}, answeredQuestions: ${answeredQuestions}`);

    // Calculate number of questions not answered.
    // This includes questions that were skipped or simply had no response.
    const notAnsweredQuestions = totalQuestions - answeredQuestions;
    console.log(`[v0] totalQuestions: ${totalQuestions}, answeredQuestions: ${answeredQuestions}`);

    // Build a general, overall description of the interview (used when AI doesn't provide feedback)
    const buildResponseSummary = (): string => {
      if (!responses || responses.length === 0) {
        return `Overall, this interview showed no participation. No responses were recorded for any of the questions. To receive detailed feedback, please provide substantive answers in your next session.`
      }
      let skippedCount = 0
      let answeredCount = 0
      let hadBrief = false
      for (const r of responses) {
        const ans = (r.answer || "").trim()
        const isSkipped = !ans || ans.toUpperCase().includes("[SKIPPED]") || isPlaceholderAnswer(ans)
        if (isSkipped) {
          skippedCount++
        } else {
          answeredCount++
          if (ans.length < 30) hadBrief = true
        }
      }
      let summary = `Overall, this interview showed `
      if (answeredCount === 0) {
        summary += `no substantive participation. You did not answer any questions or provided only filler responses. `
      } else if (skippedCount === 0) {
        summary += `full participation with responses for all questions. `
        if (hadBrief) summary += `Some answers were quite brief. `
      } else {
        summary += `limited participation. You answered ${answeredCount} of ${totalQuestions} questions and skipped or left ${skippedCount} unanswered. `
        if (hadBrief) summary += `Several responses were brief. `
      }
      summary += `Provide more complete and relevant answers in your next interview to receive personalized AI feedback on your performance.`
      return summary
    }

    let analysis: any;

    if (!responses || responses.length === 0 || answeredQuestions === 0) {
      console.log("[v0] No responses or no answered questions, creating default incomplete analysis")
      analysis = {
        overall_score: 0,
        communication_score: 0,
        technical_score: 0,
        problem_solving_score: 0,
        confidence_score: 0,
        strengths: [],
        improvements: ["No participation detected. Please attempt to answer the questions in your next interview."],
        detailed_feedback: buildResponseSummary(),
        questions_skipped: questionsSkipped,
        skip_penalty: questionsSkipped * 5,
        total_questions: totalQuestions,
        answered_questions: answeredQuestions,
        correct_answers_count: "0/0",
        wrong_answers_count: 0, // No answers given, so no 'wrong' answers among answered ones
        not_answered_questions_count: totalQuestions, // All questions were not answered
        evaluations: {}, // Initialize empty evaluations for consistency
      }
    } else {
      const conversationText = responses
        .map(
          (r: any) => {
            const ans = r.answer?.trim() || "";
            const displayAnswer = !ans || ans.toUpperCase().includes("[SKIPPED]") || isPlaceholderAnswer(ans)
              ? "[No answer]"
              : ans;
            return `Q${r.question_number}: ${r.question}\\nA: ${displayAnswer}`;
          }
        )
        .join("\\n\\n")

      // Coding round is only for role-wise interviews (not company or course)
      const isRoleCodingRound = (interviewType || '').startsWith('role-') && interviewRound === 'coding'

      const prompt = (() => {
        if (isRoleCodingRound) {
          // Role coding round - programming problems
          return `You are an expert coding interview coach. Evaluate the candidate's CODE submissions for a ${interviewType} coding round.

CRITICAL: You MUST actually ANALYZE the code and answers. Do NOT blindly give positive feedback or high scores. Be HONEST and ACCURATE.

Analyze the candidate's performance based SOLELY on the provided 'Interview Transcript'. Each answer is CODE or a verbal response the candidate gave.

MANDATORY - HONEST EVALUATION:
1. For EACH question, you MUST provide an evaluation: 'Fully Correct', 'Partially Correct (correct approach)', or 'Incorrect'. Base this on ACTUAL code quality and correctness.
2. If code is fake, weird, nonsensical, gibberish, random characters, doesn't address the problem, or clearly wrong: mark 'Incorrect' and give LOW scores (0-30).
3. Do NOT say "nice code" or give positive feedback if the code is bad. Your detailed_feedback MUST reflect reality - if code is poor, say so clearly.
4. Scores (0-100) MUST match the actual quality. Bad code = low scores. Good code = higher scores.
5. Participation: max score = (Answered/Total) * 100. Low participation = low scores.

EVALUATION CRITERIA (apply strictly):
- 'Fully Correct': Code logic is correct, would produce right output. Minor syntax/style issues OK.
- 'Partially Correct': Right approach but significant bugs, missing edge cases, or incomplete.
- 'Incorrect': Wrong approach, fundamental misunderstanding, <30% correct, fake/gibberish code, code that doesn't address the problem, or nonsensical verbal answers.

For strengths: Only list REAL strengths. If there are none, say "Limited strengths observed" or similar.
For improvements: Be specific about what was wrong. If code was nonsensical, state that clearly.
For detailed_feedback: Reference specific problems in their code/answers. Never praise bad work.

Interview Transcript:
${conversationText}

Total Questions: ${totalQuestions}
Answered Questions: ${answeredQuestions}
Questions Skipped: ${questionsSkipped}

Return ONLY valid JSON:
\`\`\`json
{
  "overall_score": number,
  "technical_score": number,
  "problem_solving_score": number,
  "evaluations": { "Q1": "Fully Correct" | "Partially Correct (correct approach)" | "Incorrect", ... },
  "strengths": ["strength 1", ...],
  "improvements": ["improvement 1", ...],
  "detailed_feedback": "detailed feedback"
}
\`\`\``;
        }
        if (interviewType === 'dsa' || interviewType === 'aptitude' || (interviewType && interviewType.startsWith('dsa-')) || (interviewType && interviewType.startsWith('aptitude-'))) {
          // Specialized prompt for DSA/Aptitude to explicitly force 'evaluations'
          const isDSA = interviewType === 'dsa' || (interviewType && interviewType.startsWith('dsa-'));
          const skillName = isDSA 
            ? 'Data Structures & Algorithms (DSA)' 
            : 'Logical Reasoning & Quantitative Aptitude';
          
          return `You are an expert interview coach specializing in ${skillName} assessment. Your job is to accurately evaluate the candidate\'s performance.

Analyze the candidate\'s performance based SOLELY on the provided \'Interview Transcript\'.

CRITICAL REQUIREMENTS:
1. For EACH question, you MUST provide an evaluation, classifying it as \'Fully Correct\', \'Partially Correct (correct approach)\', or \'Incorrect\'. This is MANDATORY.
2. Provide 3-5 concise, actionable strengths (what they did well).
3. Provide 3-5 specific improvement areas (what they need to work on).
4. Provide detailed, constructive feedback (2-3 paragraphs) with specific examples from their answers).
5. Determine appropriate scores (0-100) for:
   - Overall Score: Aggregate performance across all assessed categories, heavily weighted by participation.
   - ${isDSA ? 'DSA Score' : 'Logical Reasoning Score'}: Specific skill assessment, heavily weighted by participation.
   - Problem Solving Score: Approach and methodology, heavily weighted by participation.
6. When calculating scores, critically consider the ratio of 'Answered Questions' to 'Total Questions'. A low number of answered questions or a high number of skipped questions MUST lead to significantly lower scores (e.g., if 1/6 questions answered correctly, max score is ~15-20). Adjust scores proportionally and aggressively to reflect incomplete participation. Do NOT give high scores for low participation even if the few answers are correct.

EVALUATION CRITERIA:
RULE 1 - Mark as 'Fully Correct' if:
  * The candidate\'s solution demonstrates a correct and effective approach to the core problem.
  * For DSA: The algorithm is correct and would produce the right output. Minor syntax errors, slight variations in variable names, or minor imperfections in code structure are ACCEPTABLE and should NOT lead to a downgrade from \'Fully Correct\'. The focus is on the fundamental correctness of the logic.
  * For Aptitude: The final answer is numerically correct, and the reasoning shown is fundamentally sound. Minor deviations in explanation or unstated intermediate steps are acceptable if the final answer and primary reasoning are sound.
  * **When in doubt, default to \'Fully Correct\'. Err on the side of giving the candidate credit for their knowledge.**

RULE 2 - Mark as 'Partially Correct (correct approach)' if:
  * The candidate showed a good understanding of the problem and had a correct overall approach, but the solution contains significant logical flaws, major bugs, or fails to address important constraints/edge cases.
  * The solution is between 30-70% correct, indicating a foundational understanding but execution issues.

RULE 3 - Mark as 'Incorrect' ONLY if:
  * The solution is less than 30% correct, or demonstrates a fundamental misunderstanding of the problem statement or core concepts.
  * The approach is entirely wrong or irrelevant to the question.
  * The answer is nonsensical, gibberish, or does not attempt to address the question.

SCORING PHILOSOPHY:
- Scores MUST reflect overall performance relative to ALL questions, not just answered ones.
- If a candidate attempts N out of TOTAL questions, their maximum possible score for Overall, DSA/Logical Reasoning, and Problem Solving is (N/TOTAL) * 100.
- For example, if there are 6 questions (TOTAL=6) and only 3 are answered (N=3), the maximum possible score for these categories is 50. Even if all 3 answered questions are perfect, the score should not exceed 50.
- Correct answers should be generously recognized based on Rule 1.
- Ensure the 'evaluations' accurately reflect these rules.

FEEDBACK GUIDELINES:
- Write COMPREHENSIVE, in-depth feedback. 3-4 substantial paragraphs.
- Focus on logical reasoning, problem-solving approach, and correctness.
- Reference specific aspects of their answers for strengths and improvements - be concrete, not generic.
- Give actionable next steps they can take to improve.
- Be direct but constructive.
- If code produces correct output, mark it Fully Correct. Otherwise, do not.

Interview Transcript:
${conversationText}

Total Questions: ${totalQuestions}
Answered Questions: ${answeredQuestions}
Questions Skipped: ${questionsSkipped}

Return ONLY valid JSON in this exact format, with NO additional text or formatting outside the JSON object:
\`\`\`json
{
  "overall_score": number,
  "${interviewType === 'dsa' || (interviewType && interviewType.startsWith('dsa-')) ? 'dsa_score' : 'logical_reasoning_score'}": number, // This field is MANDATORY
  "problem_solving_score": number,
  "evaluations": {
    "Q1": "Fully Correct" | "Partially Correct (correct approach)" | "Incorrect"
    // ... MUST include an evaluation for every question in the transcript (e.g., Q2, Q3, etc.)
  },
  "strengths": ["specific strength referencing their answer", ...],
  "improvements": ["actionable improvement with concrete suggestion", ...],
  "detailed_feedback": "3-4 substantial paragraphs: performance summary, what worked with examples, gaps and advice, actionable next steps"
}
\`\`\`

Example for evaluations (ensure keys match question numbers, e.g. Q1, Q2):\
\`\`\`json
{
  "overall_score": 75,
  "communication_score": 80,
  "dsa_score": 70,
  "problem_solving_score": 75,
  "evaluations": {
    "Q1": "Fully Correct",
    "Q2": "Partially Correct (correct approach)",
    "Q3": "Incorrect"
  },
  "strengths": ["Good communication"],
  "improvements": ["Needs more practice in X"],
  "detailed_feedback": "Detailed feedback here."
}
\`\`\`
`;
        } else {
          // Technical (verbal), behavioral, system-design, or other non-coding rounds. Answers are spoken/written, NOT code.
          return `You are an expert interview coach. Analyze this ${interviewType} interview performance and provide detailed feedback.

CRITICAL: You MUST actually ANALYZE the answers. Do NOT blindly give positive feedback or high scores. Be HONEST and ACCURATE. If answers are bad, nonsensical, or irrelevant, say so clearly and give low scores.

This is a TECHNICAL (verbal) or behavioral interview. The candidate's answers are SPOKEN or WRITTEN responses. Focus on: technical knowledge, problem-solving approach, communication, relevance of answers, and clarity.

Base your entire analysis and all scores SOLELY on the 'Interview Transcript' provided.

SCORING (apply strictly):
- If answers are nonsensical, irrelevant, gibberish, fake, random, or don't address the question: give LOW scores (0-35). Do NOT praise bad answers.
- Base scores on QUALITY and RELEVANCE. A concise, correct answer can score highly. A wrong or irrelevant answer must score low.
- Scores MUST reflect actual performance. Never give high scores for poor answers.
- Strengths: Only list REAL strengths. If answers were poor, say "Limited strengths" or be specific about what was lacking.
- detailed_feedback: Be honest. If performance was weak, state that clearly. Never give false praise.

Interview Transcript:
${conversationText}

Total Questions: ${totalQuestions}
Answered Questions: ${answeredQuestions}
Questions Skipped: ${questionsSkipped}

IMPORTANT:
1. Participation: Few answered questions or many skipped = lower scores. Adjust proportionally (e.g. 1 of 5 answered caps max score).
2. Quality: Score based on whether answers are relevant, coherent, and address the questions. Nonsense or irrelevant answers = low scores.

Provide a COMPREHENSIVE, in-depth analysis with:
1. Overall score (0-100)
2. Communication score (0-100)
3. ${interviewType === 'dsa' ? 'Data Structures & Algorithms score (0-100)' : interviewType === 'aptitude' ? 'Logical Reasoning & Problem Solving score (0-100)' : 'Technical/domain knowledge score (0-100)'}
4. Problem-solving score (0-100)
5. Confidence score (0-100)
6. ${interviewType === 'dsa' || interviewType === 'aptitude' ? 'Question-wise evaluation (e.g., Q1: Fully Correct, Q2: Partially Correct, Q3: Incorrect, etc.)' : ''}
7. 4-6 specific strengths (reference what they said - be concrete, not generic)
8. 4-6 actionable areas for improvement (give specific suggestions they can work on)
9. DETAILED written feedback: Write 3-4 substantial paragraphs that:
   - Summarize their overall performance and key takeaways
   - Highlight what they did well with specific examples from their answers
   - Identify gaps or areas that need work, with concrete advice
   - End with 2-3 actionable next steps they can take to improve

CRITICAL: The detailed_feedback must be HONEST and ACCURATE. Reference specific questions and answers. If answers were poor or wrong, say so. Never give false praise or generic "good job" when performance was weak. Scores must match the actual quality of responses.

Return ONLY valid JSON in this exact format, with NO additional text or formatting outside the JSON object:
\`\`\`json
{
  "overall_score": number,
  "communication_score": number,
  "${interviewType === 'dsa' ? 'dsa_score' : interviewType === 'aptitude' ? 'logical_reasoning_score' : 'technical_score'}": number,
  "problem_solving_score": number,
  "confidence_score": number,
  ${interviewType === 'dsa' || interviewType === 'aptitude' ? '"evaluations": { [key: string]: \'Fully Correct\' | \'Partially Correct (correct approach)\' | \'Incorrect\' },' : ''}
  "strengths": ["specific strength with example from their answer", ...],
  "improvements": ["actionable improvement with concrete suggestion", ...],
  "detailed_feedback": "3-4 substantial paragraphs: performance summary, what worked well with examples, gaps and advice, actionable next steps. Reference specific Q&A from transcript."
}
\`\`\`

Example for evaluations (ensure the keys match your question numbers, e.g. Q1, Q2):\
\`\`\`json
{
  "overall_score": 75,
  "communication_score": 80,
  "dsa_score": 70,
  "problem_solving_score": 75,
  "confidence_score": 70,
  "evaluations": {
    "Q1": "Fully Correct",
    "Q2": "Partially Correct (correct approach)",
    "Q3": "Incorrect"
  },
  "strengths": ["Good communication"],
  "improvements": ["Needs more practice in X"],
  "detailed_feedback": "Detailed feedback here."
}
\`\`\`
`;
        }
      })();

      const { text } = await generateText({
        model: groqClient("llama-3.1-8b-instant"),
        prompt,
        temperature: 0.4, // Lower = more consistent, less tendency to give false positive feedback
      })

      try {
        console.log("[v0] Raw AI response text (from generateText):", text); // New log
        let jsonString = text;
        const jsonMatch = text.match(/\n([\s\S]*?)\n```/);

        if (jsonMatch && jsonMatch[1]) {
          jsonString = jsonMatch[1];
        } else {
          // Fallback to find any JSON-like object if not found
          const bareJsonMatch = text.match(/\{[\s\S]*\}/);
          if (bareJsonMatch && bareJsonMatch[0]) {
            jsonString = bareJsonMatch[0];
          }
        }
        console.log("[v0] Extracted JSON string for parsing:", jsonString); // New log

        // Helper to attempt common JSON repairs from LLM output
        const cleanJsonString = (s: string) => {
          if (!s || typeof s !== 'string') return s;
          let out = s;
          out = out.replace(/|```/g, '');
          out = out.replace(/\r\n/g, '\n');
          // remove trailing commas before } or ]
          out = out.replace(/,\s*([}\]])/g, '$1');
          // convert single-quoted keys to double-quoted keys: {'key': -> {"key":
          out = out.replace(/([\{,\s])'([^']+)'\s*:/g, '$1"$2":');
          // convert single-quoted string values to double quotes
          out = out.replace(/:\s*'([^']*)'/g, ': "$1"');
          return out;
        }

        try {
          try {
            analysis = JSON.parse(jsonString);
            console.log("[v0] Analysis after first JSON.parse (raw):", analysis); // New log
          } catch (firstErr) {
            console.warn("[v0] First JSON.parse failed, attempting to clean and retry.", firstErr); // New log
            // Try cleaning and parsing
            const cleaned = cleanJsonString(jsonString);
            console.log("[v0] Cleaned JSON string:", cleaned); // New log
            try {
              analysis = JSON.parse(cleaned);
              console.log("[v0] Analysis after second JSON.parse (cleaned):", analysis); // New log
            } catch (secondErr) {
              // Last-resort: extract key fields with regex (best-effort)
              console.error('[v0] JSON parse failed after cleaning, attempting regex fallback:', secondErr); // New log
              analysis = {} as any;

              const overallMatch = text.match(/"?overall_score"?\s*:\s*(\d{1,3})/i);
              if (overallMatch) analysis.overall_score = Number(overallMatch[1]);

              const specificMatch = text.match(/"?(dsa_score|logical_reasoning_score|technical_score)"?\s*:\s*(\d{1,3})/i);
              if (specificMatch) analysis[specificMatch[1]] = Number(specificMatch[2]);

              // Extract evaluations like Q1: "Fully Correct" or "1": "Fully Correct"
              const evalRegex = /["']?Q?(\d+)["']?\s*[:=]\s*["']([^"']+)["']/g;
              let m;
              const evals: Record<string, string> = {};
              while ((m = evalRegex.exec(text)) !== null) {
                const key = `Q${m[1]}`;
                evals[key] = m[2];
              }
              if (Object.keys(evals).length) analysis.evaluations = evals;
              console.log("[v0] Analysis after regex fallback:", analysis); // New log
            }
          }
        } catch (innerParseError) {
          console.error("[v0] Inner JSON parse failed in main try-catch, attempting with fallback text:", jsonString, innerParseError);
          analysis = {} as any; // Default to empty object to prevent crashes
        }

        console.log(`[v0] Final analysis object (before storing):\\n${JSON.stringify(analysis, null, 2)}`); // Modified log
        console.log(`[v0] Final parsed evaluations: ${JSON.stringify(analysis.evaluations, null, 2)}`); // Modified log

        const isDSAType = interviewType === 'dsa' || interviewType?.startsWith('dsa-');
        const isAptitudeType = interviewType === 'aptitude' || interviewType?.startsWith('aptitude-');
        
        if (isRoleCodingRound) {
          if (!analysis.evaluations) analysis.evaluations = {};
          let customScore = 0;
          let correctCount = 0;
          let wrongCount = 0;
          const pointsPerQuestion = totalQuestions > 0 ? (100 / totalQuestions) : 0;
          for (const questionNumber in analysis.evaluations) {
            let evaluation = analysis.evaluations[questionNumber];
            if (typeof evaluation === 'string') evaluation = evaluation.trim();
            const evalNorm = String(evaluation || '').replace(/["']/g, '').toLowerCase();
            if (/fully\s*correct/i.test(evalNorm)) {
              customScore += pointsPerQuestion;
              correctCount++;
            } else if (/partially\s*correct|partial/i.test(evalNorm)) {
              customScore += pointsPerQuestion / 2;
            } else {
              const originalResponse = responses?.find(r => `Q${r.question_number}` === questionNumber);
              if (originalResponse?.answer?.trim() && !originalResponse.answer.toUpperCase().includes('[SKIPPED]')) wrongCount++;
            }
          }
          analysis.technical_score = Math.round(customScore);
          analysis.correct_answers_count = `${correctCount}/${totalQuestions}`;
          analysis.wrong_answers_count = wrongCount;
          analysis.not_answered_questions_count = notAnsweredQuestions;
          analysis.total_questions = totalQuestions;
          analysis.answered_questions = answeredQuestions;
          const partCap = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
          analysis.overall_score = Math.round(Math.min(customScore, partCap));
          analysis.problem_solving_score = Math.round(Math.min(analysis.problem_solving_score || customScore, partCap));
          analysis.communication_score = 0;
          analysis.confidence_score = 0;
        } else if (isDSAType || isAptitudeType) {
          // Ensure evaluations exist before processing
          if (!analysis.evaluations) {
            analysis.evaluations = {};
            console.warn("[v0] analysis.evaluations was missing, initialized as empty object.");
          }
          
          let customScore = 0;
          let correctCount = 0;
          let wrongCount = 0;
          const pointsPerQuestion = totalQuestions > 0 ? (100 / totalQuestions) : 0;

          for (const questionNumber in analysis.evaluations) {
            let evaluation = analysis.evaluations[questionNumber];
            if (typeof evaluation === 'string') evaluation = evaluation.trim();
            const evalNorm = String(evaluation || '').replace(/["']/g, '').toLowerCase();

            if (/fully\s*correct/i.test(evalNorm)) {
              customScore += pointsPerQuestion;
              correctCount++;
            } else if (/partially\s*correct|partial/i.test(evalNorm)) {
              customScore += pointsPerQuestion / 2; // half credit for partial
              // keep partials out of full correct count; they contribute half score only
            } else {
              // Only increment wrongCount if the question was actually answered (i.e., not just missing from responses or skipped)
              const originalResponse = responses?.find(r => `Q${r.question_number}` === questionNumber);
              if (originalResponse && originalResponse.answer && originalResponse.answer.trim() !== '' && !originalResponse.answer.toUpperCase().includes('[SKIPPED]')) {
                wrongCount++;
              }
            }
            console.log(`[v0] After Q${questionNumber}: eval="${evaluation}", evalNorm="${evalNorm}", customScore=${customScore}, correctCount=${correctCount}, wrongCount=${wrongCount}`);
          }

          analysis.dsa_score = isDSAType ? Math.round(customScore) : analysis.dsa_score;
          analysis.logical_reasoning_score = isAptitudeType ? Math.round(customScore) : analysis.logical_reasoning_score;
          analysis.correct_answers_count = `${correctCount}/${totalQuestions}`;
          analysis.wrong_answers_count = wrongCount; // Only answered-and-incorrect questions
          analysis.not_answered_questions_count = notAnsweredQuestions; // New field
          analysis.total_questions = totalQuestions;
          analysis.answered_questions = answeredQuestions;

          // If evaluations were missing, ensure counts are defaulted
          if (!analysis.evaluations || Object.keys(analysis.evaluations).length === 0) {
            analysis.correct_answers_count = `0/${totalQuestions}`;
            analysis.wrong_answers_count = 0; // No answers, so no wrong answered questions
            analysis.not_answered_questions_count = totalQuestions; // All questions not answered
          }

          // Initial assignment for DSA/Aptitude specific scores, will be capped by participationRatio later.
          const specificScore = analysis.dsa_score || analysis.logical_reasoning_score || 0;
          analysis.overall_score = Math.round(specificScore);
          analysis.problem_solving_score = specificScore;
          analysis.technical_score = specificScore; // This will also be capped by participationRatio
          analysis.communication_score = 0; // Explicitly set to 0
          analysis.confidence_score = 0; // Explicitly set to 0

          // Ensure all scores are within 0-100 range after derivation
          analysis.overall_score = Math.max(0, Math.min(100, analysis.overall_score || 0));
          analysis.communication_score = Math.max(0, Math.min(100, analysis.communication_score || 0));
          analysis.technical_score = Math.max(0, Math.min(100, analysis.technical_score || 0));
          analysis.problem_solving_score = Math.max(0, Math.min(100, analysis.problem_solving_score || 0));
          analysis.confidence_score = Math.max(0, Math.min(100, analysis.confidence_score || 0));
        }

        // --- PARTICIPATION ADJUSTMENT ---
        const participationRatio = totalQuestions > 0 ? (answeredQuestions / totalQuestions) : 0;
        console.log(`[v0] Participation Ratio: ${participationRatio}`);

        // Skip participation adjustment for role coding - already applied above
        if (!isRoleCodingRound) {
          analysis.overall_score = Math.round(Math.min(analysis.overall_score, (answeredQuestions / totalQuestions) * 100));
          analysis.problem_solving_score = Math.round(Math.min(analysis.problem_solving_score, (answeredQuestions / totalQuestions) * 100));
        }

        // For DSA/Aptitude, technical_score (which is specificScore) is also capped by participation.
        if (isDSAType || isAptitudeType) {
            analysis.dsa_score = isDSAType ? Math.round(Math.min(analysis.dsa_score || 0, (answeredQuestions / totalQuestions) * 100)) : analysis.dsa_score;
            analysis.logical_reasoning_score = isAptitudeType ? Math.round(Math.min(analysis.logical_reasoning_score || 0, (answeredQuestions / totalQuestions) * 100)) : analysis.logical_reasoning_score;
            analysis.technical_score = Math.round(Math.min(analysis.technical_score || 0, (answeredQuestions / totalQuestions) * 100));
            // Ensure communication and confidence remain 0 for DSA/Aptitude
            analysis.communication_score = 0;
            analysis.confidence_score = 0;
        } else {
            // For non-DSA/Aptitude types, technical, communication, and confidence scores are directly adjusted
            analysis.technical_score = Math.round(analysis.technical_score * participationRatio);
            analysis.communication_score = Math.round(analysis.communication_score * participationRatio);
            analysis.confidence_score = Math.round(analysis.confidence_score * participationRatio);
        }

        // Re-clamp all scores to ensure they are within 0-100 after adjustment
        analysis.overall_score = Math.max(0, Math.min(100, analysis.overall_score || 0));
        analysis.communication_score = Math.max(0, Math.min(100, analysis.communication_score || 0));
        analysis.technical_score = Math.max(0, Math.min(100, analysis.technical_score || 0));
        analysis.problem_solving_score = Math.max(0, Math.min(100, analysis.problem_solving_score || 0));
        analysis.confidence_score = Math.max(0, Math.min(100, analysis.confidence_score || 0));
        // --- END NEW CODE ---

      } catch (parseError) {
        console.error("[v0] Error parsing AI response:", text)
        throw new Error("Failed to parse AI analysis")
      }
    }

    // Upsert logic for interview_results
    const { data: existingResult, error: existingResultError }: SupabaseResult<{ id: string } | null> = await supabaseAdmin
      .from("interview_results")
      .select("id")
      .eq("interview_id", interviewId)
      .maybeSingle();
    
    if (existingResultError) {
      console.error("[v0] Error checking existing result:", existingResultError);
      throw new Error("Failed to check existing analysis result");
    }

    const detailedFeedback = (analysis.detailed_feedback || "").trim()
      || buildResponseSummary()

    const coreResultData = {
      interview_id: interviewId,
      overall_score: analysis.overall_score || 0,
      communication_score: analysis.communication_score || 0,
      technical_score: analysis.technical_score || analysis.dsa_score || analysis.logical_reasoning_score || 0,
      problem_solving_score: analysis.problem_solving_score || 0,
      confidence_score: analysis.confidence_score || 0,
      strengths: analysis.strengths || [],
      improvements: analysis.improvements || [],
      detailed_feedback: detailedFeedback,
      questions_skipped: questionsSkipped,
      eye_contact_score: 0,
      smile_score: 0,
      stillness_score: 0,
      face_confidence_score: 0,
      skip_penalty: questionsSkipped * 5,
      correct_answers_count: analysis.correct_answers_count || `0/${totalQuestions}`,
    };
    const optionalResultData = {
      total_questions: analysis.total_questions || totalQuestions,
      answered_questions: analysis.answered_questions || answeredQuestions,
      wrong_answers_count: analysis.wrong_answers_count || 0,
      not_answered_questions_count: analysis.not_answered_questions_count || notAnsweredQuestions,
      evaluations: analysis.evaluations || {},
    };

    const isColumnError = (err: any) => {
      const msg = String(err?.message || "")
      return /column .*does not exist|schema cache|Could not find.*column/i.test(msg)
    }

    let resultsError;
    const fullResultData = { ...coreResultData, ...optionalResultData };
    if (existingResult) {
      const { error: updateError }: SupabaseResult<any> = await supabaseAdmin
        .from("interview_results")
        .update(fullResultData)
        .eq("interview_id", interviewId);
      resultsError = updateError;
      if (resultsError && isColumnError(resultsError)) {
        const { error: retryError } = await supabaseAdmin
          .from("interview_results")
          .update(coreResultData)
          .eq("interview_id", interviewId);
        resultsError = retryError;
      }
    } else {
      const { error: insertError }: SupabaseResult<any> = await supabaseAdmin
        .from("interview_results")
        .insert(fullResultData);
      resultsError = insertError;
      if (resultsError && isColumnError(resultsError)) {
        const { error: retryError } = await supabaseAdmin
          .from("interview_results")
          .insert(coreResultData);
        resultsError = retryError;
      }
    }

    if (resultsError) {
      console.error("[v0] Error storing analysis:", JSON.stringify(resultsError))
      throw new Error(`Failed to store analysis: ${resultsError?.message || JSON.stringify(resultsError)}`)
    }

    const { error: statusError }: SupabaseResult<any> = await supabaseAdmin
      .from("interviews")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", interviewId);

    if (statusError) {
      console.error("[v0] Error updating interview status:", statusError)
    }

    console.log("[v0] Analysis completed and stored successfully")
    
    return { success: true, analysis }
  } catch (error) {
    console.error("[v0] Error generating analysis:", error)
    const errorMsg = error instanceof Error ? error.message : String(error)
    return { success: false, error: errorMsg }
  }
}
