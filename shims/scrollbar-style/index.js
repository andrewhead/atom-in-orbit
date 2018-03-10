/** @babel */
const Emitter = require('event-kit').Emitter;

const emitter = new Emitter();

module.exports = {
  getPreferredScrollbarStyle: function() {
    // 'overlay' seems more appropriate than 'legacy'.
    return 'overlay';
  },

  onDidChangePreferredScrollbarStyle: function(callback) {
    return emitter.on('did-change-preferred-scrollbar-style', callback);
  },

  observePreferredScrollbarStyle: function(callback) {
    callback(this.getPreferredScrollbarStyle());
    return this.onDidChangePreferredScrollbarStyle(callback);
  },
};
