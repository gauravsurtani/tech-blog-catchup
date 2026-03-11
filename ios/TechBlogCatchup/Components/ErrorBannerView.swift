import SwiftUI

struct ErrorBannerView: View {
    let message: String
    var retryAction: (() -> Void)?
    var dismissAction: (() -> Void)?

    @Environment(\.theme) private var theme

    var body: some View {
        HStack(spacing: theme.spacingSm) {
            Image(systemName: "exclamationmark.triangle.fill")
                .foregroundColor(theme.error)

            Text(message)
                .font(theme.captionFont)
                .foregroundColor(theme.error)
                .lineLimit(2)

            Spacer()

            if let retryAction {
                Button {
                    retryAction()
                } label: {
                    Text("Retry")
                        .font(theme.captionFont)
                        .fontWeight(.medium)
                        .foregroundColor(theme.error)
                }
                .buttonStyle(.plain)
            }

            if let dismissAction {
                Button {
                    dismissAction()
                } label: {
                    Image(systemName: "xmark")
                        .font(.system(size: 12))
                        .foregroundColor(theme.error)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(theme.spacingSm)
        .background(theme.errorBg)
        .clipShape(RoundedRectangle(cornerRadius: theme.radiusSm))
    }
}
