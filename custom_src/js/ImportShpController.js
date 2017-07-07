goog.provide('ga_importshp_controller');
(function() {

  var module = angular.module('ga_importshp_controller', []);

  module.controller('GaImportShpController', function($scope, gaGlobalOptions) {
    $scope.options = {
      proxyUrl: gaGlobalOptions.ogcproxyUrl
    };
  });
})();
