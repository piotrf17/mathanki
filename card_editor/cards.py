from flask import Blueprint, render_template, jsonify, request, current_app, make_response
from google.protobuf import json_format

from card_editor import note_pb2
from card_editor.db import get_db

bp = Blueprint('cards', __name__)

def error_response(error_text):
  current_app.logger.error(error_text)
  data = {
    'error': error_text
  }
  return make_response(jsonify(data), 400)

@bp.route('/')
def index():
  return render_template('index.html')

@bp.route('/api/cards')
def cards():
  db = get_db()
  cards = db.get_notes()
  json_cards = []
  for card in cards:
    json_cards.append(json_format.MessageToDict(card))
  return jsonify(json_cards)

# TODO(piotrf): rename to /api/cards
@bp.route('/api/cards/create', methods=('PUT',))
def create_card():
  data = request.get_json()
  note = json_format.ParseDict(data, note_pb2.Note())
  db = get_db()
  note_id = db.insert_note(note)
  response = {}
  response['id'] = str(note_id)
  return make_response(jsonify(response), 200)
  

@bp.route('/api/cards/<string:note_id>', methods=('PUT','DELETE'))
def single_card(note_id):
  if request.method == 'PUT':
    data = request.get_json()
    current_app.logger.info(data);
    if data['id'] != note_id:
      return error_response('request id does not match data')
    note = json_format.ParseDict(data, note_pb2.Note())
    db = get_db()
    db.update_note(note)
  elif request.method == 'DELETE':
    db = get_db()
    db.delete_note(note_id)

  return make_response(jsonify({}), 200)
