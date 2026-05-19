# Getting Started Prompts

Example prompts for common setup tasks. Copy and modify these for use with Cursor/Claude.

---

## A) Rename the App

```
I want to rename this boilerplate app to my own app name.

Current name: SwiftAIBoilerplatePro
New name: [YourAppName]

Please:
1. Rename the Xcode target from SwiftAIBoilerplatePro to [YourAppName]
2. Rename the Xcode scheme
3. Update the product name in Config/App.xcconfig
4. Update the bundle identifier to com.[yourcompany].[yourapp]
5. Rename the main app folder from SwiftAIBoilerplatePro/ to [YourAppName]/
6. Update all import statements that reference the old name
7. Update the app display name users will see
8. Show me what files were changed

Make sure the app still compiles after renaming.
```

---

## B) Configure Secrets & API Keys

```
I need to set up my API keys and configuration for production use.

Please help me:
1. Create Config/Secrets.xcconfig from the example file
2. Guide me through filling in these values:
   - SUPABASE_URL (from my Supabase project)
   - SUPABASE_ANON_KEY (from Supabase)
   - REVENUECAT_API_KEY (from RevenueCat)
   - PROXY_BASE_URL (my Supabase Edge Function URL)

3. After I fill them in, run `bash scripts/update-config.sh`
4. Verify the configuration was updated correctly
5. Help me test that the app now uses real services instead of mocks

Currently I have:
- Supabase project URL: [paste yours]
- RevenueCat API key: [paste yours]
- Deployed Supabase function at: [paste URL]
```

---

## C) Change App Branding & Colors

```
I want to customize the app's visual appearance to match my brand.

My brand colors:
- Primary color: #[HEX]
- Secondary color: #[HEX]  
- Background: #[HEX]

Please:
1. Update the design system colors in Packages/DesignSystem/
2. Update the app icon in SwiftAIBoilerplatePro/Assets.xcassets/AppIcon.appiconset/
3. Update the launch screen logo/image
4. Update the accent color in Assets.xcassets/AccentColor.colorset/
5. Show me where to add custom fonts if needed
6. Verify the changes look good in both light and dark mode

Keep the existing design system architecture intact.
```

---

## D) Disable Features I Don't Need

```
I want to remove features I won't be using to simplify the app.

Features to remove:
- [ ] Chat feature (I only need auth and payments)
- [ ] RevenueCat payments (using different payment system)
- [ ] Apple Sign In (email only)
- [ ] Google Sign In (email only)

Please:
1. Remove the unused packages/dependencies
2. Update the composition root to not include these features
3. Remove UI screens/views related to these features
4. Update the onboarding flow if needed
5. Remove any related tests
6. Make sure the app still compiles and works

Show me what you're removing before making changes.
```

---

## E) Add a New Feature Module

```
I want to add a new feature to the app following the existing modular architecture.

New feature: [Feature Name - e.g., "Calendar", "Notes", "Marketplace"]

Please:
1. Create a new Swift package in Packages/Feature[Name]/
2. Follow the same structure as existing feature packages (FeatureChat, FeatureSettings)
3. Set up the Package.swift with dependencies on Core, DesignSystem, etc.
4. Create the basic view models, repositories, and views
5. Wire it up in CompositionRoot
6. Add it to the main navigation/tabs
7. Create basic tests following the testing patterns

I want to follow the same dependency injection and composition patterns used throughout the boilerplate.
```

---

## F) Deploy to TestFlight

```
I'm ready to deploy my app to TestFlight for beta testing.

Current status:
- App name: [YourAppName]
- Bundle ID: [com.yourcompany.yourapp]
- Version: 1.0.0
- Apple Developer account: [email]

Please guide me through:
1. Creating an App Store Connect record
2. Setting up provisioning profiles and certificates
3. Configuring the Xcode project for archiving
4. Creating an archive build
5. Uploading to App Store Connect
6. Setting up TestFlight internal testing
7. Adding external test users

Help me avoid common pitfalls and make sure everything is configured correctly.
```

---

## G) Set Up CI/CD with GitHub Actions

```
I want to automate testing and deployment using GitHub Actions.

Requirements:
- Run tests on every pull request
- Build and upload to TestFlight on main branch merges
- Use secrets for API keys (SUPABASE_URL, etc.)
- Fast builds with caching

Please:
1. Create .github/workflows/test.yml for PR testing
2. Create .github/workflows/deploy.yml for TestFlight deployment
3. Set up GitHub secrets for Config/Secrets.xcconfig values
4. Configure the workflow to use bash scripts/update-config.sh
5. Add status badges to README
6. Document what GitHub secrets need to be set

Use best practices for iOS CI/CD.
```

---

## H) Integrate Analytics

```
I want to add analytics to track user behavior.

Analytics service: [Firebase Analytics / Mixpanel / PostHog / etc.]

Please:
1. Add the analytics SDK as a dependency
2. Create an Analytics package following the modular architecture
3. Define an AnalyticsClient protocol
4. Implement event tracking for:
   - User sign up/sign in
   - Subscription purchases
   - Feature usage
   - Errors/crashes
5. Wire it into CompositionRoot
6. Add privacy-compliant tracking with user consent
7. Update the privacy policy

Follow the same patterns as existing modules (Auth, Payments, etc.).
```

---

## I) Customize Onboarding Flow

```
I want to change the onboarding experience to match my app's value proposition.

New onboarding screens:
1. [Screen 1 title and description]
2. [Screen 2 title and description]
3. [Screen 3 title and description]

Please:
1. Update OnboardingPage.swift with my new content
2. Update the images/SF Symbols to match
3. Modify the flow in OnboardingContainerView
4. Update the number of pages
5. Customize the colors to match my brand
6. Make sure the "Get Started" button navigates correctly
7. Update onboarding preview for development

Keep the existing onboarding architecture and state management.
```

---

## J) Switch from Supabase to Another Backend

```
I want to use [Firebase / AWS / Custom API] instead of Supabase for authentication and backend.

Current backend: Supabase (Auth module)
New backend: [Your choice]

Please:
1. Analyze the current Auth package structure
2. Create a new implementation of AuthClient protocol for [your backend]
3. Update SessionManager or create a new auth manager
4. Migrate from Supabase auth to [your backend] auth
5. Update Config/Secrets.xcconfig for new API keys
6. Update CompositionRoot to use the new auth implementation
7. Make sure all existing auth flows still work
8. Update relevant documentation

Keep the same Auth module public API so the rest of the app doesn't need changes.
```

---

## Tips for Using These Prompts

1. **Be specific:** Fill in [bracketed] sections with your actual values
2. **Provide context:** Include relevant error messages or current state
3. **Ask for explanations:** Add "Explain your changes" at the end
4. **Review changes:** Always review code changes before accepting
5. **Test after changes:** Build and run after each major change
6. **Use incrementally:** Don't try to do everything at once

---

## Need More Help?

- See `docs/CLAUDE.md` for how to work with this codebase effectively
- See `docs/foundations/` for architecture details
- See `docs/modules/` for module-specific guides
- See other prompt files in `docs/prompts/` for feature-specific prompts

