goog.provide('ga_welcomemsg');

goog.require('ga_welcomemsg_directive');
(function() {

  angular.module('ga_welcomemsg', [
    'ga_welcomemsg_directive',
    'ga_login_service'
  ]);
})();
