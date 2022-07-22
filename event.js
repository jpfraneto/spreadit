async function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  }).catch(function () {});
}

async function spreadComparer() {
  functions.fetchBudaForIndividualSpreadInfo();
}

async function main() {
  while (true) {
    const waitTimeMS = Math.floor(Math.random() * 10000);
    await sleep(waitTimeMS);
    eventEmitter.fire({ time: waitTimeMS });
  }
}

class EventEmitter {
  listeners = {};

  fire(event) {
    for (var k in this.listeners) {
      let listener = this.listeners[k];
      console.log('HTE AD', listener);
      this.unregister(k); // unregister this listener
      listener(event);
    }
  }

  register(id, listener) {
    this.listeners[id] = listener;
    console.log('Register', id);
  }

  unregister(id) {
    return delete this.listeners[id];
  }
}

module.exports = EventEmitter;
