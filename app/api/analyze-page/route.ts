import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { imageData } = await request.json();

    if (!imageData) {
      return NextResponse.json(
        { error: 'No image data provided' },
        { status: 400 }
      );
    }

    // First, extract user information from the screenshot
    const infoResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Extract the following information from this social media page screenshot. Return ONLY a JSON object with these exact fields (use empty string if not visible):

{
  "username": "the @username or handle",
  "fullName": "the display name or full name",
  "followerCount": "follower count (e.g., '10.5K', '1.2M')",
  "postCount": "number of posts",
  "bioLinks": "any links in bio, comma separated",
  "socialLink": "the direct profile URL if visible, or construct it from username and platform"
}

Be precise and only include what you can clearly see. Return ONLY the JSON, no other text.`
            },
            {
              type: "image_url",
              image_url: {
                url: imageData,
              }
            }
          ]
        }
      ],
      max_tokens: 500,
    });

    let userInfo = {
      username: '',
      fullName: '',
      followerCount: '',
      postCount: '',
      bioLinks: '',
      socialLink: '',
    };

    try {
      const infoText = infoResponse.choices[0]?.message?.content || '{}';
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = infoText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        userInfo = JSON.parse(jsonMatch[0]);
      }
      console.log('Extracted user info:', userInfo);
    } catch (parseError) {
      console.error('Error parsing user info:', parseError);
    }

    // Now perform the main analysis
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this social media page screenshot and deliver HIGH-IMPACT insights. Be direct, exciting, and actionable.

Format your response EXACTLY like this:

🎯 **QUICK VERDICT**
One powerful sentence summarizing the biggest opportunity you see.

---

✨ **WHAT'S WORKING** (Top 3)
• Point 1 - Keep it punchy
• Point 2 - One line max
• Point 3 - Direct and clear

---

⚠️ **WHAT'S HURTING YOU** (Top 3)
• Issue 1 - Be brutally honest
• Issue 2 - Show the cost
• Issue 3 - Make it urgent

---

🚀 **YOUR ACTION PLAN** (5 Steps, Prioritized)
1. **[Action]** - Why this matters (one line)
2. **[Action]** - Quick win or high impact
3. **[Action]** - Specific and doable
4. **[Action]** - Growth focused
5. **[Action]** - Long-term play

---

💡 **CONTENT GOLD**
One paragraph with 2-3 specific content ideas based on what you see. Make them exciting and concrete.

---

📈 **GROWTH HACKS**
• Hack 1 - Quick engagement boost
• Hack 2 - Reach optimization  
• Hack 3 - Conversion tip

---

🎨 **VISUAL UPGRADES**
• Change 1 - Visual impact
• Change 2 - Professional polish
• Change 3 - Brand consistency

RULES:
- NO disclaimers or hedging
- Reference SPECIFIC elements you see
- Be encouraging but honest
- Use strong action verbs
- Keep each point to 1-2 lines MAX
- Make every word count`
            },
            {
              type: "image_url",
              image_url: {
                url: imageData,
              }
            }
          ]
        }
      ],
      max_tokens: 1500,
    });

    const analysis = response.choices[0].message.content;

    return NextResponse.json({
      success: true,
      analysis,
      userInfo
    });

  } catch (error: any) {
    console.error('Error analyzing page:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze page' },
      { status: 500 }
    );
  }
}

