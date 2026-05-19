# Feature.Payments — LLM Prompt Pack

## How to use
Select `Packages/Payments/**` and `Packages/FeatureSettings/**` (for paywall UI). After changes:
- Build and run
- Test with sandbox account
- Verify purchase and restore flows
- Commit with clear message

## Quick prompts

1) Add lifetime purchase option

Prompt:
"Add a one-time lifetime purchase option for $49.99 alongside monthly subscription. Update PaywallView with 'Buy Once' button. Handle in PaymentsClient. Show 'Lifetime Member' badge in profile."

2) Add trial period indicator

Prompt:
"Show trial status in paywall if user is in free trial period. Display 'X days remaining' in PaywallView. Fetch from RevenueCat. Style with DSColors and DSTypography."

## Guided prompts

1) Add subscription tier comparison

Prompt:
"Create a comparison table in PaywallView showing Free vs Pro features side-by-side:

Free:
- 10 messages/day
- GPT-3.5 Turbo
- Basic support

Pro:
- Unlimited messages
- All AI models
- Priority support

Use SAICard for each column. Add checkmarks for included features. Make it visually clear which is better value."

2) Add promotional pricing

Prompt:
"Add support for promotional offers. Show discounted price in PaywallView if promotion active. Display original price with strikethrough. Add 'Limited Time' badge. Fetch promotional offers from RevenueCat SDK."

## Snippet prompts

1) Subscription status banner

Prompt:
"Create a subscription status banner for ProfileView showing:
- 'Premium Active' with green checkmark if subscribed
- Expiry/renewal date
- 'Manage Subscription' button linking to App Store
Use DSColors for styling."

2) Grace period handling

Prompt:
"Handle subscription grace period (3 days after expiry). Continue allowing access but show banner: 'Payment issue - please update payment method'. Add link to manage subscription in App Store."
