# PostReady

**Your personal social media manager.**

A beautiful, production-quality web app that helps local businesses get personalized social media strategies, plan specific posts, and generate **real AI-powered logos using ChatGPT**.

## ✨ Features

- 🎯 **Step-by-Step Strategy Wizard**: Easy-to-follow, guided experience (no information overload!)
- 📝 **Personalized Social Media Strategy**: Get key principles, best posting times, and content ideas
- 📅 **Post Planner**: Generate complete posts with titles, captions, hashtags, and optimal posting times
- 👤 **User Authentication**: Sign up and sign in to save your progress
- 💾 **Auto-Save Progress**: Work is automatically saved - resume where you left off anytime
- 💎 **Pro Upgrade**: Unlock unlimited video ideas and advanced features
- 📱 **Responsive Design**: Beautiful, modern UI that works on desktop and mobile

## 🚀 Quick Start

### 1. Install Dependencies

Double-click `setup.bat` or run:
```bash
npm install
```

### 2. Set Up Your OpenAI API Key

The AI features use OpenAI's GPT-4 for intelligent content generation.

**Get your API key:**
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new secret key
3. Copy the key (starts with `sk-...`)

**Add to app:**
1. Open `.env.local` in the project folder
2. Add your key:
   ```
   OPENAI_API_KEY=sk-your-actual-api-key-here
   ```
3. Save the file

📖 **Detailed instructions**: See `SETUP_API_KEY.md`

### 3. Set Up Supabase (For User Authentication & Progress Saving)

To enable sign up, sign in, and progress saving:

