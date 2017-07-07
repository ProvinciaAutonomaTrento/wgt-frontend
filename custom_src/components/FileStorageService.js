goog.provide('ga_file_storage_service');
(function() {

  var module = angular.module('ga_file_storage_service', []);

  /**
   * This service can create/read/write/delete a file on s3.
   */
  module.provider('gaFileStorage', function() {
    this.$get = function($http, $q) {
      var fileStorageUrl = this.fileStorageUrl;
      var publicUrl = this.publicUrl;

      var getServiceUrl = function(id) {
        return fileStorageUrl + ((id) ? '/' + id : '');
      };

      var getPublicUrl = function(fileId) {
        return publicUrl + ((fileId) ? '/' + fileId : '');
      };

      var FileStorage = function() {

        // Get the file from a fileId
        this.get = function(fileId) {
          //---START---
          // return $http.get(getPublicUrl(fileId));
          //---END---
          //+++START+++
          var deferred = $q.defer();
          var data = {"status":"updated","adminId":"00000000000000-0000000","fileId":"000-000000000000000000"};
          deferred.resolve(data);
          return deferred.promise;
          //+++END+++
        };

        // Get a fileId from a fileUrl
        this.getFileIdFromFileUrl = function(fileUrl) {
          if (!fileUrl) {
            return;
          }
          return fileUrl.split('/').pop();
        };

        // Get the accessible url of the file from an adminId
        this.getFileUrlFromAdminId = function(adminId) {
          var deferred = $q.defer();
          //---START---
          /*
          $http.get(getServiceUrl(adminId)).success(function(data) {
            if (data && data.fileId) {
              var url = getPublicUrl(data.fileId);
              deferred.resolve(url);
            } else {
              deferred.reject();
            }
          }).error(function() {
            deferred.reject();
          });
          */
          //---END---
          //+++START+++
          var data = {"status":"updated","adminId":"00000000000000-0000000","fileId":"000-000000000000000000"};
          deferred.resolve(getPublicUrl(data.fileId));
          //+++END+++
          return deferred.promise;
        };

        // Save the content of a file in s3.
        // If no id defined --> create a new file
        //     returns new adminId and new file url
        // If id is an adminId --> update the file
        //     returns the same adminId and the same file url
        // if id is an fileId --> fork the file
        //     returns new adminId and new file url
        this.save = function(id, content, contentType) {
          var deferred = $q.defer();
          //---START---
          /*
          $http.post(getServiceUrl(id), content, {
            headers: {
              'Content-Type': contentType
            }
          }).success(function(data) {
            deferred.resolve({
              adminId: data.adminId,
              fileId: data.fileId,
              fileUrl: getPublicUrl(data.fileId)
            });
          }).error(function() {
            deferred.reject();
          });
          */
          //---END---
          //+++START+++
          var data = {"status":"updated","adminId":"00000000000000-0000000","fileId":"000-000000000000000000"};
          deferred.resolve(data);
          //+++END+++
          return deferred.promise;
        };


        // Delete the file in s3. Only if an adminId is specified
        this.del = function(adminId) {
          //---START---
          // return $http['delete'](getServiceUrl(adminId));
          //---END---
          //+++START+++
          var deferred = $q.defer();
          var data = {"status":"updated","adminId":"00000000000000-0000000","fileId":"000-000000000000000000"};
          deferred.resolve(data);
          return deferred.promise;
          //+++END+++
        };

      };
      return new FileStorage();
    };
  });
})();
