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

angular.module('linc.view.lion.database.controller', [])

.controller('ViewLionDatabaseCtrl', ['$scope', '$rootScope', '$state', '$timeout', '$q', '$filter', '$stateParams',
  '$bsTooltip', 'AuthService', 'lions', 'lion_options', 'default_options', '$ModalPage', '$uibModal', 'NgMap',
  'LincServices', 'LincDataFactory', 'NotificationFactory', 'TAG_LABELS', 'TOOL_TITLE', 'CONST_VIEWCOLUMNS',
  function ($scope, $rootScope, $state, $timeout, $q, $filter, $stateParams, $bsTooltip, AuthService, lions, lion_options,
  default_options, $ModalPage, $uibModal, NgMap, LincServices, LincDataFactory, NotificationFactory,
  TAG_LABELS, TOOL_TITLE, CONST_VIEWCOLUMNS) {

	$scope.user = AuthService.user;
	$scope.$parent.isBatchMode = false;

	$scope.ChangeStatus = $rootScope.ChangeStatus;

	$scope.tooltip = { features: { title: 'tips: ' + TOOL_TITLE, checked: true } };

	var GET_FEATURES = function (lbs, TAGS){
		var label = "";
		TAGS.forEach(function (elem, i){
			label += lbs[elem];
			if(i<TAGS.length-1) label += ', ';
		});
		return label;
	};

	var get_permissions = function (user,lion){
		var permissions = {};
		var lion_ismine  = user.organization_id == lion.organization_id;

		permissions['canLocate'] = (!lion.geopos_private || user.admin || lion_ismine);
		permissions['ismine'] = (user.admin || lion_ismine);
		return permissions;
	};

	var set_all_lions = function(sets, selected){

		$scope.lions = _.map(sets, function(element, index) {

			element['permissions'] = get_permissions($scope.user, element);
			element['age'] = isNaN(parseInt(element['age'])) ? null : element['age'];

			var elem = {};
			var TAGS = [];
			if(!element.gender) element.gender = 'unknown';
			if(element['tags']==undefined)element['tags']="[]";
			try{ TAGS = JSON.parse(element['tags']);
			}catch(e){ TAGS = element['tags'].split(","); }
			if(TAGS==null) TAGS = [];

			var tag_features = GET_FEATURES(TAG_LABELS, TAGS);
			elem['tooltip'] = {
				features: {title: tag_features, checked: true},
				need_verify: {title: 'There are Image sets pending of verification', checked: true}
			};
			elem['features'] = (tag_features.length > 0) ? true : false;
			elem['tag_features'] = tag_features;
			elem['selected'] = (selected && _.has(element, 'selected') ? element['selected'] : false);

			elem['location'] = (!element['latitude'] || !element['longitude']) ? null : new google.maps.LatLng(element['latitude'], element['longitude']);
			if (element['tag_location']){
				var circle = $scope.CreateCircle({'center': elem['location'], 'radius': element['tag_location']['value'] })
				elem['circle'] = $scope.CreateJstsPol(circle, 'circle');
			}

			return _.extend({}, element, elem);
		});
	};

	set_all_lions(lions);

	$scope.refreshSlider = function () {
		$timeout(function () {
			$scope.$broadcast('rzSliderForceRender');
		});
	};

	// Click in Photo - Show Big Image
	$scope.show_photo = function(url){
		var win = window.open(url, "_blank", "toolbar=yes, scrollbars=yes, resizable=yes, top=100, left=100, width=600, height=600");
		win.focus();
	};

	$scope.refreshSlider();

	$scope.filters = lion_options.filters;
	$scope.isCollapsed = lion_options.isCollapsed;
	$scope.orderby = lion_options.orderby;

	$scope.ShowColumn = function(col){
		return $scope.columns ? _.includes($scope.columns, col) : false;
	};
	$scope.ColumnsSelect = function(){
		lion_options.Columns = $scope.columns;
		LincDataFactory.set_lions(lion_options);
	};

	if(!lion_options.Columns)
		lion_options.Columns = angular.copy(default_options.Columns);
	$scope.columns = lion_options.Columns;
	$scope.columns_to_view = CONST_VIEWCOLUMNS.columns.lions;

	$scope.change = function(type){
		lion_options.filters[type] = $scope.filters[type];
		LincDataFactory.set_lions(lion_options);
	};

	// Click collapse
	$scope.collapse = function(type){
		lion_options.isCollapsed[type] = $scope.isCollapsed[type] = !$scope.isCollapsed[type];
		LincDataFactory.set_lions(lion_options);
	};

	$scope.order = function(predicate) {
		$scope.orderby.reverse = ($scope.orderby.predicate === predicate) ? !$scope.orderby.reverse : false;
		$scope.orderby.predicate = predicate;
		lion_options.orderby = $scope.orderby;
		LincDataFactory.set_lions(lion_options);
	};

	$scope.viewer_selected = function(){
		var label = "";
		if($scope.Selecteds.length == $scope.lions.length)
			label = "All " + $scope.Selecteds.length + " lions are selected";
		else if($scope.Selecteds.length){
			label = ($scope.Selecteds.length).toString();
			label += ($scope.Selecteds.length == 1 ) ? ' is selected' : ' are selected';
		}
		return label;
	};
	$scope.pfilters = $stateParams.filter ? $stateParams.filter : {};

	if(Object.keys($scope.pfilters).length){
		console.log('View lions - has filter params');
		$scope.filters.NameOrId = $scope.pfilters.hasOwnProperty('NameOrId') ? $scope.pfilters.NameOrId : default_options.filters.NameOrId;
		$scope.filters.Organizations = $scope.pfilters.hasOwnProperty('Organizations') ? $scope.pfilters.Organizations : default_options.filters.Organizations;
		$scope.filters.Ages = $scope.pfilters.hasOwnProperty('Ages') ? $scope.pfilters.Ages : default_options.filters.Ages;
		$scope.filters.Genders = $scope.pfilters.hasOwnProperty('Genders') ? $scope.pfilters.Genders : default_options.filters.Genders;
		$scope.filters.TagFeatures = $scope.pfilters.hasOwnProperty('TagFeatures') ? $scope.pfilters.TagFeatures : default_options.filters.TagFeatures;
		$scope.filters.Location = $scope.pfilters.hasOwnProperty('Location') ? $scope.pfilters.Location : default_options.filters.Ages;
		$scope.filters.Boundarys = $scope.pfilters.hasOwnProperty('Boundarys') ? $scope.pfilters.Boundarys : default_options.filters.Boundarys;

		$scope.isCollapsed.NameOrId = $scope.pfilters.hasOwnProperty('NameOrId') ? false : ($scope.filters.NameOrId ? false : true);
		$scope.isCollapsed.Organization = $scope.pfilters.hasOwnProperty('Organization') ? false : _.every($scope.filters.Organizations, {checked: true});
		$scope.isCollapsed.Age = $scope.pfilters.hasOwnProperty('Ages') ? false :
		(($scope.filters.Ages.options.floor == $scope.filters.Ages.min &&  $scope.filters.Ages.options.ceil == $scope.filters.Ages.max) ? true : false);
		$scope.isCollapsed.Gender = $scope.pfilters.hasOwnProperty('Genders') ? false : _.every($scope.filters.Genders, {checked: true});
		$scope.isCollapsed.TagFeatures = $scope.pfilters.hasOwnProperty('TagFeatures') ? false : ($scope.filters.TagFeatures ? false : true);
		$scope.isCollapsed.Location = $scope.pfilters.hasOwnProperty('Location') ? false :
		(($scope.filters.Location.latitude && $scope.filters.Location.longitude && $scope.filters.Location.radius) ? false : true);
		$scope.isCollapsed.Boundarys = $scope.pfilters.hasOwnProperty('Boundarys') ? false : ($scope.filters.Boundarys.length ? false : true);
	}
	else{
		$scope.isCollapsed.NameOrId = $scope.filters.NameOrId ? false : true;
		$scope.isCollapsed.Organization = _.every($scope.filters.Organizations, {checked: true});
		$scope.isCollapsed.Age = (($scope.filters.Ages.options.floor == $scope.filters.Ages.min &&  $scope.filters.Ages.options.ceil == $scope.filters.Ages.max) ? true : false);
		$scope.isCollapsed.Gender = _.every($scope.filters.Genders, {checked: true});
		$scope.isCollapsed.TagFeatures = $scope.filters.TagFeatures ? false : true;
		$scope.isCollapsed.Location = ($scope.filters.Location.latitude && $scope.filters.Location.longitude && $scope.filters.Location.radius) ? false : true;
		$scope.isCollapsed.Boundarys = ($scope.filters.Boundarys.length ? false : true);
	}

	$scope.goto_lion = function(lion){
		$state.go('lion',{id: lion.id});
	};

	// Batch Mode
	$scope.is_modal_open = false;
	$scope.selection = { allSel: false, allUnSel: true };

	$scope.$on('BatchModeUpdated', function(event, args) {
		if(!$scope.isBatchMode){
			$scope.check_all(false);
		}
	});

	$scope.Selecteds = [];
	// Select All Lions
	$scope.check_all = function (val){
		if(val){
			_.forEach($scope.filtered_lions, function(lion) {
				lion.selected = val;
				if(lion.selected){
					if(!_.some($scope.Selecteds, lion))
						$scope.Selecteds.push(lion);
				}
			});
		}
		else{
			_.forEach($scope.lions, function(lion) {
				lion.selected = val;
			});
			$scope.Selecteds = [];
		}
		check_selects();
	};

	var lastSelId = -1;
	$scope.Select_Lion = function ($event, lion){
		var shiftKey = $event.shiftKey;
		if(shiftKey && lastSelId>=0){
			var index0 = _.findIndex($scope.ordered_lions, {'id': lastSelId});
			var index1 = _.findIndex($scope.ordered_lions, {'id': lion.id});
			var first = Math.min(index0, index1);
			var second = Math.max(index0, index1);
			for(var i = first; i <= second; i++){
				var animal = $scope.ordered_lions[i];
				animal.selected = lion.selected;
				if(lion.selected){
					if(!_.some($scope.Selecteds, animal))
						$scope.Selecteds.push(animal);
				}
				else
					$scope.Selecteds = _.without($scope.Selecteds, animal);
			}
		}
		else{
			lastSelId = lion.id;
			if(lion.selected){
				if(!_.some($scope.Selecteds, lion))
					$scope.Selecteds.push(lion);
			}
			else
				$scope.Selecteds = _.without($scope.Selecteds, lion);
		}
		check_selects();
	};
	// Check to Set Checkbox
	var check_selects = function (){
		$scope.selection.allSel = _.every($scope.ordered_lions, { selected: true });
		$scope.selection.allUnSel = _.every($scope.ordered_lions, { selected: false });
	};
	// ACTION AFTER BATCH UPDATE
	$scope.BatchUpdateLions = function (data){
		_.forEach($scope.Selecteds, function(sel){
			_.merge(sel,data);
		});
		set_all_lions($scope.lions, true);
	}
	// Batch Delete
	$scope.BatchDelete = function(type){
		$ModalPage({ metadata: {selected: $scope.Selecteds, type: 'lions'}},
		{
			templateUrl: 'delete.batch.tpl.html',
			controller: 'DeleteBatchCtrl',
			size: 'lg', backdrop  : 'static', keyboard: false,
			animation: true, transclude: true, replace: true
		})
		.then(function(response) {
			_.forEach($scope.Selecteds, function(item){
				_.remove($scope.lions, {id: item.id});
			});
			$scope.Selecteds = [];
			check_selects();
			set_all_lions($scope.lions);
		}, function (error) {
		});
	};
	// Batch Export
	$scope.exporting = false;
	$scope.BatchExport = function(type){
		var now = new Date();
		var date = now.getFullYear() + '-' + now.getMonth() + '-' + now.getDate();
		var ids = _.map($scope.Selecteds, 'id');
		$scope.exporting = true;
		LincServices.DataExport({'data': {'lions': ids}}).then(function(res_data){
			var blob = res_data.blob;
			var fileName = 'Data-Lions-'+ date + '-' + (res_data.fileName || "").substring(res_data.fileName.lastIndexOf('/')+1) || 'images.csv';
			saveAs(blob, fileName);
			$scope.exporting = false;
		},function(error){
			if($scope.debug || (error.status != 401 && error.status != 403)){
				NotificationFactory.error({
					title: "Fail: Data Export",
					message: "Unable to export lions data",
					position: 'right',
					duration: 5000
				});
			}
			$scope.exporting = false;
		});
	};
	// Label to Location Tag
	$scope.tag_location_label = function(tag_location){
		if (tag_location && tag_location.title && tag_location.value){
			var dist = (tag_location.value > 1000) ? ((tag_location.value/1000).toFixed(3).toString() + ' km') : (tag_location.value.toFixed(2).toString() + ' m');
			return (tag_location.title + ' : ' + dist);
		}
		else
			return null;
	};
	// Geographic Boundary Filters
	NgMap.getMap({id:'main'}).then(function(map) {
		$scope.map = map;
		$scope.Update_Boundarys();
	});

	$scope.Update_Boundarys = function(){
		$scope.Delete_Boundarys();
		if($scope.filters.Boundarys && $scope.filters.Boundarys.length)
			Create_Boundarys($scope.filters.Boundarys, $scope.map);
	};
	$scope.Delete_Boundarys = function(){
		_.forEach($scope.GeoBounds, function(bound){
			bound.overlay.setMap(null);
		});
		$scope.GeoBounds = [];
	};
	// Create a Boundarys
	var Create_Boundarys = function(dataBounds, map){
		_.forEach(dataBounds, function(data, index) {
			var overlay = null;
			if (data['selected']){
				if (data.type == 'polygon'){
					overlay = $scope.CreatePolygon({'path': data.path, 'map': map});
				}
				else if (data.type == 'circle'){ // EVENT TO MODE CIRCLE
					overlay = $scope.CreateCircle({'center': data.center, 'radius': data.radius, 'map': map});
				}
				else{
					overlay = $scope.CreateRectangle({'bounds': data.bounds, 'map': map})
				}
				var databound = {
					'type': data.type ,
					'overlay': overlay,
					'index': index,
					'selected': data['selected']
				};

				var jsts_pol = $scope.CreateJstsPol(overlay, data.type);
				$scope.GeoBounds.push({'databound': databound, 'overlay': overlay, 'jsts_pol': jsts_pol});
			}
		});
	};

	$scope.SetBoundarys = function(){
		var entities = _.reject($scope.filtered_lions,{'location': null});
		$ModalPage({ inputdata: {entities: entities, boundarys: $scope.filters.Boundarys}},
		{
			templateUrl: 'boundary.map.tpl.html',
			controller: 'BoundaryMapCtrl',
			controllerAs: 'vm', windowClass: 'Boundary-Modal',
			size: 'lg', backdrop  : 'static', keyboard: false,
			animation: true, transclude: true, replace: true
		})
		.then(function(response) {
			console.log(response);
			$scope.filters.Boundarys = response.boundarys;
			LincDataFactory.set_lions(lion_options);
			$scope.Update_Boundarys();
		}, function (error) {
			console.log(error);
		});
	};
	$scope.DialogDelete = function (boundary){
		var title = boundary.title;
		var modalScope = $scope.$new();
		modalScope.title = 'Delete "' + title + '"';
		modalScope.message = 'Are you sure you want to delete the "' + title + '" ?';
		var modalInstance = $uibModal.open({
			templateUrl: 'Dialog.Delete.tpl.html',
			scope: modalScope,
			backdrop: 'static',
			keyboard  : false
		});
		modalInstance.result.then(function (result) {
			_.remove($scope.filters.Boundarys, {'index': boundary.index});
			LincDataFactory.set_lions(lion_options);
		}, function(result){
		});
		modalScope.ok = function (){
			modalInstance.close();
		}
		modalScope.cancel = function(){
			modalInstance.dismiss();
		}
	};
}]);
