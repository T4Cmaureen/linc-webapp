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

angular.module('linc.cvresults.controller', ['linc.cvresults.directive'])

.controller('CVResultsCtrl', ['$scope', '$state', '$timeout', '$interval', '$uibModalInstance', 'LincServices', 'NotificationFactory', 'imageset', 'cvrequestId', 'cvresultsId', 'data_cvresults', function ($scope, $state, $timeout, $interval, $uibModalInstance, LincServices, NotificationFactory, imageset, cvrequestId, cvresultsId, data_cvresults) {

  $scope.title = 'CV Results (CV Request Id: '+ data_cvresults.req_id + ' - Status: ' + data_cvresults.status + ')';
  $scope.content = 'Form';
  $scope.imageset = imageset;
  $scope.cvresults = data_cvresults.cvresults;
  $scope.cvresults = _.map(data_cvresults.cvresults, function(element, index) {
    var style = {'background-color': 'green'};
    var elem = {};

    if(element.cn == null || element.cn == undefined){
      style = {};
      var conf = {'style': style};
      elem['confidence'] = conf;
    }
    else{
      if(element.cn < .45)
        style = {'background-color': 'red'};
      else if(element.cn < .70)
        style = {'background-color': 'yellow', 'color': 'black'};
      
      var conf = {'number': element.cn/100., 'style': style};
      elem['confidence'] = conf;
    }
    return _.extend({}, element, elem);
  });

  var count = 0;

  $scope.show_photo = function(object){
    if(angular.isObject(object)){
      var url = $state.href("viewimages", {'images':{'imageset': imageset, 'lion': object}},  {absolute: true});
      window.open(url,"_blank", "toolbar=yes, scrollbars=yes, resizable=yes, top=100, left=100, width=1200");
    }
    else if (angular.isString(object)){
      var win = window.open(object, "_blank", "toolbar=yes, scrollbars=yes, resizable=yes, top=100, left=100, width=600, height=600");
      win.focus();    
    }
  }

  var Poller = function () {
    LincServices.getCVResults(cvresultsId).then(function(response){
      $scope.cvresults = response.cvresults;
      if(response.status == 'finished' || response.status == 'error'){
        console.log('Res Canceled - Status: ' + response.status);
        $scope.title = 'CV Results (CV Request Id: '+ data_cvresults.req_id + ' - Status: ' + response.status + ')';
        $scope.cancel_Poller();
      }
      count++;
      console.log('Res Count: ' + count);
    }, function(error){
      if(error.status != 403)
        $scope.cancel_Poller();
    });
  };

  var start_Poller = function (){
    if($scope.get_poller_promisse())
      $scope.cancel_Poller();
    Poller();
    var repeat_timer = 20000;
    $timeout(function() {
      count = 0;
      $scope.$apply(function () {
        $scope.set_poller_promisse($interval(Poller, repeat_timer));
        console.log("Result CV Req Poller started");
      });
    }, 0);
  }

  if(data_cvresults.status != 'finished' && data_cvresults.status != 'error'){
    start_Poller();
  }

  $scope.Close = function () {
    $uibModalInstance.close();
  };
  $scope.ClearResults= function () {
    LincServices.deleteCVRequest(cvrequestId, function(){
      var data = {'lion_id': null, 'is_verified': false};
      LincServices.Associate(imageset.id, data, function(result){
        $scope.Updated({'lion_id': null, 'name': '-', 'lions_org_id': ''});
        $scope.EraseResults();
        $uibModalInstance.close();
      });
    });
  };
  $scope.Associate = function (id){
    _.forEach($scope.cvresults, function(lion) {
      lion.associated = false;
    });
    var index = _.indexOf($scope.cvresults, _.find($scope.cvresults, {id: id}));
    var data = {'lion_id': id};
    if(imageset.organization_id === $scope.cvresults[index].organization_id){
      data['is_verified'] = true;
    }
    LincServices.Associate(imageset.id, data, function(result){
      $scope.cvresults[index].associated = true;
      $scope.Updated({'lion_id': id, 'name' : $scope.cvresults[index].name,
        'is_verified': result.data.data.is_verified,
        'lions_org_id': $scope.cvresults[index].organization_id, 'organization' : $scope.cvresults[index].organization});
      NotificationFactory.success({
        title: "Associate", message:'Lion (id: ' + id + ') was associated',
        position: "right", // right, left, center
        duration: 2000     // milisecond
      });
    },
    function(error){
      if($scope.debug || (error.status != 401 && error.status != 403)){
        NotificationFactory.error({
          title: "Error", message: 'Unable to Associate the Lion (id: ' + id + ') ',
          position: 'right', // right, left, center
          duration: 5000   // milisecond
        });
      }
      console.log(error);
    });
  };

  $scope.Disassociate = function (id){
    var index = _.indexOf($scope.cvresults, _.find($scope.cvresults, {id: id}));
    var data = {'lion_id': null, 'is_verified': false};
    LincServices.Associate(imageset.id, data, function(result){
      $scope.cvresults[index].associated = false;
      $scope.Updated({'lion_id': null, 'name': '-', 'is_verified': false, 'lions_org_id': ''});
      NotificationFactory.success({
        title: "Disassociate", message:'Lion (id: ' + id + ') was disassociated',
        position: "right", // right, left, center
        duration: 2000     // milisecond
      });
    },
    function(error){
      if($scope.debug || (error.status != 401 && error.status != 403)){
        NotificationFactory.error({
          title: "Error", message: 'Unable to Disassociate the Lion (id: ' + id + ')',
          position: 'right', // right, left, center
          duration: 5000   // milisecond
        });
      }
      console.log(error);
    });
  };

  $scope.reverse = true;//lion_filters.reverse;
  $scope.predicate = 'cv';//lion_filters.predicate;

  $scope.order = function(predicate) {
    $scope.reverse = ($scope.predicate === predicate) ? !$scope.reverse : false;
    $scope.predicate = predicate;
  };

}]);
