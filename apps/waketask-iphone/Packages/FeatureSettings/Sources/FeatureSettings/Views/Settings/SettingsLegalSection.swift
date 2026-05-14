import SwiftUI

/// "Legal" section: Privacy Policy / Terms of Service / Subscription Terms links.
struct SettingsLegalSection: View {
    let onShowPrivacy: () -> Void
    let onShowTerms: () -> Void
    let onShowSubscriptionTerms: () -> Void

    var body: some View {
        Section("Legal") {
            Button {
                onShowPrivacy()
            } label: {
                Label("Privacy Policy", systemImage: "hand.raised")
            }

            Button {
                onShowTerms()
            } label: {
                Label("Terms of Service", systemImage: "doc.text")
            }

            Button {
                onShowSubscriptionTerms()
            } label: {
                Label("Subscription Terms", systemImage: "creditcard")
            }
        }
    }
}
