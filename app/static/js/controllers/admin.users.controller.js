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

angular.module('linc.admin.users.controller', [])

.controller('AdminUsersCtrl', ['$scope', '$q', '$uibModal', function ($scope, $q, $uibModal) {

  $scope.User_Mode = $scope.settings.users.Mode;

  $scope.check_all = function (val){
    _.forEach($scope.$parent.users, function(user) {
      user.selected = val;
      if(user.selected){
        if(!_.some($scope.Selecteds, user))
          $scope.Selecteds.push(user);
      }
    });
    if(!val){
      $scope.Selecteds = [];
      $scope.settings.users.Selecteds = $scope.Selecteds;
    }
    check_selects();
  }

  var lastSelId = -1;
  $scope.Select_User = function ($event, user, type){
    if(type == 'line-click'){
      user.selected = !user.selected;
    }
    var shiftKey = $event.shiftKey;
    if(shiftKey && lastSelId>=0){
      var index0 = _.findIndex($scope.ordered_users, {'id': lastSelId});
      var index1 = _.findIndex($scope.ordered_users, {'id': user.id});
      var first = Math.min(index1, index0);
      var second = Math.max(index1, index0);
      for(var i = first; i <= second; i++){
        var person = $scope.ordered_users[i];
        person.selected = user.selected;
        if(user.selected){
          if(!_.some($scope.Selecteds, person))
            $scope.Selecteds.push(person);
        }
        else {
          $scope.Selecteds = _.without($scope.Selecteds, person);
          $scope.settings.users.Selecteds = $scope.Selecteds;
        }
      }
    }
    else{
      lastSelId= user.id;
      if(user.selected){
        if(!_.some($scope.Selecteds, user))
          $scope.Selecteds.push(user);
      }
      else {
        $scope.Selecteds = _.without($scope.Selecteds, user);
        $scope.settings.users.Selecteds = $scope.Selecteds;
      }
    }
    check_selects();
  }

  $scope.Add_User = function () {
    $scope.User_Mode = 'add'
    $scope.check_all(false);

    var modalScope = $scope.$new();
    modalScope.title = 'Add User';

    modalScope.dataSending = false;
    modalScope.password_required = true;
    modalScope.showValidationMessages = false;

    modalScope.organizations = angular.copy($scope.$parent.organizations);
    modalScope.user = {
      'email': '', 
      'organization': '', 
      'password': '', 
      'confirmPassword': '', 
      'admin': false, 
      'selected': true
    }
    
    var modalInstance = $uibModal.open({
        templateUrl: 'Edit_User.tpl.html',
        scope: modalScope
    });

    modalInstance.result.then(function (result) {
      $scope.User_Mode = '';
      modalScope.dataSending = false;
    }, function (){
      $scope.User_Mode = '';
      modalScope.dataSending = false;
    });

    modalScope.submit = function (valid){
      if(valid){
        var data = {
          'email': modalScope.user.email,
          'organization_id': modalScope.user.organization_id,
          'password': modalScope.user.password,
          'admin': modalScope.user.admin
        };
        modalScope.dataSending = true;
        $scope.LincApiServices.Users({'method': 'post', 'data': data}).then(function(response){
          $scope.Notification.success({
            title: 'User Info', 
            message: 'New User successfully created',
            position: "right", 
            duration: 2000 
          });
          var user = response.data;
          user.created_at = (user.created_at || "").substring(0,19);
          user.updated_at = (user.updated_at || "").substring(0,19);
          var org = _.find($scope.$parent.organizations, {'id': user.organization_id});
          user.organization =  (org == undefined)? '' : org.name;
          user.selected = true;
          $scope.$parent.users.push(user);
          $scope.Selecteds.push(user);
          modalInstance.close();
        },
        function(error){
          $scope.Notification.error({
            title: "Fail", 
            message: 'Fail to create new User',
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

  $scope.Edit_User = function() {
    if($scope.Selecteds.length == 1){
      $scope.User_Mode = 'edit';

      var modalScope = $scope.$new();
      modalScope.title = 'Edit User';

      modalScope.dataSending = false;
      modalScope.password_required = false;
      modalScope.showValidationMessages = false;

      modalScope.organizations = angular.copy($scope.$parent.organizations);
      modalScope.user = angular.copy($scope.Selecteds[0]);

      var modalInstance = $uibModal.open({
          templateUrl: 'Edit_User.tpl.html',
          scope: modalScope
      });

      modalInstance.result.then(function (result) {
        $scope.User_Mode = '';
        modalScope.dataSending = false;
      }, function (){
        $scope.User_Mode = '';
        modalScope.dataSending = false;
      });

      modalScope.submit = function (valid){
        if(valid){
          var data = {
            'email': modalScope.user.email,
            'organization_id': modalScope.user.organization_id,
            'admin': modalScope.user.admin
          };
          modalScope.dataSending = true;
          $scope.LincApiServices.Users({'method': 'put', 'user_id' : modalScope.user.id, 'data': data}).then(function(response){
            $scope.Notification.success({
              title: 'User Info', 
              message: 'User data successfully updated',
              position: "right",
              duration: 2000 
            });
            var user = $scope.Selecteds[0];
            _.merge(user, user, response.data);
            user.created_at = (user.created_at || "").substring(0,19);
            user.updated_at = (user.updated_at || "").substring(0,19);
            var org = _.find($scope.$parent.organizations, {'id': user.organization_id});
            user.organization =  (org == undefined)? '' : org.name;
            modalInstance.close();
          },
          function(error){
            $scope.Notification.error({
              title: "Fail", 
              message: 'Fail to change User data',
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

  $scope.Delete_User = function() {
    $scope.DialogDelete('Users')
    .then(function (result) {
      var users_id = _.map($scope.Selecteds, 'id');

      $scope.LincApiServices.Users({'method': 'delete', 'users_id': users_id}).then(function(response){
        if(response.error.length>0){
          var data = _.map(response.error, 'id');
          var msg = (data.length>1) ? 'Unable to delete users ' + data : 'Unable to delete user ' + data;
          $scope.Notification.error({
            title: "Delete", 
            message: msg,
            position: "right", 
            duration: 2000 
          });
        }
        else if(response.success.length>0){
          var msg = (response.success.length>1) ? 'Users successfully deleted' : 'User successfully deleted';
          $scope.Notification.success({
            title: "Delete", 
            message: msg,
            position: "right",
            duration: 2000 
          });
        }
        _.forEach(response.success, function(item, i){
          var remove = _.remove($scope.$parent.users, function(user) {
            return user.id == item.id;
          });
        });
        $scope.Selecteds = [];
        $scope.settings.users.Selecteds = $scope.Selecteds;
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

  // var FindOrganization = function(name, organizations){
  //   var deferred = $q.defer();
  //   var org = _.find(organizations,{'name': name});
  //   if(org == undefined){
  //     var data = {'name': name};
  //     $scope.LincApiServices.Organizations({'method': 'post', 'data': data}).then(function(response){
  //       $scope.Notification.success({
  //         title: 'Organization Info', 
  //         message: 'New Organization successfully created',
  //         position: "right", 
  //         duration: 2000 
  //       });
  //       var organization = response.data;
  //       organization.created_at = (organization.created_at || "").substring(0,19);
  //       organization.updated_at = (organization.updated_at || "").substring(0,19);
  //       $scope.$parent.organizations.push(organization);
  //       deferred.resolve(organization.id);
  //     },
  //     function(error){
  //       $scope.Notification.error({
  //         title: "Fail", 
  //         message: 'Fail to create new Organization',
  //         position: 'right', 
  //         duration: 5000 
  //       });
  //       deferred.reject();
  //     });
  //   }
  //   else{
  //     deferred.resolve(org.id);
  //   }
  //   return deferred.promise;
  // }

  $scope.ChangePassword = function(){
    if($scope.Selecteds.length == 1){
      var modalScope = $scope.$new();
      modalScope.title = 'Change Password';
      modalScope.showValidationMessages = false;
      modalScope.tooltip = {title: '<span><i class="icon icon-info"></i>passwords must match</span>', checked: false};
      modalScope.sel_user = { 
        'email': $scope.Selecteds[0].email,
        'id': $scope.Selecteds[0].id,
        'password': "", 'confirmPassword': "" 
      };
      var modalInstance = $uibModal.open({
          templateUrl: 'Password.tpl.html',
          scope: modalScope,
          size: '350px'
      });
      modalInstance.result.then(function (result) {
        modalScope.dataSending = false;
      }, function(error){
        modalScope.dataSending = false;
      });
      modalScope.submit = function (valid){
        if(valid){
          modalScope.dataSending = true;
          var data = {
            'method': 'put', 
            'user_id' : modalScope.sel_user.id, 
            'data': {'password': modalScope.sel_user.password}
          };
          $scope.LincApiServices.Users(data)
          .then(function(response){
              $scope.Notification.success({
              title: 'Change Password', 
              message: modalScope.sel_user.email + "'s password successfully updated",
              position: "right",
              duration: 4000
            });
            modalInstance.close();
          },
          function(error){
            $scope.Notification.error({
              title: "Fail", 
              message: 'Fail to change User Password',
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

  var check_selects = function (){
    var count = 0;
    $scope.all_selected = false;
    $scope.all_unselected = true;
    if($scope.ordered_users) count = $scope.ordered_users.length;
    if(count>0){
      if($scope.Selecteds.length == count)
        $scope.all_selected = true;
      if($scope.Selecteds.length)
        $scope.all_unselected = false;
    }
  }

  // Order by
  $scope.reverse = $scope.settings.users.reverse;
  $scope.predicate = $scope.settings.users.predicate;
  $scope.order = function(predicate) {
    $scope.reverse = ($scope.predicate === predicate) ? !$scope.reverse : false;
    $scope.predicate = predicate;
    $scope.settings.users.predicate = $scope.predicate;
    $scope.settings.users.reverse = $scope.reverse;
  };

  $scope.Selecteds = [];
  _.forEach($scope.settings.users.Selecteds, function(selected) {
    if(selected != undefined){
      var sel_user = _.find($scope.$parent.users, function(user) {
        return user.id == selected.id;
      });
      if(sel_user){
        sel_user.selected = true;
        $scope.Selecteds.push(sel_user);
      }
    }
  });
  $scope.settings.users.Selecteds = $scope.Selecteds;

  check_selects();

}])
;
