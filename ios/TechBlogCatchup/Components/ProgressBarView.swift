import SwiftUI

struct ProgressBarView: View {
    let progress: Double
    var height: CGFloat = 4
    var fillColor: Color?

    @Environment(\.theme) private var theme

    var body: some View {
        GeometryReader { geometry in
            ZStack(alignment: .leading) {
                RoundedRectangle(cornerRadius: height / 2)
                    .fill(theme.surfaceHover)
                    .frame(height: height)

                RoundedRectangle(cornerRadius: height / 2)
                    .fill(fillColor ?? theme.primary)
                    .frame(width: geometry.size.width * min(max(progress, 0), 1), height: height)
            }
        }
        .frame(height: height)
    }
}
