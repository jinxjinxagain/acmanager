'use strict'

var express = require('express'),
  request = require('request-prom'),
  agent = require('superagent'),
  cheerio = require('cheerio'),
  router = express.Router(),
  _ = require('underscore'),
  async = require('async');

var hdu = require('../lib/hdu-spider'),
  cf = require('../lib/codeforces-spider');

function fetchHrefs(oj, problemid) {
  console.log('http://www.baidu.com/s?wd=' + oj + problemid);
  return request.get('http://www.baidu.com/s?wd=' + oj + problemid).then(rep => {
    var body = rep.body,
      $ = cheerio.load(body);
      

    var hrefs = [];
    $('h3 a').each(function() {
      var href = $(this).attr('href');
      var val = $(this).text();
      
      if (val.toUpperCase().indexOf('hdu'.toUpperCase()) != -1 && val.indexOf(problemid.toString()) != -1) {
        hrefs.push(href);
      }
    });

    return Promise.resolve(hrefs);
  });
}

function queryize (params) {
  if (!params) return null
  return Object.keys(params).map(k => {
    return k + '=' + params[k];
  }).join('&');
}

var login_form = {
  username: 'jinxagain',
  userpass: '940412',
  login: 'Sign In'
};

var headers = {
  'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Encoding':'gzip, deflate',
  'Accept-Language':'zh-CN,zh;q=0.8',
  'Cache-Control':'max-age=0',
  'Connection':'keep-alive',
  'Content-Type':'application/x-www-form-urlencoded',
  'Content-Length': 0,
  'Host':'acm.hdu.edu.cn',
  'Origin':'http://acm.hdu.edu.cn',
  'Referer':'http://acm.hdu.edu.cn/status.php',
  'Upgrade-Insecure-Requests':1,
  'User-Agent':'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.94 Safari/537.36'
};

let cookie;

function postRequest(uri, form, cookie) {
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

function handleReject(msg) {
  console.log('message in reject', msg);
  return Promise.reject();
}

function retryFetchResult(uri) {
  let promise = new Promise(function(resolve, reject) {
    let retryCount = 0,
      retryLimit = 10;
    fetchResult();
    function fetchResult() {
      request.get(uri).then(resp => {
        let body = resp.body,
          reg1 = /<div id=fixed_table>[\s\S]*<\/div>/g,
          fixed_table = _.first(body.match(reg1)),
          reg2 = /<\s*tr[\s\S]*?>[\s\S]*?<\/tr>/g,
          items = fixed_table.match(reg2),
          answer = items.length > 1 && items[1],
          reg3 = /Running/,
          reg4 = /Accepted/,
          result = answer.match(reg3);
          console.log('result = ', result);
          if (answer.match(reg3)) {
            console.log('the result is Running, retrying!');
            retryCount++;
            fetchResult();
          } else if (answer.match(reg4)) {
            console.log('the result is Accepted, return!');
            resolve(true);
          } else {
            resolve(false);
          }
      }, () => {
        retryCount ++;
        if (retryCount >= retryLimit) {
          resolve(false);
        }
        else fetchResult();
      });
    }
  });

  return promise;
}

router.get('/', function(req, res, next) {
  return request.get('http://acm.hdu.edu.cn').then(res => {
    var header = res.headers;
    
    cookie = header['set-cookie'].join(',').match(/(PHPSESSID=.+?);/)[1];
    return Promise.resolve(cookie);
  }).then(cookie => {
    headers['Content-Length'] = queryize(login_form).length;
    return postRequest('http://acm.hdu.edu.cn/userloginex.php?action=login', login_form, cookie).then(resp => {
      return Promise.resolve();
    });
  }).then(() => {
    return fetchHrefs('hdu', 1001).then(hrefs => {
      async.each(hrefs, (href, callback) => {
        console.log(href);
        return request.get(href).then(res => {
          var body = res.body,
            $ = cheerio.load(body),
            code = $('[name=code]').text();

          var form_data = null;
          console.log('code = ', code);
          if (code) {
            form_data = {
              check: 0,
              problemid: 1001,
              language: 0,
              usercode: code
            };
          }
          return Promise.resolve(form_data);
        }).then(form_data => {
          if (!form_data) {
            return Promise.reject('Failed to get the code');
          }
          headers['Content-Length'] = escape(queryize(form_data)).length;
          // console.log(form_data);
          return postRequest('http://acm.hdu.edu.cn/submit.php?action=submit', form_data, cookie).then((resp) => {
            return Promise.resolve(resp.status);
          });
        }).then((status) => {
          if (status != 302) {
            return Promise.reject('Failed to post the code');
          }
          let uri = 'http://acm.hdu.edu.cn/status.php?user=' + login_form.username + '&lang=0&status=0';
          return retryFetchResult(uri);
        }, handleReject).then(pass => {
          if (pass) {
            //Todo : save the code into database
            // and break the loop
            callback('got an Accepted');
            return;
          } else {
            callback();
            return;
          }
        }, callback);
      }, function(err) {
        console.log('err = ', err);
        res.send(err);
      });
    });
  });
});

router.get('/test', function(req, res, next) {
  res.send('Accepted');
  return hdu.search().then(() => {
    console.log('Finished!');
  });
});

router.get('/analysis', function(req, res, next) {
  hdu.analysis();
  res.send('Accepted');
});

router.get('/gettitle', function(req, res, next) {
  hdu.getTitle();
  res.send('Accepted');
});

router.get('/exec', function(req, res, next) {
  hdu.exec();
  res.send('Accepted');
});

router.get('/getsolved', function(req, res, next) {
  hdu.getSolvedCount();
  res.send('Accepted');
});

router.get('/cf/solution', function(req, res, next) {
  cf.getEditorial();
  res.send('Accepted');
});

module.exports = router;