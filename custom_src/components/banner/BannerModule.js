goog.provide('ga_banner');

goog.require('ga_banner_directive');
goog.require('ga_banner_service');
(function() {

  angular.module('ga_banner', [
    'ga_banner_directive',
    'ga_banner_service'
  ]);
})();
