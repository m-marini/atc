import _ from 'lodash';

class Reader {

  constructor(queue = []) {
    this.queue = queue;
    _.bindAll(this);
  }

  get src() {
    return this.queue.length > 0 ? this.queue[0] : undefined;
  }

  say(sources) {
    return new Reader(_.concat(this.queue, sources));
  }

  next() {
    return new Reader(_.drop(this.queue, 1));
  }

  clear() {
    return new Reader();
  }

  get empty() { return this.queue.length === 0; }
}

export default Reader;
