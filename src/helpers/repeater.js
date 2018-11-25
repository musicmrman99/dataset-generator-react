export default class Repeater {
    constructor (fn, every) {
        this.start = this.start.bind(this);
        this.stop = this.stop.bind(this);

        this.fn = fn;
        this.every = every;
        this.timerID = null;
    }

    // Garunteed to execute fn() at least once
    start () {
        this.timerID = setInterval(this.fn, this.every);
    }

    // FIXME: this is not firing
    stop () {
        clearInterval(this.timerID);
    }
}
