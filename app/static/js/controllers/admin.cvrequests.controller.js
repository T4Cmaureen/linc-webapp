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

angular.module('linc.admin.cvrequests.controller', [])

.controller('AdminCVRequestsCtrl', ['$scope', '$uibModal', function ($scope, $uibModal) {

  $scope.CVReq_Status = [{'status': 'submitted', 'label': 'Submitted'},
                         {'status': 'pending', 'label': 'Pending'},
                         {'status': 'created', 'label': 'Created'},
                         {'status': 'fail', 'label': 'Fail'},
                         {'status': 'finished', 'label': 'Finished'}];

  $scope.CVRequest_Mode = $scope.settings.cvrequests.Mode;

  $scope.check_all = function (val){
    _.forEach($scope.$parent.cvrequests, function(cvrequest) {
      cvrequest.selected = val;
      if(cvrequest.selected){
        if(!_.some($scope.Selecteds, cvrequest))
          $scope.Selecteds.push(cvrequest);
      }
    });
    if(!val){
      $scope.Selecteds = [];
      $scope.settings.cvrequests.Selecteds = $scope.Selecteds;
    }
    check_selects();
  }

  var lastSelId = -1;
  $scope.Select_CVRequest = function ($event, cvrequest, type){
    if(type == 'line-click'){
      cvrequest.selected = !cvrequest.selected;
    }
    var shiftKey = $event.shiftKey;
    if(shiftKey && lastSelId>=0){
      var index0 = _.findIndex($scope.ordered_cvrequests, {'id': lastSelId});
      var index1 = _.findIndex($scope.ordered_cvrequests, {'id': cvrequest.id});
      var first = Math.min(index0, index1);
      var second = Math.max(index0, index1);
      for(var i = first; i < second; i++){
        var cvres = $scope.ordered_cvrequests[i];
        cvres.selected = cvrequest.selected;
        if(cvrequest.selected){
          if(!_.some($scope.Selecteds, cvres))
            $scope.Selecteds.push(cvres);
        }
        else {
          $scope.Selecteds = _.without($scope.Selecteds, cvres);
          $scope.settings.cvrequests.Selecteds = $scope.Selecteds;
        }
      }
    }
    else{
      lastSelId = cvrequest.id;
      if(cvrequest.selected){
        if(!_.some($scope.Selecteds, cvrequest))
          $scope.Selecteds.push(cvrequest);
      }
      else {
        $scope.Selecteds = _.without($scope.Selecteds, cvrequest);
        $scope.settings.cvrequests.Selecteds = $scope.Selecteds;
      }
    }
    check_selects();
  }

  $scope.Add_CVRequest = function () {
    $scope.CVRequest_Mode = 'add';
    $scope.check_all(false);

    var modalScope = $scope.$new();
    modalScope.title = 'Add CV Request';

    modalScope.showValidationMessages = false;
    modalScope.dataSending = false;
    modalScope.rows = 8;
    modalScope.edit = {'server_uuid': false, 'request_body': false};

    modalScope.organizations = angular.copy($scope.$parent.organizations);
    modalScope.imagesets = angular.copy($scope.$parent.imagesets);

    modalScope.cvrequest = {
      'requesting_organization_id': undefined, 
      'image_set_id': undefined,
      'server_uuid': '',
      'status': '', 
      'request_body': '', 
      'selected': true
    }

    var modalInstance  = $uibModal.open({
        templateUrl: 'Edit_CVRequest.tpl.html',
        scope:modalScope
    });

    modalInstance.result.then(function (result) {
      $scope.CVRequest_Mode = '';
      modalScope.dataSending = false;
    }, function (){
      $scope.CVRequest_Mode = '';
      modalScope.dataSending = false;
    });

    modalScope.submit = function(valid){
      if(valid){
        var data = {
          'requesting_organization_id': modalScope.cvrequest.requesting_organization_id,
          'image_set_id': modalScope.cvrequest.image_set_id, 
          'status': modalScope.cvrequest.status,
          'request_body': modalScope.cvrequest.request_body
        };
        modalScope.dataSending = true;
        $scope.LincApiServices.CVRequests({'method': 'post', 'data': data}).then(function(response){
          $scope.Notification.success({
            title: 'CV Request Info', message: 'New CV Request successfully created',
            position: "right", // right, left, center
            duration: 2000     // milisecond
          });
          var cvrequest = response.data;
          cvrequest.created_at = (cvrequest.created_at || "").substring(0,19);
          cvrequest.updated_at = (cvrequest.updated_at || "").substring(0,19);
          cvrequest.selected = true;
          $scope.$parent.cvrequests.push(cvrequest);
          $scope.Selecteds.push(cvrequest);
          modalInstance.close();
        },
        function(error){
          $scope.Notification.error({
            title: "Fail", message: 'Fail to create new CV Request ',
            position: 'right', // right, left, center
            duration: 5000   // milisecond
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

  $scope.Edit_CVRequest = function() {
    if($scope.Selecteds.length == 1){
      $scope.CVRequest_Mode = 'edit';

      var modalScope = $scope.$new();
      modalScope.title = 'Edit CV Request';

      modalScope.showValidationMessages = false;
      modalScope.dataSending = false;
      modalScope.rows = 16;

      modalScope.edit = {'server_uuid': false, 'request_body': false};

      modalScope.organizations = angular.copy($scope.$parent.organizations);
      modalScope.imagesets = angular.copy($scope.$parent.imagesets);
      modalScope.cvrequest = angular.copy($scope.Selecteds[0]);

      var modalInstance = $uibModal.open({
          templateUrl: 'Edit_CVRequest.tpl.html',
          scope: modalScope
      });

      modalInstance.result.then(function (result) {
        $scope.CVRequest_Mode = '';
        modalScope.dataSending = false;
      }, function (){
        $scope.CVRequest_Mode = '';
        modalScope.dataSending = false;
      });
      
      modalScope.submit = function (valid){
        if(valid){
          var data = {
            'requesting_organization_id': modalScope.cvrequest.requesting_organization_id,
            'image_set_id': modalScope.cvrequest.image_set_id, 
            'status': modalScope.cvrequest.status,
            'request_body': modalScope.cvrequest.request_body
          };
          modalScope.dataSending = true;
          $scope.LincApiServices.CVRequests({'method': 'put', 'cvrequest_id' : $scope.cvrequest.id, 'data': data}).then(function(response){
            $scope.Notification.success({
              title: 'CV Request Info', 
              message: 'CV Request data successfully updated',
              position: "right", 
              duration: 2000     
            });

            var cvrequest = $scope.Selecteds[0];
            _.merge(cvrequest, cvrequest, response.data);
            cvrequest.created_at = (cvrequest.created_at || "").substring(0,19);
            cvrequest.updated_at = (cvrequest.updated_at || "").substring(0,19);
            modalInstance.close();
          },
          function(error){
            $scope.Notification.error({
              title: "Fail", message: 'Fail to change CV Request data',
              position: 'right', // right, left, center
              duration: 5000   // milisecond
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

  $scope.Delete_CVRequest = function() {
    $scope.DialogDelete('CV Request')
    .then(function (result) {
      var cvrequests_id = _.pluck(_.map($scope.Selecteds, function (cvrequest){
        return {'id': cvrequest.id};
      }), 'id');

      $scope.LincApiServices.CVRequests({'method': 'delete', 'cvrequests_id': cvrequests_id}).then(function(response){
        if(response.error.length>0){
          var data = _.pluck(_.map(response.error, function (cvrequest){
            return {'id': cvrequest.id};
          }), 'id');
          var msg = (data.length>1) ? 'Unable to delete cv requests ' + data : 'Unable to delete cv request ' + data;
          $scope.Notification.error({
            title: "Delete", message: msg,
            position: "right", // right, left, center
            duration: 2000     // milisecond
          });
        }
        else if(response.success.length>0){
          var msg = (response.success.length>1) ? 'CV Requests successfully deleted' : 'CV Request successfully deleted';
          $scope.Notification.success({
            title: "Delete", message: msg,
            position: "right", // right, left, center
            duration: 2000     // milisecond
          });
        }
        _.forEach(response.success, function(item, i){
          var remove = _.remove($scope.$parent.cvrequests, function(cvrequest) {
            return cvrequest.id == item.id;
          });
        });
        $scope.Selecteds = [];
        $scope.settings.cvrequests.Selecteds = $scope.Selecteds;
        $scope.$parent.CVRequestsDeleted();
      });
    }, function () {
      $scope.Notification.info({
        title: "Cancel", message: 'Delete canceled',
        position: 'right', // right, left, center
        duration: 2000   // milisecond
      });
    });
  }

  var check_selects = function (){
    var count = 0;
    $scope.all_selected = false;
    $scope.all_unselected = true;
    if($scope.ordered_cvrequests) count = $scope.ordered_cvrequests.length;
    if(count>0){
      if($scope.Selecteds.length == count)
        $scope.all_selected = true;
      if($scope.Selecteds.length)
        $scope.all_unselected = false;
    }
  }

  // Order by
  $scope.reverse = $scope.settings.cvrequests.reverse;
  $scope.predicate = $scope.settings.cvrequests.predicate;
  $scope.order = function(predicate) {
    $scope.reverse = ($scope.predicate === predicate) ? !$scope.reverse : false;
    $scope.predicate = predicate;
    $scope.settings.cvrequests.predicate = $scope.predicate;
    $scope.settings.cvrequests.reverse = $scope.reverse;
  };

  $scope.Selecteds = [];
  _.forEach($scope.settings.cvrequests.Selecteds, function(selected) {
    if(selected != undefined){
      var sel_cvrequest = _.find($scope.$parent.cvrequests, function(cvrequest) {
        return cvrequest.id == selected.id;
      });
      if(sel_cvrequest){
        sel_cvrequest.selected = true;
        $scope.Selecteds.push(sel_cvrequest);
      }
    }
  });
  $scope.settings.cvrequests.Selecteds = $scope.Selecteds;

  check_selects();

}])
;
