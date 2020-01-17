import { fetchFile } from '../helpers/fetch-helpers';
import { mapPaths } from '../helpers/map-path';
import { del, clone } from '../helpers/map-utils';

const _globalOperations = Object.freeze({
    // Private Pure Methods
    // ----------

    build_generate_request(output_format, tables) {
        // For immutability (ie. so as not to modify the 'full' representation of
        // the UI's data), the data structure will have to be cloned all the way
        // down to any modifications.
        const sendTables = clone(tables).map((table) => {
            const newTable = clone(table);
            newTable["fields"] = clone(newTable["fields"]).map((field) => {
                const newField = clone(field);

                const actionList = [];
                if (newField["settings"]["keySettings"]["foreignKey"] === false) {
                    actionList.push([
                        ["settings", clone],
                        ["keySettings", clone],
                        ["foreignKeyParams", del]
                    ]);
                }
                if (newField["settings"]["dataType"]["dataType"] !== "numberSequence") {
                    actionList.push([
                        ["settings", clone],
                        ["dataType", clone],
                        ["numberSequence", del]
                    ]);
                } else {
                    if (newField["settings"]["dataType"]["numberSequence"]["sequenceType"] !== "looping") {
                        actionList.push([
                            ["settings", clone],
                            ["dataType", clone],
                            ["numberSequence", clone],
                            ["loopingSequenceParams", del]
                        ]);
                    }
                }
                if (newField["settings"]["dataType"]["dataType"] !== "randomNumber") {
                    actionList.push([
                        ["settings", clone],
                        ["dataType", clone],
                        ["randomNumber", del]
                    ]);
                }

                mapPaths(newField, actionList);
                return newField;
            });
            return newTable;
        });

        return {
            "general": {"output-format": output_format},
            "tables": sendTables
        };
    }
})

const globalOperations = Object.freeze({
    // Public Non-Pure Methods
    // ----------

    getVersion() {
        return this.state.version;
    },

    generate() {
        fetchFile("POST", "/data-api/1.0.0/generate",
            { "Content-Type": "application/json" },
            // TODO: allow "single-table" output format (global object)
            JSON.stringify(_globalOperations.build_generate_request(
                "multi-table", this.state.tables
            )),
            // TODO: allow the user to enter the filename (global object)
            "tables.zip"
        );
    }
});

export default globalOperations;
