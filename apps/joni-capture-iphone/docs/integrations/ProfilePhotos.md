# Profile Photo Upload - Complete Setup Guide

This guide explains how profile photo uploads work and how to enable Supabase Storage for syncing photos across devices.

## Overview

The boilerplate includes a **production-ready profile photo upload system** with:

✅ **Apple PhotosPicker** - Privacy-first, follows Apple's guidelines  
✅ **Automatic Compression** - Images compressed to ~500KB  
✅ **Square Cropping** - Auto-crops to perfect circle avatars  
✅ **Loading States** - Visual feedback during processing  
✅ **Error Handling** - User-friendly error messages  
✅ **Remove Photo** - Option to remove profile photo  
✅ **Backend Ready** - Supabase Storage integration included  

---

## How It Works (Current State)

### 1. PhotosPicker Flow (Follows Apple Guidelines)

**First Time User Selects Photo:**

```
User taps "Choose Photo"
    ↓
PhotosPicker appears
    ↓
iOS shows "Select Photos" screen
    ↓
User selects which photos to grant access to
    ↓
User taps "Add" to confirm selection
    ↓
Picker now shows ONLY granted photos
    ↓
User taps a photo to actually select it
    ↓
Photo loads and processes automatically
```

**Subsequent Times:**

```
User taps "Choose Photo"
    ↓
PhotosPicker shows previously granted photos
    ↓
User can select one OR tap "Select More Photos..." to grant access to additional photos
```

**Why This Flow?**
- Follows **iOS 17+ Limited Library** privacy model
- App never sees full photo library
- User has full control over which photos app can access
- No `NSPhotoLibraryUsageDescription` needed in Info.plist
- Matches behavior of Slack, Twitter, Instagram

### 2. Photo Processing Flow

```swift
1. User selects photo → Raw image data loads
2. Validate size (max 10MB) → Error if too large
3. Validate format → Error if not valid image
4. Crop to square → Perfect circle avatar
5. Compress to ~500KB → Optimized for storage/network
6. Store locally → Immediate UI update
7. Upload to backend (optional) → Sync across devices
```

### 3. Current Storage

**By Default (No Setup Required):**
- Photos save to **UserDefaults**
- Processed/compressed automatically
- Survives app restarts
- Limited to single device

**With Supabase (Optional Setup):**
- Photos upload to Supabase Storage
- Syncs across all user devices
- Public CDN URLs
- Professional backend solution

---

## Enable Supabase Storage (Optional)

Follow these steps to enable cloud storage for profile photos.

### Step 1: Create Supabase Storage Bucket

1. Log in to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Storage** in the sidebar
4. Click **"New bucket"**
5. Create bucket:
   - **Name:** `profile-photos`
   - **Public bucket:** ✅ Enable (photos need public URLs)
   - Click **"Create bucket"**

### Step 2: Configure Bucket Policies

Add these policies to allow authenticated users to upload/delete their own photos:

**Policy 1: Upload Policy**
```sql
CREATE POLICY "Users can upload their own profile photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-photos' AND
  (storage.foldername(name))[1] = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[2]
);
```

**Policy 2: Update Policy**
```sql
CREATE POLICY "Users can update their own profile photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-photos' AND
  (storage.foldername(name))[1] = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[2]
);
```

**Policy 3: Delete Policy**
```sql
CREATE POLICY "Users can delete their own profile photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-photos' AND
  (storage.foldername(name))[1] = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[2]
);
```

**Policy 4: Public Read**
```sql
CREATE POLICY "Profile photos are publicly readable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-photos');
```

### Step 3: Add Supabase Dependency

Add Supabase to the Storage package:

**Edit `Packages/Storage/Package.swift`:**

```swift
let package = Package(
    name: "Storage",
    platforms: [
        .iOS(.v17)
    ],
    products: [
        .library(
            name: "Storage",
            targets: ["Storage"]
        )
    ],
    dependencies: [
        .package(path: "../Core"),
        .package(path: "../Networking"),
        // Add Supabase dependency:
        .package(url: "https://github.com/supabase/supabase-swift", from: "2.0.0")
    ],
    targets: [
        .target(
            name: "Storage",
            dependencies: [
                "Core",
                "Networking",
                // Add Supabase here:
                .product(name: "Supabase", package: "supabase-swift")
            ]
        ),
        .testTarget(
            name: "StorageTests",
            dependencies: ["Storage"]
        )
    ]
)
```

