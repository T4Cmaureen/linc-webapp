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

angular.module('linc.lion.controller', [])

.controller('LionCtrl', ['$scope', '$rootScope', '$state', '$uibModal', '$bsTooltip', 'NotificationFactory', 'LincServices',
	'AuthService', 'organizations', 'lion', 'relatives', 'TAGS_CONST', 'TAGS_BY_TYPE',
	function ($scope, $rootScope, $state, $uibModal, $bsTooltip, NotificationFactory, LincServices,
	AuthService, organizations, lion, relatives, TAGS_CONST, TAGS_BY_TYPE) {

	$scope.orderby = {predicate: 'id_to', reserve: false};
	$scope.order = function(predicate) {
		$scope.orderby.reverse = ($scope.orderby.predicate === predicate) ? !$scope.orderby.reverse : false;
		$scope.orderby.predicate = predicate;
	};

	$scope.ChangeStatus = $rootScope.ChangeStatus;
	$scope.modal_status = { is_open:  false };
	$scope.lion = lion;
	$scope.relatives = relatives;

	$scope.user = AuthService.user;

	$scope.tooltip_need_verifiy = {'title': 'There are Image sets pending of verification', 'checked': true};

	var LABELS = function (damage, labels){
		var label = "";
		labels.forEach(function (elem, i){
			label += damage[elem];
			if(i<labels.length-1) label += ', ';
		});
		return label;
	}
	// Labels to Relatives
	$scope.Ralatives_Labels = {
		mother : 'Mother',
		suspected_father : 'Suspected Father',
		sibling : 'Sibling',
		associate : 'Associate',
		cub : 'Cub'
	};

	var get_permissions = function (user, lion){
		var permissions = {};
		var lion_ismine  = user.organization_id == lion.organization_id;

		permissions['canShow'] = (user.admin || lion_ismine);
		permissions['showGeoPos'] = (user.admin || lion_ismine) || !lion.geopos_private;
		return permissions;
	}
	var Set_Tags = function(){

		$scope.permissions = get_permissions($scope.user, $scope.lion);

		var TAGS = [];
		try{
			TAGS = JSON.parse($scope.lion.tags);
		}catch(e){
			TAGS = $scope.lion.tags.split(",");
		}
		$scope.lion.eye_damage = LABELS(TAGS_BY_TYPE['EYE_DAMAGE'], _.intersection(TAGS, TAGS_CONST['EYE_DAMAGE']));
		$scope.lion.broken_teet = LABELS(TAGS_BY_TYPE['TEETH_BROKEN'],_.intersection(TAGS, TAGS_CONST['TEETH_BROKEN']));
		$scope.lion.ear_marking = LABELS(TAGS_BY_TYPE['EAR_MARKING'],_.intersection(TAGS, TAGS_CONST['EAR_MARKING']));
		$scope.lion.mouth_marking =LABELS(TAGS_BY_TYPE['MOUTH_MARKING'], _.intersection(TAGS, TAGS_CONST['MOUTH_MARKING']));
		$scope.lion.tail_marking = LABELS(TAGS_BY_TYPE['TAIL_MARKING_MISSING_TUFT'],_.intersection(TAGS, TAGS_CONST['TAIL_MARKING_MISSING_TUFT']));
		$scope.lion.nose_color = LABELS(TAGS_BY_TYPE['NOSE_COLOUR'],_.intersection(TAGS, TAGS_CONST['NOSE_COLOUR']));
		$scope.lion.scars = LABELS(TAGS_BY_TYPE['SCARS'],_.intersection(TAGS, TAGS_CONST['SCARS']));
		// Metadata Options
		$scope.metadata_options = { type: 'lion', edit: 'edit', data: $scope.lion};
		// Image Gallery
		$scope.gallery_options = {
			type: 'lion',
			edit: 'edit',
			id: $scope.lion.primary_image_set_id,
			is_primary_imageset: true,
			is_associated: false
		};
		// Location History
		$scope.location_options = { type: 'lion', lion_id: $scope.lion.id};
		$scope.lion.age = isNaN(parseInt($scope.lion.age)) ? null : $scope.lion.age;
		$scope.lion.date_of_birth = date_format($scope.lion.date_of_birth);
		$scope.relatives_options = angular.copy(relatives);
	};

	// Updated in Metadata
	$scope.update_lion = function (data){
		_.merge($scope.lion, $scope.lion, data);
		$scope.lion.organization =  _.find(organizations, {id: $scope.lion.organization_id}).name;
		Set_Tags();
	}

	// Updated in Relatives
	$scope.update_relatives = function (data){
		$scope.relatives = angular.copy(data);
		Set_Tags();
	}

	$scope.location_goto = function (imageset_id){
		$state.go("imageset", {id: imageset_id});
	}
	$scope.goto_view_imagesets = function (){
		$state.go("viewimagesets", {filter: {NameOrId: '!'+lion.id}});
	}

	$scope.Delete = function (){

		var modalScope = $scope.$new();
		modalScope.title = 'Delete Lion';
		modalScope.message = 'Are you sure you want to delete the lion?';

		var message = {
			Sucess: 'Lions was successfully deleted.',
			Error: 'Unable to delete this Lion.'
		};

		var modalInstance = $uibModal.open({
				templateUrl: 'Dialog.Delete.tpl.html',
				scope: modalScope
		});

		modalInstance.result.then(function (result) {
			LincServices.DeleteLion($scope.lion.id, function(results){
				NotificationFactory.success({
					title: modalScope.title,
					message: message.Sucess,
					position: "right", // right, left, center
					duration: 2000     // milisecond
				});
				$rootScope.remove_history('lion', $scope.lion.id);
				$state.go("viewliondatabase");
			},
			function(error){
				if($scope.debug || (error.status != 401 && error.status != 403)){
					NotificationFactory.error({
						title: "Fail: "+ modalScope.title, message: message.Error,
						position: 'right', // right, left, center
						duration: 5000   // milisecond
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
	$scope.Disassociate = function (id){
		var data = {'lion_id': null};
		LincServices.Associate(id, data, function(response){
			$scope.lion.primary_image_set_id = null;
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
	$scope.Reload_Page = function () {
		$state.go($state.current, {'id': lion.id}, {reload: true});
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
