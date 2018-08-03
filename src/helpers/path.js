export default {
    /**
     * Return a split array of path components for the given path, which optionally
     * includes leading and trailing slashes.
     * 
     * @param {String} path A path.
     * @returns {Array<String>} An array of path components.
     */
    split_path (path) {
        // remove initial and trailing slash, if it has either
        if ("/" === path[0]) {
            path = path.replace("/", "");
        }
        if ("/" === path[path.length-1]) {
            path = path.replace(/\/$/, "");
        }

        // Replace any double-slashes with a single slash
        path = path.replace(/\/\//g, "/")

        return path.split("/");
    }
}