### Step 4: Enable Supabase Implementation

**Edit `Packages/Storage/Sources/Storage/SupabaseProfilePhotoStorageClient.swift`:**

Uncomment these lines:

```swift
// Change this:
// import Supabase  // ← Uncomment when Supabase dependency is added

// To this:
import Supabase  // ✅ Now enabled

// Then uncomment the entire class implementation (remove /* and */)
```

### Step 5: Wire It Up in CompositionRoot

**Edit `SwiftAIBoilerplatePro/Composition/CompositionRoot.swift`:**

Find this section:

```swift
// 5a. Profile Photo Storage (optional - requires Supabase setup)
if !shouldUseMock {
    // TODO: Uncomment when Supabase storage is configured
    // self.profilePhotoStorageClient = SupabaseProfilePhotoStorageClient(
    //     supabaseClient: supabaseClient,
    //     bucketName: "profile-photos"
    // )
    self.profilePhotoStorageClient = nil  // Disabled by default
}
```

Change to:

```swift
// 5a. Profile Photo Storage
if !shouldUseMock {
    // Get Supabase client from SessionManager
    if let sessionManager = (self.sessionManager as? SessionManagerWrapper) {
        let supabaseClient = sessionManager.getSupabaseClient()
        self.profilePhotoStorageClient = SupabaseProfilePhotoStorageClient(
            supabaseClient: supabaseClient,
            bucketName: "profile-photos"
        )
    } else {
        self.profilePhotoStorageClient = nil
    }
}
```

**Note:** You'll need to expose the Supabase client from SessionManager:

```swift
// In SessionManagerWrapper
func getSupabaseClient() -> SupabaseClient {
    return sessionManager.supabaseClient
}
```

### Step 6: Test It!

1. Run the app
2. Go to Profile
3. Tap "Edit" → "Choose Photo"
4. Select a photo
5. Tap "Save"
6. Check Supabase Dashboard → Storage → profile-photos → avatars/

You should see your uploaded photo! 🎉

---

## Features Included

### 1. Smart Image Processing

```swift
// Automatic validation
✅ Max size check (10MB raw)
✅ Format validation (must be valid image)
✅ Square crop from center
✅ Compression to 500KB
✅ JPEG conversion
```

### 2. Excellent UX

```swift
// Loading states
✅ Spinner overlay while processing
✅ Disabled buttons during load
✅ Immediate preview after selection

// Error handling
✅ User-friendly error messages
✅ Alert dialogs for errors
✅ Success confirmation

// Photo management
✅ Choose Photo button
✅ Change Photo button (when photo exists)
✅ Remove Photo button (destructive style)
✅ Helper text about automatic compression
```

### 3. Backend Integration

```swift
// Storage client pattern
✅ Protocol-based (easy to swap backends)
✅ Supabase implementation included
✅ Mock implementation for testing
✅ Fallback to local storage if upload fails
✅ Download photos on app launch
✅ Delete old photos when changing
```

---

## Architecture

### Component Diagram

```
ProfileView (UI)
    ↓ user action
ProfileViewModel (Logic)
    ↓ loads/saves
ProfilePhotoStorageClient (Protocol)
    ↓ implementation
SupabaseProfilePhotoStorageClient
    ↓ uploads to
Supabase Storage (Backend)
```

### File Organization

```
SwiftAIBoilerplatePro/
├── AppShell/
│   ├── ProfileView.swift           (UI with PhotosPicker)
│   ├── ProfileViewModel.swift      (State + photo logic)
│   └── ImageUtilities.swift        (Compression + cropping)
│
└── Packages/Storage/Sources/Storage/
    ├── ProfilePhotoStorageClient.swift       (Protocol)
    ├── SupabaseProfilePhotoStorageClient.swift  (Supabase impl)
    └── MockProfilePhotoStorageClient.swift   (Mock for testing)
```

