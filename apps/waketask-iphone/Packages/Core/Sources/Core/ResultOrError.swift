import Foundation

/// A simple utility enum for representing either a successful value or an error.
/// Useful for operations that can either succeed with a value or fail with an AppError.
public enum ResultOrError<T> {
    case value(T)
    case error(AppError)

    /// Returns true if this is a value case
    public var isValue: Bool {
        switch self {
        case .value:
            true
        case .error:
            false
        }
    }

    /// Returns true if this is an error case
    public var isError: Bool {
        !isValue
    }

    /// Extracts the value if present, otherwise returns nil
    public var value: T? {
        switch self {
        case let .value(value):
            value
        case .error:
            nil
        }
    }

    /// Extracts the error if present, otherwise returns nil
    public var error: AppError? {
        switch self {
        case .value:
            nil
        case let .error(error):
            error
        }
    }

    /// Maps the value using the provided transform, preserving errors
    /// - Parameter transform: Function to transform the value
    /// - Returns: New ResultOrError with transformed value or original error
    public func map<U>(_ transform: (T) -> U) -> ResultOrError<U> {
        switch self {
        case let .value(value):
            .value(transform(value))
        case let .error(error):
            .error(error)
        }
    }

    /// Flat maps the value using the provided transform, preserving errors
    /// - Parameter transform: Function that returns a ResultOrError
    /// - Returns: Flattened result
    public func flatMap<U>(_ transform: (T) -> ResultOrError<U>) -> ResultOrError<U> {
        switch self {
        case let .value(value):
            transform(value)
        case let .error(error):
            .error(error)
        }
    }

    /// Maps the error using the provided transform, preserving values
    /// - Parameter transform: Function to transform the error
    /// - Returns: New ResultOrError with transformed error or original value
    public func mapError(_ transform: (AppError) -> AppError) -> ResultOrError<T> {
        switch self {
        case .value:
            self
        case let .error(error):
            .error(transform(error))
        }
    }

    /// Maps both value and error using the provided transforms
    /// - Parameters:
    ///   - valueTransform: Function to transform the value
    ///   - errorTransform: Function to transform the error
    /// - Returns: New ResultOrError with transformed value or error
    public func bimap<U>(value valueTransform: (T) -> U, error errorTransform: (AppError) -> AppError) -> ResultOrError<U> {
        switch self {
        case let .value(value):
            .value(valueTransform(value))
        case let .error(error):
            .error(errorTransform(error))
        }
    }

    /// Extracts the value or throws the error
    /// - Returns: The wrapped value
    /// - Throws: The wrapped AppError
    public func get() throws -> T {
        switch self {
        case let .value(value):
            return value
        case let .error(error):
            throw error
        }
    }

    // MARK: - Result Bridge

    /// Creates a ResultOrError from a Swift Result
    /// - Parameter result: Swift Result with AppError as failure type
    public init(_ result: Result<T, AppError>) {
        switch result {
        case let .success(value):
            self = .value(value)
        case let .failure(error):
            self = .error(error)
        }
    }

    /// Converts to Swift Result
    /// - Returns: Swift Result with AppError as failure type
    public func asResult() -> Result<T, AppError> {
        switch self {
        case let .value(value):
            .success(value)
        case let .error(error):
            .failure(error)
        }
    }

    /// Creates a ResultOrError by catching and mapping errors from a throwing closure
    /// - Parameter body: Throwing closure to execute
    public init(catching body: () throws -> T) {
        do {
            self = try .value(body())
        } catch {
            self = .error(AppError.from(error))
        }
    }
}

// MARK: - Conditional Conformances

extension ResultOrError: Equatable where T: Equatable {
    public static func == (lhs: ResultOrError<T>, rhs: ResultOrError<T>) -> Bool {
        switch (lhs, rhs) {
        case let (.value(lValue), .value(rValue)):
            lValue == rValue
        case let (.error(lError), .error(rError)):
            lError == rError
        default:
            false
        }
    }
}

extension ResultOrError: Sendable where T: Sendable {}
