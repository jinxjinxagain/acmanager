'use strict'
var express = require('express'),
  router = express.Router(),
  _ = require('underscore'),
  moment = require('moment');


var Contest = require('../models/contest'),
  Problem = require('../models/problem');

router.post('/', function(req, res, next) {
  console.log('debug');
  if (!req.body.title || !req.body.date) {
    return next(new Error('title and date must be assigned'));
  }
  console.log('debug');
  var data = {},
    pbs = [];
  _.each(req.body, function(value, key) {
    if (/\d/.test(key)) {
      let problemid = req.body['id_' + key],
        onlinejudge = req.body[key];
      pbs.push({
        onlinejudge: onlinejudge,
        problemid: problemid
      });
    }
  });
  res.end();
  Promise.all(pbs.map(pb => {
    Problem.findOne({
      onlinejudge: pb.onlinejudge,
      problemid: pb.problemid
    });
  })).then(pb_array => {
    var ids = _.pluck(pb_array, '_id');
    console.log(ids);
    while(1);
    Contest.create({
      problems: ids,
      title: req.body.title,
      date: moment(req.body.date).format('YYYY-MM-DD')
    });
  });
});

router.get('/query', function(req, res, next) {
  var filter = _.pick(req.query, 'onlinejudge', 'problemid');
  console.log(filter);
  Problem.findOne(filter).then(item => {
    // console.log(item);
    if (item) {
      return Promise.resolve(item);
    } else {
      return Promise.resolve();
    }
  }, next).then(pro => {
    if (!pro) {
      res.json({
        status: 0,
        message: 'No such problem'
      });
      return;
    }
    Contest.find({
      problems: pro._id
    }).then(contest => {
      if (contest && contest.length !=0 ) {
        contest = contest.map(con => {
          return con.title + '(' + moment(con.date).format('YYYY-MM-DD') + ')';
        });
        res.json({
          status: 1,
          problem: pro.output,
          message: contest
        });
      } else {
        res.json({
          status: 2,
          problem: pro.output,
        })
      }
    });
  });
});

module.exports = router;