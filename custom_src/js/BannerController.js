goog.provide('ga_banner_controller');
goog.require('ga_banner_service');
(function() {

    var module = angular.module('ga_banner_controller', ['ga_banner_service']);

    module.controller('GaBannerController',
        function($rootScope, $scope, $sce, gaBannerService, gaBrowserSniffer, gaGlobalOptions) {
            // Accepted flag, if true, the banner will not be shown
            $scope.accepted = true;
            // The banner content (additional wrt the on in the template) to show, retrieved from server
            $scope.bannerContent = "";

            /*
             * Callback on succesfull banner retrieval
             */
            var onBannerRetrieved = function(banner) {
                // Setting the visibility accordingly with the logic
                if (!banner || banner.length == 0) {
                    $scope.accepted = true;
                } else {
                    $scope.accepted = false;
                }

                // Adding the custom HTML content
                $scope.bannerContent =  $sce.trustAsHtml(banner);
            };

            /*
             * Callback on failure banner retrieval
             */
            var onBannerFailed = function(error) {
                console.error("[Banner] Unable to retrieve the banner " + error);
                // Adding the custom HTML content
                $scope.bannerContent =  "N.A.";
            }

            /**
             * On language change, update the banner content.
             * Since the very beginning of the execution will generate the event, this is also the loading point for the
             * banner. Specifying it also on the controller would lead at two loading events instead.
             */
            $rootScope.$on('$translateChangeEnd', function () {
                gaBannerService.getBanner(gaBrowserSniffer.mobile).then(onBannerRetrieved, onBannerFailed)
            });

            /**
             * Handle the user action on button pressure
             */
            $scope.accept = function() {
                $scope.accepted = true;
                gaBannerService.acceptBanner();
            };
        }
    );
})();
