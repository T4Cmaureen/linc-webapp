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

angular.module('linc.image.gallery.directive', [])

.directive('imageGallery', ['$uibModal', function($uibModal) {
  return {
    transclude: true,
    restrict: 'EA',
    template: '<p><a class="btn btn-lg btn-default btn-block btn-minwidth-180" data-animation="am-fade-and-slide-top" ng-click="show()"><i class="icon icon-camera"></i> IMAGE GALLERY</a></p>',
    scope: {
      useTemplateUrl: '@',
      useCtrl: '@',
      formSize: '@',
      optionsSet: '=',
      galleryUpdated:'&',
      debug: '=',
      modalStatus: '=',
      showPrivated: '='
    },
    link: function(scope, element, attrs) {
      scope.show = function(){
        if(scope.modalStatus.is_open) return;
        scope.modalStatus.is_open = true;
        var modalScope = scope.$new();
        modalScope.imagesChanged = false;
        modalScope.showPrivated = scope.showPrivated;
        modalScope.debug = scope.debug;
        var modalInstance = $uibModal.open({
          animation: true,
          backdrop  : 'static',
          templateUrl: scope.useTemplateUrl,
          controller:  scope.useCtrl,
          size: scope.formSize,
          scope: modalScope,
          resolve: {
            optionsSet: function () {
              return scope.optionsSet;
            },
            gallery: ['LincServices', function(LincServices) {
              return LincServices.GetImageGallery(scope.optionsSet.id);
            }]
          }
        });
        modalScope.UpdateGallery = function () {
          modalScope.imagesChanged = true;
        };
        modalInstance.result.then(function (result) {
          scope.modalStatus.is_open = false;
          if(modalScope.imagesChanged)
            scope.galleryUpdated();
          console.log('Modal close : ' + result);
        }, function (result) {
          scope.modalStatus.is_open = false;
          if(modalScope.imagesChanged)
            scope.galleryUpdated();
          console.log('Modal dismissed : ' + result);
        });
      }
    }
  };
}]);
