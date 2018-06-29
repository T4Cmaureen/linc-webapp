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

angular.module('linc.cvresults.directive', [])

.directive('cvresults', ['$uibModal', '$interval', function($uibModal, $interval) {
	return {
		transclude: true,
		restrict: 'EA',
		replace: true,
		template: function(element, attrs) {
			switch (attrs.type) { //view selection. Put type='new' or type='search'
				case 'search':
					return '<button class="btn btn-primary btn-sm" data-animation="am-fade-and-slide-top" ng-click="show()">'+
								 '<span ng-if="loading" class="text-center">'+
								 '<img src="/static/images/loading.gif"/></span>'+
								 '<i class="icon icon-flash"></i>CV Results</button>';
				default:
					return '<p><a class="btn btn-lg btn-default btn-block btn-minwidth-180" data-animation="am-fade-and-slide-top" ng-click="show()">'+
								 '<span ng-if="loading" class="text-center">'+
								 '<img src="/static/images/loading.gif"/></span>'+
								 '<i class="icon icon-flash"></i> VIEW CV RESULTS</a></p>';
			}
		},
		scope: {
			useTemplateUrl: '@',
			useCtrl: '@',
			formSize: '@',
			imageset: '=',
			cvresultsId: '=',
			cvrequestId: '=',
			cvResultErased: '&',
			debug: '=',
			modalStatus: '=',
			imagesetUpdated:'&',
		},
		link: function(scope, element, attrs) {
			scope.show = function(){
				if(scope.modalStatus.is_open) return;
				scope.modalStatus.is_open = true;
				var modalScope = scope.$new();
				modalScope.debug = scope.debug;
				modalScope.ResultsErased = false;
				modalScope.Associated_Data = null;
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
						cvrequestId: function () {
							return scope.cvrequestId;
						},
						cvresultsId: function () {
							return scope.cvresultsId;
						},
						data_cvresults: ['LincServices', function(LincServices) {
							return LincServices.GetCVResults(scope.cvresultsId);
						}]
					}
				});
				var poller_promisse = undefined;
				modalScope.get_poller_promisse = function(){
					return poller_promisse;
				};
				modalScope.set_poller_promisse = function(val){
					poller_promisse = val;
				};
				modalScope.cancel_Poller = function () {
					if(poller_promisse){
						$interval.cancel(poller_promisse);
						poller_promisse = undefined;
						console.log("CV Results Poller canceled");
					}
				};
				modalScope.Updated = function (data) {
					modalScope.Associated_Data = data;
				};
				modalScope.EraseResults = function () {
					modalScope.ResultsErased = true;
				};
				modalInstance.result.then(function () {
					modalScope.cancel_Poller();
					scope.modalStatus.is_open = false;
					if(modalScope.ResultsErased)
						scope.cvResultErased({'imagesetId': scope.imageset.id});
					if(modalScope.Associated_Data != null)
						scope.imagesetUpdated({'data': modalScope.Associated_Data, 'imagesetId': scope.imageset.id});
					console.log('Modal ok');
					scope.loading = false;
				}, function (error) {
					modalScope.cancel_Poller();
					scope.modalStatus.is_open = false;
					scope.loading = false;
					console.log('Modal dismissed at: ' + new Date());
				});
			};
		}
	};
}]);
