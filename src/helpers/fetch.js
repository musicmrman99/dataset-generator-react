export default {
    /**
    * Handler function that raises an Error for any error in the response of
    * fetch(). Useful to use as the 'resolve' callback for the first .then() in the
    * chain to convert 'soft' errors into exceptions.
    * 
    * @param {Response} response The response from the fetch() call.
    * @returns {Response} The given response (or a new Promise containing the given
    * response if used as a .then() callback).
    */
    raiseFetchErrors (response) {
        if (!response.ok) {
            throw Error(
                "HTTP " + response.status + " Status:" +
                " (" + response.statusText + ")"
            );
        }
        return response;
    }
}
