# RevenueCat Integration Checklist

Use this checklist to verify your RevenueCat integration is complete and working.

## Pre-Integration

- [ ] Apple Developer account active ($99/year)
- [ ] App created in App Store Connect
- [ ] RevenueCat account created (free tier available)
- [ ] RevenueCat project and app configured

---

## App Store Connect Setup

### Subscription Products

- [ ] Subscription group created
- [ ] At least one subscription product created (monthly recommended)
- [ ] Product ID follows reverse-domain format (e.g., `com.company.app.monthly`)
- [ ] Product pricing configured for primary territory
- [ ] Product display name and description added
- [ ] Product screenshot or icon uploaded
- [ ] Free trial configured (optional but recommended: 7 days)
- [ ] Products are in "Ready to Submit" state minimum

**Product IDs Created:**

```
- _______________________________ (Monthly)
- _______________________________ (Annual) [Optional]
- _______________________________ (Other) [Optional]
```

---

## RevenueCat Dashboard Setup

### Products

- [ ] Products imported or manually created in RevenueCat
- [ ] Product IDs in RevenueCat **exactly match** App Store Connect
- [ ] All products are iOS products (not Android)

### Entitlements

- [ ] Entitlement created (e.g., `pro`)
- [ ] All products attached to the entitlement
- [ ] Entitlement ID matches `RC_ENTITLEMENT_ID` in `Secrets.xcconfig`

### Offerings

- [ ] At least one offering created (e.g., `default`)
- [ ] Offering set as "Current Offering"
- [ ] Packages created in offering:
  - [ ] Monthly package (identifier: `$rc_monthly`)
  - [ ] Annual package (identifier: `$rc_annual`) [Optional]
  - [ ] Other packages [Optional]
- [ ] Each package is attached to the correct product
- [ ] Verified on dashboard that offering shows all packages

**Offering Identifier:** _______________________

**Entitlement ID:** _______________________

---

## Xcode Project Configuration

### API Keys

- [ ] RevenueCat Public iOS API Key copied from dashboard
- [ ] `Config/Secrets.xcconfig` updated with API key:
  ```
  REVENUECAT_API_KEY = appl_YOUR_KEY_HERE
  ```
- [ ] `RC_ENTITLEMENT_ID` set in `Secrets.xcconfig`:
  ```
  RC_ENTITLEMENT_ID = pro
  ```
- [ ] Configuration regenerated: `./scripts/update-config.sh`
- [ ] Build succeeds without configuration errors

### StoreKit Configuration (Simulator Testing)

- [ ] StoreKit Configuration file exists: `SwiftAIBoilerplatePro/Resources/StoreKitConfiguration.storekit`
- [ ] Product IDs in StoreKit file **exactly match** App Store Connect
- [ ] Product IDs in StoreKit file **exactly match** RevenueCat products
- [ ] StoreKit file has at least one subscription defined
- [ ] Xcode scheme configured: **Product** → **Scheme** → **Edit Scheme** → **Options** → **StoreKit Configuration** = `StoreKitConfiguration.storekit`
- [ ] Scheme file path verified (advanced):
  ```xml
  <StoreKitConfigurationFileReference
     identifier = "../../../SwiftAIBoilerplatePro/Resources/StoreKitConfiguration.storekit">
  ```

---

## Product ID Verification (Critical)

**The #1 cause of "configuration errors" is product ID mismatches.**

- [ ] Product IDs match across all 4 places:
  1. App Store Connect → In-App Purchases → Product ID
  2. RevenueCat Dashboard → Products → Product ID
  3. RevenueCat Dashboard → Offerings → Package → Attached Product
  4. `StoreKitConfiguration.storekit` → `subscriptions` → `productID`

**Verification Steps:**

1. **Check Xcode Console Logs:**
   ```
   Look for: "starting store products request for: [...]"
   The product IDs here must match everywhere else.
   ```

