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

angular.module('linc.admin.lions.controller', [])

.controller('AdminLionsCtrl', ['$scope', '$uibModal', function ($scope, $uibModal) {

  $scope.Lion_Mode = $scope.settings.lions.Mode;

  $scope.check_all = function (val){
    _.forEach($scope.$parent.lions, function(lion) {
      lion.selected = val;
      if(lion.selected){
        if(!_.some($scope.Selecteds, lion))
          $scope.Selecteds.push(lion);
      }
    });
    if(!val) {
      $scope.Selecteds = [];
      $scope.settings.lions.Selecteds = $scope.Selecteds;
    }
    check_selects();
  }

  var lastSelId = -1;
  $scope.Select_Lion = function ($event, lion, type){
    if(type == 'line-click'){
      lion.selected = !lion.selected;
    }
    var shiftKey = $event.shiftKey;
    if(shiftKey && lastSelId>=0){
      var index0 = _.findIndex($scope.ordered_lions, {'id': lastSelId});
      var index1 = _.findIndex($scope.ordered_lions, {'id': lion.id});
      var first = Math.min(index0, index1);
      var second = Math.max(index0, index1);
      for(var i = first; i < second; i++){
        var animal = $scope.ordered_lions[i];
        animal.selected = lion.selected;
        if(lion.selected){
          if(!_.some($scope.Selecteds, animal))
            $scope.Selecteds.push(animal);
        }
        else {
          $scope.Selecteds = _.without($scope.Selecteds, animal);
          $scope.settings.lions.Selecteds = $scope.Selecteds;
        }
      }
    }
    else{
      lastSelId = lion.id;
      if(lion.selected){
        if(!_.some($scope.Selecteds, lion))
          $scope.Selecteds.push(lion);
      }
      else {
        $scope.Selecteds = _.without($scope.Selecteds, lion);
        $scope.settings.lions.Selecteds = $scope.Selecteds;
      }
    }
    check_selects();
  }

  $scope.Add_Lion = function () {
    $scope.Lion_Mode = 'add';
    $scope.check_all(false);

    var modalScope = $scope.$new();
    modalScope.title = 'Add Lion';

    modalScope.dataSending = false;
    modalScope.showValidationMessages = false;

    modalScope.organizations = angular.copy($scope.$parent.organizations);
    modalScope.imagesets = angular.copy($scope.$parent.imagesets);
    modalScope.lion = {
      'name': '', 
      'organization_id': undefined, 
      'primary_image_set_id': '', 
      'selected': true,
      'dead': false
    }

    var modalInstance = $uibModal.open({
        templateUrl: 'Edit_Lion.tpl.html',
        scope: modalScope
    });

    modalInstance.result.then(function (result) {
      $scope.Lion_Mode = '';
      modalScope.dataSending = false;
    }, function (){
      $scope.Lion_Mode = '';
      modalScope.dataSending = false;
    });

    modalScope.submit = function (valid){
      if(valid){
        var data = {
          'name': modalScope.lion.name,
          'organization_id': modalScope.lion.organization_id,
          'primary_image_set_id': modalScope.lion.primary_image_set_id,
          'dead': modalScope.lion.dead
        };
        modalScope.dataSending = true;
        $scope.LincApiServices.Lions({'method': 'post', 'data': data}).then(function(response){
          $scope.Notification.success({
            title: 'Lion Info', 
            message: 'New Lion successfully created',
            position: "right",
            duration: 2000 
          });
          var lion = response.data;
          lion.created_at = (lion.created_at || "").substring(0,19);
          lion.updated_at = (lion.updated_at || "").substring(0,19);
          var org = _.find($scope.$parent.organizations, {'id': lion.organization_id});
          lion.organization = (org == undefined)? '' : org.name;
          lion.selected = true;
          $scope.$parent.lions.push(lion);
          $scope.Selecteds.push(lion);
          modalInstance.close();
        },
        function(error){
          $scope.Notification.error({
            title: "Fail", 
            message: 'Fail to create new Lion',
            position: 'right',
            duration: 5000
          });
          modalInstance.dismiss();
        });
      }
      else {
        modalScope.showValidationMessages = true;
      }
    };
    modalScope.cancel = function(){
      modalInstance.dismiss();
    };
  };

  $scope.Edit_Lion = function() {
    if($scope.Selecteds.length == 1){
      $scope.Lion_Mode = 'edit';

      var modalScope = $scope.$new();
      modalScope.title = 'Edit Lion';

      modalScope.dataSending = false;
      modalScope.showValidationMessages = false;

      modalScope.organizations = angular.copy($scope.$parent.organizations);
      modalScope.imagesets = angular.copy($scope.$parent.imagesets);
      modalScope.lion = angular.copy($scope.Selecteds[0]);

      var modalInstance = $uibModal.open({
          templateUrl: 'Edit_Lion.tpl.html',
          scope: modalScope
      });

      modalInstance.result.then(function (result) {
        $scope.Lion_Mode = '';
        modalScope.dataSending = false;
      }, function (){
        $scope.Lion_Mode = '';
        modalScope.dataSending = false;
      });

      modalScope.submit = function (valid){
        if(valid){
          var data = {
            'name': modalScope.lion.name,
            'organization_id': modalScope.lion.organization_id,
            'primary_image_set_id': modalScope.lion.primary_image_set_id,
            'dead': modalScope.lion.dead
          };
          modalScope.dataSending = true;
          $scope.LincApiServices.Lions({'method': 'put', 'lion_id' : modalScope.lion.id, 'data': data}).then(function(response){
            $scope.Notification.success({
              title: 'Lion Info', 
              message: 'Lion data successfully updated',
              position: "right",
              duration: 2000 
            });
            var lion = $scope.Selecteds[0];
            _.merge(lion, lion, response.data);
            lion.created_at = (lion.created_at || "").substring(0,19);
            lion.updated_at = (lion.updated_at || "").substring(0,19);
            var org = _.find($scope.$parent.organizations, {'id': lion.organization_id});
            lion.organization = (org == undefined)? '' : org.name;
            $scope.$parent.LionsUpdated();
            modalInstance.close();
          },
          function(error){
            $scope.Notification.error({
              title: "Fail", 
              message: 'Fail to change Lion data',
              position: 'right',
              duration: 5000 
            });
            modalInstance.dismiss();
          });
        }
        else {
          modalScope.showValidationMessages = true;
        }
      };
      modalScope.cancel = function(){
        modalInstance.dismiss();
      };
    }
  }

  $scope.Delete_Lion = function() {
    $scope.DialogDelete('Lions')
    .then(function (result) {
      var lions_id = _.pluck(_.map($scope.Selecteds, function (lion){
        return {'id': lion.id};
      }), 'id');

      $scope.LincApiServices.Lions({'method': 'delete', 'lions_id': lions_id}).then(function(response){
        if(response.error.length>0){
          var data = _.pluck(_.map(response.error, function (lion){
            return {'id': lion.id};
          }), 'id');
          var msg = (data.length>1) ? 'Unable to delete lions ' + data : 'Unable to delete lion ' + data;
          $scope.Notification.error({
            title: "Delete", 
            message: msg,
            position: "right",
            duration: 2000 
          });
        }
        else if(response.success.length>0){
          var msg = (response.success.length>1) ? 'Lions successfully deleted' : 'Lion successfully deleted';
          $scope.Notification.success({
            title: "Delete", 
            message: msg,
            position: "right",
            duration: 2000 
          });
        }
        _.forEach(response.success, function(item, i){
          var remove = _.remove($scope.$parent.lions, function(lion) {
            return lion.id == item.id;
          });
        });
        $scope.Selecteds = [];
        $scope.settings.lions.Selecteds = $scope.Selecteds;
        $scope.$parent.LionsUpdated();
      });
    }, function () {
      $scope.Notification.info({
        title: "Cancel", 
        message: 'Delete canceled',
        position: 'right',
        duration: 2000 
      });
    });
  }

  var check_selects = function (){
    var count = 0;
    $scope.all_selected = false;
    $scope.all_unselected = true;
    if($scope.ordered_lions) count = $scope.ordered_lions.length;
    if(count>0){
      if($scope.Selecteds.length == count)
        $scope.all_selected = true;
      if($scope.Selecteds.length)
        $scope.all_unselected = false;
    }
  }

  // Order by
  $scope.reverse = $scope.settings.lions.reverse;
  $scope.predicate = $scope.settings.lions.predicate;

  $scope.order = function(predicate) {
    $scope.reverse = ($scope.predicate === predicate) ? !$scope.reverse : false;
    $scope.predicate = predicate;
    $scope.settings.lions.predicate = $scope.predicate;
    $scope.settings.lions.reverse = $scope.reverse;
  };

  $scope.Selecteds = [];
  _.forEach($scope.settings.lions.Selecteds, function(selected) {
    if(selected != undefined){
      var sel_lion = _.find($scope.$parent.lions, function(lion) {
        return lion.id == selected.id;
      });
      if(sel_lion){
        sel_lion.selected = true;
        $scope.Selecteds.push(sel_lion);
      }
    }
  });
  $scope.settings.lions.Selecteds = $scope.Selecteds;

  check_selects();

}])
;
