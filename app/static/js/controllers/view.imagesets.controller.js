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

angular.module('linc.view.imagesets.controller', [])

.controller('ViewImageSetsCtrl', ['$scope', '$rootScope', '$state', '$timeout', '$q', '$interval', '$uibModal',
  '$stateParams', 'NotificationFactory', 'LincServices', 'AuthService', 'PollerService',
  'imagesets_options', 'default_options', 'imagesets', '$ModalPage', 'NgMap', 'LincDataFactory', 'TAG_LABELS',
  'TOOL_TITLE', 'CONST_VIEWCOLUMNS', function ($scope, $rootScope, $state, $timeout, $q, $interval, $uibModal,
  $stateParams, NotificationFactory, LincServices, AuthService, PollerService, imagesets_options,
  default_options, imagesets, $ModalPage, NgMap, LincDataFactory, TAG_LABELS, TOOL_TITLE, CONST_VIEWCOLUMNS) {

	$scope.user = AuthService.user;
	$scope.$parent.isBatchMode = false;

	$scope.ChangeStatus = $rootScope.ChangeStatus;
	$scope.tooltip = { features: { title: 'tips: ' + TOOL_TITLE, checked: true} };

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
				if(cvrequest && cvrequest.status == 'finished'){
					imageset.cvresults = cvrequest.cvres_obj_id;
					imageset.req_status = cvrequest.status;
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

	var get_permissions = function (user,imageset){
		var permissions = {};
		var imageset_ismine  = user.organization_id == imageset.organization_id;
		var lion_ismy = user.organization_id == imageset.lions_org_id;
		var lion_exist= imageset.lion_id!=undefined ;

		permissions['canShow'] = (user.admin || imageset_ismine);
		permissions['canLocate'] = (!imageset.geopos_private || user.admin || imageset_ismine);
		permissions['ismine'] = (user.admin || imageset_ismine);

		permissions['canDisassociate'] = (!user.admin && (imageset_ismine && !imageset.is_primary && lion_exist && imageset.is_verified));
		permissions['NeedVerify'] = ((user.admin || (!imageset_ismine && lion_ismy)) && !imageset.is_primary && lion_exist);

		permissions['CanSetPrimary'] = (!imageset.is_primary && lion_exist && imageset.is_verified) &&
																	 (user.admin || imageset_ismine && imageset.lions_org_id==user.organization_id);
		return permissions;
	}

	var set_all_imagesets = function(sets, selected){

		$scope.imagesets = _.map(sets, function(element, index) {

			element['permissions'] = get_permissions($scope.user, element);
			element['age'] = isNaN(parseInt(element['age'])) ? null : element['age'];

			element['dead'] = (element['dead'] == undefined || element['dead'] == null) ? element['dead'] = false : element['dead'];

			var elem = {};
			if(!element.is_primary){
				if(element.lion_id){
					elem["action"] = '';
				}
				else{
					if(element.cvrequest && element.req_status == 'finished')
						elem["action"] = 'cvresults';
					else if (element.cvrequest && element.req_status == 'error')
						elem["action"] = 'error';
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
			elem['tooltip'] = {features: {title: tag_features, checked: true}};
			elem['features'] = (tag_features.length > 0) ? true : false;
			elem['tag_features'] = tag_features;
			elem['selected'] = (selected && _.has(element, 'selected') ? element['selected'] : false);

			elem['location'] = (!element['latitude'] || !element['longitude']) ? null : new google.maps.LatLng(element['latitude'], element['longitude']);
			//elem['location'] = new google.maps.LatLng(element['latitude'], element['longitude']);
			if (element['tag_location']){
				var circle = $scope.CreateCircle({'center': elem['location'], 'radius': element['tag_location']['value'] })
				elem['circle'] = $scope.CreateJstsPol(circle, 'circle');
			}

			return _.extend({}, element, elem);
		});
	};

	$scope.refreshSlider = function () {
		$timeout(function () {
			$scope.$broadcast('rzSliderForceRender');
		});
	};
	// Click in Photo - Show Big Image
	$scope.show_photo = function(url){
		if (!$scope.isBatchMode){
			var win = window.open(url, "_blank", "toolbar=yes, scrollbars=yes, resizable=yes, top=100, left=100, width=600, height=600");
			win.focus();
		}
	}
	$scope.refreshSlider();

	$scope.filters = imagesets_options.filters;
	$scope.isCollapsed = imagesets_options.isCollapsed;
	$scope.orderby = imagesets_options.orderby;

	$scope.ShowColumn = function(col){
		return $scope.columns ? _.includes($scope.columns, col) : false;
	};
	$scope.ColumnsSelect = function(){
		imagesets_options.Columns = $scope.columns;
		LincDataFactory.set_imagesets(imagesets_options);
	};

	if(!imagesets_options.Columns)
		imagesets_options.Columns = angular.copy(default_options.Columns);
	$scope.columns = imagesets_options.Columns;
	$scope.columns_to_view = CONST_VIEWCOLUMNS.columns.imagesets;

	$scope.change = function(type){
		imagesets_options.filters[type] = $scope.filters[type];
		LincDataFactory.set_imagesets(imagesets_options);
		if (type == 'Organizations'){
			$scope.check_orgs.status = _.every($scope.filters.Organizations, ['checked', false]) ? 0 :
				(_.every($scope.filters.Organizations, ['checked', true]) ? 1 : -1);
		}
	}

	// Click collapse
	$scope.collapse = function(type){
		imagesets_options.isCollapsed[type] = $scope.isCollapsed[type] = !$scope.isCollapsed[type];
		LincDataFactory.set_imagesets(imagesets_options);
	}

	$scope.order = function(predicate) {
		$scope.orderby.reverse = ($scope.orderby.predicate === predicate) ? !$scope.orderby.reverse : false;
		$scope.orderby.predicate = predicate;
		imagesets_options.orderby = $scope.orderby;
		LincDataFactory.set_imagesets(imagesets_options);
	};

	$scope.viewer_selected = function(){
		var label = "";
		if($scope.Selecteds.length == $scope.imagesets.length)
			label = "All " + $scope.Selecteds.length + " imagesets are selected";
		else if($scope.Selecteds.length){
			label = ($scope.Selecteds.length).toString();
			label += ($scope.Selecteds.length == 1 ) ? ' is selected' : ' are selected';
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

	$scope.updateCVStatus = function(response){
		var index = _.indexOf($scope.imagesets, _.find($scope.imagesets, {id: response.imageset.id}));
		$scope.imagesets[index] = angular.copy(response.imageset);
		set_all_imagesets($scope.imagesets);
		if(cvrequest_pendings.length)
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

	$scope.ViewTotal = 20;
	$scope.Paging = function(){
		$scope.ViewTotal += 10;
	};

	set_all_imagesets(imagesets);

	if(cvrequest_pendings.length)
		start_Poller(0);

	$scope.slider_options = { ceil: 32, floor: 0, onChange: function(){/*$scope.ChangeFilter('Ages');*/}};

	$scope.pfilters = $stateParams.filter ? $stateParams.filter : {};

	if(Object.keys($scope.pfilters).length){
		console.log('View Imagesets - has filter params');
		$scope.filters.NameOrId = $scope.pfilters.hasOwnProperty('NameOrId') ? $scope.pfilters.NameOrId : default_options.filters.NameOrId;
		$scope.filters.Organizations = $scope.pfilters.hasOwnProperty('Organizations') ? $scope.pfilters.Organizations : default_options.filters.Organizations;
		$scope.filters.Ages = $scope.pfilters.hasOwnProperty('Ages') ? $scope.pfilters.Ages : default_options.filters.Ages;
		$scope.filters.Genders = $scope.pfilters.hasOwnProperty('Genders') ? $scope.pfilters.Genders : default_options.filters.Genders;
		$scope.filters.TagFeatures = $scope.pfilters.hasOwnProperty('TagFeatures') ? $scope.pfilters.TagFeatures : default_options.filters.TagFeatures;
		$scope.filters.Primary = $scope.pfilters.hasOwnProperty('Primary') ? $scope.pfilters.Primary : default_options.filters.Primary;
		$scope.filters.Location = $scope.pfilters.hasOwnProperty('Location') ? $scope.pfilters.Location : default_options.filters.Ages;
		$scope.filters.Boundarys = $scope.pfilters.hasOwnProperty('Boundarys') ? $scope.pfilters.Boundarys : default_options.filters.Boundarys;

		$scope.isCollapsed.NameOrId = $scope.pfilters.hasOwnProperty('NameOrId') ? false : ($scope.filters.NameOrId ? false : true);
		$scope.isCollapsed.Organization = $scope.pfilters.hasOwnProperty('Organization') ? false : _.every($scope.filters.Organizations, {checked: true});
		$scope.isCollapsed.Age = $scope.pfilters.hasOwnProperty('Ages') ? false :
			(($scope.slider_options.floor == $scope.filters.Ages.min &&  $scope.slider_options.ceil == $scope.filters.Ages.max) ? true : false);
		$scope.isCollapsed.Gender = $scope.pfilters.hasOwnProperty('Genders') ? false : _.every($scope.filters.Genders, {checked: true});
		$scope.isCollapsed.TagFeatures = $scope.pfilters.hasOwnProperty('TagFeatures') ? false : ($scope.filters.TagFeatures ? false : true);
		$scope.isCollapsed.Primary = $scope.pfilters.hasOwnProperty('Primary') ? false : _.every($scope.filters.Primary, {checked: true});
		$scope.isCollapsed.Location = $scope.pfilters.hasOwnProperty('Location') ? false :
			(($scope.filters.Location.latitude && $scope.filters.Location.longitude && $scope.filters.Location.radius) ? false : true);
		$scope.isCollapsed.Boundarys = $scope.pfilters.hasOwnProperty('Boundarys') ? false : ($scope.filters.Boundarys.length ? false : true);
	}
	else{
		$scope.isCollapsed.NameOrId = $scope.filters.NameOrId ? false : true;
		$scope.isCollapsed.Organization = _.every($scope.filters.Organizations, {checked: true});
		$scope.isCollapsed.Age = (($scope.slider_options.floor == $scope.filters.Ages.min &&  $scope.slider_options.ceil == $scope.filters.Ages.max) ? true : false);
		$scope.isCollapsed.Gender = _.every($scope.filters.Genders, {checked: true});
		$scope.isCollapsed.TagFeatures = $scope.filters.TagFeatures ? false : true;
		$scope.isCollapsed.Primary = _.every($scope.filters.Primary, {checked: true});
		$scope.isCollapsed.Location = ($scope.filters.Location.latitude && $scope.filters.Location.longitude && $scope.filters.Location.radius) ? false : true;
		$scope.isCollapsed.Boundarys = ($scope.filters.Boundarys.length ? false : true);
	}

	var Set_Tags = function(element){
		element.permissions.canShow = ($scope.user.admin || $scope.user.organization_id == element.organization_id);
		element.permissions.NeedVerify = (!element.is_primary && element.lion_id &&
			($scope.user.organization_id == element.lions_org_id) &&
			($scope.user.organization_id != element.organization_id));
	};

	$scope.goto_imageset = function(imageset){
		if (!$scope.isBatchMode)
			$state.go('imageset',{id: imageset.id});
	};

	// Batch Mode
	$scope.canNotDelete = false; // Primary Imagesets can only be deleted in the lion's profile
	$scope.modal_status = { is_open:  false };
	$scope.selection = { allSel: false, allUnSel: true };

	$scope.$on('BatchModeUpdated', function(event, args) {
		if(!$scope.isBatchMode){
			$scope.check_all(false);
		}
	});

	$scope.Selecteds = [];
	// Select All Imagesets
	$scope.check_all = function (val){
		if(val){
			_.forEach($scope.filtered_image_sets, function(imageset) {
				imageset.selected = val;
				if(imageset.selected){
					if(!_.some($scope.Selecteds, imageset))
						$scope.Selecteds.push(imageset);
				}
			});
		}
		else{
			_.forEach($scope.imagesets, function(imageset) {
				imageset.selected = val;
			});
			$scope.Selecteds = [];
		}
		check_selects();
	};

	var lastSelId = -1;
	$scope.Select_Imageset = function ($event, imageset){
		var shiftKey = $event.shiftKey;
		if(shiftKey && lastSelId>=0){
			var index0 = _.findIndex($scope.ordered_image_sets, {'id': lastSelId});
			var index1 = _.findIndex($scope.ordered_image_sets, {'id': imageset.id});
			var first = Math.min(index0, index1);
			var second = Math.max(index0, index1);
			for(var i = first; i <= second; i++){
				var img = $scope.ordered_image_sets[i];
				img.selected = imageset.selected;
				if(imageset.selected){
					if(!_.some($scope.Selecteds, img))
						$scope.Selecteds.push(img);
				}
				else
					$scope.Selecteds = _.without($scope.Selecteds, img);
			}
		}
		else{
			lastSelId = imageset.id;
			if(imageset.selected){
				if(!_.some($scope.Selecteds, imageset))
					$scope.Selecteds.push(imageset);
			}
			else
				$scope.Selecteds = _.without($scope.Selecteds, imageset);
		}
		check_selects();
	};
	// Check to Set Checkbox
	var check_selects = function (){
		$scope.selection.allSel = _.every($scope.ordered_image_sets, {selected: true});
		$scope.selection.allUnSel = _.every($scope.ordered_image_sets, {selected: false});
		$scope.canNotDelete = (_.filter($scope.ordered_image_sets, {'selected': true, 'is_primary' : true})).length > 0;
	};
	// ACTION AFTER BATCH UPDATE
	$scope.BatchUpdateImageset = function (data){
		_.forEach($scope.Selecteds, function(sel){
			_.merge(sel,data);
		});
		set_all_imagesets($scope.imagesets, true);
	}
	// Batch Delete
	$scope.BatchDelete = function(type){
		$ModalPage({ metadata: {selected: $scope.Selecteds, type: 'imagesets'}},
		{
			templateUrl: 'delete.batch.tpl.html',
			controller: 'DeleteBatchCtrl',
			size: 'lg', backdrop  : 'static', keyboard: false,
			animation: true, transclude: true, replace: true
		})
		.then(function(response) {
			_.forEach($scope.Selecteds, function(item){
				_.remove($scope.imagesets, {id: item.id});
			});
			$scope.Selecteds = [];
			check_selects();
			set_all_imagesets($scope.imagesets);
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
		console.log('selecteds count: %s', ids.length);
		LincServices.DataExport({'data': {'imagesets': ids}}).then(function(res_data){
			var blob = res_data.blob;
			var fileName = 'Data-Imagesets-'+ date + '-' + (res_data.fileName || "").substring(res_data.fileName.lastIndexOf('/')+1) || 'images.csv';
			saveAs(blob, fileName);
			$scope.exporting = false;
		},function(error){
			if($scope.debug || (error.status != 401 && error.status != 403)){
				NotificationFactory.error({
					title: "Fail: Data Export",
					message: "Unable to export imagesets data",
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
		var entities = _.reject($scope.filtered_image_sets,{'location': null});
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
			LincDataFactory.set_imagesets(imagesets_options);
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
			LincDataFactory.set_imagesets(imagesets_options);
			$scope.Update_Boundarys();
		}, function(result){
		});
		modalScope.ok = function (){
			modalInstance.close();
		}
		modalScope.cancel = function(){
			modalInstance.dismiss();
		}
	};
	// Check Organizations
	$scope.check_orgs = { status: 0 };
	$scope.checkAllOrgs = function(status){
		// var status = $scope.check_orgs.status;
        if (status != -1){
            _.map($scope.filters.Organizations, function(org){
				org.checked = status ? true : false;
            });
        }
        $scope.check_orgs.status = status;
    };
	$scope.check_orgs.status = _.every($scope.filters.Organizations, ['checked', false]) ? 0 :
        (_.every($scope.filters.Organizations, ['checked', true]) ? 1 : -1);
}]);
