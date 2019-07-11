import jsonschema

# Format Key-Value pair
def fkv(key, val):
    return key+": \""+val+"\""

def formatDict(dict_, order):
    return "{"+[fkv(key, dict_[key]) for key in order].join(", ")+"}"

class AdditionalValidationError(ValueError):
    pass

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
          exist at location B **IF** the value of X is Y'. Note the 'IF'.
          -----
          NOTE 1: This is as oppose to a static requirement, such as 'the value
          of X should be of type Y', which can (and should) be validated using
          jsonschema.
          NOTE 2: As an exception to the above rule, static requirements should
          be validated using this function if the static requirement is being
          validated **after** a logical requirement.
          NOTE 3: valid_fns are executed in the order they are given.
          -----
          valid_fns should raise an exception if they fail validation.
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
        Raise AdditionalValidationError if validation fails.
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
            cls.foreignKeyParams_matches_schema_if_exists,
            cls.numberSequence_exists_if_required,
            cls.numberSequence_matches_schema_if_exists,
            cls.randomNumber_exists_if_required,
            cls.randomNumber_matches_schema_if_exists,
            cls.loopingSequenceParams_exists_if_required,
            cls.loopingSequenceParams_matches_schema_if_exists)

    # #/definitions/field-settings["keySettings"]["foreignKeyParams"]
    #   {REQUIRED IF}
    # #/definitions/field-settings["keySettings"]["foreignKey"]
    #   == True

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
            raise AdditionalValidationError(
                "foreignKeyParams missing from "+context_str+", "+
                "dispite foreignKey being True")

    @classmethod
    def foreignKeyParams_matches_schema_if_exists(cls, context):
        field = context["field"]

        # jsonschema will raise an exception for us if validation fails
        data = field["settings"]["keySettings"]["foreignKeyParams"]
        data_schema = cls.generate_schema.subschema("foreignKeyParams")
        data_schema.validate(data)

    # #/definitions/field-settings["dataType"]["numberSequence"]
    #   {REQUIRED IF}
    # #/definitions/field-settings["dataType"]["dataType"]
    #   == "numberSequence"

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
            raise AdditionalValidationError(
                "numberSequence missing from "+context_str+", "+
                "dispite dataType being 'numberSequence'")

    @classmethod
    def numberSequence_matches_schema_if_exists(cls, context):
        field = context["field"]

        # jsonschema will raise an exception for us if validation fails
        data = field["settings"]["dataType"]["numberSequence"]
        data_schema = cls.generate_schema.subschema(
            "numberSequence", ["loopingSequenceParams"])
        data_schema.validate(data)

    # #/definitions/field-settings["dataType"]["randomSequence"]
    #   {REQUIRED IF}
    # #/definitions/field-settings["dataType"]["dataType"]
    #   == "randomSequence"

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
            raise AdditionalValidationError(
                "randomNumber missing from "+context_str+", "+
                "dispite dataType being 'randomNumber'")

    @classmethod
    def randomNumber_matches_schema_if_exists(cls, context):
        field = context["field"]

        # jsonschema will raise an exception for us if validation fails
        data = field["settings"]["dataType"]["randomNumber"]
        data_schema = cls.generate_schema.subschema("randomNumber")
        data_schema.validate(data)

    # #/definitions/field-settings["dataType"]["numberSequence"]["loopingSequenceParams"]
    #   {REQUIRED IF}
    # #/definitions/field-settings["dataType"]["numberSequence"]["sequenceType"]
    #   == "looping"

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
            raise AdditionalValidationError(
                "loopingSequenceParams missing from "+context_str+", "+
                "dispite sequenceType being 'looping'")

    @classmethod
    def loopingSequenceParams_matches_schema_if_exists(cls, context):
        field = context["field"]

        # jsonschema will raise an exception for us if validation fails
        data_type_spec = field["settings"]["dataType"]
        data = data_type_spec["numberSequence"]["loopingSequenceParams"]
        data_schema = cls.generate_schema.subschema("loopingSequenceParams")
        data_schema.validate(data)
