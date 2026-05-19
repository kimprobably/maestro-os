// swift-tools-version: 6.2
import PackageDescription

let package = Package(
    name: "FeatureSettings",
    platforms: [.iOS(.v17)],
    products: [
        .library(name: "FeatureSettings", targets: ["FeatureSettings"])
    ],
    dependencies: [
        .package(path: "../Core"),
        .package(path: "../Storage"),
        .package(path: "../Auth"),
        .package(path: "../Payments"),
        .package(path: "../DesignSystem")
    ],
    targets: [
        .target(
            name: "FeatureSettings",
            dependencies: ["Core", "Storage", "Auth", "Payments", "DesignSystem"]
        ),
        .testTarget(
            name: "FeatureSettingsTests",
            dependencies: ["FeatureSettings"]
        )
    ]
)