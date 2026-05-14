// swift-tools-version: 6.2

import PackageDescription

let package = Package(
    name: "FeatureRating",
    platforms: [
        .iOS(.v17),
    ],
    products: [
        .library(
            name: "FeatureRating",
            targets: ["FeatureRating"]
        ),
    ],
    dependencies: [
        .package(path: "../Core"),
        .package(path: "../DesignSystem"),
    ],
    targets: [
        .target(
            name: "FeatureRating",
            dependencies: ["Core", "DesignSystem"]
        ),
        .testTarget(
            name: "FeatureRatingTests",
            dependencies: ["FeatureRating"]
        ),
    ]
)
