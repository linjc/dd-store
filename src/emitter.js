export default class Emitter {

  _events = {};

  setStore(options, value) {
    if (typeof options === 'object') {
      for (let key in options) {
        this.setStore(key, options[key]);
      }
      return;
    }
    this[options] = value;
    this.emit(options + 'Change');
  }

  on(options, listener) {
    if (typeof options === 'string' && typeof listener !== 'undefined') {
      this.addListener(options, listener);
      return;
    }
    if (typeof options === 'object') {
      for (let key in options) {
        this.addListener(key, options[key]);
      }
      return;
    }
    console.error('参数不合法，请传入正式格式');
  }

  off(options, listener) {
    if (typeof options === 'string' && typeof listener !== 'undefined') {
      this.removeListener(options, listener);
      return;
    }
    if (typeof options === 'object') {
      for (let key in options) {
        this.removeListener(key, options[key]);
      }
      return;
    }
    console.error('参数不合法，请传入正式格式');
  }

  addListener(event, listener) {
    if (typeof listener !== 'function') {
      console.error('参数不合法，请传入函数格式')
      return;
    }

    event = event.toLowerCase();

    if (!this._events[event]) {
      this._events[event] = [];
    }

    this._events[event].push(listener);

    return this;
  }

  removeListener(event, listener) {
    if (typeof listener !== 'function') {
      console.error('参数不合法，请传入函数格式')
      return;
    }

    event = event.toLowerCase();

    let listeners = this._events[event];

    if (!listeners) {
      return this;
    }

    let i = listeners.length - 1;
    while (i >= 0) {
      if (listeners[i] === listener) {
        listeners.splice(i, 1);
        break;
      }
      i--;
    }

    if (listeners.length === 0) {
      delete this._events[event];
    }

    return this;
  }

  emit(event, ...args) {
    event = event.toLowerCase();

    let listeners = this._events[event];

    if (!listeners || !listeners.length) {
      return this;
    }

    listeners = listeners.slice(0);

    listeners.forEach(fn => fn.apply(this, args));

    return this;
  }
}
