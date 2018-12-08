export default class Repeater {
    constructor (fn, every) {
        this.start = this.start.bind(this);
        this.stop = this.stop.bind(this);

        this.fn = fn;
        this.every = every;
        this.timerID = null;
    }

    start () {
        this.timerID = setInterval(this.fn, this.every);
    }

    stop () {
        clearInterval(this.timerID);
    }
}
