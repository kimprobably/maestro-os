# Distribution Checklist - SwiftAI Boilerplate Pro

## Manual Steps to Prepare Clean Distribution Repository

### Phase 1: Verify Current Repository

**Check these are present and working:**

- [ ] Toolchain: **Xcode 26.2+** installed (v2.0 requires the iOS 26 SDK for Liquid Glass)
- [ ] Project builds successfully (`⌘+B` in Xcode)
- [ ] Tests pass (`⌘+U`) — **115 tests** green on iPhone 17 Pro / iOS 26.2
- [ ] Material-fallback job green on iPhone 16 Pro / iOS 18.6
- [ ] All Packages/ folders present (11 packages)
- [ ] Mintlify docs run (`cd docs-site && mint dev`)
- [ ] No sensitive credentials in committed files
- [ ] Config/Secrets.xcconfig is gitignored (check .gitignore)

### Phase 2: Create Clean Distribution Directory

**Manual steps:**

```bash
# 1. Create distribution directory
cd ~/Documents
mkdir SwiftAIBoilerplatePro-Distribution
cd SwiftAIBoilerplatePro-Distribution

# 2. Copy from source (replace SOURCE_PATH with your current repo path)
SOURCE_PATH="/Users/berkinsili/Documents/SwiftAIBoilerplatePro"

# Copy essential directories
cp -R "$SOURCE_PATH/SwiftAIBoilerplatePro" .
cp -R "$SOURCE_PATH/Packages" .
cp -R "$SOURCE_PATH/docs" .
cp -R "$SOURCE_PATH/docs-site" .
cp -R "$SOURCE_PATH/supabase" .
cp -R "$SOURCE_PATH/Config" .
cp -R "$SOURCE_PATH/scripts" .

# Copy root files
cp "$SOURCE_PATH/README.md" .
cp "$SOURCE_PATH/FEATURES.md" .
cp "$SOURCE_PATH/CHANGELOG.md" .
cp "$SOURCE_PATH/DOCUMENTATION_GUIDE.md" .
cp "$SOURCE_PATH/SwiftAIBoilerplatePro.xcodeproj" . # This needs recursive copy
cp -R "$SOURCE_PATH/SwiftAIBoilerplatePro.xcodeproj" .
cp "$SOURCE_PATH/.gitignore" .
cp "$SOURCE_PATH/Boilerplate.xctestplan" .

# Copy test targets
cp -R "$SOURCE_PATH/SwiftAIBoilerplateProTests" .
cp -R "$SOURCE_PATH/SwiftAIBoilerplateProUITests" .
```

### Phase 3: Remove Development Artifacts

**Delete these from distribution directory:**

```bash
cd ~/Documents/SwiftAIBoilerplatePro-Distribution

# Build artifacts
rm -rf .build
rm -rf DerivedData
rm -rf ~/Library/Developer/Xcode/DerivedData/SwiftAIBoilerplatePro-*

# Test outputs
rm -f coverage-report.html
rm -f coverage-report.txt
rm -f test-output.log
rm -f xcode-test.log

# Xcode user data
rm -rf SwiftAIBoilerplatePro.xcodeproj/xcuserdata
rm -rf SwiftAIBoilerplatePro.xcodeproj/project.xcworkspace/xcuserdata

# macOS artifacts
find . -name ".DS_Store" -delete

# Git history (optional - start fresh)
rm -rf .git
```

### Phase 4: Add Distribution-Specific Files

**Create these new files:**

