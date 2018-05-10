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

angular.module('linc.cvresults.controller', [])

.controller('CVResultsCtrl', ['$scope', '$state', '$timeout', '$interval', '$uibModalInstance', '$uibModal',
  '$filter', 'LincServices', 'NotificationFactory', 'imageset', 'cvrequestId', 'cvresultsId', 'data_cvresults', 'TAG_LABELS',
  function ($scope, $state, $timeout, $interval, $uibModalInstance, $uibModal, $filter, LincServices,
  NotificationFactory, imageset, cvrequestId, cvresultsId, data_cvresults, TAG_LABELS) {

  $scope.title = 'CV Results (CV Request Id: '+ data_cvresults.req_id + ' - Status: ' + data_cvresults.status + ')';
  $scope.content = 'Form';
  $scope.imageset = imageset;
  $scope.cvresults = data_cvresults.cvresults;
  $scope.processing = false;

  var GET_FEATURES = function (lbs, TAGS){
    var label = "";
    TAGS.forEach(function (elem, i){
      label += lbs[elem];
      if(i<TAGS.length-1) label += ', ';
    });
    return label;
  };

  $scope.cvresults = _.map(data_cvresults.cvresults, function(element, index) {
    var style = {'background-color': 'green'};
    var elem = {};

    var TAGS = [];
    if(!element.gender) element.gender = 'unknown';
    if(element['tags']==undefined)element['tags']="[]";
    try{ TAGS = JSON.parse(element['tags']);
    }catch(e){ TAGS = element['tags'].split(","); }
    if(TAGS==null) TAGS = [];
    elem['tag_features'] = GET_FEATURES(TAG_LABELS, TAGS);
    elem['show_image'] = false;

    if(element.cn == null || element.cn == undefined){
      style = {};
      var conf = {'style': style};
      elem['confidence'] = conf;
    }
    else{
      if(element.cn > 1.)
        element.cn /= 100.;
      if(element.cn < .45)
        style = {'background-color': 'red'};
      else if(element.cn < .70)
        style = {'background-color': 'yellow', 'color': 'black'};
      
      var conf = {'number': element.cn, 'style': style};
      elem['confidence'] = conf;
      elem['dataloading'] = false;
    }
    return _.extend({}, element, elem);
  });

  var count = 0;

  $scope.show_photo = function(image){
    var win = window.open(image, "_blank", "toolbar=yes, scrollbars=yes, resizable=yes, top=100, left=100, width=600, height=600");
    win.focus();
  };

  $scope.CompareImages = function (lion){
    var data = {
      title: 'Compare Images',
      imageset: imageset,
      lion: lion,
      cvresults: $filter('orderBy')($scope.cvresults, $scope.predicate, $scope.reverse),
      reverse: $scope.reverse,
      predicate: $scope.predicate
    };
    // $state.go("comparecvresults", {data: data});
    var url = $state.href("comparecvresults", {data: data})
    window.open(url,"_blank", "location=0, scrollbars=yes, resizable=yes, top=100, left=100, width=800");
  };

  var Poller = function () {
    LincServices.GetCVResults(cvresultsId).then(function(response){
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
  };

  if(data_cvresults.status != 'finished' && data_cvresults.status != 'error'){
    start_Poller();
  }

  $scope.Close = function () {
    $uibModalInstance.close();
  };

  $scope.ClearResults= function () {
    LincServices.DeleteCVRequest(cvrequestId, function(){
      var data = {'lion_id': null, 'is_verified': false};
      LincServices.Associate(imageset.id, data, function(result){
        $scope.Updated({'lion_id': null, 'name': '-', 'lions_org_id': ''});
        $scope.EraseResults();
        $uibModalInstance.close();
      });
    });
  };

  $scope.Associate = function (lion){
    lion.dataloading = true;
    $scope.processing = true;
    _.forEach($scope.cvresults, function(cvresult) {
      cvresult.associated = false;
    });
    var data = {'lion_id': lion.id};
    if(imageset.organization_id === lion.organization_id){
      data['is_verified'] = true;
    }
    LincServices.Associate(imageset.id, data, function(result){
      lion.associated = true;
      $scope.Updated({'lion_id': lion.id, 'name' : lion.name,
        'is_verified': result.data.data.is_verified,
        'lions_org_id': lion.organization_id, 'organization' : lion.organization});
      NotificationFactory.success({
        title: "Associate", message:'Lion (id: ' + lion.id + ') was associated',
        position: "right", // right, left, center
        duration: 2000     // milisecond
      });
      lion.dataloading = false;
      $scope.processing = false;
    },
    function(error){
      if($scope.debug || (error.status != 401 && error.status != 403)){
        NotificationFactory.error({
          title: "Error", message: 'Unable to Associate the Lion (id: ' + lion.id + ') ',
          position: 'right', // right, left, center
          duration: 5000   // milisecond
        });
      }
      lion.dataloading = false;
      $scope.processing = false;
      console.log(error);
    });
  };

  $scope.Disassociate = function (lion){
    lion.dataloading = true;
    $scope.processing = true;
    var data = {'lion_id': null, 'is_verified': false};
    LincServices.Associate(imageset.id, data, function(result){
      lion.associated = false;
      $scope.Updated({'lion_id': null, 'name': '-', 'is_verified': false, 'lions_org_id': ''});
      NotificationFactory.success({
        title: "Disassociate", message:'Lion (id: ' + lion.id + ') was disassociated',
        position: "right", // right, left, center
        duration: 2000     // milisecond
      });
      lion.dataloading = false;
      $scope.processing = false;
    },
    function(error){
      if($scope.debug || (error.status != 401 && error.status != 403)){
        NotificationFactory.error({
          title: "Error", message: 'Unable to Disassociate the Lion (id: ' + lion.id + ')',
          position: 'right', // right, left, center
          duration: 5000   // milisecond
        });
      }
      console.log(error);
      lion.dataloading = false;
      $scope.processing = false;
    });
  };

  $scope.reverse = true;
  $scope.predicate = 'cv';

  $scope.order = function(predicate) {
    $scope.reverse = ($scope.predicate === predicate) ? !$scope.reverse : false;
    $scope.predicate = predicate;
    $timeout(function () {
      $scope.$apply(function () {
        $scope.ResizeTable();
      });
    }, 0);
  };



  $scope.GoTo = function (data){
    //ui-sref="lion({id: lion.id})"
    var scopeGo = $scope.$new();
    scopeGo.title = (data.type == 'lion') ? 'Lion Info' : 'Image Set Info';
    scopeGo.message = 'Would you like to open the ' + ((data.type == 'lion') ? 'lion' : 'image set') + ' info page?';
    var modalGoTo = $uibModal.open({
        templateUrl: 'Dialog.Delete.tpl.html',
        scope: scopeGo
    });

    modalGoTo.result.then(function (result) {
      var params = data.params ? data.params : {};
      var url = $state.href(data.type, params)
      var win_params = win_params ? win_params : { name: "_blank", specs: "location=0, scrollbars=yes, resizable=yes, top=100, left=100, width=800" };
      window.open(url, win_params.name, win_params.specs);
    }, function () {
    });
    scopeGo.ok = function (){
      modalGoTo.close();
    }
    scopeGo.cancel = function(){
      modalGoTo.dismiss();
    }
  };

  var old_selected_id = null;
  $scope.show_lion_image = false;
  $scope.SwitchImage = function(lion, val){
    if (!val){
      lion.show_image=false;
    }
    else{
      var show = lion.show_image;

      if (old_selected_id){
        var old_lion = _.find($scope.orderd_lions, {'id': old_selected_id});
        if (old_lion)
          old_lion['show_image'] = false;
      }
      lion.show_image = !show;
      old_selected_id = lion.id;
    }
    $scope.show_lion_image = _.some($scope.orderd_lions, { show_image: true });
  };

  $scope.ResizeTable = function(){
    var $table = $('table.table-cv-results'),
    $bodyCells = $table.find('tbody tr:first').children(),
    $headerCells = $table.find('thead tr:first').children();

    var colWidth = [];
    $table.find('tbody tr').each(function(j,tr){
      colWidth = $(tr).find('td').map(function(i, v) {
        return Math.max(v.offsetWidth, _.isNaN(colWidth[i]) ? 0 : colWidth[i]);
      }).get();
    });

    colWidth = $headerCells.map(function(i, v) {
      return Math.max(v.offsetWidth, colWidth[i]);
    }).get();

    $headerCells.each(function(i, v) {
      var min = Math.max(colWidth[i],30);
      if(min > 200)
        $(v).css({'width': '200px'});
      else
        $(v).css({'min-width': min + 'px'});

    });

    $table.find('tbody tr').each(function(j,tr){
      $(tr).find('td').each(function(i, v) {
        var min = Math.max(colWidth[i], 30);
        if(min > 200)
          $(v).css({'width': '200px'});
        else
          $(v).css({'min-width': min + 'px'});
      });
    });
  };
  $(window).resize(function() {
    $scope.ResizeTable();
  }).resize();
}]);
