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

angular.module('linc.metadata.batch.controller', [])

.controller('MetadataBatchCtrl', ['$scope', '$sce', '$timeout', 'metadata', 'organizations', '$uibModalInstance',
  '$uibModal', 'LincServices', 'NotificationFactory', 'CONST_LIST', 'TAGS_CONST',
  function ($scope, $sce, $timeout, metadata, organizations, $uibModalInstance, $uibModal, LincServices,
  NotificationFactory, CONST_LIST, TAGS_CONST) {

	$scope.orderby = { reverse: false, predicate: 'id' };
	$scope.order = function(predicate) {
		$scope.orderby.reverse = ($scope.orderby.predicate === predicate) ? !$scope.orderby.reverse : false;
		$scope.orderby.predicate = predicate;
		$timeout(function () {
			$scope.$apply(function () {
				$scope.ResizeTable();
			});
		}, 0);
	};

	$scope.metadata = angular.copy(metadata);

	$scope.ChangeWarning = function (org_id){
		var org_ids = _.map(metadata.selected, 'organization_id', 'owner_organization_id')
		if(!org_ids.length)
			return;
		var org = org_ids.splice(org_ids.length-1);
		if(!_.difference(org_ids, org).length && org[0] == org_id)
			return;

		var organization = _.find($scope.organizations, {id: org_id});
		var type = ($scope.metadata.type == 'lions') ? 'Lions' : 'ImageSets';
		var modalScope = $scope.$new();
		modalScope.title = 'Warning';
		modalScope.message = 'This change transfers Ownership of Lion/Image Set, and can not be undone!<br>' +
		' Would you like to transfer ownership of these ' + type + ' to ' + organization.name + ' ?';
		var modalInstance = $uibModal.open({
			templateUrl: 'Warning.org.tpl.html',
			scope: modalScope
		});

		modalInstance.result.then(function (result) {

		}, function (){
			$scope.changed['owner_organization_id'] = false;
			$scope.changed['organization_id'] = false;
			$scope.selected['owner_organization_id'] = undefined;
			$scope.selected['owner_organization_id'] = undefined;
		});

		modalScope.ok = function (){
			modalInstance.close();
		};
		modalScope.cancel = function(){
			modalInstance.dismiss();
		};
	};

	// $scope.can_change_org = (metadata.type == 'lions') ? true : !_.some(metadata.selected, {is_primary: true});
	// var tooltxt = ((metadata.selected.length==1) ? "Can not change organization, selected is a primary image set" : 
	// 		"Can not change organization, there are selected primary imagesets") +
	// 		".<br>Do it in the Lion Metadata or View Lion Database (batch mode)";

	
	// $scope.tooltip = {
	// 	title: $sce.trustAsHtml(tooltxt),
	// 	checked: !$scope.can_change_org 
	// };

	$scope.title = (($scope.metadata.type == 'lions') ? 'Lion' : 'ImageSet') + ' - Batch Update';
	$scope.content = 'Form';
	$scope.TextCounts = 'Selected: ' + $scope.metadata.selected.length + ' ' + (($scope.metadata.type == 'lions') ? 'Lions' : 'ImageSets');
	$scope.dataloading = false;
	// Organizations
	$scope.organizations = organizations;
	// Gender List
	$scope.genders = CONST_LIST['GENDERS'];
	// Tags
	$scope.all_tags = {
		ear_marking : CONST_LIST['EAR_MARKING'], mouth_marking : CONST_LIST['MOUTH_MARKING'], 
		tail_marking : CONST_LIST['TAIL_MARKING'], eye_damage : CONST_LIST['EYE_DAMAGE'], 
		nose_color : CONST_LIST['NOSE_COLOUR'], broken_teeth : CONST_LIST['TEETH_BROKEN'], scars : CONST_LIST['SCARS']
	};
	// Cancel
	$scope.Cancel = function () {
		$uibModalInstance.dismiss('cancel');
	};

	$scope.changed = {
		organization_id: false, owner_organization_id: false, date_stamp: false, 
		date_of_birth: false, gender: false, is_dead: false, location: false, geopos_private: false,
		tags: false
	};

	$scope.selected = {
		organization_id: undefined, owner_organization_id: undefined, date_stamp: undefined, 
		date_of_birth: undefined, gender: undefined, is_dead: true, geopos_private: true, 
		location: {
			latitude: undefined, longitude: undefined, name: 'location',
			tag_location: {title: '', value: null, status: undefined, text: ''}
		},
		tags: {
			ear_marking: undefined, mouth_marking: undefined, nose_color: undefined, scars: undefined,
			broken_teeth: undefined, tail_marking: undefined, eye_damage: undefined
		}
	};
	var default_selected = angular.copy($scope.selected);
	// clean selection
	$scope.clear_selection = function(type){
		if(!$scope.changed[type])
			$scope.selected[type] = default_selected[type];
	};

	$scope.UpdateLocation = function(location){
		$scope.selected.location = location;
	};

	var tag_text = function(tag_location){
		if (tag_location && tag_location.status){
			var tag_text = tag_location.title;
			if(tag_location && tag_location.value){
				var dist = tag_location.value.toFixed(2).toString() + ' m';
				if(tag_location.value > 1000)
					dist = (tag_location.value/1000).toFixed(3).toString() + ' km';
				tag_text = tag_location.title + ' : ' + dist;
			}
			return tag_text;
		}
		else{
			return undefined;
		}
	};

	$scope.$watchGroup(['selected.location.tag_location.status','selected.location.tag_location.title', 'selected.location.tag_location.value'], function(newValues, oldValues, scope) {
	  $scope.selected.location.tag_location.text = tag_text($scope.selected.location.tag_location);
	});

	var imageset_outdata = function(){
		var updates = {};
		if($scope.changed['owner_organization_id'])
			updates['owner_organization_id'] = $scope.selected['owner_organization_id'];
		if(metadata.type === 'lions' && $scope.changed['organization_id'])
			updates['organization_id'] = $scope.selected['organization_id'];
		if($scope.changed['date_stamp'])
			updates['date_stamp'] = $scope.selected['date_stamp'];
		if($scope.changed['location']){
			var tag_location = !$scope.selected['location'].tag_location.status ? null : {
      			value: $scope.selected['location'].tag_location.value,
      			title: $scope.selected['location'].tag_location.title
    		};
			updates['latitude'] = $scope.selected['location'].latitude;
			updates['longitude'] = $scope.selected['location'].longitude;
			updates['tag_location'] = tag_location;
		}
		if($scope.changed['geopos_private'])
			updates['geopos_private'] = $scope.selected['geopos_private'];
		if($scope.changed['date_of_birth'])
			updates['date_of_birth'] = $scope.selected['date_of_birth'];
		if($scope.changed['gender'])
			updates['gender'] = $scope.selected['gender'];
		if($scope.changed['notes'])
			updates['notes'] = $scope.selected['notes'];
		var concat = [];
		if($scope.changed['tags']){
			//"EYE_DAMAGE_NONE", "EYE_DAMAGE_YES",
			var eye_dam = _.includes($scope.selected.tags.eye_damage,'NONE') ? ['EYE_DAMAGE_NONE'] : 
				_.intersection($scope.selected.tags.eye_damage,['EYE_DAMAGE_YES']);
			//"TEETH_BROKEN_CANINE_LEFT","TEETH_BROKEN_CANINE_RIGHT", "TEETH_BROKEN_INCISOR_LEFT", "TEETH_BROKEN_INCISOR_RIGHT","TEETH_BROKEN_NONE"
			var broken_teeth = _.includes($scope.selected.tags.broken_teeth,'NONE') ? ['TEETH_BROKEN_NONE'] : 
				_.intersection($scope.selected.tags.broken_teeth, TAGS_CONST['TEETH_BROKEN']);
			// "EAR_MARKING_BOTH","EAR_MARKING_LEFT","EAR_MARKING_NONE","EAR_MARKING_RIGHT",
			var ear_marking = _.includes($scope.selected.tags.ear_marking,'NONE') ? ['EAR_MARKING_NONE'] : 
				(_.isEmpty(_.difference(['EAR_MARKING_LEFT','EAR_MARKING_RIGHT'], $scope.selected.tags.ear_marking)) ? 
				["EAR_MARKING_BOTH"] : _.intersection($scope.selected.tags.ear_marking,['EAR_MARKING_LEFT','EAR_MARKING_RIGHT']));
			// "TAIL_MARKING_MISSING_TUFT_NONE","TAIL_MARKING_MISSING_TUFT_YES",
			var tail_marking = _.includes($scope.selected.tags.tail_marking,'NONE') ? ['TAIL_MARKING_MISSING_TUFT_NONE'] : 
				_.intersection($scope.selected.tags.tail_marking,['TAIL_MARKING_MISSING_TUFT_YES']);
			// "MOUTH_MARKING_NONE","MOUTH_MARKING_YES",
			var mouth_marking = _.includes($scope.selected.tags.mouth_marking,'NONE') ? ['MOUTH_MARKING_NONE'] : 
				_.intersection($scope.selected.tags.mouth_marking,['MOUTH_MARKING_YES']);
			// "NOSE_COLOUR_BLACK","NOSE_COLOUR_PATCHY","NOSE_COLOUR_PINK","NOSE_COLOUR_SPOTTED",
			var nose_color = [$scope.selected.tags.nose_color];
			// "SCARS_BODY_RIGHT","SCARS_FACE","SCARS_NONE",
			var scars = _.includes($scope.selected.tags.scars,'NONE') ? ['SCARS_NONE'] : 
				_.intersection($scope.selected.tags.scars,TAGS_CONST['SCARS']);
			var concat = _.concat(eye_dam, broken_teeth, ear_marking, tail_marking, mouth_marking, scars);
			if($scope.selected.tags.nose_color != undefined)
            	concat = _.concat(concat, nose_color);
            var TAGS = JSON.stringify(concat);
			updates['tags'] = TAGS;
		}
		return updates;
	};

	var lion_outdata = function(){
		var updates = {};
		if($scope.changed['organization_id'])
			updates['organization_id'] = $scope.selected['organization_id'];
		if($scope.changed['is_dead'])
			updates['dead'] = $scope.selected['is_dead'];

		return updates;
	};
	
	$scope.Submit = function(form) {
		$scope.submitted = true;
		$scope.dataloading = true;
		if(form.latitude.$error.limlatlng || form.longitude.$error.limlatlng){
			$scope.dataloading = false;
			return false;
		}
		if(form.$valid){
			$scope.dataloading = true;
			var data = [];
			if (metadata.type == 'lions'){
				var lion = lion_outdata()
				var imageset = imageset_outdata();
				var lions_ids = _.map(metadata.selected, 'id');
				var imageset_ids = _.map(metadata.selected, 'primary_image_set_id');
				if (!_.isEmpty(lion,true))
					data.push({type: 'lion', data: lion, ids: lions_ids});
				if (!_.isEmpty(imageset,true))
					data.push({type: 'imageset', data: imageset, ids: imageset_ids})
			}
			else{
				var imageset = imageset_outdata();
				var imageset_ids = _.map(metadata.selected, 'id');
				if (!_.isEmpty(imageset,true))
					data.push({type: 'imageset', data: imageset, ids: imageset_ids})
			}
			LincServices.BatchUpdate(data, function(result){
				NotificationFactory.success({
					title: 'Batch Update', 
					message: 'Data was successfully updated.',
					position: "right",
					duration: 3000
				});
				$uibModalInstance.close({data: _.merge(imageset, lion)});
			},function(error){
				if($scope.debug || (error.status != 401 && error.status != 403)){
					NotificationFactory.error({
						title: "Fail: Batch Update", 
						message: "Unable to update data",
						position: 'right',
						duration: 5000
					});
				}
				$uibModalInstance.dismiss();
			});
		}
	};

	$scope.ResizeTable = function(){
		var $table = $('table.batch'),
		$bodyCells = $table.find('tbody tr:first').children(),
		$headerCells = $table.find('thead tr:first').children();

		var col0Width = $bodyCells.map(function(i, v) {
			return v.offsetWidth;
		}).get();
		var colWidth = $headerCells.map(function(i, v) {
			return Math.max(v.offsetWidth, col0Width[i]);
		}).get();

		$bodyCells.each(function(i, v) {
			var min = Math.max(colWidth[i],30);
			$(v).css({'min-width': min + 'px'});
		});
		$headerCells.each(function(i, v) {
			var min = Math.max(colWidth[i],30);
			$(v).css({'min-width': min + 'px'});
		});
	};

	$(window).resize(function() {
		$scope.ResizeTable();
	}).resize();

}]);
