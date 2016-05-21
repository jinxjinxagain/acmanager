var pro_count = 0;
$(document).ready(function(){
  $('#addProblem').click(function(){
    if (pro_count >= 26) {
      alert('Number of problems should be less than 26');
      return;
    }
    pro_count ++;
    $('#problems').append(`
      <div id = "${pro_count}" class = "form-group">
        <label class = "col-sm-2 control-label"> ${String.fromCharCode((64 + (pro_count)))} </label> 
        <div class = "col-sm-2"> 
          <select name = "${pro_count}" class = "form-control form-submit" onchange = "fetchHistory(this)">
            <option> codeforces </option>
            <option> hdu </option>
          </select> 
        </div> 

        <div class = "col-sm-2">
          <input type = "text" name = "id_${pro_count}" class = "form-control form-submit" oninput = "fetchHistory(this)">
        </div>

        <div class = "col-sm-1">
          <a name = "${pro_count}" href = "javascript:void(0);" onclick = "rmProm(this)"> 
            <span class = "glyphicon glyphicon-remove" style = "line-height:30px;"> 
            </span> 
          </a>
        </div>

        <div class = "col-sm-4"> 
          <span id = "${pro_count}" style = "line-height:30px;"> </span>
        </div>
      </div> 
    `);
  });

  $('#confirm').click(function() {
    var post_data = {};
    $('.form-submit').each(function() {
      post_data[$(this).attr('name')] = $(this).val();
    });

    console.log(post_data);
    $.ajax({
      type: "POST",
      url: "/contest",
      data: post_data,
      async: false,
      success: function(msg) {
        alert('success');
      },
      error: function(msg) {
        alertMsg('Title and date must be assigned');
      }
    });
  });
});

function rmProm(self) {
  // console.log(pro_count);
  $self = $(self);
  var current = $self.attr('name') * 1,
    p = pro_count;
  
  // console.log(p, current);
  while(p > current) {
    // console.log($('#' + p));
    var txt = $('#' + p ).find('label').text(),
      to = String.fromCharCode(txt.charAt(1).charCodeAt() - 1);

    // console.log('text = ', txt, 'to = ', to);
    $('#' + p).find('label').text(' ' + to);
    
    $('#' + p).find('[name]').each(function() {
      var $this = $(this);

      if (/\d/.test($this.attr('name'))) {
        $this.attr('name', p - 1);
      } else {
        $this.attr('name', 'id_' + p);
      }
    });

    $('#' + p).attr('id', p - 1);

    p --;
  }

  $('#' + p).remove();
  pro_count --;
}

function fetchHistory(self) {
  var val = $(self).text(),
    name = $(self).attr('name'),
    current = (name.length == 5 || name.length == 2) ? name.slice(name.length - 2) : name.slice(name.length - 1);
  
  $('span').filter('#' + current).css('color', 'red').html('Crawling...');

  var onlinejudge = $('select').filter(`[name=${current}]`).val(),
    problemid = $(`[name=id_${current}]`).val();
  $.ajax({
    type: "GET",
    url: "/contest/query",
    contentType: "application/json; charset=utf-8",
    data: `onlinejudge=${onlinejudge}&problemid=${problemid}`,
    success: function(res) {
      console.log(res);
      if (res.status == 0) {
        $('span').filter('#' + current).css('color', 'red').html(res.message);
      } else if (res.status == 1) {
        $('span').filter('#' + current).css('color', 'blue').html(res.problem.title + ' : ' + res.problem.tags);
      } else if (res.status == 2) {
        $('span').filter('#' + current).css('color', 'blue').html(res.problem.title + ' : ' + res.problem.tags);

      } else {
        $('span').filter('#' + current).css('color', 'red').html('Server error');
      }
    },
    error: function(err) {
      alert(err.message);
    }
  })
}