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

angular.module('linc.admin.organizations.controller', [])

.controller('AdminOrganizationsCtrl', ['$scope', '$uibModal', function ($scope, $uibModal) {

  $scope.Org_Mode  =  $scope.settings.organizations.Mode;

  $scope.check_all = function (val){
    _.forEach($scope.$parent.organizations, function(organization) {
      organization.selected = val;
      if(organization.selected){
        if(!_.some($scope.Selecteds, organization))
          $scope.Selecteds.push(organization);
      }
    });
    if(!val){
      $scope.Selecteds = [];
      $scope.settings.organizations.Selecteds = $scope.Selecteds;
    }
    check_selects();
  }

  var lastSelId = -1;
  $scope.Select_Org = function ($event, organization, type){
    if(type == 'line-click'){
      organization.selected = !organization.selected;
    }
    var shiftKey = $event.shiftKey;
    if(shiftKey && lastSelId>=0){
      var index0 = _.findIndex($scope.ordered_organizations, {'id': lastSelId});
      var index1 = _.findIndex($scope.ordered_organizations, {'id': organization.id});
      var first = Math.min(index0, index1);
      var second = Math.max(index0, index1);
      for(var i = first; i < second; i++){
        var org = $scope.ordered_organizations[i];
        org.selected = organization.selected;
        if(organization.selected){
          if(!_.some($scope.Selecteds, org))
            $scope.Selecteds.push(org);
        }
        else {
          $scope.Selecteds = _.without($scope.Selecteds, org);
          $scope.settings.organizations.Selecteds = $scope.Selecteds;
        }
      }
    }
    else{
      lastSelId = organization.id;
      if(organization.selected){
        if(!_.some($scope.Selecteds, organization))
          $scope.Selecteds.push(organization);
      }
      else {
        $scope.Selecteds = _.without($scope.Selecteds, organization);
        $scope.settings.organizations.Selecteds = $scope.Selecteds;
      }
    }
    check_selects();
  }

  var modal = null;
  $scope.Add_Organization = function () {
    $scope.Org_Mode = 'add';
    $scope.check_all(false);

    var modalScope = $scope.$new();
    modalScope.title = 'Add Organization';

    modalScope.dataSending = false;
    modalScope.showValidationMessages = false;

    modalScope.organization = {
      'name' : '', 
      'selected': true
    };
    
    var modalInstance = $uibModal.open({
        templateUrl: 'Edit_Organization.tpl.html',
        scope: modalScope
    });

    modalInstance.result.then(function (result) {
      $scope.Org_Mode = '';
      modalScope.dataSending = false;
    }, function (){
      $scope.Org_Mode = '';
      modalScope.dataSending = false;
    });

    modalScope.submit = function(valid){
      if(valid){
        var data = {
          'name': modalScope.organization.name
        };
        modalScope.dataSending = true;
        $scope.LincApiServices.Organizations({'method': 'post', 'data': data}).then(function(response){
          $scope.Notification.success({
            title: 'Organization Info', 
            message: 'New Organization successfully created',
            position: "right", 
            duration: 2000 
          });
          var organization = response.data;
          organization.created_at = (organization.created_at || "").substring(0,19);
          organization.updated_at = (organization.updated_at || "").substring(0,19);
          organization.selected = true;
          $scope.$parent.organizations.push(organization);
          $scope.Selecteds.push(organization);
          modalInstance.close();
        },
        function(error){
          $scope.Notification.error({
            title: "Fail", 
            message: 'Fail to create new Organization',
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

  $scope.Edit_Organization = function() {
    if($scope.Selecteds.length == 1){
      $scope.Org_Mode = 'edit';

      var modalScope = $scope.$new();
      modalScope.title = 'Edit Organization';

      modalScope.dataSending = false;
      modalScope.showValidationMessages = false;

      modalScope.organization = angular.copy($scope.Selecteds[0]);

      var modalInstance = $uibModal.open({
          templateUrl: 'Edit_Organization.tpl.html',
          scope: modalScope
      });

      modalInstance.result.then(function (result) {
        $scope.Org_Mode = '';
        modalScope.dataSending = false;
      }, function (){
        $scope.Org_Mode = '';
        modalScope.dataSending = false;
      });
      
      modalScope.submit = function (valid){
        if(valid){
          var data = {
            'name': modalScope.organization.name
          };
          modalScope.dataSending = true;
          $scope.LincApiServices.Organizations({'method': 'put', 'organization_id' : modalScope.organization.id, 'data': data}).then(function(response){
            $scope.Notification.success({
              title: 'Organization Info', 
              message: 'Organization data successfully updated',
              position: "right",
              duration: 2000
            });
            var organization = $scope.Selecteds[0];
            _.merge(organization, organization, response.data);
            organization.created_at = (organization.created_at || "").substring(0,19);
            organization.updated_at = (organization.updated_at || "").substring(0,19);
            $scope.$parent.OrganizationsUpdated();
            modalInstance.close();
          },
          function(error){
            $scope.Notification.error({
              title: "Fail", 
              message: 'Fail to change Organization data',
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
      }
    }
  }

  $scope.Delete_Organization = function() {
    $scope.DialogDelete('Organizations')
    .then(function (result) {
      var organizations_id = _.pluck(_.map($scope.Selecteds, function (organization){
        return {'id': organization.id};
      }), 'id');

      $scope.LincApiServices.Organizations({'method': 'delete', 'organizations_id': organizations_id}).then(function(response){
        if(response.error.length>0){
          var data = _.pluck(_.map(response.error, function (organization){
            return {'id': organization.id};
          }), 'id');
          var msg = (data.length>1) ? 'Unable to delete organizations ' + data : 'Unable to delete organization ' + data;
          $scope.Notification.error({
            title: "Delete", 
            message: msg,
            position: "right",
            duration: 2000 
          });
        }
        else if(response.success.length>0){
          var msg = (response.success.length>1) ? 'Organizations successfully deleted' : 'Organization successfully deleted';
          $scope.Notification.success({
            title: "Delete", 
            message: msg,
            position: "right",
            duration: 2000 
          });
        }
        _.forEach(response.success, function(item, i){
          var remove = _.remove($scope.$parent.organizations, function(organization) {
            return organization.id == item.id;
          });
        });
        $scope.Selecteds = [];
        $scope.settings.organizations.Selecteds = $scope.Selecteds;
        $scope.$parent.OrganizationsUpdated();
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
    if($scope.ordered_organizations) count = $scope.ordered_organizations.length;
    if(count>0){
      if($scope.Selecteds.length == count)
        $scope.all_selected = true;
      if($scope.Selecteds.length)
        $scope.all_unselected = false;
    }
  }

  $scope.Change_Org_Mode = function(mode){
    $scope.Org_Mode = mode;
    $scope.settings.organizations.Mode = mode;
  }
  // Order by
  $scope.reverse = $scope.settings.organizations.reverse;
  $scope.predicate = $scope.settings.organizations.predicate;
  $scope.order = function(predicate) {
    $scope.reverse = ($scope.predicate === predicate) ? !$scope.reverse : false;
    $scope.predicate = predicate;
    $scope.settings.organizations.predicate = $scope.predicate;
    $scope.settings.organizations.reverse = $scope.reverse;
  };

  $scope.Selecteds = [];
  _.forEach($scope.settings.organizations.Selecteds, function(selected) {
    if(selected != undefined){
      var sel_org = _.find($scope.$parent.organizations, function(org) {
        return org.id == selected.id;
      });
      if(sel_org){
        sel_org.selected = true;
        $scope.Selecteds.push(sel_org);
      }
    }
  });
  $scope.settings.organizations.Selecteds = $scope.Selecteds;

  check_selects();
}])
;
