var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  _ = require('underscore');

var problemSchema = new Schema({
  onlinejudge: {
    type: String,
    index: true
  },
  problemid: {
    type: String,
    index: true
  },
  title: String,
  solution: String,
  search_result: [String],
  tags: [String],
  solvedcount: Number
});

problemSchema.virtual('output').get(function() {
  return _.extend({
    id: this._id
  }, _.pick(this, 'onlinejudge', 'problemid', 'title', 'tags', 'solution', 'solvedcount'));
});

problemSchema.virtual('output_detail').get(function() {
  return _.extend({
    id: this._id
  }, _.pick(this, 'onlinejudge', 'problemid', 'title', 'tags', 'solution', 'solvedcount', 'search_result'));
});

module.exports = mongoose.model('problem', problemSchema);