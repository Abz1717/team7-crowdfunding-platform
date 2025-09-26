import type { AIAnalysis, PitchFormData } from "@/lib/types/pitch";

export async function generatePitchAnalysisDirect(
  pitchData: PitchFormData
): Promise<AIAnalysis> {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Gemini API key is not configured. Please check your NEXT_PUBLIC_GEMINI_API_KEY."
    );
  }

  const prompt = `You are an expert business analyst and investor evaluating a crowdfunding pitch. Analyze the pitch quality and content depth carefully.

**IMPORTANT GUIDELINES:**
- If the pitch content is minimal, repetitive, or low-quality (like single letters, repeated words, or nonsensical text), provide EMPTY arrays for strengths and fewer items for other sections
- Only identify genuine strengths when there is actual substantive content
- Provide more improvement suggestions for lower quality pitches
- Adjust the number of recommendations based on pitch complexity
- Be honest about pitch quality - don't fabricate strengths that don't exist

**Pitch Information:**
- Title: ${pitchData.title}
- Elevator Pitch: ${pitchData.elevatorPitch}
- Detailed Business Case: ${pitchData.detailedPitch}
- Target Amount: $${pitchData.targetAmount}
- Profit Share: ${pitchData.profitShare}%
- Investment Tiers: ${JSON.stringify(pitchData.tiers)}

Respond with ONLY valid JSON in this format:

{
  "overallScore": <number between 0-100 based on actual content quality>,
  "strengths": [
    // ONLY include if there are genuine strengths in the pitch
    // Leave empty array [] if pitch is low quality or lacks substance
  ],
  "improvements": [
    // Include 2-8 improvements based on pitch quality
    // More improvements for lower quality pitches
    // Fewer for well-structured pitches
  ],
  "marketPotential": "<High/Medium/Low based on actual market analysis in pitch>",
  "riskLevel": "<Low/Medium/High - High risk for unclear or minimal pitches>",
  "recommendations": [
    // 2-6 recommendations based on pitch complexity
    // More basic recommendations for low-quality pitches
  ]
}

Evaluation criteria:
- Content depth and clarity (penalize repetitive/minimal content heavily)
- Business model explanation quality
- Market understanding demonstration
- Financial planning sophistication
- Professional presentation
- Realistic funding requirements`;

  console.log(prompt);
  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API Error:", response.status, errorText);
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (
      !data.candidates ||
      !data.candidates[0] ||
      !data.candidates[0].content
    ) {
      throw new Error("Invalid response structure from Gemini API");
    }

    let text = data.candidates[0].content.parts[0].text;

    // Remove markdown code block formatting if present
    if (text.includes("```json")) {
      text = text.replace(/```json\s*/g, "").replace(/```\s*$/g, "");
    } else if (text.includes("```")) {
      text = text.replace(/```\s*/g, "").replace(/```\s*$/g, "");
    }

    // Parse the JSON response
    try {
      const analysis: AIAnalysis = JSON.parse(text.trim());

      // Validate the response structure
      if (
        typeof analysis.overallScore === "number" &&
        Array.isArray(analysis.strengths) &&
        Array.isArray(analysis.improvements) &&
        typeof analysis.marketPotential === "string" &&
        typeof analysis.riskLevel === "string" &&
        Array.isArray(analysis.recommendations)
      ) {
        return analysis;
      } else {
        throw new Error("Invalid analysis structure");
      }
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      console.log("Raw AI response:", text);

      // Fallback analysis if parsing fails - provide conservative assessment
      return {
        overallScore: 45,
        strengths: [], // Empty strengths for fallback to encourage better content
        improvements: [
          "Provide a clear and detailed business description",
          "Explain the problem your business solves",
          "Include market research and target audience analysis",
          "Add specific financial projections and use of funds",
          "Describe your competitive advantages",
          "Include a realistic timeline with milestones",
        ],
        marketPotential: "Low",
        riskLevel: "High",
        recommendations: [
          "Rewrite your pitch with more substantial content",
          "Research your market and competitors thoroughly",
          "Develop a comprehensive business plan",
          "Seek mentorship or business advisory support",
        ],
      };
    }
  } catch (error) {
    console.error("Error generating AI analysis:", error);

    // Fallback analysis if API fails - conservative assessment
    return {
      overallScore: 40,
      strengths: [], // No strengths for API failure fallback
      improvements: [
        "Unable to analyze pitch content - please try again",
        "Ensure all pitch sections are completed with meaningful content",
        "Provide detailed business description and market analysis",
        "Include clear financial projections and funding requirements",
        "Add competitive analysis and business model details",
      ],
      marketPotential: "Unknown",
      riskLevel: "High",
      recommendations: [
        "Retry AI analysis after improving pitch content",
        "Seek manual review from business advisors",
        "Use pitch templates to structure your content better",
        "Research successful crowdfunding campaigns in your industry",
      ],
    };
  }
}
