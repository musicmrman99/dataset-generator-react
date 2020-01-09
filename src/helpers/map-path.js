// Description
// --------------------
//
// path should be an array of [key, fn] pairs, where, at each location down the
// path of the data structure:
//
// - key is either:
//   - An object to index the current element in the path with (usually string
//     or integer). This results in the key of the next element in the path
//     directly.
//   - A function that, given the current element, returns the key of the next
//     element in the path. This can be used to map a much more dynamic path.
//
// - fn is a function that must return a new value for the key. If fn returns
//   undefined, the key is 'un-defined', ie. deleted, and the function returns
//   immediately (ie. any subsequent elements in the path are ignored).
//
// Examples
// --------------------
//
// Basic usage
// ----------
//
// mapPath(obj, [
//   ["hello", first_mapper], [5, second_mapper], ["world", third_mapper]
// ])
//
// Would map:
// - obj["hello"] = first_mapper(obj["hello"])
// - obj["hello"][5] = second_mapper(obj["hello"][5])
// - obj["hello"][5]["world"] = third_mapper(obj["hello"][5]["world"])
//
// Function-as-key usage
// ----------
//
// mapPath(obj, [
//   ["hello", mapper1],
//   [
//     (set) => set.find((item) => item.someProperty === 5),
//     mapper2
//   ],
//   ["world", mapper3]
// ])
//
// Would map (where "7thProp" is the first key found in obj["hello"] where
// item.someProperty === 5):
// - obj["hello"] = mapper1(obj["hello"])
// - obj["hello"]["7thProp"] = mapper2(obj["hello"]["7thProp"])
// - obj["hello"]["7thProp"]["world"] = mapper3(obj["hello"]["7thProp"]["world"])
//
// Notes
// --------------------
//
// - Using this function requires knowledge of the structure of the data.
// - This function does NOT map obj itself.
// - This function maps obj IN PLACE. Use a 'clone' mapper if needed.
export function mapPath(obj, path, exclude) {
    if (exclude == null) exclude = [];

    // Keep a list of paths mapped on this call. This can be used by the caller
    // to know which paths do not need to be mapped again (by adding them to
    // exclude).
    const pathsMapped = [];

    // Start the objRef and pathRef at the 'root' of obj
    var pathRef = ""
    var objRef = obj;

    // Then 'dig' down for each item in path
    for (const [key, fn] of path) {
        // Use key (if not a function), or use the return value of key (if a
        // function).
        var finalKey = key;
        if (typeof key === "function") {
            finalKey = key(objRef);
        }

        // Keep track of current path
        const thisPath = pathRef+"/"+finalKey;

        // Do not map items in exclude. This is often used to exclude mapping
        // items that have already been mapped (see mapPaths()).
        if (!exclude.includes(thisPath)) {
            // Don't check whether the finalKey exists yet ...

            // Do the mapping and update the objRef
            const newVal = fn(objRef[finalKey])
            if (newVal !== undefined) {
                objRef[finalKey] = newVal;
            } else {
                if (Array.isArray(objRef) && typeof finalKey === "number") {
                    objRef.splice(finalKey, 1);
                } else {
                    delete objRef[finalKey];
                }

                // If the finalKey didn't exist and still doesn't exist, or if
                // finalKey stopped existing due to the mapping function, then
                // return early.
                break;
            }
            objRef = objRef[finalKey];

            // Only update the mapped paths list if it doesn't already contain
            // this path (there's no reason to add duplicate entries)
            pathsMapped.push(thisPath);
        }

        // Always update the pathRef
        pathRef = thisPath;
    }

    // Don't need to return obj, as it was not mapped
    return pathsMapped;
}

// Utilities
// --------------------

// Repeatedly (and efficiently) calls mapPath() "for path of paths".
// See mapPath() for details.
export function mapPaths(obj, paths) {
    let pathsMapped = [];
    for (const path of paths) {
        pathsMapped.push(mapPath(obj, path, pathsMapped));
    }
    return pathsMapped;
}

// All Names
// --------------------

export default {
    mapPath: mapPath,
    mapPaths: mapPaths
}
