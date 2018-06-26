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

angular.module('linc.location.on.map.controller', [])

.controller('LocationOnMapCtrl', ['$scope', '$q', '$timeout', 'metadata',
  '$uibModalInstance', 'NgMap', 'AuthService',
  function ($scope, $q, $timeout, metadata, $uibModalInstance, NgMap, AuthService) {

	$scope.title = 'Select the Location on Map';

	// Global
	var vm = this;
	var user = AuthService.user;
	var drawingManager;
	var max_radius = 100000;
	var default_tag_radius = 10000;
	var Spherical = google.maps.geometry.spherical;
	var icon = new google.maps.MarkerImage(
		"/static/icons/lion-icon.ico",
		new google.maps.Size(24, 24),
		new google.maps.Point(0, 0),
		new google.maps.Point(12, 12),
		new google.maps.Size(24, 24));
	var icon2 = new google.maps.MarkerImage("/static/icons/pin-icon.png",
			null, null, null, new google.maps.Size(36, 36));
	// Quenia - Nairobi
	var position_default = new google.maps.LatLng(-1.267508, 36.824724);
	var zoom_default = 8;

	var mapTypeControlOptions = {
		style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
		mapTypeIds: [google.maps.MapTypeId.ROADMAP, google.maps.MapTypeId.HYBRID],
		position: google.maps.ControlPosition.RIGHT_BOTTOM
	};

	var drawingControlOptions = {
		position: google.maps.ControlPosition.TOP_CENTER,
		drawingModes: [google.maps.drawing.OverlayType.MARKER]
	};

	var drawingOptions = {
		drawingMode: null, drawingControl: true,
		drawingControlOptions: drawingControlOptions,
		markerOptions: {draggable: true, icon: '/static/icons/location.png'}
	};

	$scope.markers = {};
	$scope.listeners = { map: [], location: [], taglocation: [], taglabels: []};
	$scope.tag_label = null;
	$scope.tag_circle_settings = { auxMarker: null, listeners: [] };

	$scope.location = {
		latitude: angular.copy(metadata.latitude),
		longitude: angular.copy(metadata.longitude),
		name: angular.copy(metadata.name),
		tag_location: angular.copy(metadata.tag_location)
	};
	$scope.location.tag_location.value = $scope.location.tag_location.value ? $scope.location.tag_location.value : default_tag_radius;

	// Update Tag Circle - Some data (Radius or Center changed)
	$scope.UpdateTagCircle = function(radius){
		console.log('UpdateTagCircle');
		var tag_circle = $scope.markers['tag_circle'];
		if(!tag_circle)
			return;
		tag_circle.setRadius(radius);
		var center = tag_circle.getCenter();
		UpdateTabLabelPosition();
		if(!$scope.tag_circle_settings.auxMarker){
			$scope.bounds = CalcCircleBounds(center, radius);
			$scope.map.fitBounds($scope.bounds);
		}
	};

	// Update Location - User Edited Lat / Lng
	$scope.UpdatePosition = function(){
		console.log('UpdatePosition');
		if($scope.location.latitude && $scope.location.longitude){
			var position = new google.maps.LatLng($scope.location.latitude, $scope.location.longitude);
			if(!_.has($scope.markers,'marker')){
				$scope.markers = SetLionOnMap(position);
				$scope.map.setCenter(position);
			}
			else{
				if(!$scope.markers['marker'].getMap())
					$scope.markers['marker'].setMap($scope.map);
				if(_.has($scope.markers,'tag_circle') && $scope.markers['tag_circle'] && !$scope.markers['tag_circle'].getMap() && $scope.location.tag_location.status)
					$scope.markers['tag_circle'].setMap($scope.map);
				$scope.markers['marker'].setPosition(position);
				$scope.map.setCenter(position);
			}
			drawingManager.setMap(null);
			UpdateTabLabelPosition();
		}
		else{
			drawingManager.setMap($scope.map);
			$scope.markers['marker'].setMap(null);
			if(_.has($scope.markers,'tag_circle') && $scope.markers['tag_circle']){
				$scope.markers['tag_circle'].setMap(null);
				$scope.tag_label.setMap(null);
			}
		}
	};

	$scope.ToggleTagLocation = function () {
		if(_.has($scope.markers,'tag_circle') && _.has($scope.markers,'marker')){
			var map = $scope.location.tag_location.status && $scope.markers['marker'].getMap() ? $scope.map : null;
			$scope.markers['tag_circle'].setMap(map);
			if($scope.tag_label)
				$scope.tag_label.setMap(map);
			UpdateTabLabelPosition();
		}
		if ($scope.location.tag_location.status)
			$scope.RefreshSlider();
	};


	// User Edited Label
	$scope.UpdateTagLabel = function(text){
		console.log('UpdateTagLabel');
		if($scope.tag_label){
			$scope.tag_label.set('text', text);
		}
	};

	var UpdateTabLabelPosition = function(){
		if(!_.has($scope.markers,'tag_circle') || !$scope.markers['tag_circle'])
			return;
		var map = $scope.location.tag_location.status ? $scope.map : null;
		$scope.tag_label.setMap(map);
		if (map){
			var tag_circle = $scope.markers['tag_circle'];
			var hmap = $scope.listeners.taglabels[0];
			google.maps.event.removeListener(hmap);

			var data = {
				center: tag_circle.getCenter(),
				radius: tag_circle.getRadius()
			}
			var lab_options = TagOptions(data);
			$scope.listeners.taglabels.push(TagListener(lab_options));
			$scope.ZoomChanged(lab_options);
		}
	};

	// Set Location Lat / Lng -> Marker Position Changed
	$scope.UpdateLocation = function(position){
		$scope.timeout=$timeout(function() {
			$scope.$apply(function () {
				$scope.location.latitude = position.lat().toFixed(6).toString();
				$scope.location.longitude = position.lng().toFixed(6).toString();
			});
		});
	};

	// Toogle Tag Circle Edit Modes
	$scope.TagCircleEdits = function(tag_circle, event){
		console.log('TagCircleEdits');
		if ($scope.tag_circle_settings.auxMarker){ // Remove Auxiliar Marker
			$scope.tag_circle_settings.auxMarker.setMap(null);
			$scope.tag_circle_settings.auxMarker = null;
			_.forEach($scope.tag_circle_settings.listeners, function(listener){
				google.maps.event.removeListener(listener);
			});
			$scope.tag_circle_settings.listeners = [];
			$scope.markers['marker'].setOptions({draggable: true, cursor:'default'});
			$scope.markers['tag_circle'].setOptions({draggable: true, cursor:'default'});
			$scope.RefreshSlider();
		}
		else{  // Create Auxiliar Marker
			$scope.markers['marker'].setOptions({draggable: false, cursor:'crosshair'});
			$scope.markers['tag_circle'].setOptions({draggable: false, cursor:'crosshair'});
			var center = tag_circle.getCenter();
			var radius = tag_circle.getRadius();
			var angle = 90;
			var position = Spherical.computeOffset(center, radius, angle);

			var marker = new MarkerLabel({ position: position, map: $scope.map,
				labelContent: 'radius: ' + radius.toFixed(2).toString(),
				labelAnchor: new google.maps.Point(30, 50), labelClass: "hide_markerlabel",
				labelStyle: {opacity: 1.0}, draggable: true, icon: icon2
			});
			var mouseover = google.maps.event.addListener(marker, 'mouseover', function (event) {
				$scope.ShowMarkerLabel(marker,true);
			});
			$scope.tag_circle_settings.listeners.push(mouseover);
			var mouseout = google.maps.event.addListener(marker, 'mouseout', function (event) {
				$scope.ShowMarkerLabel(marker,false);
			});
			$scope.tag_circle_settings.listeners.push(mouseout);
			// Limit Update to max_radius
			var update_tag_circle = false;
			var last_position = marker.getPosition();
			var drag = google.maps.event.addListener(marker,  'drag', function(event){
				var position = marker.getPosition();
				var radius =  Spherical.computeDistanceBetween(position, center);
				if(radius > max_radius){
					radius = max_radius;
					update_tag_circle--;
				}
				else{
					update_tag_circle = 2;
				}
				// Update Auxiliar Marker, TagCircle and Marker Label
				if(update_tag_circle>0){
					$scope.UpdateTagCircle(radius);
					$scope.location.tag_location.value = radius;
					marker.labelContent = 'radius: ' + radius.toFixed(2).toString();
					marker.label.setContent();
					last_position = position;
				}
				else{
					marker.setPosition(last_position);
					$scope.TagCircleEdits();
				}
			});
			// Update Slider On Dragend
			$scope.tag_circle_settings.listeners.push(drag);
			var dragend = google.maps.event.addListener(marker,  'dragend', function(event){
				$scope.RefreshSlider();
			});
			$scope.tag_circle_settings.listeners.push(dragend)
			$scope.tag_circle_settings.auxMarker = marker;
		}
	};

	// Bounds of Circle
	var CalcCircleBounds = function (center, radius) {
		var north = Spherical.computeOffset(center, radius, 0);
		var east = Spherical.computeOffset(center, radius, 45);
		var sout  = Spherical.computeOffset(center, radius, 180);
		var west = Spherical.computeOffset(center, radius, 225);
		var northeast = new google.maps.LatLng(north.lat(), east.lng());
		var southwest = new google.maps.LatLng(sout.lat(), west.lng());
		return (new google.maps.LatLngBounds(southwest, northeast));
	};

	var CreateTagLabel = function(data){
		$scope.tag_label = new MapLabel({
			text: data.title,
			position: data.position,
			map: data.map,
			fontSize: data.fontSize,
			align: 'center',
			fontColor: data.fontColor,
			strokeColor: data.strokeColor,
			strokeWeight: 8,
			maxZoom: 16,
			minZoom: 6
		});
	};

	var TagOptions = function(data){
		var pos0 = data.center;
		var pos1 = Spherical.computeOffset(data.center, data.radius/8 , 180);
		var pos2 = Spherical.computeOffset(data.center, data.radius/4 , 180);
		var pos3 = Spherical.computeOffset(data.center, 1.3*data.radius , 180);
		var pos4 = Spherical.computeOffset(data.center, 2*data.radius , 180);
		var lab_options = {
			6: { fontSize: 8, fontColor: '#fff', strokeColor: '#9f3d0e', position: pos4 },
			7: { fontSize: 10, fontColor: '#fff', strokeColor: '#9f3d0e', position: pos3 },
			8: { fontSize: 10, fontColor: '#fff', strokeColor: '#9f3d0e', position: pos3 },
			9: { fontSize: 12, fontColor: '#fff', strokeColor: '#9f3d0e', position: pos3 },
			10: { fontSize: 14, fontColor: '#fff', strokeColor: '#9f3d0e', position: pos2 },
			11: { fontSize: 18, fontColor: '#fff', strokeColor: '#9f3d0e', position: pos2 },
			12: { fontSize: 24, fontColor: '#fff', strokeColor: '#9f3d0e', position: pos1 },
			13: { fontSize: 24, fontColor: '#fff', strokeColor: '#9f3d0e', position: pos1 },
			14: { fontSize: 24, fontColor: '#fff', strokeColor: '#9f3d0e', position: pos0 }
		};
		return lab_options;
	};

	$scope.ZoomChanged = function(lab_options){
		var zoom = $scope.map.getZoom();
		console.log(zoom);
		zoom =  _.isNaN(zoom) ? 6 : zoom;
		var option = (zoom < 6 ? lab_options[6] : (zoom > 14 ? lab_options[14] : lab_options[zoom]));
		$scope.tag_label.set('fontSize', option.fontSize);
		$scope.tag_label.set('position', option.position);
		$scope.tag_label.set('fontColor', option.fontColor);
		$scope.tag_label.set('strokeColor', option.strokeColor);
	}
	var TagListener = function(lab_options){
		var hmap = google.maps.event.addListener($scope.map, 'zoom_changed', function(e){
			$scope.ZoomChanged(lab_options);
		});
		return hmap;
	};

	var TagLabels = function(data){
		var lab_options = TagOptions(data);
		var zoom = $scope.map.getZoom();
		zoom =  _.isNaN(zoom) ? 6 : zoom;
		var option = (zoom < 6 ? lab_options[6] : (zoom > 14 ? lab_options[14] : lab_options[zoom]));
		var tag_data = {
			text: $scope.location.tag_location.title,
			position: option.position,
			map: data.map,
			fontSize: option.fontSize,
			fontColor: option.fontColor,
			strokeColor: option.strokeColor
		}
		$scope.tag_label = new MapLabel(tag_data);
		$scope.listeners.taglabels.push(TagListener(lab_options));
	};
	// Create Location Tag Circle
	var TagCircle = function (data){
		var map = $scope.location.tag_location.status ? $scope.map : null;
		var tag_circle = new google.maps.Circle({
			strokeColor: (data.stroke && data.stroke.color) ? data.stroke.color : '#9f3d0e',
			strokeOpacity: (data.stroke && data.stroke.opacity) ? data.stroke.opacity : 0.2,
			fillColor: (data.fill && data.fill.color) ? data.fill.color : 'rgba(217, 82, 16, 0.24)',
			fillOpacity: (data.fill && data.fill.opacity) ? data.fill.opacity : 0.2,
			//draggable: data.draggable ? data.draggable : true,
			draggable: false,
			strokeWeight: 2,
			map: map,
			center: data.center,
			radius: data.radius
		});
		var circleRClick= google.maps.event.addListener(tag_circle, 'rightclick', function(event){
			$scope.TagCircleEdits(tag_circle, event);
		});
		$scope.listeners.taglocation.push(circleRClick);
		var drag = google.maps.event.addListener(tag_circle,  'drag', function(event){
			UpdateTabLabelPosition();
		});
		var data = {center: data.center, radius: data.radius, map: map, text: $scope.location.tag_location.title};
		TagLabels(data);
		return tag_circle;
	};

	// Marker Label Content
	var MarkerlabelContent = function(position){
		var lat = position.lat().toFixed(6).toString();
		var lng = position.lng().toFixed(6).toString();
		var name = $scope.location.name;
		return (name + '\n (' + lat + ',' + lng + ')');
	};

	// Show / Hide Marker Label
	$scope.ShowMarkerLabel = function(marker, status){
		marker.labelClass = status ? "show_markerlabel" : "hide_markerlabel";
		marker.label.draw();
	};

	// Set Lion/Imageset Marker on Map
	var SetLionOnMap = function (position) {
		if(_.isEmpty($scope.markers)){
			var marker = new MarkerLabel({
				position: position,
				map: $scope.map,
				draggable: true, raiseOnDrag: true,
				icon: icon, labelStyle: {opacity: 1.0},
				labelClass: "hide_markerlabel",
				labelContent: MarkerlabelContent(position),
				labelAnchor: new google.maps.Point(30, 50)
			});

			var mouseover = google.maps.event.addListener(marker, 'mouseover', function (event) {
				$scope.ShowMarkerLabel(marker,true);
			});
			$scope.listeners.location.push(mouseover);

			var mouseout = google.maps.event.addListener(marker, 'mouseout', function (event) {
				$scope.ShowMarkerLabel(marker,false);
			});
			$scope.listeners.location.push(mouseout);

			var drag = google.maps.event.addListener(marker,  'drag', function(event){
				var position = marker.getPosition();
				$scope.UpdateLocation(position);
				UpdateTabLabelPosition();
			});
			$scope.listeners.location.push(drag);

			var dragstart = google.maps.event.addListener(marker,  'dragstart', function(event){
				marker.label.setMap(null);
			});
			$scope.listeners.location.push(dragstart);

			var dragend = google.maps.event.addListener(marker,  'dragend', function(event){
				var position = marker.getPosition();
				marker.labelContent = MarkerlabelContent(position);
				marker.label.setContent();
				marker.label.setMap($scope.map);
			});
			$scope.listeners.location.push(dragend);
			// Create a TagCircle
			var tag_circle = TagCircle({center: position, radius: $scope.location.tag_location.value, draggable: true});
			tag_circle.bindTo('center', marker, 'position');

			$scope.markers = {marker: marker, tag_circle: tag_circle};
		}
		else{
			$scope.markers['marker'].setMap($scope.map);
			if($scope.location.tag_location.status)
				$scope.markers['tag_circle'].setMap($scope.map);
			else
				$scope.markers['tag_circle'].setMap(null);
			$scope.markers['marker'].setPosition(position);
		}

	};

	// Create Drawing Manager
	var Create_DrawingManager = function(){
		if(drawingManager)
			return;
		drawingManager = new google.maps.drawing.DrawingManager(drawingOptions);
		// Draw Marker on Map
		var drawl = google.maps.event.addListener(drawingManager, 'markercomplete', function(marker) {
			// remove default marker
			var position = marker.getPosition();
			marker.setMap(null);
			// Create new marker with icon
			SetLionOnMap(position);
			$scope.UpdateLocation(position);
			$scope.map.setCenter(position);
			$scope.bounds = CalcCircleBounds(position, $scope.location.tag_location.value);
			$scope.map.fitBounds($scope.bounds);
			drawingManager.setMap(null);
		});
		$scope.listeners.map.push(drawl);
	};


	var Initialize = function(){
		var position = position_default;
		if($scope.location.latitude && $scope.location.longitude){
			position = new google.maps.LatLng($scope.location.latitude, $scope.location.longitude);
			SetLionOnMap(position);
			$scope.map.setCenter(position);
			$scope.bounds = CalcCircleBounds(position, $scope.location.tag_location.value);
			$scope.map.fitBounds($scope.bounds);
		}
		else
			drawingManager.setMap($scope.map);
		$scope.map.setCenter(position);
	};

	// Initiate a Map
	NgMap.getMap({id:'location-on-map'}).then(function(map) {
		$scope.map = map;
		map.setMapTypeId(google.maps.MapTypeId.ROADMAP);
		map.mapTypeControl = true;
		map.mapTypeControlOptions = mapTypeControlOptions;
		$scope.map.setZoom(zoom_default);
		Create_DrawingManager();
		Initialize();

		google.maps.event.trigger($scope.map,'resize');

		$scope.timeout=$timeout(function() {
			$scope.$apply(function () {
				$(".gmnoprint").each(function(){
					var newObj = $(this).find("[title='Add a marker']");
					newObj.attr('title', 'Add Lion Location');
				});
			});
		}, 1000);
	});

	// Slider Control
	// Translate Labels
	$scope.translate = function(value, sliderId, label){
		switch (label) {
			case 'model':
				var dist = value.toFixed(2).toString() + ' m';
				if(value > 1000)
					dist = (value/1000).toFixed(0).toString() + ' km';
				return dist;
			case 'ceil':
			 	return (value/1000).toFixed(0).toString() + ' km';
			default:
				return value;
		}
	};
	// Slider
	$scope.slider = {
		options: {
			floor: 0, ceil: max_radius,
			onChange: function(id) {
				$scope.UpdateTagCircle($scope.location.tag_location.value);
			},
			translate: function(value, sliderId, label) {
				return $scope.translate (value, sliderId, label);
			}
		}
	};

	$scope.RefreshSlider = function () {
		$timeout(function () {
			$scope.$broadcast('rzSliderForceRender');
		});
	};
	$scope.RefreshSlider();

	// Clear All onExit
	var CleanAll = function(){
		if(drawingManager)
			drawingManager.setMap(null);
		if(_.has($scope.markers,'tag_circle') && $scope.markers['tag_circle'])
			$scope.markers['tag_circle'].setMap(null);
		if(_.has($scope.markers,'marker') && $scope.markers['marker'])
			$scope.markers['marker'].setMap(null);

		_.forEach($scope.listeners, function(listener) {
			_.forEach(listener, function(l) {
				google.maps.event.removeListener(l);
			});
			listener = [];
		});

		if ($scope.tag_circle_settings.auxMarker){
			$scope.tag_circle_settings.auxMarker.setMap(null);
			$scope.tag_circle_settings.auxMarker = null;
		}

		_.forEach($scope.tag_circle_settings.listeners, function(listener){
			google.maps.event.removeListener(listener);
		});

		if($scope.tag_label)
			$scope.tag_label.setMap(null);
		$scope.tag_circle_settings.listeners = [];
	};

	// Close Modal
	$scope.Cancel = function () {
		CleanAll();
		$uibModalInstance.dismiss();
		$scope.RefreshSlider();
	};

	// Submit the Update
	$scope.submitted = false;
	$scope.Submit = function(form){
		$scope.submitted = true;
		if(form.$valid){
			CleanAll();
			$uibModalInstance.close({location: $scope.location});
		}
	};

	$scope.Reset = function(form){
		if(_.has($scope.markers,'tag_circle') && $scope.markers['tag_circle'])
			$scope.markers['tag_circle'].setMap(null);
		if(_.has($scope.markers,'marker') && $scope.markers['marker'])
			$scope.markers['marker'].setMap(null);

		// Restore Data
		$scope.location = {
			latitude: angular.copy(metadata.latitude),
			longitude: angular.copy(metadata.longitude),
			name: angular.copy(metadata.name),
			tag_location: angular.copy(metadata.tag_location)
		};
		$scope.location.tag_location.value = $scope.location.tag_location.value ? $scope.location.tag_location.value : default_tag_radius;

		Initialize();
		if(form)
			form.reset();
		console.log(form);
	};

	$uibModalInstance.rendered.then(function(){
		if(vm && vm.form)
			vm.form.$setPristine();
	});

	$scope.KeyEvent = function($event){
		if($event.key == "Escape")
			$scope.Cancel();
	};

}]);
