function gethref(problemid, onlinejudge) {
  if (onlinejudge == 'hdu') {
    $('#showproblem' + onlinejudge + problemid).attr('href', 'http://acm.hdu.edu.cn/showproblem.php?pid=' + problemid);
  } else if (onlinejudge == 'codeforces') {
    $('#showproblem' + onlinejudge + problemid).attr('href', 'http://codeforces.com/problemset/problem/' + problemid.slice(0, problemid.length - 1) + '/' + problemid[problemid.length - 1]);
  }
  // $('#showproblem' + onlinejudge + problemid).unbind('onclick');
  $('#showproblem' + onlinejudge + problemid).click();
}

function getsolution(self, problemid, onlinejudge) {
  $(self).attr('href', `/problem/solution?onlinejudge=${onlinejudge}&problemid=${problemid}`);
  $(self).click();
}