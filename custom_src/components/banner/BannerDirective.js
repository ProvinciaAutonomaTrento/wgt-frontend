goog.provide('ga_banner_directive');

goog.require('ga_banner_service');
goog.require('ga_banner_controller');
(function() {

    var module = angular.module('ga_banner_directive', [
    'ga_banner_service',
    'ga_banner_controller'
    ]);

    /* Banner Directive
     *
     * This directives places a banner above the map, at the bottom.
     */
    module.directive('gaBanner', function($rootScope, $sce) {
        return {
            restrict: 'E',
            templateUrl: 'components/banner/partials/banner.html'
        };
    });

})();