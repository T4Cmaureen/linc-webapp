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

angular.module('linc.location.on.map.directive', [])

.directive('locationOnMap', ['$uibModal', function($uibModal) {
    return {
        transclude: true,
        replace: true,
        restrict: 'EA',
        template: '<button style="padding: 5px 2px 0px 2px; background-color: #eee; color: #d95210;" class="btn btn-secondary" type="button"'+ 
                    'uib-tooltip="Select Location on Map" tooltip-is-open="tooltip.open" ng-click="show()">'+
                      '<i class="icon icon-location-pin" style="font-size: 18px;"></i>'+
                  '</button>',
        scope: {
          useTemplateUrl: '@',
          useCtrl: '@',
          formSize: '@',
          metaData: '=',
          updateLocation:'&'
        },
        link: function(scope, element, attrs) {
          scope.show = function(){
            if(scope.modalIsOpen) return;
            scope.modalIsOpen = true;
            var modalScope = scope.$new();
            modalScope.debug = scope.debug;
            var modalInstance = $uibModal.open({
              animation: true,
              backdrop  : 'static',
              keyboard: false,
              templateUrl: scope.useTemplateUrl,
              controller:  scope.useCtrl,
              controllerAs: 'vm',
              size: scope.formSize,
              scope: modalScope,
              resolve: {
                metadata: function () {
                  return scope.metaData;
                }
              }
            });
            modalInstance.result.then(function (response) {
              scope.modalIsOpen = false;
              scope.updateLocation(response);
              console.log('Modal ok' + response);
            }, function (response) {
              scope.modalIsOpen = false;
              console.log('Modal dismissed at: ' + new Date());
            });
          };
        }
    };
}]);
