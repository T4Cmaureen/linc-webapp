'use strict';

angular.module('lion.guardians.upload.images.controller', ['lion.guardians.upload.images.directive', 'lion.guardians.thumbnail.directive'])

.controller('UploadImagesCtrl', ['$scope', '$window', '$cookies', '$uibModalInstance', 'FileUploader', 'NotificationFactory', 'options', function ($scope, $window, $cookies, $uibModalInstance, FileUploader, NotificationFactory, options) {

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

  $scope.Types = {'Images' : [{"value":"cv","label":"CV Image"},
                             {"value":"full-body","label":"Full Body"},
                             {"value":"whisker","label":"Whisker"},
                             {"value":"main-id","label":"Main Id"},
                             {"value":"markings","label":"Markings"}],
                'isPublic' : [{"value":true,"label":"Public"},
                                {"value":false,"label":"Private"}]};
  $scope.Init_Values = {
    ImageType: 'cv',
    isPublic: true,
    isCover: false
  }

  $scope.select = {
    isCover: '',
    imageset_id: $scope.imagesetId
  };

  var uploader = $scope.uploader = new FileUploader({
    url: '/images/upload'
  });

  $scope.headers = { 'Content-Type': 'application/json' };
  // FILTERS
  uploader.filters.push({
    name: 'imageFilter',
    fn: function(item /*{File|FileLikeObject}*/, options) {
      var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
      return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
    }
  });
  //uploader.headers = {'_xsrf': $cookies.get('_xsrf')};
  // CALLBACKS
  uploader.onWhenAddingFileFailed = function(item /*{File|FileLikeObject}*/, filter, options) {
    console.info('onWhenAddingFileFailed', item, filter, options);
  };
  uploader.onAfterAddingFile = function(fileItem) {
    console.info('onAfterAddingFile', fileItem);
  };
  uploader.onAfterAddingAll = function(addedFileItems) {
    console.info('onAfterAddingAll', addedFileItems);
  };
  uploader.onBeforeUploadItem = function(item) {
    console.info('onBeforeUploadItem', item);

    var formData = [{'image_type' : item.file.ImageType},
                    {'is_public': item.file.isPublic},
                    {'image_set_id': $scope.select.imageset_id},
                    {'iscover': ($scope.select.isCover == item.$$hashKey)}];

    Array.prototype.push.apply(item.formData, formData);

  };
  uploader.onProgressItem = function(fileItem, progress) {
      console.info('onProgressItem', fileItem, progress);
  };
  uploader.onProgressAll = function(progress) {
      console.info('onProgressAll', progress);
  };
  uploader.onSuccessItem = function(fileItem, response, status, headers) {
      console.info('onSuccessItem', fileItem, response, status, headers);
  };
  uploader.onErrorItem = function(fileItem, response, status, headers) {
      console.info('onErrorItem', fileItem, response, status, headers);
  };
  uploader.onCancelItem = function(fileItem, response, status, headers) {
      console.info('onCancelItem', fileItem, response, status, headers);
  };
  uploader.onCompleteItem = function(fileItem, response, status, headers) {
      console.info('onCompleteItem', fileItem, response, status, headers);
  };
  uploader.onCompleteAll = function() {
      console.info('onCompleteAll');
      NotificationFactory.success({
        title: "Upload", message:'Images uploaded with success',
        position: "right", // right, left, center
        duration: 2000     // milisecond
      });
  };

  console.info('uploader', uploader);
}])
