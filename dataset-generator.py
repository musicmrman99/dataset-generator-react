# NOTE: use sqlite3
# NOTE: use sqlalchemy?

# General
import os.path
import json
import jsonschema
from components import schemas

# Specific
from components import exceptions, consts, validate, generate
from components.validators import validate_generate

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
        validate.validate(validate_generate.all,
            generate_spec, generate_schema)

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

    # Generate the CSV data and return the file to the client
    output_format = generate_spec["general"]["output-format"]
    if output_format == "multi-table":
        # Equivilent to `with <EXPR> as <VAR>: <BLOCK>...</BLOCK>`, but without
        # calling __exit__() to close the file.
        # See https://www.python.org/dev/peps/pep-0343/.
        mgr = generate.toMultiCSV(generated_tables) # <EXPR>
        multi_csv = type(mgr).__enter__(mgr) # <VAR>
        # <BLOCK>
        return flask.send_file(
            multi_csv, mimetype="application/zip",
            as_attachment=True, attachment_filename="generated-tables.zip")
        # </BLOCK>

        # The file will be 'closed' when it is GCed after it goes out of scope.
        # This will work on a io.BytesIO instance (as toMultiCSV() returns)
        # because it is an in-memory file-like object - ie. not a 'real' file.
        # While leaving the file to be closed by the GC, even in the case of
        # 'virtual' files, is not good form, closing it explicitly raises a
        # ValueError.

    # TODO: support single-table

# Index Page
# --------------------------------------------------

@app.route("/")
def index():
    return flask.render_template("index.html", version='0.2')


if __name__ == "__main__":
    app.run(host=consts.HOST, port=consts.PORT)
