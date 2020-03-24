goog.provide('ga_banner_service');
(function() {

    var module = angular.module('ga_banner_service', [
        'ngCookies',
        'pascalprecht.translate'
    ]);

    /*
     * The name of the cookie to store
     */
    var bannerCookieKey = "wgt-banner-consent";

    /**
     * The banner cookie to save
     */
    function BannerCookie(id, version, accepted) {
        this.id = id;
        this.version = version;
        this.accepted = accepted;
    };

    /**
     * The gaBannerService implementing the banner retrieval from server and the logic for presenting on frontend-side
     */
    module.provider('gaBannerService', function() {

        // As provider the following method is invoked during the 'configuration phase'
        this.$get = function($q, $http, $cookies, $translate, $timeout, gaGlobalOptions) {
            return  {

                /**
                 * Retrieve the banner data from the server and returns a promise to the caller.
                 * Accordingly with internal logic (cookie-based) the promise will return null in case no banner is to
                 * be shown or the proper banner.
                 */
                getBanner: function(isMobile) {
                    // The 'only' way for getting the language set
                    var lang = $translate.proposedLanguage() || $translate.use();

                    // The URL to the banner service
                    var url = gaGlobalOptions.apiUrl + '/banner';

                    // Performing the call for retrieving the last banner for the language (mobile is just for the content)
                    var deferred = $q.defer()
                    $http({
                        method: 'GET',
                        url: url + '?lang=' + lang + '&mobile=' + isMobile,
                        timeout : 30000
                    }).then(
                        function(response){
                            // Check the response to have the expected fields
                            if (!response || !response.data || !response.data.hasOwnProperty('id') ||
                                !response.data.hasOwnProperty('version') || !response.data.hasOwnProperty('content')) {
                                console.error("[Banner] Unexpected server response type!");
                                throw "SERVER ERROR";
                            }

                            // Getting the cookie, if any
                            var existingCookie = $cookies.getObject(bannerCookieKey);

                            // In case the cookie already exists, check the version and the accept flag
                            if (existingCookie) {
                                // In case the version is the same and the user already accepted, then do nothing
                                if (existingCookie.version == response.data.version && existingCookie.accepted) {
                                    return;
                                }

                                // Should never happen
                                if (existingCookie.version > response.data.version && existingCookie.accepted) {
                                    console.warn("[Banner] User already agreed on a more recent banner version!")
                                    return;
                                }
                            }

                            // Save the banner cookie (init or update)
                            bannerCookie = new BannerCookie(response.data.id, response.data.version, false);
                            $cookies.putObject(bannerCookieKey, bannerCookie);

                            // Return the banner to be shown
                            deferred.resolve(response.data.content);
                        },
                        function (error) {
                            console.error("[Banner] Error arisen invoking the banner server-side" + str(error));
                            deferred.reject();
                        });

                    return deferred.promise;
                },

                /*
                 * The user accepted the banner, so properly modify the internal logic (cookie-based).
                 */
                acceptBanner: function() {
                    // Getting the cookie, if any
                    var bannerCookie = $cookies.getObject(bannerCookieKey);
                    if (!bannerCookie) {
                        console.error("[Banner] The banner cookie doesn't exist!");
                        return;
                    }

                    // Update the cookie
                    bannerCookie.accepted = true;
                    $cookies.putObject(bannerCookieKey, bannerCookie);
                }
            }
        };

    });

})();

