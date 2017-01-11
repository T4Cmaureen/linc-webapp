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

angular.module('linc.location.history.controller', ['linc.location.history.directive'])

.controller('LocationHistoryCtrl', ['$scope', '$state', '$timeout', '$uibModal', '$q', '$uibModalInstance', 
  'LincServices', 'AuthService', 'options', 'history',
  function ($scope, $state, $timeout, $uibModal, $q, $uibModalInstance, LincServices, AuthService, options, history) {
    var user = AuthService.user;
    $scope.title = 'Location History';
    $scope.content = 'Map';

    $scope.radius = 5000;
    $scope.global_radius = 15000;
    $scope.arrow = {'show': true};
 
    $scope.show = (options.type == 'lion' || ((options.type == 'imageset') && options.is_primary));

    function compare(a,b) {
      if (a.date < b.date) return -1;
      if (a.date > b.date) return 1;
      return 0;
    };

    $scope.locations = (_.filter(_.map(history.locations, function(element, index){
      var elem = {};
      elem['date'] = element['date_stamp'] ? element['date_stamp'] : element['updated_at'];
      var title = element['date_stamp'] ? 'Date Stamp' : 'No stamp date.<br>Using the update date.';
      var checked = element['date_stamp'] ? false : true;
      elem['tooltip'] = {title: title, checked: checked};
      return _.extend({}, element, elem);
    }), function(hist){
      if(!hist.geopos_private) 
        return true;
      else
        return (user.admin || (user.organization_id == hist.organization_id));
    })).sort(compare);

    $scope.count = $scope.locations.length;
    
    // Close Location History
    $scope.Cancel = function () {
     $uibModalInstance.dismiss();
    };

    // Calc distance between 2 points
    var Calc_distancia = function (p1, p2){
      var lat1 = p1.lat();var lon1 = p1.lng()
      var lat2 = p2.lat();var lon2 = p2.lng()

      var R = 6371; // km (change this constant to get miles)
      var dLat = (lat2-lat1) * Math.PI / 180;
      var dLon = (lon2-lon1) * Math.PI / 180;
      var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat1 * Math.PI / 180 ) * Math.cos(lat2 * Math.PI / 180 ) *
          Math.sin(dLon/2) * Math.sin(dLon/2);
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      var d = R * c;
      return (Math.round(d*1000*100)/100);
    };

    // Bounds of circle
    var CircleBounds = function (center, radius) {
      var Spherical = google.maps.geometry.spherical;
      var southwest = Spherical.computeOffset(center, radius , 225);
      var northeast = Spherical.computeOffset(center, radius , 45);
      return (new google.maps.LatLngBounds(southwest, northeast));
    };

    // Calc Radius distance 
    var Calc_Max_Radius = function (center){
      var dist = 0;
      $scope.locations.forEach(function(location){
        var position = new google.maps.LatLng(location.latitude, location.longitude);
        dist = Math.max(dist, Calc_distancia(center,position));
      });
      return (dist);
    };

    var marker_bounds = function(bounds){
      var sw = bounds.getSouthWest();
      var marker = new google.maps.Marker({
          position: sw, map: $scope.map
        });
      var ne = bounds.getNorthEast();
      marker = new google.maps.Marker({
        position: ne, map: $scope.map
      });
    }

     // Add circle
    var add_circle = function (center, radius, stroke, fill){
      var circle = new google.maps.Circle({
        strokeColor: stroke.color, strokeOpacity: stroke.opacity, strokeWeight: 2,
        fillColor: fill.color, fillOpacity: fill.opacity, map: $scope.map,
        center: center, radius: radius
      });
      return circle;
    };

    // Add Arrows
    var add_arrows = function(){
      if($scope.lines)
        $scope.lines.setMap(null);
      if(!$scope.arrow.show) return;
      $scope.coord = [];
      _.forEach($scope.locations, function(location, i){
        if(location.selected){
          var position = new google.maps.LatLng(location.latitude, location.longitude);
          $scope.coord.push(position);
        }
      });
      if($scope.coord.length > 1){
        var offseticon = {path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW};
        var endicon = {path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW};
        $scope.lines = new google.maps.Polyline({
          map: $scope.map, 
          path: $scope.coord, 
          icons: [
            {icon: offseticon,offset:'95%'},
            {icon: endicon,offset:'30px'}
          ], 
          strokeColor: 'black',
          strokeOpacity: 0.8, 
          strokeWeight: 3,
          editable: false, 
          draggable: false,
        });
        $scope.lines.set('zIndex',100);
      }
    };  

    $scope.show_arrow = function(){
      add_arrows();
    }

    var show_label = function(marker, status){
      if(status)
        marker.labelClass = "show_markerlabel";
      else
        marker.labelClass = "hide_markerlabel";
      marker.label.draw();
    };

    // Add Imageset
    var add_imageset = function (location, i) {
      var deferred = $q.defer();
      location.selected = true;
      var icon = new google.maps.MarkerImage("/static/icons/lion-icon.ico", null,
                  null, null, new google.maps.Size(24, 24));
      $timeout(function() {
        var position = new google.maps.LatLng(location.latitude, location.longitude);
        // $scope.coord.push(position);
        $scope.bounds.extend(position);
        // var marker = new google.maps.Marker({
        //   position: position, map: $scope.map, draggable: false,
        //   animation: google.maps.Animation.DROP, icon: icon
        // });
        var marker = new MarkerLabel({
          position: position,
          map: $scope.map,
          draggable: false,
          raiseOnDrag: true,
          labelContent: location.label + '\n (' + location.latitude.toString() + ',' + location.longitude.toString() + ')',
          labelAnchor: new google.maps.Point(30, 50),
          labelClass: "hide_markerlabel",
          labelStyle: {opacity: 1.0},
          icon: icon
        });
      
        var handler_click = google.maps.event.addListener(marker, 'click', function(event) {
            $scope.click(location.id, event);
        });

        google.maps.event.addListener(marker, 'mouseover', function (event) {
          show_label(marker,true);
        });
        google.maps.event.addListener(marker, 'mouseout', function (event) {
          show_label(marker,false);
        });

        var delta = (0.9-0.3)/($scope.count-1);
        var opacity = 0.3 + i*delta;
        var colour = {stroke: '#9f3d0e', fill: "rgba( 217, 82, 16, " + opacity + ")"};
        var stroke = {color: colour.stroke, opacity: 0.7};
        var fill = {color: colour.fill, opacity: opacity};
        var circle = add_circle(position, $scope.radius, stroke, fill);
        location.style = {
          "background": "rgba( 217, 82, 16, " + opacity + ")",
          "border-color": colour.stroke,
          "color": "#333"
        };
        $scope.markers.push({'id': location.id, 'marker': marker, 'circle': circle});
        deferred.resolve(marker);
      }, i * 200);
      return deferred.promise;
    };
    // Initialize map
    $scope.$on('mapInitialized', function(evt, evtMap) {
      $scope.map = evtMap;
      $scope.map.setMapTypeId(google.maps.MapTypeId.HYBRID);
      $scope.map.setZoom(8);
      $scope.markers = [];
      // $scope.coord = [];
      $scope.bounds = new google.maps.LatLngBounds();
      var promises = _.map($scope.locations, function(location, i){
        return add_imageset(location, i);
      });
      $q.all(promises).then(function (results) {
        var center = $scope.bounds.getCenter();
        $scope.map.setCenter(center);
        // One Imageset
        if($scope.count == 1){
          $scope.bounds = CircleBounds(center, $scope.radius);
        }
        else{
          var ne = $scope.bounds.getNorthEast();
          var sw = $scope.bounds.getSouthWest();
          if(ne.equals(sw)){
            $scope.bounds = CircleBounds(center, $scope.radius);
          }
          else{
            var radius = Math.max($scope.global_radius, Calc_Max_Radius(center));
            console.log(radius);
            $scope.bounds = CircleBounds(center, radius);
          }
        }
        add_arrows();
        //marker_bounds($scope.bounds);
        $scope.map.fitBounds($scope.bounds);
      });
    });
    // On Click Marker
    $scope.click = function (id, event){

      var modalScope = $scope.$new();
      modalScope.title = 'Location detail';

      var index = _.indexOf($scope.locations, _.find($scope.locations, {id: id}));

      modalScope.info = {
        imageset: $scope.locations[index].label,
        imageset_id: id,
        lion_name: $scope.locations[index].name,
        latitude: $scope.locations[index].latitude,
        longitude: $scope.locations[index].longitude,
        date_stamp: $scope.locations[index].date_stamp,
        updated_at: $scope.locations[index].updated_at
      }

      modalScope.GoBackMessage = "Go to " + $scope.locations[index].label;
      if((options.type != 'lion') && (modalScope.imageset_id == options.id))
        modalScope.GoBackMessage = "Go Back to " + $scope.locations[index].label;
      
      var modalInstance = $uibModal.open({
          templateUrl: 'InfoWindow.tpl.html',
          scope: modalScope,
          size: 'sm'
      });
      modalInstance.result.then(function (result) {
        $uibModalInstance.close(modalScope.info.imageset_id);
      });
       // Modal Functions
      modalScope.close=function(){
        modalInstance.dismiss();
      };
      modalScope.goto=function(){
        modalInstance.close();
      };
    }
   
    var promise = null;
    // Animate marker when I click label
    $scope.animate = function(location){
      if(promise) return;
      promise = $timeout(function() {
        $timeout.cancel(promise);
        promise = null;
        location.selected = !location.selected;
        if(typeof($scope.anime) != 'undefined'){
          clearTimeout($scope.anime);
          $scope.animated_marker.setAnimation(null);
        }
        var id = location.id;
        $scope.animated_marker =  _.result(_.find($scope.markers, {id: id}), 'marker');
        $scope.animated_circle =  _.result(_.find($scope.markers, {id: id}), 'circle');
        if(location.selected){
          $scope.animated_marker.setMap($scope.map);
          $scope.animated_circle.setMap($scope.map);
          $scope.animated_marker.setAnimation(google.maps.Animation.BOUNCE);
          $scope.anime = setTimeout(function() {$scope.animated_marker.setAnimation(null);}, 1000);
        }
        else{
          $scope.animated_marker.setMap(null);
          $scope.animated_circle.setMap(null);
        }
        add_arrows();
      }, 250);
    };
    $scope.open_imageset = function (id){
      $timeout.cancel(promise);
      promise = null;
      var url = $state.href("imageset", { 'id': id },  {absolute: true});
      window.open(url,'_blank');
    }
  }
]);