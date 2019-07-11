# NOTE: use sqlite3
# NOTE: use sqlalchemy?

import os.path
import json
import jsonschema
from components import schemas
from components.additional_validators import AdditionalValidators

from components import consts
import flask
app = flask.Flask(__name__)

# Resource API
# --------------------------------------------------

resourceAPI = consts.APIs["resource"]

# Map the resource type to an actual path. Resource types are defined by
# list_types().
resourceTypes = {
    "image": "images"
}

@app.route(os.path.normpath(resourceAPI["route"] + '/types'))
def list_types():
    # Return an identity mapping of valid types, which makes it usable as an
    # enum on the client-side.
    return json.dumps({
        "image": "image"
    })

@app.route(os.path.normpath(resourceAPI["route"] + '/resource'))
def get_resource():
    args = flask.request.args

    resourceType = args["resourceType"]
    resource = args["resource"]

    relativePath = os.path.normpath( "/".join([
        "static", resourceTypes[resourceType], resource
    ]) )

    return json.dumps({
        "path": "/" + relativePath,
        "exists": os.path.isfile(os.path.abspath(relativePath))
    })

# Schemas API
# --------------------------------------------------

schemasAPI = consts.APIs["schemas"]

@app.route(os.path.normpath(schemasAPI["route"] + "/<name>"), methods=["GET"])
def get_schema(**url_vars):
    try:
        schema = schemas.Schema(url_vars["name"])
    except FileNotFoundError:
        return "", 404 # NOT FOUND
    except jsonschema.exceptions.ValidationError:
        return "", 400 # BAD REQUEST

    return json.dumps(schema.get())

# Data API
# --------------------------------------------------

dataAPI = consts.APIs["data"]

# Relative to <webroot>/schemas and automatically appends the file extension, so
# Schema("/generate") => import <webroot>/schemas/generate.schema.json
generate_schema = schemas.Schema("/generate")

@app.route(os.path.normpath(dataAPI["route"] + "/generate"), methods=["POST"])
def generate():
    global generate_schema

    # Validate the provided generation spec (ie. instructions for what things to
    # generate and how to generate them)
    generate_spec = flask.request.get_json()
    generate_schema.validate(generate_spec)
    AdditionalValidators.validate_all(generate_spec, generate_schema)

    # For now, just return if the JSON validates
    return "true"

# Index Page
# --------------------------------------------------

@app.route("/")
def index():
    return flask.render_template("index.html", version='0.2')


if __name__ == "__main__":
    app.run(host=consts.HOST, port=consts.PORT)
