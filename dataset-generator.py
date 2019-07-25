# NOTE: use sqlite3
# NOTE: use sqlalchemy?

# General
import os.path
import json
import jsonschema
from components import schemas

# Specific
from components import exceptions, consts, generate
from components.additional_validators import AdditionalValidators

# Flask
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

    return json.dumps(schema.get())

# Data API
# --------------------------------------------------

dataAPI = consts.APIs["data"]

# Relative to <webroot>/schemas and automatically appends the file extension, so
# Schema("/generate") => import <webroot>/schemas/generate.schema.json
generate_schema = schemas.Schema("/generate")

@app.route(os.path.normpath(dataAPI["route"] + "/generate"), methods=["POST"])
def generate_endpoint():
    global generate_schema

    generate_spec = flask.request.get_json()

    # Validate the provided generation spec (ie. instructions for what things to
    # generate and how to generate them)
    try:
        generate_schema.validate(generate_spec)
        AdditionalValidators.validate_all(generate_spec, generate_schema)

    except (
        jsonschema.exceptions.ValidationError,
        exceptions.BadSpecificationError
    ):
        # If validation failed, then this request was not processable, even if
        # it is a properly formed HTTP request with a properly formed JSON body.
        # https://www.vinaysahni.com/best-practices-for-a-pragmatic-restful-api
        return "", 422 # UNPROCESSABLE ENTITY

    except jsonschema.exceptions.RefResolutionError:
        # If the $ref properties in the schema cannot be interpreted by fetching
        # resources, then this service cannot validate its input. Therefore, the
        # service cannot reasonably be supplied at this time. This condition is
        # likely temporary, but how long it will take to resolve is unknown (so
        # no 'Retry-After' header can be sent).
        # See: https://stackoverflow.com/a/25398605
        return "", 503 # SERVICE UNAVAILABLE

    # Generate the tables according to the generation spec
    generated_tables = generate.generate_tables(generate_spec["tables"])

    # FIXME: For now, just return the raw generated data structure
    output_format = generate_spec["general"]["output-format"]
    if output_format == "multi-table":
        return json.dumps(generated_tables)
    # TODO: support single-table

# Index Page
# --------------------------------------------------

@app.route("/")
def index():
    return flask.render_template("index.html", version='0.2')


if __name__ == "__main__":
    app.run(host=consts.HOST, port=consts.PORT)
