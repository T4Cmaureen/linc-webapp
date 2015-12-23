'use strict';

angular.module('lion.guardians.location.history.directive', [])

.directive('locationHistory', ['$uibModal', function($uibModal) {
    return {
        transclude: true,
        restrict: 'EA',
        template: function(element, attrs) {
          switch (attrs.type) {
            case 'lion':
              return '<p><a class="btn btn-lg btn-default btn-block" data-animation="am-fade-and-slide-top" ng-click="Lion_show()"><i class="icon icon-location-pin"></i> POSITION ON MAP</a></p>';
              default:
                return '<p><a class="btn btn-lg btn-default btn-block" data-animation="am-fade-and-slide-top" ng-click="Imageset_show()"><i class="icon icon-location-pin"></i> POSITION ON MAP</a></p>';
          }
        },
        scope: {
          useTemplateUrl: '@',
          useCtrl: '@',
          formSize: '@',
          options: '=',
          locationGoto:'&',
          debug: '=',
          modalIsOpen: '='
        },
        link: function(scope, element, attrs) {
          // Lions
          scope.Lion_show = function(){
            if(scope.modalIsOpen) return;
            scope.modalIsOpen = true;
            var modalScope = scope.$new();
            modalScope.debug = scope.debug;
            var modalInstance = $uibModal.open({
              animation: true,
              backdrop: true,
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
              scope.modalIsOpen = false;
              scope.locationGoto({imageset_Id: imagesetId});
              console.log('Goto Imageset ' + imagesetId);
            }, function () {
              scope.modalIsOpen = false;
              console.log('Modal dismissed at: ' + new Date());
            });
          },
          // Imagesets
          scope.Imageset_show = function(){
            if(scope.modalIsOpen) return;
            scope.modalIsOpen = true;
            var modalScope = scope.$new();
            modalScope.debug = scope.debug;
            var modalInstance = $uibModal.open({
              animation: true,
              backdrop: true,
              templateUrl: scope.useTemplateUrl,
              controller:  scope.useCtrl,
              size: scope.formSize,
              scope: modalScope,
              resolve: {
                options: function () {
                  return scope.options;
                },
                history: ['LincServices', function(LincServices) {
                  return scope.options.history;
                }]
              }
            });
            modalInstance.result.then(function (imagesetId) {
              scope.modalIsOpen = false;
              scope.locationGoto({imageset_Id: imagesetId});
              console.log('Goto Imageset ' + imagesetId);
            }, function () {
              scope.modalIsOpen = false;
              console.log('Modal dismissed at: ' + new Date());
            });
          };
        }
    };
}]);
