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

angular.module('linc.imageset.controller', [])

.controller('ImageSetCtrl', ['$scope', '$rootScope', '$q', '$state', '$timeout', '$uibModal', '$bsTooltip',
	'$interval', 'NotificationFactory', 'LincServices', 'AuthService', 'PollerService', 'organizations',
	'imageset', 'TAGS_CONST', 'TAGS_BY_TYPE',
	function ($scope, $rootScope, $q, $state, $timeout,$uibModal, $bsTooltip, $interval, NotificationFactory,
		LincServices, AuthService, PollerService, organizations, imageset, TAGS_CONST, TAGS_BY_TYPE) {

	$scope.modal_status = { is_open:  false };
	$scope.imageset = imageset;
	$scope.user = AuthService.user;

	$scope.ChangeStatus = $rootScope.ChangeStatus;

	var count = 0;
	var Poller = function () {
		PollerService.cvrequests_list().then(function(response){
			var cvrequests = response.data;
			var cvrequest = _.find(cvrequests, {'imageset_id': $scope.imageset.id});
			if(cvrequest && cvrequest.status == 'finished'){
				$scope.imageset.cvresults = cvrequest.cvres_obj_id;
				$scope.imageset.req_status = cvrequest.status;
				if($scope.imageset.cvresults){
					$scope.imageset.action = 'cvresults';
					$scope.$parent.cancel_Poller();
				}
			}
			count++;
			console.log('Req Count: ' + count + ' Still pendings');
		}, function(error){
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
				console.log("Result CV Req Poller started");
			});
		}, 0);
	};

	var LABELS = function (damage, labels){
		var label = "";
		labels.forEach(function (elem, i){
			label += damage[elem];
			if(i<labels.length-1) label += ', ';
		});
		return label;
	};

	var get_permissions = function (user,imageset){
		var permissions = {};
		var imageset_ismine  = user.organization_id == imageset.organization_id;
		var lion_ismy = user.organization_id == imageset.lions_org_id;
		var lion_exist= imageset.lion_id!=undefined ;

		permissions['canShow'] = (user.admin || imageset_ismine);
		permissions['canDisassociate'] = (!user.admin && (imageset_ismine && !imageset.is_primary && lion_exist && imageset.is_verified));
		permissions['NeedVerify'] = ((user.admin || (!imageset_ismine && lion_ismy)) && !imageset.is_primary && lion_exist);

		permissions['CanSetPrimary'] = (!imageset.is_primary && lion_exist && imageset.is_verified) &&
																	 (user.admin || (imageset_ismine && imageset.lions_org_id==user.organization_id));

		permissions['showGeoPos'] = (user.admin || imageset_ismine) || !imageset.geopos_private;
		permissions['canDelete'] = ((user.admin || imageset_ismine) && !imageset.is_primary);
		return permissions;
	};

	var Set_Tags = function(){
		$scope.permissions = get_permissions($scope.user, $scope.imageset);
		$scope.tooltip = {title:'', checked: false};
		if($scope.permissions.canShow && !$scope.permissions.canDelete){
			$scope.tooltip.title = 'This is primary image set <br> of the lion ' + $scope.imageset.lion_id +
			' - ' + $scope.imageset.name + '.<br>Delete the lion ' + $scope.imageset.name + '<br>to delete this image set.';
			$scope.tooltip.checked = true;
		}
		if(!$scope.imageset.is_primary){
			if($scope.imageset.lion_id){
				$scope.imageset["action"] = '';
			}
			else{
				if($scope.imageset.cvrequest && $scope.imageset.req_status == 'finished')
					$scope.imageset["action"] = 'cvresults';
				else if ($scope.imageset.cvrequest && $scope.imageset.req_status == 'error')
					$scope.imageset["action"] = 'error';
				else if($scope.imageset.cvrequest){
					$scope.imageset["action"] = 'cvpending';
					if($scope.permissions.canShow)
						start_Poller(0);
				}
				else
					$scope.imageset["action"] = 'cvrequest';
			}
		}
		else{
			$scope.imageset["action"] = '';
		}

		var TAGS = [];
		try{
			TAGS = JSON.parse($scope.imageset.tags);
		}catch(e){
			TAGS = $scope.imageset.tags.split(",");
		}
		$scope.imageset.eye_damage = LABELS(TAGS_BY_TYPE['EYE_DAMAGE'], _.intersection(TAGS, TAGS_CONST['EYE_DAMAGE']));
		$scope.imageset.broken_teet = LABELS(TAGS_BY_TYPE['TEETH_BROKEN'],_.intersection(TAGS, TAGS_CONST['TEETH_BROKEN']));
		$scope.imageset.ear_marking = LABELS(TAGS_BY_TYPE['EAR_MARKING'],_.intersection(TAGS, TAGS_CONST['EAR_MARKING']));
		$scope.imageset.mouth_marking =LABELS(TAGS_BY_TYPE['MOUTH_MARKING'],_.intersection(TAGS, TAGS_CONST['MOUTH_MARKING']));
		$scope.imageset.tail_marking = LABELS(TAGS_BY_TYPE['TAIL_MARKING_MISSING_TUFT'],_.intersection(TAGS, TAGS_CONST['TAIL_MARKING_MISSING_TUFT']));
		$scope.imageset.nose_color = LABELS(TAGS_BY_TYPE['NOSE_COLOUR'],_.intersection(TAGS, TAGS_CONST['NOSE_COLOUR']));
		$scope.imageset.scars = LABELS(TAGS_BY_TYPE['SCARS'],_.intersection(TAGS, TAGS_CONST['SCARS']));

		// Image Gallery
		$scope.gallery_options = {
			type: 'imageset',
			edit: 'edit',
			id: $scope.imageset.id,
			is_primary_imageset: $scope.imageset.is_primary,
			is_associated: ($scope.imageset.lion_id == null) ? false : true
		};
		// Location History
		var label = 'Image Set ' + $scope.imageset.id;
		var date = (new Date($scope.imageset.updated_at)).toLocaleDateString();
		var has_position = ($scope.imageset.longitude!=null && $scope.imageset.latitude!=null);
		var location = [{
			id: $scope.imageset.id,
			label: label,
			name: $scope.imageset.name,
			updated_at: date,
			date_stamp: $scope.imageset.date_stamp,
			longitude: $scope.imageset.longitude,
			latitude: $scope.imageset.latitude ,
			geopos_private: $scope.imageset.geopos_private,
			organization_id: $scope.imageset.organization_id
		}];

		$scope.location_options = {
			type: 'imageset',
			id: $scope.imageset.id,
			is_primary: $scope.imageset.is_primary,
			lion_id: $scope.imageset.lion_id,
			history: {
				count: has_position ? 1 : 0,
				locations: has_position ? location : []
			}
		};
		// Metadata Options
		$scope.metadata_options = { type: 'imageset', edit: 'edit', data: $scope.imageset};
		$scope.imageset.age = isNaN(parseInt($scope.imageset.age)) ? null : $scope.imageset.age;
		$scope.imageset.date_of_birth = date_format($scope.imageset.date_of_birth);
	};

	// Updated in Metadata
	$scope.update_imageset = function (data){
		_.merge($scope.imageset, $scope.imageset, data);
		$scope.imageset.organization = _.find(organizations, {'id': $scope.imageset.owner_organization_id}).name;
		$scope.imageset.organization_id = $scope.imageset.owner_organization_id;
		Set_Tags();
	};

	$scope.goto_lion = function (id){
		$state.go("lion", {'id': id});
	};

	$scope.location_goto = function (imageset_id){
		$state.go("imageset", {id: imageset_id});
	};

	$scope.DialogLionName = function (){
		var deferred = $q.defer();
		var scopeS = $scope.$new();
		scopeS.lion = {'name': ''};
		scopeS.title = 'Enter a New Lion Name';
		var modalS = $uibModal.open({
			templateUrl: 'lion.name.tpl.html',
			scope: scopeS,
			size: 'sm',
			keyboard  : false
		});
		modalS.result.then(function (result) {
			deferred.resolve(result);
		}, function(error){
			deferred.reject(error);
		});
		scopeS.Submit = function (lion){
			modalS.close({'lion': lion});
		};
		scopeS.cancel = function(){
			modalS.dismiss();
		};
		return deferred.promise;
	};

	$scope.SwitchLion = function(){
		$scope.DialogLionName()
		.then(function (result) {
			var data = {
				lion: {
					name : result.lion.name,
					organization_id: $scope.imageset.organization_id,
					dead : $scope.imageset.dead ? true : false,
					primary_image_set_id: $scope.imageset.id
				},
				imageset:{
					id: $scope.imageset.id,
				}
			};
			LincServices.SwitchLion(data, function(lion) {
				NotificationFactory.success({
					title: "Switch to New Lion", message:'The imageset was switched to the new lion',
					position: "right", // right, left, center
					duration: 3000     // milisecond
				});
				$scope.goto_lion(lion.id);
			}, function(error){
				console.log(error);
				NotificationFactory.error({
					title: "Error",
					message: 'Unable to switch this imageset to the new lion',
					position: 'right',
					duration: 5000
				});
			});
		}, function (error) {
			// Switch Canceled
			console.log('switch canceled');
		});
	};

	$scope.Delete = function (){
		var scopeDel = $scope.$new();
		scopeDel.title = 'Delete Image Set';
		scopeDel.message = 'Are you sure you want to delete the Image Set?';
		var message = {
			Sucess:'Image Set was successfully deleted.',
			Error: 'Unable to delete this Image Set.'
		};

		var modalDel = $uibModal.open({
				templateUrl: 'Dialog.Delete.tpl.html',
				scope: scopeDel
		});

		modalDel.result.then(function (result) {
			LincServices.DeleteImageSet($scope.imageset.id, function(results){
				NotificationFactory.success({
					title: scopeDel.title,
					message: message.Sucess,
					position: "right",
					duration: 2000
				});
				$rootScope.remove_history('imageset', $scope.imageset.id);
				$state.go("viewimagesets");
			},
			function(error){
				if($scope.debug || (error.status != 401 && error.status != 403)){
					NotificationFactory.error({
						title: "Fail: " + scopeDel.title,
						message: message.Error,
						position: 'right',
						duration: 5000
					});
				}
			});
		}, function () {
			console.log('Modal dismissed at: ' + new Date());
		});
		scopeDel.ok = function (){
			modalDel.close();
		}
		scopeDel.cancel = function(){
			modalDel.dismiss();
		}
	};

	$scope.CVReqSuccess = function (imageset_Id, requestObj) {
		$scope.imageset.action = 'cvpending';
		$scope.imageset.cvrequest = requestObj.obj_id;
		console.log('Success CV Request');
		start_Poller(1);
	};

	$scope.updateCVStatus = function(response){
		$scope.imageset = angular.copy(response.imageset);
		Set_Tags();
		start_Poller(1);
	};

	$scope.CVResultsErased = function (ImagesetId) {
		$scope.imageset.action = 'cvrequest';
		$scope.imageset.cvresults = null;
		$scope.imageset.cvrequest = null;
	};

	$scope.Disassociate = function (id){
		var data = {'lion_id': null, 'is_verified': false};
		LincServices.Associate(id, data, function(response){
			$scope.imageset.lion_id = null;
			$scope.imageset.name = '-';
			$scope.imageset.dead = false;
			$scope.imageset.lions_org_id = null;
			$scope.imageset.is_verified = false;
			Set_Tags();
			NotificationFactory.success({
				title: "Disassociate", message:'Lion was disassociated',
				position: "right", // right, left, center
				duration: 2000     // milisecond
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
	// Gallery Updated
	$scope.Reload_Page = function () {
		$state.go($state.current, {'id': $scope.imageset.id}, {reload: true});
		$rootScope.remove_history('imageset', $scope.imageset.id);
	};

	var date_format = function(data){
		if(data == null || data =="" || data =="-"){
			return "-";
		}
		if(data.length>10){
			return data.substring(0, 10);
		}
		else {
			return data;
		}
	};

	$scope.UpdateImageset = function(data, ImagesetId){
		var change = {'name': data.name, 'lion_id': data.lion_id,
		'is_verified': data.is_verified, 'lions_org_id': data.lions_org_id};
		_.merge($scope.imageset, $scope.imageset, change);
		Set_Tags();
	};

	$scope.Verify = function (imageset) {
		var scopeV = $scope.$new();
		scopeV.title = 'Verify Associated Image Set';
		scopeV.imageset = angular.copy(imageset);
		var modalV = $uibModal.open({
				templateUrl: 'verify_imageset.tpl.html',
				scope: scopeV
		});
		modalV.result.then(function (result) {
			if(result)
				$scope.Verify_Imageset(scopeV.imageset.id);
			else
				$scope.Disassociate(scopeV.imageset.id);
		},
		function (){
		});

		scopeV.cancel = function(){
			modalV.dismiss();
		}
		// Set Imageset Verified
		scopeV.ok = function (result) {
			modalV.close(result);
		};
	};

	$scope.Verify_Imageset = function (id) {
		var data = {"is_verified": true};
		LincServices.Verify(id, data, function(result){
			$scope.imageset.is_verified = true;
			Set_Tags();
			NotificationFactory.success({
				title: "Image Set", message:'Image Set has been marked as verified',
				position: "right", // right, left, center
				duration: 2000     // milisecond
			});
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

	$scope.SetPrimary = function (){
		var scopeSetP = $scope.$new();
		scopeSetP.title = 'Primary Image Set';
		scopeSetP.message = 'Do you want to set as Primary Image Set?';
		var message = {
			Sucess:'Imageset was successfully set as primary.',
			Error: 'Unable to set this Image Set as primary.'
		};

		var modalSetP = $uibModal.open({
				templateUrl: 'Dialog.Delete.tpl.html',
				scope: scopeSetP
		});

		modalSetP.result.then(function (result) {
			var data = {'primary_image_set_id': $scope.imageset.id};
			LincServices.SetPrimary($scope.imageset.lion_id, data, function(results){
				NotificationFactory.success({
					title: scopeSetP.title,
					message: message.Sucess,
					position: "right",
					duration: 2000
				});
				$scope.imageset.is_primary = true;
				imageset.is_primary = true; // garantee
				Set_Tags();
			},
			function(error){
				if($scope.debug || (error.status != 401 && error.status != 403)){
					NotificationFactory.error({
						title: "Fail: " + scopeSetP.title,
						message: message.Error,
						position: 'right',
						duration: 5000
					});
				}
			});
		}, function () {
			console.log('Modal dismissed at: ' + new Date());
		});
		scopeSetP.ok = function (){
			modalSetP.close();
		}
		scopeSetP.cancel = function(){
			modalSetP.dismiss();
		}
	};

	$scope.tag_label = function(tag_location){
		if (tag_location && tag_location.title && tag_location.value)
			return (tag_location.title + ' : ' +
				(tag_location.value > 1000) ?
				((tag_location.value/1000).toFixed(3).toString() + ' km') :
				(tag_location.value.toFixed(2).toString() + ' m'));
		else
			return null;
	};

	Set_Tags();

}])
;
