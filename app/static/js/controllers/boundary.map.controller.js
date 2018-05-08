/* jshint unused:vars */
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

angular.module('linc.boundary.map.controller',[])

.controller('BoundaryMapCtrl', ['$scope', '$compile', '$q', '$timeout', '$transitions', '$uibModalInstance', 
	'NgMap', 'FileSaver', 'inputdata', 'AuthService', '$uibModal', '$ModalPage', 'NotificationFactory',
	function ($scope, $compile, $q, $timeout, $transitions, $uibModalInstance, NgMap, FileSaver, inputdata,
	AuthService, $uibModal, $ModalPage, NotificationFactory){

	// Global
	$scope.boundary = {modified: false};
	$scope.title = "Geographical Filter";
	var user = AuthService.user;
	$scope.Notification = NotificationFactory;
	var drawingManager;
	var Spherical = google.maps.geometry.spherical;
	var geometryFactory = new jsts.geom.GeometryFactory();
	$scope.bounds = new google.maps.LatLngBounds();
	// Quenia - Nairobi
	var position_default = new google.maps.LatLng(-1.267508, 36.824724);
	var zoom_default = 8;
	var icon = new google.maps.MarkerImage("/static/icons/lion-icon.ico", null,
			null, null, new google.maps.Size(24, 24));
	// MAP OPTIONS
	var mapTypeControlOptions = {
		style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
		mapTypeIds: [google.maps.MapTypeId.ROADMAP, google.maps.MapTypeId.HYBRID],
		position: google.maps.ControlPosition.RIGHT_BOTTOM
	};
	// DRAWNING CONTROLS
	var drawingControlOptions = {
		position: google.maps.ControlPosition.TOP_CENTER,
		drawingModes: [google.maps.drawing.OverlayType.POLYGON,
				google.maps.drawing.OverlayType.CIRCLE, google.maps.drawing.OverlayType.RECTANGLE]
	};
	// DRAWING OPTIONS
	var drawingOptions = {
		drawingMode: null, drawingControl: true,
		drawingControlOptions: drawingControlOptions,
		markerOptions: {draggable: true, icon: '/static/icons/location.png'},
		circleOptions: {fillColor: '#ffffff', fillOpacity: 0.3, strokeColor: '#5e9ae1',
			strokeWeight: 1, clickable: true, editable: false, zIndex: 1, draggable: false},
		rectangleOptions: {fillColor: '#ffffff', fillOpacity: 0.3, strokeColor: '#5e9ae1',
			strokeOpacity: 0.7, strokeWeight: 2, clickable: true, editable: false, draggable: false},
		polygonOptions: {clickable: true, draggable: false, editable: false, strokeWeight: 2, geodesic: true,
			fillColor: '#ffffff', fillOpacity: 0.3, strokeColor: '#5e9ae1', strokeOpacity: 0.7}
	};
	$scope.orderby = { reverse: false, predicate: 'id' };
	$scope.order = function(predicate) {
		$scope.orderby.reverse = ($scope.orderby.predicate === predicate) ? !$scope.orderby.reverse : false;
		$scope.orderby.predicate = predicate;
	};
	//	create the ContextMenuOptions object
	$scope.contextMenus = [];
	$scope.Intersections = [];
	$scope.GeoBounds = [];
	$scope.listeners = [];
	$scope.markers = [];
	var mspider;
	var spiderConfig = { keepSpiderfied: true, event: 'mouseover' };
	// NG-MAP OPTIONS
	$scope.options = { disableDefaultUI : false, disableDoubleClickZoom: false, draggable: true };
	// Label to Polygons
	var PolygonLabel = function(data){
		var lab_options = {
			6: { fontSize: 8, fontColor: '#fff', strokeColor: '#9f3d0e'},
			7: { fontSize: 10, fontColor: '#fff', strokeColor: '#9f3d0e'},
			8: { fontSize: 10, fontColor: '#fff', strokeColor: '#9f3d0e'},
			9: { fontSize: 12, fontColor: '#fff', strokeColor: '#9f3d0e'},
			10: { fontSize: 14, fontColor: '#fff', strokeColor: '#9f3d0e'},
			11: { fontSize: 18, fontColor: '#fff', strokeColor: '#9f3d0e'},
			12: { fontSize: 24, fontColor: '#fff', strokeColor: '#9f3d0e'}
		};
		var zoom = data.map.getZoom();
		var option = (zoom < 6 ? lab_options[6] : (zoom > 12 ? lab_options[12] : lab_options[zoom]));
		var tag_label = new MapLabel({
			text: data.title, position: data.center, map: data.map, fontSize: option.fontSize,
			align: 'center', fontColor: option.fontColor, strokeColor: option.strokeColor,
			strokeWeight: 4, maxZoom: 16, minZoom: 6
		});
		var hmap = google.maps.event.addListener(data.map, 'zoom_changed', function(e){
			var zoom = data.map.getZoom();
			var option = (zoom < 6 ? lab_options[6] : (zoom > 12 ? lab_options[12] : lab_options[zoom]));
			tag_label.set('fontSize',option.fontSize);
			tag_label.set('fontColor',option.fontColor);
			tag_label.set('strokeColor',option.strokeColor);
		});
		$scope.listeners.push(hmap);
		return tag_label;
	};
	var clickHandler = null;
	var EditMode = function(data){
		var overlay = data.overlay;
		var status = overlay.getEditable();
		var map = data.map;
		overlay.setEditable(!status);
		if(!status){ // ENABLE EDIT MODE
			overlay.setOptions({draggable: true});
			data.label.setMap(null);
			clickHandler = google.maps.event.addListener(overlay, 'click', function (ev) {
				overlay.setOptions({draggable: true});
				// Check if click was on a vertex control point
				if (ev.vertex != undefined) { // DELETE MENU
					var delMenu = new DeleteMenu();
					delMenu.open(map, overlay.getPath(), ev.vertex);
				}
				else if(ev.edge == undefined){
				}
			});
			$scope.listeners.push(clickHandler);
		}
		else{ // DISABLE EDIT MODE
			google.maps.event.removeListener(clickHandler);
			overlay.setOptions({draggable: false});
			data.label.setMap(map);
			if ($scope.moved){
				$scope.UpdateStatus(true);
				Update_Label(data);
				Update_Intersections();
				$scope.moved = false;
			}
		}
	};
	var DeletePolygon = function(data){
		var index = data.index;
		var label = data.label;
		var title = label.text;		
		var map = data.map;
		$scope.DialogDelete(title)
		.then(function (result) {
			$scope.UpdateStatus(true);
			RemoveBoundary(index);
			Update_Label(data);
			Update_Intersections();
		}, function () {
			$scope.Notification.info({
				title: "Cancel", 
				message: 'Delete canceled',
				position: 'right',
				duration: 2000 
			});
		});
	};
	var EditPolygonLabel = function (data){
		var type = data.type;
		var label = data.label;
		var title = label.text;
		var modalScope = $scope.$new();
		modalScope.title = 'Update the Search Area label';
		modalScope.name = label.text;
		var modalInstance = $uibModal.open({
			templateUrl: 'polygon.name.tpl.html',
			scope: modalScope,
			size: 'sm',
			keyboard  : false
		});
		modalInstance.result.then(function (name) {
			label.set('text', name);
			$scope.UpdateStatus(true);
		}, function(result){
		});
		modalScope.Submit = function (name){
			modalInstance.close(name);
		}
		modalScope.cancel = function(){
			modalInstance.dismiss();
		}
	};
	var Create_ContextMenu = function(data){
		var map = data.map;
		var index = data.index;
		var menu_label = data.menu_label;
		var overlay = data.overlay;
		var label = data.label;
		var title = label.text;
		var type = data.type;
		// Context Menu
		var contextMenu = new ContextMenu(map, {
			classNames: { menu: 'context_menu', menuSeparator:'context_menu_separator'},
			menuItems: [
				{className:'context_menu_item', eventName:'edit_polygon_click', label: 'Edit '+ menu_label},
				{className:'context_menu_item', eventName:'edit_label_click', label: 'Change the Label'},
				{className:'context_menu_item', eventName:'delete_polygon_click', label: 'Delete '+ menu_label}
			]
		});
		$scope.contextMenus.push(contextMenu);
		// RIGHT CLICK ENABLE/DISABLE EDIT MODE
		var rightclickHandler = google.maps.event.addListener(overlay, 'rightclick', function (e) {
			var status = overlay.getEditable();
			if (status)
				EditMode(data);
			else
				contextMenu.show(e.latLng);
		});
		$scope.listeners.push(rightclickHandler);
		//	listen for the ContextMenu 'menu_item_selected' event
		var menu_event = google.maps.event.addListener(contextMenu, 'menu_item_selected', function(latLng, eventName){
			//	latLng is the position of the ContextMenu
			//	eventName is the eventName defined for the clicked ContextMenuItem in the ContextMenuOptions
			switch(eventName){
				case 'edit_polygon_click':
					EditMode(data);
					break;
				case 'delete_polygon_click':
					DeletePolygon(data);
					break;
				case 'edit_label_click':
					EditPolygonLabel(data);
			}
		});
		$scope.listeners.push(menu_event);
	};
	// Create a Polygon
	var CreatePolygon = function(data){
		var polygon = new google.maps.Polygon({
		  paths: data.path,
		  clickable: true, draggable: false, editable: false, strokeWeight: 2, geodesic: true,
		  fillColor: '#ffffff', fillOpacity: 0.3, strokeColor: '#5e9ae1', strokeOpacity: 0.7
		});
		polygon.setMap(data.map);
		return polygon;
	};
	// Create a Circle
	var CreateCircle = function (data){
		var circle = new google.maps.Circle({
			map: data.map,
			center: data.center, 
			radius: data.radius,
			fillColor: '#ffffff', fillOpacity: 0.3, strokeColor: '#5e9ae1',
			strokeWeight: 1, clickable: true, editable: false, zIndex: 1, draggable: false
		});
		return circle;
	};
	// Create a Rectangle
	var CreateRectangle = function (data){
		var rectangle = new google.maps.Rectangle({
			map: data.map,
			bounds: data.bounds,
			fillColor: '#ffffff', fillOpacity: 0.3, strokeColor: '#5e9ae1',
			strokeOpacity: 0.7, strokeWeight: 2, clickable: true, 
			editable: false, draggable: false
		});
		return rectangle;
	};
	// CLEANING Labels
	var Update_Label = function(data){
		var overlay = data.overlay;
		var type = data.type;
		var center = null;
		if (type == 'polygon'){
			center = overlay.Centroid();
		}
		else if (type == 'circle'){
			center = overlay.getCenter();
		}
		else{ // EVENT TO MODE RECTANGLE
			center = overlay.getBounds().getCenter();
		}
		data.label.set('position', center);
	};
	var CreateJstsPol = function(overlay, type){
		if (type == 'circle')
			return createJstsFromCircle(overlay);
		else if (type == 'polygon')
			return createJstsFromPolygon(overlay);
		else if (type == 'rectangle')
			return createJstsFromRectangle(overlay);
	};
	// CREATE LIST OF POLYGON COORDINATES
	var createJstsFromPolygon = function(polygon) {
		var path = polygon.getPath();
		var coordinates = path.getArray().map(function name(coord) {
			return new jsts.geom.Coordinate(coord.lat(), coord.lng());
		});
		if(coordinates[0].compareTo(coordinates[coordinates.length-1]) != 0) 
			coordinates.push(coordinates[0]);
		var shell = geometryFactory.createLinearRing(coordinates);
		return geometryFactory.createPolygon(shell);
	};
	// CREATE LIST OF RECTANGLE COORDINATES
	var createJstsFromRectangle = function(rectangle) {
		var bounds = rectangle.getBounds();
		var north = bounds.getNorthEast().lat(), south = bounds.getSouthWest().lat();
		var east = bounds.getNorthEast().lng(), west = bounds.getSouthWest().lng();
		var path = [[north, east],[north, west], [south,west],[south, east], [north, east]];
		var coordinates = _.map(path, function name(coord) {
			return new jsts.geom.Coordinate(coord[0], coord[1]);
		});
		if(coordinates[0].compareTo(coordinates[coordinates.length-1]) != 0) 
			coordinates.push(coordinates[0]);
		var shell = geometryFactory.createLinearRing(coordinates);
		return geometryFactory.createPolygon(shell);
	};
	// CREATE LIST OF CIRCLE COORDINATES
	var createJstsFromCircle = function(circle) {
		var mult = 4;
		var pointsToFind = mult * 360;
		var center = circle.getCenter();
		var radius = circle.getRadius();
		var coordinates = [];
		for (var i=0;i<pointsToFind;i++){
			var angle = i/mult;
			var pos = Spherical.computeOffset(center, radius, angle);
			var coordinate = new jsts.geom.Coordinate(pos.lat(), pos.lng());
			coordinates.push(coordinate);
		};
		if(coordinates[0].compareTo(coordinates[coordinates.length-1]) != 0) 
			coordinates.push(coordinates[0]);
		var shell = geometryFactory.createLinearRing(coordinates);
		return geometryFactory.createPolygon(shell);
	};
	// Create Intesection Areas
	var Create_Intesection = function(geobound){
		if (geobound.selected){
			var BoundPolygon = geobound.jsts_pol;
			_.forEach($scope.markers, function(marker) { // Marker Circle
				var tag_circle = marker.tag_circle;
				if(tag_circle){
					var Circle = tag_circle.jsts_pol;
					var intersection = BoundPolygon.intersects(Circle);
					if (intersection) {
						var section = BoundPolygon.intersection(Circle);
						var interArea = drawIntersectionArea($scope.map, section);
						$scope.Intersections.push(interArea);
					}
				}
			});
		}
	};
	var Create_Intesections = function(){
		_.forEach($scope.GeoBounds, function(geobound) { // GeoBounds
			Create_Intesection(geobound);
		});
	};
	// INTERSECTION AREAS
	var drawIntersectionArea = function(map, polygon) {
		var coords = polygon.getCoordinates().map(function (coord) {
			return { lat: coord.x, lng: coord.y };
		});
		var intersectionArea = new google.maps.Polygon({
			paths: coords,
			strokeColor: '#00FF00',
			strokeOpacity: 0.6,
			strokeWeight: 4,
			fillColor: '#00FF00',
			fillOpacity: 0.35
		});
		intersectionArea.setMap(map);
		return (intersectionArea);
	};
	// CLEANING AND UPDATING POLYGON INTERSECTION
	var Update_Intersections = function(){
		_.forEach($scope.Intersections, function(bound){
			if(bound)
				bound.setMap(null);
		});
		$scope.Intersections = [];
		$scope.GeoBounds = _.map($scope.GeoBounds, function(geobound){
			var jsts_pol = CreateJstsPol(geobound.overlay, geobound.type);
			geobound.jsts_pol = jsts_pol;
			return geobound;
		});
		Create_Intesections();
	};

	// Create 1 Boundary
	var Create_Boundary = function(data, map){
		var center;
		var overlay = null;
		var menu_label = 'Rectangle';
		if (data.type == 'polygon'){
			menu_label = 'Polygon';
			overlay = CreatePolygon({ path: data.path, map: map });
			center = overlay.Centroid();
			overlay.enableCoordinatesChangedEvent();
			var changeHandler = google.maps.event.addListener(overlay, 'coordinates_changed', function () {
				$scope.moved = true;
				$scope.UpdateStatus(true);
			});
			$scope.listeners.push(changeHandler);

			var dragstartHandler =  google.maps.event.addListener(overlay,  'dragstart', function(e){
				$scope.polygonDragStart(overlay);
			});
			$scope.listeners.push(dragstartHandler);

			var dragendHandler =  google.maps.event.addListener(overlay, 'dragend', function(e){
				$scope.polygonDragEnd(overlay);
			});
			$scope.listeners.push(dragendHandler);
		}
		else if (data.type == 'circle'){ // EVENT TO MODE CIRCLE
			menu_label = 'Circle';
			overlay = CreateCircle({ center: data.center, radius: data.radius, map: map });
			center = overlay.getCenter();
			var center_changed = google.maps.event.addListener(overlay, 'center_changed', function (e) {
				$scope.moved = true;
				$scope.UpdateStatus(true);
			});
			$scope.listeners.push(center_changed);

			var radius_changed = google.maps.event.addListener(overlay, 'radius_changed', function (e) {
				$scope.moved = true;
				$scope.UpdateStatus(true);
			});
			$scope.listeners.push(radius_changed);
		}
		else{
			menu_label = 'Rectangle';
			overlay = CreateRectangle({ bounds: data.bounds, map: map })
			center = overlay.getBounds().getCenter();
			var bounds_changed = google.maps.event.addListener(overlay, 'bounds_changed', function (e) {
				$scope.moved = true;
				$scope.UpdateStatus(true);
			});
			$scope.listeners.push(bounds_changed); 
		}
		var label = PolygonLabel({ center: center, map: map, title: data.title });
		var jsts_pol = CreateJstsPol(overlay, data.type);
		var databound = { type: data.type , overlay: overlay, jsts_pol: jsts_pol, index: data.index, 
			label: label, menu_label: menu_label, map: map, selected: data.selected };
		return databound;
	};

	// Create Boundarys
	var Create_Boundarys = function(boundarys, map){
		_.forEach(boundarys, function(data) {
			var databound = Create_Boundary(data, map);
			$scope.GeoBounds.push(databound);
			Create_ContextMenu(databound);
			ShowBoundarys(databound);
		});
	};

	$scope.polygon_path = null;
	$scope.polygonDragStart = function(polygon){
		$scope.polygon_path = angular.copy(polygon.getPath());
	};

	$scope.polygonDragEnd = function(polygon){
		var path = [];
		$scope.polygon_path.forEach(function(point){
			path.push(point);			
		});
		if($scope.polygon_path && path.length>0){
			var data = {
				title: 'Move the Search Area',
				message: 'Are you sure you want to move the search area?'
			};
		
			$scope.DialogUpdate(data).then(function (result) {
				$scope.polygon_path = null;
			}, function () {
				polygon.setMap(null);
				polygon.setPaths(path);
				polygon.setMap($scope.map);
				$scope.polygon_path = null;
			});
		}
	};

	$scope.moved = false;
	var Create_DrawingManager = function(map){
		drawingManager = new google.maps.drawing.DrawingManager(drawingOptions);
		drawingManager.setMap(map);
		$scope.moved = false;
		var overlaycomplete = google.maps.event.addListener(drawingManager, 'overlaycomplete', function(event) {
			var index = $scope.GeoBounds.length;
			var menu_label = (event.type == 'polygon') ? 'Polygon' : ((event.type == 'circle') ? 'Circle' : 'Rectangle');
			var title = (event.type == 'polygon') ? ('Polygon (' + index + ')') : ((event.type == 'circle') ? ('Circle (' + index + ')') : ('Rectangle (' + index + ')'));
			// Set Polygon Name
			$scope.DialogPolygonName(title, menu_label).then(function (new_title) {
				title = new_title;
				$scope.UpdateStatus(true);
				var center;
				if (event.type == 'polygon'){
					center = event.overlay.Centroid();
					event.overlay.enableCoordinatesChangedEvent();
					var changeHandler = google.maps.event.addListener(event.overlay, 'coordinates_changed', function () {
						$scope.moved = true;
						$scope.UpdateStatus(true);
					});
					$scope.listeners.push(changeHandler);

					var dragstartHandler =  google.maps.event.addListener(event.overlay,  'dragstart', function(e){
						$scope.polygonDragStart(event.overlay);
					});
					$scope.listeners.push(dragstartHandler);

					var dragendHandler =  google.maps.event.addListener(event.overlay, 'dragend', function(e){
						$scope.polygonDragEnd(event.overlay);
					});
					$scope.listeners.push(dragendHandler);
				}
				else if (event.type == 'circle'){ // EVENT TO MODE CIRCLE
					center = event.overlay.getCenter();
					var center_changed = google.maps.event.addListener(event.overlay, 'center_changed', function (e) {
						$scope.moved = true;
						$scope.UpdateStatus(true);
					});
					$scope.listeners.push(center_changed);

					var radius_changed = google.maps.event.addListener(event.overlay, 'radius_changed', function (e) {
						$scope.moved = true;
						$scope.UpdateStatus(true);
					});
					$scope.listeners.push(radius_changed);
				}
				else{ // EVENT TO MODE RECTANGLE
					center = event.overlay.getBounds().getCenter();
					var bounds_changed = google.maps.event.addListener(event.overlay, 'bounds_changed', function (e) {
						$scope.moved = true;
						$scope.UpdateStatus(true);
					});
					$scope.listeners.push(bounds_changed);
				}
				var label = PolygonLabel({ center: center, map: $scope.map, title: title });
				var jsts_pol = CreateJstsPol(event.overlay, event.type);
				var databound = { type: event.type , overlay: event.overlay, jsts_pol: jsts_pol, index: $scope.guid(), 
					label: label, menu_label: menu_label, map: map, selected: true };
				$scope.GeoBounds.push(databound);
				Create_Intesection(databound);
				Create_ContextMenu(databound);
				drawingManager.setDrawingMode(null);
			}, function () {
				event.overlay.setMap(null);
				drawingManager.setDrawingMode(null);
			});
		});
		$scope.listeners.push(overlaycomplete);
	};
	// INITIALIZE A MAP
	NgMap.getMap({id:'boundary'}).then(function(map) {
		$scope.map = map;
		map.setMapTypeId(google.maps.MapTypeId.ROADMAP);
		map.mapTypeControl = true;
		map.mapTypeControlOptions = mapTypeControlOptions;
		if (!drawingManager)
			Create_DrawingManager(map);
		var position = position_default;
		$scope.map.setZoom(zoom_default);
		$scope.map.setCenter(position);
		if(inputdata.boundarys && inputdata.boundarys.length){
			Create_Boundarys(inputdata.boundarys, $scope.map);
		}
		if(mspider === null || mspider === undefined)
			mspider = new OverlappingMarkerSpiderfier(map, spiderConfig);
		else{
			mspider.clearListeners();
			mspider.clearMarkers();
		}
		if(inputdata.entities)
			SetLocationOnMap(inputdata.entities);
		Create_Intesections();
		google.maps.event.trigger(map,'resize');


		// $(map.getDiv()).one('mouseover','img[src="https://maps.gstatic.com/mapfiles/drawing.png"]',function(e){
		// 	$(e.delegateTarget).find('img[src="https://maps.gstatic.com/mapfiles/drawing.png"]').each(function(){
		// 		$(this).closest('div[title]').attr('title',function(){
		// 			switch(this.title){
		// 				case 'Draw a shape':
		// 					return 'Add a new Polygon Filter';
		// 				break;
		// 				case 'Draw a rectangle':
		// 					return 'Add a ew Rectangle Filter';
		// 				break;
		// 				case 'Draw a circle':
		// 					return 'Add a new Circle Filter';
		// 				break;
		// 				default:return this.title;  
		// 			}
		// 		});
		// 	});
		// });
	});
	var dlb_promise = null;
	var animated = undefined;
	$scope.animated = null;
	$scope.AnimateMarker = function(marker){
		if(dlb_promise) return;
		dlb_promise = $timeout(function() {
			$timeout.cancel(dlb_promise);
			dlb_promise = null;
			if(animated != undefined && $scope.animated){
				$timeout.cancel(animated);
				$scope.animated.setAnimation(null);
			}
			$scope.animated = marker;
			$scope.animated.setAnimation(google.maps.Animation.BOUNCE);
			animated = $timeout(function() {
				$scope.animated.setAnimation(null);
			}, 1000);
		}, 250);
	};

	$scope.CenterMarker = function(marker){
		$timeout.cancel(dlb_promise);
		dlb_promise = null;
		$scope.map.setCenter(marker.getPosition());
	};

	$scope.SelectBoundary = function(boundary){
		ShowBoundarys(boundary)
		Update_Intersections();
	};
	var ShowBoundarys = function(boundary){
		var map = boundary.selected ? $scope.map : null;
		boundary.label.setMap(map);
		boundary.overlay.setMap(map);
	};
	// REMOVE BOUNDARY
	var RemoveBoundary = function(index){
		var bound = _.find($scope.GeoBounds,{ index: index });
		if (bound){
			bound.label.setMap(null);
			bound.overlay.setMap(null);
		}
		_.remove($scope.GeoBounds,{ index: index });
	};
	// CLEAN ALL
	var cleanAll = function(){
		if(drawingManager)
			drawingManager.setMap(null);
		_.forEach($scope.GeoBounds, function(bound){
			bound.overlay.setMap(null);
			bound.label.setMap(null);
		});
		_.forEach($scope.Intersections, function(bound){
			if(bound)
				bound.setMap(null);
		});
		_.forEach($scope.contextMenus, function(menu){
			menu.setMap(null);
		});
		_.forEach($scope.markers,function(marker){
			if(_.has(marker, 'marker') && marker['marker'])
				marker['marker'].setMap(null);
			if(_.has(marker,'tag_circle') && marker['tag_circle']){
				var tag_circle = marker['tag_circle'];
				tag_circle['circle'].setMap(null);
				tag_circle['label'].setMap(null);
			}
		});
		if(mspider){
			mspider.clearListeners();
			mspider.clearMarkers();
		}
	};
	// CANCELAR FUNCTION
	$scope.Cancel = function () {
		cleanAll();
		$uibModalInstance.dismiss();
	};

	var BoundsToJson = function(){
		var overlays = _.map($scope.GeoBounds, function(data){
			var outdata = {};
			outdata['index'] = data['index'];
			outdata['type'] = data['type'];
			outdata['title'] = data['label']['text'];
			outdata['selected'] = data['selected'];
			switch (outdata['type']){
				case 'circle':
					outdata['center'] = data['overlay'].getCenter();
					outdata['radius'] = data['overlay'].getRadius();
				break;
				case 'rectangle':
					outdata['bounds'] = data['overlay'].getBounds();
				break;
				case 'polygon':
					outdata['path'] = data['overlay'].getPath().getArray();
				break;
			};
			return outdata;
		});
		return overlays;
	};
	// Submit the Update
	$scope.Submit = function(){
		if($scope.boundary.modified){
			cleanAll();
			var output = BoundsToJson();
			$uibModalInstance.close({boundarys: output});
		}
	};
	// CLOSE MODAL ON ESCAPE KEY
	$scope.KeyEvent = function($event){
		if($event.key == "Escape")
			$scope.Cancel();
	};

	//==============================================
	// MARKERS
	//==============================================
	var TagLabels = function(data){
		var pos0 = data.center;
		var pos1 = Spherical.computeOffset(data.center, data.radius/4 , 180);
		var pos2 = Spherical.computeOffset(data.center, data.radius/8 , 180);
		var pos3 = Spherical.computeOffset(data.center, data.radius/2 , 180);
		var lab_options = {
			6: { fontSize: 8, fontColor: '#fff', strokeColor: '#9f3d0e', position: pos0 },
			7: { fontSize: 10, fontColor: '#fff', strokeColor: '#9f3d0e', position: pos3 },
			8: { fontSize: 10, fontColor: '#fff', strokeColor: '#9f3d0e', position: pos3 },
			9: { fontSize: 14, fontColor: '#fff', strokeColor: '#9f3d0e', position: pos2 },
			10: { fontSize: 16, fontColor: '#fff', strokeColor: '#9f3d0e', position: pos2 },
			11: { fontSize: 18, fontColor: '#fff', strokeColor: '#9f3d0e', position: pos2 },
			12: { fontSize: 28, fontColor: '#fff', strokeColor: '#9f3d0e', position: pos1 }
		};
		var zoom = $scope.map.getZoom();
		var option = (zoom < 6 ? lab_options[6] : (zoom > 12 ? lab_options[12] : lab_options[zoom]));
		var tag_label = new MapLabel({
			text: data.title,
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
			var option = (zoom < 6 ? lab_options[6] : (zoom > 12 ? lab_options[12] : lab_options[zoom]));
			tag_label.set('fontSize',option.fontSize);
			tag_label.set('position',option.position);
			tag_label.set('fontColor',option.fontColor);
			tag_label.set('strokeColor',option.strokeColor);
		});
		$scope.listeners.push(hmap);
		return tag_label;
	};
	// Create Tag Location Circle
	var TagCircle = function (data){
		var tag_circle = new google.maps.Circle({ 
			strokeColor: (data.stroke && data.stroke.color) ? data.stroke.color : '#9f3d0e',
			strokeOpacity: (data.stroke && data.stroke.opacity) ? data.stroke.opacity : 0.2, 
			fillColor: (data.fill && data.fill.color) ? data.fill.color : 'rgba(217, 82, 16, 0.24)',
			fillOpacity: (data.fill && data.fill.opacity) ? data.fill.opacity : 0.2,
			draggable: false,
			strokeWeight: 2, 
			map: $scope.map,
			center: data.center, 
			radius: data.radius
		});
		var tag_label = TagLabels({ center: data.center, radius: data.radius, title: data.title });
		var jsts_pol = CreateJstsPol(tag_circle, 'circle');
		return ({ circle: tag_circle, label: tag_label, jsts_pol: jsts_pol });;
	};
	// Show / Hide Marker Label
	$scope.show_label = function(marker, status){
		marker.labelClass = status ? "show_markerlabel" : "hide_markerlabel";
		marker.label.draw();
	};
	// Marker Label Content
	var MarkerlabelContent = function(position, name){
		var lat = position.lat().toFixed(6).toString();
		var lng = position.lng().toFixed(6).toString();
		var name = name;
		return (name + '\n (' + lat + ',' + lng + ')');
	};
	// Set Lion/Imageset Marker on Map
	var SetLocationOnMap = function (entities) {
		$scope.markers = _.map(entities, function(entity, i){
			var position = new google.maps.LatLng(entity.latitude, entity.longitude);
			$scope.bounds.extend(position);
			var name = entity.name;
			var marker = new MarkerLabel({
				position: position, 
				map: $scope.map,
				draggable: false, raiseOnDrag: true, 
				icon: icon, labelStyle: {opacity: 1.0}, 
				labelClass: "hide_markerlabel",
				labelContent: MarkerlabelContent(position, name), 
				labelAnchor: new google.maps.Point(30, 50)
			});

			var mouseover = google.maps.event.addListener(marker, 'mouseover', function (event) {
				$scope.show_label(marker,true);
			});
			$scope.listeners.push(mouseover);
			
			var mouseout = google.maps.event.addListener(marker, 'mouseout', function (event) {
				$scope.show_label(marker,false);
			});
			$scope.listeners.push(mouseout);

			// Create a TagCircle
			var tag_circle = null;
			var title = 'lat: ' + entity.latitude + ' lng: ' + entity.longitude; 
			if (entity.tag_location && entity.tag_location.value){
				// Create a TagCircle
				tag_circle = TagCircle({
					center: position,
					radius: entity.tag_location.value,
					title: entity.tag_location.title,
					draggable: false,
					zIndex: 10,
				});
				tag_circle.circle.bindTo('center', marker, 'position');
				title = entity.tag_location.title + ' : ' + entity.tag_location.value +' km <br>'+ title;
			}
			mspider.addMarker(marker);

			var data_marker = {
				marker: marker, 
				tag_circle: tag_circle,
				location: entity.location,
				tag_location: entity.tag_location,
				circle: entity.circle,
				name: entity.name,
				id: entity.id,
				thumbnail: entity.thumbnail,
				tooltip: { title: title, enabled: true }
			};
			return (data_marker);
		});
		if(!$scope.markers.length){
			var center = $scope.bounds.getCenter();
			$scope.map.setCenter(center);
		}
		if($scope.markers.length >1){
			var ne = $scope.bounds.getNorthEast();
			var sw = $scope.bounds.getSouthWest();
			if(!ne.equals(sw)){
				var radius = Calc_Max_Radius(center, $scope.markers);
				$scope.bounds = CircleBounds(center, radius);
				$scope.map.fitBounds($scope.bounds);
			}
		}
	};

	// Calc Radius distance 
	var Calc_Max_Radius = function (center, markers){
		var dist = 0;
		_.forEach(markers, function(data_marker){
			var marker = data_marker.marker;
			var position = marker.getPosition()
			dist = Math.max(dist, Spherical.computeDistanceBetween(position, center));
		});
		return (dist);
	};
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

	$scope.guid = function(){
		return s4() + s4() + s4() + s4() + s4() + s4();
	};
	function s4(){
		return Math.floor((1+ Math.random()) * 0x10000).toString(16).substring(1);
	};

	// Set Lat/Lng 
	$scope.UpdateStatus = function(val){
		$scope.timeout=$timeout(function() {
			$scope.$apply(function () {
				$scope.boundary.modified = val;
			});
		});
	};

	// Save Boundarys in File
	$scope.SaveBoundarys = function(){
		var date = new Date;
		var outputs = BoundsToJson();
		var json_data = {
			version : "1.0",
			date: date.toISOString(),
			boundarys: outputs
		};

		var jsonfile = JSON.stringify(json_data);
		var data = new Blob([jsonfile], {type: 'application/json;charset=utf-8'});
		var name = "Geographical-Filters-" + date.toISOString().slice(0,16).replace(/T/g,"h");
		FileSaver.saveAs(data, name);
	};

	// Import Boundarys from File
	$scope.fileupload = { name: '' };
	$scope.LoadBoundarys = function(file){
		var reader = new FileReader();
		reader.onload = function(e) {
			try {
				var data = JSON.parse(reader.result);
				$timeout(function() {
					$scope.$apply(function () {
						if(data.hasOwnProperty('boundarys') && data.boundarys.length>0){
							var scopeLoad = $scope.$new();
							scopeLoad.boundarys = angular.copy(data.boundarys);
							scopeLoad.show_keep = !_.isEmpty($scope.GeoBounds);
							var modalLoad = $uibModal.open({
								templateUrl: 'select.boundarys.tpl.html',
								controller: 'SelectBoundarysCtrl',
								scope: scopeLoad, backdrop: 'static', keyboard: false,
								animation: true, transclude: true, replace: true
							});
							modalLoad.result.then(function (response) {
								LoadBoundarys({boundarys: data.boundarys, keep: response.keep, selecteds: response.selecteds});
							}, function (error){
							});
						}
					});
				},100);
			} catch (error) {
				alert("File Type Not supported!");
			}
		};
		reader.readAsText(file);
	};
	var LoadBoundarys = function(input_data){
		if(!input_data.keep){
			_.forEach($scope.GeoBounds, function(bound) {
				if(bound){
					bound.label.setMap(null);
					bound.overlay.setMap(null);
				}
			});
			$scope.GeoBounds = [];
			_.forEach($scope.Intersections, function(bound){
				if(bound)
					bound.setMap(null);
			});
			$scope.Intersections = [];
		}
		_.forEach(input_data.boundarys, function(data, index) {
			if( _.includes(input_data.selecteds, index)){
				data.selected = true;
				data.index = $scope.guid();
				var databound = Create_Boundary(data, $scope.map);
				$scope.GeoBounds.push(databound);
				Create_ContextMenu(databound);
				ShowBoundarys(databound);
			}
		});
		Create_Intesections();
		$scope.boundary.modified = true;
	};

	$scope.DialogPolygonName = function (name, type){
		var deferred = $q.defer();
		var scopeName = $scope.$new();
		scopeName.title = 'Enter a label for the Search Area';
		scopeName.name = name;
		var modalName = $uibModal.open({
			templateUrl: 'polygon.name.tpl.html',
			scope: scopeName,
			size: 'sm',
			keyboard  : false
		});
		modalName.result.then(function (name) {
			deferred.resolve(name);
		}, function(result){
			deferred.reject();
		});
		scopeName.Submit = function (name){
			modalName.close(name);
		}
		scopeName.cancel = function(){
			modalName.dismiss();
		}
		return deferred.promise;
	};

	$scope.DialogDelete = function (title){
		var deferred = $q.defer();
		var scopeDel = $scope.$new();
		scopeDel.title = 'Delete Search Area "' + title + '"';
		scopeDel.message = 'Are you sure you want to delete the search area labeled "' + title + '" ?';
		var modalDel = $uibModal.open({
			templateUrl: 'Dialog.Delete.tpl.html',
			scope: scopeDel,
			backdrop: 'static',
			keyboard  : false
		});
		modalDel.result.then(function (result) {
			deferred.resolve();
		}, function(result){
			deferred.reject();
		});

		scopeDel.ok = function (){
			modalDel.close();
		}
		scopeDel.cancel = function(){
			modalDel.dismiss();
		}
		return deferred.promise;
	};

	$scope.DialogUpdate = function (data){
		var deferred = $q.defer();
		var scopeUpdate = $scope.$new();
		scopeUpdate.title = data.title;
		scopeUpdate.message = data.message;
		var modalUpdate = $uibModal.open({
			templateUrl: 'Dialog.Delete.tpl.html',
			scope: scopeUpdate,
			backdrop: 'static',
			keyboard  : false
		});
		modalUpdate.result.then(function (result) {
			deferred.resolve();
		}, function(result){
			deferred.reject();
		});

		scopeUpdate.ok = function (){
			modalUpdate.close();
		}
		scopeUpdate.cancel = function(){
			modalUpdate.dismiss();
		}
		return deferred.promise;
	};
	//==============================================
	// MENU DELETE VERTEX
	//==============================================
	function DeleteMenu() {
		this.div_ = document.createElement('div');
		this.div_.className = 'delete-menu';
		this.div_.innerHTML = 'Delete';

		var menu = this;
		google.maps.event.addDomListener(this.div_, 'click', function() {
			menu.removeVertex();
		});
	}
	DeleteMenu.prototype = new google.maps.OverlayView();
	DeleteMenu.prototype.onAdd = function() {
		var deleteMenu = this;
		var map = this.getMap();
		this.getPanes().floatPane.appendChild(this.div_);

		// mousedown anywhere on the map except on the menu div will close the menu.
		this.divListener_ = google.maps.event.addDomListener(map.getDiv(), 'mousedown', function(e) {
			if (e.target != deleteMenu.div_) {
				deleteMenu.close();
			}
		}, true);
	};
	DeleteMenu.prototype.onRemove = function() {
		google.maps.event.removeListener(this.divListener_);
		this.div_.parentNode.removeChild(this.div_);

		// clean up
		this.set('position');
		this.set('path');
		this.set('vertex');
	};
	DeleteMenu.prototype.close = function() {
		this.setMap(null);
	};
	DeleteMenu.prototype.draw = function() {
		var position = this.get('position');
		var projection = this.getProjection();
		if (!position || !projection) {
			return;
		}
		var point = projection.fromLatLngToDivPixel(position);
		this.div_.style.top = point.y + 'px';
		this.div_.style.left = point.x + 'px';
	};
	// Opens the menu at a vertex of a given path.
	DeleteMenu.prototype.open = function(map, path, vertex) {
		this.set('position', path.getAt(vertex));
		this.set('path', path);
		this.set('vertex', vertex);
		this.setMap(map);
		this.draw();
	};
	//Deletes the vertex from the path.
	DeleteMenu.prototype.removeVertex = function() {
		var path = this.get('path');
		var vertex = this.get('vertex');
		if (!path || vertex == undefined) {
			this.close();
			return;
		}
		path.removeAt(vertex);
		this.close();
	};
}])

