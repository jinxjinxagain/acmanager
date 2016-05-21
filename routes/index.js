var express = require('express');
var router = express.Router();
var passport = require('passport');
var User = require('../models/user');
var Problem = require('../models/problem');
var _ = require('underscore');

router.get('/', function(req, res) {
  res.render('index', {
    title: '武汉科技大学ACM俱乐部管理系统',
    user: req.user
  });
});

var returnUrl = '/';

router.get('/login', function(req, res) {
  returnUrl = req.query.return || '/';
  res.render('login');
});

router.post('/login', passport.authenticate('local', {
  failureRedirect: '/login',
  failureFlash: true
}), function(req, res) {
  if (req.user) {
    res.redirect(returnUrl);
  }
});

router.get('/register', function(req, res) {
  res.render('register', {});
});

router.post('/register', function(req, res) {
  User.register(new User({
    username: req.body.username,
    name: req.body.user,
    codeforces: {
      nickname: req.body.codeforces,
      rating: 0
    },
    topcoder: {
      nickname: req.body.topcoder,
      rating: 0
    },
    bestcoder: {
      nickname: req.body.bestcoder,
      rating: 0
    }
  }), req.body.password, function(err, user) {

    if (err) {
      return res.render('register', {
        user: user
      });
    }
    passport.authenticate('local')(req, res, function() {
      res.redirect('/');
    });
  });
});

router.get('/logout', function(req, res) {
  req.logout();
  res.redirect(req.query.return || './');
});

var auth = function(req, res, next) {
  if (!req.user) {
    console.log('redirect');
    res.redirect('/login?return=' + req.path);
  } else {
    next();
  }
}

router.get('/user', auth, function(req, res, next) {
  res.render('user');
});

router.get('/problem', auth, function(req, res, next) {
  var filter = {onlinejudge: 'codeforces'};
  if (req.query.oj) filter.onlinejudge = req.query.oj;
  if (req.query.tag) filter.tags = req.query.tag;
  console.log(filter);
  Problem.find(filter).then(problemset => {
    res.render('problem-list', {
      user: req.user,
      ojs: ['codeforces', 'hdu'],
      problemset: _.pluck(problemset, 'output'),
      oj: req.query.oj || ''
    });
  });
});


router.get('/problem/solution', auth, function(req, res, next) {
  var filter = {};
  if (req.query.onlinejudge && req.query.problemid) {
    filter.onlinejudge = req.query.onlinejudge;
    filter.problemid = req.query.problemid;
  } else {
    return next(new Error('onlinejudge and problemid must be assigned'));
  }

  Problem.findOne(filter).then(item => {
    if (item.onlinejudge == 'codeforces') {
      res.redirect(item.solution);
      return;
    }
    res.render('solution', {
      solution: item.solution || 'no solution yet'
    });
  }, next);
});

router.get('/contest', function(req, res, next) {
  res.render('contest', {
    user: req.user
  });
});

module.exports = router;