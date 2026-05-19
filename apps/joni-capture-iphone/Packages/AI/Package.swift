// swift-tools-version: 6.2
import PackageDescription

let package = Package(
    name: "AI",
    platforms: [.iOS(.v17)],
    products: [
        .library(name: "AI", targets: ["AI"])
    ],
    dependencies: [
        .package(path: "../Core"),
        .package(path: "../Networking"),
        .package(path: "../FeatureChat")
    ],
    targets: [
        .target(name: "AI", dependencies: ["Core", "Networking", "FeatureChat"]),
        .testTarget(name: "AITests", dependencies: ["AI"])
    ]
)
