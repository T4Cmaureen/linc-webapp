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

angular.module('linc.location.history.controller', [])

.controller('LocationHistoryCtrl', ['$scope', '$state', '$timeout', '$q', '$uibModal', '$uibModalInstance', 
  'NgMap', 'LincServices', 'AuthService', 'options', 'history',
  function ($scope, $state, $timeout, $q, $uibModal, $uibModalInstance, NgMap, LincServices, AuthService, 
  options, history) {

	var user = AuthService.user;
	$scope.title = 'Location History';
	$scope.content = 'Map';

	var default_radius = 5000;
	var default_tag_radius = 10000;
	var global_radius = 15000;
	// Quenia - Nairobi
	var position_default = new google.maps.LatLng(-1.267508, 36.824724);
	var zoom_default = 8;

	$scope.markers = [];
	$scope.listeners = [];
	$scope.tag_circles = [];

	var Spherical = google.maps.geometry.spherical;
	var icon = new google.maps.MarkerImage("/static/icons/lion-icon.ico", null,
			null, null, new google.maps.Size(24, 24));

	var mapTypeControlOptions = {
		style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
		mapTypeIds: [google.maps.MapTypeId.ROADMAP, google.maps.MapTypeId.HYBRID],
		position: google.maps.ControlPosition.RIGHT_BOTTOM
	};

	$scope.bounds = new google.maps.LatLngBounds();

	function compare(a,b) {
		if (a.date < b.date) return -1;
		if (a.date > b.date) return 1;
		return 0;
	};

	// Create Locations from Imagesets
	$scope.locations = (_.filter(_.map(history.locations, function(element, index){
		var elem = {};
		elem['date'] = element['date_stamp'] ? element['date_stamp'] : element['updated_at'];
		var title = element['date_stamp'] ? 'Date Stamp' : 'No stamp date.<br>Using the update date.';
		var checked = element['date_stamp'] ? false : true;
		elem['tooltip'] = {title: title, checked: checked};
		element['tag_location'] = (element.tag_location == null) ? {} : 
			{
				status: (element.tag_location ? true : false), 
				value: element.tag_location.value,
				title: element.tag_location.title
			};
		return _.extend({}, element, elem);
	}), function(hist){
		if(!hist.geopos_private) 
			return true;
		else
			return (user.admin || (user.organization_id == hist.organization_id));
	})).sort(compare);

	if (!$scope.locations.length)
		$scope.no_locations_info = 'The '+ options.type + 'has no location.';

	$scope.show = {
		map : $scope.locations.length > 0,
		arrow : true,
		tag_location: true
	};

	var delta_opacity = (0.9-0.4)/$scope.locations.length;

	// Bounds of Circle
	var CircleBounds = function (center, radius) {
		var north = Spherical.computeOffset(center, radius, 0);
		var east = Spherical.computeOffset(center, radius, 45);
		var sout  = Spherical.computeOffset(center, radius, 180);
		var west = Spherical.computeOffset(center, radius, 225);
		var northeast = new google.maps.LatLng(north.lat(), east.lng());
		var southwest = new google.maps.LatLng(sout.lat(), west.lng());
		return (new google.maps.LatLngBounds(southwest, northeast));
	};		

	// Calc Radius distance 
	var Calc_Max_Radius = function (center){
		var dist = 0;
		$scope.locations.forEach(function(location){
			var position = new google.maps.LatLng(location.latitude, location.longitude);
			dist = Math.max(dist, Spherical.computeDistanceBetween(position, center));
		});
		return (dist);
	};
	
	// Show / Hide Marker Label
	$scope.show_label = function(marker, status){
		marker.labelClass = status ? "show_markerlabel" : "hide_markerlabel";
		marker.label.draw();
	};
	// Show / Hide Arrows
	$scope.Show_Arrows = function(){
		CreateLinkArrows();
	};

	// Show / Hide Tag Locations
	$scope.Show_TagLocations = function(){
		_.forEach($scope.tag_circles, function(tag_circle){
			var map = $scope.show.tag_location ? $scope.map : null;
			tag_circle.circle.setMap(map);
			tag_circle.mapLabel.setMap(map);
		})
	};

	// On Click Marker
	$scope.LocationDetail = function (id, event){
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
		};
		modalScope.GoToMessage = "Go to " + $scope.locations[index].label;
		if((options.type != 'lion') && (modalScope.imageset_id == options.id))
			modalScope.GoToMessage = "Go Back to " + $scope.locations[index].label;
		var modalInstance = $uibModal.open({
			templateUrl: 'InfoWindow.tpl.html',
			scope: modalScope,
			size: 'sm'
		});
		modalInstance.result.then(function (result) {
			$scope.GotoImageSet(modalScope.info.imageset_id);
		}, function(result){
		});
		// Modal Functions
		modalScope.close=function(){
			modalInstance.dismiss();
		};
		modalScope.Go_To=function(){
			modalInstance.close();
		};
	};

	var LocationSetMap = function(map){
		$scope.animated['marker'].setMap(map);
		$scope.animated['circle'].setMap(map);
		if($scope.animated['tag_circle']){
			$scope.animated['tag_circle']['circle'].setMap(map);
			$scope.animated['tag_circle']['mapLabel'].setMap(map);
		}
	};

	var promise = null;
	$scope.animated = null;
	// Animate Marker when I click label
	$scope.Animate = function(location){
		if(promise) return;
		promise = $timeout(function() {
			$timeout.cancel(promise);
			promise = null;
			location.selected = !location.selected;
			if(typeof($scope.anime) != 'undefined'){
				$timeout.cancel($scope.anime);
				$scope.animated['marker'].setAnimation(null);
			}
			var id = location.id;
			$scope.animated = _.find($scope.markers, {id: id});
			if($scope.animated && location.selected){
				LocationSetMap($scope.map);
				$scope.animated['marker'].setAnimation(google.maps.Animation.BOUNCE);
				$scope.anime = $timeout(function() {
					$scope.animated['marker'].setAnimation(null);
				}, 1000);
			}
			else{
				if ($scope.animated)
					LocationSetMap(null);
			}
			CreateLinkArrows();
		}, 250);
	};

	// Arrows to link Markers
	var CreateLinkArrows = function(){
		if($scope.lines)
			$scope.lines.setMap(null);
		if(!$scope.show.arrow) return;
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
				map: $scope.map, path: $scope.coord, editable: false, draggable: false,
				icons: [ {icon: offseticon,offset:'95%'}, {icon: endicon,offset:'30px'}],
				strokeColor: 'black', strokeOpacity: 0.8, strokeWeight: 3, 
			});
			$scope.lines.set('zIndex',100);
		}
	};  

	// Circle around Marker
	var Create_Circle = function(data){
		var circle = new google.maps.Circle({ 
			strokeColor: (data.stroke && data.stroke.color) ? data.stroke.color : '#9f3d0e',
			strokeOpacity: (data.stroke && data.stroke.opacity) ? data.stroke.opacity : 0.2, 
			fillColor: (data.fill && data.fill.color) ? data.fill.color : 'rgba(217, 82, 16, 0.24)',
			fillOpacity: (data.fill && data.fill.opacity) ? data.fill.opacity : 0.2,
			draggable: data.draggable ? data.draggable : false,
			strokeWeight: 2, 
			map: $scope.map,
			center: data.center, 
			radius: data.radius,
			zIndex: data.zIndex
		});
		return circle;
	};

	// Create Tag Location Circle
	var TagCircle = function (data){
		var circle = Create_Circle(data)
		var pos0 = data.center;
		var pos1 = Spherical.computeOffset(data.center, data.radius/8 , 180);
		var pos2 = Spherical.computeOffset(data.center, data.radius/2 , 180);
		var pos3 = Spherical.computeOffset(data.center, 1.3*data.radius , 180);
		var pos4 = Spherical.computeOffset(data.center, 2*data.radius , 180);
		var lab_options = {
			6: { fontSize: 8, fontColor: '#fff', strokeColor: '#9f3d0e', position: pos4 },
			7: { fontSize: 10, fontColor: '#fff', strokeColor: '#9f3d0e', position: pos3 },
			8: { fontSize: 10, fontColor: '#fff', strokeColor: '#9f3d0e', position: pos3 },
			9: { fontSize: 12, fontColor: '#fff', strokeColor: '#9f3d0e', position: pos3 },
			10: { fontSize: 14, fontColor: '#fff', strokeColor: '#9f3d0e', position: pos2 },
			11: { fontSize: 18, fontColor: '#fff', strokeColor: '#9f3d0e', position: pos2 },
			12: { fontSize: 24, fontColor: '#fff', strokeColor: '#9f3d0e', position: pos2 },
			13: { fontSize: 24, fontColor: '#fff', strokeColor: '#9f3d0e', position: pos1 },
			14: { fontSize: 24, fontColor: '#fff', strokeColor: '#9f3d0e', position: pos0 }
		};
		var zoom = $scope.map.getZoom();
		var option = (zoom < 6 ? lab_options[6] : (zoom > 14 ? lab_options[14] : lab_options[zoom]));
		var mapLabel = new MapLabel({
			text: data.tag_location.title,
			position: option.position,
			map: $scope.map,
			fontSize: option.fontSize,
			align: 'center',
			fontColor: option.fontColor,
			strokeColor: option.strokeColor,
			strokeWeight: 8,
			maxZoom: 16,
			minZoom: 6
		});
		var hmap = google.maps.event.addListener($scope.map, 'zoom_changed', function(e){
			var zoom = $scope.map.getZoom();
			console.log(zoom);
			zoom =  _.isNaN(zoom) ? 6 : zoom;
			var option = (zoom < 6 ? lab_options[6] : (zoom > 14 ? lab_options[14] : lab_options[zoom]));
			mapLabel.set('fontSize',option.fontSize);
			mapLabel.set('position',option.position);
			mapLabel.set('fontColor',option.fontColor);
			mapLabel.set('strokeColor',option.strokeColor);
		});
		$scope.listeners.push(hmap);

		return ({'circle': circle, 'mapLabel': mapLabel});
	};

	// Marker Label Content
	var MarkerlabelContent = function(location, position){
		var lat = position.lat().toFixed(6).toString();
		var lng = position.lng().toFixed(6).toString();
		var name = location.label;
		return (name + '\n (' + lat + ',' + lng + ')');
	};

	// Add Location OnMap
	var SetLocationOnMap = function (location, i) {
		var deferred = $q.defer();
		location.selected = true;
	
		$timeout(function() {
			var position = new google.maps.LatLng(location.latitude, location.longitude);
	 		$scope.bounds.extend(position);
			var marker = new MarkerLabel({
				position: position,
				map: $scope.map,
				draggable: false, raiseOnDrag: true,
				icon: icon, labelStyle: {opacity: 1.0},
				labelClass: "hide_markerlabel",
				labelContent: MarkerlabelContent(location, position),
				labelAnchor: new google.maps.Point(30, 50)
			});
		
			var click = google.maps.event.addListener(marker, 'click', function(event) {
				$scope.LocationDetail(location.id, event);
			});
			$scope.listeners.push(click);

			var mouseover = google.maps.event.addListener(marker, 'mouseover', function (event) {
				$scope.show_label(marker,true);
			});
			$scope.listeners.push(mouseover);

			var mouseout = google.maps.event.addListener(marker, 'mouseout', function (event) {
				$scope.show_label(marker,false);
			});
			$scope.listeners.push(mouseout);

			var opacity = 0.4 + i*delta_opacity;
			var colour = {stroke: '#08449e', fill: "rgba( 37, 192, 239, " + opacity + ")"};
			var stroke = {color: colour.stroke, opacity: 0.7};
			var fill = {color: colour.fill, opacity: opacity};

			var circle = Create_Circle({ center: position, radius: default_radius,  zIndex: 20, stroke: stroke, fill: fill});
			circle.bindTo('center', marker, 'position');

			var tag_circle = null;
			if (location.tag_location.status){
				var colour = {stroke: '#9f3d0e', fill: "rgba( 245, 186, 99, 0.75)"};
				var stroke = {color: colour.stroke, opacity: 0.3};
				var fill = {color: colour.fill, opacity: opacity};
				// Create a TagCircle
				tag_circle = TagCircle({
					tag_location: location.tag_location,
					center: position,
					radius: location.tag_location.value,
					stroke: stroke, fill: fill,
					draggable: false,
					zIndex: 10,
				});
				tag_circle.circle.bindTo('center', marker, 'position');
				$scope.tag_circles.push(tag_circle);
			}
			// Style to buttons
			location.style = {
				"background": "rgba( 217, 82, 16, " + opacity + ")",
				"border-color": colour.stroke,
				"color": "#333"
			};
			var loc = {'id': location.id, 'marker': marker, 'circle': circle, 'tag_circle': tag_circle};
			$scope.markers.push(loc);
			deferred.resolve(loc);
		}, i * 200);
		return deferred.promise;
	};

	// Initiate a Map
	NgMap.getMap({id:'history-location'}).then(function(map) {
		$scope.map = map;
		map.setMapTypeId(google.maps.MapTypeId.TERRAIN);
		map.mapTypeControl = true;
		map.mapTypeControlOptions = mapTypeControlOptions;
		var position = position_default;
		$scope.map.setZoom(zoom_default);

		var promises = _.map($scope.locations, function(location, i){
			return SetLocationOnMap(location, i);
		});
		$q.all(promises).then(function (results) {
			var center = $scope.bounds.getCenter();
			$scope.map.setCenter(center);
			if($scope.locations.length == 1){
				$scope.bounds = CircleBounds(center, default_tag_radius);
			}
			else{
				var ne = $scope.bounds.getNorthEast();
				var sw = $scope.bounds.getSouthWest();
				if(ne.equals(sw)){
					$scope.bounds = CircleBounds(center, default_tag_radius);
				}
				else{
					var radius = Math.max(global_radius, Calc_Max_Radius(center));
					$scope.bounds = CircleBounds(center, radius);
				}
			}
			CreateLinkArrows();
			$scope.map.fitBounds($scope.bounds);
		});
		
		$scope.map.setCenter(position);
		google.maps.event.trigger($scope.map,'resize');
	});

	// Clear All onExit
	var cleanAll = function(){
		_.forEach($scope.markers, function(m){
			if(_.has(m,'marker'))
				m['marker'].setMap(null);
			if(_.has(m,'circle'))
				m['circle'].setMap(null);
			if(_.has(m, 'tag_circle') && m['tag_circle']){
				var tag_circle = m['tag_circle'];
				tag_circle['circle'].setMap(null);
				tag_circle['mapLabel'].setMap(null);
			}
		});
		if($scope.lines)
			$scope.lines.setMap(null);
		_.forEach($scope.listeners, function(listener) {
			google.maps.event.removeListener(listener);
		});
		$scope.listeners = [];
		$scope.bounds = null;
		Spherical = null;
		position_default = null;
		icon = null;
	};

	$scope.Open_Imageset = function (id){
		$timeout.cancel(promise);
		promise = null;
		var url = $state.href("imageset", { 'id': id },  {absolute: true});
		window.open(url,'_blank');
	}

	$scope.GotoImageSet = function(response){
		cleanAll();
		$uibModalInstance.close(response);
	}
	// Close Location History
	$scope.Cancel = function () {
		cleanAll();
		$uibModalInstance.dismiss();
	};
	$scope.KeyEvent = function($event){
		if($event.key == "Escape")
			$scope.Cancel();
	};
}]);
