import SwiftUI

@main
struct TechBlogCatchupApp: App {
    @State private var theme = AppTheme.shared

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(\.theme, theme)
                .preferredColorScheme(.dark)
        }
    }
}
