# Networking Module Prompts

Ready-to-use prompts for common tasks in the Networking module.

## Add a New API Endpoint

> Add a new HTTP request type for fetching user profile data from `/users/{id}`. Follow the `HTTPRequest` protocol pattern in `Packages/Networking/Sources/Networking/HTTPRequest.swift`. The response should decode into a `UserProfile` struct. Wire it through the existing `HTTPClient` protocol.

## Add a Custom Interceptor

> Create a new HTTP interceptor that adds analytics tracking headers (request ID, timestamp) to every outgoing request. Follow the interceptor pattern used by `AuthInterceptor` and `HeadersInterceptor` in the Networking module. Register it in `CompositionRoot`.

## Adjust Retry Policy

> Change the retry policy to allow 5 retries with a maximum backoff of 30 seconds for a specific endpoint. Follow the `RetryPolicy` configuration pattern in the Networking module. Only apply the custom policy to the new endpoint; keep the default policy for everything else.
