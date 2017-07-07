goog.provide('ga_login_directive');

goog.require('ga_login_service');
(function() {

  var module = angular.module('ga_login_directive', ['ga_login_service']);

  module.directive('gaLogin', function(gaLoginService) {
    return {
      restrict: 'A',
      scope: {
        helpIds: '@gaLogin',
        optionsFunc: '&gaHelpOptions'
      },
      templateUrl: 'components/login/partials/login.html',
      link: function(scope, element, attrs) {}
    };
  });

  module.directive('gaLogout', function(gaLoginService) {
    return {
      restrict: 'A',
      scope: {
        helpIds: '@gaLogin',
        optionsFunc: '&gaHelpOptions'
      },
      templateUrl: 'components/login/partials/logout.html',
      link: function(scope, element, attrs) {
      }
    };
  });

  module.directive('gaLoginAction', function($rootScope, $sce, gaLoginService, gaPopup) {

    return {
      restrict: 'A',
      link: function(scope, element, attrs) {

        gaLoginService.getUser().then(function(usr) {
          var popup;
          var results = [];
          var helpIds = attrs['gaLoginAction'];

          var shown = false;
          element.on('click', function(evt) {
            if (evt) {
              evt.preventDefault();
              evt.stopPropagation();
            }
            scope.$applyAsync(function() {
              displayHelp(evt);
            });
          });

          var displayHelp = function(evt) {
            if (angular.isDefined(popup)) {
              if (shown) {
                popup.close();
              } else {
                popup.open();
                shown = true;
              }
            } else if (helpIds) {
              var ids = helpIds.split(',');

              // Create the popup
              popup = gaPopup.create({
                className: 'ga-help-popup',
                destroyOnClose: false,
                title: usr.auth ? 'Logout' : 'Login',
                content: usr.auth ? '<div ga-logout></div>' : '<div ga-login></div>',
                showPrint: false,
                onCloseCallback: function() {
                  shown = false;
                }
              });

              popup.open();
              shown = true;

              // react on language change
              $rootScope.$on('$translateChangeEnd', function() {
                // Remove old content _without destroying the array_
                // The below is used because it's fastest and is
                // best supported across browsers
                while (results.length > 0) {
                  results.pop();
                }
                updateContent(false);
              });
            }
          };

        });
      }
    };
  });

})();
