import Auth
import Core
import Foundation
import Payments
import PhotosUI
import Storage
import SwiftUI

/// Profile screen view model
/// Manages user profile data, subscription status, and account actions
@MainActor
@Observable
public final class ProfileViewModel {
    // MARK: - State

    var user: AuthUser?
    var subscriptionStatus: SubscriptionInfo?
    var isLoading = false
    var isLoadingPhoto = false
    var isRestoringPurchases = false
    var errorMessage: String?
    var successMessage: String?
    var showSignOutConfirmation = false
    var showDeleteAccountConfirmation = false
    var showEditProfile = false
    var editingName: String = ""
    var selectedPhoto: PhotosPickerItem?
    var profileImageData: Data?

    // MARK: - Subscription Info

    public struct SubscriptionInfo {
        let isActive: Bool
        let planName: String?
        let expiryDate: Date?
        let willRenew: Bool

        public init(isActive: Bool, planName: String? = nil, expiryDate: Date? = nil, willRenew: Bool = false) {
            self.isActive = isActive
            self.planName = planName
            self.expiryDate = expiryDate
            self.willRenew = willRenew
        }
    }

    // MARK: - Dependencies

    private let authClient: any AuthClient
    private let paymentsClient: any PaymentsClient
    private let photoStorageClient: (any ProfilePhotoStorageClient)?

    // MARK: - Initialization

    public init(
        authClient: any AuthClient,
        paymentsClient: any PaymentsClient,
        photoStorageClient: (any ProfilePhotoStorageClient)? = nil
    ) {
        self.authClient = authClient
        self.paymentsClient = paymentsClient
        self.photoStorageClient = photoStorageClient
    }

    // MARK: - Computed Properties

    /// Check if there are unsaved changes
    var hasChanges: Bool {
        guard let user else { return false }

        let nameChanged = editingName != user.name
        let photoChanged = profileImageData != nil

        return nameChanged || photoChanged
    }

    /// Check if profile can be saved
    var canSave: Bool {
        let nameValid = !editingName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        return nameValid && hasChanges
    }

    // MARK: - Public Methods

    /// Load profile data
    public func loadProfile() async {
        isLoading = true
        errorMessage = nil

        defer { isLoading = false }

        // Load user info from auth client
        let loadedUser = await authClient.currentUser()

        // Check for persisted profile updates
        if let loadedUser {
            let savedName = UserDefaults.standard.string(forKey: "profileName_\(loadedUser.id)")

            // Try to load photo from backend first, fallback to UserDefaults
            if let photoStorageClient {
                do {
                    if let photoData = try await photoStorageClient.download(userId: loadedUser.id) {
                        profileImageData = photoData
                        AppLogger.info("Profile photo loaded from storage", category: AppLogger.ui)
                    }
                } catch {
                    AppLogger.debug("No profile photo in storage, checking UserDefaults", category: AppLogger.ui)
                    // Fallback to UserDefaults
                    let savedPhotoData = UserDefaults.standard.data(forKey: "profilePhoto_\(loadedUser.id)")
                    profileImageData = savedPhotoData
                }
            } else {
                // No storage client, use UserDefaults
                let savedPhotoData = UserDefaults.standard.data(forKey: "profilePhoto_\(loadedUser.id)")
                profileImageData = savedPhotoData
            }

            // Apply persisted name if any
            if savedName != nil || profileImageData != nil {
                user = AuthUser(
                    id: loadedUser.id,
                    email: loadedUser.email,
                    name: savedName ?? loadedUser.name,
                    avatarURL: loadedUser.avatarURL
                )
            } else {
                user = loadedUser
            }
        } else {
            user = loadedUser
        }

        // Load subscription status
        await loadSubscriptionStatus()

        AppLogger.debug("Profile loaded for user: \(user?.id ?? "nil")", category: AppLogger.ui)
    }

    /// Load subscription status from payments client
    private func loadSubscriptionStatus() async {
        let state = await paymentsClient.currentState()

        if state.isSubscribed {
            // Check if will renew based on expiry date (simplified logic)
            let willRenew = state.expirationDate.map { $0 > Date().addingTimeInterval(24 * 60 * 60) } ?? true

            subscriptionStatus = SubscriptionInfo(
                isActive: true,
                planName: "Pro",
                expiryDate: state.expirationDate,
                willRenew: willRenew
            )
        } else {
            subscriptionStatus = SubscriptionInfo(
                isActive: false,
                planName: "Free",
                expiryDate: nil,
                willRenew: false
            )
        }
    }

    // MARK: - Actions

    /// Sign out the current user
    public func signOut() async {
        do {
            try await authClient.signOut()
            AppLogger.info("User signed out successfully", category: AppLogger.ui)
        } catch {
            errorMessage = "Failed to sign out. Please try again."
            AppLogger.error("Sign out failed: \(error)", category: AppLogger.ui)
        }
    }