1. Create a free Supabase account at [https://supabase.com](https://supabase.com)
2. Create a new project
3. Copy your project URL and anon key
4. Add to `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```
5. Run the SQL setup script to create database tables

📖 **Complete step-by-step guide**: See `SUPABASE_SETUP.md`

**Note:** The app will still work without Supabase, but users won't be able to save their progress or upgrade to Pro.

### 4. Set Up Stripe (For Pro Subscriptions with Real Payments)

To accept credit card payments for Pro subscriptions:

1. Create a free Stripe account at [https://stripe.com](https://stripe.com)
2. Get your test API keys from Stripe Dashboard
3. Add to `.env.local`:
   ```
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
   STRIPE_SECRET_KEY=sk_test_your_key_here
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
   ```
4. Set up Stripe CLI for webhooks (local development)
5. Update Supabase database with Stripe fields

📖 **Complete step-by-step guide**: See `STRIPE_SETUP.md`

**Features:**
- ✅ Real credit card processing
- ✅ 2-day free trial (card required)
- ✅ $10/month subscription
- ✅ Automatic Pro upgrades
- ✅ Secure payments by Stripe

### 5. Start the App

Double-click `run.bat` or run:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🌐 Deployment

### Quick Deployment to Vercel

1. **Run the deployment helper:**
   ```bash
   # Double-click deploy.bat or run:
   ./deploy.bat
   ```

2. **Create GitHub repository** at [https://github.com/new](https://github.com/new)

3. **Push your code:**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/postready.git
   git branch -M main
   git push -u origin main
   ```

4. **Deploy to Vercel:**
   - Go to [https://vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Add environment variables (see `.env.production.example`)
   - Click Deploy!

📖 **Complete deployment guide**: See `GITHUB_DEPLOYMENT.md`

**Your app will be live at**: `https://your-app.vercel.app` 🚀

## 🎨 How It Works

### 1. Enter Business Info
- Business name, type, location, and platform
- Takes 30 seconds to complete

### 2. Step-by-Step Strategy (NEW! 🎉)
The app now guides you through your strategy one step at a time:

**Step 1: Key Principles**
- Headline summary of your strategy
- 3-5 specific tactics for your business type
- Progress bar shows where you are

**Step 2: Best Posting Times**
- 4-5 optimal time slots with detailed reasoning
- Based on your specific business type
- Easy-to-read cards with emojis

**Step 3: Content Ideas**
- 8-12 concrete, actionable video/post ideas
- Creative angles (funny, educational, testimonial, etc.)
- Click to use in Post Planner

### 3. Post Planner
- Generate complete posts with catchy titles
- Natural captions tailored to your business
- 8-12 relevant hashtags
- Copy to clipboard with one click

### 4. AI Logo Generator
- **Real AI generation** with advanced AI model
- Describe your vision in natural language
- Choose style and colors
- **3 free logos**, then upgrade to 25
- High-quality 1024x1024 images
- Download directly to your computer

## 🛠️ Tech Stack

- **Next.js 15** (App Router)
- **React 19** with TypeScript
- **Tailwind CSS** for styling
- **OpenAI API** (GPT-4) for intelligent content generation
- **Supabase** for authentication and database
- **Stripe** for payment processing and subscriptions
- Client-side state management (React hooks)

## 📂 Project Structure

```
social-manager/
├── app/
│   ├── api/
│   │   ├── research-business/
│   │   │   └── route.ts          # Business research with GPT-4
│   │   ├── generate-caption/
│   │   │   └── route.ts          # Caption generation
│   │   ├── create-checkout/
│   │   │   └── route.ts          # Stripe checkout session
│   │   └── stripe-webhook/
│   │       └── route.ts          # Stripe payment webhooks
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout with AuthProvider
│   └── page.tsx                  # Main app with wizard UI
├── components/
│   ├── AuthModal.tsx             # Sign up / Sign in modal
│   └── ...                       # Other UI components
├── contexts/
│   └── AuthContext.tsx           # Authentication state management
├── lib/
│   ├── supabase.ts               # Supabase client setup
│   ├── userProgress.ts           # Save/load user progress
│   ├── post.ts                   # Post planning logic
│   └── strategy.ts               # Strategy generation (fallback)
├── types.ts                      # TypeScript definitions
├── .env.local                    # Your API keys (DO NOT COMMIT!)
├── SUPABASE_SETUP.md             # Supabase setup guide
├── STRIPE_SETUP.md               # Stripe payment setup guide
├── SETUP_API_KEY.md              # OpenAI setup guide
├── setup.bat                     # Installation script
├── run.bat                       # Development server script
└── README.md                     # This file
```

## 💰 API Costs

OpenAI DALL-E 3 pricing:
- **Standard quality**: $0.04 per image
- **3 free logos**: ~$0.12
- **25 logos**: ~$1.00

Very affordable for professional logo generation!

## 🎨 What's New in This Version

### ✅ Step-by-Step Wizard Flow
- **No more information overload!**
- Progress bar shows your journey
- One clear action per step
- Easy navigation (Next/Back buttons)

### ✅ Real AI Logo Generation
- **Actual AI-powered logos** (not mock data)
- Advanced AI creates unique, professional designs
- Customizable style and colors
- High-resolution downloads

### ✅ Improved Logo Limits
- 3 FREE logos to start
- Upgrade to 25 logos with one click
- Clear usage counter
- Upgrade button always visible

## 🔧 Customization

### Adding Your OpenAI API Key

See `SETUP_API_KEY.md` for detailed instructions.

Quick version:
```bash
# .env.local
OPENAI_API_KEY=sk-your-key-here
```

### Modifying Business Types

Edit `types.ts` to add new business types:
```typescript
export type BusinessInfo = {
  businessType: "Restaurant" | "Your New Type" | ...
}
```

Then update `lib/strategy.ts` with specific strategies.

### Changing Logo Styles

Edit `app/api/generate-logo/route.ts` to modify:
- Prompt templates
- DALL-E model settings
- Image size/quality
- Style mappings

## 🐛 Troubleshooting

### Logo Generation Fails

**"Invalid OpenAI API key"**
- Check your API key in `.env.local`
- Make sure there are no extra spaces
- Restart the development server

**"Rate limit exceeded"**
- Wait a few minutes
- Check your OpenAI account usage limits

**"Failed to generate logo"**
- Check your internet connection
- Verify your OpenAI account has credits
- See detailed error in browser console

### Step-by-Step Wizard Issues

**Steps won't advance**
- Make sure you filled out the business form completely
- Check browser console for errors

**Progress bar stuck**
- Refresh the page
- Clear browser cache

## 📝 Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Create production build
npm run start    # Start production server
npm run lint     # Check for code issues
```

## 🚀 Future Enhancements

- 🔐 User authentication & accounts
- 💾 Database integration (save strategies & logos)
- 📊 Analytics dashboard
- 💳 Stripe payment integration for premium features
- 📅 Content calendar & scheduling
- 🔔 Email/SMS posting reminders
- 📱 Mobile app (React Native)
- 🤖 More AI features (caption generation, hashtag optimization)

## 📄 License

MIT

## 🙏 Credits

- Built with ❤️ for local businesses everywhere
- Powered by advanced AI technology
- UI inspired by modern SaaS design principles

---

**Need help?** See `SETUP_API_KEY.md` for API setup or check the troubleshooting section above.

**Ready to generate amazing content!** 🚀✨
