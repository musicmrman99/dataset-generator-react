# Defined APIs
# ----------

APIs = {
    "resource": {
        "route": "/resource-api/1.0.0/"
    },
    "schemas": {
        "route": "/schemas-api/1.0.0/"
    },
    "data" : {
        "route": "/data-api/1.0.0/"
    }
}

# Locations
# ----------

PROTOCOL = "http"
HOST = "localhost"
PORT = 5000
WEB_ROOT_URL = "".join([PROTOCOL, "://", HOST, ":", str(PORT)])