// Select Boundarys from File
.controller('SelectBoundarysCtrl', ['$scope', '$sce', '$uibModalInstance', function($scope, $sce, $uibModalInstance) {
								
	$scope.title = 'Inport Search Areas';
	$scope.keep = {old: true};

	$scope.Selecteds = [];
	_.forEach($scope.boundarys, function(boundary) { _.set(boundary, 'selected', false); });

	$scope.Select = function (boundary){
		if(boundary.selected){
			if(!_.some($scope.Selecteds, boundary))
				$scope.Selecteds.push(boundary);
		}
		else
			$scope.Selecteds = _.without($scope.Selecteds, boundary);
	};
	$scope.Cancel = function(){
		$uibModalInstance.dismiss('cancel');
	};

	$scope.Import = function(){
		var results = {
			selecteds: _.map(_.filter($scope.boundarys, 'selected'), 'index'),
			keep: $scope.keep.old
		};
		$uibModalInstance.close(results);
	};
}])

// Geographical
.filter('geographical2', function(){
	var Poly = google.maps.geometry.poly;

	var Contain = function(marker, GeoBounds){
		var contain = false;
		if(!marker.tag_location){// Is Exact Location
			_.forEach(GeoBounds, function(databound){
				if (databound.selected){
					if (databound.type == 'circle'){
						contain = databound.overlay.Contains(marker.location);
						if(contain)
							return false;
					}
					if (databound.type == 'rectangle'){
						var bounds = databound.overlay.getBounds();
						contain = bounds.contains(marker.location);
						if(contain)
							return false;
					}
					if (databound.type == 'polygon'){ 
						var polygon = databound.overlay;
						contain = Poly.containsLocation(marker.location, polygon);
						if(contain)
							return false;
					}
				}
			});
			return contain;
		}
		else{ // Is Approximated Location
			_.forEach(GeoBounds, function(databound){
				if (databound.selected){
					contain = databound.jsts_pol.intersects(marker.circle)
					if(contain)
					return false;
				}
			});
			return contain;
		}
	};

	return function(inputs, GeoBounds) {
		if(GeoBounds == undefined || (GeoBounds && !GeoBounds.length))
			return inputs;
		if(_.every(GeoBounds, {selected: false}))
			return inputs;
		var filtered = _.filter(inputs, function(input){
			return Contain(input, GeoBounds);
		});
		return filtered;
	};
})

.directive('loadBoundarysOnChange', function() {
	return {
		restrict: 'A',
		scope: {
				 method:'&loadBoundarysOnChange'
		 },
		link: function (scope, element, attrs) {
			var onChangeFunc = scope.method();
			element.bind('change', function(event){
				var file = event.target.files[0];
				onChangeFunc(file);
				element.val(null);
			});
		}
	};
});

