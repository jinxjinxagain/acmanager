var express = require('express'),
  router = express.Router(),
  _ = require('underscore');

var utils = require('../lib/utils'),
  User = require('../models/user');

router.use(function(req, res, next) {
  if (!req.user) {
    return next(new Error('not authenticated'));
  } else {
    next();
  }
});

router.get('/', function(req, res, next) {
  var filter = {};

  var lo = utils.getListOptions(req);

  utils.listModel(User, filter, lo, function (err, items, num) {
    if (err) return next(err);
    else res.set('X-Total-Count', num).json(_.pluck(items, 'output'));
  });
});

router.get('/:id', function(req, res, next) {
  User.findOne({
    _id: req.params.id
  }).then(u => {
    res.json(u.output);
  }, next);
});

router.put('/:id', function(req, res, next) {
  User.findOne({
    _id: req.params.id
  }).then(u => {
    if (req.body.codeforces.nickname) u.codeforces.nickname = req.body.codeforces.nickname;
    if (req.body.topcoder.nickname) u.topcoder.nickname = req.body.topcoder.nickname;
    if (req.body.bestcoder.nickname) u.bestcoder.nickname = req.body.bestcoder.nickname;
    _.extend(u, _.pick(req.body, ['name', 'class']));
    console.log(u);
    u.save().then(item => {
      res.json(item);
    }, next);
  }, next);
});

module.exports = router;