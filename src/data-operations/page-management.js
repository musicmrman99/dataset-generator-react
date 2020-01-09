// This is the part of the page management system that only the top-level App
// will interface with. See globalOperations for the parts of the page
// management system accessible to sub-components.
const pageManagement = Object.freeze({
    // Public Non-Pure Methods
    // ----------

    // Based on https://stackoverflow.com/a/7317311
    unloadHandler(shouldUnload, event) {
        const result = shouldUnload();
        if (result) {
            // Just implement every single possible method of doing this
            event.preventDefault(); // The new one - recommended by the standard
            (event || window.event).returnValue = result; // A bit older
            return result; // Very old
        }
    },

    shouldPageUnload() {
        return this.state.isUnsaved ? "do-not-unload" : undefined;
    }
});

export default pageManagement;
