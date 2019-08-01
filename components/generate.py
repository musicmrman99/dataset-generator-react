import io
import zipfile
from contextlib import contextmanager
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
    # If the generator is in the schema's enum, but not defined in the generator
    # module - that would be an 'internal server error'! So don't catch it.
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

@contextmanager
def toCSV(table_spec, with_names=True):
    """
    Convert the given table_spec into CSV format, returning a file-like object
    containing the CSV data.
    """

    table_str = ""
    if with_names:
        table_str += ",".join([field["name"] for field in table_spec["fields"]])
        table_str += "\n"

    table_str += "\n".join([
        ",".join(str(item) for item in record)
        for record in table_spec["records"]
    ])

    buffer = io.StringIO(table_str)
    yield buffer
    buffer.close()

# See:
# - https://stackoverflow.com/questions/28568687/download-multiple-csvs-using-flask/41374226
# - https://stackoverflow.com/questions/2463770/python-in-memory-zip-library
@contextmanager
def toMultiCSV(multi_table_spec, with_names=True):
    """
    Convert the given multi_table_spec into zero or more CSV-formated files
    contained in a zip archive, returning a file-like object representing the
    zip file.
    """

    # WARNING: For the time being, use an in-memory zip file. This may lead to
    # OUT OF MEMORY conditions!!! But it will be a fair bit faster ...
    csv_zip_buffer = io.BytesIO()
    csv_zip_file = zipfile.ZipFile(csv_zip_buffer, 'w', zipfile.ZIP_DEFLATED)

    try:
        for (table_name, table) in multi_table_spec.items():
            with toCSV(table) as csv:
                csv_zip_file.writestr(table_name+".csv", csv.getvalue())

    except zipfile.LargeZipFile:
        # TODO/FIXME: WHAT SHOULD THIS RAISE? (look through Werkzeug's list of
        # exceptions)
        raise # For now, just re-raise

    csv_zip_file.close() # Close the zip file to write final metadata

    csv_zip_buffer.seek(0) # Reset the 'current position' ready for reading
    yield csv_zip_buffer
    csv_zip_buffer.close()
