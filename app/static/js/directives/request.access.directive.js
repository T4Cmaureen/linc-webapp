/* jshint unused:vars */
// LINC is an open source shared database and facial recognition
// system that allows for collaboration in wildlife monitoring.
// Copyright (C) 2016  Wildlifeguardians
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.
//
// For more information or to contact visit linclion.org or email tech@linclion.org
'use strict';

angular.module('linc.request.access.directive', [])

.directive('requestAcess', ['$uibModal', function($uibModal) {
	return {
		transclude: true,
		replace: true,
		restrict: 'EA',
		template: '<a ng-click="requestAcess()" target="_top" class="request-access">Request access to LINC</a>',
		scope: {
			useTemplateUrl: '@',
			useCtrl: '@',
			formSize: '@'
		},
		
		link: function(scope, element, attrs) {
			scope.requestAcess = function(){
				var modalScope = scope.$new();
				var modalInstance = $uibModal.open({
					animation: true,
					backdrop  : 'static',
					templateUrl: scope.useTemplateUrl,
					controller:  scope.useCtrl,
					size: scope.formSize,
					scope: modalScope
				});
				modalInstance.result.then(function (result) {
					console.log('Modal ok' + result);
				}, function (error) {
					console.log('Modal dismissed at: ' + new Date());
				});
			}
		}
	};
}]);