- [ ] `DISTRIBUTION_README.md` (I'll provide content)
- [ ] `LICENSE` (if not already present)
- [ ] Update `.gitignore` to include buyer-specific exclusions

### Phase 4.5: Verify Skills & Documentation

**Check these are present:**

- [ ] `SKILLS.md` present at root with correct skill repositories
- [ ] `.agents/skills/` directory present with installed skills
- [ ] `skills-lock.json` present at root
- [ ] `docs/CLAUDE.md` references SKILLS.md
- [ ] `docs/INDEX.md` references SKILLS.md
- [ ] All package counts say 11 (not 9 or 10)

### Phase 5: Verify Distribution Build

**In the distribution directory:**

```bash
cd ~/Documents/SwiftAIBoilerplatePro-Distribution

# 1. Open project
open SwiftAIBoilerplatePro.xcodeproj

# 2. In Xcode:
# - File → Packages → Resolve Package Versions
# - Clean Build Folder (⌘⇧K)
# - Build (⌘B) - should succeed
# - Run Tests (⌘U) - should pass

# 3. Verify Packages present
ls -la Packages/
# Should see: AI, Auth, Core, DesignSystem, FeatureChat, FeatureRating, FeatureSettings, Localization, Networking, Payments, Storage

# 4. Verify docs
ls -la docs/
ls -la docs-site/

# 5. Test Mintlify
cd docs-site
mint dev
# Should open without errors
```

### Phase 6: Create Fresh Git Repository

**Initialize distribution repo:**

```bash
cd ~/Documents/SwiftAIBoilerplatePro-Distribution

# 1. Create LICENSE file (if needed)
# Add your license text

# 2. Initialize git
git init

# 3. Add all files
git add .

# 4. Initial commit
git commit -m "SwiftAI Boilerplate Pro v1.0.0 - Initial Distribution"

# 5. Create GitHub private repository
# Go to GitHub → New Repository → Private
# Name: SwiftAIBoilerplatePro-Distribution (or your choice)

# 6. Add remote and push
git remote add origin git@github.com:YOURUSERNAME/REPO_NAME.git
git branch -M main
git push -u origin main

# 7. Tag the release
git tag -a v1.0.0 -m "Version 1.0.0 - Initial Release"
git push origin v1.0.0
```

### Phase 7: Set Up Buyer Access

**On GitHub:**

1. **Settings → Collaborators**
   - Add buyer GitHub username
   - Role: Read access only
   
2. **OR Settings → Deploy Keys** (per-buyer)
   - Generate deploy key for each buyer
   - Read-only access
   
3. **OR Use GitHub Sponsors** (if applicable)
   - Private repo access for sponsors

### Phase 8: Test Buyer Experience

**Simulate buyer workflow:**

```bash
# 1. Clone as a buyer would
cd ~/Desktop
git clone git@github.com:YOURUSERNAME/REPO_NAME.git TestBuyerClone
cd TestBuyerClone

# 2. Verify structure
ls -la
# Should see all packages, docs, etc.

# 3. Build and run
open SwiftAIBoilerplatePro.xcodeproj
# Build (⌘B) - should succeed
# Run (⌘R) - app should work in DEBUG mode

# 4. Read docs
open README.md
open DISTRIBUTION_README.md
cd docs-site && mint dev
```

## Files to Include (Checklist)

### ✅ Essential Code
- [ ] `SwiftAIBoilerplatePro/` - Main app target
- [ ] `Packages/` - ALL 11 packages (critical!)
- [ ] `SwiftAIBoilerplateProTests/` - Unit tests
- [ ] `SwiftAIBoilerplateProUITests/` - UI tests
- [ ] `SwiftAIBoilerplatePro.xcodeproj/` - Project file
- [ ] `Config/` - Build configuration (App.xcconfig, Secrets.example.xcconfig)

### ✅ Backend & Scripts
- [ ] `supabase/` - Edge Functions, migrations
- [ ] `scripts/` - Build scripts

### ✅ Documentation
- [ ] `README.md` - GitHub repo intro
- [ ] `DISTRIBUTION_README.md` - **NEW - buyer welcome**
- [ ] `DOCUMENTATION_GUIDE.md` - How to navigate docs
- [ ] `FEATURES.md` - Feature breakdown
- [ ] `SKILLS.md` - Claude Code skills guide
- [ ] `CHANGELOG.md` - Version history
- [ ] `docs/` - Complete documentation (36 files)
- [ ] `docs-site/` - Mintlify site (31 pages)

### ✅ Configuration
- [ ] `.gitignore` - Proper exclusions
- [ ] `Boilerplate.xctestplan` - Test plan
- [ ] `LICENSE` - Your license terms
- [ ] `skills-lock.json` - Skills lock file
- [ ] `.agents/` - Installed skills

### ❌ Exclude (Development Artifacts)
- [ ] `.build/` - Build outputs
- [ ] `DerivedData/` - Xcode build data
- [ ] `coverage-report.*` - Coverage reports
- [ ] `test-output.log`, `xcode-test.log` - Test logs
- [ ] `.DS_Store` - macOS artifacts
- [ ] `xcuserdata/` - User-specific Xcode data
- [ ] `.git/` - Old git history (start fresh)

### ❌ Exclude (Security)
- [ ] `Config/Secrets.xcconfig` - Your personal credentials
- [ ] Any files with real API keys

## Verification Checklist

Before pushing to distribution repo:

- [ ] Project builds in distribution directory
- [ ] Tests pass
- [ ] No personal credentials committed
- [ ] Packages/ folder is complete (11 packages)
- [ ] Documentation is accessible
- [ ] Mintlify runs without errors
- [ ] README.md and DISTRIBUTION_README.md are clear
- [ ] .gitignore is correct
- [ ] LICENSE is present

## Post-Distribution

- [ ] Test buyer clone workflow
- [ ] Create GitHub Release (v1.0.0)
- [ ] Add release notes
- [ ] Update with any buyer feedback

## Distribution News Email

- [ ] Draft version update email using landing page email templates
- [ ] Include: version number, key features, link to changelog
- [ ] Review email in test mode (console output)
- [ ] Send to buyer email list via `POST /api/distribution/send`
- [ ] Post on social media (Twitter/X, etc.)

---

**Ready to proceed?** Say yes and I'll create the DISTRIBUTION_README.md content for you.

