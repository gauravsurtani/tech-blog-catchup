import SwiftUI

struct OfflineBannerView: View {
    @Environment(\.theme) private var theme

    var body: some View {
        HStack(spacing: theme.spacingSm) {
            Image(systemName: "wifi.slash")
                .font(.system(size: 14, weight: .semibold))
            Text("No Internet Connection")
                .font(theme.captionFont)
                .fontWeight(.medium)
        }
        .foregroundColor(.white)
        .frame(maxWidth: .infinity)
        .padding(.vertical, theme.spacingSm)
        .background(theme.error.opacity(0.9))
        .transition(.move(edge: .top).combined(with: .opacity))
    }
}
