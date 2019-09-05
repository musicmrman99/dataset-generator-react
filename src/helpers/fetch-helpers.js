// See: https://stackoverflow.com/questions/32545632/how-can-i-download-a-file-using-window-fetch
function _download(name, blob) {
    // Create a temporary URL to the blob and create and configure a temporary
    // anchor element to point to the new URL
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = name;

    // Simulate 'clicking' on the anchor
    document.body.appendChild(a); // Append to the DOM (required in firefox)
    a.click();
    a.remove(); // Remove the element again
    
    // Delete the temporary anchor (implicit out-of-scope) and URL (explicit)
    URL.revokeObjectURL(url)
}

/**
* Handler function that raises an Error for any error in the response of
* fetch(). Useful to use as the 'resolve' callback for the first .then() in the
* chain to convert 'soft' errors into exceptions.
* 
* @param {Response} response The response from the fetch() call.
* @returns {Response} The given response (or a new Promise containing the given
* response if used as a .then() callback).
*/
export function raiseFetchErrors (response) {
    if (!response.ok) {
        throw Error(
            "HTTP " + response.status + " Status:" +
            " (" + response.statusText + ")"
        );
    }
    return response;
}

/**
 * A simplification of the fetch() method, that only takes the four most
 * commonly-used parameters. Their order is given so as to read well, eg.
 *     defaultFetch("POST", "https://yourdomain.com/forward",
 *       {"Content-Type": "application/json"}, "{message: 'hello'}")
 *  -> "Post to yourdomain-dot-com, 'forward' (where the content-type I'm
 *      sending is JSON) the message 'hello'."
 * 
 * Always raises when a HTTP response is an error
 * 
 * All parameters are passed directly to fetch where they are given. If not
 * given (or null), parameters are either eliminated from the fetch call,
 * or, in the case of mandatory parameters, are given a sensible default.
 * These defaults are as follows:
 *   method: "GET"
 * 
 * @param {String} method Any HTTP method supported by fetch()
 * @param {String} path The URL to fetch from
 * @param {Object} headers An object containing HTTP headers in the format
 * supported by fetch()
 * @param {String} body The body of the request
 */
export function defaultFetch(method, path, headers, body) {
    const options = [
        method == null ? {method: "GET"} : {method: method},
        headers == null ? {} : {headers: headers},
        body == null ? {} : {body: body}
    ]

    return fetch(path, Object.assign({}, ...options))
        .then(raiseFetchErrors);
}

/**
 * Call defaultFetch(), automatically converting the response to JSON.
 * 
 * @param {String} method Any HTTP method supported by fetch()
 * @param {String} path The URL to fetch from
 * @param {Object} headers An object containing HTTP headers in the format
 * supported by fetch()
 * @param {String} body The body of the request
 */
export function fetchJSON(method, path, headers, body) {
    return defaultFetch(method, path, headers, body)
        .then((response) => response.json())
}

/**
 * Call defaultFetch(), automatically converting the response to a blob, and
 * downloading it as a file whose name is specified by `name`.
 * 
 * @param {String} method Any HTTP method supported by fetch()
 * @param {String} path The URL to fetch from
 * @param {Object} headers An object containing HTTP headers in the format
 * supported by fetch()
 * @param {String} body The body of the request
 * @param {String} name The name to give the file when downloading
 */
export function fetchFile(method, path, headers, body, name) {
    name = (name == null ? "download" : name); // Give name a default value
    defaultFetch(method, path, headers, body)
        .then((response) => response.blob())
        .then((blob) => _download(name, blob));
}

const fetchHelpers = {
    raiseFetchErrors: raiseFetchErrors,
    defaultFetch: defaultFetch,
    fetchJSON: fetchJSON,
    fetchFile: fetchFile
};
export default fetchHelpers;
