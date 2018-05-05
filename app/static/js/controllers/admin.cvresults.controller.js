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

angular.module('linc.admin.cvresults.controller', [])

.controller('AdminCVResultsCtrl', ['$scope', '$uibModal', function ($scope, $uibModal) {

  $scope.CVResult_Mode = $scope.settings.cvresults.Mode;

  $scope.check_all = function (val){
    _.forEach($scope.$parent.cvresults, function(cvresult) {
      cvresult.selected = val;
      if(cvresult.selected){
        if(!_.some($scope.Selecteds, cvresult))
          $scope.Selecteds.push(cvresult);
      }
    });
    if(!val){
      $scope.Selecteds = [];
      $scope.settings.cvresults.Selecteds = $scope.Selecteds;
    }
    check_selects();
  }

  var lastSelId = -1;
  $scope.Select_CVresult = function ($event, cvresult, type){
   if(type == 'line-click'){
      cvresult.selected = !cvresult.selected;
    }
    var shiftKey = $event.shiftKey;
    if(shiftKey && lastSelId>=0){
      var index0 = _.findIndex($scope.ordered_cvresults, {'id': lastSelId});
      var index1 = _.findIndex($scope.ordered_cvresults, {'id': cvresult.id});
      var first = Math.min(index0, index1);
      var second = Math.max(index0, index1);
      for(var i = first; i < second; i++){
        var cvres = $scope.ordered_cvresults[i];
        cvres.selected = cvresult.selected;
        if(cvresult.selected){
          if(!_.some($scope.Selecteds, cvres))
            $scope.Selecteds.push(cvres);
        }
        else {
          $scope.Selecteds = _.without($scope.Selecteds, cvres);
          $scope.settings.cvresults.Selecteds = $scope.Selecteds;
        }
      }
    }
    else{
      lastSelId = cvresult.id;
      if(cvresult.selected){
        if(!_.some($scope.Selecteds, cvresult))
          $scope.Selecteds.push(cvresult);
      }
      else {
        $scope.Selecteds = _.without($scope.Selecteds, cvresult);
        $scope.settings.cvresults.Selecteds = $scope.Selecteds;
      }
    }
    check_selects();
  }

  $scope.Add_CVResult = function () {
    $scope.CVResult_Mode = 'add';
    $scope.check_all(false);

    var modalScope = $scope.$new();
    modalScope.title = 'Add CV Result';

    modalScope.showValidationMessages = false;
    modalScope.dataSending = false;

    modalScope.cvrequests = angular.copy($scope.$parent.cvrequests);
    modalScope.cvresult = {
      'cvrequest_id': undefined, 
      'match_probability': '', 
      'selected': true
    }

    var modalInstance = $uibModal.open({
        templateUrl: 'Edit_CVResult.tpl.html',
        scope: modalScope
    });

    modalInstance.result.then(function (result) {
      $scope.CVResult_Mode = '';
      modalScope.dataSending = false;
    }, function (){
      $scope.CVResult_Mode = '';
      modalScope.dataSending = false;
    });

    modalScope.submit = function(valid){
      if(valid){
        var data = {
          'cvrequest_id': modalScope.cvresult.cvrequest_id, 
          'match_probability': modalScope.cvresult.match_probability
        };
        modalScope.dataSending = true;
        $scope.LincApiServices.CVResults({'method': 'post', 'data': data}).then(function(response){
          $scope.Notification.success({
            title: 'CV Result Info', message: 'New CV Result successfully created',
            position: "right", 
            duration: 2000 
          });
          var cvresult = response.data;
          cvresult.created_at = (cvresult.created_at || "").substring(0,19);
          cvresult.updated_at = (cvresult.updated_at || "").substring(0,19);
          cvresult.selected = true;
          $scope.$parent.cvresults.push(cvresult);
          $scope.Selecteds.push(cvresult);
          modalInstance.close();
        },
        function(error){
          $scope.Notification.error({
            title: "Fail", message: 'Fail to create new CV Result ',
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

  $scope.Edit_CVResult = function() {
    if($scope.Selecteds.length == 1){
      $scope.CVResult_Mode = 'edit';

      var modalScope = $scope.$new();
      modalScope.title = 'Edit CV Result';

      modalScope.dataSending = false;
      modalScope.showValidationMessages = false;

      modalScope.cvrequests = angular.copy($scope.$parent.cvrequests);
      modalScope.cvresult = angular.copy($scope.Selecteds[0]);
      
      var modalInstance = $uibModal.open({
          templateUrl: 'Edit_CVResult.tpl.html',
          scope: modalScope
      });

      modalInstance.result.then(function (result) {
        $scope.CVResult_Mode = '';
        modalScope.dataSending = false;
      }, function (){
        $scope.CVResult_Mode = '';
        modalScope.dataSending = false;
      });
      
      modalScope.submit = function (valid){
        if(valid){
          var data = {
            'cvrequest_id': modalScope.cvresult.cvrequest_id, 
            'match_probability': modalScope.cvresult.match_probability
          };
          modalScope.dataSending = true;
          $scope.LincApiServices.CVResults({'method': 'put', 'cvresult_id' : modalScope.cvresult.id, 'data': data}).then(function(response){
            $scope.Notification.success({
              title: 'CV Result Info', 
              message: 'CV Result data successfully updated',
              position: "right", 
              duration: 2000     
            });
            var cvresult = $scope.Selecteds[0];
            _.merge(cvresult, cvresult, response.data);
            cvresult.created_at = (cvresult.created_at || "").substring(0,19);
            cvresult.updated_at = (cvresult.updated_at || "").substring(0,19);
            modalInstance.close();
          },
          function(error){
            $scope.Notification.error({
              title: "Fail", message: 'Fail to change CV Result data',
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

  $scope.Delete_CVResult = function() {
    $scope.DialogDelete('CV Results')
    .then(function (result) {
      var cvresults_id = _.map($scope.Selecteds, 'id');

      $scope.LincApiServices.CVResults({'method': 'delete', 'cvresults_id': cvresults_id}).then(function(response){
        if(response.error.length>0){
          var data = _.map(response.error, 'id');
          var msg = (data.length>1) ? 'Unable to delete cv results ' + data : 'Unable to delete cv result ' + data;
          $scope.Notification.error({
            title: "Delete", message: msg,
            position: "right", // right, left, center
            duration: 2000     // milisecond
          });
        }
        else if(response.success.length>0){
          var msg = (response.success.length>1) ? 'CV Results successfully deleted' : 'CV Result successfully deleted';
          $scope.Notification.success({
            title: "Delete", message: msg,
            position: "right", // right, left, center
            duration: 2000     // milisecond
          });
        }
        _.forEach(response.success, function(item, i){
          //var index = _.indexOf($scope.Selecteds, _.find($scope.Selecteds, {'id': cvresult.id}));
          var remove = _.remove($scope.$parent.cvresults, function(cvresult) {
            return cvresult.id == item.id;
          });
        });
        $scope.Selecteds = [];
        $scope.settings.cvresults.Selecteds = $scope.Selecteds;
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
    if($scope.ordered_cvresults) count = $scope.ordered_cvresults.length;
    if(count>0){
      if($scope.Selecteds.length == count)
        $scope.all_selected = true;
      if($scope.Selecteds.length)
        $scope.all_unselected = false;
    }
  }

  // Order by
  $scope.reverse = $scope.settings.cvresults.reverse;
  $scope.predicate = $scope.settings.cvresults.predicate;
  $scope.order = function(predicate) {
    $scope.reverse = ($scope.predicate === predicate) ? !$scope.reverse : false;
    $scope.predicate = predicate;
    $scope.settings.cvresults.predicate = $scope.predicate;
    $scope.settings.cvresults.reverse = $scope.reverse;
  };

  $scope.Selecteds = [];
  _.forEach($scope.settings.cvresults.Selecteds, function(selected) {
    if(selected != undefined){
      var sel_cvresult = _.find($scope.$parent.cvresults, function(cvresult) {
        return cvresult.id == selected.id;
      });
      if(sel_cvresult){
        sel_cvresult.selected = true;
        $scope.Selecteds.push(sel_cvresult);
      }
    }
  });
  $scope.settings.cvresults.Selecteds = $scope.Selecteds;

  check_selects();

}])

;
