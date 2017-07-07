goog.provide('ga_catalogitem_directive');

goog.require('ga_catalogtree_directive');
goog.require('ga_layer_metadata_popup_service');
(function () {

    var module = angular.module('ga_catalogitem_directive', [
        'ga_catalogtree_directive',
        'ga_layer_metadata_popup_service'
    ]);

    /**
     * See examples on how it can be used
     */
    module.directive('gaCatalogitem',
        function ($compile, gaCatalogtreeMapUtils, gaMapUtils,
                  gaLayerMetadataPopup, gaBrowserSniffer, gaPreviewLayers, gaLayers, gaGlobalOptions, $window) {

            // Don't add preview layer if the layer is already on the map
            var addPreviewLayer = function (map, item) {
                if (!item.selectedOpen) {
                    /////// SET "INTERDIZIONE"
                    // var gaLayers = angular.element(document.body).injector().get('gaLayers');
                    var interdizioneScala = gaLayers.getLayerProperty(item.layerBodId, 'interdizioneScalaNominale');
                    if (interdizioneScala == true) {
                        var scalaNominale = gaLayers.getLayerProperty(item.layerBodId, 'scalaNominale');
                        //if has a value, set it to not visible!
                        if (!scalaNominale) {
                            $window.console.error("[addPreviewLayer] Layer has 'interdizioneScalaNominale' but no 'scalaNominale'");
                            return;
                        }

                        //Check if layer has value (inderdizioneScalaNominale) and (scalaNominale), otherwise skip layer
                        var actualScale = gaGlobalOptions.scales[map.getView().getZoom()];
                        if (scalaNominale == actualScale) {
                            //Don't add the layer
                            return;
                        }
                        $window.console.info("[addPreviewLayer] Adding Layer: " + item.layerBodId + ", scalaNominale: " + scalaNominale + ", scalaAttuale: " + actualScale);
                        gaPreviewLayers.addBodLayer(map, item.layerBodId);
                    } else {
                        //////////// PREVIOUS CODE, WITHOUT "INTERDIZIONE"
                        gaPreviewLayers.addBodLayer(map, item.layerBodId);
                    }
                }
            };

            // Remove all preview layers
            var removePreviewLayer = function (map) {
                gaPreviewLayers.removeAll(map);
            };

            //+++START+++
            var getOlLayer = function (map, item) {
                if (!item) {
                    return undefined;
                }
                return gaMapUtils.getMapOverlayForBodId(map, item.layerBodId);
            };
            //+++END+++

            return {
                restrict: 'A',
                replace: true,
                require: '^gaCatalogtree',
                templateUrl: 'components/catalogtree/partials/catalogitem.html',
                scope: {
                    item: '=gaCatalogitemItem',
                    map: '=gaCatalogitemMap',
                    options: '=gaCatalogitemOptions'
                },
                controller: function ($scope) {

                    //+++START+++
                    $scope.item.active = function (activate) {
                        var layer = getOlLayer($scope.map, $scope.item);
                        //setter called
                        if (arguments.length) {
                            if (layer) {
                                layer.visible = activate;
                            }
                            if (activate) {
                                $scope.item.selectedOpen = true;
                                // Add it if it's not already on the map
                                if (!layer) {
                                    removePreviewLayer($scope.map);
                                    gaCatalogtreeMapUtils.addLayer($scope.map, $scope.item);
                                }
                            }
                        } else { //getter called
                            return $scope.item.selectedOpen && layer && layer.visible;
                        }
                    };
                    //+++END+++

                    $scope.toggleLayer = function () {
                        removePreviewLayer($scope.map);
                        if ($scope.item.selectedOpen) {
                            gaCatalogtreeMapUtils.addLayer($scope.map, $scope.item);
                        } else {
                            var layer = gaMapUtils.getMapOverlayForBodId(
                                $scope.map, $scope.item.layerBodId);
                            $scope.map.removeLayer(layer);
                        }
                    };

                    $scope.toggle = function (evt) {
                        $scope.item.selectedOpen = !$scope.item.selectedOpen;
                        evt.preventDefault();
                        evt.stopPropagation();
                    };

                    $scope.getLegend = function (evt, bodId) {
                        gaLayerMetadataPopup.toggle(bodId);
                        evt.stopPropagation();
                    };
                },

                compile: function (tEl, tAttr) {
                    var contents = tEl.contents().remove();
                    var compiledContent;
                    return function (scope, iEl, iAttr, controller) {
                        if (!compiledContent) {
                            compiledContent = $compile(contents);
                        }

                        // Node
                        if (angular.isDefined(scope.item.children)) {
                            scope.$watch('item.selectedOpen', function (value) {
                                controller.updatePermalink(scope.item.id, value);
                            });

                            // Leaf
                        } else if (!gaBrowserSniffer.mobile) {
                            iEl.on('mouseenter', function (evt) {
                                addPreviewLayer(scope.map, scope.item);
                            }).on('mouseleave', function (evt) {
                                removePreviewLayer(scope.map);
                            });
                        }
                        compiledContent(scope, function (clone, scope) {
                            iEl.append(clone);
                        });
                    };
                }
            };
        }
    );
})();
