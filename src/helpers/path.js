/*
An enum indicating how to interpret the leading and/or trailing slash in a
path.

The values represent the following:
BOTH
    Strip both leading and trailing slashes (if present) before splitting. This
    is what you would want for most paths.
    NOTE: The first and last items in the path can't be the empty string.
    Eg. "/path/to/item/" -> ["path", "to", "item"]

LEADING
    Strip the leading slash (if present) before splitting. This is what you
    would want for paths that *can't* point to a 'directory'.
    NOTE: The first item in the path can't be the empty string.
    Eg. "/path/to/item/" -> ["path", "to", "item", ""]

TRAILING
    Strip the trailing slash (if present) before splitting. This is like BOTH,
    but for paths you *know* are relative.
    NOTE: The last item in the path can't be the empty string.
    Eg. "/path/to/item/" -> ["", "path", "to", "item"]

NEITHER
    Don't strip leading or trailing slashes before splitting. This is best used
    with paths you *know* are relative, or with plain '/'-delimited items.
    Eg. "/path/to/item/" -> ["", "path", "to", "item", ""]
*/
export const Slashes = Object.freeze({
    BOTH: "both",
    LEADING: "leading",
    TRAILING: "trailing",
    NEITHER: "neither"
});

export default {
    /**
     * Return a split array of path components for the given path, which optionally
     * includes leading and trailing slashes.
     * 
     * @param {String} path A path.
     * @param {Boolean} slashes A string indicating how the path should be split.
     * See the Slashes enum docs for info (also exported). The default is BOTH.
     * @returns {Array<String>} An array of path components.
     */
    split_path (path, slashes) {
        if (slashes == null) slashes = Slashes.BOTH;

        // remove initial and trailing slash, if specified and present
        if ((
            slashes === Slashes.BOTH ||
            slashes === Slashes.LEADING
        ) && "/" === path[0]) {
            path = path.replace("/", "");
        }

        if ((
            slashes === Slashes.BOTH ||
            slashes === Slashes.TRAILING
        ) && "/" === path[path.length-1]) {
            path = path.replace(/\/$/, "");
        }

        // Replace any double-slashes with a single slash
        path = path.replace(/\/\//g, "/")

        return path.split("/");
    }
}
