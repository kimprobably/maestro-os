# Payments Module Prompts

Ready-to-use prompts for common tasks in the Payments module.

## Add a New Subscription Tier

> Add a "premium_yearly" product alongside the existing monthly subscription. Update `PaymentsOffering` to include the new product. Update the paywall UI in FeatureSettings to show both options with a savings badge on the yearly plan. Follow the existing `PaymentsClient` protocol pattern.

## Replace RevenueCat with StoreKit 2

> Replace the RevenueCat implementation with native StoreKit 2. Create a new `StoreKit2Client` that conforms to the existing `PaymentsClient` protocol (purchase, restore, states, currentState). Swap the implementation in `CompositionRoot`. No changes should be needed in ViewModels or Views.

## Add a Lifetime Purchase Option

> Add a one-time "lifetime" in-app purchase alongside the subscription. Extend `PaymentsState` to track both `isSubscribed` (recurring) and `hasLifetime` (one-time). Update `PaymentsClient` to handle non-consumable purchases. Gate features on `isSubscribed || hasLifetime`.