2. **Manual Verification:**
   ```bash
   # List all product IDs you're using:
   
   App Store Connect IDs:
   - _________________________________
   - _________________________________
   
   RevenueCat Product IDs:
   - _________________________________
   - _________________________________
   
   StoreKit Configuration IDs:
   - _________________________________
   - _________________________________
   
   # All three lists must be IDENTICAL
   ```

---

## Testing

### Simulator Testing

- [ ] App runs in simulator without crashes
- [ ] Navigate to Settings → Subscription screen
- [ ] Check Xcode console for success logs:
  ```
  ✅ "Store products request finished"
  ✅ "Fetched offerings"
  ```
- [ ] Verify offerings display correctly in UI
- [ ] Verify pricing displays correctly
- [ ] Attempt test purchase (may not complete, that's OK)
- [ ] No error logs about configuration or missing products

### Real Device Testing (Sandbox)

- [ ] Sandbox tester account created in App Store Connect
- [ ] Signed out of personal Apple ID on test device
- [ ] App installed via Xcode on test device
- [ ] Navigate to subscription screen
- [ ] Products load and display correctly
- [ ] Tap purchase → Sign in with sandbox tester when prompted
- [ ] Purchase completes successfully
- [ ] App shows subscribed state
- [ ] Premium features unlocked
- [ ] RevenueCat Dashboard → Customers → Verify purchase appears

**Sandbox Tester Email:** _______________________

---

## Common Issues & Fixes

### Issue: Empty Offerings Array

**Symptoms:**
- UI shows no products
- Logs: "Error fetching offerings" or "No offerings available"

**Check:**
- [ ] Product IDs match exactly (see Product ID Verification above)
- [ ] RevenueCat offering is set as "Current Offering"
- [ ] Products are attached to offering packages in RevenueCat Dashboard
- [ ] StoreKit Configuration path is correct in scheme file (simulator)
- [ ] Products are in "Ready to Submit" state in App Store Connect (real device)

### Issue: Configuration Error

**Symptoms:**
- Error: "There's a problem with your configuration. None of the products could be fetched"

**Check:**
- [ ] Product IDs match exactly across all 4 locations
- [ ] StoreKit Configuration file path in Xcode scheme is correct
- [ ] RevenueCat API key is valid and correctly set
- [ ] Clean build: ⌘⇧K, then rebuild

### Issue: API Key Not Recognized

**Symptoms:**
- Error: "Invalid API Key" or similar

**Check:**
- [ ] Using **Public iOS** API key (not secret key)
- [ ] API key starts with `appl_` or `test_`
- [ ] `Secrets.xcconfig` has correct key
- [ ] Ran `./scripts/update-config.sh` after updating
- [ ] Clean build and rerun

### Issue: Purchase Fails on Real Device

**Symptoms:**
- Products load, but purchase doesn't complete

**Check:**
- [ ] Signed out of personal Apple ID on device
- [ ] Using valid Sandbox tester account
- [ ] Products are in "Ready to Submit" state
- [ ] Device has internet connection
- [ ] No other app is testing purchases simultaneously

---

## Production Checklist

Before submitting to App Review:

- [ ] Switch from Sandbox API key to Production API key (if applicable)
- [ ] Subscriptions approved in App Store Connect
- [ ] Pricing configured for all necessary territories
- [ ] Privacy policy and terms of service links added to App Store Connect
- [ ] Subscription group display name and description set
- [ ] App Review Information provided for testing subscriptions
- [ ] Test with real purchase using TestFlight
- [ ] Refund policy clearly stated in app

---

## Documentation References

- [RevenueCat.md](../integrations/RevenueCat.md) - Full setup guide
- [Payments.md](../modules/Payments.md) - Payments module API
- [RevenueCat Documentation](https://docs.revenuecat.com) - Official docs

---

## Support

**Stuck?** 

1. Check Xcode console logs for specific error messages
2. Verify Product ID matching (most common issue)
3. Review RevenueCat Dashboard → Customer logs
4. Check [https://rev.cat/why-are-offerings-empty](https://rev.cat/why-are-offerings-empty)
5. Review the troubleshooting section in [RevenueCat.md](../integrations/RevenueCat.md)

---

**Last Updated:** November 2025

