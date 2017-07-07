goog.provide('ga_attribution_service');

goog.require('ga_map_service');
goog.require('ga_translation_service');
goog.require('ga_urlutils_service');

(function() {

  var module = angular.module('ga_attribution_service', [
    'ga_map_service',
    'ga_translation_service',
    'ga_urlutils_service'
  ]);

  /**
   * Attribution manager
   * We display an attribution only if the layer is from bod or from an
   * external service. No attribution for local data displayed with DnD.
   */
  module.provider('gaAttribution', function() {
    this.$get = function(gaUrlUtils, gaLang, gaLayers) {
      var attribs = {};
      var getBodLayerAttribution = function(bodId, useConfig3d) {
        var config = gaLayers.getLayer(bodId);
        if (useConfig3d) {
          config = gaLayers.getConfig3d(config);
        }
        //---START---
        /*
        var key = config.attribution;
        var lang = gaLang.get();
        if (!attribs[lang]) {
          attribs[lang] = {};
        }
        if (!attribs[lang][key]) {
          attribs[lang][key] = '<a target="new" href="' + config.attributionUrl + '">' + config.attribution + '</a>';
        }
        */
        //---END---
        //+++START+++
        var key = bodId;
        var lang = gaLang.get();
        if (!attribs[lang]) {
          attribs[lang] = {};
        }
        if (!attribs[lang][key] && config.l_lk_copyright){
          if (config.lk_copyright){
              attribs[lang][key] = '<a target="new" href="' + config.lk_copyright + '">' + config.l_lk_copyright + '</a>';
          }else{
              attribs[lang][key] = config.l_lk_copyright;
          }
        }
        //+++END+++
        return attribs[lang][key];
      };

      var Attribution = function() {

        // Get the attribution of a layer without HTML.
        this.getTextFromLayer = function(layer) {
          if (gaUrlUtils.isValid(layer.url)) {
            return gaUrlUtils.getHostname(layer.url);
          } else if (layer.bodId) {
            //---START---
            // return gaLayers.getLayerProperty(layer.bodId, 'attribution');
            //---END---
            //+++START+++
            return gaLayers.getLayerProperty(layer.bodId, 'l_lk_copyright');
            //+++END+++
          }
        };

        // Get the HTML attribution of a layer.
        this.getHtmlFromLayer = function(layer, useConfig3d) {
          var id = layer.bodId || layer.url;
          if (gaUrlUtils.isValid(id)) {
            var hostname = gaUrlUtils.getHostname(id);
            if (gaUrlUtils.isThirdPartyValid(id)) {
              return '<span class="ga-warning-tooltip">' + hostname + '</span>';
            }
            return hostname;
          } else if (gaLayers.getLayer(id)) {
            return getBodLayerAttribution(id, useConfig3d);
          }
        };
      };
      return new Attribution();
    };
  });
})();
