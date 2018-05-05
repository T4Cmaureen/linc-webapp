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

angular.module('linc.relatives.directive', [])

.directive('relatives', ['$uibModal', function($uibModal){
  return {
    transclude: true,
    replace: true,
    restrict: 'EA',
    template:  '<p><a class="btn btn-lg btn-default btn-block btn-minwidth-180" ng-click="show()">'+
               '<span ng-if="loading" class="text-center" style="margin-right: 20px;">'+
               '<img src="/static/images/loading.gif"/></span>'+
               '<i class="fa fa-paw"></i>'+
               ' RELATIVES '+
               '</a>'+
               '</p>',
    scope: {
      useTemplateUrl: '@',
      useCtrl: '@',
      formSize: '@',
      lionsRelatives: '=',
      lion: '=',
      debug: '=',
      modalIsOpen: '=',
      updateAction: '&'
    },
    link: function(scope, element, attrs) {
      scope.show = function(){
        if(scope.modalIsOpen) return;
        scope.modalIsOpen = true;
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
          windowClass: 'large-Modal',
          resolve: {
            animal: function(){
              return scope.lion;
            },
            relatives: function(){
              return scope.lionsRelatives;
            },
            lions: ['LincServices', function(LincServices) {
              return LincServices.Lions();
            }],
            relatives_options: ['LincDataFactory', function(LincDataFactory) {
              return LincDataFactory.get_relatives();
            }]
          }
        });
        modalInstance.result.then(function (results) {
          scope.modalIsOpen = false;
          scope.loading = false;
          scope.updateAction({data: results.relatives});
        }, function () {
          scope.modalIsOpen = false;
          scope.loading = false;
          console.log('Modal dismissed at: ' + new Date());
        });
      };
    }
  };
}]);
