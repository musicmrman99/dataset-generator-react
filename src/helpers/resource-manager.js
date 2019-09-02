import { fetchJSON } from './fetch-helpers';
import TreeCache from './tree-cache';

// This MUST be set to the correct domain
// --------------------------------------------------
const SERVER_PATH="http://localhost:5000";
// --------------------------------------------------

const RESOURCE_API_PATH = SERVER_PATH + "/resource-api/1.0.0";

// Resource Manager
// --------------------------------------------------

export default class ResourceManager {
    constructor () {
        // For nice memoization of APIs :)
        this.cache = new TreeCache();

        this.getResourceTypes = this.getResourceTypes.bind(this);
        this.getResourcePath = this.getResourcePath.bind(this);
    }

    /**
     * Get a list of all of the available resource types.
     * 
     * @returns {String} The fetched path
     */
    async getResourceTypes () {
        // Cache the Promise
        return this.cache.cache("/types",
            function () {
                // Return a Promise
                return fetchJSON(
                    "GET", [RESOURCE_API_PATH, "types"].join("/")
                )
            }
        );
    }

    /**
     * Get the path to the given resource from the server root.
     * 
     * @param {String} resourceType A string representing the resource type. Use
     * a type (property) given by getResourceTypes() to pass this value.
     * @param {String} resource A path to the desired resource.
     */
    async getResourcePath (resourceType, resource) {
        // Cache the Promise
        return this.cache.cache(["/resource", resourceType, resource].join("/"),
            function () {
                // Resource Path - the path to the API endpoint to fetch the
                // path to a resource
                const resourcesPath = [RESOURCE_API_PATH, "resource"]
                    .join('/');

                // Resource Args - the information required for the API to build
                // the path
                const resourceArgsObj = {
                    "resourceType": resourceType,
                    "resource": resource
                };
                const resourceArgs = Object.entries(resourceArgsObj).map(
                    (kvPair) => kvPair[0]+"="+encodeURIComponent(kvPair[1])
                ).join("&");
                
                // Return a Promise
                return fetchJSON(
                    "GET", resourcesPath + "?" + resourceArgs
                )
            }
        );
    }
}
