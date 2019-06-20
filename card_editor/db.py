import csv
import random
import sqlite3
import time

import click
from flask import current_app, g
from flask.cli import with_appcontext

from card_editor import note_pb2

def init_app(app):
  app.teardown_appcontext(close_db)
  app.cli.add_command(init_db_command)
  app.cli.add_command(add_notes_command)

class NoteDB(object):
  def __init__(self, conn):
    self.conn = conn

  def create(self, schema):
    """Create a new database by executing 'schema'."""
    self.conn.executescript(schema)

  def close(self):
    """Close the database connection."""
    self.conn.close()

  def insert_note(self, note):
    """Insert a new note into the database.
    
    The note should have front and back filled in. The id must not be set,
    and will be assigned in this function.

    Returns the newly created id of the note.

    TODO(piotrf): verify that we can't insert an already inserted note.
    """
    assert not note.HasField('id')
    assert note.HasField('front')
    assert note.HasField('back')

    note.id = random.randint(0, (1<<63)-1)
    if not note.HasField('created_ts'):
      note.created_ts = time.time()

    raw_note = note.SerializeToString()
    self.conn.execute('INSERT INTO notes (id, note) VALUES (?, ?)',
                      (note.id, raw_note))
    self.conn.commit()
    
    return note.id

  def get_notes(self):
    """Get all the notes in the database.

    Returns a list of parsed Note protos. This won't scale to a huge number
    of notes, but I can't imagine ever having more than 100k.
    """
    notes = []
    raw_notes = self.conn.execute('SELECT note from notes').fetchall()
    for row in raw_notes:
      note = note_pb2.Note()
      note.ParseFromString(row[0])
      notes.append(note)
    return notes

  def update_note(self, note):
    """Update a note in the database.

    Replaces the contents of the data for note.id with 'note'. If no note exists
    with that id, raises a KeyError.
    """
    assert note.HasField('id')
    assert note.HasField('created_ts')
    assert note.HasField('front')
    assert note.HasField('back')

    note.last_edited_ts = time.time()

    note.id = 22

    # First, check if this note even exists.
    result = self.conn.execute('SELECT EXISTS(SELECT * FROM notes WHERE id=?)',
                               (note.id,))
    exists = result.fetchone()[0]
    if not exists:
      raise KeyError('No note found with id ' + str(note.id))

    raw_note = note.SerializeToString()
    self.conn.execute('UPDATE notes SET note = ? WHERE id = ?',
                      (raw_note, note.id))
    self.conn.commit()


def get_db():
  if 'db' not in g:
    g.db = NoteDB(sqlite3.connect(
      current_app.config['DATABASE'],
      detect_types=sqlite3.PARSE_DECLTYPES
    ))
  return g.db

def close_db(e=None):
  db = g.pop('db', None)
  if db is not None:
    db.close()

def init_db():
  db = get_db()

  with current_app.open_resource('schema.sql') as f:
    db.create(f.read().decode('utf8'))

@click.command('init-db')
@with_appcontext
def init_db_command():
  """Clear the existing data and create new tables."""
  if click.confirm('This will wipe the existing database, are you sure?'):
    init_db()
    click.echo('Initialized the database.')

@click.command('add-notes')
@with_appcontext
@click.argument('notes_csv_file')
def add_notes_command(notes_csv_file):
  """Add notes from a csv file."""
  notes = []
  with open(notes_csv_file) as csvfile:
    reader = csv.reader(csvfile, delimiter=';', quotechar='"')
    for row in reader:
      assert len(row)==3
      note = note_pb2.Note()
      note.front = row[0]
      note.back = row[1]
      for tag in row[2].split(','):
        note.tag.append(tag)
      notes.append(note)

  if click.confirm('Add {} notes?'.format(len(notes))):
    db = get_db()
    for note in notes:
      db.insert_note(note)
    click.echo('Added notes.')

