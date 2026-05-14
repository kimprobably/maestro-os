import Foundation

/// Client for uploading and downloading profile photos to cloud storage
public protocol ProfilePhotoStorageClient: Sendable {
    /// Upload profile photo
    /// - Parameters:
    ///   - data: Image data (should be pre-processed/compressed)
    ///   - userId: User ID for file naming
    /// - Returns: Public URL of uploaded photo
    func upload(data: Data, userId: String) async throws -> URL

    /// Download profile photo
    /// - Parameter userId: User ID to fetch photo for
    /// - Returns: Image data, or nil if no photo exists
    func download(userId: String) async throws -> Data?

    /// Delete profile photo
    /// - Parameter userId: User ID to delete photo for
    func delete(userId: String) async throws
}

/// Error types for profile photo storage operations
public enum ProfilePhotoStorageError: Error, LocalizedError {
    case uploadFailed(Error)
    case downloadFailed(Error)
    case deleteFailed(Error)
    case invalidURL
    case noPhotoExists

    public var errorDescription: String? {
        switch self {
        case let .uploadFailed(error):
            "Failed to upload photo: \(error.localizedDescription)"
        case let .downloadFailed(error):
            "Failed to download photo: \(error.localizedDescription)"
        case let .deleteFailed(error):
            "Failed to delete photo: \(error.localizedDescription)"
        case .invalidURL:
            "Invalid photo URL"
        case .noPhotoExists:
            "No profile photo exists"
        }
    }
}
