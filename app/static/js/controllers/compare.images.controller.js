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

angular.module('linc.compare.images.controller', [])

.controller('CompareImagesCtrl', ['$scope', '$filter', 'LincServices', 'imageset_gallery', 'lion_gallery',
	function ($scope, $filter, LincServices, imageset_gallery, lion_gallery, imageTypes_filter) {

	$scope.dataLoading = false;

	// Image Set Types Filter
	$scope.ImageSetTypes = [ 
		{type: 'cv', name: 'CV Image', checked: true}, 
		{type:'full-body', name:'Full Body', checked: true}, 
		{type:'whisker', name:'Whisker', checked: true}, 
		{type:'main-id',name:'Main Id', checked: true}, 
		{type:'marking',name:'Marking', checked: true}
	];
	// Collapse Image Set Filter Panel
	$scope.isImageSetCollapsed = true;

	// Lion Primary Image Set Types Filter
	$scope.LionTypes = [
		{type: 'cv', name: 'CV Image', checked: true},
		{type:'full-body', name:'Full Body', checked: true}, 
		{type:'whisker', name:'Whisker', checked: true},
		{type:'main-id',name:'Main Id', checked: true}, 
		{type:'marking',name:'Marking', checked: true}
	];
	// Collapse Image Set Filter Panel
	$scope.isLionCollapsed = true; 

	// Carousel Options
	$scope.carousel = { interval: 500000, noWrapSlides: false, no_transition : false};
	// ImageSet
	$scope.carouselImg={ showslide: true, gallery:[], active: 0, Page: 1, Begin: 0, Count: 4 };
	// Lion
	$scope.carouselLion={ showslide: true, gallery: [], active: 0, Page: 1, Begin: 0, Count: 4 };
	// ImageSet Gallery
	var setGallery = function (gallery){
		var photos = []
		_.forEach(gallery.images, function(photo, index){
			photo.index = index;
			var name = 'Name: ' + photo.filename;
			var date = photo.img_date_stamp ? 'date stamp: '+ 
				photo.img_date_stamp.toLocaleString() : 'updated at: ' + 
				photo.img_updated_at.toLocaleString();
			var texto = name + '<br> ' + date + '<br> type: ' + photo.type;
			if(photo.joined)
				texto += '<br> joined from:&nbsp;' + photo.joined_from;
			photo.tooltip = {title: texto, checked: true};
			photos.push(photo);
		});
		return photos;
	}
	$scope.carouselImg.gallery = setGallery(imageset_gallery);
	// Lions
	$scope.carouselLion.gallery = setGallery(lion_gallery);
	// Previous Page Click
	$scope.prevPage = function($set){
		if ($set.Page > 1){
			$set.Page--;
			$set.Begin -= $set.Count;
			if($set.Begin < 0) 
				$set.Begin = 0
		}
	};
	// Next Page Click
	$scope.nextPage = function($set){
		if ($set.Page < $set.TotalPages){
			$set.Page++;
			$set.Begin += $set.Count;
			if($set.Begin > $set.filtered.length)
				$set.Begin = $set.filtered.length - $set.Count;
		}
	};
	// Disable Previous Page Buttom
	$scope.prevPageDisabled = function($set) {
		return $set.Page === 1 ? "disabled" : "";
	};
	// Disable Next Page Buttom
	$scope.nextPageDisabled = function($set) {
		return ($set.Page === $set.TotalPages || !$set.TotalPages) ? "disabled" : "";
	};
	// Set Active Image
	$scope.setActive = function(idx, $set) {
		$set.active=idx;
	}
	// Set Image Set Carousel Thumbnails
	var SetCarousel = function($set){
		var count = ($set.filtered==undefined) ? $set.gallery.length : $set.filtered.length;
		$set.TotalPages = Math.ceil(count/$set.Count);
	};
	// Change Page to Active Imge Page
	var ChangePage = function($set){
		if(!$set.gallery.length || !$set.filtered.length){
			$set.showslide=false;
			$set.Page = 0;
			return;
		}
		var index = $set.active; // Index of Carousel Image Showed
		var id = _.findIndex($set.filtered,{'id': $set.gallery[index].id});
		if(id==-1){
			$set.Page = 0;
			$set.active = -1;
			$set.Begin = 0;
			if($set.filtered.length){
				$set.Page = 1;
				$set.active = $set.filtered[0].index;
				$set.showslide=true;
			}
			else
				$set.showslide=false;
		}
		else{
			$set.showslide=true;
			var end = $set.Count;
			var page = 1;
			var done = false;
			if(id < end)
				done = true;

			while (!done){
				end += $set.Count;
				page++;
				if(id < end) 
					done = true;
			}
			$set.Page = page;
			$set.Begin = ($set.Page-1)*$set.Count;
		}
	}
	
	SetCarousel($scope.carouselImg);
	SetCarousel($scope.carouselLion);

	// Filter Carousel Thumbnails by Selected Types
	$scope.Change_Types = function ($set, types){
		SetCarousel($set);
		$set.filtered = $filter('imageTypes_filter')($set.gallery, types);
		ChangePage($set);
		$set.paginated = $filter('limitTo')($set.filtered, $set.Count, $set.Begin);
	}

	$scope.resizeChange = function(h,w){
		if(w >= 1200){
		$scope.carouselImg.Count = 6, $scope.carouselLion.Count = 6, $scope.carouselCV.Count = 7;
		}
		else if(w < 1200 && w > 1000){
		 	$scope.carouselImg.Count = 5, $scope.carouselLion.Count = 5, $scope.carouselCV.Count = 6;
		}
		else if(w <= 1000 && w >= 900){
		 	$scope.carouselImg.Count = 4, $scope.carouselLion.Count = 4, $scope.carouselCV.Count = 5;
		}
		else if(w < 900 && w >= 768){
		 	$scope.carouselImg.Count = 3,  
		 	$scope.carouselLion.Count = 3, 
		 	$scope.carouselCV.Count = 4;
		}
		else if(w < 768){
			$scope.carouselImg.Count = 9, 
			$scope.carouselLion.Count = 9, 
			$scope.carouselCV.Count = 9;
		}
		SetCarousel($scope.carouselImg), SetCarousel($scope.carouselLion), SetCarouselCV();
		ChangePage($scope.carouselImg); ChangePage($scope.carouselLion);
		$scope.isImageSetCollapsed = true;
		$scope.isLionCollapsed = true; 
	};
	// Matches
	$scope.carouselCV={ gallery: [], Page: 1, Begin: 0, Count: 4};
	// Matches Gallery
	var photos = []
	_.forEach($scope.cvresults, function(lion, index){
		lion.index = index;

		var cv = (lion.cv == null) ? 'CV: (null)' : 'CV: ' + (lion.cv * 100.) + '%';
		var cn = (lion.cn == null) ? 'CN: (null)' : (lion.cn > 1.) ? 'CN: ' + lion.cn + '%': 'CN: ' + lion.cn * 100. + '%';

		var name = 'Lion: ' + lion.id + '<br>Name: ' + lion.name + 
			'<br>Prymary Image Set: ' + lion.primary_image_set_id + '<br>' + cv + '<br>'+ cn;
		lion.tooltip = {title: name, checked: true};
		photos.push(lion);
	});
	$scope.carouselCV.gallery = angular.copy(photos);
	// Next CV Results Page
	$scope.nextCVPage = function($set){
		if ($set.Page < $set.TotalPages){
			$set.Page++, $set.Begin += $set.Count;
			if($set.Begin > $set.gallery.length) $set.Begin = $set.gallery.length - $set.Count;
		}
	};
	// Set Active CV Image
	var setActiveCVPage = function($set){
		var page = 1;
		var done = false;
		if($set.active <=0) {
			$set.active = 0; done=true;
		}
		else if($set.active < $set.Count){
			done=true;
		}
		else if($set.active >= $set.gallery.length){
			page = $set.TotalPages; 
			$set.active = $set.gallery.length-1; 
			done=true;
		}
		var end = $set.Count;
		while (!done){
			end += $set.Count;
			page++;
			if($set.active < end) 
				done = true;
		}
		return page;
	}
	// Set CV Results Lions
	var SetCarouselCV = function(){
		var count = $scope.carouselCV.gallery.length;
		$scope.carouselCV.TotalPages = Math.ceil(count/$scope.carouselCV.Count);
		$scope.carouselCV.Page = setActiveCVPage($scope.carouselCV);
		$scope.carouselCV.Begin = ($scope.carouselCV.Page-1)*$scope.carouselCV.Count;
	}
	// Set Initial CV Results Carousel Image
	$scope.carouselCV.active = _.findIndex($scope.carouselCV.gallery,{'id': $scope.lion.id});
	SetCarouselCV();

	$scope.selectLion = function(photo){
		$scope.lion = angular.copy(photo);
		$scope.carouselCV.active = photo.index;
		$scope.dataLoading = true;
		$scope.carouselLion.showslide=false;
		LincServices.getImageGallery(photo.primary_image_set_id).then(function(response){
			lion_gallery = angular.copy(response);
			$scope.carouselLion.gallery = setGallery(lion_gallery);
			$scope.carouselLion.filtered = $filter('imageTypes_filter')($scope.carouselLion.gallery, $scope.LionTypes);
			$scope.carouselLion.Page = 1;
			$scope.carouselLion.active = 0;

			SetCarousel($scope.carouselLion);
			ChangePage($scope.carouselLion);
			$scope.carouselLion.paginated = $filter('limitTo')($scope.carouselLion.filtered, $scope.carouselLion.Count, $scope.carouselLion.Begin);
			$scope.dataLoading = false;
		}, function (error) {
			$scope.dataLoading = false;
		});
	}

}]);

