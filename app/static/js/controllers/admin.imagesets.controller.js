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

angular.module('linc.admin.imagesets.controller', [])

.controller('AdminImageSetsCtrl', ['$scope', '$uibModal', 'CONST_LIST', 'TAGS_CONST', 
  function ($scope, $uibModal, CONST_LIST, TAGS_CONST) {

  $scope.ImageSet_Mode  =  $scope.settings.imagesets.Mode;

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

  $scope.check_all = function (val){
    _.forEach($scope.$parent.imagesets, function(imageset) {
      imageset.selected = val;
      if(imageset.selected){
        if(!_.some($scope.Selecteds, imageset))
          $scope.Selecteds.push(imageset);
      }
    });
    if(!val){
      $scope.Selecteds = [];
      $scope.settings.imagesets.Selecteds = $scope.Selecteds;
    }
    check_selects();
  }

  var lastSelId = -1;
  $scope.Select_Imageset = function ($event, imageset, type){
    if(type == 'line-click'){
      imageset.selected = !imageset.selected;
    }
    var shiftKey = $event.shiftKey;
    if(shiftKey && lastSelId>=0){
      var index0 = _.findIndex($scope.ordered_imagesets, {'id': lastSelId});
      var index1 = _.findIndex($scope.ordered_imagesets, {'id': imageset.id});
      var first = Math.min(index0, index1);
      var second = Math.max(index0, index1);
      for(var i = first; i <= second; i++){
        var imgset = $scope.ordered_imagesets[i];
        imgset.selected = imageset.selected;
        if(imageset.selected){
          if(!_.some($scope.Selecteds, imgset))
            $scope.Selecteds.push(imgset);
        }
        else {
          $scope.Selecteds = _.without($scope.Selecteds, imgset);
          $scope.settings.imagesets.Selecteds = $scope.Selecteds;
        }
      }
    }
    else{
      lastSelId = imageset.id;
      if(imageset.selected){
        if(!_.some($scope.Selecteds, imageset))
          $scope.Selecteds.push(imageset);
      }
      else {
        $scope.Selecteds = _.without($scope.Selecteds, imageset);
        $scope.settings.imagesets.Selecteds = $scope.Selecteds;
      }
    }
    check_selects();
  }

  $scope.Add_ImageSet = function () {
    $scope.ImageSet_Mode = 'add';
    $scope.check_all(false);

    var modalScope = $scope.$new();
    modalScope.title = 'Add ImageSet';

    modalScope.dataSending = false;
    modalScope.showValidationMessages = false;

    modalScope.organizations = angular.copy($scope.$parent.organizations);
    modalScope.lions = angular.copy($scope.$parent.lions);
    modalScope.images = angular.copy($scope.$parent.images);

    modalScope.imageset = { 
      'lion_id': undefined, 
      'main_image_id': undefined, 
      'owner_organization_id': undefined,
      'uploading_organization_id': undefined, 
      'uploading_user_id': undefined, 
      'latitude' : '', 'longitude' : '',
      'date_stamp': new Date(),
      'date_of_birth': new Date(),
      'gender': '', 
      'tags': [], 
      'notes': '', 
      'is_verified': false, 
      'selected': true,
      'geopos_private': false
    };
    modalScope.imageset.main_image = '';
    modalScope.imageset.lion_id = undefined;

    var modalInstance = $uibModal.open({
        templateUrl: 'Edit_ImageSet.tpl.html',
        scope: modalScope,
        size: 'lg'
    });

    modalInstance.result.then(function (result) {
      $scope.ImageSet_Mode = '';
      modalScope.dataSending = false;
    }, function (){
      $scope.ImageSet_Mode = '';
      modalScope.dataSending = false;
    });

    modalScope.onSelected = function (item, model){
      modalScope.imageset.main_image = (item && item.url) ? item.url : '';
      modalScope.imageset.main_image_id = ((item && item.id) ? item.id : undefined);
      console.log('main_image_id: ' + modalScope.imageset.main_image_id);
    };

    modalScope.submit = function (valid){
      if(valid){

        var eye_dam = _.includes(modalScope.imageset.eye_damage,'NONE') ? ['EYE_DAMAGE_NONE'] : _.intersection(modalScope.imageset.eye_damage,['EYE_DAMAGE_YES']);
        var broken_teeth = _.includes(modalScope.imageset.broken_teeth,'NONE') ? ['TEETH_BROKEN_NONE'] : _.intersection(modalScope.imageset.broken_teeth, TAGS_CONST['TEETH_BROKEN']);
        var ear_marking = _.includes(modalScope.imageset.ear_marking,'NONE') ? ['EAR_MARKING_NONE'] : (_.isEmpty(_.difference(['EAR_MARKING_LEFT','EAR_MARKING_RIGHT'], modalScope.imageset.ear_marking)) ? ["EAR_MARKING_BOTH"] : _.intersection(modalScope.imageset.ear_marking,['EAR_MARKING_LEFT','EAR_MARKING_RIGHT']));
        var mouth_marking = _.includes(modalScope.imageset.mouth_marking,'NONE') ? ['MOUTH_MARKING_NONE'] : _.intersection(modalScope.imageset.mouth_marking,['MOUTH_MARKING_YES']);
        var tail_marking = _.includes(modalScope.imageset.tail_marking,'NONE') ? ['TAIL_MARKING_MISSING_TUFT_NONE'] : _.intersection(modalScope.imageset.tail_marking,['TAIL_MARKING_MISSING_TUFT_YES']);
        var scars = _.includes(modalScope.imageset.scars,'NONE')? ['SCARS_NONE'] : _.intersection(modalScope.imageset.scars,TAGS_CONST['SCARS']);

        var concat = _.concat(eye_dam, broken_teeth, ear_marking, tail_marking, mouth_marking, scars);
        if(modalScope.imageset.nose_color != undefined)
          concat = _.concat(concat, modalScope.imageset.nose_color);
        var TAGS = JSON.stringify(concat);
        if(!concat.length) TAGS = "null";

        var latitude = isNaN(parseFloat(modalScope.imageset.latitude)) ? null : parseFloat(modalScope.imageset.latitude);
        var longitude = isNaN(parseFloat(modalScope.imageset.longitude)) ? null : parseFloat(modalScope.imageset.longitude);

        var data = {
          'lion_id': (modalScope.imageset.lion_id != undefined) ? modalScope.imageset.lion_id : null,
          'main_image_id': modalScope.imageset.main_image_id,
          'gender': modalScope.imageset.gender,
          'notes': modalScope.imageset.notes,
          'owner_organization_id': modalScope.imageset.owner_organization_id,
          'uploading_user_id': modalScope.imageset.uploading_user_id,
          'latitude': latitude,
          'longitude': longitude,
          'date_stamp': modalScope.imageset.date_stamp,
          'date_of_birth': modalScope.imageset.date_of_birth,
          'tags': TAGS,
          'is_verified': modalScope.imageset.is_verified,
          'geopos_private': modalScope.imageset.geopos_private
        };
        if(data.lion_id){
          if(data.owner_organization_id == _.result(_.find(modalScope.lions, {'id': data.lion_id}),'organization_id')){
            data['is_verified'] = true;
          }
        }else{
          data['is_verified'] = false;
        }
        modalScope.dataSending = true;
        $scope.LincApiServices.ImageSets({'method': 'post', 'data': data}).then(function(response){
          $scope.Notification.success({
            title: 'Image Set Info', 
            message: 'New Image Set successfully created',
            position: "right",
            duration: 2000
          });
          var imageset = response.data;
          var id = imageset.lion_id;
          var lion = _.find($scope.$parent.lions, {'id': id});
          imageset.lion_name = (lion == undefined)? '-' : lion.name;
          id = imageset.owner_organization_id;
          var owner_organization = _.find($scope.$parent.organizations, {'id': id});
          imageset.owner_organization = (owner_organization == undefined)? '-' : owner_organization.name;
          id = imageset.uploading_organization_id;
          var uploading_organization = _.find($scope.$parent.organizations, {'id': id});
          imageset.uploading_organization = (uploading_organization == undefined)? '-' : uploading_organization.name;
          id = imageset.uploading_user_id;
          var uploading_user = _.find($scope.$parent.users, {'id': id});
          imageset.uploading_user = (uploading_user == undefined)? '-' : uploading_user.email;
          id = imageset.main_image_id;
          var main_image = _.find($scope.$parent.images, {'id': id});
          imageset.main_image = (main_image == undefined)? '' : main_image.url;
          imageset.selected = true;

          $scope.$parent.imageset.push(imageset);
          $scope.Selecteds.push(imageset);
          modalInstance.close();
        },
        function(error){
          $scope.Notification.error({
            title: "Fail", 
            message: 'Fail to create new Image Set',
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
    };
  };

  $scope.Edit_ImageSet = function(){
    if($scope.Selecteds.length == 1){
      $scope.ImageSet_Mode = 'edit';
      
      var modalScope = $scope.$new();
      modalScope.title = 'Edit ImageSet';

      modalScope.dataSending = false;
      modalScope.showValidationMessages = false;

      modalScope.organizations = angular.copy($scope.$parent.organizations);
      modalScope.lions = angular.copy($scope.$parent.lions);
      //modalScope.images = angular.copy($scope.$parent.images);

      modalScope.imageset = angular.copy($scope.Selecteds[0]);
      modalScope.imageset.main_image = '';

      modalScope.images = _.filter($scope.$parent.images, function(image){
        return (image.image_set_id == modalScope.imageset.id);
      });

      if(modalScope.imageset.main_image_id){
        var main_image = _.find(modalScope.images, {'id': modalScope.imageset.main_image_id});
        modalScope.imageset.main_image = (main_image == undefined)? '' : main_image.url;
        modalScope.imageset.image = main_image;
      }
      var TAGS = [];
      try{
        TAGS = JSON.parse(modalScope.imageset.tags);
      }catch(e){
        TAGS = modalScope.imageset.tags.split(",");
      }

      modalScope.imageset.eye_damage = _.includes(TAGS,'EYE_DAMAGE_NONE') ? ['NONE'] : _.intersection(TAGS,['EYE_DAMAGE_YES']);
      modalScope.imageset.broken_teeth = _.includes(TAGS,'TEETH_BROKEN_NONE') ? ['NONE'] : _.intersection(TAGS, TAGS_CONST['TEETH_BROKEN']);
      modalScope.imageset.ear_marking = _.includes(TAGS,'EAR_MARKING_NONE')? ['NONE'] : (_.includes(TAGS,'EAR_MARKING_BOTH') ? ['EAR_MARKING_LEFT', 'EAR_MARKING_RIGHT'] : _.intersection(TAGS,TAGS_CONST['ear_marking']));
      modalScope.imageset.mouth_marking = _.includes(TAGS,'MOUTH_MARKING_NONE') ? ['NONE'] : _.intersection(TAGS,['MOUTH_MARKING_YES']);
      modalScope.imageset.tail_marking = _.includes(TAGS,'TAIL_MARKING_MISSING_TUFT_NONE') ? ['NONE'] : _.intersection(TAGS,['TAIL_MARKING_MISSING_TUFT_YES']);
      modalScope.imageset.nose_color = _.intersection(TAGS, TAGS_CONST['NOSE_COLOUR'])[0];
      modalScope.imageset.scars = _.includes(TAGS,'SCARS_NONE')? ['NONE'] : _.intersection(TAGS,TAGS_CONST['SCARS']);

      var modalInstance = $uibModal.open({
          templateUrl: 'Edit_ImageSet.tpl.html',
          scope: modalScope,
          size: 'lg'
      });

      modalInstance.result.then(function (result) {
        $scope.ImageSet_Mode = '';
        modalScope.dataSending = false;
      }, function (){
        $scope.ImageSet_Mode = '';
        modalScope.dataSending = false;
      });

      modalScope.onSelected = function (item, model){
        modalScope.imageset.main_image = (item && item.url) ? item.url : '';
        modalScope.imageset.main_image_id = ((item && item.id) ? item.id : null);
        console.log('main_image_id: ' + modalScope.imageset.main_image_id);
      };
      
      modalScope.submit = function(valid){
        if(valid){

          var eye_dam = _.includes(modalScope.imageset.eye_damage,'NONE') ? ['EYE_DAMAGE_NONE'] : _.intersection(modalScope.imageset.eye_damage,['EYE_DAMAGE_YES']);
          var broken_teeth = _.includes(modalScope.imageset.broken_teeth,'NONE') ? ['TEETH_BROKEN_NONE'] : _.intersection(modalScope.imageset.broken_teeth, TAGS_CONST['TEETH_BROKEN']);
          var ear_marking = _.includes(modalScope.imageset.ear_marking,'NONE') ? ['EAR_MARKING_NONE'] : (_.isEmpty(_.difference(['EAR_MARKING_LEFT','EAR_MARKING_RIGHT'], modalScope.imageset.ear_marking)) ? ["EAR_MARKING_BOTH"] : _.intersection(modalScope.imageset.ear_marking,['EAR_MARKING_LEFT','EAR_MARKING_RIGHT']));
          var mouth_marking = _.includes(modalScope.imageset.mouth_marking,'NONE') ? ['MOUTH_MARKING_NONE'] : _.intersection(modalScope.imageset.mouth_marking,['MOUTH_MARKING_YES']);
          var tail_marking = _.includes(modalScope.imageset.tail_marking,'NONE') ? ['TAIL_MARKING_MISSING_TUFT_NONE'] : _.intersection(modalScope.imageset.tail_marking,['TAIL_MARKING_MISSING_TUFT_YES']);
          var scars = _.includes(modalScope.imageset.scars,'NONE')? ['SCARS_NONE'] : _.intersection(modalScope.imageset.scars,TAGS_CONST['SCARS']);

          var concat = _.concat(eye_dam, broken_teeth, ear_marking, tail_marking, mouth_marking, scars);
          if(modalScope.imageset.nose_color != undefined)
            concat = _.concat(concat, modalScope.imageset.nose_color);
          var TAGS = JSON.stringify(concat);

          var latitude = isNaN(parseFloat(modalScope.imageset.latitude)) ? null : parseFloat(modalScope.imageset.latitude);
          var longitude = isNaN(parseFloat(modalScope.imageset.longitude)) ? null : parseFloat(modalScope.imageset.longitude);

          var data = {
            'lion_id': (modalScope.imageset.lion_id != undefined) ? modalScope.imageset.lion_id : null,
            'main_image_id': modalScope.imageset.main_image_id,
            'gender': modalScope.imageset.gender,
            'notes': modalScope.imageset.notes,
            'owner_organization_id': modalScope.imageset.owner_organization_id,
            'uploading_user_id': modalScope.imageset.uploading_user_id,
            'latitude': latitude,
            'longitude': longitude,
            'date_stamp': modalScope.imageset.date_stamp,
            'date_of_birth': modalScope.imageset.date_of_birth,
            'tags': TAGS,
            'is_verified': modalScope.imageset.is_verified,
            'geopos_private': modalScope.imageset.geopos_private
          };
          if(data.lion_id){
            if(data.owner_organization_id == _.result(_.find(modalScope.lions, {'id': data.lion_id}),'organization_id')){
              data['is_verified'] = true;
            }
          }else{
            data['is_verified'] = false;
          }
          modalScope.dataSending = true;
          $scope.LincApiServices.ImageSets({'method': 'put', 'imageset_id' : modalScope.imageset.id, 'data': data}).then(function(response){
            $scope.Notification.success({
              title: 'Image Set Info', 
              message: 'Image Set data successfully updated',
              position: "right",
              duration: 2000 
            });

            var imageset = $scope.Selecteds[0];
            _.merge(imageset, imageset, response.data);
            var id = imageset.lion_id;
            var lion = _.find($scope.$parent.lions, {'id': id});
            imageset.lion_name = (lion == undefined)? '-' : lion.name;
            id = imageset.owner_organization_id;
            var owner_organization = _.find($scope.$parent.organizations, {'id': id});
            imageset.owner_organization = (owner_organization == undefined)? '-' : owner_organization.name;
            id = imageset.uploading_organization_id;
            var uploading_organization = _.find($scope.$parent.organizations, {'id': id});
            imageset.uploading_organization = (uploading_organization == undefined)? '-' : uploading_organization.name;
            id = imageset.uploading_user_id;
            var uploading_user = _.find($scope.$parent.users, {'id': id});
            imageset.uploading_user = (uploading_user == undefined)? '-' : uploading_user.email;
            id = imageset.main_image_id;
            var main_image = _.find($scope.$parent.images, {'id': id});
            imageset.main_image = (main_image == undefined)? '' : main_image.url;
            $scope.$parent.ImageSetsUpdated();
            modalInstance.close();
          },
          function(error){
            $scope.Notification.error({
              title: "Fail", 
              message: 'Fail to change Image Set data',
              position: 'right', 
              duration: 5000 
            });
            modalInstance.dismiss();
          });
        }
        else {
          modalScope.showValidationMessages = true;
        }
      }
      modalScope.cancel = function(){
        modalInstance.dismiss();
      };
    }
  }

  $scope.Delete_ImageSet = function() {
    $scope.DialogDelete('Image Sets')
    .then(function (result) {
      var imagesets_id = _.map($scope.Selecteds, 'id');

      $scope.LincApiServices.ImageSets({'method': 'delete', 'imagesets_id': imagesets_id}).then(function(response){
        if(response.error.length>0){
          var data = _.map(response.error, 'id');
          var msg = (data.length>1) ? 'Unable to delete imagesets ' + data : 'Unable to delete imageset ' + data;
          $scope.Notification.error({
            title: "Delete", 
            message: msg,
            position: "right", 
            duration: 2000 
          });
        }
        else if(response.success.length>0){
          var msg = (response.success.length>1) ? 'Imagesets successfully deleted' : 'Imageset successfully deleted';
          $scope.Notification.success({
            title: "Delete", 
            message: msg,
            position: "right",
            duration: 2000 
          });
        }
        _.forEach(response.success, function(item, i){
          var remove = _.remove($scope.$parent.imagesets, function(imageset) {
            return imageset.id == item.id;
          });
        });
        $scope.Selecteds = [];
        $scope.settings.imagesets.Selecteds = $scope.Selecteds;
        $scope.$parent.ImageSetsUpdated();
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

  var check_selects = function (){
    var count = 0;
    $scope.all_selected = false;
    $scope.all_unselected = true;
    if($scope.ordered_imagesets) count = $scope.ordered_imagesets.length;
    if(count>0){
      if($scope.Selecteds.length == count)
        $scope.all_selected = true;
      if($scope.Selecteds.length)
        $scope.all_unselected = false;
    }
  }

  // Order by
  $scope.reverse = $scope.settings.imagesets.reverse;
  $scope.predicate = $scope.settings.imagesets.predicate;
  $scope.order = function(predicate) {
    $scope.reverse = ($scope.predicate === predicate) ? !$scope.reverse : false;
    $scope.predicate = predicate;
    $scope.settings.imagesets.predicate = $scope.predicate;
    $scope.settings.imagesets.reverse = $scope.reverse;
  };

  $scope.Selecteds = [];
  _.forEach($scope.settings.imagesets.Selecteds, function(selected) {
    if(selected != undefined){
      var sel_imageset = _.find($scope.$parent.imagesets, function(imageset) {
        return imageset.id == selected.id;
      });
      if(sel_imageset){
        sel_imageset.selected = true;
        $scope.Selecteds.push(sel_imageset);
      }
    }
  });
  $scope.settings.imagesets.Selecteds = $scope.Selecteds;

  check_selects();


  var items = [];
  for (var i = 0; i < 10000; i++) {
    var person = {
      name: 'Adam' + i,
      email: 'adam' + i + '@email.com',
      age: 12,
      country: 'United States'
    };
    items.push(person);
  }
  $scope.all = {items: items};

  $scope.multipleDemo = {};
  $scope.multipleDemo.singleSelectedPerson = $scope.all.items[500];
}]);
