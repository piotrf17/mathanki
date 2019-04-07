from flask import Blueprint, render_template, jsonify
from google.protobuf.json_format import MessageToDict

from card_editor.db import get_db

bp = Blueprint('cards', __name__)

@bp.route('/')
def index():
  return render_template('index.html')

@bp.route("/api/cards")
def cards():
  db = get_db()
  cards = db.get_notes()
  json_cards = []
  for card in cards:
    json_cards.append(MessageToDict(card))
  return jsonify(json_cards)
