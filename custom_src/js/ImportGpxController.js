goog.provide('ga_importgpx_controller');
(function() {

  var module = angular.module('ga_importgpx_controller', []);

  module.controller('GaImportGpxController', function($scope, gaGlobalOptions) {
    $scope.options = {
      proxyUrl: gaGlobalOptions.ogcproxyUrl
    };
  });
})();
