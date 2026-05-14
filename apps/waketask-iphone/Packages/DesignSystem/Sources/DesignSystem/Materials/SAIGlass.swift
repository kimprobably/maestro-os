import SwiftUI

// MARK: - SAIGlassStyle

/// Signature AI glass material variants.
///
/// Maps 1:1 to iOS 26 Liquid Glass on newer OSes and falls back to SwiftUI
/// `Material` on iOS 17–25 so the same call site works everywhere.
public enum SAIGlassStyle: Sendable {
    /// Default functional glass — navigation, toolbars, floating controls.
    case regular
    /// Maximum transparency — only use against dense, high-contrast content.
    case clear

    @available(iOS 26.0, *)
    fileprivate var liquid: Glass {
        switch self {
        case .regular: .regular
        case .clear: .clear
        }
    }

    fileprivate var fallbackMaterial: Material {
        switch self {
        case .regular: .regularMaterial
        case .clear: .ultraThinMaterial
        }
    }
}

// MARK: - View modifier

private struct SAIGlassModifier<ClipShape: Shape>: ViewModifier {
    let style: SAIGlassStyle
    let shape: ClipShape
    let isInteractive: Bool

    func body(content: Content) -> some View {
        if #available(iOS 26.0, *) {
            content
                .glassEffect(
                    isInteractive ? style.liquid.interactive() : style.liquid,
                    in: shape
                )
        } else {
            content
                .background(style.fallbackMaterial, in: shape)
        }
    }
}

public extension View {
    /// Apply signature glass material that adopts iOS 26 Liquid Glass when
    /// available and falls back to SwiftUI `Material` on earlier releases.
    ///
    /// ```swift
    /// Button("Send") { }
    ///     .saiGlass(.regular, in: Capsule())
    /// ```
    func saiGlass(
        _ style: SAIGlassStyle = .regular,
        in shape: some Shape,
        interactive: Bool = false
    ) -> some View {
        modifier(SAIGlassModifier(style: style, shape: shape, isInteractive: interactive))
    }

    /// Convenience for the default rounded-rectangle glass surface using
    /// `DSRadius.md`.
    func saiGlass(
        _ style: SAIGlassStyle = .regular,
        interactive: Bool = false
    ) -> some View {
        saiGlass(
            style,
            in: RoundedRectangle(cornerRadius: DSRadius.md, style: .continuous),
            interactive: interactive
        )
    }
}

// MARK: - Glass container

/// Wraps several glass surfaces so iOS 26 can merge their rendering (and
/// optimise morphing) while remaining a transparent passthrough on iOS 17–25.
public struct SAIGlassContainer<Content: View>: View {
    private let spacing: CGFloat
    private let content: Content

    public init(spacing: CGFloat = 8, @ViewBuilder content: () -> Content) {
        self.spacing = spacing
        self.content = content()
    }

    public var body: some View {
        if #available(iOS 26.0, *) {
            GlassEffectContainer(spacing: spacing) {
                content
            }
        } else {
            content
        }
    }
}

// MARK: - Scroll edge effect

public extension View {
    /// iOS 26+: apply a scroll-edge effect under a glass surface so scrolled
    /// content stays legible. On earlier releases this is a no-op.
    @ViewBuilder
    func saiScrollEdgeGlass(_ edge: Edge.Set = .bottom) -> some View {
        if #available(iOS 26.0, *) {
            scrollEdgeEffectStyle(.hard, for: edge)
        } else {
            self
        }
    }
}

// MARK: - Tab bar adaptation

public enum SAITabBarMinimizeStyle: Sendable {
    case onScrollDown
    case onScrollUp
    case automatic
    case never
}

public extension View {
    /// iOS 26+: automatically minimise the tab bar while scrolling.
    /// No-op on earlier releases.
    @ViewBuilder
    func saiTabBarMinimize(_ style: SAITabBarMinimizeStyle = .onScrollDown) -> some View {
        if #available(iOS 26.0, *) {
            switch style {
            case .onScrollDown: tabBarMinimizeBehavior(.onScrollDown)
            case .onScrollUp: tabBarMinimizeBehavior(.onScrollUp)
            case .automatic: tabBarMinimizeBehavior(.automatic)
            case .never: tabBarMinimizeBehavior(.never)
            }
        } else {
            self
        }
    }

    /// iOS 26+: opt the tab bar into sidebar adaptation on iPad/macOS while
    /// remaining a tab bar on iPhone. No-op on earlier releases.
    @ViewBuilder
    func saiSidebarAdaptable() -> some View {
        if #available(iOS 26.0, *) {
            tabViewStyle(.sidebarAdaptable)
        } else {
            self
        }
    }
}

// MARK: - Previews

#if DEBUG
    #Preview("Glass surfaces") {
        ZStack {
            LinearGradient(
                colors: [.blue, .purple, .pink],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            SAIGlassContainer(spacing: DSSpacing.md) {
                VStack(spacing: DSSpacing.lg) {
                    Text("Regular glass")
                        .font(DSTypography.titleM)
                        .padding(DSSpacing.lg)
                        .saiGlass(.regular, in: Capsule())

                    Text("Clear glass")
                        .font(DSTypography.body)
                        .padding(DSSpacing.lg)
                        .saiGlass(.clear, in: RoundedRectangle(cornerRadius: DSRadius.lg, style: .continuous))
                }
            }
        }
    }
#endif
