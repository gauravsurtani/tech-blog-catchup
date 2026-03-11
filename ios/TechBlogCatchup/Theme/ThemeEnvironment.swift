import SwiftUI

private struct ThemeEnvironmentKey: EnvironmentKey {
    static let defaultValue: AppTheme = .shared
}

extension EnvironmentValues {
    var theme: AppTheme {
        get { self[ThemeEnvironmentKey.self] }
        set { self[ThemeEnvironmentKey.self] = newValue }
    }
}
