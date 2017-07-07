goog.provide('ga_welcomemsg_directive');

goog.require('ga_login_service');
(function() {

	var module = angular.module('ga_welcomemsg_directive', [ 'ga_login_service' ]);

	module.directive('gaWelcomeMsg', function(gaLoginService, $translate) {
		return {
			restrict : 'A',
			scope : {
				helpIds : '@gaWelcomeMsg',
				optionsFunc : '&gaHelpOptions'
			},
			templateUrl : 'components/welcomemsg/partials/message.html',
			link : function(scope, element, attrs) {

				scope.user = {};

				gaLoginService.getUser().then(function(user){
					scope.user = user;
				});
				
			}
		};
	});
})();
