'use strict'
var request = require('request-prom'),
  Problem = require('../models/problem'),
  _ = require('underscore'),
  async = require('async'),
  moment = require('moment');

var utils = require('./utils');
var uris = {
  blog: 'http://codeforces.com/blog/entry/'
}

function fetchEditorial() {
  let max_blog_id = 40861,
    blogid = [],
    current = 1;

  while(current < max_blog_id) {
    blogid.push(max_blog_id);
    max_blog_id --;
  }
  // blogid.push(44622);
  console.log('start to fetch editoral');
  return blogid.reduce((chain, id) => {
    return chain.then(() => {
      return request.get(uris.blog + id).then(res => {
        console.log('got the response of id:', id, 'at', moment().format('YYYY-MM-DD HH:mm:ss'));
        let body = res.body,
          reg = /<p>Codeforces.Round.#\d{0,3}.Editorial<\/p>/g;
        console.log(body.match(reg));
        if (body.match(reg)) {
          console.log(uris.blog + id);
          body.match(/\d{1,3}[A-Z].\-./g).forEach(pid => {
            for(var i = 0; i < pid.length; i++) {
              if (isNaN(pid[i])) {
                console.log(pid.slice(0, i + 1));
                Problem.findOneAndUpdate({
                  onlinejudge: 'codeforces',
                  problemid: pid.slice(0, i + 1)
                }, {$set: {
                  solution: uris.blog + id
                }}, function(err, item) {
                  if (err) console.log(err);
                  else console.log(item);
                });
              }
            }
          });
          return Promise.resolve();
        } else {
          console.log('Not matched and return promise');
          return Promise.resolve();
        }
      }, console.log);
    }, console.log);
  }, Promise.resolve());
}

// fetchEditorial();

module.exports = {
  getEditorial: fetchEditorial
}