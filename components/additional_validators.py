import jsonschema
from components import exceptions

# Format Key-Value pair
def fkv(key, val):
    return key+": \""+val+"\""

def formatDict(dict_, order):
    return "{"+[fkv(key, dict_[key]) for key in order].join(", ")+"}"

# ... I was spoiled by JS ...
class AdditionalValidators:
    @classmethod
    def _validate(cls, context_fn, *valid_fns):
        """
        Validate each object provided by context_fn from generate_spec against
        each valid_fn (validation function) provided.

        Args:
          context_fn is a function that performs any iteration or value
          collection to create a 'context' dictionary to be passed to each of
          valid_fns.

          All remaining arguments are valid_fns - functions that validate the
          context by checking for some logical requirement, such as 'key A must
          exist at location B **IF** the value of X is Y'. This is as oppose to
          a static requirement, such as 'the value of X should be of type Y',
          which can (and should) be validated using JSON Schema. There are two
          exceptions to this rule:

          1. Validating a static requirement after a logical requirement (such
             as conditional dependencies).
          2. Validating complex static requirements that cannot reasonably be
             expressed using JSON Schema.

          Validation functions raise an exception if they fail validation.
          Validation functions MUST be pure functions - they MUST NOT modify any
          objects they are passed.
        """

        if len(valid_fns) == 0: return

        for context in context_fn():
            for valid_fn in valid_fns:
                valid_fn(context)

    @classmethod
    def validate_all(cls, generate_spec, generate_schema):
        """
        Execute all validation functions against generate_spec.

        - generate_spec is a dict representing the root of a parsed JSON tree.
        - generate_schema is a schemas.Schema object holding the root of the
          JSON schema for the generate_spec JSON tree.
        """

        # Primarily used to validate against 
        cls.generate_schema = generate_schema

        # Call every validation method in this class (except 'validate_all'),
        # passing in generate_spec.
        validators = [method
            for method in dir(cls)
            if method[:9] == "validate_" and method != "validate_all"]

        for validator in validators:
            getattr(cls, validator)(generate_spec)

    @classmethod
    def validate_field_settings_optional_components(cls, generate_spec):
        """
        Raise BadSpecificationError if validation fails.
        """

        def for_each_field():
            for table in generate_spec["tables"]:
                for field in table["fields"]:
                    yield {
                        "table": table,
                        "field": field
                    }

        cls._validate(for_each_field,
            cls.foreignKeyParams_exists_if_required,
            cls.numberSequence_exists_if_required,
            cls.randomNumber_exists_if_required,
            cls.loopingSequenceParams_exists_if_required)

    # Conditional Dependencies
    # --------------------------------------------------

    #   {IF}
    # #/definitions/field-settings["keySettings"]["foreignKey"]
    #   {== True}
    # #/definitions/field-settings["keySettings"]["foreignKeyParams"]
    #   {IS REQUIRED}

    @classmethod
    def foreignKeyParams_exists_if_required(cls, context):
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

    @classmethod
    def numberSequence_exists_if_required(cls, context):
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

    @classmethod
    def randomNumber_exists_if_required(cls, context):
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

    @classmethod
    def loopingSequenceParams_exists_if_required(cls, context):
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
    # --------------------------------------------------

    # NOTE: Some of these depend on previous validators

    #   {IF}
    # #/definitions/fieldSettings["dataType"]["dataType"]
    #   {== "randomNumber"}
    # #/definitions/randomNumber["start"]
    #   {<=}
    # #/definitions/randomNumber["end"]

    @classmethod
    def randomNumber_start_le_end(cls, context):
        field = context["field"]

        # Otherwise, this validation step is not applicable
        if (field["settings"]["dataType"]["dataType"] == "randomNumber"):
            randomNumber_spec = field["settings"]["dataType"]["randomNumber"]
            if (randomNumber_spec["start"] > randomNumber_spec["end"]):
                raise exceptions.BadSpecificationError(
                    "randomNumber.start must be less than randomNumber.end")
