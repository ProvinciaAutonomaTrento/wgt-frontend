goog.provide('ga_help_service');
(function() {

    var module = angular.module('ga_help_service', [
        'pascalprecht.translate'
    ]);

    /**
     * The gaHelpService.
     *
     * The service provides the following functionality:
     *
     * - Allows the gaHelpDirective to get a html snipped
     *   for a given help-id
     */
    module.provider('gaHelpService', function() {
        this.$get = function($q, $http, $translate, $timeout) {

            var Help = function() {
                //keeps cached versions of help snippets
                var registry = {};

                // var url = 'https://www.googleapis.com/fusiontables/v1/query?' + 'callback=JSON_CALLBACK';
                var mockUrl = "http://demo0263711.mockable.io/test";
                var URL_WS_HELP = 'http://localhost:19080/wgt/services/help';
                //---START---
                //var apiKey = 'AIzaSyDT7wmEx97gAG5OnPwKyz2PnCx3yT4j7C0';
                //var sqlTmpl = 'select * from 1Tx2VSM1WHZfDXzf8rweRLG1kd23AA4aw8xnZ_3c' +' where col0={id} and col5=\'{lang}\'';
                //---END---
                //+++START+++
                // var apiKey = 'AIzaSyDCWxAvtP4L5KR5_L5YR0i9RNvZIzumZjg';
                // var tableId = '125wKuuSxLLSkHM90Qell0z2O69ayMFCgmq45J1aM';
                // var sqlTmpl  = 'select * from '+ tableId +' where col0={id} and col5=\'{lang}\'';

                //+++END+++

                this.get = function(id) {
                    var lang = fixLang($translate.use());
                    var deferred = $q.defer()
                    $http({
                        method: 'GET',
                        url: URL_WS_HELP+'?id='+id+'&lang='+lang,
                        timeout : 60000
                    }).then(
                        function(response){
                            console.log('HelpService 1');
                            console.log(response);
                            registry[key(id, lang)] = response;
                            deferred.resolve(response);
                        },
                        function (error) {
                            console.log(error);
                            deferred.reject();
                        });
                    return deferred.promise;
                };
                //Returns a promise
                // this.get = function(id) {
                //   var lang = fixLang($translate.use());
                //   var deferred = $q.defer();
                //  //We resolve directly when we have it in cache already
                //   if (angular.isDefined(registry[key(id, lang)])) {
                //     $timeout(function() {
                //       deferred.resolve(registry[key(id, lang)]);
                //     }, 0);
                //   }
                //
                //   //get it from fusion tables
                //   var sql = sqlTmpl
                //             .replace('{id}', id)
                //             .replace('{lang}', lang);
                //   $http.jsonp(url, {
                //     params: {
                //       key: apiKey,
                //       sql: sql
                //     }
                //   }).success(function(response) {
                //     registry[key(id, lang)] = response;
                //     deferred.resolve(response);
                //   }).error(function() {
                //     deferred.reject();
                //   });
                //
                //   return deferred.promise;
                // };



                //we only support certain languages
                function fixLang(langa) {
                    var l = langa;
                    if (langa == 'rm') {
                        l = 'de';
                    }
                    return l;
                }

                function key(id, lang) {
                    return id + lang;
                };
            };

            return new Help();
        };
    });
})();
