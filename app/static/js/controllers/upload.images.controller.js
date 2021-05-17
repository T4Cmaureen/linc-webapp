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

angular.module('linc.upload.images.controller', [])

.controller('UploadImagesCtrl', ['$scope', '$window', '$cookies', '$uibModalInstance', '$bsTooltip', 'FileUploader',
  'NotificationFactory', 'options',
  function ($scope, $window, $cookies, $uibModalInstance, $bsTooltip, FileUploader, NotificationFactory, options) {

	$scope.imagesetId = options.imagesetId;
	$scope.isNew = options.isNew;

	var titles = {}; titles['lions'] = 'Lion'; titles['imagesets'] = 'Image Set';
	$scope.title = 'Upload Images';
	$scope.content = 'Upload Images<br />Contents!';

	$scope.GoBack = function () {
	 	$uibModalInstance.dismiss('cancel');
	};
	$scope.Cancel = function () {
	 	$uibModalInstance.dismiss('cancel');
	};
	$scope.Finish = function () {
	 	$uibModalInstance.close('finish');
	};

	$scope.OnSelect = function($item, Tags, ListOfTags) {
		UpdateTags(Tags, ListOfTags);
	};
	$scope.OnRemove = function($item, Tags, ListOfTags) {
		UpdateTags(Tags, ListOfTags);
	};

	var UpdateTags = function (Tags, ListOfTags){
		var disabled_tag = _.difference(['whisker', 'whisker-left','whisker-right'],
			_.intersection(_.map(Tags,'value'),
					['whisker', 'whisker-left','whisker-right']));
		if (disabled_tag.length == 3)
			disabled_tag = [];
		_.forEach(ListOfTags, function(tag){
				tag.disabled = _.includes(disabled_tag, tag.value);
		});
	};

	$scope.ListOfTags = [
		{ disabled: false, id: 0, value: "cv", label: "CV Image" },
		{ disabled: false, id: 1, value: "main-id", label: "Main Id" },
		{ disabled: false, id: 3, value: "whisker-left", label: "Whisker Left" },
		{ disabled: false, id: 4, value: "whisker-right", label: "Whisker Right" },
		{ disabled: false, id: 2, value: "marking", label: "Marking" },
		{ disabled: false, id: 7, value: "whisker", label: "Whisker (Not used in algorithm)" },
		{ disabled: false, id: 6, value: "full-body", label: "Full Body" }
	];

	$scope.Properties = [
		{ value: true, label: "Public" },
		{ value: false, label: "Private" }
	];

	$scope.Default = {isPublic: true, Tags: [], isCover: ''};

	var uploader = $scope.uploader = new FileUploader({
		url: '/images/upload',
		removeAfterUpload: true
	});

	// FILTERS
	uploader.filters.push({
		name: 'imageFilter',
		fn: function(item /*{File|FileLikeObject}*/, options) {
			var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
			return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
		}
	});
	// CALLBACKS
	uploader.onWhenAddingFileFailed = function(item /*{File|FileLikeObject}*/, filter, options) {
		console.info('onWhenAddingFileFailed', item, filter, options);
	};
	uploader.onAfterAddingFile = function(fileItem) {
		if(fileItem.file.name.length>20){
			fileItem.nickname = (fileItem.file.name || "").substring(1, 10) + ' ... '  +  (fileItem.file.name || "").substring(fileItem.file.name.length-8, fileItem.file.name.length)
			fileItem.show_name = false;
			fileItem.tooltip = {'title': 'filename: ' + fileItem.file.name, 'checked': true};
		}
		else{
			fileItem.nickname = fileItem.file.name;
			fileItem.show_name = true;
			fileItem.tooltip = {'title': '', 'checked': true};
		}
		fileItem.Tags = angular.copy($scope.Default.Tags);
		fileItem.ListOfTags = angular.copy($scope.ListOfTags);
		console.info('onAfterAddingFile', fileItem);
	};
	$scope.enable_Upload = false;
	uploader.onAfterAddingAll = function(addedFileItems) {
		console.info('onAfterAddingAll', addedFileItems);
		if(this.getNotUploadedItems().length)
			$scope.enable_Upload = true;
	};
	uploader.onBeforeUploadItem = function(item) {
		console.info('onBeforeUploadItem', item);
		var xsrfcookie = $cookies.get('_xsrf');
		item.headers = {'X-XSRFToken' : xsrfcookie};
		var formData = [
			{'image_tags' : _.map(item.Tags,'value')},
			{'is_public': item.isPublic},
			{'image_set_id': $scope.imagesetId},
			{'iscover': ($scope.Default.isCover == item.$$hashKey)}
		];
		Array.prototype.push.apply(item.formData, formData);
	};
	uploader.onProgressItem = function(fileItem, progress) {
		console.info('onProgressItem', fileItem, progress);
	};
	uploader.onProgressAll = function(progress) {
		console.info('onProgressAll', progress);
	};
	$scope.SucessItems = [];  $scope.Duplicateds = [];
	$scope.InvalidData = [];  $scope.ErrorItems = [];
	uploader.onSuccessItem = function(fileItem, response, status, headers) {
		console.info('onSuccessItem', fileItem, response, status, headers);
		var photo = {'name': fileItem.file.name, 'status' : status, 'response': response}
		$scope.SucessItems.push(photo);
		//fileItem.remove();
	};
	uploader.onErrorItem = function(fileItem, response, status, headers) {
		console.info('onErrorItem', fileItem, response, status, headers);
		var photo = {'name': fileItem.file.name, 'status' : status, 'response': response}
		if(status==409){
			$scope.Duplicateds.push(photo);
		}
		else if(status==400){
			$scope.InvalidData.push(photo);
		}
		else
			$scope.ErrorItems.push(photo);
	};
	uploader.onCancelItem = function(fileItem, response, status, headers) {
		console.info('onCancelItem', fileItem, response, status, headers);
	};
	uploader.onCompleteItem = function(fileItem, response, status, headers) {
		console.info('onCompleteItem', fileItem, response, status, headers);
		if(!$scope.isNew)
			$scope.Update();
	};
	uploader.onCompleteAll = function() {
		if(!uploader.getNotUploadedItems().length)
			$scope.enable_Upload = false;
		console.info('onCompleteAll');
		$scope.$broadcast("EmptyLionListCache");
		$scope.$emit("EmptyLionListCache");
		var message = '';
		if($scope.SucessItems.length>0){
			if($scope.SucessItems.length==1){
				message = "Image (" + $scope.SucessItems[0].name + ") uploaded with success.<br>";
				message += "It's being processed now."
			}
			else{
				var items = 'Images (';
				_.forEach($scope.SucessItems, function(photo, i) {
					items += photo.name;
					if(i+1 < $scope.SucessItems.length)
					 items += '<br>';
				});
				message = items + ") uploaded with success.<br>";
				message += "The images are being processed now."
			}
			NotificationFactory.success({
				title: "Upload", message: message,
				position: "right", // right, left, center
				duration: 5000     // milisecond
			});
		}
		if($scope.Duplicateds.length>0){
			var title = "Duplicate image"
			if($scope.Duplicateds.length==1){
				message = "The image (" + $scope.Duplicateds[0].name + ")<br>";
				message += "is already on base."
			}
			else{
				title = "Duplicate images"
				var items = 'The images (';
				_.forEach($scope.Duplicateds, function(photo, i) {
					items += photo.name;
					if(i+1 < $scope.Duplicateds.length)
					 items += '<br>';
				});
				message = items + ")<br>";
				message += "already exists in the base."
			}
			if($scope.debug || ($scope.Duplicateds[0].status != 401 && $scope.Duplicateds[0].status != 403)){
				NotificationFactory.error({
					title: title, message: message,
					position: 'right', // right, left, center
					duration: 5000   // milisecond
				});
			}
		}
		if($scope.InvalidData.length>0){
			var title = "Invalid Data or Image"
			if($scope.InvalidData.length==1){
				message = "There is an error in the data or image <br> (" + $scope.InvalidData[0].name + ")<br>";
				message += "."
			}
			else{
				title = "Invalid Data or Image"
				var items = 'There are errors in the data or images <br>(';
				_.forEach($scope.InvalidData, function(photo, i) {
					items += photo.name;
					if(i+1 < $scope.InvalidData.length)
					 items += '<br>';
				});
				message = items + ")";
			}
			if($scope.debug || ($scope.InvalidData[0].status != 401 && $scope.InvalidData[0].status != 403)){
				NotificationFactory.error({
					title: title, message: message,
					position: 'right', // right, left, center
					duration: 5000   // milisecond
				});
			}
		}
		if($scope.ErrorItems.length>0){
			var title = "Upload Error"
			if($scope.ErrorItems.length==1){
				message = "Error in processing image <br> (" + $scope.ErrorItems[0].name + ")<br>";
				message += "."
			}
			else{
				title = "Upload Errors"
				var items = 'Errors in processing of images <br>(';
				_.forEach($scope.ErrorItems, function(photo, i) {
					items += photo.name;
					if(i+1 < $scope.ErrorItems.length)
					 items += '<br>';
				});
				message = items + ")";
			}
			if($scope.debug || ($scope.ErrorItems[0].status != 401 && $scope.ErrorItems[0].status != 403)){
				NotificationFactory.error({
					title: title, message: message,
					position: 'right', // right, left, center
					duration: 5000   // milisecond
				});
			}
		}
		uploader.clearQueue();
	};

	$scope.enable_Upload = false;
	$scope.remove_item = function(item){
		item.remove();
		if(!uploader.getNotUploadedItems().length)
			$scope.enable_Upload = false;
	};
	$scope.remove_all_items = function(item){
		uploader.clearQueue();
		if(!uploader.getNotUploadedItems().length)
			$scope.enable_Upload = false;
	};
}])

.filter('tag_filter', function(){
	return function(input, organizations) {
		var filtered = _.filter(input, function(value){
				return (_.result(_.find(organizations, {'name': value.organization}), 'checked'));
		});
		return filtered;
	};
})
