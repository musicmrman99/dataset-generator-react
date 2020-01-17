// These are single-level object utils
export const pass = (obj) => obj;
export const del = (obj) => undefined;
export const clone = (obj) => {
    if (Array.isArray(obj)) {
        return obj.slice();
    } else {
        return Object.assign({}, obj);
    }
}

export const insert = (insObj) => {
    return (obj) => (obj == null ? insObj : obj);
}
export const replace = (repObj) => {
    return (obj) => repObj;
};

export default {
    pass: pass,
    del: del,
    clone: clone,

    insert: insert,
    replace: replace
}
