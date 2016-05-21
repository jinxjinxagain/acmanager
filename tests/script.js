var request = require('request-prom'),
  cheerio = require('cheerio'),
  lite = require('iconv-lite');

request.get('http://codeforces.com/contest/669/submission/17980949').then(res => {
  var body = res.body;
  console.log(body);
  var $ = cheerio.load(body);

  var text = $('.prettyprint,.program-source').text();
  console.log(text);
});
