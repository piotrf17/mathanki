import os
from flask import Flask

def create_app(test_config=None):
  # Create and configure the app.
  app = Flask(__name__, instance_relative_config=True)
  app.config.from_mapping(
    SECRET_KEY='dev',
    DATABASE=os.path.join(app.instance_path, 'notes.sqlite'),
  )

  if test_config is None:
    app.config.from_pyfile('config.py', silent=True)
  else:
    app.config.from_mapping(test_config)

  # Ensure the instance folder exists.
  try:
    os.makedirs(app.instance_path)
  except OSError:
    pass

  from . import db
  db.init_app(app)

  from . import cards
  app.register_blueprint(cards.bp)
  app.add_url_rule('/', endpoint='index')
  
  return app
