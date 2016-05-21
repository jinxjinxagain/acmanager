// declare a new module called 'myApp', and make it require the `ng-admin` module as a dependency
var acManager = angular.module('acManager', ['ng-admin']);

// declare a function to run when the module bootstraps (during the 'config' phase)
acManager.config(['RestangularProvider',
  function(RestangularProvider) {
    RestangularProvider.addFullRequestInterceptor(function(element, operation, what, url, headers, params) {
      if (operation == "getList") {
        // custom filters
        if (params._filters) {
          for (var filter in params._filters) {
            params[filter] = params._filters[filter];
          }
          delete params._filters;
        }
      }
      return { params: params };
    });
  }
]);

acManager.config(['NgAdminConfigurationProvider',
  function(nga) {
    var admin = nga.application('武汉科技大学ACM俱乐部信息管理系统').baseApiUrl('/');
    var id_field = nga.field('id').label('ID');

    var user = nga.entity('users').label('用户信息').identifier(id_field);
    user.listView().fields([
      nga.field('name').label('姓名'),
      nga.field('username').label('用户名').isDetailLink(true),
      nga.field('class').label('班级'),
      nga.field('codeforces.rating', 'number').label('codeforce'),
      nga.field('topcoder.rating', 'number').label('topcoder'),
      nga.field('bestcoder.rating', 'number').label('bestcoder')
    ]).title('用户列表');
    user.editionView().fields([
      nga.field('name').label('姓名'),
      nga.field('class').label('班级'),
      nga.field('codeforces.nickname').label('codeforce-nickname'),
      nga.field('codeforces.rating').label('codeforce-rating'),
      nga.field('topcoder.nickname').label('topcoder-nickname'),
      nga.field('topcoder.rating').label('topcoder-nickname'),
      nga.field('bestcoder.nickname').label('bestcoder-nickname'),
      nga.field('bestcoder.rating').label('bestcoder-rating')
    ]).title('{{ entry.values.name }}');
    admin.addEntity(user);

    function Join(value, entry) {
      return value.join(',');
    }
    function Split(value, entry) {
      return value.split(',');
    }

    var tag = nga.entity('tags').label('标签').identifier(id_field);
    tag.listView().fields([
      nga.field('name').label('标签').isDetailLink(true),
      nga.field('keywords', 'text').label('关键词').map(Join)
    ]).title('标签列表');
    tag.editionView().fields([
      nga.field('name').label('标签'),
      nga.field('keywords', 'text').label('关键词').transform(Split)
    ]).title('{{ entry.values.name }}');
    admin.addEntity(tag);

    var hdu = nga.entity('hdu').baseApiUrl('/problems/').identifier(id_field).label('杭电');
    hdu.listView().fields([
      nga.field('problemid').label('Pro.id').isDetailLink(true),
      nga.field('search_result', 'text').map(Join).label('Info'),
      nga.field('tags').map(Join)
    ]).title('题目列表').perPage(100);
    hdu.editionView().fields(hdu.listView().fields()).title('{{ entry.values.problemid }}');
    admin.addEntity(hdu);
    nga.configure(admin);
  }
]);
