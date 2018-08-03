# NOTE: use sqlite3
# NOTE: use sqlalchemy?

from os.path import normpath
import json

import flask
app = flask.Flask(__name__)

# APIs
# --------------------------------------------------

api = {
    "resource": {
        "route": "/resource-api/1.0.0/"
    }
}

# Resource API
# --------------------------------------------------

resourceAPI = api["resource"]

# Map the resource type to an actual path. Resource types are defined by
# list_types().
resourceTypes = {
    "image": "images"
}

@app.route(normpath(resourceAPI["route"] + '/types'))
def list_types():
    # Return an identity mapping of valid types, which makes it usable as an
    # enum on the client-side.
    return json.dumps({
        "image": "image"
    })

@app.route(normpath(resourceAPI["route"] + '/resource'))
def get_resource():
    args = flask.request.args

    resourceType = args["resourceType"]
    resource = args["resource"]

    return json.dumps({
        "path": normpath( "/" + "/".join([
            "static", resourceTypes[resourceType], resource
        ]) )
    })

# Index Page
# --------------------------------------------------

@app.route("/")
def index():
    return flask.render_template("index.html", version='0.1')


if __name__ == "__main__":
    app.run(port=5000)
