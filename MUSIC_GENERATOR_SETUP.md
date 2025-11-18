# 🎵 Music Generator Setup Guide

## Overview
The Music Generator module uses ElevenLabs' Text-to-Sound API to create unique AI-generated music tracks based on user descriptions.

## Features
- ✅ Adjustable song duration (10-120 seconds)
- ✅ Instrumental or Vocals selection
- ✅ Natural language prompt input
- ✅ Real-time progress bar during generation
- ✅ Built-in audio player with playback controls
- ✅ One-click download functionality
- ✅ Clean, modern UI matching PostReady's design language

## Environment Variable Setup

### Local Development (.env.local)
Add the following to your `.env.local` file:

```
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
```

### Production (Vercel)
1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add a new variable:
   - **Name**: `ELEVENLABS_API_KEY`
   - **Value**: Your ElevenLabs API key
   - **Environment**: Production, Preview, Development (select all)
4. Click **Save**
5. Redeploy your application for changes to take effect

## Getting Your ElevenLabs API Key
1. Go to [ElevenLabs](https://elevenlabs.io/)
2. Sign up or log in to your account
3. Navigate to your profile → API Keys
4. Copy your API key

## API Endpoint
- **Route**: `/api/test-music`
- **Method**: POST
- **ElevenLabs Endpoint**: `https://api.elevenlabs.io/v1/sound-generation`
- **Body**:
  ```json
  {
    "prompt": "Upbeat electronic dance track with synth melodies",
    "duration": 30,
    "type": "instrumental"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "audio": "data:audio/mpeg;base64,...",
    "duration": 30,
    "prompt": "...",
    "type": "instrumental"
  }
  ```

## Module Location
The Music Generator is positioned at the **top** of the modules list, above the Sora Prompt Generator.

## Styling
- **Primary Color**: Blue (#2979FF)
- **Gradient**: Linear gradient from #2979FF to #6FFFD2
- **Theme**: Supports both light and dark mode
- **Icon**: 🎵 (Music Notes)

## Testing
1. Start the dev server: `npm run dev`
2. Navigate to the homepage
3. Expand the Music Generator module (first module at the top)
4. Enter a music description (e.g., "Calm piano with rain sounds")
5. Adjust duration slider (10-120s)
6. Select music type (Instrumental/Vocals)
7. Click "Generate Music"
8. Wait for progress bar to complete
9. Play the generated track using the audio player
10. Download the track using the "Download" button

## Troubleshooting

### "ElevenLabs API key not configured"
- Ensure `ELEVENLABS_API_KEY` is set in your environment variables
- Restart your dev server after adding the variable

### "Failed to generate music"
- Check your ElevenLabs API key is valid
- Verify your ElevenLabs account has available credits
- Check the API response in the browser console for more details

### Audio not playing
- Ensure your browser supports HTML5 audio
- Check if the audio file was successfully generated (look for base64 data in the response)
- Try a different browser

## File Structure
```
app/
├── page.tsx                         # Main UI with Music Generator module
├── api/
│   └── generate-music/
│       └── route.ts                 # ElevenLabs API integration
└── ...
```

## Next Steps
Once you've added your ElevenLabs API key and tested locally, deploy to production:

```bash
git add .
git commit -m "Add Music Generator module with ElevenLabs integration"
git push origin main
```

Don't forget to add the `ELEVENLABS_API_KEY` to Vercel before deploying!

