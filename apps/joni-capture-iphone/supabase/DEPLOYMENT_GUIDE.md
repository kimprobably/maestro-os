# Supabase Deployment Guide

Complete guide for deploying Supabase Auth + Edge Functions for SwiftAI Boilerplate Pro.

This guide covers:
1. **Authentication Setup** - Apple, Google, and Email authentication
2. **Edge Functions** - AI proxy deployment
3. **Database Setup** - Chat sync and user data

## Prerequisites

1. **Supabase Account**: Create one at [supabase.com](https://supabase.com)
2. **Supabase Project**: Create a new project (or use existing)
3. **OpenRouter Account**: Sign up at [openrouter.ai](https://openrouter.ai)
4. **Supabase CLI**: Install it first
5. **Apple Developer Account**: For Apple Sign In (optional)
6. **Google Cloud Account**: For Google Sign In (optional)

## Step 1: Install Supabase CLI

**macOS:**
```bash
brew install supabase/tap/supabase
```

**Using npm:**
```bash
npm install -g supabase
```

**Verify installation:**
```bash
supabase --version
```

## Step 2: Login to Supabase

```bash
supabase login
```

This will open your browser to authenticate.

## Step 3: Get Your Project Details

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to: **Project Settings** → **General**
4. Note down:
   - **Reference ID** (e.g., `abcdefghijklmnop`)
   - **Project URL** (e.g., `https://abcdefghijklmnop.supabase.co`)
   - **Anon public key** (starts with `eyJ...`)

## Step 4: Configure Authentication

### Email Authentication (Built-in)

Email/password authentication is enabled by default. No additional configuration needed!

### Apple Sign In

1. **Apple Developer Setup:**

   a. Go to [Apple Developer Portal](https://developer.apple.com)
   
   b. Navigate to **Certificates, Identifiers & Profiles** → **Keys**
   
   c. Create a new key:
      - Enable **Sign in with Apple**
      - Download the `.p8` file
      - Note the **Key ID**
   
   d. Go to **Identifiers** → Your App ID
      - Enable **Sign in with Apple**
      - Note your **Team ID** (in top right)

2. **Supabase Setup:**

   a. Go to Supabase Dashboard → **Authentication** → **Providers**
   
   b. Find **Apple** and click to configure:
      - Toggle **Enable Sign in with Apple**
      - **Services ID**: Your app's Bundle ID (e.g., `com.yourcompany.yourapp`)
      - **Team ID**: From Apple Developer Portal
      - **Key ID**: From the key you created
      - **Private Key**: Paste contents of `.p8` file
   
   c. Click **Save**

3. **Test the Setup:**
   - Sign in should now work via Apple!
   - Users will be created in Supabase on first sign in

### Google Sign In

1. **Google Cloud Setup:**

   a. Go to [Google Cloud Console](https://console.cloud.google.com)
   
   b. Create a new project (or select existing)
   
   c. Navigate to **APIs & Services** → **Credentials**
   
   d. Click **Create Credentials** → **OAuth client ID**
   
   e. Configure OAuth consent screen:
      - User type: **External**
      - App name: Your app name
      - Support email: Your email
      - Add scopes: `email`, `profile`
   
   f. Create iOS OAuth Client:
      - Application type: **iOS**
      - Bundle ID: Your app's bundle ID
      - Download the client configuration
      - Note the **Client ID**
   
   g. Create Web OAuth Client (for Supabase):
      - Application type: **Web application**
      - Authorized redirect URIs:
        ```
        https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
        ```
      - Note the **Client ID** and **Client Secret**

2. **Supabase Setup:**

   a. Go to Supabase Dashboard → **Authentication** → **Providers**
   
   b. Find **Google** and click to configure:
      - Toggle **Enable Sign in with Google**
      - **Client ID (for OAuth)**: Web OAuth Client ID from Google
      - **Client Secret**: Web OAuth Client Secret from Google
   
   c. Click **Save**

3. **iOS App Setup:**

   Add the iOS Client ID to your `Secrets.xcconfig`:
   ```bash
   GOOGLE_CLIENT_ID = YOUR_IOS_CLIENT_ID.apps.googleusercontent.com
   ```

4. **Add GoogleSignIn SDK:**

   The app needs GoogleSignIn SDK. Add to your project:
   
   Via Swift Package Manager:
   ```
   https://github.com/google/GoogleSignIn-iOS
   ```
   
   Version: 7.0.0 or later

5. **Test the Setup:**
   - Google Sign In should now work!
   - Users will be created in Supabase on first sign in

## Step 5: Link Your Project

In your project directory:

```bash
cd /path/to/SwiftAIBoilerplatePro
supabase link --project-ref YOUR_PROJECT_REF
```

Replace `YOUR_PROJECT_REF` with your actual Reference ID.

## Step 6: Get OpenRouter API Key

1. Go to [openrouter.ai/keys](https://openrouter.ai/keys)
2. Create a new API key
3. **Add credits** to your OpenRouter account (Settings → Billing)
4. Copy the key (starts with `sk-or-v1-...`)

## Step 7: Set Environment Secrets

```bash
# Set OpenRouter API key
supabase secrets set OPENROUTER_API_KEY=sk-or-v1-YOUR_KEY_HERE

# Set your app URL (optional, for attribution)
supabase secrets set APP_URL=https://your-app.com
```

**Verify secrets:**
```bash
supabase secrets list
```

You should see:
```
┌──────────────────────┬────────────────────┐
│ Name                 │ Value              │
├──────────────────────┼────────────────────┤
│ OPENROUTER_API_KEY   │ sk-or-v1-***       │
│ APP_URL              │ https://your-ap*** │
└──────────────────────┴────────────────────┘
```

## Step 8: Deploy Edge Function

```bash
supabase functions deploy ai
```

You should see:
```
Deploying function ai...
Deployed function ai (deployed version: 1)
Function URL: https://YOUR_PROJECT_REF.supabase.co/functions/v1/ai
```

**Copy this URL!** You'll need it for the iOS app.

## Step 9: Update iOS App Configuration

1. Open `Config/Secrets.xcconfig`
2. Update these values:

```bash
SUPABASE_URL = https://YOUR_PROJECT_REF.supabase.co
SUPABASE_ANON_KEY = eyJ...YOUR_ANON_KEY...
```

That's it! Your Edge Function is now live and ready to use.

## Testing Your Deployment

Test with curl:

```bash
# First, get a test JWT token from your app or Supabase Dashboard
# Then test the function:

curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/ai \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "openai/gpt-4o-mini",
    "messages": [
      {"role": "user", "content": "Say hello!"}
    ]
  }'
```

You should see streaming responses!

## Viewing Logs

1. Go to Supabase Dashboard
2. Navigate to: **Edge Functions** → **ai**
3. Click the **Logs** tab
4. You'll see all requests and any errors

## Updating the Function

Made changes to the function? Redeploy:

```bash
supabase functions deploy ai
```

Changes are live immediately (no restart needed).

## Monitoring Costs

### OpenRouter Dashboard
- Go to [openrouter.ai/activity](https://openrouter.ai/activity)
- View usage and costs
- Set spending limits

### Supabase Dashboard
- Edge Functions are free for most usage
- Check **Organization** → **Billing** for current plan

## Troubleshooting

### "Error: Project ref not found"
- Make sure you linked the project: `supabase link --project-ref YOUR_REF`

### "Unauthorized" errors in app
- Check that `SUPABASE_URL` and `SUPABASE_ANON_KEY` are correct in `Secrets.xcconfig`
- Verify user is signed in
- Check that JWT token is being sent in Authorization header

### "OpenRouter API key not configured"
- Run: `supabase secrets set OPENROUTER_API_KEY=...`
- Verify with: `supabase secrets list`

### Function returns 500 error
- Check logs in Supabase Dashboard → Edge Functions → ai → Logs
- Common issues:
  - No credits in OpenRouter account
  - Invalid model name
  - OpenRouter API down (check status.openrouter.ai)

### Slow responses
- Try a faster model: `openai/gpt-4o-mini` or `google/gemini-flash`
- Check your internet connection
- View latency in OpenRouter dashboard

## Production Checklist

### Authentication
- [ ] Configured email authentication (enabled by default)
- [ ] Configured Apple Sign In (if using)
  - [ ] Created Apple key and noted Key ID, Team ID
  - [ ] Configured in Supabase Auth providers
  - [ ] Tested Apple Sign In flow
- [ ] Configured Google Sign In (if using)
  - [ ] Created Google OAuth clients (iOS + Web)
  - [ ] Configured in Supabase Auth providers
  - [ ] Added GOOGLE_CLIENT_ID to Secrets.xcconfig
  - [ ] Added GoogleSignIn SDK to project
  - [ ] Tested Google Sign In flow
- [ ] Verified user creation in Supabase dashboard
- [ ] Tested sign out functionality
- [ ] Verified session persistence (users stay logged in)

### Edge Functions
- [ ] Deployed Edge Function successfully
- [ ] Set OPENROUTER_API_KEY secret
- [ ] Added credits to OpenRouter account
- [ ] Updated iOS app with correct SUPABASE_URL
- [ ] Updated iOS app with correct SUPABASE_ANON_KEY  
- [ ] Tested chat functionality end-to-end
- [ ] Verified streaming works
- [ ] Checked logs for errors
- [ ] Set up spending alerts in OpenRouter
- [ ] Documented which models you're using

## Next Steps

- **Try different models**: See [openrouter.ai/models](https://openrouter.ai/models)
- **Optimize costs**: Use cheaper models for simple tasks
- **Monitor usage**: Set up alerts in OpenRouter
- **Scale**: Edge Functions auto-scale, no config needed!

Need help? Check:
- [Supabase Docs](https://supabase.com/docs/guides/functions)
- [OpenRouter Docs](https://openrouter.ai/docs)
- Function README: `supabase/functions/ai/README.md`

