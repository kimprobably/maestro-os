import SwiftUI

struct ContentView: View {
    var body: some View {
        NavigationStack {
            VStack(spacing: 16) {
                Image(systemName: "bolt.horizontal.circle.fill")
                    .font(.system(size: 44))
                Text("SwiftAI Boilerplate Pro")
                    .font(.title).bold()
                Text("Clean SwiftUI app entry. Packages coming next.")
                    .foregroundStyle(.secondary)
            }
            .padding()
            .navigationTitle("Home")
        }
    }
}

#Preview {
    ContentView()
}
