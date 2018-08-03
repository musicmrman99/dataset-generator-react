import pathHelpers from './path';

/**
 * Represents a cache in a tree-like structure. Allows the use of plain paths
 * (strings) instead of repeated property access and handles non-existent
 * entries.
 * 
 * This is useful to memoize functions in a tree-like structure (such as in the
 * case of a large or hierarchical input space).
 */
export default class TreeCache {
    /**
     * Initialise the cache with a blank object, or init, if given.
     * 
     * @param {Object} init An optional initialisation object for the tree cache.
     */
    constructor (init) {
        if (init != null) {
            this.cache_ = init;
        } else {
            this.cache_ = {};
        }
    }

    /**
     * Return the cached value at the given location, if it exists. If it
     * doesn't, call the given callback and cache and return its return value at
     * the given location.
     * 
     * @param {String} path The location in the cache to cache to.
     * @param {Function} callback The callback to call to get the value to store
     * at the given location.
     * @param {*} args Arguments to pass to the callback.
     * @returns {*} The cached value at the given location, or the return value
     * of the callback if there was no cached value.
     */
    cache (path, callback) {
        const splitPath = pathHelpers.split_path(path);

        var curNode = this.cache_;
        var nextNode;
        for (var i=0; i < splitPath.length; i++) {
            nextNode = splitPath[i]

            // If the node doesn't already exist
            if (!(nextNode in curNode)) {
                // If this is the last component of the path
                if (i === splitPath.length-1) {
                    // Call the callback and cache its value
                    curNode[nextNode] = callback();
                } else {
                    // Create an empty object (namespace) at this node
                    curNode[nextNode] = {};
                }
            }

            // It definitely exists now
            curNode = curNode[nextNode];
        }

        return curNode;
    }
}
