var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  moment = require('moment');

var contestSchema = new Schema({
  date: Date,
  problems: {
    type: [String],
    default: []
  },
  title: {
    type: String,
    index: true,
    default: ''
  }
});

contestSchema.virtual('output').get(function() {
  return {
    id: this._id,
    date: moment(this.date).format('YYYY-MM-DD'),
    title: this.title
  };
});

module.exports = mongoose.model('contest', contestSchema);