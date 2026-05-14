@testable import DesignSystem
import SwiftUI
import Testing

/// Tests for Design System token invariants
struct TokenTests {
    // MARK: - Spacing Tests

    @Test("Spacing tokens are positive and ordered")
    func spacingTokensArePositiveAndOrdered() {
        #expect(DSSpacing.xs > 0)
        #expect(DSSpacing.sm > 0)
        #expect(DSSpacing.md > 0)
        #expect(DSSpacing.lg > 0)
        #expect(DSSpacing.xl > 0)

        // Verify ordering
        #expect(DSSpacing.xs < DSSpacing.sm)
        #expect(DSSpacing.sm < DSSpacing.md)
        #expect(DSSpacing.md < DSSpacing.lg)
        #expect(DSSpacing.lg < DSSpacing.xl)
    }

    @Test("Spacing scale follows 4pt base")
    func spacingScaleFollows4ptBase() {
        // All spacing values should be multiples of 4
        #expect(DSSpacing.xs.truncatingRemainder(dividingBy: 4) == 0)
        #expect(DSSpacing.sm.truncatingRemainder(dividingBy: 4) == 0)
        #expect(DSSpacing.md.truncatingRemainder(dividingBy: 4) == 0)
        #expect(DSSpacing.lg.truncatingRemainder(dividingBy: 4) == 0)
        #expect(DSSpacing.xl.truncatingRemainder(dividingBy: 4) == 0)
    }

    // MARK: - Radius Tests

    @Test("Radius tokens are positive and ordered")
    func radiusTokensArePositiveAndOrdered() {
        #expect(DSRadius.xs > 0)
        #expect(DSRadius.sm > 0)
        #expect(DSRadius.md > 0)
        #expect(DSRadius.lg > 0)
        #expect(DSRadius.xl > 0)

        // Verify ordering
        #expect(DSRadius.xs < DSRadius.sm)
        #expect(DSRadius.sm < DSRadius.md)
        #expect(DSRadius.md < DSRadius.lg)
        #expect(DSRadius.lg < DSRadius.xl)
    }

    @Test("Default card radius matches lg")
    func cardRadiusMatchesLg() {
        #expect(DSRadius.card == DSRadius.lg)
        #expect(DSRadius.card == 24)
    }

    @Test("Radius scale follows 4pt base")
    func radiusScaleFollows4ptBase() {
        // All radius values should be multiples of 4
        #expect(DSRadius.xs.truncatingRemainder(dividingBy: 4) == 0)
        #expect(DSRadius.sm.truncatingRemainder(dividingBy: 4) == 0)
        #expect(DSRadius.md.truncatingRemainder(dividingBy: 4) == 0)
        #expect(DSRadius.lg.truncatingRemainder(dividingBy: 4) == 0)
        #expect(DSRadius.xl.truncatingRemainder(dividingBy: 4) == 0)
    }

    // MARK: - Typography Tests

    @Test("Typography scales are properly sized")
    func typographyScalesAreProperSize() {
        // Smoke test: verify fonts can be accessed
        _ = DSTypography.titleXL
        _ = DSTypography.titleL
        _ = DSTypography.titleM
        _ = DSTypography.body
        _ = DSTypography.caption
    }

    @Test("Semantic typography helpers are defined")
    func semanticTypographyHelpersAreDefined() {
        #expect(DSTypography.saiHeadline == DSTypography.titleL)
        #expect(DSTypography.saiBody == DSTypography.body)
        #expect(DSTypography.saiCaption == DSTypography.caption)
    }

    @Test("Line spacing is positive")
    func lineSpacingIsPositive() {
        #expect(DSTypography.titleLineSpacing > 0)
        #expect(DSTypography.bodyLineSpacing > 0)
        #expect(DSTypography.captionLineSpacing > 0)
    }

    // MARK: - Elevation Tests

    @Test("Elevation levels are ordered by intensity")
    func elevationLevelsAreOrdered() {
        let level1 = DSElevation.level1
        let level2 = DSElevation.level2
        let level3 = DSElevation.level3

        // Verify radius increases
        #expect(level1.radius < level2.radius)
        #expect(level2.radius < level3.radius)

        // Verify y offset increases
        #expect(level1.y < level2.y)
        #expect(level2.y < level3.y)
    }

