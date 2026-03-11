import UIKit
import UniformTypeIdentifiers

class ShareViewController: UIViewController {

    private let appGroupID = "group.com.techblog.catchup"

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor.systemBackground

        handleSharedContent()
    }

    private func handleSharedContent() {
        guard let extensionItems = extensionContext?.inputItems as? [NSExtensionItem] else {
            complete(success: false)
            return
        }

        for item in extensionItems {
            guard let attachments = item.attachments else { continue }
            for provider in attachments {
                if provider.hasItemConformingToTypeIdentifier(UTType.url.identifier) {
                    provider.loadItem(forTypeIdentifier: UTType.url.identifier) { [weak self] item, error in
                        guard error == nil, let url = item as? URL else {
                            self?.complete(success: false)
                            return
                        }
                        self?.saveSharedURL(url)
                    }
                    return
                }

                if provider.hasItemConformingToTypeIdentifier(UTType.plainText.identifier) {
                    provider.loadItem(forTypeIdentifier: UTType.plainText.identifier) { [weak self] item, error in
                        guard error == nil, let text = item as? String, let url = URL(string: text) else {
                            self?.complete(success: false)
                            return
                        }
                        self?.saveSharedURL(url)
                    }
                    return
                }
            }
        }

        complete(success: false)
    }

    private func saveSharedURL(_ url: URL) {
        let defaults = UserDefaults(suiteName: appGroupID)
        var pendingURLs = defaults?.stringArray(forKey: "pendingSharedURLs") ?? []
        pendingURLs.append(url.absoluteString)
        defaults?.set(pendingURLs, forKey: "pendingSharedURLs")

        DispatchQueue.main.async {
            self.showConfirmation(url: url)
        }
    }

    private func showConfirmation(url: URL) {
        let alert = UIAlertController(
            title: "Saved to Tech Blog Catchup",
            message: "URL queued for processing:\n\(url.host ?? url.absoluteString)",
            preferredStyle: .alert
        )
        alert.addAction(UIAlertAction(title: "OK", style: .default) { [weak self] _ in
            self?.complete(success: true)
        })
        present(alert, animated: true)
    }

    private func complete(success: Bool) {
        DispatchQueue.main.async {
            if success {
                self.extensionContext?.completeRequest(returningItems: nil)
            } else {
                let error = NSError(domain: "com.techblog.catchup.share", code: 0, userInfo: nil)
                self.extensionContext?.cancelRequest(withError: error)
            }
        }
    }
}
