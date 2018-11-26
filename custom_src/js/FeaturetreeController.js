goog.provide('ga_featuretree_controller');

goog.require('ga_print_service');
(function () {

    var module = angular.module('ga_featuretree_controller', [
        'ga_print_service'
    ]);

    module.controller('GaFeaturetreeController', function ($http, $scope,
                                                           $timeout, $translate, $window, gaGlobalOptions, gaPrintService, gaLayers) {

        var featureTreeId = '#featuretree-popup';
        // List of layers using an extendHtmlPoup for the print instead of htmlPopup
        var extended = {
            'ch.bazl.luftfahrthindernis': true
        };

        $scope.options = {
            msUrl: gaGlobalOptions.cachedApiUrl + '/MapServer',
            featuresShown: false,
            hasMoreResults: false,
            nbFeatures: 0,
            max: 200
        };


        $scope.getItemText = function () {
            return '(' + (($scope.options.hasMoreResults) ? '+' : '') +
                $scope.options.nbFeatures + ')';

        };
        // When the results of query tool are updated, we collapse/expand the
        // features tree accordion, then we update the feature tree
        $scope.$on('gaQueryResultsUpdated', function (evt, featuresByLayer) {
            evt.stopPropagation();
            var show = false, nbFeatures = 0, hasMoreResults = false;
            angular.forEach(featuresByLayer, function (layer) {
                if (layer.features && layer.features.length > 0) {
                    show = true;
                    hasMoreResults = (hasMoreResults || layer.hasMoreResults);
                    nbFeatures += layer.features.length;
                }

            });
            $scope.options.nbFeatures = nbFeatures;
            $scope.options.featuresShown = show;
            $scope.options.hasMoreResults = hasMoreResults;
            $scope.$broadcast('gaNewFeatureTree', featuresByLayer);
        });


        // Print popup stuff
        var featureTree, winPrint, useNewTab;
        $scope.printInProgress = false;
        $scope.printProgressPercentage = 0;
        $scope.print = function () {
            console.log('print');
            var printElementsTotal = $scope.options.nbFeatures;
            if (printElementsTotal === 0) {
                return;
            }

            // We determine if need to open the popup in a new tab (extended tooltip)
            // or a new window (default)
            useNewTab = false;
            for (var layerBodId in featureTree) {
                if (extended[layerBodId]) {
                    useNewTab = true;
                    break;
                }
            }
            if (winPrint) {
                winPrint.close();
            }
            if (useNewTab) {
                // Code needed to open in a new tab on Chrome
                winPrint = window.open('', 'printout');
            }

            var lang = $translate.use();
            var printElementsLoaded = 0;
            var printLayers = [];
            printLayers.failure = {
                head: null,
                body: ''
            };
            $scope.printInProgress = true;
            $scope.printProgressPercentage = 0;

            var printElementLoaded = function (html, bodId) {
                if (/(<html|<head|<body)/i.test(html)) { // extendedHtmlPopup
                    var head = /<head[^>]*>((.|[\n\r])*)<\/head>/.exec(html)[1];
                    var body = /<body[^>]*>((.|[\n\r])*)<\/body>/.exec(html)[1];
                    printLayers[bodId].head = head;
                    printLayers[bodId].body += body;
                } else { // htmlPopup
                    printLayers[bodId].body += html;
                }
                printElementsLoaded++;
                $scope.printProgressPercentage = Math.round(printElementsLoaded /
                    printElementsTotal * 100);
                if (printElementsTotal == printElementsLoaded &&
                    $scope.printInProgress) {
                    printFinished(printLayers);
                }
            };

         /*   var onSucccessFunction = function onSuccessFunction(data, status, headers, config) {
                printElementLoaded(data, bodId);
            };
            var onErrorFunction = function onErrorFunction(data, status, headers, config) {
                printElementLoaded('<div>' +
                    'There was a problem loading this feature. Layer: ' + bodId +
                    ', feature: ' + layer.features[i].id +
                    ', status: ' + status + '<div>', 'failure');
            };*/

            console.log('print2');
            var promiseArray = [];
            var externalArray = [];
            for (var bodId in featureTree) {
                var layer = featureTree[bodId];
                printLayers[bodId] = {
                    head: null,
                    body: ''
                };
                if (gaLayers.getLayerProperty(bodId, 'wmsSource') =='internal'){



                var layerUrl = $scope.options.msUrl + '/htmlPopup';

                for (var i in layer.features) {
                    promiseArray.push($http.get(
                        layerUrl,
                        {
                            params: {
                                lang: lang,
                                layer: bodId,
                                feature: layer.features[i].id,
                                coord: [1, 1],
                                imageDisplay: [1, 1, 1],
                                mapExtent:[0,0,1,1]

                            }
                        }));
                    /**.success(onSucccessFunction)
                     .error(onErrorFunction);*/
                }
                }else {

                    for (var i in layer.features) {
                        var featurehtml =
                            '<div id="{{id}}" class="htmlpopup-container">' +
                            '<div class="htmlpopup-header">' +
                            '{{name}}' +
                            '</div>' +
                            '<div class="htmlpopup-content">' +
                            '{{properties}}' +
                            '</div>' +
                            '</div><br/>';
                        var name = layer.features[i].layerName; // else must get feature id and take the part of string 0...(firstIndexOf(.))
                        var featureId = layer.features[i].id;
                        var layerId = layer.features[i].layerId || layer.features[i].bodId || layer.features[i].layerBodId;
                        var id = layerId + '#' + featureId;

                        var properties = '';
                        if (layer.features[i].properties !== undefined && Object.keys(layer.features[i].properties).length > 0) {
                            properties += '<table>';
                            angular.forEach(layer.features[i].properties, function (singleProperty, key) {
                                properties += '<tr><td>' + key + '</td><td>' + singleProperty + '</td></tr>';
                            });
                            properties += '</table>';
                        }
                        featurehtml = featurehtml.replace('{{id}}', id).replace('{{properties}}', properties || '').replace('{{name}}', (name) ? '(' + name + ')' : '');

                        externalArray.push({
                            'layerId':layerId,
                            'html':featurehtml
                        });
                    }


                }


            }

            var recFunc = function (promiseArray, index) {
                // const recFunc = (promiseArray, index) => {

                if (promiseArray.length === index) {

                    for (var i in externalArray) {
                        printElementLoaded(externalArray[i].html, externalArray[i].layerId);

                    }

                    return;
                }
                console.log('Processing index', index);
                promiseArray[index]
                    .success(function onSuccessFunction(data, status, headers, config) {
                        printElementLoaded(data, bodId);
                        index = index + 1;
                        recFunc(promiseArray, index);
                    })
                    .error( function onErrorFunction(data, status, headers, config) {
                        printElementLoaded('<div>' +
                            'There was a problem loading this feature. Layer: ' + bodId +
                            ', feature: ' + layer.features[i].id +
                            ', status: ' + status + '<div>', 'failure');
                        index = index + 1;
                        recFunc(promiseArray, index);
                    });

            };

            // Implementing a semaphore for promise call
            recFunc(promiseArray, 0);

        };

        var printFinished = function (printLayers) {
            $scope.printInProgress = false;
            $scope.printProgressPercentage = 0;
            var head = '';
            var body = '';
            for (var bodId in printLayers) {
                if (printLayers[bodId].head) {
                    head += printLayers[bodId].head;
                }
                body += printLayers[bodId].body;
            }
            gaPrintService.htmlPrintout(body, head || undefined,
                (useNewTab) ? function () {
                } : undefined);
        };

        var ftPopup = $(featureTreeId);
        $scope.$on('gaUpdateFeatureTree', function (evt, tree) {
            featureTree = tree;

            // Open popup when it's reduced
            if ($scope.globals.isFeatureTreeActive &&
                ftPopup.hasClass('ga-popup-reduced')) {
                $scope.globals.isFeatureTreeActive = false;
            }
            evt.stopPropagation();

        });

        $scope.$on('gaGetMoreFeatureTree', function (evt, layer) {
            $scope.$broadcast('gaQueryMore', layer.bodId, layer.offset +
                $scope.options.max,  $scope.options.max+1);
            evt.stopPropagation();
        });

        //+++START+++
        $scope.options.popup = {
            title: 'object_information',
            showPrint: true,
            print: $scope.print,
            help: '68',
            close: function () {
                console.log('close');
                $scope.options.nbFeatures = 0;
            }
        }
        //+++END+++


    });
})();
