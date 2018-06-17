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

.controller('CompareImagesCtrl', ['$scope', '$filter', 'LincServices', 'cvresults_data', 'imageset_gallery', 'lion_gallery',
	function ($scope, $filter, LincServices, cvresults_data, imageset_gallery, lion_gallery) {

	$scope.dataLoading = false;

	$scope.title = cvresults_data.title;
	$scope.reverse = cvresults_data.reverse;
	$scope.predicate = cvresults_data.predicate;
	$scope.imageset = cvresults_data.imageset;
	$scope.lion = cvresults_data.lion;
	$scope.cvresults = cvresults_data.cvresults;
	$scope.CVResultsTitle = $scope.cvresults.length + ' matches'

	$scope.$parent.show_navbar = false;

	// Image Set Types Filter
	$scope.ImageSetTags = [
		{checked: true, type: 'cv', label: 'CV Image'},
		{checked: true, type: 'full-body', label: 'Full Body'},
		{checked: true, type: 'main-id', label: 'Main Id'},
		{checked: true, type: 'marking', label: 'Marking'},
		{checked: true, type: 'whisker', label: 'Whisker (Not used in algorithm)'},
		{checked: true, type: 'whisker-left', label: 'Whisker Left'},
		{checked: true, type: 'whisker-right', label: 'Whisker Right'}
	];
	// Collapse Image Set Filter Panel
	$scope.isImageSetCollapsed = true;

	// Lion Primary Image Set Types Filter
	$scope.LionTags = [
		{checked: true, type: 'cv', label: 'CV Image'},
		{checked: true, type: 'full-body', label: 'Full Body'},
		{checked: true, type: 'main-id', label: 'Main Id'},
		{checked: true, type: 'marking', label: 'Marking'},
		{checked: true, type: 'whisker', label: 'Whisker (Not used in algorithm)'},
		{checked: true, type: 'whisker-left', label: 'Whisker Left'},
		{checked: true, type: 'whisker-right', label: 'Whisker Right'}
	];
	// Collapse Image Set Filter Panel
	$scope.isLionCollapsed = true;

	// Carousel Options
	$scope.carousel = { interval: 500000, noWrapSlides: false, no_transition : false};
	// ImageSet
	$scope.carouselImg={ showslide: true, gallery:[], name: 'imageset', active: 0, Page: 1, Begin: 0, Count: 4 };
	// Lion
	$scope.carouselLion={ showslide: true, gallery: [], name: 'lion', active: 0, Page: 1, Begin: 0, Count: 4 };
	// ImageSet Gallery
	var setGallery = function (gallery){
		var photos = _.map(gallery.images, function(photo, index) {
			var elem = {};
			elem['name'] = 'Name: ' + photo.filename;
			var date = photo.date_stamp ? ('date stamp: '+ photo.date_stamp.toLocaleString()) :
				(photo.created_at ? 'created at: ' + photo.created_at.toLocaleString() : ('updated at: ' + photo.updated_at.toLocaleString()));
			var texto = name + '<br> ' + date + '<br> tags: ' + photo.tags.join();
			if(photo.joined)
				texto += '<br> joined from:&nbsp;' + photo.joined_from;
			photo.tooltip = {title: texto, checked: true};
			elem['index'] = index;
			return _.extend({}, photo, elem);
		});
		return photos;
	};

	$scope.carouselImg.gallery = setGallery(imageset_gallery);

	console.log($scope.carouselImg.gallery);
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

	// // Filter Carousel Thumbnails by Selected Types
	$scope.Change_Tags = function ($set, tags){
		SetCarousel($set);
		$set.filtered = $filter('TagsFilter')($set.gallery, tags);
		ChangePage($set);
		$set.paginated = $filter('limitTo')($set.filtered, $set.Count, $set.Begin);
		if ($set.name == 'imageset')
			$scope.ImagesetTitle = "Image Set "+ $scope.imageset.id + " - Gallery ( " + $set.filtered.length + " Images )";
		else
			$scope.TitleLion = "CV Result (Image Set: "+ $scope.lion.primary_image_set_i + ") - Gallery ( " + $set.filtered.length + " Images )";
	}

	$scope.resizeChange = function(h,w){
		if (w >= 1770){
			$scope.carouselLion.Count = 13;
			$scope.carouselImg.Count = 13;
		}
		else if (w >= 1650){
			$scope.carouselLion.Count = 12;
			$scope.carouselImg.Count = 12;
		}
		else if (w >= 1550){
			$scope.carouselLion.Count = 11;
			$scope.carouselImg.Count = 11;
		}
		else if (w >= 1450){
			$scope.carouselLion.Count = 10;
			$scope.carouselImg.Count = 10;
		}
		else if (w >= 1350){
			$scope.carouselLion.Count = 9;
			$scope.carouselImg.Count = 9;
		}
		else if (w >= 1250){
			$scope.carouselLion.Count = 8;
			$scope.carouselImg.Count = 8;
		}
		else if(w >= 1140){
			$scope.carouselLion.Count = 7;
			$scope.carouselImg.Count = 7;
		}
		else if(w >= 1020){
			$scope.carouselLion.Count = 6;
			$scope.carouselImg.Count = 6;
		}
		else if(w >= 900){
			 $scope.carouselLion.Count = 5;
			 $scope.carouselImg.Count = 5;
		}
		else if(w >= 790){
			 $scope.carouselLion.Count = 4;
			 $scope.carouselImg.Count = 4;
		}
		else{
			$scope.carouselLion.Count = 3;
			$scope.carouselImg.Count = 3;
		}

		if (w >= 1820)
			$scope.carouselCV.Count = 12;
		else if (w >= 1730)
			$scope.carouselCV.Count = 11;
		else if (w >= 1620)
			$scope.carouselCV.Count = 10;
		else if (w >= 1490)
			$scope.carouselCV.Count = 9;
		else if (w >= 1390)
			$scope.carouselCV.Count = 8;
		else if(w >= 1280)
			$scope.carouselCV.Count = 7;
		else if(w >= 1170)
			$scope.carouselCV.Count = 6;
		else if(w >= 1060)
			 $scope.carouselCV.Count = 5;
		else if(w >= 980)
			$scope.carouselCV.Count = 4;
		else if(w >= 850)
			$scope.carouselCV.Count = 3;
		else
			$scope.carouselCV.Count = 2;

		SetCarousel($scope.carouselImg);
		SetCarousel($scope.carouselLion);
		SetCarouselCV();
		ChangePage($scope.carouselImg);
		ChangePage($scope.carouselLion);
		$scope.isImageSetCollapsed = true;
		$scope.isLionCollapsed = true;
	};

	// Matches
	$scope.carouselCV={ gallery: [], Page: 1, Begin: 0, Count: 4};
	// Matches Gallery
	var photos = []
	_.forEach($scope.cvresults, function(lion, index){
		lion.index = index;

		var cv = { prediction: 100.*lion.cv.prediction, confidence: 100.*lion.cv.confidence };
		var whisker = { prediction: 100.*lion.whisker.prediction, confidence: 100.*lion.whisker.confidence };

		var name = 'Lion: ' + lion.id + '<br>Name: ' + lion.name +
			'<br>Prymary Image Set: ' + lion.primary_image_set_id + '<br>' +
			'CV: <br>prediction: ' + cv.prediction.toFixed(2) + '%<br>confidence: ' + cv.confidence.toFixed(2) + '% <br>' +
			'Whisker: <br>prediction: ' + whisker.prediction.toFixed(2) + '%<br> confidence: ' + whisker.confidence.toFixed(2) + '%';
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
		LincServices.GetImageGallery(photo.primary_image_set_id).then(function(response){
			lion_gallery = angular.copy(response);
			$scope.carouselLion.gallery = setGallery(lion_gallery);
			$scope.carouselLion.filtered = $filter('TagsFilter')($scope.carouselLion.gallery, $scope.LionTags);
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
	$scope.ImagesetTitle = "Image Set "+ $scope.imageset.id + " - Gallery ( " + $scope.carouselImg.gallery.length + " Images )";
	$scope.TitleLion = "CV Result (Image Set: "+ $scope.lion.primary_image_set_id + ") - Gallery ( " + $scope.carouselLion.gallery.length + " Images )";
}]);

