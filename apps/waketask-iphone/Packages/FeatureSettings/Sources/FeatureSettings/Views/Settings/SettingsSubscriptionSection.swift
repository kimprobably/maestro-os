import DesignSystem
import SwiftUI

/// "Subscription" section showing Pro status or a "Go Pro" button, plus a
/// secondary Restore Purchases row (primary lives in Profile).
struct SettingsSubscriptionSection: View {
    let viewModel: SettingsViewModel
    let onShowPaywall: () -> Void

    var body: some View {
        Section {
            if viewModel.isSubscribed {
                HStack {
                    Image(systemName: "star.fill")
                        .foregroundStyle(.yellow)
                    Text("Pro Subscriber")
                    Spacer()
                    Text("Active")
                        .font(DSTypography.caption)
                        .foregroundStyle(.green)
                }
            } else {
                Button("Go Pro") {
                    onShowPaywall()
                }
                .disabled(viewModel.isLoading)
            }

            // Secondary Restore Purchases location (primary is on Profile)
            Button {
                Task { await viewModel.restorePurchases() }
            } label: {
                HStack(spacing: DSSpacing.sm) {
                    Image(systemName: "arrow.clockwise")
                        .foregroundStyle(DSColors.accentPrimary)
                    Text("Restore Purchases")
                        .foregroundStyle(DSColors.accentPrimary)
                    Spacer()
                    if viewModel.isLoading {
                        ProgressView().scaleEffect(0.8)
                    }
                }
            }
            .disabled(viewModel.isLoading)
            .accessibilityIdentifier("settingsRestorePurchasesButton")
        } header: {
            Text("Subscription")
        } footer: {
            Text("Restore purchases if you've subscribed on another device or reinstalled the app.")
                .font(DSTypography.caption)
                .foregroundStyle(DSColors.textSecondary)
        }
    }
}
