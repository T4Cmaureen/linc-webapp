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

angular.module('linc.image.gallery.controller', ['linc.image.gallery.directive'])

.controller('ImageGalleryCtrl', ['$scope', '$state', '$timeout', '$sce', '$window', '$uibModal', '$uibModalInstance', 
  'LincServices', 'NotificationFactory', 'optionsSet', 'gallery', function($scope, $state, $timeout, $sce, $window, 
    $uibModal, $uibModalInstance, LincServices, NotificationFactory, optionsSet, gallery) {

  // Order
  $scope.ListOfOrderBy = [
    { id: 0, predicate: 'name', reverse: false, label: '<span>Name <i class="icon icon-sort-alpha-asc"></i></span>'},
    { id: 1, predicate: 'name', reverse: true,  label: '<span>Name <i class="icon icon-sort-alpha-desc"></i></span>'},
    { id: 2, predicate: 'date', reverse: false, label: '<span>Date <i class="icon icon-sort-numeric-asc"></i></span>'},
    { id: 3, predicate: 'date', reverse: true,  label: '<span>Date <i class="icon icon-sort-numberic-desc"></i></span>'},
    { id: 4, predicate: 'type', reverse: false, label: '<span>Type <i class="icon icon-sort-alpha-asc"></i></span>'},
    { id: 5, predicate: 'type', reverse: true,  label: '<span>Type <i class="icon icon-sort-alpha-desc"></i></span>'}
  ];
  $scope.person = {selected : undefined};

  $scope.Order = {by: $scope.ListOfOrderBy[0]};

  var set_gallery = function(set){
    var ga = _.map(set.images, function(element, index) {
      var name = 'Name: ' + element.filename;
      var data = element.img_date_stamp ? element.img_date_stamp : element.img_updated_at;
      var date = element.img_date_stamp ? 'date stamp: '+ element.img_date_stamp.toLocaleString() : 'updated at: ' + element.img_updated_at.toLocaleString();
      var texto = name + '<br> ' + date; 
      var tooltip = {title: texto, checked: true};
      var joined_from_text = '';
      if(element.joined)
        joined_from_text = 'from:&nbsp;' + element.joined_from;
      var joined_tooltip = {title: joined_from_text, checked: element.joined};
      console.log(joined_from_text);
      //console.log(element.joined);
      return _.extend({}, element, {select: false, tooltip: tooltip, joined_tooltip: joined_tooltip, name: name, date: data, index: index});
    });
    return ga;
  }

  $scope.zoomtooltip = {'title': 'click here to enter zoom mode', checked: true};
  $scope.gallery = set_gallery(gallery);

  $scope.imagesetId = optionsSet.id;
  $scope.IsPrimary = optionsSet.is_primary_imageset;
  // $scope.JoinEnabled = !optionsSet.is_primary_imageset && optionsSet.is_associated;
  $scope.JoinEnabled = false;
  $scope.canDelete = false;

  var titles = {}; titles['lions'] = 'Lions'; titles['imagesets'] = 'Image Sets';

  // download image
  $scope.download_view = false;
  $scope.isViewFilter = true;
  $scope.ShowIsCover = true;
  $scope.Selecteds = [];

  // Title
  $scope.title = 'Image Gallery ' + ' <h4 style="display:inline;">(Imageset - ' + optionsSet.id + ')</h4>';
  $scope.content = 'Image Gallery<br />Contents!';

  // Photo Caption
  $scope.Type_Labels = {'cv': 'CV Image', 'full-body': 'Full Body', 'whisker': 'Whisker',
                   'main-id': 'Main Id', 'marking': 'Marking'};
  // Painel - Labels
  $scope.Filters = [{type: 'all', label: 'All'}, {type: 'cv', label: 'CV Image'},
                    {type:'full-body', label:'Full Body'}, {type:'whisker', label:'Whisker'},
                    {type:'main-id',label:'Main Id'}, {type:'marking',label:'Marking'}];
  $scope.Selects = [{type: 'cv', label: 'CV Image'}, {type:'full-body', label:'Full Body'},
                    {type:'whisker', label:'Whisker'}, {type:'main-id',label:'Main Id'},
                    {type:'marking',label:'Marking'}];
  // Label properties
  $scope.Properties = [{'name': 'Public', 'checked': true, 'value' : true},
                       {'name': 'Private', 'checked': true, 'value' : false}];

  // Selects
  $scope.FilterSel = {Type: 'all', isPublic: true, isPrivate: true, isCover: false, isJoined: false};
  $scope.Selected = {Type: 'cv', isPublic: true, isCover: false, isJoined: false};

  var Reset_Filters = function (){
    _.map($scope.Selecteds, function (photo){
      photo.select = false;
    });
    $scope.itemsPerPage = Math.max(100, $scope.itemsPerPage);
    $scope.FilterSel.Type = 'all';
    $scope.FilterSel.isCover = false;
    $scope.FilterSel.isJoined = false;
    $scope.Properties[0].checked = true;
    $scope.Properties[0].checked = true;
    $scope.isViewFilter = true;
    $scope.Selecteds = [];
  }

  var check_selecteds = function(type){
    var contem = 0;
    if(type=="type"){
      var selecteds = _.pluck(_.map($scope.Selecteds, function (photo){
        return {'type': photo.type};
      }), 'type');
      _.forEach($scope.Selects, function(select) {
        if(_.includes(selecteds, select.type))
          contem++;
      });
      if(contem>1) return true;
      else return false;
    }
    if(type=="properties"){
      var selecteds = _.pluck(_.map($scope.Selecteds, function (photo){
        return {'is_public': photo.is_public};
      }), 'is_public');

      if(_.includes(selecteds, true) && _.includes(selecteds, false))
        return true;
      else
        return false;
    }
    if(type=="joined"){
       var selecteds = _.pluck(_.map($scope.Selecteds, function (photo){
        return {'joined': photo.joined};
      }), 'joined');
      if(_.includes(selecteds, true) && _.includes(selecteds, false))
        return true;
      else
        return false;
    }
  }

  var check_canDelete = function(){
    var selecteds = _.pluck(_.map($scope.Selecteds, function (photo){
      return {'joined': photo.joined};
    }), 'joined');
    if(!$scope.showPrivated)
      return false;
    else if(!_.includes(selecteds, true))
      return true;
    else if($scope.IsPrimary)
      return false;
    else
      return true;
  }

  // Button Save
  $scope.Save = function(){
    $uibModalInstance.close("salve");
  };

  $scope.Download = function () {
    var data = '?download=' +  _.pluck(_.map($scope.Selecteds, function (photo){
      return {'id': photo.id};
    }), 'id');

    $scope.download_view = true;
    $uibModalInstance.freeze(true);
    LincServices.Download(data).then(function(res_data){
      var blob = res_data.blob;
      var fileName = (res_data.fileName || "").substring(res_data.fileName.lastIndexOf('/')+1) || 'images.zip';
      saveAs(blob, fileName);
      $scope.download_view = false;
      $uibModalInstance.freeze(false);
    });
  };

  $scope.Close = function(){
    console.log("Close UploadImages");
    $uibModalInstance.close("close");
  }
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
        templateUrl: 'Dialog.Delete.tmpl.html',
        scope: modalScope
      });

      modalInstance.result.then(function (result) {
        LincServices.DeleteImages($scope.delete_items, function(result){
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
  }
  var removed = [];
  // Adjust after delete images
  var Adjust_Gallery = function (items){
    _.forEach(items, function(item, i) {
      var remove = _.remove($scope.gallery, function(image) {
        return image.id == item.id;
      });
      removed.push(remove);
    });
    $scope.itemsPerPage = Math.min(100, $scope.gallery.length);
    Reset_Filters();
  };
  // Click in Photo - Show Big Image
  $scope.show_photo = function(url){
    var win = window.open(url, "_blank", "toolbar=yes, scrollbars=yes, resizable=yes, top=200, left=200, width=600, height=600");
    win.focus();
  }

  $scope.open_imageset = function (id){
    var url = $state.href("imageset", { 'id': id },  {absolute: true});
    window.open(url,'_blank');
  }

  // carousel image
  $scope.image_view = false;
  $scope.carousel = {active: 0, interval: 500000, noWrapSlides: false, no_transition : false, gallery: []};

  $scope.show_image_view = function(photo, index){

    var photos = []
    _.forEach($scope.paginated_gallery, function(photo, index){
      photo.index = index;
      photos.push(photo);
    });
    $scope.carousel.gallery = angular.copy(photos);
    $scope.carousel.active = index;
    $scope.image_view = true;
  }

  $scope.hide_image_view = function(){
    $scope.image_view = false;
    $scope.carousel.active = -1;
  }

  // The panzoom config model can be used to override default configuration values
  $scope.panzoomConfig = {
      zoomLevels: 12,
      neutralZoomLevel: 5,
      scalePerZoomLevel: 1.5,
      initialPanX: 200,
      zoomOnDoubleClick: true,
      //zoomToFitZoomLevelFactor: 1
  };

  // The panzoom model should initialle be empty; it is initialized by the <panzoom>
  // directive. It can be used to read the current state of pan and zoom. Also, it will
  // contain methods for manipulating this state.
  $scope.panzoomModel = {};

  $scope.show_zoom = function(url){
    $scope.zoom_view = true;
    $scope.image_view = false;
    $scope.panzoomModel.photo = url;
  }
  $scope.hide_zoom = function(){
    $scope.zoom_view = false;
    $scope.image_view = true;
  }

  // Change tab
  $scope.Change_Tab = function(tab){
    if(tab=='filter'){
      $scope.isViewFilter=true;
    }
    else{
      $scope.isViewFilter=false;
    }
  }
  // Pagination
  // Calc initial Itens per Page
  $scope.itemsPerPage = Math.min(100, $scope.gallery.length);
  // Recalc Itens per page on click properties or image types
  $scope.calc_itemspage = function (){
    $scope.itemsPerPage = Math.min(100, $scope.filtered_gallery.length);
  }
  // Increase Page Numbers on click
  $scope.increase_pages= function (){
    var diff = $scope.filtered_gallery.length - $scope.itemsPerPage;
    $scope.itemsPerPage += Math.min(100, diff);
  }
  // Click on the images check mark
  var lastSelIndex = -1;
  $scope.Select_Image = function ($event, photo, index){
    var shiftKey = $event.shiftKey;
    //$scope.canDelete = false;
    if(shiftKey && lastSelIndex>=0){
      var first = Math.min(lastSelIndex, index);
      var second = Math.max(lastSelIndex, index);
      console.log('first: ' + first);
      console.log('second: ' + second);
      for(var i = first; i <= second; i++){
        var image = $scope.paginated_gallery[i];
        image.select = photo.select;
        if(photo.select){
          if(!_.some($scope.Selecteds, image))
            $scope.Selecteds.push(image);
        }
        else {
          $scope.Selecteds = _.without($scope.Selecteds, image);
        }
      }
    }
    else{
      lastSelIndex = index;
      if(photo.select){
        if(!_.some($scope.Selecteds, photo))
          $scope.Selecteds.push(photo);
      }
      else {
        $scope.Selecteds = _.without($scope.Selecteds, photo);
      }
    }

    $scope.JoinEnabled = !optionsSet.is_primary_imageset && optionsSet.is_associated;

    if($scope.Selecteds.length == 1){
      if(photo.select){
        $scope.Selected.isPublic = photo.is_public;
        $scope.Selected.Type = photo.type;
        $scope.Selected.isCover = photo.cover;
        $scope.Selected.isJoined = photo.joined;
      }
      else{
        $scope.Selected.Type = $scope.Selecteds[0].type;
        $scope.Selected.isPublic = $scope.Selecteds[0].is_public;
        $scope.Selected.isCover = $scope.Selecteds[0].cover;
        $scope.Selected.isJoined = $scope.Selecteds[0].joined;
      }
      console.log("Set Properties");
      if($scope.showPrivated)
        $scope.Change_Tab('edit');
    }
    else if($scope.Selecteds.length>1){
      if(check_selecteds("type"))
        $scope.Selected.Type = "";
      else {
        $scope.Selected.Type = $scope.Selecteds[0].type;
      }
      if(check_selecteds("properties"))
        $scope.Selected.isPublic = '';
      else {
        $scope.Selected.isPublic = $scope.Selecteds[0].is_public;
      }
      if(check_selecteds("joined")){
        $scope.Selected.isJoined = false;
      }
      else {
        $scope.Selected.isJoined = $scope.Selecteds[0].joined;
      }
      $scope.Selected.isCover = false;
      if($scope.showPrivated)
        $scope.Change_Tab('edit');
    }
    else{
      $scope.Selected.Type = 'cv';
      $scope.Selected.isPublic = true;
      $scope.Selected.isCover = false;
      $scope.Selected.isJoined = false;
      $scope.Change_Tab('filter');
    }
    if($scope.Selected.isJoined)
      $scope.JoinEnabled = true;
    $scope.canDelete = check_canDelete();
  }

  $scope.Select_All = function () {
    _.forEach($scope.paginated_gallery, function(photo, index) {
      photo.select = true;
      if(!_.some($scope.Selecteds, photo))
        $scope.Selecteds.push(photo);
    });
    if($scope.Selecteds.length>1){
      if(check_selecteds("type"))
        $scope.Selected.Type = "";
      else {
        $scope.Selected.Type = $scope.Selecteds[0].type;
      }
      if(check_selecteds("properties"))
        $scope.Selected.isPublic = '';
      else {
        $scope.Selected.isPublic = $scope.Selecteds[0].is_public;
      }
      if(check_selecteds("joined")){
        $scope.Selected.isJoined = false;
      }
      else {
        $scope.Selected.isJoined = $scope.Selecteds[0].joined;
      }
      $scope.Selected.isCover = false;
      if($scope.showPrivated)
        $scope.Change_Tab('edit');

      $scope.canDelete = check_canDelete();
    }
  }
  $scope.UnSelect_All = function () {
    _.forEach($scope.gallery, function(photo, index) {
      photo.select = false;
    });
    $scope.Selecteds = [];
    $scope.Change_Tab('filter');
  }
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
        Reset_Filters();
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
            title: "Error", message: "Unable to Select Cover Image",
            position: 'right', // right, left, center
            duration: 5000   // milisecond
          });
        }
      });
    }
  }
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
        _.forEach(results, function(result, idx) {
          var data = { "is_public": result.is_public };
          var photo = _.find($scope.Selecteds, {'id': result.id});
          _.merge(photo, photo, data);
        });
        $scope.UpdateGallery();
        NotificationFactory.success({
          title: "Update", message: "All Images have been updated",
          position: "right", // right, left, center
          duration: 2000     // milisecond
        });
        Reset_Filters();
      });
    }
  }
  $scope.Change_Type = function(){
    if($scope.Selecteds.length){
      var updated = [];
      _.forEach($scope.Selecteds, function(photo, index) {
        if($scope.Selected.Type != photo.type){
          updated.push({'index': index, 'image_id': photo.id, 'data': {'image_type': $scope.Selected.Type}});
        }
      });
      LincServices.UpdateImages(updated, function(results){
        _.forEach(results, function(result, idx) {
          var data = { "type": result.image_type };
          var photo = _.find($scope.Selecteds, {'id': result.id});
          _.merge(photo, photo, data);
        });
        NotificationFactory.success({
          title: "Update", message: "All Images have been updated",
          position: "right", // right, left, center
          duration: 2000     // milisecond
        });
        Reset_Filters();
        $scope.UpdateGallery();
      });
    }
  };
  $scope.Change_Join = function(){
    if($scope.Selecteds.length){
      var updated = [];
      _.forEach($scope.Selecteds, function(photo, index) {
        if($scope.Selected.isJoined != photo.joined){
          updated.push({'index': index, 'image_id': photo.id, 'data': {'joined': $scope.Selected.isJoined}});
        }
      });
      LincServices.UpdateImages(updated, function(results){
        NotificationFactory.success({
          title: "Update", message: "All Images have been updated",
          position: "right", // right, left, center
          duration: 2000     // milisecond
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
          Reset_Filters();
        }
        $scope.UpdateGallery();
      });
    }
  }
  $scope.UpdateImages = function () {
    LincServices.getImageGallery($scope.imagesetId).then(function (data) {
      gallery = data;
      $scope.gallery = set_gallery(gallery);
      $scope.imagesetId = optionsSet.id;
      $scope.itemsPerPage = Math.min(100, $scope.gallery.length);
      console.log('updated: ' + $scope.ImagesChanged);
    });
    $scope.UpdateGallery();
  };

}])

// FILTERS

.filter('unsafe', function($sce) {
  return $sce.trustAsHtml;
})

.filter('TypeFilter', function(){
  return function(input, type) {
    if(type == 'all') return input;
    var filtered = _.filter(input, function(value){
      //if(value.select==true) return true;
      return value.type == type;
    });
    return filtered;
  };
})

.filter('CoverFilter', function(){
  return function(input, cover) {
    if(!cover) return input;
    var filtered = _.filter(input, function(value){
      //if(value.select==true) return true;
      return value.cover == cover;
    });
    return filtered;
  };
})

.filter('JoinFilter', function(){
  return function(input, joined) {
    if(!joined) return input;
    var filtered = _.filter(input, function(value){
      return value.joined == joined;
    });
    return filtered;
  };
})

.filter('PropertiesFilter', function(){
  return function(input, properties) {
    var filtered = _.filter(input, function(value){
      //if(value.select==true) return true;
      var name = 'Public';
      if(!value.is_public) name = 'Private';
      return (_.result(_.find(properties, {'name': name}), 'checked'));
    });
    return filtered;
  };
})

;
