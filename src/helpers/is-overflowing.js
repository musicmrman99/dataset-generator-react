// Determines if the passed element is overflowing its bounds.
// Returns [horizOverflowing, vertOverflowing] two-array of booleans.
// Will temporarily modify the "overflow" style to detect this if necessary.
// From: https://stackoverflow.com/q/143815

export function isOverflowing (elem) {
    return [
        elem.scrollWidth > elem.clientWidth,
        elem.scrollHeight > elem.clientHeight
    ];
}

export function isVisibleOverflowing (elem) {
    const curOverflow = elem.style.overflow;

    if (!curOverflow || curOverflow === "visible")
        elem.style.overflow = "hidden";
    const isOverflowing = isOverflowing(elem);
    elem.style.overflow = curOverflow;

    return isOverflowing;
}
