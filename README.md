# QuickNotes System Design

QuickNotes is a browser-based API client and a design proposal for a note service intended to support one million registered users. The client demonstrates GET, POST, and DELETE against JSONPlaceholder; the documents describe a real production API, SQL data model, and scalable architecture.

## Run the API client

1. Clone the repository and enter its directory.
2. Run `python3 -m http.server 8000` from the project root.
3. Open `http://localhost:8000` in your browser.
4. Click **Load notes**, create a note, or delete a note.

The client uses `https://jsonplaceholder.typicode.com/posts`. JSONPlaceholder simulates POST and DELETE; it does not persist those changes remotely. Created/deleted notes are reflected only in the current page state.

## Design documents

- [API design](docs/api-design.md)
- [Data model](docs/data-model.md)
- [Architecture and scaling](docs/architecture.md)

## What I learned

- Reusable async request helpers centralize HTTP status checks and JSON handling.
- `textContent` safely inserts user-provided text without interpreting it as HTML.
- Primary/foreign keys, join tables, and indexes support relational integrity and efficient queries.
- Stateless app servers, caches, read replicas, and queues solve different scaling problems.
- Caching, replica lag, asynchronous work, resilience, and cost introduce design trade-offs.

## Production gaps

This is a practice client, not a deployed backend. Production needs authentication, authorization, persistent storage, server-side validation, rate limiting, monitoring, backups, and secure deployment.
