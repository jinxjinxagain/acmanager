var express = require('express'),
  router = express.Router(),
  utils = require('../lib/utils'),
  _ = require('underscore'),
  async = require('async');

var Tag = require('../models/tag'),
  Problem = require('../models/problem');

router.get('/', function(req, res, next) {
  var lo = utils.getListOptions(req),
    filter = {};
  utils.listModel(Tag, filter, lo, function(err, items, num) {
    if (err) return next(err);
    else res.set('X-Total-Count', num).json(_.pluck(items, 'output'));
  });
});

router.get('/:id', function(req, res, next) {
  Tag.findOne({
    _id: req.params.id
  }).then(item => {
    res.json(item.output);
  });
});

router.put('/:id', function(req, res, next) {
  var data = req.body;
  console.log(data);
  Tag.findOneAndUpdate({
    _id: req.params.id
  }, {$set: 
    _.pick(data, 'keywords')
  }).then(item => {
    res.json(item.output);
  }, next);
});

module.exports = router;