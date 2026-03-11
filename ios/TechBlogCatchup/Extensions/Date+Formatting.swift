import Foundation

extension Date {
    func formatTimeAgo() -> String {
        let now = Date()
        let interval = now.timeIntervalSince(self)

        if interval < 0 {
            return "just now"
        }

        let minutes = Int(interval / 60)
        let hours = Int(interval / 3600)
        let days = Int(interval / 86400)
        let weeks = Int(interval / 604800)
        let months = Int(interval / 2592000)
        let years = Int(interval / 31536000)

        if minutes < 1 { return "just now" }
        if minutes < 60 { return "\(minutes)m ago" }
        if hours < 24 { return "\(hours)h ago" }
        if days < 7 { return "\(days)d ago" }
        if weeks < 5 { return "\(weeks)w ago" }
        if months < 12 { return "\(months)mo ago" }
        return "\(years)y ago"
    }

    func formatDate() -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMM d, yyyy"
        formatter.locale = Locale(identifier: "en_US_POSIX")
        return formatter.string(from: self)
    }

    static func formatDuration(seconds: Int) -> String {
        let minutes = seconds / 60
        let secs = seconds % 60
        return String(format: "%d:%02d", minutes, secs)
    }
}
