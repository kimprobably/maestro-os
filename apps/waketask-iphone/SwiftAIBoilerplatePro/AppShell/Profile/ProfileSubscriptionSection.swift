import DesignSystem
import Payments
import SwiftUI

/// "Subscription" section showing active plan + App Store Guideline 3.1.1
/// compliant Restore Purchases row.
struct ProfileSubscriptionSection: View {
    let subscription: ProfileViewModel.SubscriptionInfo
    let viewModel: ProfileViewModel
    let onShowPaywall: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: DSSpacing.md) {
            DSSectionHeader(title: "Subscription")

            VStack(spacing: DSSpacing.md) {
                SubscriptionStatusCard(
                    subscription: subscription,
                    onManageTap: handleManageTap
                )

                // Accessible WITHOUT opening a paywall — required by 3.1.1.
                restorePurchasesRow
                    .background(DSColors.surface)
                    .cornerRadius(DSRadius.md)
            }
            .padding(.horizontal, DSSpacing.lg)
        }
    }

    private func handleManageTap() {
        if subscription.isActive {
            SubscriptionManager.openManageSubscriptions()
        } else {
            onShowPaywall()
        }
    }

    private var restorePurchasesRow: some View {
        Button {
            Task { await viewModel.restorePurchases() }
        } label: {
            HStack(spacing: DSSpacing.md) {
                restoreIcon
                restoreLabel
                Spacer()
                if !viewModel.isRestoringPurchases {
                    Image(systemName: "chevron.right")
                        .font(.system(size: 14))
                        .foregroundStyle(DSColors.textSecondary)
                }
            }
            .padding(DSSpacing.lg)
        }
        .buttonStyle(.plain)
        .disabled(viewModel.isRestoringPurchases)
        .accessibilityIdentifier("restorePurchasesButton")
        .accessibilityLabel("Restore Purchases")
        .accessibilityHint("Restores previously purchased subscriptions")
    }

    @ViewBuilder
    private var restoreIcon: some View {
        if viewModel.isRestoringPurchases {
            ProgressView()
                .frame(width: 24, height: 24)
        } else {
            Image(systemName: "arrow.triangle.2.circlepath")
                .font(.system(size: 20, weight: .semibold))
                .foregroundStyle(DSColors.accentPrimary)
                .frame(width: 24)
        }
    }

    private var restoreLabel: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(viewModel.isRestoringPurchases ? "Restoring..." : "Restore Purchases")
                .font(DSTypography.body)
                .fontWeight(.medium)
                .foregroundStyle(viewModel.isRestoringPurchases ? DSColors.textSecondary : DSColors.textPrimary)

            Text("Restore previously purchased subscriptions")
                .font(DSTypography.caption)
                .foregroundStyle(DSColors.textSecondary)
        }
    }
}
