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

angular.module('linc.cvresults.controller', [])

.controller('CVResultsCtrl', ['$scope', '$state', '$timeout', '$interval', '$uibModalInstance', '$uibModal', '$ModalPage',
	'$filter', 'LincServices', 'NotificationFactory', 'imageset', 'cvrequestId', 'cvresultsId', 'data_cvresults', 'TAG_LABELS',
	function ($scope, $state, $timeout, $interval, $uibModalInstance, $uibModal, $ModalPage, $filter, LincServices,
	NotificationFactory, imageset, cvrequestId, cvresultsId, data_cvresults, TAG_LABELS) {

	$scope.title = 'CV Results (CV Request Id: '+ data_cvresults.req_id + ' - Status: ' + data_cvresults.status;
	if (data_cvresults.status == 'finished')
	  $scope.title +=  ' execution time: ' + parseFloat(data_cvresults.execution,2) + ' sec';
	$scope.title += ')';
	$scope.content = 'Form';
	$scope.imageset = imageset;
	$scope.processing = false;
	$scope.small_image = true;
	$scope.classifier = {
		type : data_cvresults.type.has_cv ? 'cv' : 'whisker' ,
		has_cv: data_cvresults.type.has_cv,
		has_whisker: data_cvresults.type.has_whisker
	};

	var GET_FEATURES = function (lbs, TAGS){
		var label = "";
		TAGS.forEach(function (elem, i){
			label += lbs[elem];
			if(i<TAGS.length-1) label += ', ';
		});
		return label;
	};

	var Predictions = function(data){
		var prediction = {
			options: { ceil: 100, floor: 0, showTicksValues: false, hidePointerLabels: false, readOnly: true , disabled: false}
		};

		if ($scope.classifier.has_cv && $scope.classifier.has_whisker){
			if (data.cv.prediction && data.whisker.prediction){
				if (data.cv.prediction < data.whisker.prediction){
					prediction['minValue'] = data.cv.prediction *100;
					prediction['maxValue'] = data.whisker.prediction *100;
					prediction['prediction_type'] = false;
				}
				else{
					prediction['minValue'] = data.whisker.prediction *100;
					prediction['maxValue'] = data.cv.prediction *100;
					prediction['prediction_type'] = true;
				}
				prediction.options.disabled = (isNaN(prediction['minValue']) || isNaN(prediction['maxValue']));
			}
			else if(data.cv.prediction){
				prediction['minValue'] = data.cv.prediction *100;
				prediction['prediction_type'] = false;
				prediction.options.disabled = isNaN(prediction['minValue']);
			}
			else if(data.whisker.prediction){
				prediction['minValue'] = data.whisker.prediction *100;
				prediction['prediction_type'] = true;
				prediction.options.disabled = isNaN(prediction['minValue']);
			}
			else
				prediction.options.disabled = true;
		}
		else if ($scope.classifier.has_cv && data.cv.prediction){
				prediction['minValue'] = data.cv.prediction *100;
				prediction['prediction_type'] = false;
				prediction.options.disabled = isNaN(prediction['minValue']);
		}
		else if ($scope.classifier.has_whisker && data.whisker.prediction){
			prediction['minValue'] = data.whisker.prediction *100;
			prediction['prediction_type'] = true;
			prediction.options.disabled = isNaN(prediction['minValue']);
		}
		else
			prediction.options.disabled = true;

		return prediction;
	};

	$scope.cvresults = _.map(data_cvresults.cvresults, function(element, index) {
		var style = {'background-color': 'green'};
		var elem = {};

		elem['show_image'] = false;
		elem['dataloading'] = false;
		elem['prediction'] = Predictions({ cv: element['cv'], whisker: element['whisker'] });

		return _.extend({}, element, elem);
	});

	var count = 0;

	// $scope.show_photo = function(image){
	// 	var win = window.open(image, "_blank", "toolbar=yes, scrollbars=yes, resizable=yes, top=100, left=100, width=600, height=600");
	// 	win.focus();
	// };

	$scope.CompareImages = function (lion){
		var data = {
			title: 'Compare Images',
			imageset: imageset,
			lion: lion,
			cvresults: $filter('orderBy')($scope.cvresults, $scope.predicate, $scope.reverse),
			reverse: $scope.reverse,
			predicate: $scope.predicate
		};
		// $state.go("comparecvresults", {data: data});
		var url = $state.href("comparecvresults", {data: data})
		window.open(url,"_blank", "location=0, scrollbars=yes, resizable=yes, top=100, left=100, width=800");
	};

	var Poller = function () {
		LincServices.GetCVResults(cvresultsId).then(function(response){
			$scope.cvresults = response.cvresults;
			if(response.status == 'finished' || response.status == 'error'){
				console.log('Res Canceled - Status: ' + response.status);
				$scope.title = 'CV Results (CV Request Id: '+ data_cvresults.req_id + ' - Status: ' + response.status + ')';
				$scope.cancel_Poller();
			}
			count++;
			console.log('Res Count: ' + count);
		}, function(error){
			if(error.status != 403)
				$scope.cancel_Poller();
		});
	};

	var start_Poller = function (){
		if($scope.get_poller_promisse())
			$scope.cancel_Poller();
		Poller();
		var repeat_timer = 20000;
		$timeout(function() {
			count = 0;
			$scope.$apply(function () {
				$scope.set_poller_promisse($interval(Poller, repeat_timer));
				console.log("Result CV Req Poller started");
			});
		}, 0);
	};

	if(data_cvresults.status != 'finished' && data_cvresults.status != 'error'){
		start_Poller();
	}

	$scope.Close = function () {
		$uibModalInstance.close();
	};

	$scope.ClearResults= function () {
		LincServices.DeleteCVRequest(cvrequestId, function(){
			var data = {'lion_id': null, 'is_verified': false};
			LincServices.Associate(imageset.id, data, function(result){
				$scope.Updated({'lion_id': null, 'name': '-', 'lions_org_id': ''});
				$scope.EraseResults();
				$uibModalInstance.close();
			});
		});
	};

	$scope.Associate = function (lion){
		lion.dataloading = true;
		$scope.processing = true;
		_.forEach($scope.cvresults, function(cvresult) {
			cvresult.associated = false;
		});
		var data = {'lion_id': lion.id};
		if(imageset.organization_id === lion.organization_id){
			data['is_verified'] = true;
		}
		LincServices.Associate(imageset.id, data, function(result){
			lion.associated = true;
			$scope.Updated({'lion_id': lion.id, 'name' : lion.name,
				'is_verified': result.data.data.is_verified,
				'lions_org_id': lion.organization_id, 'organization' : lion.organization});
			NotificationFactory.success({
				title: "Associate", message:'Lion (id: ' + lion.id + ') was associated',
				position: "right", // right, left, center
				duration: 2000     // milisecond
			});
			lion.dataloading = false;
			$scope.processing = false;
		},
		function(error){
			if($scope.debug || (error.status != 401 && error.status != 403)){
				NotificationFactory.error({
					title: "Error", message: 'Unable to Associate the Lion (id: ' + lion.id + ') ',
					position: 'right', // right, left, center
					duration: 5000   // milisecond
				});
			}
			lion.dataloading = false;
			$scope.processing = false;
			console.log(error);
		});
	};

	$scope.Disassociate = function (lion){
		lion.dataloading = true;
		$scope.processing = true;
		var data = {'lion_id': null, 'is_verified': false};
		LincServices.Associate(imageset.id, data, function(result){
			lion.associated = false;
			$scope.Updated({'lion_id': null, 'name': '-', 'is_verified': false, 'lions_org_id': ''});
			NotificationFactory.success({
				title: "Disassociate", message:'Lion (id: ' + lion.id + ') was disassociated',
				position: "right", // right, left, center
				duration: 2000     // milisecond
			});
			lion.dataloading = false;
			$scope.processing = false;
		},
		function(error){
			if($scope.debug || (error.status != 401 && error.status != 403)){
				NotificationFactory.error({
					title: "Error", message: 'Unable to Disassociate the Lion (id: ' + lion.id + ')',
					position: 'right', // right, left, center
					duration: 5000   // milisecond
				});
			}
			console.log(error);
			lion.dataloading = false;
			$scope.processing = false;
		});
	};

	$scope.reverse = true;
	$scope.predicate = 'cv';

	$scope.order = function(predicate) {
		$scope.reverse = ($scope.predicate === predicate) ? !$scope.reverse : false;
		$scope.predicate = predicate;
		$timeout(function () {
			$scope.$apply(function () {
				$scope.ResizeTable();
			});
		}, 0);
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

	var old_selected_id = null;
	$scope.show_lion_image = false;
	$scope.SwitchImage = function(lion, val){
		if (!val){
			lion.show_image=false;
		}
		else{
			var show = lion.show_image;

			if (old_selected_id){
				var old_lion = _.find($scope.orderd_lions, {'id': old_selected_id});
				if (old_lion)
					old_lion['show_image'] = false;
			}
			lion.show_image = !show;
			old_selected_id = lion.id;
		}
		$scope.show_lion_image = _.some($scope.orderd_lions, { show_image: true });
		$timeout(function(){
			$scope.ResizeTable();
		},0, false);
		$scope.refreshSlider();
	};

	$scope.CleanCss = function(){
		var $table = $('table.table-cv-results'),
		$bodyCells = $table.find('tbody tr:first').children(),
		$headerCells = $table.find('thead tr').eq(1).children();
		$headerCells.each(function(i, v) {
			$(v).removeAttr('style');
		});
		$table.find('tbody tr').each(function(j,tr){
			$(tr).find('td').each(function(i, v) {
				$(v).removeAttr('style');
			});
		});

	};

	var valid_cv_data = function(cvresults){
		var data = [];
		_.forEach(cvresults, function(cvresult){
			var prediction = cvresult.cv.prediction;
			var confidence = cvresult.cv.confidence;
			if (prediction && confidence && !isNaN(prediction) && !isNaN(confidence)){
				data.push({
					name: cvresult.name,
					id: cvresult.id,
					c_type: 'cv',
					x: parseFloat((prediction * 100).toFixed(2)),
					y: parseFloat((confidence * 100).toFixed(2))
				});
			}
		});
		return data;
	};
	var valid_whisker_data = function(cvresults){
		var data = [];
		_.forEach(cvresults, function(cvresult){
			var prediction = cvresult.whisker.prediction;
			var confidence = cvresult.whisker.confidence;
			if (prediction && confidence && !isNaN(prediction) && !isNaN(confidence)){
				data.push({
					name: cvresult.name,
					id: cvresult.id,
					c_type: 'whisker',
					x: parseFloat((prediction * 100).toFixed(2)),
					y: parseFloat((confidence * 100).toFixed(2))
				});
			}
		});
		return data;
	};
	$scope.OpenGraph = function(){
		var series = [];
		if ($scope.classifier.has_cv){
			series.push({ name: 'CV', color: 'rgba(250, 101, 75, 1)', data: valid_cv_data($scope.cvresults) });
		}
		if ($scope.classifier.has_whisker){
			series.push({ name: 'Whisker', color: 'rgba(173, 174, 175, 1)', data: valid_whisker_data($scope.cvresults) });
		}
		var data = {
			title: 'CV Results',
			subtitle: 'Request Id: '+ data_cvresults.req_id + ' - Status: ' + data_cvresults.status,
			series: series
		};
		var modalScope = $scope.$new();
		modalScope.CompareImages = function (id) {
			var lion = _.find($scope.cvresults, {id: id});
			if (lion != undefined)
				$scope.CompareImages(lion);
		};
		$ModalPage({ data: data },
		{
			templateUrl: 'classifier.graph.tpl.html',
			controller: 'ClassifierGrapphCtrl', scope: modalScope,
			size: 'lg', windowClass: 'large-modal', backdrop  : 'static', keyboard: false,
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

	$scope.ResizeTable = function(){
		var $table = $('table.table-cv-results'),
		$bodyCells = $table.find('tbody tr:first').children(),
		$headerCells = $table.find('thead tr').eq(1).children();

		var colWidth = [];
		$table.find('tbody tr').each(function(j,tr){
			colWidth = $(tr).find('td').map(function(i, v) {
				return Math.max(v.offsetWidth, isNaN(colWidth[i]) ? 0 : colWidth[i]);
			}).get();
		});

		colWidth = $headerCells.map(function(i, v) {
			return Math.max(v.offsetWidth, colWidth[i]);
		}).get();

		$headerCells.each(function(i, v) {
			var min = Math.max(colWidth[i],30);
			// if(min > 200)
				// $(v).css({'width': '200px'});
			// else
			$(v).css({'min-width': min + 'px'});

		});

		$table.find('tbody tr').each(function(j,tr){
			$(tr).find('td').each(function(i, v) {
				var min = Math.max(colWidth[i], 30);
				// if(min > 200)
					// $(v).css({'width': '200px'});
				// else
				$(v).css({'min-width': min + 'px'});
			});
		});
	};

	$scope.refreshSlider = function () {
		$timeout(function () {
			$scope.$$postDigest(function () {
				$scope.$broadcast('rzSliderForceRender');
			});
		});
	};

	$(window).resize(function() {
		$scope.ResizeTable();
		$scope.refreshSlider();
	}).resize();

	$uibModalInstance.rendered.then(function(){
		$scope.refreshSlider();
	});

}]);
