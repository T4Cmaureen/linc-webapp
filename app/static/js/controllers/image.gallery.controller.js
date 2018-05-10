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

angular.module('linc.image.gallery.controller', [])

.controller('ImageGalleryCtrl', ['$scope', '$state', '$timeout', '$sce', '$q', '$window', '$uibModal', '$uibModalInstance', 'LincServices', 'NotificationFactory', 'optionsSet', 'gallery',
  function($scope, $state, $timeout, $sce, $q, $window, $uibModal, $uibModalInstance, 
  LincServices, NotificationFactory, optionsSet, gallery) {

	// Title
	$scope.title = 'Image Gallery ' + ' <h4>(Imageset - ' + optionsSet.id + ')</h4>';

	// Order
	$scope.ListOfOrderBy = [
		{ id: 0, predicate: 'name', reverse: false, label: '<span>Name <i class="icon icon-sort-alpha-asc"></i></span>'},
		{ id: 1, predicate: 'name', reverse: true,  label: '<span>Name <i class="icon icon-sort-alpha-desc"></i></span>'},
		{ id: 2, predicate: 'date', reverse: false, label: '<span>Date <i class="icon icon-sort-numeric-asc"></i></span>'},
		{ id: 3, predicate: 'date', reverse: true,  label: '<span>Date <i class="icon icon-sort-numberic-desc"></i></span>'},
		{ id: 4, predicate: 'type', reverse: false, label: '<span>Type <i class="icon icon-sort-alpha-asc"></i></span>'},
		{ id: 5, predicate: 'type', reverse: true,  label: '<span>Type <i class="icon icon-sort-alpha-desc"></i></span>'},
		{ id: 6, predicate: 'id', reverse: false, label: '<span>Id <i class="icon icon-sort-numberic-asc"></i></span>'},
		{ id: 7, predicate: 'id', reverse: true,  label: '<span>Id <i class="icon icon-sort-numberic-desc"></i></span>'}
	];

	$scope.Order = {by: $scope.ListOfOrderBy[0]};

	$scope.view = { download : false };

	$scope.imagesetId = optionsSet.id;
	$scope.IsPrimary = optionsSet.is_primary_imageset;
	$scope.JoinEnabled = false;
	$scope.canDelete = false;

	$scope.ShowGallery = function(){
		$scope.content = 'Image Gallery<br />Contents!';
	};
	var SetGallery = function(imageset){
		var gallery = _.map(imageset.images, function(image, index) {
			var elem = {};
			elem['name'] = 'Name: ' + image.filename;
			elem['date'] = image.date_stamp ? image.date_stamp : (image.created_at ? image.created_at : image.updated_at ); 

			var date_text = image.date_stamp ? ('date stamp: '+ image.date_stamp.toLocaleString()) : 
				(image.created_at ? 'created at: ' + image.created_at.toLocaleString() : ('updated at: ' + image.updated_at.toLocaleString()));
			elem['tooltip'] = {
				'image': { title: 'id: ' + image.id + ' ' + elem['name'] + '<br> ' + date_text, checked: true },
				'joined-html': {
					'from': image.joined ? $sce.trustAsHtml('<p>Join from:<br><b>Imageset ' + image.joined_from + '</b></p>') : '',
					'to': image.joined ? $sce.trustAsHtml('<p>Join to:<br><b>Imageset ' + image.joined_to + '</b></p>') : ''
				},
				'joined': {
					'from': image.joined ? 'Join from: Imageset ' + image.joined_from : '',
					'to': image.joined ? 'Join to: Imageset ' + image.joined_to : ''
				}
			}
			elem['index'] = index;
			elem['select'] = false;
			return _.extend({}, image, elem);
		});
		return gallery;
	};

	// ToolTips
	$scope.dynamicTooltip = {
		'cv': 'CV Image', 'full-body': 'Full Body', 'main-id': 'Main Id',
		'marking': 'Marking', 'whisker': 'Whisker (Do not use in Algorithm)', 
		'whisker-left': 'Whisker Left', 'whisker-right': 'Whisker Right'
	};

	$scope.gallery = SetGallery(gallery);

	// // FILTERS
	var DefaultFiltersTags = [
		{checked: true, type: 'cv', label: 'CV Image'},
		{checked: true, type: 'full-body', label: 'Full Body'},
		{checked: true, type: 'main-id', label: 'Main Id'}, 	
		{checked: true, type: 'marking', label: 'Marking'},	
		{checked: true, type: 'whisker-left', label: 'Whisker Left'},
		{checked: true, type: 'whisker-right', label: 'Whisker Right'},
		{checked: true, type: 'whisker', label: 'Whisker (Do not use in Algorithm)'}
	];

	// Tag Lists
	$scope.TagFilterList = angular.copy(DefaultFiltersTags);

	// Label properties checked => Filter value => Edit
	$scope.Properties = [ { checked: true, type: 'public', label: 'Public', value : true },
						  { checked: true, type: 'private', label: 'Private', value : false } ];
	// Join Primary Image Set
	$scope.Joined = [ { checked: true, type: 'joined', title: 'Joined', value: true, 
			label: ($scope.IsPrimary ? 'Joined Image' : 'Joined in the Primary Imageset')},
		{ checked: true, type: 'not-joined', title: 'Not Joined', value: false, label: 'Not Joined'} ];
	// Filters Selects
	//$scope.FilterSel = {isCover: false};
	$scope.Cover = [
		{ checked: true, type: 'is_cover', label: 'Cover Image', value : true },
		{ checked: true, type: 'no-cover', label: 'Not Cover Image', value : false } 
	];

	// Tab
	$scope.isViewFilter = true;

	// Change tab
	$scope.Change_Tab = function(tab){
		$scope.SetView(tab)
		if (tab=='filter'){
			console.log('filter');
			$scope.UnSelect_All();
		}
	};

	$scope.SetView = function(tab){
		$scope.isViewFilter = (tab=='filter');
	};

	$scope.TagsList = {
		'cv': [{ type: 'none', label: 'Not CV'}, { type: 'cv', label: 'CV'} ],
		'full-body': [ { type: 'none', label: 'Not Full Body'}, { type: 'full-body', label: 'Full Body'} ],
		'main-id': [ { type: 'none', label: 'Not Main Id'}, { type: 'main-id', label: 'Main Id'} ],
		'marking': [ { type: 'none', label: 'Not Marking'}, { type: 'marking', label: 'Marking'} ],
		'whisker': [
			{ type: 'none', label: 'Not Whisker'}, { type: 'whisker', label: 'Do not use in Algorithm'},
			{ type: 'whisker-left', label: 'Whisker Left'}, { type: 'whisker-right', label: 'Whisker Right'}
		]
	};

	$scope.MessageTags = { 
		'cv': 'Select to update the CV', 
		'full-body': 'Select to update the Full Body',
		'main-id': 'Select to update the Main Id',
		'marking': 'Select to update the Marking', 
		'whisker': 'Select to update the Whisker',
	};

	// Selected Items
	$scope.Selecteds = [];
	$scope.Selected = { isPublic: true, isCover: false, isJoined: false,
		Tags: { 'cv':  undefined, 'full-body': undefined, 'main-id': undefined, 'marking': undefined, 'whisker': undefined } };

	var Check_CanDelete = function(){
		var selecteds = _.map($scope.Selecteds, 'joined');
		if(!$scope.showPrivated) return false;
		else if(!_.includes(selecteds, true)) return true;
		else if($scope.IsPrimary) return false;
		else return true;
	};

	var MaxItemsPerPage = 50;
	// Pagination
	// Calc initial Itens per Page
	$scope.itemsPerPage = Math.min(MaxItemsPerPage, $scope.gallery.length);
	// Recalc Itens per page on click properties or image types
	$scope.CalcItemsPage = function (){
		$scope.itemsPerPage = Math.min(MaxItemsPerPage, $scope.filtered_gallery.length);
	};
	// Increase Page Numbers on click
	$scope.IncreasePages= function (){
		var diff = $scope.filtered_gallery.length - $scope.itemsPerPage;
		$scope.itemsPerPage += Math.min(50, diff);
	};

	// Adjust after delete images
	var Adjust_Gallery = function (items){
		var removed = [];
		_.forEach(items, function(item, i) {
			var remove = _.remove($scope.gallery, function(image) {
				return image.id == item.id;
			});
			removed.push(remove);
		});
		$scope.itemsPerPage = Math.min(MaxItemsPerPage, $scope.gallery.length);
		//Reset_Filters();
	};

	var Reset_Filters = function (){
		_.forEach($scope.Selecteds, function (photo){
			photo.select = false;
		});
		$scope.itemsPerPage = Math.max(MaxItemsPerPage, $scope.itemsPerPage);
		$scope.TagFilterList = angular.copy(DefaultFiltersTags);
		// $scope.FilterSel.isCover = false;
		_.forEach($scope.Joined, function(join){ join.checked = true;});
		_.forEach($scope.Properties, function(join){ join.checked = true;});
		_.forEach($scope.Cover, function(cover){ cover.checked = true;})
		$scope.isViewFilter = true;
		$scope.Selecteds = [];
	};

	var Select_Images = function(){
		var all_tags = []
		_.forEach($scope.Selecteds, function(image){
			all_tags = _.union(all_tags, image.tags);
		});
		_.forOwn($scope.Selected.Tags, function(value, tag){
			if(tag != 'whisker'){
				var count = (_.filter($scope.Selecteds, function(image){ 
					return _.includes(image.tags,tag)
				}) || []).length;		
				if(!count)			
					$scope.Selected.Tags[tag] = $scope.TagsList[tag][0]['type'];
				else if(count != $scope.Selecteds.length)
					$scope.Selected.Tags[tag] = undefined;
				else
					$scope.Selected.Tags[tag] = $scope.TagsList[tag][1]['type'];
			}
			else{
				var whiskers = (_.filter($scope.Selecteds, function(image){ 
					return _.includes(image.tags,'whisker')
				}) || []).length;
				if (whiskers == $scope.Selecteds.length)
					$scope.Selected.Tags[tag] = $scope.TagsList[tag][1]['type'];
				else if (!whiskers){
					var left_whiskers = (_.filter($scope.Selecteds, function(image){ 
						return _.includes(image.tags,'whisker-left')
					}) || []).length;
					if (left_whiskers == $scope.Selecteds.length)
						$scope.Selected.Tags[tag] = $scope.TagsList[tag][2]['type'];
					else if (!left_whiskers){
						var right_whiskers = (_.filter($scope.Selecteds, function(image){ 
							return _.includes(image.tags,'whisker-right')
						}) || []).length;
						if(right_whiskers == $scope.Selecteds.length)
							$scope.Selected.Tags[tag] = $scope.TagsList[tag][3]['type'];
						else
							$scope.Selected.Tags[tag] = $scope.TagsList[tag][0]['type'];
					}
					else
						$scope.Selected.Tags[tag] = undefined;
				}
				else
					$scope.Selected.Tags[tag] = undefined;
			}
		});

		var is_public = _.map($scope.Selecteds, 'is_public');
		if(_.includes(is_public, true) && _.includes(is_public, false))
			$scope.Selected.isPublic = undefined;
		else
			$scope.Selected.isPublic = $scope.Selecteds[0].is_public;

		var joined = _.map($scope.Selecteds, 'joined');
		if(_.includes(joined, true) && _.includes(joined, false))
			$scope.Selected.isJoined = undefined;
		else
			$scope.Selected.isJoined = $scope.Selecteds[0].joined;

		$scope.Selected.isCover = false;
		if($scope.showPrivated)
			$scope.SetView('edit');
	};
	// Select 
	$scope.Selecteds = [];
	// Click on the images check mark
	var lastSelIndex = -1;
	$scope.Select_Image = function ($event, photo, index){
		var shiftKey = $event.shiftKey;
		if(shiftKey && lastSelIndex>=0){
			var first = Math.min(lastSelIndex, index);
			var second = Math.max(lastSelIndex, index);
			for(var i = first; i <= second; i++){
				var image = $scope.paginated_gallery[i];
				image.select = photo.select;
				if(photo.select){
					if(!_.some($scope.Selecteds, image))
						$scope.Selecteds.push(image);
				}
				else
					$scope.Selecteds = _.without($scope.Selecteds, image);
			}
		}
		else{
			lastSelIndex = index;
			if(photo.select){
				if(!_.some($scope.Selecteds, photo))
					$scope.Selecteds.push(photo);
			}
			else
				$scope.Selecteds = _.without($scope.Selecteds, photo);
		}

		$scope.JoinEnabled = !optionsSet.is_primary_imageset && optionsSet.is_associated;

		if($scope.Selecteds.length == 1){
			if(photo.select){
				_.forOwn($scope.Selected.Tags, function(value, tag){
					$scope.Selected.Tags[tag] = TagSelected(photo, tag);
				});
				$scope.Selected.isPublic = photo.is_public;
				$scope.Selected.isJoined = photo.joined;
				$scope.Selected.isCover = photo.cover;
			}
			else{
				_.forOwn($scope.Selected.Tags, function(value, tag){
					$scope.Selected.Tags[tag] = TagSelected($scope.Selecteds[0], tag);
				});
				$scope.Selected.isPublic = $scope.Selecteds[0].is_public;
				$scope.Selected.isJoined = $scope.Selecteds[0].joined;
				$scope.Selected.isCover = $scope.Selecteds[0].cover;
			}
			if($scope.showPrivated)
				$scope.SetView('edit');
		}
		else if($scope.Selecteds.length>1){
			Select_Images();
		}
		else{
			_.mapValues($scope.Selected.Tags, function(tag){ return tag = undefined});
			$scope.Selected.isPublic = true;
			$scope.Selected.isJoined = false;
			$scope.Selected.isCover = false;
			$scope.SetView('filter');
		}
		if($scope.Selected.isJoined)
			$scope.JoinEnabled = true;
		$scope.canDelete = Check_CanDelete();
	};

	var TagSelected = function(photo, tag){
		var item = 0;
		if(tag != 'whisker')
			item = _.includes(photo.tags, tag) ? $scope.TagsList[tag][1] : $scope.TagsList[tag][0];
		else{
			var tags =  _.intersection(photo.tags, ['whisker', "whisker-left", 'whisker-right']);
			if (!tags.length)
				item = $scope.TagsList[tag][0];
			else
				item = _.find($scope.TagsList[tag],{type: tags[0]});
		}
		return item && item.type ? item.type : undefined;
	};

	$scope.Select_All = function () {
		_.forEach($scope.paginated_gallery, function(photo, index) {
			photo.select = true;
			if(!_.some($scope.Selecteds, photo))
				$scope.Selecteds.push(photo);
		});
		$scope.JoinEnabled = !optionsSet.is_primary_imageset && optionsSet.is_associated;
		if($scope.Selecteds.length>1){
			Select_Images();
		}
		$scope.canDelete = Check_CanDelete();
		if($scope.Selected.isJoined)
			$scope.JoinEnabled = true;
	};
	$scope.UnSelect_All = function () {
		_.forEach($scope.gallery, function(photo, index) {
			photo.select = false;
		});
		$scope.Selecteds = [];
		_.mapValues($scope.Selected.Tags, function(tag){ return tag = undefined});
		$scope.Selected.isPublic = true;
		$scope.Selected.isJoined = false;
		$scope.Selected.isCover = false;
		$scope.JoinEnabled = false;
		$scope.canDelete = false;
		$scope.SetView('filter');
	};

	// Open a Modal Carousel
	$scope.ShowCarousel = function(photo){
		var Scope = $scope.$new();
		Scope.gallery = angular.copy($scope.filtered_gallery);
		Scope.selected = photo;
		var modal = $uibModal.open({
				templateUrl: 'carousel.gallery.tpl.html', controller: 'CarouselCtrl', 
				size: 'lg', backdrop  : 'static', keyboard: false, animation: true, 
				transclude: true, replace: true, scope: Scope
		});

		modal.result.then(function (result) {
			console.log('close');
		}, function () {
			console.log('Modal dismissed at: ' + new Date());
		});
	};

	// Close Gallery Modal
	$scope.Close = function(){
		console.log("Close UploadImages");
		$uibModalInstance.close("close");
	};

	// Button Save
	$scope.Save = function(){
		$uibModalInstance.close("salve");
	};

	// Click in Photo - Show Big Image
	$scope.ShowBigPhoto = function(url){
		var win = window.open(url, "_blank", "toolbar=yes, scrollbars=yes, resizable=yes, top=200, left=200, width=600, height=600");
		win.focus();
	};

	// Open a Imageset in new window
	$scope.OpenImageSet = function (id){
		var url = $state.href("imageset", { 'id': id },  {absolute: true});
		window.open(url,'_blank');
	};

	// Update Gallery on Imageset/Lion
	$scope.UpdateImages = function () {
		LincServices.GetImageGallery($scope.imagesetId).then(function (data) {
			gallery = data;
			$scope.gallery = SetGallery(gallery);
			$scope.imagesetId = optionsSet.id;
			$scope.itemsPerPage = Math.min(MaxItemsPerPage, $scope.gallery.length);
			console.log('updated: ' + $scope.ImagesChanged);
		});
		$scope.UpdateGallery();
	};

	// Download
	$scope.Download = function () {
		var data = '?download=' +  _.map($scope.Selecteds, 'id');
		$scope.view.download = true;
		$uibModalInstance.freeze(true);
		LincServices.Download(data).then(function(res_data){
			var blob = res_data.blob;
			var fileName = (res_data.fileName || "").substring(res_data.fileName.lastIndexOf('/')+1) || 'images.zip';
			saveAs(blob, fileName);
			$scope.view.download = false;
			$uibModalInstance.freeze(false);
		});
	};
	// Delete a Image
	$scope.Delete = function (){
		$scope.delete_items =  _.map($scope.Selecteds, function(photo){
			return {'id': photo.id};
		});
		if(!$scope.delete_items.length){
			NotificationFactory.warning({
				title: "Delete", message: "No images selected to delete",
				position: "right", // right, left, center
				duration: 3000     // milisecond
			});
		}
		else {
			var modalScope = $scope.$new();
			var message = {};
			if($scope.delete_items.length==1){
				modalScope.title = 'Delete Lion Image';
				modalScope.message = 'Are you sure you want to delete the image?';
				message = { 
					Sucess: 'Image was successfully deleted.',
					Error: 'Unable to delete the image.'
				};
			}
			else{
				modalScope.title = 'Delete Lions Images';
				modalScope.message = 'Are you sure you want to delete the images?';
				message = { 
					Sucess: 'Images were successfully deleted.',
					Error: 'Unable to delete the images.'
				};
			}
			var modalInstance = $uibModal.open({
				templateUrl: 'Dialog.Delete.tpl.html',
				scope: modalScope
			});

			modalInstance.result.then(function (result) {
				var data = {'type': 'images', 'items': $scope.delete_items};
				LincServices.BatchDelete(data, function(result){
					NotificationFactory.success({
						title: 'Delete', 
						message: message.Sucess,
						position: "right", // right, left, center
						duration: 2000     // milisecond
					});
					Adjust_Gallery($scope.delete_items);
					$scope.UpdateGallery();
				},
				function(error){
					if($scope.debug || (error.status != 401 && error.status != 403)){
						NotificationFactory.error({
							title: "Fail: "+modalScope.title, 
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
		}
	};

	// Change Cover Property
	$scope.Change_Cover = function(){
		if($scope.Selecteds.length){
			var image = $scope.Selecteds[0];
			var data = {"main_image_id": $scope.Selected.isCover ? image.id : null};
			LincServices.SetMainImagenId($scope.imagesetId, data, function(result){
				_.forEach($scope.gallery, function(photo, index) {
					if(image == photo){
						photo.cover = (data.main_image_id == null) ? false : true;
					}
					else{
						photo.cover = false;
					}
				});
				// Reset_Filters();
				$scope.UpdateGallery();
				NotificationFactory.success({
					title: "Select", message: "Cover Image was Selected",
					position: "right", // right, left, center
					duration: 2000     // milisecond
				});
			},
			function(error){
				if($scope.debug || (error.status != 401 && error.status != 403)){
					NotificationFactory.error({
						title: "Error", 
						message: "Unable to Select Cover Image",
						position: 'right', // right, left, center
						duration: 5000   // milisecond
					});
				}
			});
		}
	};

	// Update a isPublic Property
	$scope.Change_isPublic = function(){
		if($scope.Selecteds.length && ($scope.Selected.isPublic != undefined)){
			var updated = [];
			_.forEach($scope.Selecteds, function(photo, index) {
				if($scope.Selected.isPublic != photo.is_public){
					updated.push({'index': index, 'image_id': photo.id, 'data': {'is_public': $scope.Selected.isPublic}});
					if(!$scope.Selected.isPublic && photo.cover){
						var data = {"main_image_id": null};
						LincServices.SetMainImagenId($scope.imagesetId, data, function(result){
							photo.cover = false;
						});
					}
				}
			});
			LincServices.UpdateImages(updated, function(results){
				NotificationFactory.success({
					title: "Update", 
					message: "All Images have been updated",
					position: "right",
					duration: 2000
				});
				_.forEach(results, function(result, idx) {
					var photo = _.find($scope.Selecteds, {'id': result.id});
					photo.is_public = result.is_public;
				});
				$scope.UpdateGallery();
				// Reset_Filters();
			});
		}
	};

	// Change Join
	$scope.Change_isJoined = function(){
		if($scope.Selecteds.length && ($scope.Selected.isJoined != undefined)){
			var updated = [];
			_.forEach($scope.Selecteds, function(photo, index) {
				if($scope.Selected.isJoined != photo.joined){
					updated.push({'index': index, 'image_id': photo.id, 'data': {'joined': $scope.Selected.isJoined}});
				}
			});
			LincServices.UpdateImages(updated, function(results){
				NotificationFactory.success({
					title: "Update", 
					message: "All Images have been updated",
					position: "right",
					duration: 2000
				});
				if(optionsSet.is_primary_imageset && !$scope.Selected.isJoined){
					var items =  _.map($scope.Selecteds, function(photo){
						return {'id': photo.id};
					});
					Adjust_Gallery(items);
				}
				else{
					_.forEach($scope.Selecteds, function(photo, idx) {
						photo.joined = $scope.Selected.isJoined;
					});
					// Reset_Filters();
				}
				$scope.UpdateGallery();
			});
		}
	};

	// Update Tags
	$scope.Change_Tags = function(){
		var tags = _.pickBy($scope.Selected.Tags, function(value,key){ return value != undefined});
		console.log(tags);
		if( $scope.Selecteds.length && !_.isEmpty(tags) ){
			var tags_to_add = _.values(_.pickBy(tags, function(value,key){ return value != 'none'}));
			var tags_to_remove = _.keys(_.pickBy(tags, function(value,key){ return value == 'none'}));
			console.log('original - to add: '+ tags_to_add + ' to remove: '+ tags_to_remove);
			// Remove all types of whiskers if the whisker is in the set of tags_to_remove
			tags_to_remove = _.includes(tags_to_remove, 'whisker') ? 
			_.union(tags_to_remove,[ 'whisker-left', 'whisker-right' ]) : tags_to_remove;
			console.log('remove_tags - to add: '+ tags_to_add + ' to remove: '+ tags_to_remove);

			// 1 ) In add whisker case, remove another types of whiskers (whisker, whisker-left, whisker-rigth)
			var diff = _.difference(["whisker","whisker-left","whisker-right"], tags_to_add);
			tags_to_remove = diff.length == 2 ? _.union(tags_to_remove, diff) : tags_to_remove;
			console.log('add_tags - to add: '+ tags_to_add + ' to remove: '+ tags_to_remove);

			var updated = [];
			_.forEach($scope.Selecteds, function(photo, index){
				var tags = _(photo.tags).union(tags_to_add).difference(tags_to_remove).value();
				if(!_.isEqual(tags.sort(),photo.tags.sort())){
					console.log('id: ' + photo.id + ' update : ' + photo.tags + ' to : ' + tags);
					// photo.tags = tags;
					updated.push({'index': index, 'image_id': photo.id, 'data': {'image_tags': tags}});
				}
			})

			LincServices.UpdateImages(updated, function(results){
				_.forEach(results, function(result, idx) {
					var photo = _.find($scope.Selecteds, {id: result.id});
					photo.tags = result.image_tags;
				});
				NotificationFactory.success({
					title: "Update", 
					message: "All Images have been updated",
					position: "right",
					duration: 2000
				});
				//Reset_Filters();
				$scope.UpdateGallery();
			});
		}

		// else{
		// 	console.log('undefined');
		// 	console.log(_.pickBy($scope.Selected.Tags,undefined));
		// 	console.log(_.omitBy($scope.Selected.Tags,undefined));
		// }
	};
}])

// CAROUSEL CONTROLLER ========================================================
.controller('CarouselCtrl', ['$scope', '$sce', '$uibModalInstance', 
	function($scope, $sce, $uibModalInstance) {

	$scope.CloseCarousel = function(){
		$uibModalInstance.dismiss('cancel');
	};

	$scope.zoomtooltip = {'title': 'click here to enter zoom mode', checked: true};

	// carousel image
	$scope.carousel = {
		active: 0, 
		interval: 500000, 
		noWrapSlides: false, 
		no_transition : false,
		view: true
	};

	$scope.carousel.gallery = _.map($scope.gallery, function(photo, index){
		if (photo.id == $scope.selected.id)
			$scope.carousel.active = index;
		photo.index = index;
		return photo;
	});

	// The panzoom config model can be used to override default configuration values
	$scope.panzoom = {
		Config : {
			zoomLevels: 12,
			neutralZoomLevel: 5,
			scalePerZoomLevel: 1.5,
			initialPanX: 200,
			zoomOnDoubleClick: true
			//zoomToFitZoomLevelFactor: 1
		},
		// The panzoom model should initialle be empty; it is initialized by the <panzoom>
		// directive. It can be used to read the current state of pan and zoom. Also, it will
		// contain methods for manipulating this state.
		Model: {},
		view: false
	};

	$scope.show_zoom = function(url){
		$scope.panzoom.view = true;
		$scope.carousel.view = false;
		$scope.panzoom.Model.photo = url;
	};

	$scope.hide_zoom = function(){
		$scope.panzoom.view = false;
		$scope.carousel.view = true;
	};

}])

// FILTERS ========================================================

.filter('TagsFilter', function(){
	return function(input, tags) {
	var tags_actives = _.map(_.filter(tags, {checked: true}),'type'); 
		var filtered = _.filter(input, function(value){
			return value.tags.length ? _.intersection(value.tags,  tags_actives).length : input;
		});
		return filtered;
	};
})

.filter('CoverFilter', function(){
	return function(input, cover) {
		var filtered = _.filter(input, function(value){
			var type = 'is_cover'
			if(!value.cover) type = 'no-cover';
			return (_.result(_.find(cover, {type: type}), 'checked'));
		});
		return filtered;
	};
})

.filter('JoinedFilter', function(){
	return function(input, joined) {
		var filtered = _.filter(input, function(value){
			var type = 'joined'
			if(!value.joined) type = 'not-joined';
			return (_.result(_.find(joined, {type: type}), 'checked'));
		});
		return filtered;
	};
})


.filter('PropertiesFilter', function(){
	return function(input, properties) {
		var filtered = _.filter(input, function(value){
			//if(value.select==true) return true;
			var type = 'public';
			if(!value.is_public) type = 'private';
			return (_.result(_.find(properties, {type: type}), 'checked'));
		});
		return filtered;
	};
});
