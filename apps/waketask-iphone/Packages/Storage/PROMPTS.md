# Storage Module Prompts

Ready-to-use prompts for common tasks in the Storage module.

## Add a New SwiftData Model

> Add a new SwiftData model called `UserNote` with fields: id (UUID), title (String), content (String), createdAt (Date), updatedAt (Date). Create a `UserNoteDTO` following the existing DTO pattern (see `ConversationDTO`, `MessageDTO`). Create a `UserNoteRepository` protocol and `UserNoteRepositoryImpl` following the existing `ConversationRepository` pattern. Register it in `CompositionRoot`.

## Add a Keychain Field

> Store a new value in the Keychain for the user's preferred AI model ID. Follow the `KeychainStore` pattern in `Packages/Storage/Sources/Storage/`. Add a `preferredModelID` accessor that reads and writes a String value.

## Add Cursor-Based Pagination to a New Entity

> Add cursor-based pagination support for the `UserNote` model. Follow the `MessageCursor` and `InfinitePaginator` pattern used in FeatureChat. The cursor should be based on `createdAt` for consistent ordering.
