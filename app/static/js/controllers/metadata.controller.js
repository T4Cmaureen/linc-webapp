'use strict';

angular.module('lion.guardians.metadata.controller', ['lion.guardians.metadata.directive'])

.controller('MetadataCtrl', ['$scope', '$window', '$uibModalInstance', '$bsTooltip', 'LincServices', 'NotificationFactory', 'optionsSet', '$state', '$q',  'organizations', function ($scope, $window, $uibModalInstance, $bsTooltip, LincServices, NotificationFactory, optionsSet, $state, $q, organizations) {

  $scope.debug = false;
  $scope.optionsSet = optionsSet;

  //$scope.optionsSet.isMetadata = true;
  $scope.organizations = organizations;
  var titles = {}; titles['lion'] = 'Metadata'; titles['imageset'] = 'Metadata';
  $scope.showLionName = (optionsSet.type === 'lion' || (optionsSet.type === 'imageset' && optionsSet.edit === 'edit'));
  $scope.isNew = (optionsSet.edit === 'new');
  $scope.lion_required = (optionsSet.type === 'lion');
  // Title
  $scope.title = titles[optionsSet.type];
  $scope.content = 'Form';

  $scope.Cancel = function () {
   $uibModalInstance.dismiss('cancel');
  };

  $scope.goto = function() {
    if(optionsSet.data.lion_id){
      $state.go("lion", { id: optionsSet.data.lion_id });
      $uibModalInstance.dismiss('cancel');
    }
  }

  var Metadata = function() {
    var selected = $scope.selected;
    var eyes_dams = _.includes(selected.eye_damage, "EYE_DAMAGE_LEFT", "EYE_DAMAGE_RIGHT") ? ["EYE_DAMAGE_BOTH"] : selected.eye_damage;
    var ear_marks = _.includes(selected.markings['ear'], "EAR_MARKING_LEFT", "EAR_MARKING_RIGHT") ? ["EAR_MARKING_BOTH"] : selected.markings['ear'];

    var concat = _([]).concat(eyes_dams);
    concat = _(concat).concat(ear_marks);
    concat = _(concat).concat(selected.markings['mount']);
    concat = _(concat).concat(selected.markings['tail']);
    concat = _(concat).concat(selected.broken_teeth);
    if(selected.nose_color != undefined)
      concat = _(concat).concat([selected.nose_color]);
    concat = _(concat).concat(selected.scars);
    var TAGS = JSON.stringify(concat.value());
    if(!concat.value().length) TAGS = "null";
    var data = {};
    if(optionsSet.edit === 'new'){
      if(optionsSet.type === 'lion'){
        var imageset_data = {
          "date_stamp": selected.date_stamp,
          "gender": selected.gender,
          "date_of_birth": selected.date_of_birth,
          "tags": TAGS,
          "notes": selected.notes,
          'latitude': isNaN(parseFloat(selected.latitude)) ? null : parseFloat(selected.latitude),
          'longitude': isNaN(parseFloat(selected.longitude)) ? null : parseFloat(selected.longitude),
          "lion_id": null,
          "main_image_id": null,
          "uploading_user_id": optionsSet.uploading_user_id,
          "owner_organization_id": optionsSet.owner_organization_id,
          "uploading_organization_id": optionsSet.uploading_organization_id,
          "is_primary": null,
          "is_verified": false
        }

        var lion_data = {
          "name": selected.name,
          "organization_id": selected.organization_id,
          "primary_image_set_id": '' // Fill after save imageset
        }
        data = {"lion": lion_data, "imageset": imageset_data};
      }
      else{
        var imageset_data = {
          "date_stamp": selected.date_stamp,
          'latitude': isNaN(parseFloat(selected.latitude)) ? null : parseFloat(selected.latitude),
          'longitude': isNaN(parseFloat(selected.longitude)) ? null : parseFloat(selected.longitude),
          "gender": selected.gender,
          "date_of_birth": selected.date_of_birth,
          "tags": TAGS,
          "notes": selected.notes,
          "lion_id": null,
          "main_image_id": null,
          "uploading_user_id": optionsSet.uploading_user_id,
          "owner_organization_id": optionsSet.owner_organization_id,
          "uploading_organization_id": optionsSet.uploading_organization_id,
          "is_primary": null,
          "is_verified": false
        }
        data = imageset_data;
      }
    }
    else{
      if(optionsSet.type === 'lion'){
        //Selected Dates
        var lion_sel_data = { "organization_id": selected.organization_id, "name" : selected.name };
        var imageset_sel_data = {
          "date_stamp": selected.date_stamp,
          'latitude': isNaN(parseFloat(selected.latitude)) ? null : parseFloat(selected.latitude),
          'longitude': isNaN(parseFloat(selected.longitude)) ? null : parseFloat(selected.longitude),
          "gender": selected.gender,
          "date_of_birth": selected.date_of_birth,
          "tags": TAGS,
          "notes": selected.notes
        };
        // Check Changed Datas
        var lion_data = _.reduce(lion_sel_data, function(result, n, key) {
          if (lion_sel_data[key] && lion_sel_data[key] != optionsSet.data[key]) {
              result[key] = lion_sel_data[key];
          }
          return result;
        }, {});
        var imageset_data = _.reduce(imageset_sel_data, function(result, n, key) {
          if (imageset_sel_data[key] && imageset_sel_data[key] != optionsSet.data[key]) {
              result[key] = imageset_sel_data[key];
          }
          return result;
        }, {});
        if(Object.keys(lion_data).length || Object.keys(imageset_data).length)
          data = {"lion": lion_data, "imageset": imageset_data, 'imagesetId': optionsSet.data.primary_image_set_id};
      }
      else{
        //Selected Dates
        var sel_data = {
          "owner_organization_id": selected.owner_organization_id,
          "date_stamp": selected.date_stamp,
          'latitude': isNaN(parseFloat(selected.latitude)) ? null : parseFloat(selected.latitude),
          'longitude': isNaN(parseFloat(selected.longitude)) ? null : parseFloat(selected.longitude),
          "gender": selected.gender,
          "date_of_birth": selected.date_of_birth,
          "tags": TAGS, 'notes': selected.notes
        };
        if($scope.showLionName){ sel_data.name = selected.name; }
        // Check Changed Datas
        var imageset_data = _.reduce(sel_data, function(result, n, key) {
          if (sel_data[key] && sel_data[key] != optionsSet.data[key]) {
              result[key] = sel_data[key];
          }
          return result;
        }, {});
        if(Object.keys(imageset_data).length)
          data = imageset_data;
      }
    }
    return data;
  };
  // Call LincServices to Save
  var Save_Metadata = function (data){
    var deferred = $q.defer();
    if(optionsSet.type === 'lion'){
      var id = optionsSet.data.id;
      LincServices.SaveLion(id, data, function(results){
        var data0 = _.merge({}, data.imageset, data.lion);
        delete data0._xsrf;
        if(_.has(data0, 'date_of_birth'))
          data0.age = getAge(data0['date_of_birth']);
        deferred.resolve({type: 'save', 'data': data0, 'title': 'Save', 'message': "Lion's Metadata saved with success"});
      },
      function(error){
        deferred.reject({'title': 'Error', 'message': "Unable to Save Lion's Metadata"});
      });
    }
    else{
      var id = optionsSet.data.id;
      LincServices.SaveImageset(id, data, function(results){
        delete data._xsrf;
        if(_.has(data, 'date_of_birth'))
          data.age = getAge(data['date_of_birth']);
        deferred.resolve({type: 'save', 'data': data, 'title': 'Save', 'message': "Image Set's Metadata saved with success"});
      },
      function(error){
        deferred.reject({'title': 'Error', 'message': "Unable to Save Image Set's Metadata"});
      });
    }
    return deferred.promise;
  };
  // Call LincServices to Create
  var Create_Metadata = function (data){
    var deferred = $q.defer();
    if(optionsSet.type === 'lion'){
      LincServices.CreateLion(data, function(results){
        var data0 = results.data.data;
        if(_.has(data0, 'date_of_birth'))
          data0.age = getAge(data0['date_of_birth']);
        deferred.resolve({type: 'create', 'data': data0, 'title': 'Create', 'message': "Lion's Metadata created with success"});
      },
      function(error){
        deferred.reject({'title': 'Error', 'message': "Unable to create new Lion's Metadata"});
      });
    }
    else{
      LincServices.CreateImageset(data, function(results){
        var data0 = results.data.data;
        if(_.has(data0, 'date_of_birth'))
          data0.age = getAge(data0['date_of_birth']);
        deferred.resolve({type: 'create', 'data': data0, 'title': 'Create', 'message': "Image Set's Metadata created with success"});
      },
      function(error){
        deferred.reject({'title': 'Error', 'message': "Unable to create new Image Set's Metadata"});
      });
    }
    return deferred.promise;
  };
  // Save Metadata
  $scope.SaveMetadata = function(){
    var data = Metadata();
    if(!Object.keys(data).length){
      NotificationFactory.warning({
        title: "Warning", message: "There is no change in the data",
        position: "right", // right, left, center
        duration: 2000     // milisecond
      });
    }
    else{
      Save_Metadata(data).then(function(result) {
        NotificationFactory.success({
          title: result.title, message: result.message,
          position: "right", // right, left, center
          duration: 2000     // milisecond
        });
        $uibModalInstance.close({'data': result.data});
      },
      function(result){
        NotificationFactory.error({
          title: result.title, message: result.message,
          position: 'right', // right, left, center
          duration: 5000   // milisecond
        });
        //$uibModalInstance.dismiss("error");
      });
    }
  }
  // Create New and Clsoe
  $scope.CreateClose = function(){
    var data = Metadata();
    Create_Metadata(data).then(function(result) {
      NotificationFactory.success({
        title: result.title, message: result.message,
        position: "right", // right, left, center
        duration: 2000     // milisecond
      });
      $uibModalInstance.close({'id': result.data.id});
    },
    function(result){
        NotificationFactory.error({
          title: result.title, message: result.message,
          position: 'right', // right, left, center
          duration: 5000   // milisecond
        });
    });
  };
  // Create New and Upload
  $scope.CreateUpload = function(){
    var deferred = $q.defer();
    var data = Metadata();
    Create_Metadata(data).then(function(result) {
      NotificationFactory.success({
        title: result.title, message: result.message,
        position: "right", // right, left, center
        duration: 2000     // milisecond
      });
      $scope.Id = result.data.id;
      $scope.Object_Created({'id': result.data.id});
      if(optionsSet.type === 'lion'){
        deferred.resolve({'imagesetId': result.data.primary_image_set_id});
      }
      else {
        deferred.resolve({'imagesetId': result.data.id});
      }
    },
    function(result){
      NotificationFactory.error({
        title: result.title, message: result.message,
        position: 'right', // right, left, center
        duration: 5000   // milisecond
      });
      deferred.reject({message: result.message});
    });
    return deferred.promise;
  };

  $scope.Close = function(){
    if($scope.Id){
      $uibModalInstance.close({'id': $scope.Id});
    }
    else{
      $uibModalInstance.dismiss('cancel');
    }
  }

  // Gender List
  $scope.genders = [{value: 'male', label: 'Male'}, {value: 'female',label: 'Female'}];
  // Markings List
  $scope.markings = [
    {value: 'ear',  label: 'Ear', allText : 'All Ear Markings',
        items: [ //{value: 'EAR_MARKING_BOTH}', label: 'Both'},
                {value: 'EAR_MARKING_LEFT',  label: 'Left'},
                {value: 'EAR_MARKING_RIGHT', label: 'Right'}
               ]},
    {value: 'mount', label: 'Mouth', allText: 'All Mouth Markings',
        items: [ {value: 'MOUTH_MARKING_BACK',  label: 'Back'},
                 {value: 'MOUTH_MARKING_FRONT', label: 'Front'},
                 {value: 'MOUTH_MARKING_LEFT',  label: 'Left'},
                 {value: 'MOUTH_MARKING_RIGHT', label: 'Right'} ]},
    {value: 'tail', label: 'Tail',  allText: 'All Tail Markings',
        items: [{value: 'TAIL_MARKING_MISSING_TUFT', label: 'Missing Tuft'}]}
  ];
  // Eye Markings
  $scope.eye_damage = [ //{value: 'EYE_DAMAGE_BOTH',  label: 'Both'}
    {value: 'EYE_DAMAGE_LEFT',  label: 'Left'}, {value: 'EYE_DAMAGE_RIGHT', label: 'Right'}];
  // Nose Color
  $scope.nose_color = [{value: undefined, label: 'None'}, {value: 'NOSE_COLOUR_BLACK', label: 'Black'},
    {value: 'NOSE_COLOUR_PATCHY',  label: 'Patchy'}, {value: 'NOSE_COLOUR_PINK', label: 'Pink'},
    {value: 'NOSE_COLOUR_SPOTTED', label: 'Spotted'}];
  // Broken Teeths
  $scope.broken_teeth = [{value: 'TEETH_BROKEN_CANINE_LEFT', label: 'Canine Left'},
    {value: 'TEETH_BROKEN_CANINE_RIGHT', label: 'Canine Right'}, {value: 'TEETH_BROKEN_INCISOR_LEFT', label: 'Incisor Left'}, {value: 'TEETH_BROKEN_INCISOR_RIGHT', label: 'Incisor Right'}];
  // Scars Markings
  $scope.scars = [{value: 'SCARS_BODY_LEFT', label: 'Body Left'}, {value: 'SCARS_BODY_RIGHT', label: 'Body Right'}, {value: 'SCARS_FACE', label: 'Face'}, {value: 'SCARS_TAIL', label: 'Tail'}];

  if(optionsSet.edit == 'edit'){

    //var TAGS = JSON.parse(optionsSet.data.tags);
    var TAGS = [];
    try{
      TAGS = JSON.parse(optionsSet.data.tags);
    }catch(e){
      TAGS = optionsSet.data.tags.split(",");
    }

    var eyes_dams = _.includes(_.intersection(TAGS,['EYE_DAMAGE_BOTH', 'EYE_DAMAGE_LEFT', 'EYE_DAMAGE_RIGHT']), 'EYE_DAMAGE_BOTH') ?  ['EYE_DAMAGE_LEFT', 'EYE_DAMAGE_RIGHT'] : _.intersection(TAGS,['EYE_DAMAGE_BOTH', 'EYE_DAMAGE_LEFT', 'EYE_DAMAGE_RIGHT']);
    var ear_marks = _.includes(_.intersection(TAGS, ['EAR_MARKING_BOTH', 'EAR_MARKING_LEFT', 'EAR_MARKING_RIGHT']),'EAR_MARKING_BOTH') ? ['EAR_MARKING_LEFT', 'EAR_MARKING_RIGHT'] : _.intersection(TAGS, ['EAR_MARKING_BOTH', 'EAR_MARKING_LEFT', 'EAR_MARKING_RIGHT']);

    //optionsSet.data.date_of_birth = (new Date(Date.parse(optionsSet.data.date_of_birth))).toJSON();
    try{
      optionsSet.data.date_of_birth = new Date(optionsSet.data.date_of_birth).toJSON().slice(0,10);
    }catch(e){
      optionsSet.data.date_of_birth = "";
    }
    try{
      optionsSet.data.date_stamp = new Date(optionsSet.data.date_stamp).toJSON().slice(0,10);
    }catch(e){
      optionsSet.data.date_stamp = "";
    }
    //optionsSet.data.name = optionsSet.data.name == '-' ? '': optionsSet.data.name;
    $scope.selected = {
      "name": optionsSet.data.name,
      "date_stamp": optionsSet.data.date_stamp,
      "owner_organization_id": optionsSet.data.owner_organization_id,
      "organization_id": optionsSet.data.organization_id,
      "date_of_birth": optionsSet.data.date_of_birth,
      "latitude": optionsSet.data.latitude,
      "longitude": optionsSet.data.longitude,
      "gender": optionsSet.data.gender,
      "eye_damage": eyes_dams,
      "broken_teeth": _.intersection(TAGS,['TEETH_BROKEN_CANINE_LEFT', 'TEETH_BROKEN_CANINE_RIGHT','TEETH_BROKEN_INCISOR_LEFT', 'TEETH_BROKEN_INCISOR_RIGHT']),
      "nose_color": (_.intersection(TAGS, ['NOSE_COLOUR_BLACK', 'NOSE_COLOUR_PATCHY', 'NOSE_COLOUR_PINK', 'NOSE_COLOUR_SPOTTED']))[0],
      "scars": _.intersection(TAGS, ['SCARS_BODY_LEFT', 'SCARS_BODY_RIGHT', 'SCARS_FACE']),
      "markings":{'ear': ear_marks,'mount': _.intersection(TAGS, ['MOUTH_MARKING_BACK', 'MOUTH_MARKING_FRONT','MOUTH_MARKING_LEFT', 'MOUTH_MARKING_RIGHT']),'tail': _.intersection(TAGS,['TAIL_MARKING_MISSING_TUFT'])},
      "notes": optionsSet.data.notes
    }
    $scope.selected.age = getAge($scope.selected.date_of_birth);

    $scope.tooltip = {'show_lion_name': (optionsSet.type === 'lion'),
                      'value': {'title': optionsSet.data.name + "'s Lion Page", 'checked': true}};
  }
  else
  {
    // Result Datas
    $scope.selected = { "name": "", "owner_organization_id": "",
                        "date_of_birth": new Date().toJSON().slice(0,10),
                        "date_stamp": new Date().toJSON().slice(0,10),
                        "latitude":"", "longitude": "", "gender": "",
                        "markings": {'ear': [],'mount': [],'tail': []},
                        "broken_teeth": [], "eye_damage": [],
                        "nose_color": undefined, "scars": [], "notes": "Notes here"
    };
    $scope.tooltip = {'show_lion_name': true};
  }
  // Calc Age Function
  function getAge(date) {
    var birthDate = new Date(Date.parse(date));
    var now = new Date();
    function isLeap(year) {
      return year % 4 == 0 && (year % 100 != 0 || year % 400 == 0);
    }
    //function isLeap(year) {
    //return(new Date(year, 1, 29).getMonth() == 1)
    //}
    // days since the birthdate
    var days = Math.floor((now.getTime() - birthDate.getTime())/1000/60/60/24);
    var age = 0;
    // iterate the years
    for (var y = birthDate.getFullYear(); y <= now.getFullYear(); y++){
      var daysInYear = isLeap(y) ? 366 : 365;
      if (days >= daysInYear){
        days -= daysInYear;
        age++;
        // increment the age only if there are available enough days for the year.
      }
    }
    return age;
  }
  $scope.Calc_Age = function(){
    $scope.selected.age = getAge($scope.selected.date_of_birth);
  }

}]);
