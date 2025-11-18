# Social Media Page Analyzer

## Overview
The Social Media Page Analyzer is a new feature that uses OpenAI's GPT-4o Vision API to analyze screenshots of social media pages and provide actionable insights and recommendations.

## Files Created

### 1. API Route: `/app/api/analyze-social-page/route.ts`
- Handles POST requests with base64 encoded images
- Uses OpenAI's GPT-4o model with vision capabilities
- Provides detailed analysis including:
  - Overview
  - Strengths
  - Opportunities for Improvement
  - Content Analysis
  - Visual Assessment
  - Engagement Strategy
  - Priority Actions

### 2. Page: `/app/analyze-page/page.tsx`
- User-friendly interface for uploading screenshots
- Drag-and-drop or click-to-upload functionality
- Image preview before analysis
- Four analysis focus options:
  - Overall Analysis (Comprehensive)
  - Content & Messaging
  - Engagement & Interaction
  - Visual Design & Branding
- Formatted, easy-to-read results
- Copy-to-clipboard functionality

## Usage

1. **Navigate to the Analyzer**
   - Visit `/analyze-page` on your application
   - Or add a link from your main page

2. **Upload a Screenshot**
   - Click the upload area or drag-and-drop an image
   - Supported formats: PNG, JPG, JPEG
   - Maximum file size: 10MB

3. **Select Analysis Focus**
   - Choose what aspect you want to focus on
   - Default: Overall Analysis (Comprehensive)

4. **Analyze**
   - Click "Analyze Page" button
   - Wait for AI analysis (typically 5-15 seconds)
   - View detailed insights and recommendations

5. **Use the Results**
   - Read the formatted analysis
   - Copy to clipboard if needed
   - Analyze another page or return home

## Features

✅ **Drag & Drop Upload** - Easy image upload with visual preview
✅ **Multiple Analysis Types** - Focus on content, engagement, visuals, or get overall insights
✅ **AI-Powered** - Uses OpenAI's GPT-4o vision model for accurate analysis
✅ **Formatted Output** - Clean, readable results with headers and bullet points
✅ **Copy to Clipboard** - One-click copy for easy sharing
✅ **Dark/Light Mode** - Respects theme preferences
✅ **Responsive Design** - Works on all devices

## Requirements

- OpenAI API key must be set in environment variables: `OPENAI_API_KEY`
- The API key must have access to GPT-4o model with vision capabilities

## API Endpoint

**POST** `/api/analyze-social-page`

**Request Body:**
```json
{
  "image": "data:image/jpeg;base64,...",
  "analysisType": "overall" // or "content", "engagement", "visual"
}
```

**Response:**
```json
{
  "analysis": "Detailed markdown-formatted analysis text...",
  "timestamp": "2025-11-18T..."
}
```

## Integration with Main App

To add a link to the analyzer from your main page, add this button anywhere in your UI:

```tsx
<button onClick={() => router.push('/analyze-page')}>
  📊 Analyze Social Media Page
</button>
```

## Future Enhancements

Potential improvements for this feature:
- Save analysis history for logged-in users
- Compare multiple analyses side-by-side
- Generate downloadable PDF reports
- Add competitor comparison analysis
- Support for video content analysis
- Batch upload and analysis of multiple images
