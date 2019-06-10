// A (very) small Either(<value>, <error>) class
export default class Value {
    constructor(value, error) {
        this.value = (error != null) ? undefined : value;
        this.error = (error == null) ? undefined : error;
    }
}
