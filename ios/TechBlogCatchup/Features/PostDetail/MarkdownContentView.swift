import SwiftUI
import MarkdownUI

struct MarkdownContentView: View {
    let text: String

    @Environment(\.theme) private var theme

    var body: some View {
        Markdown(text)
            .markdownTheme(darkTheme)
            .markdownTextStyle {
                ForegroundColor(Color(hex: ThemeConfig.textPrimary))
                FontSize(ThemeConfig.body)
            }
    }

    private var darkTheme: MarkdownUI.Theme {
        .gitHub.text {
            ForegroundColor(Color(hex: ThemeConfig.textPrimary))
            FontSize(ThemeConfig.body)
        }
        .heading1 { configuration in
            configuration.label
                .markdownTextStyle {
                    FontWeight(.bold)
                    FontSize(ThemeConfig.titleLarge)
                    ForegroundColor(Color(hex: ThemeConfig.textPrimary))
                }
                .markdownMargin(top: 24, bottom: 16)
        }
        .heading2 { configuration in
            configuration.label
                .markdownTextStyle {
                    FontWeight(.semibold)
                    FontSize(ThemeConfig.titleMedium)
                    ForegroundColor(Color(hex: ThemeConfig.textPrimary))
                }
                .markdownMargin(top: 20, bottom: 12)
        }
        .heading3 { configuration in
            configuration.label
                .markdownTextStyle {
                    FontWeight(.semibold)
                    FontSize(ThemeConfig.body)
                    ForegroundColor(Color(hex: ThemeConfig.textPrimary))
                }
                .markdownMargin(top: 16, bottom: 8)
        }
        .codeBlock { configuration in
            configuration.label
                .markdownTextStyle {
                    FontFamily(.init(name: "Menlo"))
                    FontSize(ThemeConfig.caption)
                    ForegroundColor(Color(hex: ThemeConfig.textSecondary))
                }
                .padding(12)
                .background(Color(hex: ThemeConfig.surface))
                .clipShape(RoundedRectangle(cornerRadius: ThemeConfig.radiusSm))
                .markdownMargin(top: 8, bottom: 8)
        }
        .code {
            FontFamily(.init(name: "Menlo"))
            FontSize(ThemeConfig.caption)
            ForegroundColor(Color(hex: ThemeConfig.accentText))
        }
        .link {
            ForegroundColor(Color(hex: ThemeConfig.primary))
        }
        .blockquote { configuration in
            HStack(spacing: 0) {
                Rectangle()
                    .fill(Color(hex: ThemeConfig.cardBorder))
                    .frame(width: 3)

                configuration.label
                    .markdownTextStyle {
                        ForegroundColor(Color(hex: ThemeConfig.textSecondary))
                        FontStyle(.italic)
                    }
                    .padding(.leading, 12)
            }
            .markdownMargin(top: 8, bottom: 8)
        }
    }
}
