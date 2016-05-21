'use strict'

var async = require('async'),
  request = require('request-prom'),
  cheerio = require('cheerio'),
  _ = require('underscore'),
  lite = require('iconv-lite');

var utils = require('../lib/utils'),
  Problem = require('../models/problem'),
  Tag = require('../models/tag');

const login_form = {
  username: 'jinxagain',
  userpass: '940412',
  login: 'Sign In'
};
const uris = {
  home: 'http://acm.hdu.edu.cn',
  login: 'http://acm.hdu.edu.cn/userloginex.php?action=login',
  submit: 'http://acm.hdu.edu.cn/submit.php?action=submit',
  status: 'http://acm.hdu.edu.cn/status.php?user=' + login_form.username + '&lang=0&status=0',
  showproblem: 'http://acm.hdu.edu.cn/showproblem.php?pid=',
  solvedcount: 'http://acm.hdu.edu.cn/listproblem.php?vol='
};
let cookie;

var headers = {
  'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Encoding':'gzip, deflate',
  'Accept-Language':'zh-CN,zh;q=0.8',
  'Cache-Control':'max-age=0',
  'Connection':'keep-alive',
  'Content-Type':'application/x-www-form-urlencoded',
  // 'Content-Length': 0,
  'Host':'acm.hdu.edu.cn',
  'Origin':'http://acm.hdu.edu.cn',
  'Referer':'http://acm.hdu.edu.cn/status.php',
  'Upgrade-Insecure-Requests':1,
  'User-Agent':'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.94 Safari/537.36'
};

function fetchHrefs(oj, problemid) {
  console.log('http://www.baidu.com/s?wd=' + oj + problemid);
  return request.get('http://www.baidu.com/s?wd=' + oj + problemid).then(rep => {
    var body = rep.body,
      $ = cheerio.load(body);
      

    var hrefs = [],
      texts = [];
    $('h3 a').each(function() {
      var href = $(this).attr('href');
      var val = $(this).text();
      
      if (val.toUpperCase().indexOf('hdu'.toUpperCase()) != -1 && val.indexOf(problemid.toString()) != -1) {
        hrefs.push(href);
        texts.push(val);
      }
    });

    return Promise.resolve(hrefs);
  });
}

function retryFetchResult(uri, code) {
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
          reg3 = /(Running|Queuing|Compiling)/,
          reg4 = /Accepted/,
          result = answer.match(reg3);
          if (answer.match(reg3)) {
            console.log('the result is Running or Queuing, retrying!', 'retryCount is:', retryCount);
            retryCount++;
            fetchResult();
          } else if (answer.match(reg4)) {
            console.log('the result is Accepted, return!');
            resolve({
              pass: true,
              form: code
            });
          } else {
            console.log(answer);
            resolve({
              pass: false,
              form: code
            });
          }
      }, () => {
        retryCount ++;
        if (retryCount >= retryLimit) {
          resolve({
            pass: false,
            form: code
          });
        }
        else fetchResult();
      }, utils.handleReject);
    }
  });

  return promise;
}

function fetchCookie () {
  return request.get(uris.home).then(res => {
    let header = res.headers;
    cookie = header['set-cookie'].join(',').match(/(PHPSESSID=.+?);/)[1];
    return Promise.resolve(cookie);
  });
}

function login() {
  // headers['Content-Length'] = utils.queryize(login_form).length;
  return utils.postRequest(uris.login, headers, login_form, cookie).then(resp => {
    return Promise.resolve();
  });
}

Problem
let maxid = 5679;
function exec() {
  let ids = [],
    current = 1000;
  while(current < maxid) {
    ids.push(current);
    current++;
  }
  console.log('Constructed the array of id:', ids.length);
  return fetchCookie().then(cookie => {
    return login();
  }).then(() => {
    return ids.reduce((chain, id) => {
      return chain.then(() => {
        return Problem.findOne({
          onlinejudge: 'hdu',
          problemid: id.toString()
        });
      }).then(item => {
        if (item.solution) return Promise.resolve();
        else return fetchHrefs('hdu', id).then(hrefs => {
          return hrefs.reduce((c, href) => {
            return c.then(() => {
              return request.get(href);
            }, utils.handleReject).then(res => {
              let body = res.body,
                $ = cheerio.load(body),
                code = $('[name=code]').text(); // Todo: fetch the different label containing code

              let form_data = null;
              if (code) {
                form_data = {
                  check: 0,
                  problemid: id,
                  language: 0,
                  usercode: code
                }
              }
              console.log('got the code:', code);
              return Promise.resolve(form_data);
            }, utils.handleReject).then(form_data => {
              if (!form_data) {
                return Promise.reject('Failed to get code');
              }
              // headers['Content-Length'] = escape(gb2312.encodeToGb2312(utils.queryize(form_data))).length;
              console.log('going to submit the code');
              return utils.postRequest(uris.submit, headers, form_data, cookie).then(resp => {
              //  console.log(resp.status);
                return Promise.resolve({
                  status:resp.status,
                  form_data: form_data
                });
              }, utils.handleReject);
            }, utils.handleReject).then(info => {
              console.log('Got the status of response with', info.status, info.form_data);
              if (info.status != 302) return Promise.reject('Failed to post the code');
              else return retryFetchResult(uris.status, info.form_data);
            }, utils.handleReject).then(status => {
              console.log('Pass? ', status.pass);
              if (status.pass) {
                console.log('got an Accepted', status.code, 'id:', id);
                return Problem.findOne({
                  onlinejudge: 'hdu',
                  problemid: id.toString()
                }).then(item => {
                  console.log(item.output, status.form.usercode);
                  item.solution = status.form.usercode;
                  return item.save();
                });
              } else return Promise.resolve();
            }, () => {
              console.log('Not pass');
              return Promise.resolve();
            });
          }, Promise.resolve());
        }, console.log);
      }, console.log);
    }, Promise.resolve());
  });
}

