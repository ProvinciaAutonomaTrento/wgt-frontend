goog.provide('ga_search_controller');
(function() {

  var module = angular.module('ga_search_controller', []);

  module.controller('GaSearchController',
      function($scope, gaGlobalOptions) {
        //---START---
        /*
        $scope.options = {
          searchUrl: gaGlobalOptions.cachedApiUrl +'/rest/services/{Topic}/SearchServer?',
          featureUrl: gaGlobalOptions.cachedApiUrl +'/rest/services/{Topic}/MapServer/{Layer}/{Feature}'
        };
        */
        //---END---
        //+++START+++
        $scope.options = {
          searchUrl: gaGlobalOptions.cachedApiUrl +'/SearchServer?',
          featureUrl: gaGlobalOptions.cachedApiUrl +'/MapServer/getGeometry'
        };
        //+++END+++
      });
})();
