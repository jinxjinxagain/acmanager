var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');
var _ = require('underscore');

var User = new Schema({
  role: String,
  name: String,
  class: String,
  codeforces: {
    nickname: String,
    rating: Number
  }, 
  topcoder: {
    nickname: String,
    rating: Number
  },
  bestcoder: {
    nickname: String,
    rating: Number
  }
});

User.plugin(passportLocalMongoose);

User.virtual('output').get(function() {
  return _.extend({
    id: this._id
  }, _.pick(this, ['username', 'name', 'class', 'codeforces', 'topcoder', 'bestcoder']));
});

User.plugin(require('./fetch-arena'));

module.exports = mongoose.model('User', User);
