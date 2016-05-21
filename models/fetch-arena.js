var utils = require('../lib/utils');

module.exports = exports = function (schema, options) {
  var fetchArena = function(next) {
    var self = this;

    return utils.fetchCodeforce(self.codeforces.nickname).then(rating => {
      self.codeforces.rating = rating;
      return utils.fetchTopcoder(self.topcoder.nickname);
    }).then(rating => {
      self.topcoder.rating = rating;
      return utils.fetchBestcoder(self.bestcoder.nickname);
    }).then(rating => {
      self.bestcoder.rating = rating;
      next();
    });
  }
  schema.pre('save', fetchArena);
  schema.pre('update', fetchArena);
}