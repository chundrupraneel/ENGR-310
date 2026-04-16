// api/analyze-essay.js — Vercel serverless function
// Calls the Google Gemini API to analyze a college essay and return structured feedback.
// Requires GEMINI_API_KEY in Vercel environment variables.

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { text, essayType, targetSchool, stats } = req.body;

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).json({ error: 'Essay text is required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not set. Add it to your Vercel environment variables.' });
  }

  const ESSAY_TYPE_NAMES = {
    'common-app':       'Common App Personal Statement (target: 500–650 words)',
    'supplement-short': 'Short Supplement (target: under 250 words)',
    'supplement-long':  'Long Supplement (target: 250–650 words)',
    'scholarship':      'Scholarship Essay (target: 400–700 words)',
    'other':            'College Essay',
  };

  const prompt = `You are an expert college admissions essay reviewer with 20 years of experience evaluating applications at highly selective universities. You are known for being brutally honest, specific, and genuinely helpful — not for making students feel good about bad work.

Analyze this ${ESSAY_TYPE_NAMES[essayType] || 'college essay'} with extreme rigor.

${targetSchool ? `Target School: ${targetSchool}` : ''}
Computed Stats: ${stats.wordCount} words | ${stats.paragraphCount} paragraphs | ${stats.sentenceCount} sentences | avg ${stats.avgWords} words/sentence | ${stats.iStartPct}% of sentences start with "I"

ESSAY TEXT:
---
${text.substring(0, 8000)}
---

Your review must follow these principles:
1. Be specific. Quote or paraphrase the essay when citing a strength or problem. "Your hook is weak" is vague — "Your opening line 'I have always been passionate about science' is one of the most overused openers in college admissions" is specific.
2. Be honest. If the essay is bad, say so. If it's excellent, say so. Do not pad weak essays with consolation praise.
3. Strengths are earned. If the essay has no genuine strengths, return an empty array. Do not invent praise to soften criticism.
4. Every improvement must name the exact problem and point to where it occurs in the essay.
5. Every suggestion must give a concrete path forward — not "add more detail" but "take the sentence about your grandmother's kitchen and add what it smelled like, what she was doing with her hands, and what she said."

Return ONLY a valid JSON object — no markdown fences, no explanation, no preamble. Just raw JSON:
{
  "score": <number from 1.0 to 10.0, one decimal place>,
  "verdict": <"Excellent" | "Strong" | "Good" | "Developing" | "Needs Work" | "Incomplete">,
  "foundCliches": [<array of exact strings — verbatim phrases found in the essay that are overused admissions clichés, e.g. "changed my life", "ever since I was young", "make a difference", "my passion for", "shaped who I am", "in conclusion", "learning experience", etc.>],
  "strengths": [<0–4 strings. Each must name a specific, genuine strength with evidence from the essay. If there are no real strengths, return [].>],
  "improvements": [<1–6 strings. Each must name a specific problem, quote or reference the essay where possible, and explain why it weakens the essay.>],
  "suggestions": [<1–4 objects with "type" (short label, 5 words or fewer) and "text" (2–5 sentences of concrete, actionable rewrite advice)>]
}

Scoring rubric — be calibrated, not generous:
- 9.0–10.0 (Excellent): Exceptional. Specific, vivid, emotionally earned. Voice is unmistakably individual. Hook is arresting. Story is irreplaceable — no other applicant could have written it.
- 8.0–8.9 (Strong): Genuinely compelling. Real story, real voice, real insight. Minor execution issues but submission-ready with small edits.
- 7.0–7.9 (Good): Above average. Clear voice and genuine story, but held back by one significant structural, specificity, or execution problem.
- 5.5–6.9 (Developing): Potential is visible but multiple significant issues undermine it — generic language, telling instead of showing, weak hook, clichés, or shallow insight.
- 3.5–5.4 (Needs Work): Fundamental problems. Mostly summary, not story. Cliché-heavy. No genuine insight. Voice is generic. Needs a near-complete rewrite.
- 1.0–3.4 (Incomplete): Not a real college essay. Either too short, incoherent, or does not engage with the task at all.

Verdict must exactly match score: score ≥9.0 → "Excellent", ≥8.0 → "Strong", ≥7.0 → "Good", ≥5.5 → "Developing", ≥3.5 → "Needs Work", <3.5 → "Incomplete".`;

  try {
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errBody = await geminiResponse.json().catch(() => ({}));
      console.error('Gemini API error:', errBody);
      return res.status(502).json({
        error: 'AI service error',
        details: errBody.error?.message || geminiResponse.statusText,
      });
    }

    const geminiData = await geminiResponse.json();
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    if (!rawText) {
      return res.status(502).json({ error: 'Empty response from AI' });
    }

    // Parse JSON — strip markdown fences if Gemini wraps the output
    const jsonBlockMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    const jsonString = jsonBlockMatch ? jsonBlockMatch[1] : rawText;
    const result = JSON.parse(jsonString);

    // Validate required fields
    if (typeof result.score !== 'number' || !result.verdict || !Array.isArray(result.strengths)) {
      throw new Error('AI response missing required fields');
    }

    res.status(200).json(result);
  } catch (err) {
    console.error('analyze-essay error:', err.message);
    res.status(500).json({ error: 'Analysis failed', message: err.message });
  }
}
