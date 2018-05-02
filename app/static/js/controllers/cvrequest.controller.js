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

angular.module('linc.cvrequest.controller', [])

.controller('CVRequesCtrl', ['$scope', '$window', '$state', '$timeout', '$uibModalInstance', 'LincServices', 'NotificationFactory', 
  'imageset', 'lions', 'cvrequests_options', 'AuthService', 'TAG_LABELS', 'TOOL_TITLE', function ($scope, $window, $state, $timeout, 
  $uibModalInstance, LincServices, NotificationFactory, imageset, lions, cvrequests_options, AuthService, TAG_LABELS, TOOL_TITLE) {

  $scope.title = 'CV Search';
  $scope.content = 'Search';
  $scope.imageset = imageset;

  $scope.title_tooltip = {'title': 'tips: ' + TOOL_TITLE, 'checked': true};

  var GET_FEATURES = function (lbls, TAGS){
    var label = "";
    TAGS.forEach(function (elem, i){
      label += lbls[elem];
      if(i<TAGS.length-1) label += ', ';
    });
    return label;
  };

  $scope.show_photo = function(object){
    if(angular.isObject(object)){
      var url = $state.href("viewimages", {'images':{'imageset': imageset, 'lion': object}},  {absolute: true});
      window.open(url,"_blank", "toolbar=yes, scrollbars=yes, resizable=yes, top=100, left=100, width=1200");
    }
    else if (angular.isString(object)){
      var win = window.open(object, "_blank", "toolbar=yes, scrollbars=yes, resizable=yes, top=100, left=100, width=600, height=600");
      win.focus();    
    }
  };

  $scope.user = AuthService.user;

  var get_permissions = function (user,lion){
    var permissions = {};
    var lion_ismine  = user.organization_id == lion.organization_id;
    permissions['canLocate'] = (!lion.geopos_private || user.admin || lion_ismine);
    return permissions;
  };

  $scope.lions = _.map(lions, function(element, index) {

    element['permissions'] = get_permissions($scope.user, element);

    var elem = {};
    var TAGS = [];
    if(!element.gender) element.gender = 'unknown';
    if(element['tags']==undefined)element['tags']="[]";
    try{ TAGS = JSON.parse(element['tags']);
    }catch(e){ TAGS = element['tags'].split(","); }
    if(TAGS==null) TAGS = [];

    var tag_features = GET_FEATURES(TAG_LABELS, TAGS);
    elem['features_tooltip'] = {'title': tag_features, 'checked': true};
    elem['features'] = (tag_features.length > 0) ? true : false;
    elem['tag_features'] = tag_features;

    return _.extend({}, element, elem);
  });

  $scope.refreshSlider = function () {
    $timeout(function () {
        $scope.$broadcast('rzSliderForceRender');
    });
  };

  $scope.refreshSlider();

  $scope.filters = cvrequests_options.filters;
  $scope.isCollapsed = cvrequests_options.isCollapsed;
  $scope.orderby =cvrequests_options.orderby;

  $scope.change = function(type){
    cvrequests_options.filters[type] = $scope.filters[type];
  };

  // Click Collapse
  $scope.collapse = function(type){
    cvrequests_options.isCollapsed[type] = $scope.isCollapsed[type] = !$scope.isCollapsed[type];
  };

  $scope.order = function(predicate) {
    $scope.orderby.reverse = ($scope.orderby.predicate === predicate) ? !$scope.orderby.reverse : false;
    $scope.orderby.predicate = predicate;
    lion_options.orderby = $scope.orderby;
  };

  $scope.viewer_label = function(){
    var label = "0 lions found";
    if($scope.filtered_lions != undefined && $scope.filtered_lions.length){
      label = ($scope.filtered_lions.length).toString() + " lions found";
    }
    return label;
  };

  $scope.Close = function () {
    $uibModalInstance.dismiss("close");
  };

  $scope.loading = false;
  $scope.requestCV = function () {
    var lions_id = _.map($scope.filtered_lions, 'id');
    var data = {"lions": lions_id};
    $scope.loading = true;
    LincServices.RequestCV(imageset.id, data, function(result){
      var requestObj = result.data.data;
      $uibModalInstance.close(requestObj);
      NotificationFactory.success({
        title: "Success", message:'CV Request created with success',
        position: "right", // right, left, center
        duration: 2000     // milisecond
      });
      $scope.loading = false;
    });
  };
  
}]);
