import SwiftUI

/// View for displaying legal documents (Terms, Privacy, Subscription Terms)
struct LegalDocumentView: View {
    
    let title: String
    let content: String
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationStack {
            ScrollView {
                Text(content)
                    .font(.body)
                    .padding()
            }
            .navigationTitle(title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
    
    // MARK: - Factory Methods
    
    static func terms() -> LegalDocumentView {
        LegalDocumentView(
            title: "Terms of Service",
            content: termsContent
        )
    }
    
    static func privacy() -> LegalDocumentView {
        LegalDocumentView(
            title: "Privacy Policy",
            content: privacyContent
        )
    }
    
    static func subscriptionTerms() -> LegalDocumentView {
        LegalDocumentView(
            title: "Subscription Terms",
            content: subscriptionTermsContent
        )
    }
}

// MARK: - Legal Content

private let termsContent = """
Terms of Service

Last Updated: [DATE]

1. Acceptance of Terms
By accessing and using this application, you accept and agree to be bound by the terms and provisions of this agreement.

2. Use License
Permission is granted to temporarily use this application for personal, non-commercial transitory viewing only.

3. Disclaimer
The materials within this application are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.

4. Limitations
In no event shall we or our suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use this application.

5. Accuracy of Materials
The materials appearing in this application could include technical, typographical, or photographic errors. We do not warrant that any of the materials on this application are accurate, complete or current.

6. Links
We have not reviewed all of the sites linked to this application and are not responsible for the contents of any such linked site.

7. Modifications
We may revise these terms of service at any time without notice. By using this application you are agreeing to be bound by the then current version of these terms of service.

8. Governing Law
These terms and conditions are governed by and construed in accordance with the laws and you irrevocably submit to the exclusive jurisdiction of the courts in that location.

Contact Us
If you have any questions about these Terms, please contact us at: [CONTACT EMAIL]
"""

private let privacyContent = """
Privacy Policy

Last Updated: [DATE]

1. Introduction
We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you about how we look after your personal data and tell you about your privacy rights.

2. Information We Collect
We may collect, use, store and transfer different kinds of personal data about you:
- Identity Data (name, username)
- Contact Data (email address)
- Technical Data (IP address, browser type, device information)
- Usage Data (how you use our application)
- Marketing and Communications Data (your preferences in receiving marketing)

3. How We Use Your Information
We use your personal data for the following purposes:
- To provide and maintain our service
- To notify you about changes to our service
- To provide customer support
- To gather analysis or valuable information to improve our service
- To monitor the usage of our service
- To detect, prevent and address technical issues

4. Data Security
We have implemented appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way.

5. Data Retention
We will only retain your personal data for as long as necessary to fulfill the purposes we collected it for.

6. Your Legal Rights
You have the right to:
- Request access to your personal data
- Request correction of your personal data
- Request erasure of your personal data
- Object to processing of your personal data
- Request restriction of processing your personal data
- Request transfer of your personal data
- Withdraw consent

7. Third-Party Links
This application may include links to third-party websites. We have no control over the content and practices of these sites.

8. Changes to This Privacy Policy
We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.

Contact Us
If you have any questions about this Privacy Policy, please contact us at: [CONTACT EMAIL]
"""

private let subscriptionTermsContent = """
Subscription Terms

Last Updated: [DATE]

1. Subscription Services
Our application offers subscription-based services that provide access to premium features.

2. Subscription Plans
We offer the following subscription options:
- Monthly Subscription
- Annual Subscription

3. Billing and Renewal
- Subscriptions are billed in advance on a recurring basis
- Your subscription will automatically renew unless you cancel it
- You will be charged through your Apple ID account
- Your account will be charged for renewal within 24 hours prior to the end of the current period

4. Free Trial
- We may offer a free trial for new subscribers
- You may cancel at any time during the free trial period without being charged
- If you do not cancel before the trial period ends, you will be automatically charged for the subscription

5. Cancellation
- You can cancel your subscription at any time through your Apple ID account settings
- Cancellation will take effect at the end of the current billing period
- You will retain access to premium features until the end of your current billing period

6. Refunds
- Refunds are handled in accordance with Apple's App Store refund policies
- Generally, all charges for in-app purchases are non-refundable
- You may request a refund through the App Store within the time frame specified by Apple

7. Price Changes
- We reserve the right to change subscription prices
- Any price changes will be communicated to you in advance
- Price changes will take effect at the start of your next billing cycle

8. Modification of Services
We reserve the right to:
- Modify or discontinue any feature of the subscription service
- Change the features included in any subscription plan
- These changes will be communicated to you in advance when possible

9. Termination
We may terminate or suspend your subscription immediately if you:
- Breach these terms
- Violate our terms of service
- Engage in fraudulent activity

10. Contact for Subscription Issues
If you have any questions about subscriptions or billing, please contact us at: [CONTACT EMAIL]

For App Store-related issues, please contact Apple Support directly.
"""

