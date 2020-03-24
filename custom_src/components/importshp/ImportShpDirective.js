goog.provide('ga_importshp_directive');

goog.require('ga_browsersniffer_service');
goog.require('ga_filereader_service');
goog.require('ga_map_service');
goog.require('ga_urlutils_service');
goog.require('ga_styles_service');

(function() {

  var module = angular.module('ga_importshp_directive', [
    'ga_browsersniffer_service',
    'ga_filereader_service',
    'ga_map_service',
    'ga_urlutils_service',
    'pascalprecht.translate'
  ]);


  module.controller('GaImportShpDirectiveController',
    function($scope, $http, $q, $log, $translate, gaBrowserSniffer,
      gaLayers, gaUrlUtils, gaFileReader, gaMapUtils, gaStyleFactory, gaGlobalOptions, gaDefinePropertiesForLayer) {


      function isValidFileSize(fileSize) {
        if (fileSize > 20000000) { // 20mo
          alert($translate.instant('file_too_large'));
          return false;
        }
        return true;
      };

      $scope.isIE9 = (gaBrowserSniffer.msie == 9);
      $scope.isIE = !isNaN(gaBrowserSniffer.msie);
      $scope.currentTab = ($scope.isIE9) ? 2 : 1;
      $scope.file = null;
      $scope.userMessage = '';
      $scope.progress = 0;
      var fileReader = gaFileReader($scope);

      // Tabs management stuff
      $scope.activeTab = function(numTab) {
        $scope.currentTab = numTab;
        $scope.clearUserOutput();
      };
      $scope.getTabClass = function(numTab) {
        return (numTab === $scope.currentTab) ? 'active' : '';
      };

      function successCallback(response, status, headers, config) {
        $scope.userMessage = $translate.instant('upload_succeeded');
        $scope.progress = 0.5;

        function loadEPSG(epsg, callback) {
          try {
            if (epsg) {
              proj4(epsg);
            }
            callback();
          } catch (e) {
            var script = document.createElement('script');
            epsg = epsg.replace(/(EPSG:)/gi, '');
            script.src = '//epsg.io/' + epsg + '.js';
            script.onreadystatechange = callback;
            script.onload = callback;
            document.getElementsByTagName('head')[0].appendChild(script);
          }
        }

        var epsg_shp = $scope.map.getView().getProjection().getCode();
        try{
          epsg_shp = response.crs.properties.name;
        }catch(e){}

        loadEPSG(epsg_shp, function() {
          $scope.userMessage = $translate.instant('reading_file');
          $scope.progress = 0.8;
          var format = new ol.format.GeoJSON();
          var vectorSource = new ol.source.Vector({});
          var features = format.readFeatures(response);
          for (var i = 0; i < features.length; i++) {
            features[i].getGeometry().transform(new ol.proj.get(epsg_shp), new ol.proj.get(gaGlobalOptions.defaultEpsg));
          }
          vectorSource.addFeatures(features);

          var label;
          if ($scope.currentTab === 1) {
            label = $scope.file.name;
          } else {
            label = $scope.fileUrl.substr($scope.fileUrl.lastIndexOf('/') + 1);
          }

          var layerOptions = {
            id: ($scope.currentTab === 2) ? $scope.fileUrl : $scope.file.name,
            adminId: undefined,
            url: ($scope.currentTab === 2) ? $scope.fileUrl : $scope.file.name,
            type: 'SHP',
            label: label || 'SHP',
            opacity: 1,
            visible: true,
            source: vectorSource,
            extent: gaMapUtils.intersectWithDefaultExtent(vectorSource.getExtent()),
            attribution: undefined,
            style: gaStyleFactory.getStyle('shp')
          };

          // Be sure to remove all html tags
          layerOptions.label = $('<p>' + layerOptions.label + '<p>').text();
          var vectorLayer = new ol.layer.Vector(layerOptions);
          gaDefinePropertiesForLayer(vectorLayer);
          vectorLayer.useThirdPartyData = true;

          $scope.map.addLayer(vectorLayer);
          var extent = vectorLayer.getExtent();
          if (extent) {
            $scope.map.getView().fit(extent, $scope.map.getSize());
          }
          $scope.userMessage = $translate.instant('read_succeeded');
          $scope.progress = 0;
        });
      }

      // Load a SHP file
      $scope.loadSHP = function() {
        if ($scope.currentTab === 1) {
          $scope.handleFile();
        } else {
          $scope.handleFileUrl();
        }
      };

      // Handle fileURL
      $scope.handleFileUrl = function() {
        if ($scope.fileUrl) {
          $scope.cancel(); // Kill the current uploading
          $scope.fileContent = null;
          $scope.userMessage = $translate.instant('uploading_file');
          $scope.progress = 0.1;
          $scope.canceler = $q.defer();

          $http.get('services/convertShpUrl', {
              params: {
                url: $scope.fileUrl
              }
            }).success(successCallback)
            .error(function(error, status, headers, config) {
              $scope.userMessage = $translate.instant('upload_failed');
              $scope.progress = 0;
            });
        }
        $scope.isDropped = false;
      };

      // Handle a File (from a FileList),
      // works only with FileAPI
      $scope.handleFile = function() {
        if ($scope.file) {
          $scope.cancel(); // Kill the current uploading
          $scope.fileContent = null;
          $scope.userMessage = $translate.instant('uploading_file');
          $scope.progress = 0.1;

          var data = {}; //file object
          var fd = new FormData();
          fd.append('file', $scope.file);
          $http.post('services/convertShpFile', fd, {
              withCredentials: false,
              headers: {
                'Content-Type': undefined
              },
              transformRequest: angular.identity,
              params: fd
            })
            .success(successCallback)
            .error(function(error, status, headers, config) {
              $scope.userMessage = $translate.instant('upload_failed');
              $scope.progress = 0;
            });
        }
        $scope.isDropped = false;
      };

      // Handle a FileList (from input[type=file] or DnD),
      // works only with FileAPI
      $scope.handleFileList = function() {
        if ($scope.files && $scope.files.length > 0) {
          var file = $scope.files[0];
          if (isValidFileSize(file.size)) {
            $scope.file = file;
            $scope.fileSize = file.size;
            if ($scope.isDropped) {
              $scope.handleFile();
            }
          }
        }
      };

      $scope.clearUserOutput = function() {
        $scope.userMessage = '';
        $scope.progress = 0;
      };

      $scope.cancel = function() {
        $scope.userMessage = $translate.instant('operation_canceled');
        $scope.progress = 0;
        // Kill file reading
        fileReader.abort();
        // Kill $http request
        if ($scope.canceler) {
          $scope.canceler.resolve();
        }
      };

      $scope.reset = function() {
        $scope.cancel();
        $scope.clearUserOutput();
        $scope.file = null;
        $scope.files = null;
        $scope.fileUrl = null;
        $scope.fileContent = null;
      };
    }
  );

  module.directive('gaImportShp',
    function($log, $compile, $document, $translate, gaBrowserSniffer,
      gaUrlUtils) {
      return {
        restrict: 'A',
        templateUrl: 'components/importshp/partials/importshp.html',
        scope: {
          map: '=gaImportShpMap',
          options: '=gaImportShpOptions'
        },
        controller: 'GaImportShpDirectiveController',
        link: function(scope, elt, attrs, controller) {

          // Use a local SHP file only available on browser
          // more recent than ie9
          if (!gaBrowserSniffer.msie || gaBrowserSniffer.msie > 9) {

            var triggerInputFileClick = function() {
              elt.find('input[type="file"]').click();
            };

            // Trigger the hidden input[type=file] onclick event
            elt.find('button.ga-import-shp-browse').
            click(triggerInputFileClick);
            elt.find('input[type=text][readonly]').
            click(triggerInputFileClick);

            // Register input[type=file] onchange event, use HTML5 File api
            elt.find('input[type=file]').bind('change', function(evt) {
              if (evt.target.files && evt.target.files.length > 0) {
                scope.clearUserOutput();
                scope.$apply(function() {
                  scope.files = evt.target.files;
                });
              }
            });


            // Register drag'n'drop events on <body>
            var dropZone = angular.element(
              '<div class="ga-import-shp-drop-zone">' +
              '  <div translate>drop_me_here</div>' +
              '</div>');

            // Block drag of all elements by default to avoid unwanted display
            // of dropzone.
            $document.on('dragstart', function() {
              return false;
            });

            // Hide the drop zone on click, used when for some reasons unknown
            // the element stays displayed. See:
            // https://github.com/geoadmin/mf-geoadmin3/issues/1908
            dropZone.click(function() {
              this.style.display = 'none';
            });

            // We use $compile only for the translation,
            // $translate.instant("drop_me_here") didn't work in prod mode
            $compile(dropZone)(scope);

            var dragEnterZone = angular.element(document.body);
            dragEnterZone.append(dropZone);
            dragEnterZone.bind('dragenter', function(evt) {
              evt.stopPropagation();
              evt.preventDefault();
              var types = evt.originalEvent.dataTransfer.types;
              if (types) {
                var i, len = types.length;
                for (i = 0; i < len; ++i) {
                  if (['files', 'text/plain']
                    .indexOf(types[i].toLowerCase()) > -1) {
                    dropZone.css('display', 'table');
                    break;
                  }
                }
              }
            });

            dropZone.bind('dragleave', function(evt) {
              evt.stopPropagation();
              evt.preventDefault();
              this.style.display = 'none';
            });

            dropZone.bind('dragover', function(evt) {
              evt.stopPropagation();
              evt.preventDefault();
            });

            dropZone.bind('drop', function(evt) {
              evt.stopPropagation();
              evt.preventDefault();
              this.style.display = 'none';

              // A file, an <a> html tag or a plain text url can be dropped
              var files = evt.originalEvent.dataTransfer.files;

              if (files && files.length > 0) {
                scope.$apply(function() {
                  scope.isDropped = true;
                  scope.files = files;
                  scope.currentTab = 1;
                });

              } else if (evt.originalEvent.dataTransfer.types) {
                // No files so may be it's HTML link or a URL which has been
                // dropped
                var text = evt.originalEvent.dataTransfer
                  .getData('text/plain');

                if (gaUrlUtils.isValid(text)) {
                  scope.$apply(function() {
                    scope.isDropped = true;
                    scope.fileUrl = text;
                    scope.currentTab = 2;
                  });

                } else {
                  alert($translate.instant('drop_invalid_url') + text);
                }

              } else {
                // No FileAPI available
              }
            });

            // Watchers
            scope.$watchCollection('files', function() {
              scope.clearUserOutput();
              scope.handleFileList();
            });
          }

          scope.$watch('fileUrl', function() {
            scope.clearUserOutput();
            if (scope.isDropped) {
              scope.handleFileUrl();
            }
          });

        }
      };
    }
  );
})();
