import sys
import jsonschema
from components import validate, exceptions

# Helper Functions
# --------------------------------------------------

def fkv(key, val):
    return key+": \""+val+"\""

def formatDict(dict_, order):
    return "{"+[fkv(key, dict_[key]) for key in order].join(", ")+"}"

# Context Functions
# --------------------------------------------------

def each_table(global_context):
    """
    Context function to provide the context of each table.

    Produces a dictionary with the following keys:
    - generate-schema: Holds the schema for generate_spec.
    - generate-spec: Holds the whole generation_spec object that contains the
      current table.
    - table: Holds the table_spec object of the current table.
    """

    for table in global_context["spec"]["tables"]:
        yield {
            "generate-schema": global_context["schema"],
            "generate-spec": global_context["spec"],
            "table": table
        }

def each_field(global_context):
    """
    Context function to provide the context of each field.

    Produces a dictionary with the following keys:
    - generate-schema: Holds the schema for generate_spec.
    - generate-spec: Holds the whole generate_spec object that contains the
      current table.
    - table: Holds the table_spec object that contains the current field
    - field: Holds the field_spec object of the current field
    """

    for table in global_context["spec"]["tables"]:
        for field in table["fields"]:
            yield {
                "generate-schema": global_context["schema"],
                "generate-spec": global_context["spec"],
                "table": table,
                "field": field
            }

# Validation Functions
# --------------------------------------------------

# Conditional Dependencies
# --------------------

#   {IF}
# #/definitions/field-settings["keySettings"]["foreignKey"]
#   {== True}
# #/definitions/field-settings["keySettings"]["foreignKeyParams"]
#   {IS REQUIRED}

@validate.validator_for(each_field)
def foreignKeyParams_exists_if_required(context):
    table = context["table"]
    field = context["field"]

    # Test for absence
    if (
        field["settings"]["keySettings"]["foreignKey"] == True and
        "foreignKeyParams" not in field["settings"]["keySettings"]
    ):
        # Validation Failed
        context_str = formatDict(
            {"table": table["name"], "field": field["name"]},
            ["table", "field"])
        raise exceptions.BadSpecificationError(
            "foreignKeyParams missing from "+context_str+", "+
            "dispite foreignKey being True")

#   {IF}
# #/definitions/field-settings["dataType"]["dataType"]
#   {== "numberSequence"}
# #/definitions/field-settings["dataType"]["numberSequence"]
#   {IS REQUIRED}

@validate.validator_for(each_field)
def numberSequence_exists_if_required(context):
    table = context["table"]
    field = context["field"]

    # Test for absence
    if (
        field["settings"]["dataType"]["dataType"] == "numberSequence" and
        "numberSequence" not in field["settings"]["dataType"]
    ):
        # Validation Failed
        context_str = formatDict(
            {"table": table["name"], "field": field["name"]},
            ["table", "field"])
        raise exceptions.BadSpecificationError(
            "numberSequence missing from "+context_str+", "+
            "dispite dataType being 'numberSequence'")

#   {IF}
# #/definitions/field-settings["dataType"]["dataType"]
#   {== "randomSequence"}
# #/definitions/field-settings["dataType"]["randomSequence"]
#   {IS REQUIRED}

@validate.validator_for(each_field)
def randomNumber_exists_if_required(context):
    table = context["table"]
    field = context["field"]

    # Test for absence
    if (
        field["settings"]["dataType"]["dataType"] == "randomNumber" and
        "randomNumber" not in field["settings"]["dataType"]
    ):
        # Validation Failed
        context_str = formatDict(
            {"table": table["name"], "field": field["name"]},
            ["table", "field"])
        raise exceptions.BadSpecificationError(
            "randomNumber missing from "+context_str+", "+
            "dispite dataType being 'randomNumber'")

#   {IF}
# #/definitions/field-settings["dataType"]["numberSequence"]["sequenceType"]
#   {== "looping"}
# #/definitions/field-settings["dataType"]["numberSequence"]["loopingSequenceParams"]
#   {IS REQUIRED}

@validate.validator_for(each_field)
def loopingSequenceParams_exists_if_required(context):
    table = context["table"]
    field = context["field"]

    # Test for absence
    data_type_spec = field["settings"]["dataType"]
    if (
        data_type_spec["dataType"] == "numberSequence" and
        data_type_spec["numberSequence"]["sequenceType"] == "looping" and
        "loopingSequenceParams" not in data_type_spec["numberSequence"]
    ):
        # Validation Failed
        context_str = formatDict(
            {"table": table["name"], "field": field["name"]},
            ["table", "field"])
        raise exceptions.BadSpecificationError(
            "loopingSequenceParams missing from "+context_str+", "+
            "dispite sequenceType being 'looping'")

# Logical Relations
# --------------------

# NOTE: Some of these depend on previous validators

#   {IF}
# #/definitions/field-settings["dataType"]["dataType"]
#   {== "randomNumber"}
# #/definitions/randomNumber["start"]
#   {<=}
# #/definitions/randomNumber["end"]

@validate.validator_for(each_field)
def randomNumber_start_le_end(context):
    field = context["field"]

    # Otherwise, this validation step is not applicable
    if (field["settings"]["dataType"]["dataType"] == "randomNumber"):
        randomNumber_spec = field["settings"]["dataType"]["randomNumber"]
        if (randomNumber_spec["start"] > randomNumber_spec["end"]):
            raise exceptions.BadSpecificationError(
                "randomNumber.start must be less than randomNumber.end")

# Collection of All Validators
# --------------------

all = validate.group_validators(validate.collect(sys.modules[__name__]))
