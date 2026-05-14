@testable import SwiftAIBoilerplatePro
import XCTest

final class OnboardingPageTests: XCTestCase {
    // MARK: - Initialization Tests

    func testOnboardingPage_initialization() {
        let id = UUID()
        let page = OnboardingPage(
            id: id,
            title: "Test Title",
            description: "Test Description",
            systemImage: "star.fill",
            accentColor: "blue"
        )

        XCTAssertEqual(page.id, id)
        XCTAssertEqual(page.title, "Test Title")
        XCTAssertEqual(page.description, "Test Description")
        XCTAssertEqual(page.systemImage, "star.fill")
        XCTAssertEqual(page.accentColor, "blue")
    }

    func testOnboardingPage_defaultAccentColor() {
        let page = OnboardingPage(
            title: "Title",
            description: "Description",
            systemImage: "star"
        )

        XCTAssertEqual(page.accentColor, "blue")
    }

    func testOnboardingPage_generatesUniqueIDs() {
        let page1 = OnboardingPage(title: "Test", description: "Test", systemImage: "star")
        let page2 = OnboardingPage(title: "Test", description: "Test", systemImage: "star")

        XCTAssertNotEqual(page1.id, page2.id)
    }

    // MARK: - Equatable Tests

    func testOnboardingPage_equatable_sameID() {
        let id = UUID()
        let page1 = OnboardingPage(id: id, title: "Test", description: "Desc", systemImage: "star")
        let page2 = OnboardingPage(id: id, title: "Test", description: "Desc", systemImage: "star")

        XCTAssertEqual(page1, page2)
    }

    func testOnboardingPage_equatable_differentID() {
        let page1 = OnboardingPage(title: "Test", description: "Desc", systemImage: "star")
        let page2 = OnboardingPage(title: "Test", description: "Desc", systemImage: "star")

        XCTAssertNotEqual(page1, page2)
    }

    func testOnboardingPage_equatable_differentContent() {
        let id = UUID()
        let page1 = OnboardingPage(id: id, title: "Test1", description: "Desc1", systemImage: "star")
        let page2 = OnboardingPage(id: id, title: "Test2", description: "Desc2", systemImage: "circle")

        XCTAssertNotEqual(page1, page2)
    }

    // MARK: - Default Pages Tests

    func testDefaultPages_hasExpectedCount() {
        let pages = OnboardingPage.defaultPages

        XCTAssertEqual(pages.count, 3)
    }

    func testDefaultPages_containsExpectedTitles() {
        let pages = OnboardingPage.defaultPages
        let titles = pages.map(\.title)

        XCTAssertTrue(titles.contains("Wake With Intent"))
        XCTAssertTrue(titles.contains("Proof You Actually Woke Up"))
        XCTAssertTrue(titles.contains("Private By Default"))
    }

    func testDefaultPages_allHaveSystemImages() {
        let pages = OnboardingPage.defaultPages

        for page in pages {
            XCTAssertFalse(page.systemImage.isEmpty, "Page '\(page.title)' should have a system image")
        }
    }

    func testDefaultPages_allHaveDescriptions() {
        let pages = OnboardingPage.defaultPages

        for page in pages {
            XCTAssertFalse(page.description.isEmpty, "Page '\(page.title)' should have a description")
            XCTAssertGreaterThan(page.description.count, 20, "Page '\(page.title)' should have a meaningful description")
        }
    }

    func testDefaultPages_allHaveAccentColors() {
        let pages = OnboardingPage.defaultPages

        for page in pages {
            XCTAssertFalse(page.accentColor.isEmpty, "Page '\(page.title)' should have an accent color")
        }
    }

    func testDefaultPages_haveUniqueIDs() {
        let pages = OnboardingPage.defaultPages
        let ids = pages.map(\.id)
        let uniqueIDs = Set(ids)

        XCTAssertEqual(ids.count, uniqueIDs.count, "All default pages should have unique IDs")
    }

    func testDefaultPages_firstPage_isWakePlan() {
        let firstPage = OnboardingPage.defaultPages.first

        XCTAssertNotNil(firstPage)
        XCTAssertEqual(firstPage?.title, "Wake With Intent")
        XCTAssertEqual(firstPage?.systemImage, "alarm.fill")
        XCTAssertEqual(firstPage?.accentColor, "orange")
    }

    func testDefaultPages_secondPage_isWakeProof() {
        let secondPage = OnboardingPage.defaultPages[safe: 1]

        XCTAssertNotNil(secondPage)
        XCTAssertEqual(secondPage?.title, "Proof You Actually Woke Up")
        XCTAssertEqual(secondPage?.systemImage, "checklist.checked")
        XCTAssertEqual(secondPage?.accentColor, "green")
    }

    func testDefaultPages_thirdPage_isPrivate() {
        let thirdPage = OnboardingPage.defaultPages[safe: 2]

        XCTAssertNotNil(thirdPage)
        XCTAssertEqual(thirdPage?.title, "Private By Default")
        XCTAssertEqual(thirdPage?.systemImage, "hand.raised.shield")
        XCTAssertEqual(thirdPage?.accentColor, "indigo")
    }
}

// MARK: - Array Extension for Safe Access

private extension Array {
    subscript(safe index: Index) -> Element? {
        indices.contains(index) ? self[index] : nil
    }
}
