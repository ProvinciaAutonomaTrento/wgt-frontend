goog.provide('ga_translation_service');

goog.require('ga_permalink_service');
//---START---
//goog.require('ga_topic_service');
//---END---
(function() {

  var module = angular.module('ga_translation_service', [
    'ga_permalink_service'
    //---START---
    //,'ga_topic_service'
    //---END---
  ]);

  /**
   * Lang manager
   */
  module.provider('gaLang', function() {
    this.$get = function($window, $rootScope, $translate, gaPermalink,
        gaGlobalOptions/*---START--- , gaTopic ---END---*/) {
      var lang = gaPermalink.getParams().lang ||
          ($window.navigator.userLanguage ||
          $window.navigator.language).split('-')[0];

      if (gaGlobalOptions.languages.indexOf(lang) === -1) {
        lang = gaGlobalOptions.translationFallbackCode;
      }

      // Verify if a language is supported by the current topic
      var isLangSupportedByTopic = function(lang, topic) {
        if (!topic) {
          return true;
        }
        var langs = gaTopic.get().langs;
        return (langs.indexOf(lang) != -1);
      };

      // Load translations via $translate service
      var loadTranslations = function(newLang, newTopic) {
        //---START---
        /*
        if (!isLangSupportedByTopic(newLang, newTopic)) {
          newLang = gaGlobalOptions.translationFallbackCode;
        }
        */
        //---END---
        if (newLang != $translate.use()) {
          lang = newLang;
          $translate.use(lang).then(angular.noop, function() {
            // failed to load lang from server, fallback to default code.
            loadTranslations(gaGlobalOptions.translationFallbackCode);
          })['finally'](function() {
            gaPermalink.updateParams({lang: lang});
          });
        }
      };

      //---START---
      //loadTranslations(lang, gaTopic.get());
      //---END---
      //+++START+++
      loadTranslations(lang);
      //+++END+++

      // Switch the language if the not available for the new topic;
      $rootScope.$on('gaTopicChange', function(event, newTopic) {
        loadTranslations(lang, newTopic);
      });

      var Lang = function() {

        this.set = function(newLang) {
          //---START---
          //loadTranslations(newLang, gaTopic.get());
          //---END---
          //+++START+++
          loadTranslations(newLang);
          //+++END+++
        };

        this.get = function() {
          return $translate.use() || lang;
        };
      };
      return new Lang();
    };
  });
})();
