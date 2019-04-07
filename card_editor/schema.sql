DROP TABLE IF EXISTS notes;

CREATE TABLE notes (
  -- We use AUTOINCREMENT here, because we do not want to reuse old rowids for
  -- new notes to preserve compatibility with anki exports.
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  note TEXT NOT NULL
);
