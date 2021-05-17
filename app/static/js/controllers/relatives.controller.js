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

angular.module('linc.relatives.controller', [])

.controller('RelativesCtrl', ['$scope', '$q', '$filter', '$uibModal', '$timeout', '$uibModalInstance', 'NotificationFactory', 
  'lions', 'relatives', 'animal', 'relatives_options', 'AuthService', 'LincServices', 'LincDataFactory',
  function ($scope, $q, $filter, $uibModal, $timeout, $uibModalInstance, NotificationFactory, lions, relatives, animal,
  relatives_options, AuthService, LincServices, LincDataFactory) {

  	$scope.filters = relatives_options.filters;
  	$scope.isCollapsed = relatives_options.isCollapsed;
  	$scope.is_Collaped = relatives_options.is_Collaped;
	$scope.orderby = relatives_options.orderby;
	$scope.orderby2 = relatives_options.orderby2;

	$scope.order = function(predicate) {
		$scope.orderby.reverse = ($scope.orderby.predicate === predicate) ? !$scope.orderby.reverse : false;
		$scope.orderby.predicate = predicate;
		relatives_options.orderby = $scope.orderby;
		LincDataFactory.set_relatives(relatives_options);
	};

	// $scope.orderby2 = {predicate: 'id', reserve: false};
	$scope.orderby2 = relatives_options.orderby2;
	$scope.order2 = function(predicate) {
		$scope.orderby2.reverse = ($scope.orderby2.predicate === predicate) ? !$scope.orderby2.reverse : false;
		$scope.orderby2.predicate = predicate;
		relatives_options.orderby2 = $scope.orderby2;
		LincDataFactory.set_relatives(relatives_options);
	};

	// Click Collapse
	$scope.collapse_base = function(type){
		var val = !$scope.is_Collaped[type];
		var all = val ? val : true;
		$scope.is_Collaped = _.mapValues($scope.is_Collaped, function(value){return value = all});
		$scope.is_Collaped[type] = val;
		relatives_options.is_Collaped = $scope.is_Collaped;
		LincDataFactory.set_relatives(relatives_options);
	};

	$scope.collapse = function(type){
		var val = !$scope.isCollapsed[type];
		var all = val ? val : true;
		$scope.isCollapsed = _.mapValues($scope.isCollapsed, function(value){return value = all});
		$scope.isCollapsed[type] = val;
		relatives_options.isCollapsed = $scope.isCollapsed;
		LincDataFactory.set_relatives(relatives_options);
	};

	$scope.change = function(type){
		relatives_options.filters[type] = $scope.filters[type];
		LincDataFactory.set_relatives(relatives_options);
	};

	$scope.slider_options = { ceil: 32, floor: 0, onChange: function(){ /*$scope.ChangeFilter('Ages');*/}};

	$scope.isCollapsed.NameOrId = $scope.filters.NameOrId ? false : true;
	$scope.isCollapsed.Organization = _.every($scope.filters.Organizations, {checked: true});
	$scope.isCollapsed.Age = (($scope.slider_options.floor == $scope.filters.Ages.min &&  $scope.slider_options.ceil == $scope.filters.Ages.max) ? true : false);
	$scope.isCollapsed.Gender = _.every($scope.filters.Genders, {checked: true});
	$scope.is_Collaped.Filter = !(_.values($scope.isCollapsed).some(function(item){return item===false;}));


	$scope.refreshSlider = function () {
		$timeout(function () {
			$scope.$broadcast('rzSliderForceRender');
		});
	};

	$scope.refreshSlider();

	//$scope.filters = { NameOrId: '' };
	$scope.selected = { name: null, id: null, relation: '' };
	$scope.selection = { modified: false };

	$scope.user = AuthService.user;
	$scope.animal = animal;
	$scope.lions = lions;
	$scope.title = "Relatives of lion " + $scope.animal.name + " ( id: " + $scope.animal.id + " )";
	$scope.genderWarning = $scope.animal.gender ? false : true;
	var maxItems = { sibling : 15, associate : 10, cub : 15 };

	// Relation Types List
	var Labels = {
		mother : 'Mother',
		suspected_father : 'Suspected Father',
		sibling : 'Sibling',
		associate : 'Associate',
		cub : 'Cub'
	};
	$scope.Labels = Labels;

	$scope.allrelatives = [
		{type: 'mother', disabled: false},
		{type: 'suspected_father',disabled: false},
		{type: 'sibling', disabled: false},
		{type: 'associate', disabled: false},
		{type: 'cub', disabled: false}
	];
	
	$scope.orignal_relatives = relatives;
	$scope.relatives = angular.copy(relatives);

	// Lions List ( Remove Animal + Selected in Relatives)
	var Set_LionList = function(lions, lion_id){
		var list = _.map(_.reject(lions, {id: lion_id}), function(element){
			var elem = {};
			element['age'] = isNaN(parseInt(element['age'])) ? null : element['age'];
			if(!element.gender) element.gender = 'unknown';
			elem['show_image'] = false;
			return _.extend({}, element, elem);
		});
		_.forEach($scope.relatives, function(relative){
			list = _.reject(list, {id: relative.id_to});
		});
		return list;
	};
	$scope.lions_list = Set_LionList(lions, $scope.animal.id);


	$scope.Warning = function ($event){
		var modalScope = $scope.$new();
		modalScope.title = 'Warning';
		modalScope.message = 'This lion does not have a defined gender, so you can not select the MOTHER, SUSPECT FATHER, and CUB options';
		var modalInstance = $uibModal.open({
			templateUrl: 'Warning.Gender.tpl.html',
			scope: modalScope
		});

		modalInstance.result.then(function (result) {
		}, function (){
		});

		modalScope.Close = function (){
			modalInstance.close();
		};
	};
	$uibModalInstance.rendered.then(function(){
		if (!$scope.animal.gender)
			$scope.Warning();
	});

	var old_selected_id = null;
	// Switch Big/small Lions image
	$scope.SwitchImage = function(lion, val){
		if (old_selected_id){
			var old_lion = _.find($scope.lions_list, {'id': old_selected_id});
			if (old_lion)
				old_lion['show_image'] = false;
		}
		lion.show_image = val;
		old_selected_id = lion.id;
	};
	// Switch Big/small Animal image
	$scope.show_big = false;
	$scope.SwitchAnimalImage = function(val){
		$scope.show_big = val;
	};
	
	// Set Active Lion
	$scope.SetActiveLion = function(lion) {
		$scope.selected.id = lion.id;
		$scope.selected.name = lion.name;
		SetValidParent(lion);
	}
	// Select Valid Parents
	var SetValidParent = function(lion){
		$scope.selected.relation = null;
		var father = true;
		var mother = true;
		var cub = true;
		if ($scope.animal.gender){
			father = (lion.gender == 'male') ? false : true;
			mother = (lion.gender == 'female') ? false: true;
			father = father || _.some($scope.relatives, {relation: 'suspected_father'});
			mother = mother || _.some($scope.relatives, {relation: 'mother'});
			cub = (_.filter($scope.relatives, {relation: 'cub'})).length >= maxItems['cub'];
		}
		
		_.find($scope.allrelatives,{type: 'suspected_father'})['disabled'] = father;
		_.find($scope.allrelatives,{type: 'mother'})['disabled'] = mother;
		_.find($scope.allrelatives,{type: 'cub'})['disabled'] = cub;

		var sibling = _.filter($scope.relatives, {relation: 'sibling'});
		_.find($scope.allrelatives,{type: 'sibling'})['disabled'] = sibling.length >= maxItems['sibling'];
		var associate = _.filter($scope.relatives, {relation: 'associate'});
		_.find($scope.allrelatives,{type: 'associate'})['disabled'] = associate.length >= maxItems['associate'];
		
	};

	$scope.timeout = null;
	// Select Filtered if only
	$scope.FilterChange = function(){
		$timeout.cancel($scope.timeout);
		$scope.timeout = $timeout(function() {
			$scope.$apply(function () {
				if($scope.filtered_lions && $scope.filtered_lions.length==1)
					$scope.selected.lion = $scope.filtered_lions[0];
				else
					$scope.selected.lion = null;
			});
		}, 500);
	};
	// Add Lion to Relatives
	$scope.AddRelative = function(){
		var id = $scope.selected.id;
		var name = $scope.selected.name;
		var relation = $scope.selected.relation;
		$scope.relatives.push({
			_id :$scope.guid(),
			id_from: $scope.animal.id, 
			id_to: id, 
			name_to: name, 
			relation: relation
		});
		$scope.selection.modified = true;
		_.remove($scope.lions_list, {id: id});
		$scope.selected = { name: null, id: null, relation: '' };
	};
	// Remove Relative
	$scope.DelRelative = function(relative){
		var lion = _.find(lions, {id: relative.id_to});
		$scope.lions_list.push(lion);
		_.remove($scope.relatives, {id_to: relative.id_to});
		$scope.selection.modified = true;
		return lion;
	};

	$scope.SetBackActiveLion = function(relative){
		var relation = relative.relation;
		var lion = $scope.DelRelative(relative);
		$scope.SetActiveLion(lion);
		$scope.selected.relation = relation;
	};

	$scope.Reset = function(){
		$scope.relatives = angular.copy($scope.orignal_relatives);
		$scope.selection.modified = false;
		$scope.lions_list = Set_LionList(lions, $scope.animal.id);
		$scope.selected.id = null;
		$scope.selected.name = null;
	};

	$scope.Close = function () {
		$uibModalInstance.dismiss("close");
	};

	$scope.dataloading = false;
	$scope.submit = function(){
		console.log("==========================================================");
		$scope.dataloading = true;
		var added = _.differenceBy($scope.relatives,$scope.orignal_relatives,'id_to');
		var promisses = _.map(added, function(relative){
			var id_from = (relative.relation != 'cub') ? $scope.animal.id : relative.id_to;
			var id_to = (relative.relation != 'cub') ? relative.id_to : $scope.animal.id;
			var relative = (relative.relation != 'cub') ?  relative.relation : 
				($scope.animal.gender == "male" ? 'suspected_father' : 'mother');
			return AddRelative({lion_id: id_from, data: {relative_id: id_to, relation: relative}});
		});
		var removed = _.differenceBy($scope.orignal_relatives,$scope.relatives,'id_to');
		promisses = _.concat(promisses, _.map(removed, function(relative){
			return DeleteRelative({lion_id: $scope.animal.id, rel_id: relative.id_to});
		}));
		var updated = [];
		_.forEach($scope.relatives, function(relative){
			var original = check_original_relative(relative.id_from, relative.id_to);
			if(original && (original.relation != relative.relation)){
				var id_from = (relative.relation != 'cub') ? $scope.animal.id : relative.id_to;
				var id_to = (relative.relation != 'cub') ? relative.id_to : $scope.animal.id;
				var relative = (relative.relation != 'cub') ?  relative.relation : 
					($scope.animal.gender == "male" ? 'suspected_father' : 'mother');
				UpdateRelative({lion_id: id_from, rel_id: id_to, data: {relation: relative}})
			}
		});
		$q.all(promisses).then(function (response){
			console.log(response);
			NotificationFactory.success({
				title: 'Add Relation', 
				message: 'Relation added successfully',
				position: "right", // right, left, center
				duration: 2000     // milisecond
			});
			$uibModalInstance.close({'relatives': $scope.relatives});
		}, function (error) {
			NotificationFactory.error({
				title: "Erro: Add Relation",
				message: error.data.message,
				position: "right",
				duration: 5000,
			});
			$scope.dataloading = false;
		});
	};
	var AddRelative = function(data){
		var deferred = $q.defer();
		LincServices.Relatives({method: 'POST', lion_id: data.lion_id, data: data.data})
		.then(function(response){
			deferred.resolve(_.extend({}, response, {action:'added'}));
		}, function(error){
			deferred.reject(error);
		});
		return deferred.promise;
	};
	var DeleteRelative = function(data){
		var deferred = $q.defer();
		LincServices.Relatives({method: 'DELETE', lion_id: data.lion_id, rel_id: data.rel_id})
		.then(function(response){
			deferred.resolve(response);
		}, function(error){
			deferred.reject(error);
		});
		return deferred.promise;
	};
	var UpdateRelative = function(data){
		var deferred = $q.defer();
		LincServices.Relatives({method: 'PUT', lion_id: data.lion_id, rel_id: data.rel_id, data: data.data})
		.then(function(response){
			deferred.resolve(response);
		}, function(error){
			deferred.reject(error);
		});
		return deferred.promise;
	};

	var check_original_relative = function(id_from, id_to){
		return _.find($scope.orignal_relatives,{id_from: id_from, id_to: id_to});
	};
	$scope.guid = function(){
		return s4() + s4() + s4() + s4() + s4() + s4();
	};
	function s4(){
		return Math.floor((1+ Math.random()) * 0x10000).toString(16).substring(1);
	};
}]);
