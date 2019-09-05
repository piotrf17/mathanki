# Math Anki Editor

The "Math Anki Editor" is a web application to simplify the creation
of math heavy anki cards. The main benefit it provides is immediate
rendering of MathJAX as you type.

Note that to view MathJAX in AnkiDroid, you will need to have at least
the 2.9beta version.

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

You'll also need to configure the note type for math cards
properly. Select the note type under "Tools > Manage Note
Types". Ensure that it has 3 fields: ID, Front, Back. For example, my
math card note type looks like:

![Math Note Type](fields.png?raw=true)

### Importing card from Anki

1. First, export the cards from Anki.

1. Ensure the virtual env is activated. Then run:
   ```bash
   $ flask import-notes /path/to/notes.csv
   ```

### Exporting cards to Anki

1. Run:
   ``` bash
   $ flask export-notes /path/to/notes.csv
   ```

1. In Anki, "File > Import", select the file.

1. In the dialog box, ensure that the field separator is a semicolon,
   and "Update existing notes when first field matches" is
   selected. My dialog box for importing looks like:
   
   ![Importing](import.png?raw=true)
