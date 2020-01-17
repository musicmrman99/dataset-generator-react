import { ObjectSettingsDefs } from '../../types';

const objectHelpers = Object.freeze({
    // Public Pure Methods
    // ----------

    // Helpers for single objects

    createObject(type, spec) {
        return Object.assign(
            // Defaults
            {
                name: "",
                settings: JSON.parse(JSON.stringify(ObjectSettingsDefs[type].defaults))
            },
            // Overwrite with caller's object
            spec
        );
    },

    getObjectIndex(objects, name) {
        return objects.findIndex((object) => (object.name === name));
    },
    getObject(objects, name) {
        return objects.find((object) => (object.name === name));
    },

    // Helpers for multiple objects

    getNamesOf(objects) {
        return objects.map((obj) => obj.name);
    },

    // Named mapPath() Utilities
    // ----------

    afterLastIndex: (objects) => objects.length,
    indexOfObject(name) {
        return (objects) => objectHelpers.getObjectIndex(objects, name);
    }
});

export default objectHelpers;
