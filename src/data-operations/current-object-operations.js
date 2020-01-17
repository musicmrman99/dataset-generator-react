import objectReferenceOperations from './object-reference-operations';

const currentObjectOperations = Object.freeze({
    // Public Non-Pure Methods
    // ----------

    // If someone uses this to edit the current object, then they'll get what
    // they deserve - a lot of problems. It's called ***GET*** for a reason! :)
    // (See 'setCurrentObject()' for a safe way)
    getCurrentObject() {
        return this.state.currentObject;
    },

    resolveCurrentObject() {
        return objectReferenceOperations.resolveObject.call(
            this, this.state.currentObject
        );
    },

    // You can also set the current object
    setCurrentObject(objectType, objectPath) {
        this.setState({
            currentObject: objectReferenceOperations.getObject.call(
                this, objectType, objectPath
            )
        });
    }
});

export default currentObjectOperations;
