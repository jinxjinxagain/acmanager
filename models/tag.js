var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  _ = require('underscore');

var tagSchema = new Schema({
  keywords: {
    type: [String],
    index: true
  }, 
  name: {
    type: String,
    index: true
  }
});

tagSchema.virtual('output').get(function() {
  return {
    id: this._id,
    keywords: this.keywords,
    name: this.name
  }
});

module.exports = mongoose.model('tagSchema', tagSchema);