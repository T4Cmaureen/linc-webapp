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

angular.module('linc.search.image.set.controllers', [])

.controller('SearchImageSetCtrl', ['$scope', '$timeout', '$q', '$interval', '$uibModal', '$stateParams', '$bsTooltip', 'NotificationFactory', 
  'LincServices', 'AuthService', 'PollerService', 'imagesets_filters', 'default_filters', 'imagesets', 'TAG_LABELS', 'TOOL_TITLE', 
  function ($scope, $timeout, $q, $interval, $uibModal, $stateParams, $bsTooltip, NotificationFactory, LincServices, AuthService, 
    PollerService, imagesets_filters, default_filters, imagesets, TAG_LABELS, TOOL_TITLE) {

  $scope.user = AuthService.user;

  $scope.is_modal_open = false;
  $scope.tooltip = {'features' :{'title': 'tips: ' + TOOL_TITLE, 'checked': true}};

  var count = 0;
  var cvrequest_pendings = [];
  var Poller = function () {
    PollerService.cvrequests_list().then(function(response){
      var cvrequests = response.data;
      var resolved = [];
      _.map(cvrequest_pendings, function(pendings, index){
        console.log("cvrequests" + index);
        var id = pendings.imageset.id;
        var index = pendings.id;
        var imageset = $scope.imagesets[index];
        var cvrequest = _.find(cvrequests, {'imageset_id': id});
        if(cvrequest){
          imageset.cvresults = cvrequest.cvres_obj_id;
          imageset.req_status = cvrequest.status;
          //if(count == 2)
          //  imageset.req_status = "success";
          /*if(imageset.cvresults && imageset.req_status != 'fail' &&
            imageset.req_status != 'submitted'){
            imageset.action = 'cvresults';
            resolved.push(pendings)
          }*/
          if(imageset.cvresults){
            imageset.action = 'cvresults';
            resolved.push(pendings)
          }
        }
      });
      _.forEach(resolved, function(item, i) {
        cvrequest_pendings = _.without(cvrequest_pendings, item);
      });
      count++;
      console.log('Count: ' + count + ' Still: ' + cvrequest_pendings.length) + 'pendings';
      if(!cvrequest_pendings.length){
        $scope.$parent.cancel_Poller();
      }
    }, function(error){
      console.log('Poller Error: ' + error.status);
      if(error.status != 403)
        $scope.$parent.cancel_Poller();
    });
  };

  var start_Poller = function (timer){
    if($scope.$parent.poller_promisse)
      $scope.$parent.cancel_Poller();

    if(!timer){
      Poller();
    }
    var repeat_timer = 40000;
    $timeout(function() {
      count = 0;
      $scope.$apply(function () {
        $scope.$parent.poller_promisse = $interval(Poller, repeat_timer);
        console.log("Results CV Request Poller started");
      });
    }, 0);
  }

  var GET_FEATURES = function (lbs, TAGS){
    var label = "";
    TAGS.forEach(function (elem, i){
      label += lbs[elem];
      if(i<TAGS.length-1) label += ', ';
    });
    return label;
  }

  var set_all_imagesets = function(sets){

    var get_permissions = function (user,imageset){
      var permissions = {};
      var imageset_ismine  = user.organization_id == imageset.organization_id;
      var lion_ismy = user.organization_id == imageset.lions_org_id;
      var lion_exist= imageset.lion_id!=undefined ;

      permissions['canShow'] = (user.admin || imageset_ismine);
      permissions['canLocate'] = (!imageset.geopos_private || user.admin || imageset_ismine);

      permissions['canDisassociate'] = (!user.admin && (imageset_ismine && !imageset.is_primary && lion_exist && imageset.is_verified));
      permissions['NeedVerify'] = ((user.admin || (!imageset_ismine && lion_ismy)) && !imageset.is_primary && lion_exist);

      permissions['CanSetPrimary'] = (!imageset.is_primary && lion_exist && imageset.is_verified) &&
                                     (user.admin || imageset_ismine && imageset.lions_org_id==user.organization_id);
    
      //permissions['showGeoPos'] = (user.admin || imageset_ismine) || !imageset.geopos_private;
      //permissions['canDelete'] = ((user.admin || imageset_ismine) && !imageset.is_primary);
      return permissions;
    }

    $scope.imagesets = _.map(sets, function(element, index) {

      element['permissions'] = get_permissions($scope.user, element);
      element['age'] = isNaN(parseInt(element['age'])) ? null : element['age'];
      
      var elem = {};
      if(!element.is_primary){
        if(element.lion_id){
          elem["action"] = '';
        }
        else{
          if(element.cvresults)
            elem["action"] = 'cvresults';
          else if(element.cvrequest){
            elem["action"] = 'cvpending';
            if(element['permissions'].canShow)
              cvrequest_pendings.push({'imageset': element, 'id': index});
          }
          else
            elem["action"] = 'cvrequest';
        }
      }
      else{
        elem["action"] = '';
      }

      if(!element.gender) element.gender = 'unknown';

      var TAGS = [];
      if(element['tags']==undefined)element['tags']="[]";
      try{ TAGS = JSON.parse(element['tags']);
      }catch(e){ TAGS = element['tags'].split(","); }
      if(TAGS==null) TAGS = [];

      var tag_features = GET_FEATURES(TAG_LABELS, TAGS);
      elem['tooltip'] = {features: {'title': tag_features, 'checked': true}};
      elem['features'] = (tag_features.length > 0) ? true : false;
      elem['tag_features'] = tag_features;
      return _.extend({}, element, elem);
    });
  }

  set_all_imagesets(imagesets);

  if(cvrequest_pendings.length)
    start_Poller(0);

  $scope.organizations = imagesets_filters.organizations;
  $scope.genders = imagesets_filters.genders;
  //$scope.isCollapsed = true;
  $scope.isAgeCollapsed = imagesets_filters.isAgeCollapsed;
  $scope.isOrgCollapsed = imagesets_filters.isOrgCollapsed;
  $scope.isNameIdCollapsed = imagesets_filters.isNameIdCollapsed;
  $scope.isFeaturesCollapsed = imagesets_filters.isFeaturesCollapsed;
  $scope.isGenderCollapsed = imagesets_filters.isGenderCollapsed;
  $scope.isLocationCollapsed = imagesets_filters.isLocationCollapsed;
  // Filters  scopes
  $scope.LionAge = imagesets_filters.LionAge;
  $scope.refreshSlider = function () {
    $timeout(function () {
        $scope.$broadcast('rzSliderForceRender');
    });
  };
  // Click in Photo - Show Big Image
  $scope.show_photo = function(url){
    var win = window.open(url, "_blank", "toolbar=yes, scrollbars=yes, resizable=yes, top=100, left=100, width=600, height=600");
    win.focus();
  }
  $scope.refreshSlider();
  //$scope.name_or_id ='';
  $scope.name_or_id = imagesets_filters.name_or_id;
  // tags
  $scope.tag_features = imagesets_filters.tag_features;
  // Location {Lat Lang Radius}
  $scope.location = imagesets_filters.location;
  // Order by
  //$scope.reverse = false;
  $scope.reverse = imagesets_filters.reverse;
  //$scope.predicate = 'id';
  $scope.predicate = imagesets_filters.predicate;
  $scope.order = function(predicate) {
    $scope.reverse = ($scope.predicate === predicate) ? !$scope.reverse : false;
    $scope.predicate = predicate;
    imagesets_filters.predicate = $scope.predicate;
    imagesets_filters.reverse = $scope.reverse;
  };
  $scope.PerPages = [
      {'index': 0, 'label' : '10 Image Sets', 'value': 10, 'disabled': false},
      {'index': 1, 'label' : '20 Image Sets', 'value': 20, 'disabled': $scope.imagesets.length < 10 ?  true : false},
      {'index': 2, 'label' : '30 Image Sets', 'value': 30, 'disabled': $scope.imagesets.length < 20 ?  true : false},
      {'index': 3, 'label' : '60 Image Sets', 'value': 60, 'disabled': $scope.imagesets.length < 30 ?  true : false},
      {'index': 4, 'label' : '100 Image Sets', 'value' : 100, 'disabled': $scope.imagesets.length < 60 ?  true : false}
    ];

  $scope.PerPage = imagesets_filters.PerPage;
  $scope.changeItensPerPage = function(){
    $scope.setPage(0);
    var min_val = ($scope.filtered_image_sets==undefined) ? $scope.imagesets.length : $scope.filtered_image_sets.length;
    switch ($scope.PerPage){
      case 0:
        $scope.itemsPerPage = Math.min(10, min_val);
        imagesets_filters.PerPage = $scope.PerPages[0].index;
      break;
      case 1:
        $scope.itemsPerPage = Math.min(20, min_val);;
        imagesets_filters.PerPage = $scope.PerPages[1].index;
      break;
      case 2:
        $scope.itemsPerPage = Math.min(30, min_val);;
        imagesets_filters.PerPage = $scope.PerPages[2].index;
      break;
      case 3:
        $scope.itemsPerPage = Math.min(60, min_val);;
        imagesets_filters.PerPage = $scope.PerPages[3].index;
      break;
      default:
        $scope.itemsPerPage = Math.min(100, min_val);;
        imagesets_filters.PerPage = $scope.PerPages[4].index;;
    }
  }

  // Change Name_or_Id input
  $scope.change_name_or_id = function(){
    imagesets_filters.name_or_id = $scope.name_or_id;
    $scope.setPage(0);
  }
  $scope.change_organizations = function(){
    $scope.setPage(0);
  }
  $scope.change_features = function(){
    $scope.setPage(0);
  }
  $scope.change_gender = function(){
    $scope.setPage(0);
  }
  $scope.change_age = function(){
    $scope.setPage(0);
  }
  $scope.change_location = function(){
    $scope.setPage(0);
  }
  // Click Collapse
  $scope.collapse_age = function(){
    $scope.isAgeCollapsed = !$scope.isAgeCollapsed;
    imagesets_filters.isAgeCollapsed = $scope.isAgeCollapsed;
  }
  $scope.collapse_organizations = function(){
    $scope.isOrgCollapsed = !$scope.isOrgCollapsed;
    imagesets_filters.isOrgCollapsed = $scope.isOrgCollapsed;
  }
  $scope.collapse_name_id = function(){
    $scope.isNameIdCollapsed = !$scope.isNameIdCollapsed;
    imagesets_filters.isNameIdCollapsed = $scope.isNameIdCollapsed;
  }
  $scope.collapse_features = function(){
    $scope.isFeaturesCollapsed = !$scope.isFeaturesCollapsed;
    imagesets_filters.isFeaturesCollapsed = $scope.isFeaturesCollapsed;
  }
  $scope.collapse_gender = function(){
    $scope.isGenderCollapsed = !$scope.isGenderCollapsed;
    imagesets_filters.isGenderCollapsed = $scope.isGenderCollapsed;
  }
  $scope.collapse_location = function(){
    $scope.isLocationCollapsed = !$scope.isLocationCollapsed;
    imagesets_filters.isLocationCollapsed = $scope.isLocationCollapsed;
  }
  $scope.setPage = function(n) {
    $scope.currentPage = n;
    imagesets_filters.currentPage = $scope.currentPage;
  };
  $scope.prevPage = function() {
    if ($scope.currentPage > 0)
      $scope.setPage($scope.currentPage - 1);
  };
  $scope.nextPage = function() {
    if ($scope.currentPage < $scope.pageCount()-1)
      $scope.setPage($scope.currentPage + 1);
  };
  $scope.firstPage = function() {
    $scope.setPage(0)
  };
  $scope.lastPage = function() {
    if ($scope.currentPage < $scope.pageCount()-1)
      $scope.setPage($scope.pageCount()-1);
  };
  $scope.prevPageDisabled = function() {
    return $scope.currentPage === 0 ? "disabled" : "";
  };
  $scope.nextPageDisabled = function() {
    return ($scope.currentPage === $scope.pageCount()-1 || !$scope.pageCount())? "disabled" : "";
  };
  $scope.pageCount = function() {
    return Math.ceil($scope.filtered_image_sets.length/$scope.itemsPerPage);
  };
  $scope.range = function() {
    var rangeSize = Math.min(5, $scope.pageCount());
    var ret = [];
    var start = $scope.currentPage -3;
    if ( start < 0 ) start = 0;
    if ( start > $scope.pageCount()-(rangeSize-3) ) {
      start = $scope.pageCount()-rangeSize+1;
    }
    var max = Math.min(start+rangeSize,$scope.pageCount());
    for (var i=start; i<max; i++) {
      ret.push(i);
    }
    return ret;
  };
  $scope.viewer_label = function(){
    var label = "0 image sets found";
    if($scope.filtered_image_sets != undefined && $scope.filtered_image_sets.length){
      label = ($scope.filtered_image_sets.length).toString() + " image sets found - " +
              ($scope.currentPage*$scope.itemsPerPage+1).toString() + " to " +
              (Math.min((($scope.currentPage+1)*$scope.itemsPerPage),$scope.filtered_image_sets.length)).toString();
    }
    return label;
  }

  $scope.CVReqSuccess = function (imageset_Id, requestObj) {
    var index = _.indexOf($scope.imagesets, _.find($scope.imagesets, {id: imageset_Id}));
    $scope.imagesets[index].action = 'cvpending';
    $scope.imagesets[index].cvrequest = requestObj.obj_id;
    console.log('Success CV Request');
    cvrequest_pendings.push({'imageset': $scope.imagesets[index], 'id': index});
    start_Poller(1);
  };
  $scope.CVResultsErased = function (ImagesetId) {
    var index = _.indexOf($scope.imagesets, _.find($scope.imagesets, {id: ImagesetId}));
    $scope.imagesets[index]['action'] = 'cvrequest';
    $scope.imagesets[index]['cvresults'] = null;
    $scope.imagesets[index]['cvrequest'] = null;
  }

  $scope.Verify = function (imageset) {
    var modalScope = $scope.$new();
    modalScope.title = 'Verify Associated Image Set';
    modalScope.imageset = angular.copy(imageset);
    
    var modalInstance  = $uibModal.open({
        templateUrl: 'verify_imageset.tpl.html',
        scope: modalScope
    });
    modalInstance.result.then(function (result) {
      if(result)
        $scope.Verify_Imageset(modalScope.imageset.id);
      else
        $scope.Disassociate(modalScope.imageset);
    },
    function (){
    });

    modalScope.cancel = function(){
      modalInstance.dismiss();
    }
    // Set Imageset Verified
    modalScope.ok = function (result) {
      modalInstance.close(result);
    };
  };

  $scope.Verify_Imageset = function (ImagesetId) {
    var data = {"is_verified": true};
    LincServices.Verify(ImagesetId, data, function(){
      var id = _.indexOf($scope.imagesets, _.find($scope.imagesets, {id: ImagesetId}));
      $scope.imagesets[id].is_verified = true;
      Set_Tags($scope.imagesets[id]);
      NotificationFactory.success({
        title: "Image Set", message:'Image Set has been marked as verified',
        position: "right", // right, left, center
        duration: 2000     // milisecond
      });
      set_all_imagesets($scope.imagesets);
    },
    function(error){
      if($scope.debug || (error.status != 401 && error.status != 403)){
        NotificationFactory.error({
          title: "Error", message: 'Fail to verify Image Set',
          position: 'right', // right, left, center
          duration: 5000   // milisecond
        });
      }
      console.log(error);
    });
  };
  $scope.Disassociate = function (imageset){
    var data = {'lion_id': null, 'is_verified': false};
    LincServices.Associate(imageset.id, data, function(response){
      var message = {
        title: 'Disassociate',
        Sucess:'Lion was disassociated.',
        Error: 'Unable to disassociate this Image Set.'
      };
      var promises = _.map($scope.imagesets, function(item) {
        var deferred = $q.defer();
        if(item.lion_id==imageset.lion_id){
          deferred.resolve(LincServices.ImageSet(item.id));
        }
        else{
          deferred.resolve(item);
        }
        return deferred.promise;
      });
      $q.all(promises).then(function (results) {
        $scope.imagesets = angular.copy(results);
        set_all_imagesets($scope.imagesets);
        NotificationFactory.success({
          title: message.title, 
          message: message.Sucess,
          position: "right",
          duration: 2000
        });
      },
      function (reason) {
        NotificationFactory.error({
          title: "Fail: " + message.title, 
          message: message.Error,
          position: 'right',
          duration: 5000
        });
      });
    },
    function(error){
      if($scope.debug || (error.status != 401 && error.status != 403)){
        NotificationFactory.error({
          title: "Error", message: 'Unable to Disassociate the Lion',
          position: 'right', // right, left, center
          duration: 5000   // milisecond
        });
      }
      console.log(error);
    });
  };

  $scope.UpdateImageset = function(data, ImagesetId){
    var index = _.indexOf($scope.imagesets, _.find($scope.imagesets, {id: ImagesetId}));
    var imageset = $scope.imagesets[index];
    var change = {'name': data.name, 'lion_id': data.lion_id,
    'is_verified': data.is_verified, 'lions_org_id': data.lions_org_id};
    _.merge(imageset, imageset, change);
    Set_Tags(imageset);
    set_all_imagesets($scope.imagesets);
  }

  $scope.SetPrimary = function (imageset){
    var modalScope = $scope.$new();
    modalScope.title = 'Primary Image Set';
    modalScope.message = 'Do you want to set as Primary Image Set?';
    var message = {
      Sucess:'Imageset was successfully set as primary.',
      Error: 'Unable to set this Image Set as primary.'
    };
    
    var modalInstance = $uibModal.open({
        templateUrl: 'Dialog.Delete.tpl.html',
        scope: modalScope
    });

    modalInstance.result.then(function (result) {
      var data = {'primary_image_set_id': imageset.id};
      LincServices.SetPrimary(imageset.lion_id, data, function(resp){
        var promises = _.map($scope.imagesets, function(item) {
          var deferred = $q.defer();
          if(item.lion_id==imageset.lion_id){
            deferred.resolve(LincServices.ImageSet(item.id));
          }
          else{
            deferred.resolve(item);
          }
          return deferred.promise;
        });
        $q.all(promises).then(function (results) {
          $scope.imagesets = angular.copy(results);
          set_all_imagesets($scope.imagesets);
          NotificationFactory.success({
            title: modalScope.title, 
            message: message.Sucess,
            position: "right",
            duration: 2000
          });
        },
        function (reason) {
          NotificationFactory.error({
            title: "Fail: " + modalScope.title, 
            message: message.Error,
            position: 'right',
            duration: 5000
          });
        });
      },
      function(error){
        if($scope.debug || (error.status != 401 && error.status != 403)){
          NotificationFactory.error({
            title: "Fail: " + modalScope.title, 
            message: message.Error,
            position: 'right',
            duration: 5000
          });
        }
      });
    }, function () {
      console.log('Modal dismissed at: ' + new Date());
    });
    modalScope.ok = function (){
      modalInstance.close();
    }
    modalScope.cancel = function(){
      modalInstance.dismiss();
    }
  };

  $scope.filters = $stateParams.filter ? $stateParams.filter : {};

  if(Object.keys($scope.filters).length){
    console.log('Search Imagesets - has filter params');
    $scope.name_or_id = $scope.filters.hasOwnProperty('name_or_id') ? $scope.filters.name_or_id : default_filters.name_or_id;
    $scope.tag_features = $scope.filters.hasOwnProperty('tag_features') ? $scope.filters.tag_features : default_filters.tag_features;
    $scope.organizations = $scope.filters.hasOwnProperty('organizations') ? $scope.filters.organizations : default_filters.organizations;
    $scope.genders = $scope.filters.hasOwnProperty('genders') ? $scope.filters.genders : default_filters.genders;
    $scope.LionAge = $scope.filters.hasOwnProperty('LionAge') ? $scope.filters.LionAge : default_filters.LionAge;

    $scope.isAgeCollapsed = $scope.filters.hasOwnProperty('isAgeCollapsed') ? $scope.filters.isAgeCollapsed : default_filters.isAgeCollapsed;
    $scope.isOrgCollapsed = $scope.filters.hasOwnProperty('isOrgCollapsed') ? $scope.filters.isOrgCollapsed : default_filters.isOrgCollapsed;
    $scope.isNameIdCollapsed = $scope.filters.hasOwnProperty('isNameIdCollapsed') ? $scope.filters.isNameIdCollapsed : default_filters.isNameIdCollapsed;
    $scope.isFeaturesCollapsed = $scope.filters.hasOwnProperty('isFeaturesCollapsed') ? $scope.filters.isFeaturesCollapsed : default_filters.isFeaturesCollapsed;
    $scope.isGenderCollapsed = $scope.filters.hasOwnProperty('isGenderCollapsed') ? $scope.filters.isGenderCollapsed : default_filters.isGenderCollapsed;
    $scope.changeItensPerPage();
  }
  else{
      // Pagination scopes
    var cur_per_page = imagesets_filters.currentPage;
    $scope.changeItensPerPage();
    $scope.currentPage = cur_per_page;
  }

  var Set_Tags = function(element){
    element.permissions.canShow = ($scope.user.admin || $scope.user.organization_id == element.organization_id);
    element.permissions.NeedVerify = (!element.is_primary && element.lion_id &&
      ($scope.user.organization_id == element.lions_org_id) &&
      ($scope.user.organization_id != element.organization_id));
  };

}]);
