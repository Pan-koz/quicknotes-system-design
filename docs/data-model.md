# QuickNotes Data Model

QuickNotes uses SQL (for example PostgreSQL) because ownership, constraints, transactions, and note/tag relationships benefit from relational integrity.

## Entities and columns

- **users**: `id BIGINT` primary key; `email VARCHAR(254)` unique/not null; `display_name VARCHAR(100)` not null; `created_at TIMESTAMPTZ`.
- **notes**: `id BIGINT` primary key; `user_id BIGINT` foreign key to users; `title VARCHAR(100)` not null; `body TEXT`; `created_at`, `updated_at TIMESTAMPTZ`.
- **tags**: `id BIGINT` primary key; `user_id BIGINT` foreign key to users; `name VARCHAR(50)` not null; `created_at TIMESTAMPTZ`.
- **note_tags**: `note_id BIGINT` foreign key to notes; `tag_id BIGINT` foreign key to tags; composite primary key (`note_id`, `tag_id`).

## Relationships

A user has many notes and many tags (one-to-many). Notes and tags have a many-to-many relationship through `note_tags`. Foreign keys preserve integrity; cascading deletion removes dependent rows.

## CREATE TABLE statements

```sql
CREATE TABLE users (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email VARCHAR(254) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notes (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  body TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tags (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, name)
);

CREATE TABLE note_tags (
  note_id BIGINT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  tag_id BIGINT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (note_id, tag_id)
);

CREATE INDEX idx_notes_user_updated ON notes (user_id, updated_at DESC);
CREATE INDEX idx_note_tags_tag ON note_tags (tag_id);
```

The `idx_notes_user_updated` index supports listing a user's newest notes efficiently; the tag index helps find notes by tag.

## Example SQL queries

List latest notes:
```sql
SELECT id, title, body, updated_at FROM notes
WHERE user_id = 21 ORDER BY updated_at DESC LIMIT 20;
```

Notes with tags (JOIN):
```sql
SELECT n.id, n.title, t.name AS tag
FROM notes n
JOIN note_tags nt ON nt.note_id = n.id
JOIN tags t ON t.id = nt.tag_id
WHERE n.user_id = 21 ORDER BY n.updated_at DESC;
```

Count notes per user:
```sql
SELECT u.id, u.email, COUNT(n.id) AS note_count
FROM users u LEFT JOIN notes n ON n.user_id = u.id
GROUP BY u.id, u.email ORDER BY note_count DESC;
```

SQL is the default choice because the application has clear entities, ownership constraints, transactions, and many-to-many relationships. A NoSQL store may help a specialized high-volume or flexible-schema workload later, but is not required as the primary store at this stage.
