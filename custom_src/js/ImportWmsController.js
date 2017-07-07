goog.provide('ga_importwms_controller');
(function() {

  var module = angular.module('ga_importwms_controller', []);

  module.controller('GaImportWmsController', function($scope, gaGlobalOptions) {
    $scope.options = {
      proxyUrl: gaGlobalOptions.ogcproxyUrl,
      defaultGetCapParams: 'SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0',
      defaultWMSList: [
        //'http://ows.terrestris.de/osm/service',
        //'http://webapps.comune.trento.it/ogc'
      ]
    };
  });
})();
