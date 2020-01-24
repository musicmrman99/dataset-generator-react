import json
import jsonschema
import posixpath
import warnings

from components import consts

# DEBUG
from pprint import pprint

# Schema file management - supporting functions
# --------------------------------------------------

_loaded = {}

def schema_path(name, path):
    """
    Return the path to the schema with the given name and path.

    name is a string (with no '/' characters) that represents the name of the
    schema resource.

    path is an array, whose elements are each strings (with no '/' characters)
    that represent the nodes (usually directories) that must be navigated to
    reach the schema resource.
    """

    if path is None:
        path = []

    path.append(name)
    path = "/".join(path)
    return path

def full_schema_path(schema):
    """
    Return the given schema's on-disk path, relative to the root of the server.
    
    It may be possible to use the returned path in a schema ID URL, though this
    is not garunteed to work.

    schema is a schema path, as returned by the schema_path() function.
    """

    return "/schemas/"+schema+".schema.json"

def load_schema(schema):
    """
    Load the given schema, reloading and overwriting if previously loaded.

    schema is a schema path, as returned by the schema_path() function.
    """

    with open("."+full_schema_path(schema)) as schema_file:
        # eg. "myschema", or "dir/myschema"
        _loaded[schema] = json.load(schema_file)

# Schema
# --------------------------------------------------

class Schema:
    """
    A simple generic class representing a JSON schema.

    Unlike the specific validation classes in the jsonschema module, this class
    can be used for any schema, determining which validation class to use based
    on the schema it is given.
    
    This class also supports some additional operations, such as creating a new
    Schema based on a subschema.
    """

    def __init__(self, schema, path=None,
        _schema_path=None, _schema_fragment=None):
        """
        Create a new schema, based on the given schema.

        schema is one of:
          - the name of the schema file to use (a string), or
          - a dictionary to use as a schema
          - a Schema object

        path is a list of directory names that form the path to the schema file
        to use, relative to the 'schemas' directory. If path is None, or the
        empty list, the schema file of the given name must be in the 'schemas'
        directory.
        """

        # A 'copy-constructor'
        if isinstance(schema, Schema):
            self._schema_path = schema._schema_path
            self._schema_fragment = None

            # WARNING: Plain ref copy of _schema! However, if you are
            # **MUTATING** your schemas, then WHAT ARE YOU PLAYING AT?!
            self._schema = schema._schema

        # Construct a Schema from a dict (JSON object)
        elif isinstance(schema, dict):
            # SEE NOTE 1
            self._schema_path = _schema_path
            self._schema_fragment = _schema_fragment

            self._schema = schema

        # Construct a Schema from an imported JSON file (memoized)
        else:
            self._schema_path = schema_path(schema, path)
            self._schema_fragment = None

            # Load the schema file (if needed) and keep a reference to the
            # loaded schema's root 'object' (in the JSON sense)
            if schema not in _loaded:
                load_schema(self._schema_path)
            self._schema = _loaded[self._schema_path]

        if self._schema_path == "":
            # WARNING: the "$id" being missing empty may result in propblems
            warnings.warn(
                "Relative path to schema file should be non-empty - "+
                "the schemas directory is not a schema file. "+
                "This means the \"$id\" property has not and cannot be set.")

        else:
            # Generate the schema's ID
            self._schema["$id"] = (
                consts.WEB_ROOT_URL +
                posixpath.normpath(
                    consts.APIs["schemas"]["route"] + self._schema_path) +
                ("" if self._schema_fragment is None else self._schema_fragment)
            )

        # See: https://www.peterbe.com/plog/jsonschema-validate-10x-faster-in-python
        validator_class = jsonschema.validators.validator_for(self._schema)
        validator_class.check_schema(self._schema)
        self._validator = validator_class(self._schema)

    def get(self):
        """
        Return the parsed JSON object representing the schema. This may be
        needed when passing schemas into external library functions.
        """

        return self._schema

    def subschema(self, sub, deps=None):
        """
        Create a new Schema out of a subschema of this Schema.

        This function keeps information in the new schema, including:
          - The "$schema" property
          - The "$id" property

        sub is a string identifying the subschema to extract (relative to
        '#/definitions/'), eg. 'my-subschema' would extract the subschema
        '#/definitions/my-subschema'.

        deps is a list of strings of subschemas that the given sub depends on
        (ie. has "$ref" links to). These are also relative to '#/definitions/'.
        """

        # Inherit path and fragment
        new_schema_path = self._schema_path
        new_schema_fragment = "#/definitions/"+sub # SEE NOTE 2

        # Shallow copy of the subschema
        subschema = dict(self._schema["definitions"][sub])

        # Add schema metadata
        subschema["$schema"] = self._schema["$schema"] # Same version, I hope

        # Add dependencies (if any)
        if deps is not None and len(deps) > 0:
            # Shallow copy the subschema's definitions (if any)
            if "definitions" in subschema:
                subschema["definitions"] = dict(subschema["definitions"])
            else:
                subschema["definitions"] = dict()

            # Add references to dependent subschemas into definitions
            definitions = subschema["definitions"]
            for dep in deps:
                definitions[dep] = self._schema["definitions"][dep]

        return Schema(subschema,
            _schema_path=new_schema_path,
            _schema_fragment=new_schema_fragment)

    def validate(self, obj):
        """Validate the given parsed JSON obj(ect) against this schema."""

        return self._validator.validate(obj)

# Notes
# --------------------------------------------------

# NOTE 1
# --------------------

# If these aren't given, then no path/fragment data will be available. This
# could happen if a new Schema was created from a dict directly, instead of
# from another schema, using the subschema() method, or by opening a file. Such
# direct creation is generally discouraged, as it makes it difficult to
# impossible to create a subschema with a correct "$id".

# NOTE 2
# --------------------

# Even if a fragment is already defined (likely by this function), replace it.
# If we were to extend it, the class's understanding of the absolute path (aka.
# '$id') would be corrupted. For example, if we extracted a subschema of a
# subschema:

#   - schema1 = Schema("my")
#     => schema1 is:
# {
#     "$id": ".../schemas/my.schema.json"
#     "definitions": {
#         "hello-arr": {
#             "type": "array",
#             "items": {"$ref": "#/definitions/hello"}
#         },
#         "hello": {
#             "type": "object",
#             "properties": {"value": {"const": "world"}}
#         }
#     },
#     "type": "object",
#     "properties": {
#         "name": {"type": "string"}
#         "arr": {"$ref": "#/definitions/hello-arr"}
#     }
# }

#   - schema2 = schema1.subschema("hello-arr")
#     => schema is:
# {
#     "$id": ".../schemas/my.schema.json#/definitions/hello-arr",
#     "definitions": {
#         "hello": {
#             "$comment": "[NOTE] this was placed here by subschema()"
#             "type": "object",
#             "properties": {"value": {"const": "world"}}
#         }
#     }
#     "type": "array",
#     "items": {"$ref": "#/definitions/hello"}
# }

#   - schema3 = schema2.subschema("hello")
#     => schema is:
# {
#     "$id": ".../schemas/my.schema.json#/definitions/hello-arr/definitions/hello",
#     "type": "object",
#     "properties": {"value": {"const": "world"}}
# }
#     => NOTE THAT THE "$id" PROPERTY IS NO LONGER VALID FOR THE ORIGINAL SCHEMA
#     => Even if we excluded the 'virtual' "/definitions", "$id" would still be
#        corrupted, ie.
#          ".../schemas/my.schema.json#/definitions/hello-arr/hello"
