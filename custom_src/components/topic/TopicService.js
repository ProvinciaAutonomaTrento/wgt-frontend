goog.provide('ga_topic_service');

goog.require('ga_permalink');
//+++START+++
goog.require('ga_translation_service');
//+++END+++
(function () {

    var module = angular.module('ga_topic_service', [
        'ga_permalink'
        /*+++START+++*/, 'ga_translation_service'/*+++END+++*/
    ]);

    /**
     * Topics manager
     */
    module.provider('gaTopic', function () {
        this.$get = function ($rootScope, $http, gaPermalink, gaGlobalOptions, /*+++START+++*/gaLang/*+++END+++*/) {
            var topic; // The current topic
            var topics = []; // The list of topics available

            // Load the topics config
            var loadTopicsConfig = function (url) {
                //---START---
                //return $http.get(url)
                //---END---
                //+++START+++
                return $http.get(url, {params: {lang: gaLang.get()}})
                //+++END+++
                    .then(function (response) {
                        topics = response.data.topics;
                        angular.forEach(topics, function (value) {
                            //---START---
                            //value.tooltip = 'topic_' + value.id + '_tooltip';
                            //---END---
                            //+++START+++
                            value.tooltip = value.description;
                            //+++END+++

                            value.imgLink = gaGlobalOptions.apiUrl + '/' + value.img;

                            value.langs = angular.isString(value.langs) ?
                                value.langs.split(',') : value.langs;
                            if (!value.activatedLayers) {
                                value.activatedLayers = [];
                            }
                        });
                        topic = getTopicById(gaPermalink.getParams().topic, true);
                        if (topic) {
                            broadcast();
                        }
                    });
            };

            var getTopicById = function (id, useFallbackTopic) {
                for (var i = 0, ii = topics.length; i < ii; i++) {
                    if (topics[i].id == id) {
                        return topics[i];
                    }
                }
                if (useFallbackTopic) {
                    // If the topic doesn't exist we load the default one
                    var defaultTopic = getTopicById(gaGlobalOptions.defaultTopicId,
                        false);
                    // If the default topic doesn't exist we load the first one
                    if (!defaultTopic) {
                        return topics[0];
                    }
                    return defaultTopic;
                }
            };

            var broadcast = function () {
                if (gaPermalink.getParams().topic != topic.id) {
                    gaPermalink.updateParams({topic: topic.id});
                }
                $rootScope.$broadcast('gaTopicChange', topic);
            };

            var Topic = function (topicsUrl) {

                // We load the topics configuration
                var topicsP = loadTopicsConfig(topicsUrl);

                // Returns a promise that is resolved when topics are loaded
                this.loadConfig = function () {
                    return topicsP;
                };

                //+++START+++
                this.reload = function () {
                    topicsP = loadTopicsConfig(topicsUrl);
                    return topicsP;
                };
                //+++END+++

                // Returns the topics loaded. Should be used only after the
                // load config promise is resolved.
                this.getTopics = function () {
                    return topics;
                };

                this.set = function (newTopic, force) {
                    if (newTopic) {
                        this.setById(newTopic.id, force);
                    }
                };

                this.setById = function (newTopicId, force) {
                    if (force || !topic || newTopicId != topic.id) {
                        var newTopic = getTopicById(newTopicId, false);
                        if (newTopic) {
                            topic = newTopic;
                            broadcast();
                        }
                    }
                };

                this.get = function () {
                    return topic;
                };
            };
            return new Topic(this.topicsUrl);
        };
    });
})();
