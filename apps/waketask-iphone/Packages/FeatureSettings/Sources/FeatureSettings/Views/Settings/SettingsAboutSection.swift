import SwiftUI
import DesignSystem

/// "About" section: version + build number. Pulls values via the internal
/// `Bundle.appVersion` / `Bundle.buildNumber` helpers.
struct SettingsAboutSection: View {

    var body: some View {
        Section {
            HStack {
                Text("Version")
                Spacer()
                Text(Bundle.main.appVersion)
                    .foregroundStyle(DSColors.textSecondary)
            }

            HStack {
                Text("Build")
                Spacer()
                Text(Bundle.main.buildNumber)
                    .foregroundStyle(DSColors.textSecondary)
            }
        } header: {
            Text("About")
        }
    }
}
