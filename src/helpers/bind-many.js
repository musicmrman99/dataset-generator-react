export function bindMethods(thisParam, methods) {
    return Object.keys(methods).reduce((boundMethods, name) => {
        boundMethods[name] = methods[name].bind(thisParam)
        return boundMethods;
    }, {});
}

export function bindAllMethods(thisParam, ...methodCollections) {
    return methodCollections.reduce((finalMethods, methods) => {
        var boundMethods = bindMethods(thisParam, methods);
        return Object.assign(finalMethods, boundMethods);
    }, {});
}

export default Object.freeze({
    bindMethods: bindMethods,
    bindAllMethods: bindAllMethods
});
