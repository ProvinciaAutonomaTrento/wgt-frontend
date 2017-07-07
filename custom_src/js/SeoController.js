goog.provide('ga_seo_controller');
(function() {

  var module = angular.module('ga_seo_controller', []);

  module.controller('GaSeoController', function($scope, gaGlobalOptions) {
    $scope.options = {
      //---START---
      //htmlUrlTemplate: gaGlobalOptions.cachedApiUrl +'/rest/services/{Topic}/MapServer/{Layer}/{Feature}/htmlPopup',
      //searchUrl: gaGlobalOptions.apiUrl + '/rest/services/ech/SearchServer',
      //identifyUrl: gaGlobalOptions.apiUrl +'/rest/services/all/MapServer/identify'
      //---END---
      //+++START+++
      htmlUrlTemplate: gaGlobalOptions.cachedApiUrl +'/MapServer/htmlPopup',
      searchUrl: gaGlobalOptions.apiUrl + '/SearchServer',
      identifyUrl: gaGlobalOptions.apiUrl +'/MapServer/identify'
      //++++END+++
    };
  });
})();
