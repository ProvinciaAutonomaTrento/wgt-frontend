goog.provide('ga_share_controller');
(function() {

  var module = angular.module('ga_share_controller', []);

  module.controller('GaShareController', function($scope, gaGlobalOptions) {
    $scope.options = {
      //---START---
      //shortenUrl: gaGlobalOptions.apiUrl + '/shorten.json',
      //---END---
      //+++START+++
      shortenUrl: gaGlobalOptions.apiUrl + '/shorten',
      //+++END+++
      qrcodegeneratorPath: gaGlobalOptions.apiUrl + '/qrcodegenerator',
      iframeSizes: [{
        label: 'small_size',
        value: [400, 300]
      }, {
        label: 'medium_size',
        value: [600, 450]
      }, {
        label: 'big_size',
        value: [800, 600]
      }, {
        label: 'custom_size',
        value: undefined
      }]
    };
  });
})();