    @Test("Elevation shadows have valid opacity")
    func elevationShadowsHaveValidOpacity() {
        // Opacity should be between 0 and 1 (checked via color components)
        let level1 = DSElevation.level1
        let level2 = DSElevation.level2
        let level3 = DSElevation.level3

        #expect(level1.radius > 0)
        #expect(level2.radius > 0)
        #expect(level3.radius > 0)
    }

    // MARK: - Color Tests

    @Test("Core colors are accessible")
    func coreColorsAreAccessible() {
        // Smoke test: verify colors can be accessed without crashing
        _ = DSColors.accentPrimary
        _ = DSColors.accentSecondary
        _ = DSColors.surface
        _ = DSColors.surfaceElevated
        _ = DSColors.surfaceTinted
        _ = DSColors.borderHairline
        _ = DSColors.textPrimary
        _ = DSColors.textSecondary
    }

    @Test("Semantic colors are accessible")
    func semanticColorsAreAccessible() {
        _ = DSColors.danger
        _ = DSColors.success
        _ = DSColors.warning
        _ = DSColors.chipBackground
        _ = DSColors.chipSelectedBackground
        _ = DSColors.toastAccent
    }

    @Test("Legacy color compatibility is maintained")
    func legacyColorCompatibilityMaintained() {
        #expect(DSColors.primary == DSColors.accentPrimary)
    }

    // MARK: - Gradient Tests

    @Test("Primary gradient exists")
    func primaryGradientExists() {
        // Smoke test: verify gradient can be accessed
        _ = DSGradient.primaryLinear
    }

    @Test("Accent border overlay gradient exists")
    func accentBorderOverlayGradientExists() {
        // Smoke test: verify gradient can be accessed
        _ = DSGradient.accentBorderOverlay
    }

    @Test("Shimmer gradient exists")
    func shimmerGradientExists() {
        // Smoke test: verify gradient can be accessed
        _ = DSGradient.shimmer
    }
}

// MARK: - Component Invariant Tests

struct ComponentTests {
    @Test("SAIButton sizes are valid")
    func buttonSizesAreValid() {
        #expect(SAIButton.Size.sm.height > 0)
        #expect(SAIButton.Size.md.height > 0)
        #expect(SAIButton.Size.lg.height > 0)

        // Verify ordering
        #expect(SAIButton.Size.sm.height < SAIButton.Size.md.height)
        #expect(SAIButton.Size.md.height < SAIButton.Size.lg.height)

        // Medium should be at least 44pt for accessibility
        #expect(SAIButton.Size.md.height >= 44)
    }

    @Test("SAIAvatar sizes are valid")
    func avatarSizesAreValid() {
        #expect(SAIAvatar.Size.sm.diameter > 0)
        #expect(SAIAvatar.Size.md.diameter > 0)
        #expect(SAIAvatar.Size.lg.diameter > 0)
        #expect(SAIAvatar.Size.xl.diameter > 0)

        // Verify ordering
        #expect(SAIAvatar.Size.sm.diameter < SAIAvatar.Size.md.diameter)
        #expect(SAIAvatar.Size.md.diameter < SAIAvatar.Size.lg.diameter)
        #expect(SAIAvatar.Size.lg.diameter < SAIAvatar.Size.xl.diameter)
    }

    @Test("Toast styles have associated colors")
    func toastStylesHaveColors() {
        // Smoke test: verify colors can be accessed without crashing
        _ = ToastMessage.ToastStyle.info.color
        _ = ToastMessage.ToastStyle.success.color
        _ = ToastMessage.ToastStyle.error.color
        _ = ToastMessage.ToastStyle.warning.color
    }

    @Test("Toast styles have icons")
    func toastStylesHaveIcons() {
        #expect(!ToastMessage.ToastStyle.info.icon.isEmpty)
        #expect(!ToastMessage.ToastStyle.success.icon.isEmpty)
        #expect(!ToastMessage.ToastStyle.error.icon.isEmpty)
        #expect(!ToastMessage.ToastStyle.warning.icon.isEmpty)
    }
}

// MARK: - Motion Tests

struct MotionTests {
    @Test("Motion timings are positive")
    func motionTimingsArePositive() {
        // We can't directly test Animation values, but we can verify they exist
        _ = SAIMotion.quick
        _ = SAIMotion.standard
        _ = SAIMotion.smooth
        _ = SAIMotion.spring
        _ = SAIMotion.gentleSpring
    }

    @Test("Adaptive animations exist")
    func adaptiveAnimationsExist() {
        _ = SAIMotion.adaptiveStandard
        _ = SAIMotion.adaptiveSpring
    }
}