function search() {
  let ids = [],
    current = 1000;

  while(current < maxid) {
    ids.push(current);
    current++;
  }

  return ids.reduce((chain, id) => {
    return chain.then(() => {
      return Problem.findOne({
        onlinejudge: 'hdu',
        problemid: id.toString()
      }).then(item => {
        console.log(item);
        if (item && item.search_result.length != 0) return Promise.reject('Updated');
        else return Promise.resolve();
      });
    }).then(() => {
      return request.get('http://www.baidu.com/s?wd=' + 'hdu' + id);
    }, utils.handleReject).then(res => {
      let body = res.body,
        $ = cheerio.load(body),
        result = [];
      // console.log(body);
      $('h3 a').each(function() {
        let text = $(this).text();
         console.log('text = ', text);
        if (text.toUpperCase().indexOf('hdu'.toUpperCase()) != -1 && text.toUpperCase().indexOf(id.toString()) != -1) {
          console.log('pushing!');
          result.push(text);
        }
      });
      return Promise.resolve(result);
    }, utils.handleReject).then(result => {
      // console.log(result);
      Problem.findOne({
        onlinejudge: 'hdu',
        problemid: id.toString()
      }).then(item => {
        // console.log(item);
        if (item) {
          if (item.search_result.length == 0) {
            item.search_result = result;
            return item.save();
          }
          else {
            return Promise.resolve();
          }
        } else {
          return Problem.create({
            onlinejudge: 'hdu',
            problemid: id.toString(),
            search_result: result
          });
        }
      });
    }, () => Promise.resolve());
  }, Promise.resolve());
}

function analysis() {
  Problem.find({
    onlinejudge: 'hdu'
  }).then(items => {
    return items.reduce((chain, item) => {
      return chain.then(() => {
        return Tag.find();
      }, utils.handleReject).then(tags => {
        let keywords = [];
        console.log(item.output);
        item.search_result.forEach(data => {
          console.log(data);
          tags.forEach(tag => {
            console.log(tag.output);
            tag.keywords.forEach(word => {
              if (data.toUpperCase().indexOf(word.toUpperCase()) != -1) keywords.push(tag.name); 
            });
          });
        });
        console.log(keywords);
        item.tags = _.uniq(keywords);
        return item.save();
      }, utils.handleReject);
    }, Promise.resolve());
  });
}

function fetchTitle() {
  let ids = [],
    current = 1000;

  while(current < maxid) {
    ids.push(current);
    current++;
  }

  return ids.reduce((chain, id) => {
    return chain.then(() => {
      return Problem.findOne({
        onlinejudge: 'hdu',
        problemid: id.toString()
      });
    }).then(item => {
      return request.get(uris.showproblem + id, {
        encoding: null
      }).then(resp => {
        let body = lite.decode(resp.body, 'gb2312').toString(),
          $ = cheerio.load(body),
          title = $('h1').text();
        console.log(title);

        // while(1);
        item.title = title;
        console.log(item.title);
        return item.save();
      });
    }, () => Promise.resolve());
  }, Promise.resolve());
}

let maxvol = 47;
function fetchSolvedCount() {
  let vols = [],
    current = 1;
  while(current < maxvol) {
    vols.push(current);
    current++;
  }

  return vols.reduce((chain, vol) => {
    return chain.then(() => {
      return request.get(uris.solvedcount + vol).then(res => {
        let body = res.body,
          $ = cheerio.load(body),
          pass = $('[language=javascript]').text(),
          reg = /\([\s\S]*?\);/g,
          info = pass.match(reg);

        return info.reduce((c, f) => {
          return c.then(() => {
            let use = f.slice(1, f.length - 2).split(','),
              problemid = use[1],
              solvedcount = use[use.length - 2];
            console.log(problemid, solvedcount, use);
            return Problem.findOne({
              onlinejudge: 'hdu',
              problemid: problemid
            }).then(item => {
              if (item) {
                item.solvedcount = solvedcount;
                return item.save();
              } else return Promise.resolve();
            }, utils.handleResolve);
          }, utils.handleResolve);
        }, Promise.resolve());
      }, utils.handleResolve);
    }, utils.handleReject);
  }, Promise.resolve());
}

module.exports = {
  exec: exec,
  search: search,
  analysis: analysis,
  getTitle: fetchTitle,
  getSolvedCount: fetchSolvedCount
}