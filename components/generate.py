from components import generators

def generate_field(field_spec, loaded_generators):
    """
    Generate data for a given field, given a 'contextual' list of generators.

    If the given field_spec uses a generator that is already loaded, then use
    the pre-existing generator. If not, then initialise a generator and add it
    to the loaded_generators list.
    """

    # For convenience
    field_name = field_spec["name"]
    gen_settings = field_spec["settings"]["dataType"]
    data_type = gen_settings["dataType"]

    # Get the generator
    generator_constructor = generators.generators[data_type]

    # Re-use the created generator, or create a new one
    if field_name in loaded_generators:
        generator = loaded_generators[field_name]
    else:
        # If there are any parameters for this generator, provide them
        if data_type in gen_settings:
            generator = generator_constructor(**gen_settings[data_type])
        else:
            generator = generator_constructor()

        loaded_generators[field_name] = generator

    # Generate the next value in the generator's series
    return next(generator)

def generate_tables(tables_spec):
    """Generate data in tables based on tables_spec."""

    # Output in the format:
    # {
    #   "TableName": {
    #     "fields": [
    #       {
    #         "name": "field1",
    #         "primary_key": <True/False>,
    #         "foreign_key":
    #           <IF is_foreign_key>
    #             {
    #               "table": <str>,
    #               "field": <str>
    #             }
    #           <ELSE>
    #             None
    #           </IF>
    #       },
    #       <more 'field info' dicts ...>
    #     ],
    #     "data": [
    #       [value1, <more values ...>],
    #       <more rows ...>
    #     ]
    #   },
    #   <more tables ...>
    # }

    generated_tables = {}
    for table_spec in tables_spec:
        fields = []
        for field_spec in table_spec["fields"]:
            # Field Key Settings Spec
            fkss = field_spec["settings"]["keySettings"]

            fields.append({
                "name": field_spec["name"],
                "primary_key": fkss["primaryKey"],
                "foreign_key":
                    fkss["foreignKeyParams"] if fkss["foreignKey"] else None
            })

        loaded_generators = {} # Added to as-needed by generate_field()
        generated_tables.update({
            table_spec["name"]: {
                "fields": fields,
                "records": [[generate_field(field, loaded_generators)
                    for field in table_spec["fields"] ]
                    for _ in range(table_spec["settings"]["numRecords"]) ]
            }
        })

    return generated_tables
