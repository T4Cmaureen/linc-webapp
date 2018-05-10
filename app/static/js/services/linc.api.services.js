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
angular.module('linc.api.services', [])

.factory('LincApiServices', ['$http', '$state', '$q', '$cookies', 'AuthService', 'NotificationFactory', function($http, $state, $q, $cookies, AuthService, NotificationFactory) {

  var debug = ($state.current.data == undefined) ? false : ($state.current.data.debug || false);

  var HTTP = function (metod, url, data, config, success, error) {
    AuthService.chech_auth().then( function(resp){
      if(metod == 'GET'){
        $http.get(url, config).then(success, error);
      }
      else{
        var xsrfcookie = $cookies.get('_xsrf');
        var req = { method: metod, url: url, data: data,
          headers: { 'Content-Type': 'application/json','X-XSRFToken' : xsrfcookie}, config: config};
          $http(req).then(success, error);
      }
    },error);
  };

  var http_defer = function (id,data){
    var deferred = $q.defer();
    var xsrfcookie = $cookies.get('_xsrf');
    var req = { method: data.method,
                url: data.url,
                data: data.data,
                headers: { 'Content-Type': 'application/json','X-XSRFToken' : xsrfcookie},
                config: {ignoreLoadingBar: true}};
    AuthService.chech_auth().then( function(resp){
      $http(req).then(function(response){
        var data = {'id': id, 'data': response.data};
        deferred.resolve({'success': true, 'data': data});
      }, function(response){
        var data = {'id': id, 'data': response.data};
        deferred.resolve({'success': false, 'data': data});
      });
    },function(error){
      deferred.reject(error);
    });
    return deferred.promise;
  };

  var Organizations = function (data_in) {
    var deferred = $q.defer();
    if(data_in.method=='get'){
      var url = '/organizations';
      HTTP('GET', url, null, {},
      function (results){
        var data = results.data.data;
        var organizations = _.map(data, function(org) {
          org.created_at = org.created_at ? new Date(org.created_at) : null;
          org.updated_at = org.updated_at ? new Date(org.created_at) : null;
          return _.extend({}, org, {'selected': false});
        });
        deferred.resolve(organizations);
      }, function(error){
        if(debug || (error.status != 401 && error.status != 403)){
          NotificationFactory.error({
            title: "Error", message: 'Unable to load Organizations',
            position: 'right', // right, left, center
            duration: 5000   // milisecond
          });
        }
        deferred.reject(error);
      });
    }
    if(data_in.method=='put'){
      var organization_id = data_in.organization_id;
      var data = data_in.data;
      HTTP('PUT', '/organizations/' + organization_id, data, {},
      function (response) {
        deferred.resolve(response.data);
      },
      function(error){
        if(debug || (error.status != 401 && error.status != 403)){
          NotificationFactory.error({
            title: "Error", message: 'Unable to Save Organizations data',
            position: 'right', // right, left, center
            duration: 5000   // milisecond
          });
        }
        deferred.reject(error);
      });
    }
    if(data_in.method=='post'){
      var data = data_in.data;
      HTTP('POST', '/organizations/', data, {},
      function (response) {
        deferred.resolve(response.data);
      },
      function(error){
        if(debug || (error.status != 401 && error.status != 403)){
          NotificationFactory.error({
            title: "Error", message: 'Unable to Create New Organization',
            position: 'right', // right, left, center
            duration: 5000   // milisecond
          });
        }
        deferred.reject(error);
      });
    }
    if(data_in.method=='delete'){
      var promises = data_in.organizations_id.map(function(id) {
        var data = {
          'method': 'DELETE',
          'url': '/organizations/' + id,
          'data': {}
        };
        return http_defer(id,data);
      });
      $q.all(promises).then(function (results) {
        var success = [];
        var error = [];
        _.forEach(results, function (result, index){
          if (result.success) {
            success.push(result.data);
          }
          else{
            error.push(result.data);
          }
        });
        deferred.resolve({'success': success, 'error': error});
      },
      function (reason) {
        deferred.reject(reason);
      });
    }
    return deferred.promise;
  };

  var Users = function (data_in) {
    var deferred = $q.defer();
    if(data_in.method=='get'){
      var url = '/users';
      HTTP('GET', url, null, {},
      function (results){
        var data = results.data.data;
        var organizations = data_in.organizations;
        var users =  _.map(data, function(user) {
          user.created_at = user.created_at ? new Date(user.created_at) : null;
          user.updated_at = user.updated_at ? new Date(user.created_at) : null;

          user.current_sign_in_at ? new Date(user.current_sign_in_at) : null;
          user.last_sign_in_at ? new Date(user.last_sign_in_at) : null;

          var text =
          'Current Sign In At: ' + user.current_sign_in_at + ';<br>' +
          'Current Sign In Ip: ' + user.current_sign_in_ip + ';<br>' +
          'Last Sign In At: ' + user.last_sign_in_at + ';<br>' +
          'Last Sign In Ip: ' + user.last_sign_in_ip + ';<br>' +
          'Sign In Count: ' + user.sign_in_count;
          var tooltip = {'title': text, 'checked': true};

          var id = user.organization_id;
          var organization = _.find(organizations, {'id': id});
          if(organization != undefined){
            return _.extend({}, user, {'organization': organization['name'], 'tooltip': tooltip, 'selected': false});
          }
          else {
            return _.extend({}, user, {'organization': '-', 'selected': false});
          }
        });
        deferred.resolve(users);
      }, function(error){
        if(debug || (error.status != 401 && error.status != 403)){
          NotificationFactory.error({
            title: "Error", message: 'Unable to Get Users data',
            position: 'right', // right, left, center
            duration: 5000   // milisecond
          });
        }
        deferred.reject(error);
      });
    }
    if(data_in.method=='put'){
      var user_id = data_in.user_id;
      var data = data_in.data;
      HTTP('PUT', '/users/' + user_id, data, {},
      function (response) {
        deferred.resolve(response.data);
      },
      function(error){
        if(debug || (error.status != 401 && error.status != 403)){
          NotificationFactory.error({
            title: "Error", message: 'Unable to Save User data',
            position: 'right', // right, left, center
            duration: 5000   // milisecond
          });
        }
        deferred.reject(error);
      });
    }
    if(data_in.method=='post'){
      var data = data_in.data;
      HTTP('POST', '/users/', data, {},
      function (response) {
        deferred.resolve(response.data);
      },
      function(error){
        if(debug || (error.status != 401 && error.status != 403)){
          NotificationFactory.error({
            title: "Error", message: 'Unable to Create New User',
            position: 'right', // right, left, center
            duration: 5000   // milisecond
          });
        }
        deferred.reject(error);
      });
    }
    if(data_in.method=='delete'){
      var promises = data_in.users_id.map(function(id) {
        var data = {
          'method': 'DELETE',
          'url': '/users/' + id,
          'data': {}
        }
        return http_defer(id,data);
      });
      $q.all(promises).then(function (results) {
        var success = [];
        var error = [];
        _.forEach(results, function (result, index){
          if (result.success) {
            success.push(result.data);
          }
          else{
            error.push(result.data);
          }
        });
        deferred.resolve({'success': success, 'error': error});
      },
      function (reason) {
        deferred.reject(reason);
      });
    }
    return deferred.promise;
  };

  var Lions = function (data_in) {
    var deferred = $q.defer();
    if(data_in.method=='get'){
      var url = '/lions?api=true';
      HTTP('GET', url, null, {},
      function (results){
        var data = results.data.data;
        var organizations = data_in.organizations;
        var lions = _.map(data, function(lion) {
          lion.created_at = lion.created_at ? new Date(lion.created_at) : null;
          lion.updated_at = lion.updated_at ? new Date(lion.created_at) : null;

          var id = lion.organization_id;
          var organization = _.find(organizations, {'id': id});
          if(organization != undefined){
            return _.extend({}, lion, {'organization': organization['name'], 'selected': false});
          }
          else{
            return _.extend({}, lion, {'organization': '-', 'selected': false});
          }
        });
        deferred.resolve(lions);
      }, function(error){
        if(debug || (error.status != 401 && error.status != 403)){
          NotificationFactory.error({
            title: "Error", message: 'Unable to get Lions datas',
            position: 'right', // right, left, center
            duration: 5000   // milisecond
          });
        }
        deferred.reject(error);
      });
    }
    if(data_in.method=='put'){
      var lion_id = data_in.lion_id;
      var data = data_in.data;
      HTTP('PUT', '/lions/' + lion_id, data, {},
      function (response) {
        deferred.resolve(response.data);
      },
      function(error){
        if(debug || (error.status != 401 && error.status != 403)){
          NotificationFactory.error({
            title: "Error", message: 'Unable to Save Lion data',
            position: 'right', // right, left, center
            duration: 5000   // milisecond
          });
        }
        deferred.reject(error);
      });
    }
    if(data_in.method=='post'){
      var data = data_in.data;
      HTTP('POST', '/lions/', data, {},
      function (response) {
        deferred.resolve(response.data);
      },
      function(error){
        if(debug || (error.status != 401 && error.status != 403)){
          NotificationFactory.error({
            title: "Error", message: 'Unable to Create New Lion',
            position: 'right', // right, left, center
            duration: 5000   // milisecond
          });
        }
        deferred.reject(error);
      });
    }
    if(data_in.method=='delete'){
      var promises = data_in.lions_id.map(function(id) {
        var data = {
          'method': 'DELETE',
          'url': '/lions/' + id,
          'data': {}
        };
        return http_defer(id,data);
      });
      $q.all(promises).then(function (results) {
        var success = [];
        var error = [];
        _.forEach(results, function (result, index){
          if (result.success) {
            success.push(result.data);
          }
          else{
            error.push(result.data);
          }
        });
        deferred.resolve({'success': success, 'error': error});
      },
      function (reason) {
        deferred.reject(reason);
      });
    }
    return deferred.promise;
  };

  var ImageSets = function (data_in) {
    var deferred = $q.defer();
    if(data_in.method=='get'){
      var url = '/imagesets';
      HTTP('GET', url, null, {},
      function (results){
        var data = results.data.data;
        var organizations = data_in.organizations;
        var lions = data_in.lions;
        var users = data_in.users;
        var images = data_in.images;
        var imagesets = _.map(data, function(imageset) {
          imageset.created_at = imageset.created_at ? new Date(imageset.created_at) : null;
          imageset.updated_at = imageset.updated_at ? new Date(imageset.created_at) : null;

          imageset.date_of_birth = imageset.date_of_birth ? new Date(imageset.date_of_birth) : null;
          imageset.date_stamp = imageset.date_stamp ? new Date(imageset.date_stamp) : null;

          var id = imageset.lion_id;
          var lion = _.find(lions, {'id': id});
          if(lion == undefined) lion = {'name': '-'};
          id = imageset.owner_organization_id;
          var owner_organization = _.find(organizations, {'id': id});
          if(owner_organization == undefined) owner_organization = {'name': '-'};
          id = imageset.uploading_organization_id;
          var uploading_organization = _.find(organizations, {'id': id});
          if(uploading_organization == undefined) uploading_organization = {'name': '-'};
          id = imageset.uploading_user_id;
          var uploading_user = _.find(users, {'id': id});
          if(uploading_user == undefined) uploading_user = {'email': '-'};
          id = imageset.main_image_id;
          var main_image = _.find(images, {'id': id});
          if(main_image == undefined) main_image = {'url': ''};

          return _.extend({}, imageset, {'lion_name': lion['name'], 'owner_organization': owner_organization['name'], 'uploading_organization': uploading_organization['name'], 'uploading_user': uploading_user['email'], 'main_image': main_image['url'], 'selected': false});
        });
        deferred.resolve(imagesets);
      }, function(error){
        if(debug || (error.status != 401 && error.status != 403)){
          NotificationFactory.error({
            title: "Error", message: 'Unable to get Image Sets datas',
            position: 'right', // right, left, center
            duration: 5000   // milisecond
          });
        }
        deferred.reject(error);
      });
    }
    if(data_in.method=='put'){
      var imageset_id = data_in.imageset_id;
      var data = data_in.data;
      HTTP('PUT', '/imagesets/' + imageset_id, data, {},
      function (response) {
        deferred.resolve(response.data);
      },
      function(error){
        if(debug || (error.status != 401 && error.status != 403)){
          NotificationFactory.error({
            title: "Error", message: 'Unable to Save Image Set data',
            position: 'right', // right, left, center
            duration: 5000   // milisecond
          });
        }
        deferred.reject(error);
      });
    }
    if(data_in.method=='post'){
      var data = data_in.data;
      HTTP('POST', '/imagesets/', data, {},
      function (response) {
        deferred.resolve(response.data);
      },
      function(error){
        if(debug || (error.status != 401 && error.status != 403)){
          NotificationFactory.error({
            title: "Error", message: 'Unable to Create New Image Set',
            position: 'right', // right, left, center
            duration: 5000   // milisecond
          });
        }
        deferred.reject(error);
      });
    }
    if(data_in.method=='delete'){
      var promises = data_in.imagesets_id.map(function(id) {
        var data = {
          'method': 'DELETE',
          'url': '/imagesets/' + id,
          'data': {}
        }
        return http_defer(id,data);
      });
      $q.all(promises).then(function (results) {
        var success = [];
        var error = [];
        _.forEach(results, function (result, index){
          if (result.success) {
            success.push(result.data);
          }
          else{
            error.push(result.data);
          }
        });
        deferred.resolve({'success': success, 'error': error});
      },
      function (reason) {
        deferred.reject(reason);
      });
    }
    return deferred.promise;
  };

  var Images = function (data_in) {
    var deferred = $q.defer();
    if(data_in.method=='get'){
      var url = '/images';
      HTTP('GET', url, null, {},
      function (results){
        var data = results.data.data;
        var images = _.map(data, function(image) {
          image.created_at = image.created_at ? new Date(image.created_at) : null;
          image.updated_at = image.updated_at ? new Date(image.created_at) : null;

          return _.extend({}, image, {'selected': false});
        });
        deferred.resolve(images);
      }, function(error){
        if(debug || (error.status != 401 && error.status != 403)){
          NotificationFactory.error({
            title: "Error", message: 'Unable to get Images datas',
            position: 'right', // right, left, center
            duration: 5000   // milisecond
          });
        }
        deferred.reject(error);
      });
    }
    if(data_in.method=='put'){
      var image_id = data_in.image_id;
      var data = data_in.data;
      HTTP('PUT', '/images/' + image_id, data, {},
      function (response) {
        deferred.resolve(response.data);
      },
      function(error){
        if(debug || (error.status != 401 && error.status != 403)){
          NotificationFactory.error({
            title: "Error", message: 'Unable to Save Images data',
            position: 'right', // right, left, center
            duration: 5000   // milisecond
          });
        }
        deferred.reject(error);
      });
    }
    if(data_in.method=='post'){
      var data = data_in.data;
      HTTP('POST', '/images/', data, {},
      function (response) {
        deferred.resolve(response.data);
      },
      function(error){
        if(debug || (error.status != 401 && error.status != 403)){
          NotificationFactory.error({
            title: "Error", message: 'Unable to Create New Images',
            position: 'right', // right, left, center
            duration: 5000   // milisecond
          });
        }
        deferred.reject(error);
      });
    }
    if(data_in.method=='delete'){
      var promises = data_in.images_id.map(function(id) {
        var data = {
          'method': 'DELETE',
          'url': '/images/' + id,
          'data': {}
        };
        return http_defer(id,data);
      });
      $q.all(promises).then(function (results) {
        var success = [];
        var error = [];
        _.forEach(results, function (result, index){
          if (result.success) {
            success.push(result.data);
          }
          else{
            error.push(result.data);
          }
        });
        deferred.resolve({'success': success, 'error': error});
      },
      function (reason) {
        deferred.reject(reason);
      });
    }
    return deferred.promise;
  };

  var CVRequests = function (data_in) {
    var deferred = $q.defer();
    if(data_in.method=='get'){
      var url = '/cvrequests';
      HTTP('GET', url, null, {},
      function (results){
        var data = results.data.data;
        var organizations = data_in.organizations;
        var cvrequests = _.map(data, function(cvrequest) {
          cvrequest.created_at = cvrequest.created_at ? new Date(cvrequest.created_at) : null;
          cvrequest.updated_at = cvrequest.updated_at ? new Date(cvrequest.updated_at) : null;
          var id = cvrequest.requesting_organization_id;
          var organization = _.find(organizations, {'id': id});
          return _.extend({}, cvrequest, {'requesting_organization': organization['name'], 'selected': false});
        });
        deferred.resolve(cvrequests);
      }, function(error){
        if(debug || (error.status != 401 && error.status != 403)){
          NotificationFactory.error({
            title: "Error", message: 'Unable to get CV Requests datas',
            position: 'right', // right, left, center
            duration: 5000   // milisecond
          });
        }
        deferred.reject(error);
      });
    }
    if(data_in.method=='put'){
      var cvrequest_id = data_in.cvrequest_id;
      var data = data_in.data;
      HTTP('PUT', '/cvrequests/' + cvrequest_id, data, {},
      function (response) {
        deferred.resolve(response.data);
      },
      function(error){
        if(debug || (error.status != 401 && error.status != 403)){
          NotificationFactory.error({
            title: "Error", message: 'Unable to Save CV Request data',
            position: 'right', // right, left, center
            duration: 5000   // milisecond
          });
        }
        deferred.reject(error);
      });
    }
    if(data_in.method=='post'){
      var data = data_in.data;
      HTTP('POST', '/cvrequests/', data, {},
      function (response) {
        deferred.resolve(response.data);
      },
      function(error){
        if(debug || (error.status != 401 && error.status != 403)){
          NotificationFactory.error({
            title: "Error", message: 'Unable to Create New CV Request',
            position: 'right', // right, left, center
            duration: 5000   // milisecond
          });
        }
        deferred.reject(error);
      });
    }
    if(data_in.method=='delete'){
      var promises = data_in.cvrequests_id.map(function(id) {
        var data = {
          'method': 'DELETE',
          'url': '/cvrequests/' + id,
          'data': {}
        };
        return http_defer(id,data);
      });
      $q.all(promises).then(function (results) {
        var success = [];
        var error = [];
        _.forEach(results, function (result, index){
          if (result.success) {
            success.push(result.data);
          }
          else{
            error.push(result.data);
          }
        });
        deferred.resolve({'success': success, 'error': error});
      },
      function (reason) {
        deferred.reject(reason);
      });
    }
    return deferred.promise;
  };

  var CVResults = function (data_in) {
    var deferred = $q.defer();
    if(data_in.method=='get'){
      var url = '/cvresults';
      HTTP('GET', url, null, {},
      function (results){
        var data = results.data.data;
        var cvresults = _.map(data, function(cvresult) {
          cvresult.created_at = cvresult.created_at ? new Date(cvresult.created_at) : null;
          cvresult.updated_at = cvresult.updated_at ? new Date(cvresult.created_at) : null;
          return _.extend({}, cvresult, {'selected': false});
        });
        deferred.resolve(cvresults);
      }, function(error){
        if(debug || (error.status != 401 && error.status != 403)){
          NotificationFactory.error({
            title: "Error", message: 'Unable to get CV Results datas',
            position: 'right', // right, left, center
            duration: 5000   // milisecond
          });
        }
        deferred.reject(error);
      });
    }
    if(data_in.method=='put'){
      var cvresult_id = data_in.cvresult_id;
      var data = data_in.data;
      HTTP('PUT', '/cvresults/' + cvresult_id, data, {},
      function (response) {
        deferred.resolve(response.data);
      },
      function(error){
        if(debug || (error.status != 401 && error.status != 403)){
          NotificationFactory.error({
            title: "Error", message: 'Unable to Save CV Result data',
            position: 'right', // right, left, center
            duration: 5000   // milisecond
          });
        }
        deferred.reject(error);
      });
    }
    if(data_in.method=='post'){
      var data = data_in.data;
      HTTP('POST', '/cvresults/', data, {},
      function (response) {
        deferred.resolve(response.data);
      },
      function(error){
        if(debug || (error.status != 401 && error.status != 403)){
          NotificationFactory.error({
            title: "Error", message: 'Unable to Create New CV Result',
            position: 'right', // right, left, center
            duration: 5000   // milisecond
          });
        }
        deferred.reject(error);
      });
    }
    if(data_in.method=='delete'){
      var promises = data_in.cvresults_id.map(function(id) {
        var data = {
          'method': 'DELETE',
          'url': '/cvresults/' + id,
          'data': {}
        };
        return http_defer(id,data);
      });
      $q.all(promises).then(function (results) {
        var success = [];
        var error = [];
        _.forEach(results, function (result, index){
          if (result.success) {
            success.push(result.data);
          }
          else{
            error.push(result.data);
          }
        });
        deferred.resolve({'success': success, 'error': error});
      },
      function (reason) {
        deferred.reject(reason);
      });
    }
    return deferred.promise;
  };

  //  dataFactory.UpdateUser = UpdateUser;*/
  var dataFactory = {};

  dataFactory.Organizations = Organizations;
  dataFactory.Users = Users;
  dataFactory.Lions = Lions;
  dataFactory.ImageSets = ImageSets;
  dataFactory.Images = Images;
  dataFactory.CVResults = CVResults
  dataFactory.CVRequests = CVRequests

  return dataFactory;
}]);
