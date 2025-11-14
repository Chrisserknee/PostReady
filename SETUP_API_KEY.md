# 🔑 Setting Up Your OpenAI API Key

The Social Manager app uses **ChatGPT (DALL-E 3)** to generate professional logos. Follow these steps to set up your API key:

## Step 1: Get Your OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Click **"Create new secret key"**
4. Copy your API key (it starts with `sk-...`)
5. ⚠️ **IMPORTANT**: Save it somewhere safe - you won't be able to see it again!

## Step 2: Add Your API Key to the App

### Option 1: Using .env.local file (Recommended)

1. Open the file: `C:\Users\SR115\social-manager\.env.local`
2. Replace the empty value with your API key:
   ```
   OPENAI_API_KEY=sk-your-actual-api-key-here
   ```
3. Save the file
4. Restart the development server (close and run `run.bat` again)

### Option 2: Quick Edit (Windows)

1. Open Command Prompt or PowerShell
2. Navigate to the project:
   ```
   cd C:\Users\SR115\social-manager
   ```
3. Run this command (replace with your actual key):
   ```
   echo OPENAI_API_KEY=sk-your-actual-api-key-here > .env.local
   ```
4. Restart the server

## Step 3: Test It!

1. Start the app (`run.bat`)
2. Scroll down to the **AI Logo Generator** section
3. Enter a logo description (e.g., "A modern coffee cup logo with steam")
4. Click **"Generate Logo with ChatGPT"**
5. Wait 10-20 seconds for your AI-generated logo!

## 💰 API Pricing

OpenAI charges per API call:
- **DALL-E 3 (Standard Quality)**: ~$0.04 per image
- **Example**: 25 logos = ~$1.00

You can set spending limits in your OpenAI account dashboard.

## ⚠️ Security Notes

- ✅ Never commit `.env.local` to Git (it's already in `.gitignore`)
- ✅ Never share your API key publicly
- ✅ Keep `.env.local` on your local machine only
- ✅ If you leak your key, delete it immediately from OpenAI dashboard

## 🐛 Troubleshooting

### "Invalid OpenAI API key" error
- Check that your API key is correctly copied into `.env.local`
- Make sure there are no extra spaces or quotes
- Verify the key starts with `sk-`

### "Rate limit exceeded" error
- You've hit OpenAI's rate limit
- Wait a few minutes and try again
- Check your OpenAI account usage limits

### Logo generation takes too long
- DALL-E 3 can take 15-30 seconds per image
- This is normal - AI image generation is complex!
- Make sure you have a stable internet connection

### "OpenAI API key not configured" error
- Your `.env.local` file isn't being read
- Make sure you restarted the development server after adding the key
- Check the file is named exactly `.env.local` (not `.env.local.txt`)

## 📞 Need Help?

If you're stuck, check:
1. [OpenAI API Documentation](https://platform.openai.com/docs)
2. [OpenAI API Keys Page](https://platform.openai.com/api-keys)
3. Your OpenAI account usage page

---

**Ready to generate amazing logos!** 🎨✨


