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

angular.module('linc.metadata.directive', [])

.directive('metadata', ['$uibModal', function($uibModal) {
  return {
    transclude: true,
    replace: true,
    restrict: 'EA',
    template: function(element, attrs) {
      switch (attrs.type) { //view selection. Put type='edit' or type=''
        case 'add_image_set':
          return '<p><a class="btn btn-lg btn-default btn-home" ng-click="showNew()"><i class="icon icon-circle-with-plus"></i> ADD NEW IMAGE SET</a></p>';
        case 'add_lion':
          return '<p><a class="btn btn-lg btn-default btn-home" ng-click="showNew()"><i class="icon icon-circle-with-plus"></i> ADD NEW LION</a></p>';
        case 'side_lion':
          return '<a ng-click="showNew();">Add new Lion</a>';
        case 'side_image_set':
          return '<a ng-click="showNew();">Add new Image Set</a>';
        default:
          return '<p><a class="btn btn-lg btn-default btn-block btn-minwidth-180" data-animation="am-fade-and-slide-top" ng-click="showEdit()"><i class="icon icon-pencil"></i> EDIT METADATA</a></p>';
      }
    },
    scope: {
      cancelAction: '&',
      useTemplateUrl: '@',
      useCtrl: '@',
      formSize: '@',
      optionsSet: '=',
      gotoImagesetAction:'&',
      updateAction: '&',
      debug: '=',
      modalStatus: '='
    },
    link: function(scope, element, attrs) {
      scope.showNew = function(){
        if(scope.modalStatus.is_open) return;
        scope.modalStatus.is_open = true;
        var modalScope = scope.$new();
        modalScope.created = false;
        modalScope.id = 0;
        modalScope.debug = scope.debug;
        var modalInstance = $uibModal.open({
          animation: true,
          backdrop  : 'static',
          templateUrl: scope.useTemplateUrl,
          controller:  scope.useCtrl,
          controllerAs: 'vm',
          size: scope.formSize,
          scope: modalScope,
          resolve: {
            optionsSet: function () {
              return scope.optionsSet;
            },
            organizations: ['$q', 'LincServices', function($q, LincServices) {
              var deferred = $q.defer();
              LincServices.Organizations().then(function(response){
                if (response.length)
                  deferred.resolve(response);
                else
                  deferred.reject(response);
              });
              return deferred.promise;
            }]
          }
        });
        modalScope.Object_Created = function (obj) {
          modalScope.created = true;
          modalScope.id = obj.id;
        };
        modalInstance.result.then(function (result) {
          scope.modalStatus.is_open = false;
          scope.gotoImagesetAction({Id: result.id});
          console.log('Modal ok' + result);
        }, function () {
          scope.modalStatus.is_open = false;
          if(modalScope.created)
            scope.gotoImagesetAction({'Id': modalScope.id});
          else {
            scope.cancelAction();
          }
          console.log('Modal dismissed at: ' + new Date());
        });
      },
      scope.showEdit = function(){
        if(scope.modalStatus.is_open) return;
        scope.modalStatus.is_open = true;
        var modalScope = scope.$new();
        modalScope.debug = scope.debug;
        var modalInstance = $uibModal.open({
          animation: true,
          backdrop  : 'static',
          templateUrl: scope.useTemplateUrl,
          controller:  scope.useCtrl,
          controllerAs: 'vm',
          size: scope.formSize,
          scope: modalScope,
          resolve: {
            optionsSet: function () {
              return scope.optionsSet;
            },
            organizations: ['$q', 'LincServices', function($q, LincServices) {
              var deferred = $q.defer();
              LincServices.Organizations().then(function(response){
                if (response.length)
                  deferred.resolve(response);
                else
                  deferred.reject(response);
              });
              return deferred.promise;
            }]
          }
        });
        modalInstance.result.then(function (result) {
          scope.modalStatus.is_open = false;
          scope.updateAction({data: result.data});
          console.log('Modal ok' + result);
        }, function () {
          scope.modalStatus.is_open = false;
          scope.cancelAction();
          console.log('Modal dismissed at: ' + new Date());
        });
      }
    }
  };
}]);
