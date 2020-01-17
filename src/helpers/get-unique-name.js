/**
 * Check if name already exists in the given set of names. If it does not,
 * return name. If it does, then return name suffixed with an incrementing
 * number to ensure it is unique.
 * @param {String} name The name to check.
 * @param {Array} set The set of items that the returned name must be unique
 * within.
 * @returns {String} A unique name, within the scope of the given set.
 */
export default function getUniqueName (fullName, set) {
    // 1. Split the given name into a (name, index) pair.
    const nameMatch = fullName.match(/^(.*?)([0-9]*)$/);
    const [name, nameIndex] = [nameMatch[1], parseInt(nameMatch[2]) || 0];

    // 2. Construct an array: [(name, index), ...], such that each
    //    name === the 'name' part of the given name's pair.
    const setNameIndexes = set.map((setFullName) => {
        const setNameMatch = setFullName.match(/^(.*?)([0-9]*)$/);
        const [setName, setNameIndex] = [setNameMatch[1], parseInt(setNameMatch[2]) || 0];

        // If it matches, return the index. If the index is "", use 0.
        if (setName === name) return parseInt(setNameIndex) || 0;
        else return null; // If no match, return null
    }).filter(
        (setNameIndex) => setNameIndex != null // Filter out the nulls
    )

    // RETURN: If this table name would be unique without further
    // processing, then return it.
    if (
        setNameIndexes.length === 0 ||
        !(setNameIndexes.includes(nameIndex))
    ) return fullName;

    // --------------------

    // 3. Find the lowest unused index from the resulting array.
    // Source: https://stackoverflow.com/a/30672958
    setNameIndexes.sort((a,b) => a-b) // Sort numerically
    var suffixIndex = -1;
    for (var i = 0; i < setNameIndexes.length; ++i) {
        if (setNameIndexes[i] !== i) {
            suffixIndex = i;
            break;
        }
    }
    if (suffixIndex === -1) {
        suffixIndex = setNameIndexes[setNameIndexes.length - 1] + 1;
    }

    // 4. If the index comes out as 0, then remove it completely
    if (suffixIndex === 0) {
        suffixIndex = "";
    }

    // RETURN: Concatenate and return the (now unique) full name.
    return name + suffixIndex;
}
