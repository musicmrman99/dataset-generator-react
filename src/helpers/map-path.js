// path should be an array of [key, fn] pairs, where:
// - key is the key of the object (or index of the array) at each location down
//   the path of the data structure.
// - fn is a function that must return a new value for the key. If fn returns
//   undefined, the key is 'un-defined', ie. deleted.
//
// For example,
//   mapPath(obj, [
//     ["hello", first_mapper], [5, second_mapper], ["world", third_mapper]
//   ])
// would map:
// - obj["hello"] = first_mapper(obj["hello"])
// - obj["hello"][5] = second_mapper(obj["hello"][5])
// - obj["hello"][5]["world"] = third_mapper(obj["hello"][5]["world"])
//
// NOTE: Using this function requires knowledge of the structure of the data.
// WARNING: This function maps obj IN PLACE. It does NOT map obj itself.
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
        const thisPath = pathRef+"/"+key;

        // Do not map items in exclude. This is often used to exclude mapping
        // items that have already been mapped (see mapPaths()).
        if (!exclude.includes(thisPath)) {
            // If the key doesn't exist, then return early. Keys whose values
            // are 'undefined' should also return early.
            if (objRef[key] === undefined) break;

            // Do the mapping and update the objRef
            const newVal = fn(objRef[key])
            if (newVal !== undefined) {
                objRef[key] = newVal;
            } else {
                delete objRef[key];
                // If the key *stops* existing (due to the mapping function),
                // then also return early.
                break;
            }
            objRef = objRef[key];

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

// Common callbacks to mapPath()
export const pass = (obj) => obj;
export const del = (obj) => undefined;
export const clone = (obj) => {
    if (Array.isArray(obj)) {
        return obj.slice();
    } else {
        return Object.assign({}, obj);
    }
}

// All Names
// --------------------

export default {
    mapPath: mapPath,
    mapPaths: mapPaths,

    pass: pass,
    del: del,
    clone: clone
}
