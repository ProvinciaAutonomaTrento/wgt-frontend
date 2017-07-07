goog.provide('ga_login_service');
(function() {

  var module = angular.module('ga_login_service', [
    'pascalprecht.translate'
  ]);

  module.service('gaLoginService', function($http, $q, $translate, gaGlobalOptions) {

    var username;

    this.getUser = function(force_load) {
      var deferred = $q.defer();
      if (!username || force_load) {
        $http.get(gaGlobalOptions.apiUrl + '/getUserName')
          .success(function(data, status, headers, config) {
            username = data;
            deferred.resolve(data);
          }).error(function(data, status, headers, config) {
            alert($translate.instant('error'));
            deferred.reject(data);
          });
      } else {
        deferred.resolve(username);
      }
      return deferred.promise;
    };

    this.setUser = function(usr) {
      username = usr;
    };

  });
})();
