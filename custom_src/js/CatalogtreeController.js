goog.provide('ga_catalogtree_controller');
(function() {

  var module = angular.module('ga_catalogtree_controller', []);

  module.controller('GaCatalogtreeController',
      function($scope, gaGlobalOptions) {
        $scope.options = {
          //---START---
          //catalogUrlTemplate: gaGlobalOptions.cachedApiUrl +'/rest/services/{Topic}/CatalogServer'
          //---END---
          //+++START+++
          catalogUrlTemplate: gaGlobalOptions.cachedApiUrl +'/{Topic}/layersTree'
          //++++END+
        };
      });
})();
