# Syncing Boilerplate Updates to Your App

When new features are added to SwiftAI Boilerplate Pro (like FeatureRating), you can pull those updates into your derived app. This guide covers the recommended approach.

## Syncing v2.0.0 — what to expect

v2.0.0 is the largest upstream change to date. If you last synced from v1.9 (or earlier), plan for a dedicated sync sprint rather than a drive-by cherry-pick. Here is the concrete conflict surface:

1. **Toolchain bump.** All 11 SPM packages jumped to `swift-tools-version: 6.2` and the Xcode project moved to `SWIFT_VERSION = 6.0`. You must be on **Xcode 26.2+** with the iOS 26 SDK *before* you merge — older Xcodes cannot compile the result. If you are not ready, stay on the `v1.9.0` tag.
2. **Swift 6 `any` keyword.** Every protocol-typed stored property and parameter (repositories, clients, view models, `CompositionRoot`) now carries `any HTTPClient` / `any AuthClient` / etc. Merges into files you have customised will show `any` as a plus line — keep it. Adding it to your own files is mechanical.
3. **`@Observable` migration.** `ObservableObject` / `@Published` is gone from `ChatViewModel`, `SettingsViewModel`, `PaywallViewModel`, `DeepLinkBus`, and `ToastCenter`. If your app subclassed or wrapped any of them in `@EnvironmentObject`, migrate consumers to `@Environment(Type.self)` + `@State` and replace `.onReceive($x.published)` with `.onChange(of: x.published) { _, new in … }`. `$`-prefixed bindings do not exist on `@Observable` types.
4. **Storage repositories are `@MainActor`.** `MessageRepositoryImpl`, `ConversationRepositoryImpl`, and `SettingsRepositoryImpl` are pinned to `@MainActor` (P0 data-race fix). Any of your own call sites that constructed or invoked them off the main actor will now need `await`. Do **not** reintroduce `nonisolated(unsafe) let modelContext: ModelContext` — `ModelContext` is not thread-safe.
5. **`DispatchQueue.main` is gone.** The v2.0 migration replaced every `DispatchQueue.main.async` / `asyncAfter` with `Task { @MainActor in … }` / `try await Task.sleep(for:)`. If your app still uses them, migrate them in the same sync PR — Swift 6 treats the old calls as hazards.
6. **File moves (sibling-file splits).** The 400-line workspace rule forced structural splits. These show up as *renames / moves*, not rewrites. Expect merge conflicts along these paths:
   - `AppShell/Profile/` — `ProfileView.swift` split into 7 sibling subviews
   - `Packages/FeatureSettings/Sources/FeatureSettings/Views/Settings/` — `SettingsView.swift` split into 13 sibling files
   - `AppShell/Auth/` — `EmailSignUpView.swift` split into form + VM
   - `SwiftAIBoilerplatePro/Composition/` — `CompositionRoot.swift` + `SessionManagerWrapper.swift` + `CompositionRoot+Factories.swift` + `LLMClientFactory.swift`
   - `Packages/Auth/Sources/Auth/` — `SessionManager.swift` + `+SignIn.swift` + `+Refresh.swift` + `+Persistence.swift`; `SupabaseAuthAPI.swift` + `+Mapping.swift`
   - `Packages/FeatureChat/Sources/FeatureChat/ViewModels/` — `ChatViewModel.swift` + `ChatViewModel+Memory.swift`
   - `Packages/AI/Sources/AI/Clients/Proxy/` — `ProxyLLMClient.swift` + `ProxyLLMRequestBuilder.swift` + `ProxyLLMStreamParser.swift`
   - `Packages/Localization/Sources/Localization/` — `L10n.swift` root + one `L10n+<Namespace>.swift` per nested enum
   - Tests: `ProxyLLMClientTests`, `SettingsViewModelTests`, `SessionManagerTests`, `RatingEngineTests` all split into sibling test files + fixtures

   Types and symbols are unchanged. Your downstream customisations inside any of these files will need to be reapplied to the correct sibling file after the merge.
