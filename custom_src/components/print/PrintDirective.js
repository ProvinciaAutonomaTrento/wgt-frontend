goog.provide('ga_print_directive');

goog.require('ga_attribution_service');
goog.require('ga_browsersniffer_service');
goog.require('ga_print_style_service');
goog.require('ga_time_service');

(function () {

    var module = angular.module('ga_print_directive', [
        'ga_browsersniffer_service',
        'pascalprecht.translate',
        'ga_print_style_service',
        'ga_time_service',
        'ga_attribution_service'
    ]);

    module.controller('GaPrintDirectiveController',
        function ($rootScope, $scope, $http, $q, $window, $translate, $timeout, $sce, gaPopup, gaLayers, gaMapUtils, gaPermalink, gaBrowserSniffer, gaWaitCursor, gaPrintStyleService, gaTime, gaAttribution, gaGlobalOptions) {

        var pdfLegendsToDownload = [];
        var pdfLegendString = '_big.pdf';
        var printRectangle;
        var deregister = [];
        var POINTS_PER_INCH = 72; //PostScript points 1/72"
        var MM_PER_INCHES = 25.4;
        var UNITS_RATIO = 39.37; // inches per meter
        var POLL_INTERVAL = 2000; //interval for multi-page prints (ms)
        var POLL_MAX_TIME = 600000; //ms (10 minutes)
        var map;
        var layersYears = [];
        var canceller;
        var currentMultiPrintId;
        var format = new ol.format.GeoJSON();
        var styleId = 0;
        $scope.printConfigLoaded = false;
        $scope.options.multiprint = false;
        $scope.options.movie = false;
        $scope.options.printing = false;
        $scope.options.printsuccess = false;
        $scope.options.progress = '';

        //+++START+++
        var mapfish_version = 3; // SET 2 OR 3
        //+++END+++

        // Get print config
        var loadPrintConfig = function () {
            canceller = $q.defer();
            var http = $http.get($scope.options.printConfigUrl, {
                timeout: canceller.promise
            });
            return http;
        };

        var activate = function () {
            deregister = [
                $scope.map.on('precompose', handlePreCompose),
                $scope.map.on('postcompose', handlePostCompose),
                $scope.map.on('change:size', function (event) {
                    updatePrintRectanglePixels($scope.scale);
                }),
                $scope.map.getView().on('propertychange', function (event) {
                    updatePrintRectanglePixels($scope.scale);
                }),
                $scope.$watchGroup(['scale', 'layout'], function () {
                    updatePrintRectanglePixels($scope.scale);
                })
            ];
            $scope.scale = getOptimalScale();
            refreshComp();
        };

        var deactivate = function () {
            var item;
            while (item = deregister.pop()) {
                if (angular.isFunction(item)) {
                    item();
                } else {
                    ol.Observable.unByKey(item);
                }
            }
            refreshComp();
        };

        var refreshComp = function () {
            updatePrintRectanglePixels($scope.scale);
            $scope.map.render();
        };

        // Compose events
        var handlePreCompose = function (evt) {
            var ctx = evt.context;
            ctx.save();
        };

        var handlePostCompose = function (evt) {
            var ctx = evt.context,
                size = $scope.map.getSize(),
                minx = printRectangle[0],
                miny = printRectangle[1],
                maxx = printRectangle[2],
                maxy = printRectangle[3];

            var height = size[1] * ol.has.DEVICE_PIXEL_RATIO,
                width = size[0] * ol.has.DEVICE_PIXEL_RATIO;

            ctx.beginPath();
            // Outside polygon, must be clockwise
            ctx.moveTo(0, 0);
            ctx.lineTo(width, 0);
            ctx.lineTo(width, height);
            ctx.lineTo(0, height);
            ctx.lineTo(0, 0);
            ctx.closePath();

            // Inner polygon,must be counter-clockwise
            ctx.moveTo(minx, miny);
            ctx.lineTo(minx, maxy);
            ctx.lineTo(maxx, maxy);
            ctx.lineTo(maxx, miny);
            ctx.lineTo(minx, miny);
            ctx.closePath();

            ctx.fillStyle = 'rgba(0, 5, 25, 0.75)';
            ctx.fill();

            ctx.restore();
        };

        // Encode ol.Layer to a basic js object
        var encodeLayer = function (layer, proj) {
            var encLayer, encLegend;

            if (!(layer instanceof ol.layer.Group)) {
                var src = layer.getSource();
                var layerConfig = gaLayers.getLayer(layer.bodId) || {};
                var resolution = $scope.map.getView().getResolution();
                var minResolution = layerConfig.minResolution || 0;
                var maxResolution = layerConfig.maxResolution || Infinity;

                if (resolution <= maxResolution &&
                    resolution >= minResolution) {
                    if (src instanceof ol.source.WMTS) {
                        encLayer = $scope.encoders.layers['WMTS'].call(this,
                            layer, layerConfig);
                    } else if (src instanceof ol.source.ImageWMS ||
                        src instanceof ol.source.TileWMS) {
                        encLayer = $scope.encoders.layers['WMS'].call(this,
                            layer, layerConfig);
                    } else if (src instanceof ol.source.Vector ||
                        src instanceof ol.source.ImageVector) {
                        if (src instanceof ol.source.ImageVector) {
                            src = src.getSource();
                        }
                        var features = [];
                        var extent = getPrintRectangleCoords();
                        src.forEachFeatureInExtent(extent, function (feat) {
                            features.push(feat);
                        });

                        if (features && features.length > 0) {
                            encLayer = $scope.encoders.layers['Vector'].call(this, layer,
                                features);
                        }
                    }
                }
                // add CQL_FILTER to 'layer.customParams' if present
                // example "CQL_FILTER": "taxon_fk='926a2db1-328d-4f53-9a9b-0965f8d4622c'"
                if (encLayer && encLayer.customParams && src && src.getParams && src.getParams().CQL_FILTER) {
                    encLayer.customParams.CQL_FILTER = src.getParams().CQL_FILTER;
                }
            }

            if ($scope.options.legend && layerConfig.hasLegend) {
                encLegend = $scope.encoders.legends['ga_urllegend'].call(this,
                    layer, layerConfig);

                //---START---
                /*
                if (encLegend.classes && encLegend.classes[0] && encLegend.classes[0].icon) {
                  var legStr = encLegend.classes[0].icon;
                  if (legStr.indexOf(pdfLegendString,
                      legStr.length - pdfLegendString.length) !== -1) {
                    pdfLegendsToDownload.push(legStr);
                    encLegend = undefined;
                  }
                }
                */
                //---END---
            }
            return {
                layer: encLayer,
                legend: encLegend
            };
        };


        // Transform an ol.Color to an hexadecimal string
        var toHexa = function (olColor) {
            var hex = '#';
            for (var i = 0; i < 3; i++) {
                var part = olColor[i].toString(16);
                if (part.length === 1 && parseInt(part) < 10) {
                    hex += '0';
                }
                hex += part;
            }
            return hex;
        };

        // Transform a ol.style.Style to a print literal object
        var transformToPrintLiteral = function (feature, style) {
            /**
             * ol.style.Style properties:
             *
             *  fill: ol.style.Fill :
             *    fill: String
             *  image: ol.style.Image:
             *    anchor: array[2]
             *    rotation
             *    size: array[2]
             *    src: String
             *  stroke: ol.style.Stroke:
             *    color: String
             *    lineCap
             *    lineDash
             *    lineJoin
             *    miterLimit
             *    width: Number
             *  text
             *  zIndex
             */

            /**
             * Print server properties:
             *
             * fillColor
             * fillOpacity
             * strokeColor
             * strokeOpacity
             * strokeWidth
             * strokeLinecap
             * strokeLinejoin
             * strokeDashstyle
             * pointRadius
             * label
             * fontFamily
             * fontSize
             * fontWeight
             * fontColor
             * labelAlign
             * labelXOffset
             * labelYOffset
             * labelOutlineColor
             * labelOutlineWidth
             * graphicHeight
             * graphicOpacity
             * graphicWidth
             * graphicXOffset
             * graphicYOffset
             * zIndex
             */

            var literal = {
                zIndex: style.getZIndex()
            };
            var type = feature.getGeometry().getType();
            var fill = style.getFill();
            var stroke = style.getStroke();
            var textStyle = style.getText();
            var imageStyle = style.getImage();

            if (imageStyle) {
                var size, anchor, scale = imageStyle.getScale();
                literal.rotation = imageStyle.getRotation();

                if (imageStyle instanceof ol.style.Icon) {
                    size = imageStyle.getSize();
                    anchor = imageStyle.getAnchor();
                    literal.externalGraphic = imageStyle.getSrc();
                    literal.fillOpacity = 1;
                } else if (imageStyle instanceof ol.style.Circle) {
                    fill = imageStyle.getFill();
                    stroke = imageStyle.getStroke();
                    var radius = imageStyle.getRadius();
                    var width = 2 * radius;
                    if (stroke) {
                        width += stroke.getWidth() + 1;
                    }
                    size = [width, width];
                    anchor = [width / 2, width / 2];
                    literal.pointRadius = radius;
                }

                if (size) {
                    // Print server doesn't handle correctly 0 values for the size
                    literal.graphicWidth = (size[0] * scale || 0.1);
                    literal.graphicHeight = (size[1] * scale || 0.1);
                }
                if (anchor) {
                    literal.graphicXOffset = -anchor[0] * scale;
                    literal.graphicYOffset = -anchor[1] * scale;
                }

            }

            if (fill) {
                var color = ol.color.asArray(fill.getColor());
                literal.fillColor = toHexa(color);
                literal.fillOpacity = color[3];
            } else if (!literal.fillOpacity) {
                literal.fillOpacity = 0; // No fill
            }

            if (stroke) {
                var color = ol.color.asArray(stroke.getColor());
                literal.strokeWidth = stroke.getWidth();
                literal.strokeColor = toHexa(color);
                literal.strokeOpacity = color[3];
                literal.strokeLinecap = stroke.getLineCap() || 'round';
                literal.strokeLinejoin = stroke.getLineJoin() || 'round';

                if (stroke.getLineDash()) {
                    literal.strokeDashstyle = 'dash';
                }
                // TO FIX: Not managed by the print server
                // literal.strokeMiterlimit = stroke.getMiterLimit();
            } else {
                literal.strokeOpacity = 0; // No Stroke
            }

            if (textStyle && textStyle.getText()) {
                literal.label = textStyle.getText();

                literal.labelAlign = "cm";
                literal.fontFamily = "sans-serif";
                literal.fontSize = "10px";
                literal.fontStyle = "normal";
                literal.fontWeight = "bold";
                literal.fontColor = "#ff0000";
                literal.haloColor = "#ffffff";
                literal.haloOpacity = "1.0";
                literal.haloRadius = "1.0";

                // literal.labelAlign = textStyle.getTextAlign();
                // if (textStyle.getFill()) {
                //     var fillColor = ol.color.asArray(textStyle.getFill().getColor());
                //     literal.fontColor = toHexa(fillColor);
                // }
                // if (textStyle.getFont()) {
                //     var fontValues = textStyle.getFont().split(' ');
                //     // Fonts managed by print server: COURIER, HELVETICA, TIMES_ROMAN
                //     literal.fontFamily = fontValues[2].toUpperCase();
                //     literal.fontSize = parseInt(fontValues[1]);
                //     literal.fontWeight = fontValues[0];
                // }

                /* TO FIX: Not managed by the print server
                 if (textStyle.getStroke()) {
                 var strokeColor = ol.color.asArray(textStyle.getStroke().getColor());
                 literal.labelOutlineColor = toHexa(strokeColor);
                 literal.labelOutlineWidth = textStyle.getStroke().getWidth();
                 }*/
            }

            return literal;
        };

        // Encoders by type of layer
        $scope.encoders = {
            'layers': {
                'Layer': function (layer) {
                    var enc = {};
                    if (mapfish_version == 2) {
                        enc.layer = layer.bodId;
                        enc.layerName = layer.bodId;
                        enc.opacity = layer.getOpacity();
                    }
                    if (mapfish_version == 3) {
                        enc.name = layer.bodId;
                        enc.layerName = layer.bodId;
                        enc.opacity = layer.getOpacity();
                    }
                    return enc;
                },
                'Group': function (layer, proj) {
                    var encs = [];
                    var subLayers = layer.getLayers();
                    subLayers.forEach(function (subLayer, idx, arr) {
                        if (subLayer.visible) {
                            var enc = $scope.encoders.layers['Layer'].call(this, layer);
                            var layerEnc = encodeLayer(subLayer, proj);
                            if (layerEnc && layerEnc.layer) {
                                $.extend(enc, layerEnc);
                                encs.push(enc.layer);
                            }
                        }
                    });
                    return encs;
                },
                'Vector': function (layer, features) {
                    var enc = $scope.encoders.layers['Layer'].call(this, layer);
                    var encStyles = {};
                    var encFeatures = [];
                    var stylesDict = {};

                    // Sort features by geometry type
                    var newFeatures = [];
                    var polygons = [];
                    var lines = [];
                    var points = [];

                    angular.forEach(features, function (feature) {
                        var geotype = feature.getGeometry().getType();
                        if (/^(Polygon|MultiPolygon|Circle|GeometryCollection)$/.test(geotype)) {
                            polygons.push(feature);
                        } else if (/^(LineString|MultiLineString)$/.test(geotype)) {
                            lines.push(feature);
                        } else {
                            points.push(feature);
                        }
                    });
                    features = newFeatures.concat(polygons, lines, points);

                    angular.forEach(features, function (feature) {
                        var encoded = $scope.encoders.features.feature(layer, feature);
                        encFeatures = encFeatures.concat(encoded.encFeatures);
                        angular.extend(encStyles, encoded.encStyles);
                    });
                    //---START---
                    /*
                    angular.extend(enc, {
                      type: 'Vector',
                      styles: encStyles,
                      styleProperty: '_gx_style',
                      geoJson: {
                        type: 'FeatureCollection',
                        features: encFeatures
                      },
                      name: layer.bodId,
                      opacity: (layer.opacity != null) ? layer.opacity : 1.0
                    });
                    */
                    //---END---
                    //+++START+++
                    if (mapfish_version == 2) {
                        angular.extend(enc, {
                            type: 'Vector',
                            styles: encStyles,
                            styleProperty: '_gx_style',
                            geoJson: {
                                type: 'FeatureCollection',
                                features: encFeatures
                            },
                            name: layer.bodId,
                            opacity: (layer.opacity != null) ? layer.opacity : 1.0
                        });
                    }
                    if (mapfish_version == 3) {
                        encStyles.version = "2";
                        angular.extend(enc, {
                            type: 'geojson',
                            style: encStyles,
                            geoJson: {
                                type: 'FeatureCollection',
                                features: encFeatures
                            },
                            name: layer.bodId,
                            opacity: (layer.opacity != null) ? layer.opacity : 1.0
                        });
                    }
                    //+++END+++
                    return enc;
                },
                'WMS': function (layer, config) {
                    var enc = $scope.encoders.layers['Layer'].call(this, layer);
                    var params = layer.getSource().getParams();

                    //---START---
                    /*
                     var layers = params.LAYERS.split(',') || [];
                     var styles = (params.STYLES !== undefined) ? params.STYLES.split(',') : new Array(layers.length).join(',').split(',');
                     angular.extend(enc, {
                            type: 'WMS',
                            baseURL: config.wmsUrl || layer.url,
                            layers: layers,
                            styles: styles,
                            format: 'image/' + (config.format || 'png'),
                            customParams: {
                                'EXCEPTIONS': 'XML',
                                'TRANSPARENT': 'true',
                                'CRS': 'EPSG:21781',
                                'TIME': params.TIME
                            },
                            singleTile: config.singleTile || false
                      });

                    */
                    //---END---

                    //+++START+++
                    //gestisco i layer arcGIS
                    var layers = params.LAYERS ? (params.LAYERS.split(',') || []) : ["0"];
                    var styles = (params.STYLES !== undefined) ? params.STYLES.split(',') : new Array(layers.length).join(',').split(',');
                    if (mapfish_version == 2) {
                        angular.extend(enc, {
                            type: 'WMS',
                            baseURL: config.wmsUrl || layer.url,
                            layers: layers,
                            styles: styles,
                            format: 'image/' + (config.format || 'png'),
                            customParams: {
                                'EXCEPTIONS': 'XML',
                                'TRANSPARENT': 'true',
                                'CRS': gaGlobalOptions.defaultEpsg,
                                'TIME': params.TIME
                            },
                            singleTile: config.singleTile || false
                        });
                    }
                    if (mapfish_version == 3) {
                        angular.extend(enc, {
                            baseURL: config.wmsUrl || layer.url,
                            type: 'WMS',
                            customParams: {
                                'EXCEPTIONS': 'XML',
                                'TRANSPARENT': 'true',
                                'CRS': gaGlobalOptions.defaultEpsg,
                                'TIME': params.TIME
                            },
                            imageFormat: 'image/' + (config.format || 'png'),
                            layers: layers
                        });
                    }
                    //+++END+++

                    return enc;

                },
                'WMTS': function (layer, config) {
                    var enc = $scope.encoders.layers['Layer'].call(this, layer);
                    var source = layer.getSource();
                    var tileGrid = source.getTileGrid();
                    if (!config.background && layer.visible && config.timeEnabled) {
                        layersYears.push(layer.time);
                    }
                    //---START---
                    /*
                     angular.extend(enc, {
                     type: 'WMTS',
                     baseURL: location.protocol + '//wmts.geo.admin.ch',
                     layer: config.serverLayerName,
                     maxExtent: layer.getExtent(),
                     tileOrigin: tileGrid.getOrigin(),
                     tileSize: [tileGrid.getTileSize(), tileGrid.getTileSize()],
                     resolutions: tileGrid.getResolutions(),
                     zoomOffset: tileGrid.getMinZoom(),
                     version: '1.0.0',
                     requestEncoding: 'REST',
                     formatSuffix: config.format || 'jpeg',
                     style: 'default',
                     dimensions: ['TIME'],
                     params: {'TIME': source.getDimensions().Time},
                     matrixSet: '21781'
                     });
                     */
                    //---END---
                    //+++START+++
                    var matrices = [];
                    var capabilities_obj = source.getProperties().capabilities_obj;
                    for (var i = 0; i < capabilities_obj.TileMatrixSet.TileMatrix.length; i++) {
                        var matrix_set = capabilities_obj.TileMatrixSet.TileMatrix[i];
                        var matrix = {
                            tileSize: [matrix_set.TileWidth, matrix_set.TileHeight],
                            topLeftCorner: matrix_set.TopLeftCorner,
                            matrixSize: [matrix_set.MatrixWidth, matrix_set.MatrixHeight],
                            identifier: matrix_set.Identifier
                        };
                        if (mapfish_version == 2) {
                            matrix.resolution = tileGrid.getResolution(i);
                        }
                        if (mapfish_version == 3) {
                            matrix.scaleDenominator = matrix_set.ScaleDenominator;
                        }
                        matrices.push(matrix);
                    }

                    angular.extend(enc, {
                        type: 'WMTS',
                        baseURL: capabilities_obj.Urls.original,
                        layer: layer.getSource().getLayer(),
                        version: layer.getSource().getVersion(),
                        requestEncoding: layer.getSource().getRequestEncoding(),
                        style: layer.getSource().getStyle(),
                        matrixSet: layer.getSource().getMatrixSet()
                    });
                    if (mapfish_version == 2) {
                        enc.matrixIds = matrices;
                        enc.format = capabilities_obj.Format[0] || 'jpeg';
                    }
                    if (mapfish_version == 3) {
                        enc.matrices = matrices;
                        enc.imageFormat = 'image/' + (config.format || 'png');
                    }
                    //+++END+++

                    var multiPagesPrint = false;
                    if (config.timestamps) {
                        multiPagesPrint = !config.timestamps.some(function (ts) {
                            return ts == '99991231';
                        });
                    }
                    // printing time series
                    if (config.timeEnabled && gaTime.get() == undefined &&
                        multiPagesPrint) {
                        enc['timestamps'] = config.timestamps;
                    }

                    return enc;
                }
            },
            'features': {
                'feature': function (layer, feature, styles) {
                    var encStyles = {};
                    var encFeatures = [];
                    var encStyle = {
                        id: styleId++
                    };

                    // Get the styles of the feature
                    if (!styles) {
                        if (feature.getStyleFunction()) {
                            styles = feature.getStyleFunction().call(feature);
                        } else if (layer.getStyleFunction()) {
                            styles = layer.getStyleFunction()(feature);
                        } else {
                            styles = ol.style.defaultStyleFunction(feature);
                        }
                    }

                    // Transform an ol.geom.Circle to a ol.geom.Polygon
                    var geometry = feature.getGeometry();
                    if (geometry instanceof ol.geom.Circle) {
                        var polygon = gaPrintStyleService.olCircleToPolygon(geometry);
                        feature = new ol.Feature(polygon);
                    }

                    // Handle ol.style.RegularShape by converting points to poylgons
                    var image = styles[0].getImage();
                    if (image instanceof ol.style.RegularShape) {
                        var scale = parseFloat($scope.scale.value);
                        var resolution = scale / UNITS_RATIO / POINTS_PER_INCH;
                        feature = gaPrintStyleService.olPointToPolygon(
                            styles[0], feature, resolution);
                    }

                    // Encode a feature
                    var encFeature = format.writeFeatureObject(feature);
                    if (!encFeature.properties) {
                        encFeature.properties = {};
                    } else {
                        // Fix circular structure to JSON
                        // see: https://github.com/geoadmin/mf-geoadmin3/issues/1213
                        delete encFeature.properties.Style;
                        delete encFeature.properties.overlays;
                    }
                    encFeature.properties._gx_style = encStyle.id;
                    encFeatures.push(encFeature);

                    // Encode a style of a feature
                    if (styles && styles.length > 0) {
                        angular.extend(encStyle, transformToPrintLiteral(feature,
                            styles[0]));
                        //---START---
                        // encStyles[encStyle.id] = encStyle;
                        //---END---
                        //+++START+++
                        if (mapfish_version == 2) {
                            encStyles[encStyle.id] = encStyle;
                        }

                        if (mapfish_version == 3) {
                            var type;
                            switch (feature.getGeometry().getType()) {
                                case "MultiPolygon":
                                    type = "polygon";
                                    break;
                                case "Polygon":
                                    type = "polygon";
                                    break;
                                case "LineString":
                                    type = "line";
                                    break;
                                case "Point":
                                    if (feature.getProperties().type == "annotation") {
                                        type = "text";
                                    } else {
                                        type = "point";
                                    }
                                    break;
                            }
                            encStyle.type = type;
                            encStyles["[_gx_style = " + encStyle.id + "]"] = {
                                "symbolizers": [encStyle]
                            }
                        }
                        //+++END+++
                        var styleToEncode = styles[0];
                        // If a feature has a style with a geometryFunction defined, we
                        // must also display this geometry with the good style (used for
                        // azimuth).
                        for (var i = 0; i < styles.length; i++) {
                            var style = styles[i];
                            if (angular.isFunction(style.getGeometry())) {
                                var geom = style.getGeometry()(feature);
                                if (geom) {
                                    var encoded = $scope.encoders.features.feature(layer,
                                        new ol.Feature(geom), [style]);
                                    encFeatures = encFeatures.concat(encoded.encFeatures);
                                    angular.extend(encStyles, encoded.encStyles);
                                }
                            }
                        }
                    }

                    return {
                        encFeatures: encFeatures,
                        encStyles: encStyles
                    };
                }
            },
            'legends': {
                'ga_urllegend': function (layer, config) {
                    var format = '.png';
                    var enc = $scope.encoders.legends.base.call(this, config);
                    //---START---
                    /*
                    if ($scope.options.pdfLegendList.indexOf(layer.bodId) != -1) {
                      format = pdfLegendString;
                    }

                     enc.classes.push({
                     name: '',
                     icon: $scope.options.legendUrl +
                     layer.bodId + '_' + $translate.use() + format
                     });
                     */
                    //---END---
                    //+++START+++
                    var cls = {
                        name: layer.getProperties().label || layer.getProperties().bodId
                    };

                    var base_url;
                    var layer_name;

                    //WMS
                    try {
                        base_url = layer.getProperties().source.getUrl();
                        layer_name = layer.getProperties().source.getParams().LAYERS;
                    } catch (e) {
                    }

                    //WMTS
                    try {
                        base_url = layer.getProperties().source.getUrls()[0].replace("wmts", "wms");
                        layer_name = layer.getProperties().source.getLayer();
                    } catch (e) {
                    }

                    // Custom legend icon URL
                    // MEV4-ID26: use legend picture from layersConfig
                    if (layer.getProperties().lk_legend) {
                        // var url_legend = location.origin + location.pathname + base_url.concat(encodeURIComponent('&REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&WIDTH=20&HEIGHT=20&LAYER='.concat(layer_name)));
                        var base_url = "";
                        if (gaGlobalOptions.apiUrl.match(/^http/g)) {
                            base_url = gaGlobalOptions.apiUrl;
                        } else {
                            base_url = location.origin + "/wgt/" + gaGlobalOptions.apiUrl;
                        }
                        // console.log("base_url: " + base_url);
                        var url_legend = base_url + "/" + layer.getProperties().lk_legend;
                        // console.log("url_legend: " + url_legend);
                        enc.classes.push({
                            icons: [url_legend]
                        });
                    } else {
                        enc.classes.push({
                            name: layer.label
                        });
                    }
                    //+++END+++
                    return enc;
                },
                'base': function (config) {
                    return {
                        name: config.label,
                        classes: []
                    };
                }
            }
        };

        var getZoomFromScale = function (scale) {
            var i, len;
            var resolution = scale / UNITS_RATIO / POINTS_PER_INCH;
            var resolutions = gaMapUtils.viewResolutions;
            for (i = 0, len = resolutions.length; i < len; i++) {
                if (resolutions[i] < resolution) {
                    break;
                }
            }
            var zoom = Math.max(0, i - 1);

            return zoom;
        };

        var getNearestScale = function (target, scales) {
            var nearest = null;
            angular.forEach(scales, function (scale) {
                if (nearest == null ||
                    Math.abs(scale - target) < Math.abs(nearest - target)) {
                    nearest = scale;
                }
            });
            return nearest;
        };

        $scope.downloadUrl = function (url) {
            $scope.options.printsuccess = true;
            if (gaBrowserSniffer.msie == 9) {
                $window.open(url);
            } else {
                $window.location = url;
            }
            //After standard print, download the pdf Legends
            //if there are any
            for (var i = 0; i < pdfLegendsToDownload.length; i++) {
                $window.open(pdfLegendsToDownload[i]);
            }
            $scope.options.printing = false;
        };

        // Abort the print process
        var pollMultiPromise; // Promise of the last $timeout called
        $scope.abort = function () {
            $scope.options.printing = false;
            // Abort the current $http request
            if (canceller) {
                canceller.resolve();
            }
            // Abort the current $timeout
            if (pollMultiPromise) {
                $timeout.cancel(pollMultiPromise);
            }
            // Tell the server to cancel the print process
            if (currentMultiPrintId) {
                $http.get($scope.options.printPath + 'cancel?id=' +
                    currentMultiPrintId);
                currentMultiPrintId = null;
            }
        };

        // Start the print process
        $scope.submit = function () {
            if (!$scope.active) {
                return;
            }
            $scope.options.printsuccess = false;
            $scope.options.printing = true;
            $scope.options.progress = '';
            // http://mapfish.org/doc/print/protocol.html#print-pdf
            var view = $scope.map.getView();
            map = $scope.map;
            var proj = view.getProjection();
            var lang = $translate.use();
            var defaultPage = {};
            defaultPage['lang' + lang] = true;
            var qrcodeUrl = $scope.options.qrcodeUrl +
                encodeURIComponent(gaPermalink.getHref());
            var print_zoom = getZoomFromScale($scope.scale.value);
            qrcodeUrl = qrcodeUrl.replace(/zoom%3D(\d{1,2})/, 'zoom%3D' + print_zoom);
            var encLayers = [];
            var encLegends;
            var attributions = [];
            var thirdPartyAttributions = [];
            var layers = this.map.getLayers().getArray();
            pdfLegendsToDownload = [];
            layersYears = [];

            //EXCLUDE LAYERS "interdizione_scala_nominale"
            var layersTmp = [];
            var gaLayers = angular.element(document.body).injector().get('gaLayers');
            layers.forEach(function (layer) {
                var interdizioneScala = gaLayers.getLayerProperty(layer.bodId, 'interdizioneScalaNominale');
                if (interdizioneScala == true) {
                    var scalaNominale = gaLayers.getLayerProperty(layer.bodId, 'scalaNominale');
                    //if has a value, set it to not visible!
                    //Check if layer has value (inderdizioneScalaNominale) and (scalaNominale), otherwise skip layer
                    var printScale = $scope.scale.value;
                    if (scalaNominale != printScale) {
                        //Add the layer
                        layersTmp.push(layer);
                    }
                } else {
                    layersTmp.push(layer);
                }
            });

            layers = layersTmp;


            // Re order layer by z-index
            layers.sort(function (a, b) {
                return a.getZIndex() - b.getZIndex();
            });

            // Transform layers to literal
            layers.forEach(function (layer) {
                if (layer.visible && (!layer.timeEnabled ||
                    angular.isDefined(layer.time))) {

                    // Get all attributions to diaplay
                    var attribution = gaAttribution.getTextFromLayer(layer);
                    if (attribution !== undefined) {
                        if (layer.useThirdPartyData) {
                            if (thirdPartyAttributions.indexOf(attribution) == -1) {
                                thirdPartyAttributions.push(attribution);
                            }
                        } else if (attributions.indexOf(attribution) == -1) {
                            attributions.push(attribution);
                        }
                    }

                    // Encode layers
                    if (layer instanceof ol.layer.Group) {
                        var encs = $scope.encoders.layers['Group'].call(this,
                            layer, proj);
                        encLayers = encLayers.concat(encs);
                    } else {
                        var enc = encodeLayer(layer, proj);
                        if (enc && enc.layer) {
                            encLayers.push(enc.layer);
                            if (enc.legend) {
                                encLegends = encLegends || [];
                                encLegends.push(enc.legend);
                            }
                        }
                    }
                }
            });
            if (layersYears) {
                var years = layersYears.reduce(function (a, b) {
                    if (a.indexOf(b) < 0) {
                        a.push(b);
                    }
                    return a;
                }, []);
                years = years.map(function (ts) {
                    return ts.length > 4 ? ts.slice(0, 4) : ts;
                });
                defaultPage['timestamp'] = years.join(',');
            }

            // Transform graticule to literal
            if ($scope.options.graticule) {
                //---START---
                /*
                var graticule = {
                  'baseURL': 'https://wms.geo.admin.ch/',
                  'opacity': 1,
                  'singleTile': true,
                  'type': 'WMS',
                  'layers': ['org.epsg.grid_21781,org.epsg.grid_4326'],
                  'format': 'image/png',
                  'styles': [''],
                  'customParams': {
                    'TRANSPARENT': true
                  }
                };
                encLayers.push(graticule);
                */
                //---END---
                //+++START+++
                if (mapfish_version == 2) {
                    console.error("graticule not supported");
                }
                if (mapfish_version == 3) {
                    var graticule = {
                        "type": "grid",
                        "numberOfLines": [5, 5],
                        "haloColor": "#FFFFFF",
                        "labelColor": "black",
                        "indent": 10,
                        "haloRadius": 4,
                        "font": {
                            "size": 8,
                            "style": "BOLD"
                        }
                    }
                    encLayers.push(graticule);
                }
                //+++END+++
            }

            // Transform overlays to literal
            // FIXME this is a temporary solution
            var overlays = $scope.map.getOverlays();
            var resolution = $scope.map.getView().getResolution();

            overlays.forEach(function (overlay) {
                var elt = overlay.getElement();
                // We print only overlay added by the MarkerOverlayService
                // or by crosshair permalink
                if ($(elt).hasClass('popover')) {
                    return;
                }
                var center = overlay.getPosition();
                var offset = 5 * resolution;

                if (center) {
                    var encOverlayLayer;
                    if (mapfish_version == 2) {
                        encOverlayLayer = {
                            'type': 'Vector',
                            'styles': {
                                '1': { // Style for marker position
                                    'externalGraphic': $scope.options.markerUrl,
                                    'graphicWidth': 20,
                                    'graphicHeight': 30,
                                    // the icon is not perfectly centered in the image
                                    // these values must be the same in map.less
                                    'graphicXOffset': -12,
                                    'graphicYOffset': -30
                                },
                                '2': { // Style for measure tooltip
                                    'externalGraphic': $scope.options.bubbleUrl,
                                    'graphicWidth': 97,
                                    'graphicHeight': 27,
                                    'graphicXOffset': -46,
                                    'graphicYOffset': -27,
                                    'label': $(elt).text(),
                                    'labelXOffset': 0,
                                    'labelYOffset': 18,
                                    'fontColor': '#ffffff',
                                    'fontSize': 12,
                                    'fontWeight': 'bold'
                                }
                            },
                            'styleProperty': '_gx_style',
                            'geoJson': {
                                'type': 'FeatureCollection',
                                'features': [{
                                    'type': 'Feature',
                                    'properties': {
                                        '_gx_style': ($(elt).text() ? 2 : 1)
                                    },
                                    'geometry': {
                                        'type': 'Point',
                                        'coordinates': [center[0], center[1], 0]
                                    }
                                }]
                            },
                            'name': 'drawing',
                            'opacity': 1
                        };
                    }
                    if (mapfish_version == 3) {
                        encOverlayLayer = {
                            'type': 'geojson',
                            'style': {
                                '[_gx_style = 1]': { // Style for marker position
                                    "symbolizers": [
                                        {
                                            'externalGraphic': $scope.options.markerUrl,
                                            'graphicWidth': 20,
                                            'graphicHeight': 30,
                                            // the icon is not perfectly centered in the image
                                            // these values must be the same in map.less
                                            'graphicXOffset': -12,
                                            'graphicYOffset': -30,
                                            "fillOpacity": 1,
                                            "strokeOpacity": 0,
                                            "type": "point",
                                            "zIndex": 30
                                        }
                                    ]
                                },
                                '[_gx_style = 2]': { // Style for measure tooltip
                                    "symbolizers": [
                                        {
                                            "type": "text",
                                            "label": $(elt).text(),
                                            "labelAlign": "cm",
                                            "labelXOffset": "0.0",
                                            "labelYOffset": "10.0",
                                            "fontColor": "#ffffff",
                                            "fontSize": "10px",
                                            "fontFamily": "sans-serif",
                                            "fontStyle": "normal",
                                            "fontWeight": "bold",
                                            "haloColor": "#ff0000",
                                            "haloOpacity": "1.0",
                                            "haloRadius": "2.0",
                                            "zIndex": 30
                                        }
                                    ]
                                },
                                "version": "2"
                            },
                            'geoJson': {
                                'type': 'FeatureCollection',
                                'features': [{
                                    'type': 'Feature',
                                    'properties': {
                                        '_gx_style': ($(elt).text() ? 2 : 1),
                                        'type': 'drawing'
                                    },
                                    'geometry': {
                                        'type': 'Point',
                                        'coordinates': [center[0], center[1], 0]
                                    }
                                }]
                            },
                            'opacity': 1
                        };
                    }
                    encLayers.push(encOverlayLayer);
                }
            });

            // Get the short link
            var shortLink;
            canceller = $q.defer();
            var promise = $http.get($scope.options.shortenUrl, {
                timeout: canceller.promise,
                params: {
                    url: gaPermalink.getHref()
                }
            }).success(function (response) {
                //---START---
                //shortLink = response.shorturl.replace('/shorten', '');
                //---END---
                //+++START+++
                shortLink = location.origin + location.pathname + 'services/resolve' + response.shorturl
                //+++END+++
            });

            // Build the complete json then send it to the print server
            promise.then(function () {
                if (!$scope.options.printing) {
                    return;
                }

                // Build the correct copyright text to display
                var dataOwner = attributions.join();
                var thirdPartyDataOwner = thirdPartyAttributions.join();
                // if (dataOwner && thirdPartyDataOwner) {
                //     dataOwner = '© ' + dataOwner + ',';
                // } else if (!dataOwner && thirdPartyDataOwner) {
                //     thirdPartyDataOwner = '© ' + thirdPartyDataOwner;
                // } else if (dataOwner && !thirdPartyDataOwner) {
                //     dataOwner = '© ' + dataOwner;
                //     thirdPartyDataOwner = false;
                // }
                thirdPartyDataOwner = thirdPartyDataOwner ? thirdPartyDataOwner + " ; " + dataOwner : dataOwner;

                var movieprint = $scope.options.movie && $scope.options.multiprint;
                //---START---
                /*
                var spec = {
                  layout: $scope.layout.name,
                  srs: proj.getCode(),
                  units: proj.getUnits() || 'm',
                  rotation: -((view.getRotation() * 180.0) / Math.PI),
                  app: 'config',
                  lang: lang,
                  //use a function to get correct dpi according to layout (A4/A3)
                  dpi: getDpi($scope.layout.name, $scope.dpi),
                  layers: encLayers,
                  legends: encLegends,
                  enableLegends: (encLegends && encLegends.length > 0),
                  //qrcodeurl: qrcodeUrl,
                  movie: movieprint,
                  pages: [
                    angular.extend({
                      center: getPrintRectangleCenterCoord(),
                      bbox: getPrintRectangleCoords(),
                      display: [$scope.layout.map.width, $scope.layout.map.height],
                      // scale has to be one of the advertise by the print server
                      scale: $scope.scale.value,
                      dataOwner: dataOwner,
                      thirdPartyDataOwner: thirdPartyDataOwner,
                      shortLink: shortLink || '',
                      rotation: -((view.getRotation() * 180.0) / Math.PI)
                    }, defaultPage)
                  ]
                };
                */
                //---END---
                //+++START+++
                var spec;
                if (mapfish_version == 2) {
                    spec = {
                        layout: $scope.layout.name,
                        srs: proj.getCode(),
                        units: proj.getUnits() || 'm',
                        rotation: -((view.getRotation() * 180.0) / Math.PI),
                        app: 'config',
                        lang: lang,
                        //use a function to get correct dpi according to layout (A4/A3)
                        dpi: getDpi($scope.layout.name, $scope.dpi),
                        layers: encLayers,
                        legends: encLegends,
                        enableLegends: (encLegends && encLegends.length > 0),
                        //qrcodeurl: qrcodeUrl,
                        //movie: movieprint,
                        mapIcon: location.origin + location.pathname + 'img/logo.tn.it.png',
                        mapComment: "Provincia Autonoma di Trento",
                        pages: [
                            angular.extend({
                                center: getPrintRectangleCenterCoord(),
                                bbox: getPrintRectangleCoords(),
                                display: [$scope.layout.map.width, $scope.layout.map.height],
                                // scale has to be one of the advertise by the print server
                                scale: $scope.scale.value,
                                dataOwner: dataOwner,
                                thirdPartyDataOwner: thirdPartyDataOwner,
                                mapIcon: "http://www.mapfish.org/static/mapfish_white.png",
                                mapComment: "Provincia Autonoma di Trento",
                                shortLink: shortLink || '',
                                rotation: -((view.getRotation() * 180.0) / Math.PI)
                            }, defaultPage)
                        ]
                    }
                }
                if (mapfish_version == 3) {
                    var encLegend = {
                        name: "",
                        classes: []
                    };
                    for (var i = 0; encLegends && i < encLegends.length; i++) {
                        encLegend.classes = encLegend.classes.concat(encLegends[i].classes);
                    }
                    spec = {
                        attributes: {
                            map: {
                                layers: encLayers.reverse(),
                                projection: $scope.map.getView().getProjection().getCode(),
                                dpi: getDpi($scope.layout.name, $scope.dpi),
                                scale: $scope.scale.value,
                                center: getPrintRectangleCenterCoord(),
                                rotation: -((view.getRotation() * 180.0) / Math.PI)
                            },
                            legend: encLegend,
                            enableLegends: (encLegends && encLegends.length > 0),
                            thirdPartyDataOwner: thirdPartyDataOwner,
                            mapIcon: location.origin + location.pathname + 'img/logo.tn.it.png',
                            mapComment: "Provincia Autonoma di Trento",
                            scale: $scope.scale.value
                        },
                        layout: $scope.layout.name
                    }
                }
                //+++END+++

                var startPollTime;
                var pollErrors;
                var pollMulti = function (url) {
                    pollMultiPromise = $timeout(function () {
                        if (!$scope.options.printing) {
                            return;
                        }
                        canceller = $q.defer();
                        var http = $http.get(url, {
                            timeout: canceller.promise
                        }).success(function (data) {
                            if (!$scope.options.printing) {
                                return;
                            }
                            if (!data.getURL) {
                                // Write progress using the following logic
                                // First 60% is pdf page creationg
                                // 60-70% is merging of pdf
                                // 70-100% is writing of resulting pdf
                                if (data.filesize) {
                                    var written = data.written || 0;
                                    $scope.options.progress =
                                        (70 + Math.floor(written * 30 / data.filesize)) +
                                        '%';
                                } else if (data.total) {
                                    if (angular.isDefined(data.merged)) {
                                        $scope.options.progress =
                                            (60 + Math.floor(data.done * 10 / data.total)) +
                                            '%';
                                    } else if (angular.isDefined(data.done)) {
                                        $scope.options.progress =
                                            Math.floor(data.done * 60 / data.total) + '%';
                                    }
                                }

                                var now = new Date();
                                //We abort if we waited too long
                                if (now - startPollTime < POLL_MAX_TIME) {
                                    pollMulti(url);
                                } else {
                                    $scope.options.printing = false;
                                }
                            } else {
                                $scope.downloadUrl(data.getURL);
                            }
                        }).error(function () {
                            if ($scope.options.printing == false) {
                                pollErrors = 0;
                                return;
                            }
                            pollErrors += 1;
                            if (pollErrors > 2) {
                                $scope.options.printing = false;
                            } else {
                                pollMulti(url);
                            }
                        });
                    }, POLL_INTERVAL, false);
                };

                var printUrl = $scope.capabilities.createURL;
                //When movie is on, we use printmulti
                if (movieprint) {
                    printUrl = printUrl.replace('/print/', '/printmulti/');
                }
                canceller = $q.defer();

                //+++START+++
                printUrl = gaGlobalOptions.apiUrl + "/print/create";
                //+++END+++

                var http = $http.post(printUrl,
                    spec, {
                        timeout: canceller.promise,
                        //+++START+++
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        responseType: 'arraybuffer'
                        //+++END+++
                    }).success(function (data) {
                    //+++START+++

                    var blob = new Blob([data], {
                        type: "application/pdf"
                    });
                    var fileURL = URL.createObjectURL(blob);
                    var a = document.createElement('a');
                    a.href = fileURL;
                    a.download = 'stampa.pdf';
                    a.target = '_blank';


                    if ($window.navigator.msSaveOrOpenBlob) {
                        $window.navigator.msSaveOrOpenBlob(blob, 'stampa.pdf');
                    } else {
                        try {
                            var mClick = new MouseEvent('click', {
                                'view': $window,
                                'bubbles': true,
                                'cancelable': true
                            });
                        } catch (e) {
                            console.log("Exception creating event: " + e);
                            var mClick = document.createEvent("MouseEvent");

                            mClick.initMouseEvent("click", true, true, $window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
                            document.body.appendChild(a);
                        }
                        a.dispatchEvent(mClick);
                    }

                    $scope.options.printing = false;
                    return;
                    //+++END+++
                }).error(function () {
                    showErrorPopup();
                    $scope.options.printing = false;
                });
            });
        };

        var showErrorPopup = function () {
            var htmlpopup = '<div class="htmlpopup-container">' +
                '<div class="htmlpopup-content" translate>print_error</div>' +
                '</div>';
            var popup = gaPopup.create({
                className: 'ga-tooltip',
                title: 'error',
                content: htmlpopup
            });
            popup.open();
            //always reposition element when newly opened
            if (!gaBrowserSniffer.mobile) {
                popup.element.css({
                    left: ((map.getSize()[0] / 2) -
                        (parseFloat(popup.element.css('max-width')) / 2))
                });
            }
        };

        var getDpi = function (layoutName, dpiConfig) {
            // (20220206) In case the dpiConfig is not defined, use a default setting, which currently correspond to the
            // dpiConfig[1] used for existing A4 prints: 120
            if (!dpiConfig || !dpiConfig.length) {
                return 120;
            }

            if ((/a4/i.test(layoutName) || /a3/i.test(layoutName)) && dpiConfig.length > 1) {
                return dpiConfig[1].value;
            } else {
                return dpiConfig[0].value;
            }
        };

        var getPrintRectangleCoords = function () {
            // Framebuffer size!!
            var displayCoords = printRectangle.map(function (c) {
                return c / ol.has.DEVICE_PIXEL_RATIO
            });
            // PrintRectangle coordinates have top-left as origin
            var bottomLeft = $scope.map.getCoordinateFromPixel([displayCoords[0],
                displayCoords[3]
            ]);
            var topRight = $scope.map.getCoordinateFromPixel([displayCoords[2],
                displayCoords[1]
            ]);
            return bottomLeft.concat(topRight);
        };

        var getPrintRectangleCenterCoord = function () {
            // Framebuffer size!!
            var rect = getPrintRectangleCoords();

            var centerCoords = [rect[0] + (rect[2] - rect[0]) / 2.0,
                rect[1] + (rect[3] - rect[1]) / 2.0
            ];

            return centerCoords;
        };

        var updatePrintRectanglePixels = function (scale) {
            if ($scope.active) {
                printRectangle = calculatePageBoundsPixels(scale);
                $scope.map.render();
            }
        };

        var getOptimalScale = function () {
            var size = $scope.map.getSize();
            var resolution = $scope.map.getView().getResolution();
            var width = resolution * (size[0] - ($scope.options.widthMargin * 2));
            var height = resolution * (size[1] - ($scope.options.heightMargin * 2));
            var layoutSize = $scope.layout.map;
            var scaleWidth = width * UNITS_RATIO * POINTS_PER_INCH /
                layoutSize.width;
            var scaleHeight = height * UNITS_RATIO * POINTS_PER_INCH /
                layoutSize.height;
            var testScale = scaleWidth;
            if (scaleHeight < testScale) {
                testScale = scaleHeight;
            }
            var nextBiggest = null;
            //The algo below assumes that scales are sorted from
            //biggest (1:500) to smallest (1:2500000)
            angular.forEach($scope.scales, function (scale) {
                if (nextBiggest == null ||
                    testScale > scale.value) {
                    nextBiggest = scale;
                }
            });
            return nextBiggest;
        };

        var calculatePageBoundsPixels = function (scale) {
            var s = parseFloat(scale.value);
            var size = $scope.layout.map; // papersize in dot!
            var view = $scope.map.getView();
            var resolution = view.getResolution();
            var w = size.width / POINTS_PER_INCH * MM_PER_INCHES / 1000.0 *
                s / resolution * ol.has.DEVICE_PIXEL_RATIO;
            var h = size.height / POINTS_PER_INCH * MM_PER_INCHES / 1000.0 *
                s / resolution * ol.has.DEVICE_PIXEL_RATIO;
            var mapSize = $scope.map.getSize();
            var center = [mapSize[0] * ol.has.DEVICE_PIXEL_RATIO / 2,
                mapSize[1] * ol.has.DEVICE_PIXEL_RATIO / 2
            ];

            var minx, miny, maxx, maxy;

            minx = center[0] - (w / 2);
            miny = center[1] - (h / 2);
            maxx = center[0] + (w / 2);
            maxy = center[1] + (h / 2);
            return [minx, miny, maxx, maxy];
        };

        $scope.layers = $scope.map.getLayers().getArray();
        $scope.layerFilter = function (layer) {
            return layer.bodId == 'ch.swisstopo.zeitreihen' && layer.visible;
        };
        $scope.$watchCollection('layers | filter:layerFilter', function (lrs) {
            $scope.options.multiprint = (lrs.length == 1);
        });

        $scope.$watch('active', function (newVal, oldVal) {
            if (newVal === true) {
                if (!$scope.printConfigLoaded) {
                    loadPrintConfig().success(function (data) {
                        $scope.capabilities = data;
                        angular.forEach($scope.capabilities.layouts, function (lay) {
                            //---START---
                            //lay.stripped = lay.name.substr(2);
                            //---END---
                            //+++START+++
                            lay.stripped = lay.name;
                            //+++END+++
                        });
                        $scope.layout = data.layouts[0];
                        $scope.dpi = data.dpis;
                        $scope.scales = data.scales;
                        $scope.scale = data.scales[5];
                        $scope.options.legend = false;
                        $scope.options.graticule = false;
                        activate();
                        $scope.printConfigLoaded = true;
                    });
                } else {
                    activate();
                }
            } else {
                deactivate();
            }
        });

        // Because of the polling mechanisms, we can't rely on the
        // waitcursor from the NetworkStatusService. Multi-page
        // print might be underway without pending http request.
        $scope.$watch('options.printing', function (newVal, oldVal) {
            if (newVal === true) {
                gaWaitCursor.increment();
            } else {
                gaWaitCursor.decrement();
            }
        });


    });

    module.directive('gaPrint',
        function (gaBrowserSniffer) {
            return {
                restrict: 'A',
                scope: {
                    map: '=gaPrintMap',
                    options: '=gaPrintOptions',
                    active: '=gaPrintActive'
                },
                templateUrl: 'components/print/partials/print.html',
                controller: 'GaPrintDirectiveController',
                link: function (scope, elt, attrs, controller) {
                    scope.isIE = gaBrowserSniffer.msie;
                }
            };
        }
    );
})();
