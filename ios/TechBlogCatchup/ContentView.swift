import SwiftUI

struct ContentView: View {
    @Environment(\.theme) private var theme
    @State private var selectedTab = 0
    @State private var playerViewModel = PlayerViewModel()
    private let generationService = GenerationStatusService.shared
    private let networkMonitor = NetworkMonitor.shared

    var body: some View {
        ZStack(alignment: .top) {
            TabView(selection: $selectedTab) {
                NavigationStack {
                    HomeView(selectedTab: $selectedTab)
                }
                .tabItem { Label("Home", systemImage: "house") }
                .tag(0)

                NavigationStack {
                    ExploreView()
                }
                .tabItem { Label("Explore", systemImage: "magnifyingglass") }
                .tag(1)

                NavigationStack {
                    PlaylistView()
                }
                .tabItem { Label("Playlist", systemImage: "music.note.list") }
                .tag(2)

                NavigationStack {
                    StatusView()
                }
                .tabItem { Label("Status", systemImage: "chart.bar") }
                .tag(3)
            }
            .safeAreaInset(edge: .bottom) {
                if playerViewModel.hasTrack {
                    MiniPlayerView(viewModel: playerViewModel)
                        .sheet(isPresented: $playerViewModel.isExpanded) {
                            ExpandedPlayerView(viewModel: playerViewModel)
                                .environment(\.theme, theme)
                        }
                }
            }
            .tint(theme.primary)

            VStack(spacing: 0) {
                if !networkMonitor.isConnected {
                    OfflineBannerView()
                }
                if generationService.isGenerating {
                    GenerationBannerView()
                }
                Spacer()
            }
            .animation(.easeInOut(duration: ThemeConfig.animationDuration), value: networkMonitor.isConnected)
            .animation(.easeInOut(duration: ThemeConfig.animationDuration), value: generationService.isGenerating)
        }
        .background(theme.background)
        .onAppear {
            generationService.startPolling()
            configureTabBarAppearance()
        }
    }

    private func configureTabBarAppearance() {
        let appearance = UITabBarAppearance()
        appearance.configureWithOpaqueBackground()
        appearance.backgroundColor = UIColor(theme.surface)
        UITabBar.appearance().standardAppearance = appearance
        UITabBar.appearance().scrollEdgeAppearance = appearance
    }
}