7. **Liquid Glass adoption via `SAIGlass`.** The new `Packages/DesignSystem/Sources/DesignSystem/Materials/SAIGlass.swift` primitive landed in `SAIInputBar`, `ChatView`, `ChatGPTStyleView`, `ChatHistoryView` toolbar, `SAIToast`, `RatingPromptView`, `SettingsView`/`PaywallView` loading overlays, `PaywallView` CTAs, and the main tab bar. Matching "fighting-glass cleanup" **removed** `DSColors.background.ignoresSafeArea()`, `.background(DSColors.background)`, `.scrollContentBackground(.hidden)`, and the explicit 88pt safe-area gutters from `SettingsView`, `HomeView`, `ProfileView`, `ChatHistoryView`. If your app re-adds any of those overrides post-merge you will see glass artefacts — drop them.
8. **Backend + CI.**
   - Apply Supabase migration `20260408000000_fix_conversation_stats_auth.sql` and redeploy the `ai` edge function (`supabase functions deploy ai`) — this is part of v2.0.0's security pass, not optional.
   - Update GitHub workflows to `macos-15` + `Xcode_26.2`, primary destination `iPhone 17 Pro / iOS 26.2`, and add the `test-ios18-fallback` job on `iPhone 16 Pro / iOS 18.6`. The `package-tests` matrix is **removed** — `swift test` cannot build iOS-only SwiftUI against macOS hosts. A new `.xcode-version` file pins `26.3` for `xcodes` / `asdf-xcode`.
   - Install the secrets pre-commit hook: `git config core.hooksPath .githooks`.
9. **Hardening fixes you should keep.** The merge will bring `SessionManager.saveSession()` switching from force-unwrap to `guard let` and `URLSessionHTTPClient.applySyntheticTTL` folding its force-unwrap into the existing guard. Do not undo these during conflict resolution.

**Recommended sync shape.** Cherry-picking v2.0.0 piecemeal is painful because the Swift 6 / `any` / `@Observable` migrations are cross-cutting. The cleanest path is usually a single sync branch that merges the whole v2.0.0 tag, reapplies your downstream customisations on top (especially in the split files above), and ships behind the v2.0 toolchain bump.


## Overview

The strategy uses **git remote** to add the boilerplate repo as a secondary remote, then selectively merge or cherry-pick changes into your app's branch.

```
your-app (origin)          boilerplate (upstream)
     |                          |
     |    git fetch upstream    |
     |  <--------------------- |
     |                          |
     |  git cherry-pick / merge |
     |  <--------------------- |
     |                          |
     v                          v
  your-app with new features
```

## Initial Setup (One Time)

### 1. Add the boilerplate as a remote

```bash
cd ~/path/to/your-app

# Add the boilerplate repo as "upstream"
git remote add upstream git@github.com:YOUR_ORG/SwiftAIBoilerplatePro-Distribution.git

# Verify remotes
git remote -v
# origin    git@github.com:you/your-app.git (fetch)
# origin    git@github.com:you/your-app.git (push)
# upstream  git@github.com:YOUR_ORG/SwiftAIBoilerplatePro-Distribution.git (fetch)
# upstream  git@github.com:YOUR_ORG/SwiftAIBoilerplatePro-Distribution.git (push)
```

### 2. Fetch upstream branches

```bash
git fetch upstream
```

## Pulling Updates

### Option A: Cherry-Pick Specific Commits (Recommended)

Best when you want specific features without pulling everything.

```bash
# 1. Fetch latest from upstream
git fetch upstream

# 2. View upstream commits since you last synced
git log upstream/main --oneline

# 3. Create a branch for the sync
git checkout -b sync/feature-rating

# 4. Cherry-pick the commits you want
git cherry-pick <commit-hash-1>
git cherry-pick <commit-hash-2>

# 5. Resolve any conflicts
# (See "Resolving Conflicts" section below)

# 6. Push and merge via PR
git push origin sync/feature-rating
# Create a PR to merge into your main branch
```

### Option B: Merge a Range of Commits

Best when you want all changes from a release.

```bash
# 1. Fetch latest
git fetch upstream

# 2. Create sync branch
git checkout -b sync/v1.7.0

# 3. Merge upstream tag or commit range
git merge upstream/main --no-commit --allow-unrelated-histories

# 4. Review changes carefully
git diff --staged

# 5. Remove changes you don't want
git checkout HEAD -- path/to/file/you/want/to/keep

# 6. Commit
git commit -m "Sync boilerplate v1.7.0: FeatureRating module"

# 7. Push and PR
git push origin sync/v1.7.0
```

### Option C: Manual File Copy

Best when your app has diverged significantly from the boilerplate.

```bash
# 1. Clone or update the boilerplate separately
cd ~/Documents
git clone git@github.com:YOUR_ORG/SwiftAIBoilerplatePro-Distribution.git boilerplate-latest
# Or if you already have it:
cd boilerplate-latest && git pull

# 2. Copy the new package into your app
cp -R boilerplate-latest/Packages/FeatureRating ~/path/to/your-app/Packages/

# 3. Manually apply integration changes
# - Add FeatureRating to your Xcode project
# - Update CompositionRoot
# - Update AppEnvironment
# - Add .ratingPrompt() modifier
```