---

## API Reference

### ProfilePhotoStorageClient Protocol

```swift
protocol ProfilePhotoStorageClient: Sendable {
    /// Upload profile photo
    func upload(data: Data, userId: String) async throws -> URL
    
    /// Download profile photo
    func download(userId: String) async throws -> Data?
    
    /// Delete profile photo
    func delete(userId: String) async throws
}
```

### ImageUtilities

```swift
enum ImageUtilities {
    /// Compress image to target size
    static func compress(_ image: UIImage, maxSizeKB: Int = 500) -> Data?
    
    /// Crop image to square from center
    static func cropToSquare(_ image: UIImage) -> UIImage
    
    /// Validate image data
    static func validate(_ data: Data, maxSizeMB: Int = 10) -> Result<UIImage, ImageError>
    
    /// Process image for profile (validate + crop + compress)
    static func processForProfile(_ data: Data, targetSizeKB: Int = 500) -> Result<Data, ImageError>
}
```

---

## Troubleshooting

### Photos Not Uploading

**Check:**
1. Supabase bucket exists and is public
2. Storage policies are configured correctly
3. User is authenticated
4. `SupabaseProfilePhotoStorageClient` is enabled in CompositionRoot
5. Check logs: `AppLogger.storage` category

**Common Issues:**
- Missing bucket → Create `profile-photos` bucket
- Permission denied → Check storage policies
- 404 errors → Verify bucket name matches exactly

### PhotosPicker Confusing Flow

**This is normal!** The two-step process is iOS 17+ privacy behavior:

1. **First screen**: "Select Photos" - Choose which photos app can access
2. **Second screen**: Actually select one photo to use

See "How It Works" section above for full flow explanation.

### Images Too Large

**Solution:** Increase compression or reduce target size:

```swift
// In ProfileViewModel.loadPhoto()
let processedData = ImageUtilities.processForProfile(rawData, targetSizeKB: 300)  // ← Reduce to 300KB
```

### Photos Not Syncing Across Devices

**Checklist:**
1. Supabase Storage enabled? (not just UserDefaults)
2. User signed in on both devices?
3. Same user ID on both devices?
4. Internet connection available?

---

## Migration Guide

### From UserDefaults to Supabase

Current users already have photos in UserDefaults. To migrate:

```swift
// In ProfileViewModel.loadProfile()
if let photoStorageClient = photoStorageClient {
    // Try backend first
    if let backendPhoto = try await photoStorageClient.download(userId: userId) {
        profileImageData = backendPhoto
    } else {
        // Fallback: Check UserDefaults
        if let localPhoto = UserDefaults.standard.data(forKey: "profilePhoto_\(userId)") {
            // Found local photo, upload it!
            try await photoStorageClient.upload(data: localPhoto, userId: userId)
            profileImageData = localPhoto
            
            // Clear UserDefaults (now in backend)
            UserDefaults.standard.removeObject(forKey: "profilePhoto_\(userId)")
        }
    }
}
```

---

## Next Steps

**For Development:**
- Use MockProfilePhotoStorageClient (already configured in debug builds)
- Photos save to UserDefaults automatically
- No backend setup needed

**For Production:**
- Follow Supabase setup steps above
- Enable real storage client
- Test with multiple devices
- Monitor storage usage in Supabase dashboard

**Optional Enhancements:**
- Add image filters/editing before save
- Support multiple photo sizes (thumbnail, medium, full)
- Add progress indicator for uploads
- Implement cache layer for downloaded photos
- Add photo gallery view in profile

---

## Summary

✅ **Works out of the box** - No setup required, uses UserDefaults  
✅ **Follows Apple guidelines** - iOS 17+ PhotosPicker with Limited Library  
✅ **Production ready** - Compression, validation, error handling  
✅ **Backend ready** - Supabase Storage integration included  
✅ **Great UX** - Loading states, remove option, success feedback  
✅ **Well documented** - Clear setup instructions and troubleshooting  

Users of your boilerplate can start with local storage and enable Supabase when ready!

