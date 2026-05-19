import Foundation

/// Formats a date relative to the current time
/// - Parameter date: The date to format
/// - Returns: A human-readable relative date string
public func formatDate(_ date: Date) -> String {
    let calendar = Calendar.current
    let now = Date()
    
    // If within last minute
    if now.timeIntervalSince(date) < 60 {
        return "Just now"
    }
    
    // If today
    if calendar.isDateInToday(date) {
        let formatter = DateFormatter()
        formatter.dateFormat = "h:mm a"
        return formatter.string(from: date)
    }
    
    // If yesterday
    if calendar.isDateInYesterday(date) {
        return "Yesterday"
    }
    
    // If within this week
    if calendar.isDate(date, equalTo: now, toGranularity: .weekOfYear) {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEEE"
        return formatter.string(from: date)
    }
    
    // If within this year
    if calendar.isDate(date, equalTo: now, toGranularity: .year) {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMM d"
        return formatter.string(from: date)
    }
    
    // Otherwise show full date
    let formatter = DateFormatter()
    formatter.dateFormat = "MMM d, yyyy"
    return formatter.string(from: date)
}

