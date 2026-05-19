// swift-tools-version: 6.2
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "Storage",
    platforms: [
        .iOS(.v17)
    ],
    products: [
        .library(
            name: "Storage",
            targets: ["Storage"]
        )
    ],
    dependencies: [
        .package(path: "../Core"),
        .package(path: "../Networking")
    ],
    targets: [
        .target(
            name: "Storage",
            dependencies: ["Core", "Networking"]
        ),
        .testTarget(
            name: "StorageTests",
            dependencies: ["Storage"]
        )
    ]
)