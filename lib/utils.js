var request = require('request-prom'),
  _ = require('underscore'),
  agent = require('superagent');

var codeforces = 'http://codeforces.com/api/user.info?handles={handles}', //fetch the result {rating}
  topcoder = 'https://api.topcoder.com/v3/members/{handles}/stats/', // fetch the result {maxRating: {rating}}
  bestcoder = 'http://bestcoder.hdu.edu.cn/api/api.php?type=user-rating&user={handles}'; //fetching the rating at last object

var utils = {};

utils.fetchCodeforce = function (nickname) {
  if (!nickname) return Promise.resolve(0);

  var cfurl = codeforces.replace('{handles}', nickname);
  return request.get(cfurl).then(res => {
    var body = JSON.parse(res.body);
    return Promise.resolve(body.result && _.first(body.result).rating);
  }, err => {
    return Promise.reject(err);
  });
}

utils.fetchTopcoder = function (nickname) {
  if (!nickname) return Promise.resolve(0);
  var tcurl = topcoder.replace('{handles}', nickname);
  return request.get(tcurl).then(res => {
    var body = JSON.parse(res.body);
    return Promise.resolve(body.result && body.result.content && body.result.content.maxRating && body.result.content.maxRating.rating);
  }, err => {
    return Promise.reject(err);
  });
}

utils.fetchBestcoder = function (nickname) {
  if (!nickname) return Promise.resolve(0);
  
  var bcurl = bestcoder.replace('{handles}', nickname);
  console.log(bcurl);
  return request.get(bcurl).then(res => {
    var body = JSON.parse(res.body);
    console.log(body);
    return Promise.resolve(_.last(body).rating.valueOf());
  }, Promise.reject);
}

utils.getListOptions = function(req) {
  var options = {
    limit: parseInt(req.query._perPage) || 0
  };
  options.offset = Math.max((req.query._page || 1) - 1, 0) * options.limit;
  if (req.query._sortField && req.query._sortDir) {
    options.sort = {};
    options.sort[req.query._sortField.replace(/^id/, '_id')] = req.query._sortDir.toUpperCase() == 'ASC' ? 1 : -1;
  }
  // debug('get list options from request: %j', options);
  return options;
};

utils.listModel = function(model, filter, listOptions, cb) {
  model.count(filter, function(err, num) {
    if (err) {
      return cb(err);
    }
    model.find(filter)
      .skip(listOptions.offset)
      .limit(listOptions.limit)
      .sort(listOptions.sort)
      .exec(function(err2, items) {
        if (err2) {
          return cb(err2);
        }
        cb(null, items, num);
      });
  });
};

utils.queryize = function (params) {
  if (!params) return null
  return Object.keys(params).map(k => {
    return k + '=' + params[k];
  }).join('&');
}

utils.handleReject = function (msg) {
  console.log('Reject:', msg);
  return Promise.reject(msg);
}

utils.handleResolve = function() {
  console.log('Resolve!');
  return Promise.resolve();
}

utils.postRequest = function (uri, headers, form, cookie) {
  var promise = new Promise(function(resolve, reject) {
    agent.post(uri).set(headers).set('Cookie', cookie).type('form').send(form).redirects(0).end((err, res) => {
      if (err) reject(err);
      else resolve(res);
    });
  });

  return promise.then(resp => {
    return Promise.resolve(resp);
  }, err => {
    return Promise.resolve(err);
  })
}

module.exports = utils;