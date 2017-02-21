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

angular.module('linc.controllers', ['linc.admin.controller',
                                    'linc.home.controller',
                                    'linc.login.controller',
                                    'linc.side.menu.controller',
                                    'linc.lions.controllers',
                                    'linc.image.set.controllers',
                                    'linc.conservationists.controller',
                                    'linc.image.gallery.controller',
                                    'linc.metadata.controller',
                                    'linc.location.history.controller',
                                    'linc.cvresults.controller',
                                    'linc.cvrequest.controller',
                                    'linc.upload.images.controller',
                                    'linc.notification.factory',
                                    'linc.data.factory' ])

.controller('BodyCtrl', ['$scope', '$state', '$interval', '$timeout', '$uibModal', 'AuthService', 'NotificationFactory',
  function ($scope, $state, $interval, $timeout, $uibModal, AuthService, NotificationFactory){

    $scope.bodyClasses = 'default';
    $scope.debug = false;
    // this'll be called on every state change in the app
    $scope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams){
      $scope.cancel_Poller();
      if (toState.data != undefined && angular.isDefined(toState.data.bodyClasses)) {
        $scope.bodyClasses = toState.data.bodyClasses;
        $scope.debug = $state.current.data.debug;
        return;
      }
      $scope.bodyClasses = 'default';
    });
    $scope.Auth = AuthService;
    $scope.poller_promisse = undefined;
    $scope.cancel_Poller = function(){
      if($scope.poller_promisse){
        $interval.cancel($scope.poller_promisse);
        $scope.poller_promisse = undefined;
        console.log("Results CV Request Poller canceled");
      }
    }

    $scope.changePWD = function(user){
      var modalScope = $scope.$new();
      modalScope.dataSending = false;
      modalScope.tooltip = {title: '<span><i class="icon icon-info"></i>passwords must match</span>', checked: false};
      modalScope.title = 'Change your password?';
      modalScope.showValidationMessages = false;
      modalScope.user = {
        'email': user.name, 
        'id': user.id, 
        'password': {
          'password':'',
          'confirm': ''
        }
      };
      var modalInstance = $uibModal.open({
        templateUrl: 'ChangePwd.tpl.html',
        scope: modalScope,
        size: '350px'
      });
      modalInstance.result.then(function (result) {
        modalScope.dataSending = false;
        //ShowInfo();
      }, function(error){
        modalScope.dataSending = false;
      });

      modalScope.changePassword = function (valid){
        if(valid){
          modalScope.dataSending = true;
          var data = {
            'user_id' : modalScope.user.id, 
            'data': {'new_password': modalScope.user.password.password}
          };
          AuthService.ChangePassword(data).then(function(response){
            NotificationFactory.success({
              title: 'Change Password', message: 'Password of '+ modalScope.user.email +' successfully updated',
              position: "right", // right, left, center
              duration: 5000     // milisecond
            });
            modalInstance.close();
          },
          function(error){
            NotificationFactory.error({
              title: "Fail", message: 'Fail to change Password',
              position: 'right', // right, left, center
              duration: 5000   // milisecond
            });
            modalInstance.dismiss();
          });
        }
        else {
          modalScope.showValidationMessages = true;
        }
      }
      modalScope.cancel = function(){
        modalInstance.dismiss();
      }
    };
  }
])

.controller('ViewImagesCtrl', ['$scope', '$stateParams',
  function ($scope, $stateParams){
    $scope.images = $stateParams.images ? $stateParams.images : {};
  }
])

.filter('offset', function() {
  return function(input, start) {
    start = parseInt(start, 10);
    var res = _.slice(input, start);
    return res
  };
})

// Age Filter
.filter('age_filter', function(){
  return function(input, age) {
    var filtered = _.filter(input, function(value){
        if(isNaN(value.age)) return true;
        return value.age >= age.min && value.age <= age.max;
    });
    return filtered;
  };
})
// Name or Id Filter
.filter('nameid_filter', function(){
  return function(input, name_str, special_str) {
    if(name_str == undefined || !name_str.length)
      return input;

    var name = name_str.toLowerCase();

    // split by space
    var name_pieces = name.match(/\S+/g);
    //var id = parseInt(name, 10);

    var filtered = _.filter(input, function(value){
      var val = value.name.toLowerCase();
      var contain = false;
      name_pieces.forEach(function (piece, i){
        var idx = piece.indexOf('!');
        if(special_str.length && idx!=-1)
        {
          var special = piece.substring(idx+1, piece.length);
          if(value.hasOwnProperty(special_str) && value[special_str] == special)
          {
            contain = true;
            return;
          }
        }else{
          if(val.indexOf(piece) != -1){
            contain = true;
            return;
          }
          if(parseInt(piece, 10) == value.id){
            contain = true;
            return;
          }
        }
        if(piece.length==1 && piece[0]==="*"){
          contain = true;
          return;
        }
      });
      return contain; //(contain || (value.id === id));
    });
    return filtered;
  };
})

