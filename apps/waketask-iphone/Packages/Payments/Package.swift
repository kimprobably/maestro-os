// swift-tools-version: 6.2
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "Payments",
    platforms: [
        .iOS(.v17)
    ],
    products: [
        .library(
            name: "Payments",
            targets: ["Payments"]
        )
    ],
    dependencies: [
        .package(path: "../Core"),
        .package(url: "https://github.com/RevenueCat/purchases-ios", from: "5.0.0")
    ],
    targets: [
        .target(
            name: "Payments",
            dependencies: [
                "Core",
                .product(name: "RevenueCat", package: "purchases-ios")
            ],
        ),
        .testTarget(
            name: "PaymentsTests",
            dependencies: ["Payments"]
        )
    ]
)
