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

angular.module('linc.controllers', ['linc.admin.controllers', 'linc.compare.images.controller',
	'linc.conservationists.controller', 'linc.cvrequest.controller', 'linc.cvresults.controller',
	'linc.home.controller', 'linc.image.gallery.controller', 'linc.imageset.controller',
	'linc.lion.controller', 'linc.location.history.controller', 'linc.login.controller',
	'linc.metadata.controller', 'linc.view.imagesets.controller', 'linc.view.lion.database.controller',
	'linc.side.menu.controller', 'linc.upload.images.controller', 'linc.boundary.map.controller',
	'linc.relatives.controller', 'request.access.controller', 'linc.metadata.batch.controller',
	'linc.delete.batch.controller', 'linc.location.on.map.controller'])

.controller('BodyCtrl', ['$scope', '$rootScope', '$state', '$interval', '$timeout', '$uibModal', 
  'AuthService', 'NotificationFactory',
  function ($scope, $rootScope, $state, $interval, $timeout, $uibModal, AuthService, NotificationFactory){

	$scope.bodyClasses = 'default';
	$scope.link = {disabled: false};
	$scope.batch = {loading: false};
	$scope.debug = false;
	$scope.show_navbar = true;
	// this'll be called on every state change in the app
	$rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams){
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
	};

	$scope.goto_home = function(){
		if($scope.Auth.user && $scope.Auth.user.logged && !$scope.link.disabled)
			$state.go("home");
	};

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

	$scope.isBatchMode = false;
	$scope.BatchFilter = {};
	
	$scope.Select_BatchMode = function(){
		$scope.batch.loading = true;
		$timeout(function () {
			$scope.$apply(function () {
				$scope.isBatchMode = !$scope.isBatchMode;
				$scope.link.disabled = $scope.isBatchMode;
				$scope.BatchFilter = $scope.isBatchMode ? {'permissions': {'ismine': true}} : {};
				$scope.batch.loading = false;
				$rootScope.$broadcast('BatchModeUpdated', {isBatchMode: $scope.isBatchMode})
				if($scope.isBatchMode)
					$scope.bodyClasses = 'BatchMode';
				else
					$scope.bodyClasses = 'default';
			});
		},0);
	};

	// Geographical Filter
	var geometryFactory = new jsts.geom.GeometryFactory();
	var Spherical = google.maps.geometry.spherical;
	// CREATE LIST OF COORDINATES
	$scope.CreateJstsPol = function(overlay, type){
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

	// Create a Polygon
	$scope.CreatePolygon = function(data){
		var polygon = new google.maps.Polygon({
			paths: data.path
		});
		polygon.setMap(data.map);
		return polygon;
	};

	// Create a Circle
	$scope.CreateCircle = function (data){
		var circle = new google.maps.Circle({
			map: data.map,
			center: data.center, 
			radius: data.radius
		});
		return circle;
	};

	// Create a Rectangle
	$scope.CreateRectangle = function (data){
		var rectangle = new google.maps.Rectangle({
			map: data.map,
			bounds: data.bounds,
		});
		return rectangle;
	};
}])

.controller('ViewImagesCtrl', ['$scope', '$stateParams',
	function ($scope, $stateParams){
		$scope.images = $stateParams.images ? $stateParams.images : {};
	}
])

// Unfase html
.filter('unsafe', function($sce) {
  return $sce.trustAsHtml;
})

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

.filter('filter_including', function(){
	return function(input, items, special_str){
		var filtered = _.filter(input, function(value){
			var contain = false;
			var val = value.name.toLowerCase();
			_.forEach(items, function (item){
				if(special_str){
					if(value.hasOwnProperty(special_str) && value[special_str] == item)
					{
						contain = true;
						return false;
					}
				}
				else{
					if(val.indexOf(item) != -1){
						contain = true;
						return false;
					}
					if(!isNaN(Number(item)) && (parseInt(item, 10) == value.id)){
						contain = true;
						return false;
					}					
				}
				if(item.length==1 && item[0]==="*"){
					contain = true;
					return false;
				}
			});
			return contain;
		});	
		return filtered;
	};
})

// Name or Id Filter
.filter('nameid_filter', ['$filter', function($filter){
	return function(input, name_str, special_str) {

		if(name_str == undefined || !name_str.length)
			return input;

		var name = name_str.toLowerCase();
		// split by space
		var name_pieces = name.match(/\S+/g);
		//var id = parseInt(name, 10);
		if(name_pieces.length==1 && name_pieces[0]==="*")
			return input;

		var normal_filters = _.filter(name_pieces, function(item){return item.length && item[0] != '!';});
		var normal_rules = _.filter(normal_filters, function(item){return item.length && item[0] != '-';});
		var normal_filtered = $filter('filter_including')(input, normal_rules, null);
		
		var normal_exclude_rules = _.map(_.filter(normal_filters, function(item){return item.length>1 && item[0] == '-';}), function(val){return val.slice(1)});
		var normal_exclude_filtered = $filter('filter_including')(input, normal_exclude_rules, null);

		var filtered = _.difference(normal_filtered, normal_exclude_filtered);

		var special_filters = _.map(_.filter(name_pieces, function(item){return item.length>1 && item[0] == '!';}), function(val){return val.slice(1)});
		if (special_filters.length){
			var special_rules = _.filter(special_filters, function(item){return item.length && item[0] != '-';});
			var special_filtered = $filter('filter_including')(input, special_rules, special_str);
			var special_exclude_rules = _.map(_.filter(special_filters, function(item){return item.length>1 && item[0] == '-';}), function(val){return val.slice(1)});
			var special_exclude_filtered = $filter('filter_including')(input, special_exclude_rules, special_str);
			var filtered2 = _.difference(special_filtered, special_exclude_filtered);
			filtered = _.union(filtered, filtered2);
		}
		return filtered;
	};
}])

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

.filter('primary_filter', function(){
	return function(input, primarys) {
		var filtered = _.filter(input, function(value){
				if(!_.has(value, 'is_primary'))
					return value;
				return (_.result(_.find(primarys, {'name': value.is_primary}), 'checked'));
		});
		return filtered;
	};
})

.filter('percentage', ['$filter', function ($filter) {
	return function (input, decimals) {
		return $filter('number')(input * 100, decimals) + '%';
	};
}])
// Private Filter
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
// LatLng Filter
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
// Properties Filter
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

.filter('geographical', function(){
	var Poly = google.maps.geometry.poly;

	var Contain = function(input, GeoBounds){
		var contain = false;
		if(!input.location)
			return false;
		if(!input.tag_location){// Is Exact Location
			_.forEach(GeoBounds, function(geobound){
				if (geobound.databound.type == 'circle'){
					contain = geobound.overlay.Contains(input.location);
					if(contain)
						return false;
				}
				if (geobound.databound.type == 'rectangle'){
					var bounds = geobound.overlay.getBounds();
					contain = bounds.contains(input.location);
					if(contain)
						return false;
				}
				if (geobound.databound.type == 'polygon'){ 
					var polygon = geobound.overlay;
					contain = Poly.containsLocation(input.location, polygon);
					if(contain)
						return false;
				}
			});
			return contain;
		}
		else{ // Is Approximated Location
			_.forEach(GeoBounds, function(geobound){
				contain = geobound.jsts_pol.intersects(input.circle)
				if(contain)
					return false;
			});
			return contain;
		}
	};

	return function(inputs, GeoBounds) {
		if(GeoBounds == undefined || (GeoBounds && !GeoBounds.length))
			return inputs;
		var filtered = _.filter(inputs, function(input){
			return Contain(input, GeoBounds);
		});
		return filtered;
	};
});

