export default function conditionalJoin (elements, joinStr) {
    return Object.entries(elements).reduce(
        (collector, kvpair) => {
            if (kvpair[1]) {
                collector.push(kvpair[0]);
            }
            return collector;
        },
        []
    ).join(joinStr);
}
