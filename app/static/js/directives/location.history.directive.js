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

angular.module('linc.location.history.directive', [])

.directive('locationHistory', ['$uibModal', function($uibModal) {
    return {
        transclude: true,
        restrict: 'EA',
        template: function(element, attrs) {
          switch (attrs.type) {
            case 'lion':
              return '<p><a class="btn btn-lg btn-default btn-block btn-minwidth-180" data-animation="am-fade-and-slide-top" ng-click="Lion_show()"><i class="icon icon-location-pin"></i> POSITION ON MAP</a></p>';
              default:
                return '<p><a class="btn btn-lg btn-default btn-block btn-minwidth-180" data-animation="am-fade-and-slide-top" ng-click="Imageset_show()"><i class="icon icon-location-pin"></i> POSITION ON MAP</a></p>';
          }
        },
        scope: {
          useTemplateUrl: '@',
          useCtrl: '@',
          formSize: '@',
          options: '=',
          locationGoto:'&',
          debug: '=',
          modalStatus: '='
        },
        link: function(scope, element, attrs) {
          // Lions
          scope.Lion_show = function(){
            if(scope.modalStatus.is_open) return;
            scope.modalStatus.is_open = true;
            var modalScope = scope.$new();
            modalScope.debug = scope.debug;
            var modalInstance = $uibModal.open({
              animation: true,
              backdrop  : 'static',
              keyboard: false,
              templateUrl: scope.useTemplateUrl,
              controller:  scope.useCtrl,
              size: scope.formSize,
              scope: modalScope,
              resolve: {
                options: function () {
                  return scope.options;
                },
                history: ['LincServices', function(LincServices) {
                  return LincServices.LocationHistory(scope.options.lion_id);
                }]
              }
            });
            modalInstance.result.then(function (imagesetId) {
              scope.modalStatus.is_open = false;
              scope.locationGoto({imageset_Id: imagesetId});
              console.log('Goto Imageset ' + imagesetId);
            }, function (response) {
              scope.modalStatus.is_open = false;
              console.log('Modal dismissed at: ' + new Date());
            });
          },
          // Imagesets
          scope.Imageset_show = function(){
            if(scope.modalStatus.is_open) return;
            scope.modalStatus.is_open = true;
            var modalScope = scope.$new();
            modalScope.debug = scope.debug;
            var modalInstance = $uibModal.open({
              animation: true,
              backdrop  : 'static',
              keyboard: false,
              templateUrl: scope.useTemplateUrl,
              controller:  scope.useCtrl,
              size: scope.formSize,
              scope: modalScope,
              resolve: {
                options: function () {
                  return scope.options;
                },
                history: ['LincServices', function(LincServices) {
                  if(scope.options.is_primary){
                    return LincServices.LocationHistory(scope.options.lion_id);
                  }
                  else{
                    return scope.options.history;
                  }
                }]
              }
            });
            modalInstance.result.then(function (imagesetId) {
              scope.modalStatus.is_open = false;
              scope.locationGoto({imageset_Id: imagesetId});
              console.log('Goto Imageset ' + imagesetId);
            }, function (response) {
              scope.modalStatus.is_open = false;
              console.log('Modal dismissed at: ' + new Date());
            });
          };
        }
    };
}]);
