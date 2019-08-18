import sys
import jsonschema
from components import validate, exceptions

# Helper Functions
# --------------------------------------------------

def fkv(key, val):
    return key+": \""+val+"\""

def formatDict(dict_, order):
    return "{"+", ".join([fkv(key, dict_[key]) for key in order])+"}"

# See https://stackoverflow.com/a/5352649
def context_str(context):
    possible_context = ["table", "field"]
    return formatDict(
        {key: context[key] for key in possible_context if key in context},
        possible_context)

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
#   {EXISTS}

@validate.validator_for(each_field)
def foreignKeyParams_exists_if_required(context):
    field = context["field"]

    if (
        field["settings"]["keySettings"]["foreignKey"] is True and
        "foreignKeyParams" not in field["settings"]["keySettings"]
    ):
        raise exceptions.BadSpecificationError(
            "foreignKeyParams missing from "+context_str(context)+", "+
            "dispite foreignKey being True")

#   {IF}
# #/definitions/field-settings["dataType"]["dataType"]
#   {== "numberSequence"}
# #/definitions/field-settings["dataType"]["numberSequence"]
#   {EXISTS}

@validate.validator_for(each_field)
def numberSequence_exists_if_required(context):
    field = context["field"]

    if (
        field["settings"]["dataType"]["dataType"] == "numberSequence" and
        "numberSequence" not in field["settings"]["dataType"]
    ):
        raise exceptions.BadSpecificationError(
            "numberSequence missing from "+context_str(context)+", "+
            "dispite dataType being 'numberSequence'")

#   {IF}
# #/definitions/field-settings["dataType"]["dataType"]
#   {== "randomSequence"}
# #/definitions/field-settings["dataType"]["randomSequence"]
#   {EXISTS}

@validate.validator_for(each_field)
def randomNumber_exists_if_required(context):
    field = context["field"]

    if (
        field["settings"]["dataType"]["dataType"] == "randomNumber" and
        "randomNumber" not in field["settings"]["dataType"]
    ):
        raise exceptions.BadSpecificationError(
            "randomNumber missing from "+context_str(context)+", "+
            "dispite dataType being 'randomNumber'")

#   {IF}
# #/definitions/field-settings["dataType"]["numberSequence"]["sequenceType"]
#   {== "looping"}
# #/definitions/field-settings["dataType"]["numberSequence"]["loopingSequenceParams"]
#   {EXISTS}

@validate.validator_for(each_field)
def loopingSequenceParams_exists_if_required(context):
    field = context["field"]

    data_type_spec = field["settings"]["dataType"]
    if (
        data_type_spec["dataType"] == "numberSequence" and
        data_type_spec["numberSequence"]["sequenceType"] == "looping" and
        "loopingSequenceParams" not in data_type_spec["numberSequence"]
    ):
        raise exceptions.BadSpecificationError(
            "loopingSequenceParams missing from "+context_str(context)+", "+
            "dispite sequenceType being 'looping'")

# Logical Relations
# --------------------

# NOTE: Some of these depend on previous validators

#   {IF}
# #/definitions/field-settings["keySettings"]["foreignKey"]
#   {== True}
# #/definitions/field-settings["keySettings"]["foreignKeyParams"]["table"]
#   {EXISTS IN}
# #/definitions/table
#   {AND}
# #/definitions/field-settings["keySettings"]["foreignKeyParams"]["field"]
#   {EXISTS IN}
# #/definitions/field

def find(iterable, predicate):
    return next((item for item in iterable if predicate(item)), None)

@validate.validator_for(each_field)
def foreignKeyParams_references_exist(context):
    spec = context["generate-spec"]
    cur_field = context["field"]

    if cur_field["settings"]["keySettings"]["foreignKey"] is True:
        # Foreign Key Params
        fkp = cur_field["settings"]["keySettings"]["foreignKeyParams"]

        tables = spec["tables"]
        if (find(tables, lambda table: table["name"] == fkp["table"]) is None):
            raise exceptions.BadSpecificationError(
                "table '"+fkp["table"]+"' referenced by foreign key in "+
                context_str(context)+" does not exist")

        table = find(tables, lambda table: table["name"] == fkp["table"])
        fields = table["fields"]
        if (find(fields, lambda field: field["name"] == fkp["field"]) is None):
            raise exceptions.BadSpecificationError(
                "field '"+fkp["field"]+"' referenced by foreign key in "+
                context_str(context)+" does not exist")

# #/definitions/table
#   {COUNT WHERE}
# (
#   #/definitions/field-settings["keySettings"]["primaryKey"]
#     {== True}
# )
#   {== 1}

@validate.validator_for(each_table)
def one_primaryKey_per_table(context):
    table = context["table"]

    num_pkeys = 0
    for field in table["fields"]:
        if field["settings"]["keySettings"]["primaryKey"] is True:
            num_pkeys += 1
            if num_pkeys > 2:
                break # Short-circuit - validation has already failed

    if num_pkeys == 0:
        raise exceptions.BadSpecificationError(
            "no primaryKey defined in "+context_str(context)+" (one required)")
    elif num_pkeys > 1:
        raise exceptions.BadSpecificationError(
            "multiple primaryKeys defined in "+context_str(context)+" "+
            "(one required)")

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
                "start must be less than end in randomNumber parameters in "+
                context_str(context))

# Collection of All Validators
# --------------------

all = validate.group_validators(validate.collect(sys.modules[__name__]))