## Resolving Conflicts

Conflicts typically occur in files you've customized:

### CompositionRoot.swift
You've likely customized this file. When merging:
- Keep your custom configuration values
- Add new dependencies (like `ratingClient`)
- Keep your app-specific factory methods

### AppRootView.swift
- Keep your custom navigation and routing
- Add new modifiers (like `.ratingPrompt()`)

### Package.swift files
- These rarely conflict unless you've added custom dependencies
- If they do, keep both your additions and the upstream ones

### Tips for Clean Merges

1. **Keep boilerplate files unmodified** where possible. Instead of editing `RatingPromptView.swift`, create a wrapper or extension.
2. **Use comments** like `// CUSTOMIZED` to mark your changes, making conflict resolution easier.
3. **Sync frequently** -- smaller, more frequent syncs are easier than large ones.
4. **Review the CHANGELOG** before syncing to understand what changed.

## Example: Adding FeatureRating to Capishi

Here's a real-world example of syncing the FeatureRating module into an existing app (Capishi):

```bash
# 1. Setup (one time)
cd ~/Documents/Capishi
git remote add upstream git@github.com:YOUR_ORG/SwiftAIBoilerplatePro-Distribution.git

# 2. Fetch
git fetch upstream

# 3. Create sync branch
git checkout -b feature/add-rating-module

# 4. Copy the new package
cp -R ~/Documents/SwiftAIBoilerplatePro-Distribution/Packages/FeatureRating Packages/

# 5. Add to Xcode project
# Open Capishi.xcodeproj
# File -> Add Package Dependencies -> Add Local -> Packages/FeatureRating
# Add FeatureRating to main target's Frameworks

# 6. Update CompositionRoot.swift
# - Add: import FeatureRating
# - Add: public let ratingClient: RatingClient
# - Add initialization in init()
# - Pass ratingClient to ViewModels that need it

# 7. Update AppEnvironment.swift
# - Add: import FeatureRating
# - Add: public let ratingClient: RatingClient
# - Wire in init(compositionRoot:)

# 8. Add modifier to root view
# .ratingPrompt(client: environment.ratingClient)

# 9. Customize for Capishi
# - Update RatingConfig with Capishi branding
# - Add .record() calls at key interview moments
# - Test the popup in all themes

# 10. Commit and PR
git add .
git commit -m "Add FeatureRating module from boilerplate v1.7.0"
git push origin feature/add-rating-module
```

## Keeping Track of Sync State

Create a file in your app's root to track which boilerplate version you last synced from:

```bash
# .boilerplate-version
echo "1.7.0" > .boilerplate-version
git add .boilerplate-version
git commit -m "Track boilerplate sync version"
```

Update this file each time you sync. This makes it easy to see which upstream changes you still need to pull.

## Automation (Optional)

For teams that sync frequently, consider a script:

```bash
#!/bin/bash
# scripts/sync-boilerplate.sh

set -e

UPSTREAM_TAG=${1:-"main"}
BRANCH="sync/boilerplate-$(date +%Y%m%d)"

echo "Fetching upstream..."
git fetch upstream

echo "Creating sync branch: $BRANCH"
git checkout -b "$BRANCH"

echo "Cherry-picking from upstream/$UPSTREAM_TAG..."
# List new commits since last sync
LAST_SYNC=$(cat .boilerplate-version 2>/dev/null || echo "")
if [ -n "$LAST_SYNC" ]; then
    echo "Last sync: $LAST_SYNC"
    git log --oneline "upstream/$UPSTREAM_TAG" --not "upstream/$LAST_SYNC"
fi

echo ""
echo "Review the commits above and cherry-pick what you need:"
echo "  git cherry-pick <hash>"
echo ""
echo "When done, update .boilerplate-version and create a PR."
```

## FAQ

**Q: Will my custom changes be overwritten?**
A: No. Cherry-picking or manual copy lets you control exactly what gets added. Your customizations stay intact.

**Q: What if I don't want a specific feature?**
A: Simply don't cherry-pick or copy it. Each feature is self-contained in its own package.

**Q: How often should I sync?**
A: Check the boilerplate CHANGELOG monthly. Sync when you see features you want.

**Q: Can I contribute changes back to the boilerplate?**
A: The boilerplate is a commercial product. If you find bugs, email berkinsili@gmail.com and they'll be fixed in the next release.