    /// Delete account (placeholder for buyers to implement)
    public func deleteAccount() async {
        // TODO: Buyers should implement actual account deletion
        // This typically involves:
        // 1. Canceling active subscriptions
        // 2. Deleting user data from backend
        // 3. Deleting local data
        // 4. Signing out

        AppLogger.info("Delete account requested (stub implementation)", category: AppLogger.ui)
        errorMessage = "Account deletion is not yet implemented. Please contact support."
    }

    /// Restore purchases - REQUIRED by App Store Guideline 3.1.1
    /// Must be user-initiated only (not called automatically on launch)
    public func restorePurchases() async {
        isRestoringPurchases = true
        errorMessage = nil

        defer { isRestoringPurchases = false }

        do {
            // restore() returns the state directly - no race condition
            let restoredState = try await paymentsClient.restore()
            AppLogger.info("Restore successful, isSubscribed: \(restoredState.isSubscribed)", category: AppLogger.ui)

            if restoredState.isSubscribed {
                // Update local subscription status
                let willRenew = restoredState.expirationDate.map { $0 > Date().addingTimeInterval(24 * 60 * 60) } ?? true
                subscriptionStatus = SubscriptionInfo(
                    isActive: true,
                    planName: "Pro",
                    expiryDate: restoredState.expirationDate,
                    willRenew: willRenew
                )
                successMessage = "Purchases restored! Your subscription is now active."
            } else {
                errorMessage = "No active subscription found to restore."
            }
        } catch {
            let appError = AppError.from(error)
            errorMessage = "Restore failed: \(appError.userMessage)"
            AppLogger.error("Restore failed: \(error)", category: AppLogger.ui)
        }
    }

    /// Start editing profile
    public func startEditingProfile() {
        editingName = user?.name ?? ""
        selectedPhoto = nil
        // Keep existing profileImageData (already loaded in loadProfile)
        showEditProfile = true
    }

    /// Handle photo selection with validation and processing
    public func loadPhoto() async {
        guard let selectedPhoto else { return }

        isLoadingPhoto = true
        errorMessage = nil

        defer { isLoadingPhoto = false }

        do {
            // Load raw image data
            guard let rawData = try await selectedPhoto.loadTransferable(type: Data.self) else {
                errorMessage = "Failed to load selected photo"
                return
            }

            // Process image (validate, crop, compress)
            let processedData = ImageUtilities.processForProfile(rawData, targetSizeKB: 500)

            switch processedData {
            case let .success(data):
                profileImageData = data
                AppLogger.info("Profile photo processed successfully (\(data.count / 1024)KB)", category: AppLogger.ui)

            case let .failure(error):
                errorMessage = error.localizedDescription
                AppLogger.error("Photo processing failed: \(error)", category: AppLogger.ui)
            }

        } catch {
            AppLogger.error("Failed to load photo: \(error)", category: AppLogger.ui)
            errorMessage = "Failed to load photo. Please try again."
        }
    }

    /// Remove profile photo
    public func removePhoto() {
        profileImageData = nil
        selectedPhoto = nil
        AppLogger.info("Profile photo removed", category: AppLogger.ui)
    }

    /// Save profile changes
    public func saveProfile() async {
        guard !editingName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            errorMessage = "Name cannot be empty"
            return
        }

        isLoading = true
        errorMessage = nil
        successMessage = nil

        defer { isLoading = false }

        guard let currentUser = user else {
            errorMessage = "User not found"
            return
        }

        var photoURL: URL? = nil

        // Upload photo to backend if storage client available
        if let photoData = profileImageData, let photoStorageClient {
            do {
                photoURL = try await photoStorageClient.upload(data: photoData, userId: currentUser.id)
                AppLogger.info("Profile photo uploaded to storage", category: AppLogger.ui)

                // Clear UserDefaults since we now have it in storage
                UserDefaults.standard.removeObject(forKey: "profilePhoto_\(currentUser.id)")

            } catch {
                AppLogger.error("Photo upload failed, falling back to local storage: \(error)", category: AppLogger.ui)
                // Fallback: Save to UserDefaults
                UserDefaults.standard.set(photoData, forKey: "profilePhoto_\(currentUser.id)")
            }
        } else if let photoData = profileImageData {
            // No storage client, save locally
            UserDefaults.standard.set(photoData, forKey: "profilePhoto_\(currentUser.id)")
            AppLogger.info("Profile photo saved locally", category: AppLogger.ui)
        }

        // TODO: Implement backend profile update
        // try await authClient.updateProfile(name: editingName, avatarURL: photoURL)

        // For now, persist to UserDefaults
        let updatedUser = AuthUser(
            id: currentUser.id,
            email: currentUser.email,
            name: editingName,
            avatarURL: photoURL ?? currentUser.avatarURL
        )

        // Persist the updated name
        UserDefaults.standard.set(editingName, forKey: "profileName_\(currentUser.id)")

        // Update local state
        user = updatedUser

        successMessage = "Profile updated successfully"
        AppLogger.info("Profile saved successfully", category: AppLogger.ui)

        showEditProfile = false
    }

    /// Cancel profile editing
    public func cancelEditing() {
        editingName = ""
        selectedPhoto = nil
        // Don't clear profileImageData - keep the saved photo
        showEditProfile = false
        errorMessage = nil
    }
}
