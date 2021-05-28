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

angular.module('linc.cvrequest.controller', [])

.controller('CVRequesCtrl', ['$scope', '$state', '$timeout', '$bsTooltip', '$uibModal', '$uibModalInstance',
	'LincServices', 'LincDataFactory', 'NotificationFactory', 'imageset', 'lions', 'cvrequests_options',
	'AuthService', 'TAG_LABELS', 'TOOL_TITLE', function ($scope, $state, $timeout, $bsTooltip, $uibModal,
	$uibModalInstance, LincServices, LincDataFactory, NotificationFactory, imageset, lions, cvrequests_options,
	AuthService, TAG_LABELS, TOOL_TITLE) {

	$scope.title = 'Find Lion Match (Imageset Id: '+ imageset.id + '  age: ' + imageset.age + ' y/o  gender: ' + imageset.gender +' )';
	$scope.content = 'Search';
	$scope.imageset = imageset;
	$scope.small_image = true;

	$scope.classifier = { cv: $scope.cv_requirements.cv, whisker: $scope.cv_requirements.whisker };
	$scope.tooltip = { features: { title: 'tips: ' + TOOL_TITLE, checked: true } };

	var GET_FEATURES = function (lbls, TAGS){
		var label = "";
		TAGS.forEach(function (elem, i){
			label += lbls[elem];
			if(i<TAGS.length-1) label += ', ';
		});
		return label;
	};

	$scope.show_photo = function(object){
		if(angular.isObject(object)){
			var url = $state.href("viewimages", {'images':{'imageset': imageset, 'lion': object}},  {absolute: true});
			window.open(url,"_blank", "toolbar=yes, scrollbars=yes, resizable=yes, top=100, left=100, width=1200");
			// $state.go("viewimages", {'images':{'imageset': imageset, 'lion': object}});

		}
		else if (angular.isString(object)){
			var win = window.open(object, "_blank", "toolbar=yes, scrollbars=yes, resizable=yes, top=100, left=100, width=600, height=600");
			win.focus();
		}
	};

	$scope.user = AuthService.user;

	var get_permissions = function (user,lion){
		var permissions = {};
		var lion_ismine  = user.organization_id == lion.organization_id;
		permissions['canLocate'] = (!lion.geopos_private || user.admin || lion_ismine);
		return permissions;
	};
	var classifier_enabled = function(lion){
		if ($scope.classifier.cv && $scope.classifier.whisker)
			return (lion.has_data.cv || lion.has_data.whisker);
		else if ($scope.classifier.cv)
			return lion.has_data.cv;
		else if ($scope.classifier.whisker)
			return lion.has_data.whisker;
		else
			return false;
	};

	$scope.lions = _.map(lions, function(element, index) {

		element['permissions'] = get_permissions($scope.user, element);
		element['age'] = isNaN(parseInt(element['age'])) ? null : element['age'];
		element['dead'] = (element['dead'] == undefined || element['dead'] == null) ? element['dead'] = false : element['dead'];

		var elem = {};
		var TAGS = [];
		if(!element.gender) element.gender = 'unknown';
		if(element['tags']==undefined)element['tags']="[]";
		try{ TAGS = JSON.parse(element['tags']);
		}catch(e){ TAGS = element['tags'].split(","); }
		if(TAGS==null) TAGS = [];

		var tag_features = GET_FEATURES(TAG_LABELS, TAGS);
		var test = 'cv: ' + (element.has_data.cv ? 'true' : 'false') + ' whisker: ' + (element.has_data.whisker ? 'true' : 'false');
		elem['tooltip'] = {
			features: {title: test, checked: true}
		};
		elem['features'] = (tag_features.length > 0) ? true : false;
		elem['tag_features'] = tag_features;
		elem['disabled'] = !classifier_enabled(element);
		return _.extend({}, element, elem);
	});

	$scope.refreshSlider = function () {
		$timeout(function () {
				$scope.$broadcast('rzSliderForceRender');
		});
	};

	$scope.refreshSlider();

	$scope.filters = cvrequests_options.filters;
	$scope.isCollapsed = cvrequests_options.isCollapsed;
	$scope.orderby =cvrequests_options.orderby;

	$scope.change = function(type){
		cvrequests_options.filters[type] = $scope.filters[type];
		LincDataFactory.set_cvrequests(cvrequests_options);
		if (type == 'Organizations'){
			$scope.check_orgs.status = _.every($scope.filters.Organizations, ['checked', false]) ? 0 :
				(_.every($scope.filters.Organizations, ['checked', true]) ? 1 : -1);
		}
	};

	// Click Collapse
	$scope.collapse = function(type){
		cvrequests_options.isCollapsed[type] = $scope.isCollapsed[type] = !$scope.isCollapsed[type];
		LincDataFactory.set_cvrequests(cvrequests_options);
	};

	$scope.order = function(predicate) {
		$scope.orderby.reverse = ($scope.orderby.predicate === predicate) ? !$scope.orderby.reverse : false;
		$scope.orderby.predicate = predicate;
		cvrequests_options.orderby = $scope.orderby;
		LincDataFactory.set_cvrequests(cvrequests_options);
	};

	$scope.GoTo = function (data){
		//ui-sref="lion({id: lion.id})"
		var scopeGo = $scope.$new();
		scopeGo.title = (data.type == 'lion') ? 'Lion Info' : 'Image Set Info';
		scopeGo.message = 'Would you like to open the ' + ((data.type == 'lion') ? 'lion' : 'image set') + ' info page?';
		var modalGoTo = $uibModal.open({
				templateUrl: 'Dialog.Delete.tpl.html',
				scope: scopeGo
		});

		modalGoTo.result.then(function (result) {
			var params = data.params ? data.params : {};
			var url = $state.href(data.type, params)
			var win_params = win_params ? win_params : { name: "_blank", specs: "location=0, scrollbars=yes, resizable=yes, top=100, left=100, width=800" };
			window.open(url, win_params.name, win_params.specs);
		}, function () {
		});
		scopeGo.ok = function (){
			modalGoTo.close();
		}
		scopeGo.cancel = function(){
			modalGoTo.dismiss();
		}
	};
	$scope.ViewTotal = 20;
	$scope.Paging = function(){
		$scope.ViewTotal += 10;
	};

	$scope.slider_options = { ceil: 32, floor: 0, onChange: function(){ /*$scope.ChangeFilter('Ages');*/}};

	$scope.isCollapsed.NameOrId = $scope.filters.NameOrId ? false : true;
	$scope.isCollapsed.Organization = _.every($scope.filters.Organizations, {checked: true});
	$scope.isCollapsed.Age = (($scope.slider_options.floor == $scope.filters.Ages.min &&  $scope.slider_options.ceil == $scope.filters.Ages.max) ? true : false);
	$scope.isCollapsed.Gender = _.every($scope.filters.Genders, {checked: true});
	$scope.isCollapsed.TagFeatures = $scope.filters.TagFeatures ? false : true;
	$scope.isCollapsed.Location = ($scope.filters.Location.latitude && $scope.filters.Location.longitude && $scope.filters.Location.radius) ? false : true;

	$scope.viewer_label = function(){
		var label = "0 lion filtered";
		if($scope.filtered_lions != undefined && $scope.filtered_lions.length){
			label = ($scope.filtered_lions.length).toString() + " lions filtered";
		}
		return label;
	};

	$scope.Close = function () {
		$uibModalInstance.dismiss("close");
	};

	$scope.loading = false;
	$scope.requestCV = function () {
		var lions_id = _.map($scope.Selecteds, 'id');
		var classifier = _.keys(_.pickBy($scope.classifier));
		var data = {lions: lions_id, classifier: classifier};
		$scope.loading = true;
		console.log(data);
		LincServices.RequestCV(imageset.id, data, function(result){
			var requestObj = result.data.data;
			$uibModalInstance.close(requestObj);
			NotificationFactory.success({
				title: "Success", message:'CV Request created with success',
				position: "right",
				duration: 2000
			});
			$scope.loading = false;
		});
	};

	$scope.viewer_selected = function(){
		var label = "";
		if($scope.Selecteds.length == $scope.lions.length)
			label = "All " + $scope.Selecteds.length + " lions are selected";
		else if($scope.Selecteds.length){
			label = ($scope.Selecteds.length).toString();
			label += ($scope.Selecteds.length == 1 ) ? ' lion is selected' : ' lions are selected';
		}
		return label;
	};
	$scope.selection = { allSel: false, allUnSel: true };
	$scope.Selecteds = [];
	$scope.check_all = function (val){
		if (val){
			_.forEach($scope.filtered_lions, function(lion) {
				if(!lion.disabled){
					lion.selected = val;
					if(lion.selected){
						if(!_.some($scope.Selecteds, lion))
							$scope.Selecteds.push(lion);
					}
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
			var index0 = _.findIndex($scope.filtered_lions, {'id': lastSelId});
			var index1 = _.findIndex($scope.filtered_lions, {'id': lion.id});
			var first = Math.min(index0, index1);
			var second = Math.max(index0, index1);
			for(var i = first; i <= second; i++){
				var animal = $scope.filtered_lions[i];
				if (!animal.disabled){
					animal.selected = lion.selected;
					if(lion.selected){
						if(!_.some($scope.Selecteds, animal))
							$scope.Selecteds.push(animal);
					}
					else
						$scope.Selecteds = _.without($scope.Selecteds, animal);
				}
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
		$scope.selection.allSel = _.every($scope.filtered_lions, { selected: true });
		$scope.selection.allUnSel = _.every($scope.filtered_lions, { selected: false });
	};

	// Update Classifier List
	$scope.ChangeClassifier = function(){
		_.forEach($scope.filtered_lions, function(lion) {
			var enabled = classifier_enabled(lion);
			if (!enabled){
				if (!lion.disabled && lion.selected){
					lion.selected = false;
					_.remove($scope.Selecteds, { id: lion.id });
				}
				lion.disabled = true;
			}
			else
				lion.disabled = false;
		});
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
