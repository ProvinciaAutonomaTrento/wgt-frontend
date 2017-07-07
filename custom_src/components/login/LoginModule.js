goog.provide('ga_login');

goog.require('ga_login_directive');
goog.require('ga_login_service');
(function() {

  angular.module('ga_login', [
    'ga_login_directive',
    'ga_login_service'
  ]);
})();