// All Marking
.filter('features_filter', function(){
  return function(input, features_str) {
    if(!features_str.length)
      return input;

    var features = features_str.toLowerCase();
    var toExcludes = [];
    var toIncludes = [];
    // All Compost Values
    var compost = features.match(/(["'])(?:(?=(\\?))\2.)*?\1/g);
    if(compost){
      compost.forEach(function (co, i){
        var ini = features.indexOf(co);
        var val = co.slice(1,-1);
        // Negatives
        if(ini-1>=0 && features[ini-1] == '-'){
          toExcludes.push(val);
          features = features.replace('-' + co, '');
        }
        else{
          toIncludes.push(val);
          features = features.replace(co, '');
        }
      });
    }
    console.log("incluir c: " + toIncludes);
    console.log("encluir c: " + toExcludes);
    var single = features.match(/\S+/g);
    if(single){
      single.forEach(function (si, i){
        var ini = features.indexOf(si);
        // Negatives
        if(ini>=0 && features[ini] == '-'){
          var val = si.slice(1);
          toExcludes.push(val);
          features = features.replace(si, '');
        }
        else{
          toIncludes.push(si);
          features = features.replace(si, '');
        }
      });
    }
    console.log("incluir s: " + toIncludes);
    console.log("encluir s: " + toExcludes);
    
    var filtered = _.filter(input, function(value){
      var val = value.tag_features.toLowerCase();
      // For each piece test contained in input
      var contain = true;
      toIncludes.forEach(function (piece, i){
        if(val.indexOf(piece) == -1){
          contain = false;
          return;
        }
      });
      // Excluse NOT 
      if(contain){
        toExcludes.forEach(function (piece, i){
          if(val.indexOf(piece) != -1){
            contain = false;
            return;
          }
        });
      }
      return contain;
    });
    return filtered;
  };
})

// Filter by Organization
.filter('organization_filter', function(){
  return function(input, organizations) {
    var filtered = _.filter(input, function(value){
        return (_.result(_.find(organizations, {'name': value.organization}), 'checked'));
    });
    return filtered;
  };
})

// Filter by Organization
.filter('gender_filter', function(){
  return function(input, genders) {
    var filtered = _.filter(input, function(value){
        if(!value.gender)
          return value;
        return (_.result(_.find(genders, {'name': value.gender}), 'checked'));
    });
    return filtered;
  };
})

.filter('percentage', ['$filter', function ($filter) {
  return function (input, decimals) {
    return $filter('number')(input * 100, decimals) + '%';
  };
}])

.filter('PrivateFilter', function(){
  return function(input, show_private) {
    if (show_private)
      return input;
    else{
      var filtered = _.filter(input, function(value){
        return value.is_public;
      });
      return filtered;
    }
  };
})

.filter('LatLngFilter', function(){
  var check_dist = function (lat1, lon1, lat2, lon2, radius){
    var R = 6371; // m (change this constant to get miles)
    var dLat = (lat2-lat1) * Math.PI / 180;
    var dLon = (lon2-lon1) * Math.PI / 180;
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180 ) * Math.cos(lat2 * Math.PI / 180 ) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = R * c; // km
    //var dist = Math.round(d*1000*100)/100;
    return (d <= radius);
  };

  return function(input, location, isprivate) {

    if(location.latitude == undefined || location.longitude == undefined || location.radius == undefined)
      return input;
    if(!location.latitude.length || !location.longitude.length || !location.radius.length)
      return input;
    var lat = Number(location.latitude);
    //if(isNaN(lat)) return input;
    var lng = Number(location.longitude);
    //if(isNaN(lng)) return input;
    var radius = Number(location.radius);
    //if(isNaN(radius)) return input;

    var filtered = _.filter(input, function(value){
      if(!value.latitude) return false;
      if(!value.longitude) return false;
      if(isprivate!=undefined && !value.permissions.canLocate) return false;
      return check_dist(lat, lng, value.latitude, value.longitude, radius);
    });
    return filtered;
  };

})

.filter('propsFilter', function() {
  return function(items, props) {
    var out = [];

    if (angular.isArray(items)) {
      var keys = Object.keys(props);
        
      items.forEach(function(item) {
        var itemMatches = false;

        for (var i = 0; i < keys.length; i++) {
          var prop = keys[i];
          var text = props[prop].toLowerCase();
          if (item[prop].toString().toLowerCase().indexOf(text) !== -1) {
            itemMatches = true;
            break;
          }
        }

        if (itemMatches) {
          out.push(item);
        }
      });
    } else {
      // Let the output be the input untouched
      out = items;
    }

    return out;
  };
})


// Filter by Image Types
.filter('imageTypes_filter', function(){
  return function(input, imagetypes) {
    var filtered = _.filter(input, function(image){
        return (_.result(_.find(imagetypes, {'type': image.type}), 'checked'));
    });
    return filtered;
  };
})

;
