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

angular.module('linc.admin.images.controller', [])

.controller('AdminImagesCtrl', ['$scope', '$uibModal', function ($scope, $uibModal) {

  $scope.Image_Mode = $scope.settings.images.Mode;
  $scope.itemsPerPage = 100;//$scope.settings.images.itemsPerPage;

  $scope.check_all = function (val){
    if(val){
      _.forEach($scope.paginated_images, function(image) {
        image.selected = val;
        if(!_.some($scope.Selecteds, image))
          $scope.Selecteds.push(image);
      });
    }
    else{
      _.forEach($scope.$parent.images, function(image) {
        image.selected = val;
      });
      $scope.Selecteds = [];
      $scope.settings.images.Selecteds = $scope.Selecteds;
    }
    check_selects();
  }

  var lastSelId = -1;
  $scope.Select_Image = function ($event, image, type){
    if(type == 'line-click'){
      image.selected = !image.selected;
    }
    var shiftKey = $event.shiftKey;
    if(shiftKey && lastSelId>=0){
      var index0 = _.findIndex($scope.paginated_images, {'id': lastSelId});
      var index1 = _.findIndex($scope.paginated_images, {'id': image.id});
      var first = Math.min(index0, index1);
      var second = Math.max(index0, index1);
      for(var i = first; i < second; i++){
        var img = $scope.paginated_images[i];
        img.selected = image.selected;
        if(image.selected){
          if(!_.some($scope.Selecteds, img))
            $scope.Selecteds.push(img);
        }
        else {
          $scope.Selecteds = _.without($scope.Selecteds, img);
          $scope.settings.images.Selecteds = $scope.Selecteds;
        }
      }
    }
    else{
      lastSelId = image.id;
      if(image.selected){
        if(!_.some($scope.Selecteds, image))
          $scope.Selecteds.push(image);
      }
      else {
        $scope.Selecteds = _.without($scope.Selecteds, image);
        $scope.settings.images.Selecteds = $scope.Selecteds;
      }
    }
    check_selects();
  }

  $scope.Add_Image = function () {
    $scope.Image_Mode = 'add';    
    $scope.check_all(false);

    var modalScope = $scope.$new();
    modalScope.title = 'Add Image';
    
    modalScope.dataSending = false;
    modalScope.showValidationMessages = false;

    modalScope.edit = {'image_url': false};

    modalScope.imagesets = angular.copy($scope.$parent.imagesets);
    modalScope.image = {
      'url': '', 
      'image_tags': ['cv'], 
      'image_set_id': '',
      'is_public': true, 
      'selected': true
    };

    var modalInstance = $uibModal.open({
        templateUrl: 'Edit_Image.tpl.html',
        scope: modalScope
    });

    modalInstance.result.then(function (result) {
      $scope.Image_Mode = '';
      modalScope.dataSending = false;
    }, function (){
      $scope.Image_Mode = '';
      modalScope.dataSending = false;
    });

    modalScope.submit = function(valid){
      if(valid){
        modalScope.dataSending = true;
        var data = { 
          'url': modalScope.image.url,
          'image_tags': modalScope.image.image_tags,
          'image_set_id': modalScope.image.image_set_id,
          'is_public': modalScope.image.is_public
        };
        modalScope.dataSending = true;
        $scope.LincApiServices.Images({'method': 'post', 'data': data}).then(function(response){
          $scope.Notification.success({
            title: 'Image Info', 
            message: 'New Image successfully created',
            position: "right",
            duration: 2000
          });
          var image = response.data;
          image.created_at = (image.created_at || "").substring(0,19);
          image.updated_at = (image.updated_at || "").substring(0,19);
          image.selected = true;
          $scope.$parent.images.push(image);
          $scope.Selecteds.push(image);
          modalInstance.close();
        },
        function(error){
          $scope.Notification.error({
            title: "Image", 
            message: 'Fail to create new Image',
            position: 'right',
            duration: 5000
          });
          modalInstance.dismiss();
        });
      }
      else {
        modalScope.showValidationMessages = true;
      }
    };
    modalScope.cancel = function(){
      modalInstance.dismiss();
    }
  };

  $scope.Edit_Image = function() {
    if($scope.Selecteds.length == 1){
      $scope.Image_Mode = 'edit';

      var modalScope = $scope.$new();
      modalScope.title = 'Edit Image';

      modalScope.showValidationMessages = false;
      modalScope.dataSending = false;
      
      modalScope.edit = {'image_url': false};

      modalScope.imagesets = angular.copy($scope.$parent.imagesets);
      modalScope.image = angular.copy($scope.Selecteds[0]);
      
      var modalInstance = $uibModal.open({
          templateUrl: 'Edit_Image.tpl.html',
          scope: modalScope,
          size: 'lg'
      });

      modalInstance.result.then(function (result) {
        $scope.Image_Mode = '';
        modalScope.dataSending = false;
      }, function (){
        $scope.Image_Mode = '';
        modalScope.dataSending = false;
      });

      modalScope.OnSelect = function($item, Tags, ListOfTags) {
        UpdateTags(Tags, ListOfTags);
        Tags.sort(StrCompare);
      };

      modalScope.OnRemove = function($item, Tags, ListOfTags) {
        UpdateTags(Tags, ListOfTags);
        Tags.sort(StrCompare);
      };

      function StrCompare(a, b) {
        if (a.id < b.id) return -1;
        if (a.id > b.id) return 1;
        return 0;
      };

      var UpdateTags = function (Tags, ListOfTags){
        var disabled_tag = _.difference(['whisker', 'whisker-left','whisker-right'],
          _.intersection(Tags, ['whisker', 'whisker-left','whisker-right']));
        if (disabled_tag.length == 3)
          disabled_tag = [];
        _.forEach(ListOfTags, function(tag){
            tag.disabled = _.includes(disabled_tag, tag.value);
        });
      };

      modalScope.submit = function(valid){
        if(valid){
          var data = { 
            'url': modalScope.image.url,
            'image_tags': modalScope.image.image_tags,
            'image_set_id': modalScope.image.image_set_id,
            'is_public': modalScope.image.is_public
          };
          modalScope.dataSending = true;
          $scope.LincApiServices.Images({'method': 'put', 'image_id' : modalScope.image.id, 'data': data}).then(function(response){
            $scope.Notification.success({
              title: 'Image Info', 
              message: 'Image data successfully updated',
              position: "right",
              duration: 2000
            });
            var image = $scope.Selecteds[0];
            _.merge(image, image, response.data);
            image.created_at = (image.created_at || "").substring(0,19);
            image.updated_at = (image.updated_at || "").substring(0,19);
            modalInstance.close();
          },
          function(error){
            $scope.Notification.error({
              title: "Fail", 
              message: 'Fail to change Image data',
              position: 'right',
              duration: 5000 
            });
            modalInstance.dismiss();
          });
        }
        else {
          modalScope.showValidationMessages = true;
        }
      };
      modalScope.cancel = function(){
        modalInstance.dismiss();
      }
    }
  }

  $scope.Delete_Image = function() {
    $scope.DialogDelete('Images')
    .then(function (result) {
      var images_id = _.map($scope.Selecteds, 'id');

      $scope.LincApiServices.Images({'method': 'delete', 'images_id': images_id}).then(function(response){
        if(response.error.length>0){
          var data = _.map(response.error, 'id');
          var msg = (data.length>1) ? 'Unable to delete images ' + data : 'Unable to delete image ' + data;
          $scope.Notification.error({
            title: "Delete", 
            message: msg,
            position: "right", 
            duration: 2000 
          });
        }
        else if(response.success.length>0){
          var msg = (response.success.length>1) ? 'Images successfully deleted' : 'Image successfully deleted';
          $scope.Notification.success({
            title: "Delete", 
            message: msg,
            position: "right", 
            duration: 2000 
          });
        }
        _.forEach(response.success, function(item, i){
          //var index = _.indexOf($scope.Selecteds, _.find($scope.Selecteds, {'id': image.id}));
          var remove = _.remove($scope.$parent.images, function(image) {
            return image.id == item.id;
          });
        });
        $scope.Selecteds = [];
        $scope.settings.images.Selecteds = $scope.Selecteds;
        $scope.$parent.ImagesDeleted();
      });
    }, function () {
      $scope.Notification.info({
        title: "Cancel", 
        message: 'Delete canceled',
        position: 'right',
        duration: 2000
      });
    });
  }

  $scope.show_photo = function(url){
    var win = window.open(url, "_blank", "toolbar=yes, scrollbars=yes, resizable=yes, top=200, left=200, width=600, height=600");
    win.focus();
  }

  var check_selects = function (){
    var count = 0;
    $scope.all_selected = false;
    $scope.all_unselected = true;
    if($scope.paginated_images) count = $scope.paginated_images.length;
    if(count>0){
      if($scope.Selecteds.length == count)
        $scope.all_selected = true;
      if($scope.Selecteds.length)
        $scope.all_unselected = false;
    }
  }

   $scope.ListOfTags = [
      { disabled: false, id: 0, value: "cv", label: "CV Image" },
      { disabled: false, id: 1, value: "main-id", label: "Main Id" },
      { disabled: false, id: 3, value: "whisker-left", label: "Whisker Left" },
      { disabled: false, id: 4, value: "whisker-right", label: "Whisker Right" },
      { disabled: false, id: 2, value: "marking", label: "Marking" },
      { disabled: false, id: 7, value: "whisker", label: "Whisker (No use in Algorithm)" },
      { disabled: false, id: 6, value: "full-body", label: "Full Body" }
  ];

  // Order by
  $scope.reverse = $scope.settings.images.reverse;
  $scope.predicate = $scope.settings.images.predicate;
  $scope.order = function(predicate) {
    $scope.reverse = ($scope.predicate === predicate) ? !$scope.reverse : false;
    $scope.predicate = predicate;
    $scope.settings.images.predicate = $scope.predicate;
    $scope.settings.images.reverse = $scope.reverse;
  };

  $scope.pageCount = function() {
    var total = $scope.filtered_images? $scope.filtered_images.length : 0;
    return Math.ceil(total/$scope.itemsPerPage);
  };
  $scope.setPage = function(n) {
    $scope.currentPage = n;
    $scope.settings.images.currentPage = $scope.currentPage;
  };
  $scope.prevPage = function() {
    if ($scope.currentPage > 0)
      $scope.setPage($scope.currentPage - 1);
  };
  $scope.nextPage = function() {
    if ($scope.currentPage < $scope.pageCount()-1)
      $scope.setPage($scope.currentPage + 1);
  };
  $scope.firstPage = function() {
    $scope.setPage(0)
  };
  $scope.lastPage = function() {
    if ($scope.currentPage < $scope.pageCount()-1)
      $scope.setPage($scope.pageCount()-1);
  };
  $scope.prevPageDisabled = function() {
    return $scope.currentPage === 0 ? "disabled" : "";
  };
  $scope.nextPageDisabled = function() {
    return ($scope.currentPage === $scope.pageCount()-1 || !$scope.pageCount())? "disabled" : "";
  };
  $scope.range = function() {
    var rangeSize = Math.min(5, $scope.pageCount());
    var ret = [];
    var start = $scope.currentPage -3;
    if ( start < 0 ) start = 0;
    if ( start > $scope.pageCount()-(rangeSize-3) ) {
      start = $scope.pageCount()-rangeSize+1;
    }
    var max = Math.min(start+rangeSize,$scope.pageCount());
    for (var i=start; i<max; i++) {
      ret.push(i);
    }
    return ret;
  };

  $scope.setRange = function(){
    $scope.range();
  }

  $scope.Selecteds = [];
  _.forEach($scope.settings.images.Selecteds, function(selected) {
    if(selected != undefined){
      var sel_image = _.find($scope.$parent.images, function(image) {
        return image.id == selected.id;
      });
      if(sel_image){
        sel_image.selected = true;
        $scope.Selecteds.push(sel_image);
      }
    }
  });
  $scope.settings.images.Selecteds = $scope.Selecteds;

  check_selects();

  $scope.setPage($scope.settings.images.currentPage);

}])
;
