# Math Anki Editor

## Installation

1. Create a virtual env for the repository.
1. Install requirements.
```bash
$ pip install -r requirements.txt
```
1. Run card editor.
```bash
$ flask run
```

## Usage

For all the following commands, ensure the virtual env is activated.

Before using the card creator, you must create a new database.
```bash
$ flask init-db
```

### Importing card from Anki

1. First, export the cards from Anki.

1. Ensure the virtual env is activated. Then run:
```bash
$ flask import-notes /path/to/notes.csv
```

### Exporting cards to Anki

TODO add Anki deck setup.

1. Run:
``` bash
$ flask export-notes /path/to/notes.csv
```

1. In Anki, "File > Import", select the file.

1. In the dialog box, ensure that "Update existing notes when first field matches" is selected.
