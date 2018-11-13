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

angular.module('linc.cvrequest.directive', [])

.directive('cvrequest', ['$uibModal', 'LincServices', 'NotificationFactory', function($uibModal, LincServices, NotificationFactory){
	return {
		transclude: true,
		restrict: 'EA',
		replace: true,
		template: function(element, attrs) {
			switch (attrs.type) { //view selection. Put type='new' or type='search'
				case 'search':
					return '<button class="btn btn-default btn-sm" ng-class="{error: cvReqError}"'+
							   'uib-tooltip="An error occurred in the last Find Lion Match" tooltip-enable="cvReqError"'+
							   'data-animation="am-fade-and-slide-top" ng-click="show()">'+
								 '<span ng-if="loading" class="loading text-center">'+
								 '<img src="/static/images/loading.gif"/></span>'+
								 '<i ng-if="cvReqError" class="icon icon-info"></i>'+
								 '<i ng-if="!cvReqError" class="icon icon-flash"></i>'+
								 '{{ cvReqError ? "Find Lion Match" : "Find Lion Match"}}'+
							'</button>';
					default:
						return '<p><a class="btn btn-lg btn-default btn-block btn-minwidth-180" ng-class="{error: cvReqError}"'+
								   'uib-tooltip="An error occurred in the last Find Lion Match" tooltip-enable="cvReqError"'+
								   ' data-animation="am-fade-and-slide-top" ng-click="show()">'+
									 '<span ng-if="loading" class="text-center">'+
									 '<img src="/static/images/loading.gif"/></span>'+
									 '<i ng-if="cvReqError" class="icon icon-info"></i>'+
									 '<i ng-if="!cvReqError" class="icon icon-flash"></i>'+
									 '{{ cvReqError ? "Find Lion Match" : "Find Lion Match"}}'+
							   '</a></p>';
			}
		},
		scope: {
			useTemplateUrl: '@',
			useCtrl: '@',
			formSize: '@',
			imageset: '=',
			cvRequestSuccess: '&',
			updateCvStatus: '&',
			debug: '=',
			modalStatus: '=',
			cvReqError: '='
		},
		link: function(scope, element, attrs) {
			console.log(scope.cvReqError);
			scope.show = function(){
				if(scope.modalStatus.is_open) return;
				scope.modalStatus.is_open = true;
				LincServices.CVRequirements({ id: scope.imageset.id }).then(function(response){

					if(!response.cv && !response.whisker){
						NotificationFactory.warning({
							title: "Waring", message: 'There are no images defined with "CV" or "Whisker" type.\n'+
							"You must define, in the image gallery, at least one image with the cv or whisker tag.",
							position: 'right',
							duration: 8000
						});
						scope.modalStatus.is_open = false;
						return;
					}

					scope.cv_requirements = { cv: response.cv, whisker: response.whisker };
					var modalScope = scope.$new();
					modalScope.debug = scope.debug;
					scope.loading = true;
					var modalInstance = $uibModal.open({
						animation: true,
						backdrop  : 'static',
						templateUrl: scope.useTemplateUrl,
						controller:  scope.useCtrl,
						size: scope.formSize,
						scope: modalScope,
						windowClass: 'large-modal',
						resolve: {
							imageset: function () {
								return scope.imageset;
							},
							lions: ['LincServices', function(LincServices) {
								return LincServices.Lions().then(function(lions){
									return _.map(lions, function(lion){
										var elem = {};
										elem['has_data'] = {
											cv: _.includes(response.cv_lion_list, lion.id),
											whisker: _.includes(response.whisker_lion_list, lion.id)
										};
										return _.extend({}, lion, elem);
									});
								});
							}],
							cvrequests_options: ['LincDataFactory', function(LincDataFactory) {
								return LincDataFactory.get_cvrequests();
							}]
						}
					});
					modalInstance.result.then(function (cvrequest) {
						scope.modalStatus.is_open = false;
						scope.cvRequestSuccess({imageset_Id: scope.imageset.id, request_Obj: cvrequest});
						scope.loading = false;
						console.log('Modal ok ' + cvrequest);
					}, function () {
						scope.modalStatus.is_open = false;
						scope.loading = false;
						console.log('Modal dismissed at: ' + new Date());
					});
				},function(error){
					scope.modalStatus.is_open = false;
					if(error.status == 409){
						scope.updateCvStatus({response: {imageset: error.imageset, status: error.data.data.status}});
					}
				});
			};
		}
	};
}]);
