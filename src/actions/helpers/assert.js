export default Object.freeze({
    // Ensure the table exists (this should never fail, but you never know)
    tableExists (tables, tableName) {
        const tableExists = Boolean(tables.find((checkTable) => checkTable.name === tableName) != undefined);
        if (!tableExists) {
            throw Error("No such table '"+tableName+"'");
        }
    },

    // Ensure the given field in the given table exists (this should never fail, but you never know)
    fieldExists (tables, tableName, fieldName) {
        const table = tables.find((table) => table.name === tableName);
        const fieldExists = Boolean(table.fields.find((checkField) => checkField.name === fieldName) != undefined);
        if (!fieldExists) {
            throw Error("No such field '"+fieldName+"'");
        }
    }
});
