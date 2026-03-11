import UIKit

enum HapticService {
    static func playPause() {
        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
    }

    static func queueAction() {
        UIImpactFeedbackGenerator(style: .light).impactOccurred()
    }

    static func generate() {
        UINotificationFeedbackGenerator().notificationOccurred(.success)
    }

    static func error() {
        UINotificationFeedbackGenerator().notificationOccurred(.error)
    }

    static func selection() {
        UISelectionFeedbackGenerator().selectionChanged()
    }
}
