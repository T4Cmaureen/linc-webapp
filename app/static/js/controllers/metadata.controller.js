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

angular.module('linc.metadata.controller', [])

.controller('MetadataCtrl', ['$scope', '$window', 'AuthService', '$uibModal', '$uibModalInstance', '$bsTooltip', 
	'LincServices', 'NotificationFactory', 'optionsSet', '$state', '$q', 'organizations', 'CONST_LIST', 'TAGS_CONST', 
	function ($scope, $window, AuthService, $uibModal, $uibModalInstance, $bsTooltip, LincServices, NotificationFactory, 
	optionsSet, $state, $q, organizations, CONST_LIST, TAGS_CONST) {

	var vm = this;
	if(!AuthService.user) return;
	$scope.optionsSet = optionsSet;
	$scope.user = AuthService.user;

	$scope.modal_status = { is_open:  false };

	// Gender List
	$scope.genders = CONST_LIST['GENDERS'];
	
	$scope.tags = {
		ear_marking : CONST_LIST['EAR_MARKING'],
		mouth_marking : CONST_LIST['MOUTH_MARKING'],
		tail_marking : CONST_LIST['TAIL_MARKING'],
		eye_damage : CONST_LIST['EYE_DAMAGE'],
		nose_color : CONST_LIST['NOSE_COLOUR'],
		broken_teeth : CONST_LIST['TEETH_BROKEN'],
		scars : CONST_LIST['SCARS']
	};

	$scope.organizations = organizations;
	var titles = {}; titles['lion'] = 'Metadata'; titles['imageset'] = 'Metadata';
	$scope.isLion = (optionsSet.type === 'lion');
	$scope.isNew = (optionsSet.edit === 'new');
	$scope.lion_required = (optionsSet.type === 'lion');
	// Title
	$scope.title = titles[optionsSet.type];
	$scope.content = 'Form';
	$scope.Editable = ($scope.user.admin || (optionsSet.edit === 'edit' && optionsSet.data && $scope.user.organization_id === optionsSet.data.organization_id));
	$scope.Editable2 = !(optionsSet.edit === 'edit' && optionsSet.type === 'imageset' && optionsSet.data.is_primary);
	$scope.Editable3 = $scope.isLion;
	// Associate
	$scope.lion_association = {'show': false, 'label': 'Associate'};
	$scope.set_lion_list = function(val){
		$scope.selected.new_lion = undefined;
		$scope.ListLions = [];
		$scope.lion_association.label = 'Wait. Loading...'
		LincServices.Lions().then(function(lions){
			console.log("loaded");
			_.forEach(lions, function(lion, index) {
				var label = '<span>' + lion.id + ' - ' + lion.name;
				var icon='';
				if(lion.dead)
					icon = '<i class="lion-list-icon-dead"></i>';
				label += icon;
				var choice = icon + '<span>' +lion.id + ' - ' + lion.name  + '&nbsp &nbsp(<small>' + lion.organization + '</small>)</span>';
				$scope.ListLions.push({
					'index': index, 
					'id': lion.id, 
					'name': lion.name, 
					'label': label,
					'choice' : choice,
					'organization_id': lion.organization_id
				});
			});
			$scope.lion_association.show = val;
		});
	};

	$scope.Cancel = function () {
	 $uibModalInstance.dismiss('cancel');
	};

	$scope.submitted = false;
	$scope.interacted = function(field) {
		return $scope.submitted && field.$dirty;
	};

	$scope.submit = function(form) {
		console.log(vm);
		console.log(vm.form);
		$scope.submitted = true;
		if(!form.$valid)
			return false;
		if(form.latitude.$error.limlatlng || form.longitude.$error.limlatlng)
			return false;
		return true;
	};

	$scope.ChangeWarning = function ($event){
		if($scope.isNew) {
			//$event.stopPropagation();
			//$event.preventDefault();
			return;
		}
		var org = _.find($scope.organizations, {'id': $scope.selected.organization_id});
		var type = optionsSet.type == 'lion' ? 'Lion' : 'ImageSet';
		var modalScope = $scope.$new();
		modalScope.title = 'Warning';
		modalScope.message = 'This change transfers Ownership of Lion/Image Set, and can not be undone!' +
		'Would you like to transfer ownership of this ' + type + ' to ' + org.name + ' ?';
		var modalInstance = $uibModal.open({
				templateUrl: 'Warning.tpl.html',
				scope: modalScope
		});

		modalInstance.result.then(function (result) {
			
		}, function (){
			$scope.selected.organization_id = original_data.organization_id;
			$scope.selected.owner_organization_id = original_data.organization_id;
		});

		modalScope.ok = function (){
			modalInstance.close();
		};
		modalScope.cancel = function(){
			modalInstance.dismiss();
		};
	};

	$scope.UpdateLocation = function(location){
		$scope.selected.latitude = location.latitude;
		$scope.selected.longitude = location.longitude;
		$scope.selected.tag_location.status = location.tag_location.status;
		$scope.selected.tag_location.title = location.tag_location.title;
		$scope.selected.tag_location.value = location.tag_location.value;
	};

	var Metadata = function() {
		var selected = $scope.selected;

		var eye_dam = _.includes(selected.eye_damage,'NONE') ? ['EYE_DAMAGE_NONE'] : _.intersection(selected.eye_damage,['EYE_DAMAGE_YES']);

		var broken_teeth = _.includes(selected.broken_teeth,'NONE') ? ['TEETH_BROKEN_NONE'] : _.intersection(selected.broken_teeth, TAGS_CONST['TEETH_BROKEN']);
		var ear_marking = _.includes(selected.ear_marking,'NONE') ? ['EAR_MARKING_NONE'] : (_.isEmpty(_.difference(['EAR_MARKING_LEFT','EAR_MARKING_RIGHT'], selected.ear_marking)) ? ["EAR_MARKING_BOTH"] : _.intersection(selected.ear_marking,['EAR_MARKING_LEFT','EAR_MARKING_RIGHT']));
		 
		var mouth_marking = _.includes(selected.mouth_marking,'NONE') ? ['MOUTH_MARKING_NONE'] : _.intersection(selected.mouth_marking,['MOUTH_MARKING_YES']);
		var tail_marking = _.includes(selected.tail_marking,'NONE') ? ['TAIL_MARKING_MISSING_TUFT_NONE'] : _.intersection(selected.tail_marking,['TAIL_MARKING_MISSING_TUFT_YES']);
		var scars = _.includes(selected.scars,'NONE')? ['SCARS_NONE'] : _.intersection(selected.scars,TAGS_CONST['SCARS']);

		var concat = _.concat(eye_dam, broken_teeth, ear_marking, tail_marking, mouth_marking, scars);
		if(selected.nose_color != undefined)
			concat = _.concat(concat, selected.nose_color);

		var TAGS = JSON.stringify(concat);

		if(typeof selected.latitude === 'string')
			selected.latitude = selected.latitude.replace(",",".");
		if(typeof selected.longitude === 'string')
			selected.longitude = selected.longitude.replace(",",".");

		var tag_location = !$scope.selected.tag_location.status ? null : {
			value: $scope.selected.tag_location.value,
			title: $scope.selected.tag_location.title, 
		};

		var data = {};
		if(optionsSet.edit === 'new'){
			if(optionsSet.type === 'lion'){
				var imageset_data = {
					date_stamp: (selected.date_stamp == null || selected.date_stamp == '') ? null : selected.date_stamp.toISOString().slice(0,10),
					gender: selected.gender,
					date_of_birth: (selected.date_of_birth == null || selected.date_of_birth == '') ? null: selected.date_of_birth.toISOString().slice(0,10),
					latitude: isNaN(parseFloat(selected.latitude)) ? null : parseFloat(selected.latitude),
					longitude: isNaN(parseFloat(selected.longitude)) ? null : parseFloat(selected.longitude),
					tag_location: tag_location,
					tags: TAGS == "null" ? null: TAGS ,
					notes: selected.notes,
					geopos_private: selected.isPrivate,
					owner_organization_id: selected.organization_id,
					// Fixed
					lion_id: null,
					main_image_id: null,
					uploading_user_id: selected.uploading_user_id,
					uploading_organization_id: selected.organization_id,
					is_primary: true,
					is_verified: true
				};
				var lion_data = {
					name: selected.name,
					organization_id: selected.organization_id,
					primary_image_set_id: '',
					dead: selected.isDead
				};
				data = {lion: lion_data, imageset: imageset_data};
			}
			else{
				var imageset_data = {
					date_stamp: (selected.date_stamp == null || selected.date_stamp == '') ? null : selected.date_stamp.toISOString().slice(0,10),
					gender: selected.gender,
					date_of_birth: (selected.date_of_birth == null || selected.date_of_birth == '') ? null: selected.date_of_birth.toISOString().slice(0,10),
					latitude: isNaN(parseFloat(selected.latitude)) ? null : parseFloat(selected.latitude),
					longitude: isNaN(parseFloat(selected.longitude)) ? null : parseFloat(selected.longitude),
					tag_location: tag_location,
					tags: TAGS == "null" ? null : TAGS,
					notes: selected.notes,
					geopos_private: selected.isPrivate,
					owner_organization_id: selected.owner_organization_id,
					// Fixed
					lion_id: null,
					main_image_id: null,
					uploading_user_id: selected.uploading_user_id,
					uploading_organization_id: selected.organization_id,
					is_primary: null,
					is_verified: false
				};
				data = imageset_data;
			}
		}
		else{
			var date_stamp = (selected.date_stamp == null || selected.date_stamp == '') ? "" : selected.date_stamp.toISOString().slice(0,10);
			var date_of_birth = (selected.date_of_birth == null || selected.date_of_birth == '') ? "" : selected.date_of_birth.toISOString().slice(0,10);
			if(optionsSet.type === 'lion'){
				//Selected Dates
				var lion_sel_data = { 
					name : selected.name,
					organization_id: selected.organization_id,
					dead : selected.isDead
				};
				var imageset_sel_data = {
					date_stamp: date_stamp,
					gender: selected.gender,
					date_of_birth: date_of_birth,
					latitude: isNaN(parseFloat(selected.latitude)) ? '' : parseFloat(selected.latitude),
					longitude: isNaN(parseFloat(selected.longitude)) ? '' : parseFloat(selected.longitude),
					tag_location: tag_location,
					tags: TAGS,
					notes: selected.notes,
					geopos_private: selected.isPrivate,
					owner_organization_id: selected.organization_id          
				};
				var lion_data = _.reduce(lion_sel_data, function(result, n, key) {
					if (lion_sel_data.hasOwnProperty(key) && (lion_sel_data[key] != original_data[key])) {
							result[key] = lion_sel_data[key];
					}
					return result;
				}, {});

				var imageset_data = _.reduce(imageset_sel_data, function(result, n, key) {
					if (imageset_sel_data.hasOwnProperty(key) && (imageset_sel_data[key] != original_data[key])) {
							result[key] = imageset_sel_data[key];
					}
					return result;
				}, {});

				if(imageset_data.hasOwnProperty('date_stamp') && imageset_data['date_stamp'] == '')
					imageset_data['date_stamp'] = null;
				if(imageset_data.hasOwnProperty('date_of_birth') && imageset_data['date_of_birth'] == '')
					imageset_data['date_of_birth'] = null;
				if(imageset_data.hasOwnProperty('latitude') && imageset_data['latitude'] == '')
					imageset_data['latitude'] = null;
				if(imageset_data.hasOwnProperty('longitude') && imageset_data['longitude'] == '')
					imageset_data['longitude'] = null;
				if(_.intersection(_.keys(imageset_data),['longitude','latitude']).length==1){
					if(_.includes(_.keys(imageset_data),'longitude')){
						imageset_data['latitude'] = original_data['latitude'];
					}
					else if(_.includes(_.keys(imageset_data),'latitude')){
						imageset_data['longitude'] = original_data['longitude'];
					}
				}
				if(imageset_data.hasOwnProperty('tags') && imageset_data['tags'] == 'null')
					imageset_data['tags'] = null;

				if(Object.keys(lion_data).length || Object.keys(imageset_data).length)
					data = {"lion": lion_data, "imageset": imageset_data, 'imagesetId': original_data.primary_image_set_id};
			}
			else{
				var sel_data = {
					date_stamp: date_stamp,
					gender: selected.gender,
					date_of_birth: date_of_birth,
					latitude: isNaN(parseFloat(selected.latitude)) ? '' : parseFloat(selected.latitude),
					longitude: isNaN(parseFloat(selected.longitude)) ? '' : parseFloat(selected.longitude),
					tag_location: tag_location,
					tags: TAGS, 
					notes: selected.notes,
					geopos_private: selected.isPrivate,
					owner_organization_id: selected.owner_organization_id
				};

				sel_data.lion_id = selected.lion_id ? selected.lion_id : ($scope.selected.new_lion == undefined ? null : $scope.selected.new_lion.id);     
				sel_data.name = selected.lion_id ? selected.name : ($scope.selected.new_lion == undefined ? '-' : $scope.selected.new_lion.name);

				if(!original_data.lion_id && sel_data.lion_id){
					if($scope.selected.new_lion.organization_id==optionsSet.data.organization_id)
						sel_data.is_verified = true;
				}

				var imageset_data = _.reduce(sel_data, function(result, n, key) {
					if (sel_data.hasOwnProperty(key) && (sel_data[key] != original_data[key])) {
							result[key] = sel_data[key];
					}
					return result;
				}, {});

				if(imageset_data.hasOwnProperty('date_stamp') && imageset_data['date_stamp'] == '')
					imageset_data['date_stamp'] = null;
				if(imageset_data.hasOwnProperty('date_of_birth') && imageset_data['date_of_birth'] == '')
					imageset_data['date_of_birth'] = null;
				if(imageset_data.hasOwnProperty('latitude') && imageset_data['latitude'] == '')
					imageset_data['latitude'] = null;
				if(imageset_data.hasOwnProperty('longitude') && imageset_data['longitude'] == '')
					imageset_data['longitude'] = null;
				if(_.intersection(_.keys(imageset_data),['longitude','latitude']).length==1){
					if(_.includes(_.keys(imageset_data),'longitude')){
						imageset_data['latitude'] = original_data['latitude'];
					}
					else if(_.includes(_.keys(imageset_data),'latitude')){
						imageset_data['longitude'] = original_data['longitude'];
					}
				}
				if(imageset_data.hasOwnProperty('tags') && imageset_data['tags'] == 'null')
					imageset_data['tags'] = null;

				if(Object.keys(imageset_data).length)
					data = imageset_data;
			}
		}
		return data;
	};

	// Call LincServices to Save
	var Save_Metadata = function (data){
		var deferred = $q.defer();
		if(optionsSet.type === 'lion'){
			var id = optionsSet.data.id;
			LincServices.SaveLion(id, data, function(results){
				var data0 = _.merge({}, data.imageset, data.lion);
				delete data0._xsrf;
				if(data0.hasOwnProperty('date_of_birth'))
					data0.age = getAge(data0['date_of_birth']);
				deferred.resolve({type: 'save', 'data': data0, 'title': 'Save', 'message': "Lion's Metadata saved with success"});
			},
			function(error){
				deferred.reject({'error': error, 'title': 'Error', 'message': "Unable to Save Lion's Metadata"});
			});
		}
		else{
			var id = optionsSet.data.id;
			LincServices.SaveImageset(id, data, function(results){
				delete data._xsrf;
				if(data.hasOwnProperty('date_of_birth'))
					data.age = getAge(data['date_of_birth']);
				deferred.resolve({type: 'save', 'data': data, 'title': 'Save', 'message': "Image Set's Metadata saved with success"});
			},
			function(error){
				deferred.reject({'error': error, 'title': 'Error', 'message': "Unable to Save Image Set's Metadata"});
			});
		}
		return deferred.promise;
	};

	// Call LincServices to Create
	var Create_Metadata = function (data){
		var deferred = $q.defer();
		if(optionsSet.type === 'lion'){
			LincServices.CreateLion(data, function(results){
				var data0 = results.data.data;
				if(data0.hasOwnProperty('date_of_birth'))
					data0.age = getAge(data0['date_of_birth']);
				deferred.resolve({type: 'create', 'data': data0, 'title': 'Create', 'message': "Lion's Metadata created with success"});
			},
			function(error){
				deferred.reject(error);
			});
		}
		else{
			LincServices.CreateImageset(data, function(results){
				var data0 = results.data.data;
				if(data0.hasOwnProperty('date_of_birth'))
					data0.age = getAge(data0['date_of_birth']);
				deferred.resolve({type: 'create', 'data': data0, 'title': 'Create', 'message': "Image Set's Metadata created with success"});
			},
			function(error){
				deferred.reject(error);
			});
		}
		return deferred.promise;
	};

	// Save Metadata
	$scope.SaveMetadata = function(){
		var data = Metadata();
		if(!Object.keys(data).length){
			NotificationFactory.warning({
				title: "Warning", message: "There is no change in the data",
				position: "right", // right, left, center
				duration: 2000     // milisecond
			});
		}
		else{
			Save_Metadata(data).then(function(result) {
				NotificationFactory.success({
					title: result.title, message: result.message,
					position: "right", // right, left, center
					duration: 2000     // milisecond
				});
				$uibModalInstance.close({'data': result.data});
			},
			function(result){
				if($scope.debug || (result.error.status != 401 && result.error.status != 403)){
					NotificationFactory.error({
						title: result.title, message: result.message,
						position: 'right', // right, left, center
						duration: 5000   // milisecond
					});
				}
				//$uibModalInstance.dismiss("error");
			});
		}
	};

	// Create New and Clsoe
	$scope.CreateClose = function(){
		var data = Metadata();
		Create_Metadata(data).then(function(result) {
			NotificationFactory.success({
				title: result.title, message: result.message,
				position: "right", // right, left, center
				duration: 2000     // milisecond
			});
			$uibModalInstance.close({'id': result.data.id});
		},
		function(error){
			if($scope.debug || (error.status != 401 && error.status != 403)){
				NotificationFactory.error({
					title: 'Error', 
					message: error.data.message,
					position: 'right', // right, left, center
					duration: 5000   // milisecond
				});
			}
		});
	};

	// Create New and Upload
	$scope.CreateUpload = function(){
		var deferred = $q.defer();
		var data = Metadata();
		Create_Metadata(data).then(function(result) {
			NotificationFactory.success({
				title: result.title, message: result.message,
				position: "right", // right, left, center
				duration: 2000     // milisecond
			});
			$scope.Id = result.data.id;
			$scope.Object_Created({'id': result.data.id});
			if(optionsSet.type === 'lion'){
				deferred.resolve({'imagesetId': result.data.primary_image_set_id});
			}
			else {
				deferred.resolve({'imagesetId': result.data.id});
			}
		},
		function(error){
			if($scope.debug || (error.status != 401 && error.status != 403)){
				NotificationFactory.error({
					title: 'Error', 
					message: error.data.message,
					position: 'right', // right, left, center
					duration: 5000   // milisecond
				});
			}
			deferred.reject({message: error.data.message});
		});
		return deferred.promise;
	};

	$scope.Close = function(){
		if($scope.Id){
			$uibModalInstance.close({'id': $scope.Id});
		}
		else{
			$uibModalInstance.dismiss('cancel');
		}
	};

	var local_date = function(data){
		function isValidDate(d) {
			if ( Object.prototype.toString.call(d) !== "[object Date]" )
				return false;
			return !isNaN(d.getTime());
		}
		if(data == null || data =="" || data =="-"){
			return null;
		}
		if((typeof data === 'date' || data instanceof Date) && isValidDate(data)){
			return data;
		}
		else{
			if(typeof data === 'string' || data instanceof String){
				var val = data;
				if(data.length>10){
					val = data.substring(0, 10) + 'T' + data.substring(11, data.length) + 'Z';
				}
				return new Date(Date.parse(val));
			}
			else return null;
		}
	};
 
	var original_data = angular.copy(optionsSet.data);

	$scope.tooltip = {
		lion_page: {title: '', checked: false},
		organization: {title: '', checked: false}
	};

	if(optionsSet.edit == 'edit'){
		original_data.latitude = (original_data.latitude == null) ? '' : original_data.latitude;
		original_data.longitude = (original_data.longitude == null) ? '' : original_data.longitude;
		original_data.date_stamp = (original_data.date_stamp == null || original_data.date_stamp =="-") ? '' : original_data.date_stamp;
		original_data.date_of_birth = (original_data.date_of_birth == null || original_data.date_of_birth == "-") ? '' : original_data.date_of_birth;

		//var TAGS = JSON.parse(optionsSet.data.tags);
		var TAGS = [];
		try{
			TAGS = JSON.parse(optionsSet.data.tags);
		}catch(e){
			TAGS = optionsSet.data.tags.split(",");
		}

		var eye_dam = _.includes(TAGS,'EYE_DAMAGE_NONE') ? ['NONE'] : _.intersection(TAGS,['EYE_DAMAGE_YES']);
		var broken_teeth = _.includes(TAGS,'TEETH_BROKEN_NONE') ? ['NONE'] : _.intersection(TAGS, TAGS_CONST['TEETH_BROKEN']);
		var ear_marking = _.includes(TAGS,'EAR_MARKING_NONE')? ['NONE'] : (_.includes(TAGS,'EAR_MARKING_BOTH') ? ['EAR_MARKING_LEFT', 'EAR_MARKING_RIGHT'] : _.intersection(TAGS,TAGS_CONST['EAR_MARKING']));


		var mouth_marking = _.includes(TAGS,'MOUTH_MARKING_NONE') ? ['NONE'] : _.intersection(TAGS,['MOUTH_MARKING_YES']);
		var tail_marking = _.includes(TAGS,'TAIL_MARKING_MISSING_TUFT_NONE') ? ['NONE'] : _.intersection(TAGS,['TAIL_MARKING_MISSING_TUFT_YES']);
		var nose_color = _.intersection(TAGS, TAGS_CONST['NOSE_COLOUR'])[0];
		var scars = _.includes(TAGS,'SCARS_NONE')? ['NONE'] : _.intersection(TAGS,TAGS_CONST['SCARS']);

		var date_of_birth = local_date(optionsSet.data.date_of_birth);
		var date_stamp = local_date(optionsSet.data.date_stamp);

		var latitude = (optionsSet.data.latitude == null) ? '' : optionsSet.data.latitude;
		var longitude = (optionsSet.data.longitude == null) ? '' : optionsSet.data.longitude;

		var tag_location = (optionsSet.data.tag_location == null) ? {} : 
			{
				status: (optionsSet.data.tag_location ? true : false), 
				value: optionsSet.data.tag_location.value,
				title: optionsSet.data.tag_location.title
			};

		$scope.selected = {
			name: optionsSet.data.name,
			id: optionsSet.data.id,
			date_stamp: date_stamp,
			owner_organization_id: optionsSet.data.organization_id,
			organization_id: optionsSet.data.organization_id,
			date_of_birth: date_of_birth,
			latitude: latitude,
			longitude: longitude,
			tag_location: tag_location,
			gender: optionsSet.data.gender,
			eye_damage: eye_dam,
			broken_teeth: broken_teeth,
			ear_marking: ear_marking,
			mouth_marking: mouth_marking,
			tail_marking: tail_marking,
			nose_color: nose_color,
			scars: scars,      
			notes: optionsSet.data.notes,
			isPrivate: optionsSet.data.geopos_private,
			isDead: optionsSet.data.dead
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
		$scope.$watchGroup(['selected.tag_location.status','selected.tag_location.title', 'selected.tag_location.value'], function(newValues, oldValues, scope) {
			$scope.selected.tag_location.text = tag_text($scope.selected.tag_location);
		});
		
		if(!$scope.isLion){
			$scope.selected.lion_id = optionsSet.data.lion_id;
			$scope.selected.label =  $scope.selected.lion_id + ' - '+ $scope.selected.name
		}
		$scope.lion_age = getAge($scope.selected.date_of_birth);

		$scope.tooltip.lion_page.title = 'Open ' + optionsSet.data.name + "'s Lion Page in new window";
		$scope.tooltip.lion_page.checked = true;
	
		if (optionsSet.type === 'imageset' && optionsSet.data.is_primary){
			$scope.tooltip.organization.title = 'This is primary image set <br> of the lion ' + optionsSet.data.lion_id +
			' - ' + optionsSet.data.name + '.<br>To transfer the lion owner, use the Lion Profile page.';
			$scope.tooltip.organization.checked = true;
		}
	}
	else{
		// Result Datas
		var date = new Date();
		$scope.selected = { 
			name: "",
			uploading_user_id: $scope.user.id,
			uploading_organization_id: $scope.user.organization_id,
			owner_organization_id: $scope.user.organization_id,
			organization_id: $scope.user.organization_id,
			date_of_birth: null,
			date_stamp: new Date(),
			latitude:"", 
			longitude: "",
			tag_location: {},
			gender: null,
			ear_marking: [],
			mouth_marking: [],
			tail_marking: [],
			broken_teeth: [], 
			eye_damage: [],
			nose_color: undefined, 
			scars: [], 
			notes: "",
			isPrivate : false,
			isDead : false
		};
	}

	// Calc Age Function
	function getAge(date) {
		var birthDate = new Date(Date.parse(date));
		var now = new Date();
		function isLeap(year) {
			return year % 4 == 0 && (year % 100 != 0 || year % 400 == 0);
		};
		//function isLeap(year) {
		//return(new Date(year, 1, 29).getMonth() == 1)
		//}
		// days since the birthdate
		var days = Math.floor((now.getTime() - birthDate.getTime())/1000/60/60/24);
		var age = 0;
		// iterate the years
		for (var y = birthDate.getFullYear(); y <= now.getFullYear(); y++){
			var daysInYear = isLeap(y) ? 366 : 365;
			if (days >= daysInYear){
				days -= daysInYear;
				age++;
				// increment the age only if there are available enough days for the year.
			}
		}
		return age;
	};

	$scope.Calc_Age = function(){
		$scope.lion_age = getAge($scope.selected.date_of_birth);
	};

	$uibModalInstance.rendered.then(function(){
		if(vm && vm.form)
			vm.form.$setPristine();
	});
}]);
