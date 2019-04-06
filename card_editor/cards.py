from flask import Blueprint, render_template, jsonify

from card_editor.db import get_db

bp = Blueprint('cards', __name__)

@bp.route('/')
def index():
  return render_template('index.html')

@bp.route("/api/cards")
def cards():
  db = get_db()
  raw_cards = db.execute('SELECT * FROM cards').fetchall()
  cards = []
  return jsonify(cards)
