goog.provide('ga_mouseposition_controller');
(function() {

  var module = angular.module('ga_mouseposition_controller', [
    'pascalprecht.translate'
  ]);

  module.controller('GaMousePositionController',
      function($scope, $translate, $window, gaGlobalOptions) {

        $scope.mousePositionProjections = gaGlobalOptions.mousePositionProjections;

        $scope.options = {
          projection: $scope.mousePositionProjections[0]
        };

      });

})();
