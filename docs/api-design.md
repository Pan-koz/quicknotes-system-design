# QuickNotes REST API Design

Base URL: `https://api.quicknotes.example/v1`. Use HTTPS and JSON. Authenticated endpoints accept a bearer token. This is the proposed production API, not JSONPlaceholder.

## Endpoints

| Method | Path | Description | Success |
|---|---|---|---|
| POST | `/auth/login` | Authenticate and issue token | 200 OK |
| GET | `/notes` | List the caller's notes; supports `limit` and `cursor` | 200 OK |
| POST | `/notes` | Create a note for the authenticated user | 201 Created |
| GET | `/notes/{noteId}` | Retrieve one authorized note | 200 OK |
| PATCH | `/notes/{noteId}` | Update title/body | 200 OK |
| DELETE | `/notes/{noteId}` | Delete an owned note | 204 No Content |
| GET | `/tags` | List user's tags | 200 OK |
| PUT | `/notes/{noteId}/tags/{tagId}` | Attach tag to note | 204 No Content |
| DELETE | `/notes/{noteId}/tags/{tagId}` | Detach tag from note | 204 No Content |

## Create note

`POST /v1/notes`

Request:
```json
{"title":"Meeting notes","body":"Follow up with the design team.","tagIds":[2,5]}
```

Response (`201 Created`):
```json
{"id":"note_1042","userId":"user_21","title":"Meeting notes","body":"Follow up with the design team.","tags":[{"id":2,"name":"work"},{"id":5,"name":"follow-up"}],"createdAt":"2026-10-29T12:00:00Z","updatedAt":"2026-10-29T12:00:00Z"}
```
The server derives the owner from authentication rather than trusting a body-supplied user ID. Title is required and limited to 100 characters.

## List notes

`GET /v1/notes?limit=20&cursor=abc`

Response (`200 OK`):
```json
{"items":[{"id":"note_1042","userId":"user_21","title":"Meeting notes","body":"Follow up with the design team.","tags":[{"id":2,"name":"work"}],"createdAt":"2026-10-29T12:00:00Z","updatedAt":"2026-10-29T12:00:00Z"}],"nextCursor":null}
```

## Error status codes

| Status | Meaning |
|---|---|
| 400 | Invalid JSON or invalid/missing title |
| 401 | Missing, invalid, or expired authentication |
| 403 | Authenticated user lacks permission |
| 404 | Resource not found or not visible to caller |
| 409 | Conflicting state |
| 422 | Business validation failure |
| 429 | Rate limit exceeded |
| 500 | Unexpected server error |
| 503 | Service temporarily unavailable |

Example error body:
```json
{"error":{"code":"VALIDATION_ERROR","message":"Title is required.","details":[{"field":"title","issue":"required"}],"requestId":"req_8f12ab"}}
```
Do not expose stack traces or secrets in error responses; use request IDs to correlate logs.
