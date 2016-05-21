'use strict'
var express = require('express'),
  router = express.Router(),
  request = require('request-prom'),
  _ = require('underscore'),
  Pros = require('../models/problem'),
  async = require('async'),
  Tag = require('../models/tag');

var utils = require('../lib/utils');

var problemset = {
  codeforces: 'http://codeforces.com/api/problemset.problems'
};

router.post('/codeforces', function(req, res, next) {
  console.log('start updating problems');
  request.get(problemset.codeforces).then(res => {
    var body = JSON.parse(res.body);
    var problems = body.result.problems;
    var solvedcounts = body.result.problemStatistics;

    async.each(problems, function(pro, callback) {
      // console.log(pro);
      var contestId = pro.contestId, 
        index = pro.index,
        title = pro.name,
        tags = pro.tags;
      // console.log(contestId, index, title, tags);
      var problemid = contestId.toString() + index;
      Pros.findOne({problemid: problemid}).then(p => {
        // if (p) callback(new Error('Finished updating'));
        if (p) {
          p.tags = tags;
          p.save().then(() => callback(), next);
        }
        else {
          Pros.create({
            onlinejudge: 'codeforces',
            problemid: problemid,
            title: title,
            tags: tags
          }).then(() => callback(), next);
        }
      }, next);
    }, function(err) {
      console.log('Finished updating with err :', err);
      res.json({message: 'success'});
    });

    async.each(solvedcounts, function(pro, callback) {
      console.log(pro);
      var contestId = pro.contestId,
        index = pro.index;
      var problemid = contestId.toString() + index;
      console.log(problemid);
      Pros.findOne({problemid: problemid}).then(p => {
        p.solvedcount = pro.solvedCount;
        console.log(p);
        p.save().then(() => callback(), callback);
      }, console.log);
    }, function() {
      console.log('Finished the solvedcount updating');
      res.send('Accepted');
    });
  }, next);
});

router.get('/hdu', function(req, res, next) {
  let filter = {
    onlinejudge: 'hdu'
  },
    lo = utils.getListOptions(req);

  utils.listModel(Pros, filter, lo, function(err, items, num) {
    res.set('X-Total-Count', num).json(_.pluck(items, 'output_detail'));
  });
});

router.get('/hdu/:id', function(req, res, next) {
  let filter = {
    _id: req.params.id
  };

  Pros.findOne(filter).then(item => {
    res.json(item.output_detail);
  });
});

module.exports = router;