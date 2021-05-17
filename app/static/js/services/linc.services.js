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

angular.module('linc.services', [
	'linc.api.services',
	'linc.auth.services',
	'linc.data.factory',
	'linc.interceptor.factory',
	'linc.notification.factory',
	'modal.page.service'
])

.factory('LincServices', ['$rootscope', '$http', '$state', '$q', '$cookies', '$localStorage', '$interval', 'AuthService', 'PollerService', 'NotificationFactory',
  function($rootscope, $http, $state, $q, $cookies, $localStorage, $interval, AuthService, PollerService, NotificationFactory) {

	var $storage = $localStorage;
	var debug = ($state.current.data == undefined) ? false : ($state.current.data.debug || false);
	var HTTPGet = function (url, config){
		var deferred = $q.defer();
		AuthService.chech_auth().then( function(resp){
			$http.get(url, config).then( function(response){
				deferred.resolve(response.data);
			}, function(response){
				deferred.reject(response);
			});
		},function(err){
			deferred.reject(err);
		});
		return deferred.promise;
	};

	var databases = {};
			databases['lions'] =         {label: 'Lions', url: '/lions'};
			databases['organizations'] = {label: 'Organizations',  url: '/organizations'};
			databases['imagesets'] =     {label: 'Imagesets', url: '/imagesets'};
			databases['images'] =        {label: 'Images', url: '/images'};
	// Get All Imagesets List
	var GetAllImageSets = function () {
		var deferred = $q.defer();
		var url = databases['imagesets'].url + '/list';
		HTTPGet(url, {}).then(function (results) {
			deferred.resolve(results.data);
		},
		function (error) {
			if(debug || (error.status != 401 && error.status != 403)){
				NotificationFactory.error({
					title: "Error", message: 'Unable to load Imagesets data',
					position: 'right', // right, left, center
					duration: 5000   // milisecond
				});
			}
			if(error.status == 401 || error.status == 403){
				console.log("imageset resolve error");
				deferred.resolve({});
			}
			else{
				console.log("imageset reject error");
				deferred.reject(error);
			}
		});
		return deferred.promise;
	};

	var cachedData = {
		LionsList: []
	};

	$rootscope.$on("EmptyLionListCache", function(evt, data){
		cachedData.LionsList = [];
	});

	var ProcessAllLions = function(org){
		var deferred = $q.defer();
		var xsrfcookie = $cookies.get('_xsrf');
		var url = databases['lions'].url + '/list';
		if(org !== undefined)
			url = url + '?org_id=' + org;
		$http({ method: 'POST', url: url, data: {}, config: {},
			headers: { 'Content-Type': 'application/json', 'X-XSRFToken' : xsrfcookie} })
		.then(function (response) {
			deferred.resolve(response);
		}, function (error) {
			deferred.reject(error);
		});
		return deferred.promise;
	};

	var GetAllLions = function (org) {
		var deferred = $q.defer();
		if (!_.isEmpty(cachedData.LionsList)){
			var cached = cachedData.LionsList;
			deferred.resolve(cached);
		}
		else{
			ProcessAllLions(org).then(function(response){
				NotificationFactory.info({
					title: "Lion's data",
					message: "Please wait. Processing the lion's data",
					position: 'right',
					duration: 2000
				});
				$storage.token = response.data.data.token;
				var promise = null;
				var poller = function() {
					PollerService.lions_list($storage.token).then(function (response) {
						if (response.status == 200) {
							delete $storage.token;
							if (angular.isDefined(promise)) {
								$interval.cancel(promise);
								promise = undefined;
							}
							NotificationFactory.success({
								title: "Processing finished",
								message: "Returning the lions' data.",
								position: 'right',
								duration: 2000
							});
							cachedData.LionsList = response.data.data.data;
							deferred.resolve(cachedData.LionsList);
						}
						else if (response.status == 206) {
							NotificationFactory.info({
								title: "Lion's data",
								message: "Please wait. Processing the lion's data",
								position: 'right',
								duration: 2000
							});
						}
					});
				};
				poller();
				var promise = $interval(poller, 10000);
			}, function (error){
				if(debug || (error.status != 401 && error.status != 403)){
					NotificationFactory.error({
						title: "Error", message: 'Unable to load Lions datas',
						position: 'right', // right, left, center
						duration: 5000   // milisecond
					});
				}
				if(error.status == 401 || error.status == 403){
					console.log("lions resolve error");
					deferred.resolve({});
				}
				else{
					console.log("lions reject error");
					deferred.resolve({});
				}
			});
		}
		return deferred.promise;
	};
	// Get All Organizations List
	var GetAllOrganizations = function () {
		var deferred = $q.defer();
		var url = databases['organizations'].url + '/list';
		HTTPGet(url, {}).then(function (results) {
			deferred.resolve(results.data);
		},
		function (error) {
			if(debug || (error.status != 401 && error.status != 403)){
				NotificationFactory.error({
					title: "Error", message: 'Unable to load Lions data',
					position: 'right', // right, left, center
					duration: 5000   // milisecond
				});
			}
			if(error.status == 401 || error.status == 403){
				console.log("organizations resolve error");
				deferred.resolve({});
			}
			else{
				console.log("organizations reject error");
				deferred.reject(error);
			}
		});
		return deferred.promise;
	};

	// Get Imageset by Id
	var GetImageSet = function (id) {
		var deferred = $q.defer();
		var url = databases['imagesets'].url + '/' + id + '/profile';
		HTTPGet(url, {}).then(function (results) {
			deferred.resolve(results.data);
		},
		function (error) {
			if(debug || (error.status != 401 && error.status != 403)){
				NotificationFactory.error({
					title: "Error", message: 'Unable to load Imageset data',
					position: 'right', // right, left, center
					duration: 5000   // milisecond
				});
			}
			if(error.status == 401 || error.status == 403){
				console.log("imageset resolve error");
				deferred.resolve({});
			}
			else{
				console.log("imageset reject error");
				deferred.reject(error);
			}
		});
		return deferred.promise;
	};
	// Get Images Gallery
	var GetImageGallery = function (id) {
		var deferred = $q.defer();
		var url = databases['imagesets'].url + '/' + id + '/gallery';
		HTTPGet(url,{ignoreLoadingBar: true}).then(function (results) {
				deferred.resolve(results.data);
		},
		function (error) {
			if(debug || (error.status != 401 && error.status != 403)){
				NotificationFactory.error({
					title: "Error", message: 'Unable to load Image Gallery',
					position: 'right', // right, left, center
					duration: 5000   // milisecond
				});
			}
			if(error.status == 401 || error.status == 403){
				console.log("image gallery resolve error");
				deferred.resolve({});
			}
			else{
				console.log("image gallery reject error");
				deferred.reject(error);
			}
		});
		return deferred.promise;
	};
	// Get CV Request Requirements
	var CVRequirements = function(data){
		var deferred = $q.defer();
		var url = databases['imagesets'].url + '/' + data.id + '/cvrequirements';
		HTTPGet(url,{ignoreLoadingBar: true}).then(function (results) {
				deferred.resolve(results.data);
		},
		function (error) {
			if(debug || (error.status != 401 && error.status != 403 && error.status != 409)){
				NotificationFactory.error({
					title: "Error", message: 'Unable to load CV Requirements',
					position: 'right', // right, left, center
					duration: 5000   // milisecond
				});
			}
			if(error.status == 401 || error.status == 403){
				console.log("cv requirements resolve error");
				deferred.resolve({});
			}
			else if(error.status == 409){
				NotificationFactory.error({
					title: "Error",
					message: error.data.message,
					position: 'right', // right, left, center
					duration: 5000   // milisecond
				});
				url = databases['imagesets'].url + '/' + data.id + '/profile';
				$http.get(url, {ignoreLoadingBar: true}).then( function(response){
					error.imageset = response.data.data;
					deferred.reject(error);
				}, function(response){
					deferred.reject(response);
				});
			}
			else{
				console.log("cv requirements reject error");
				deferred.reject(error);
			}
		});
		// deferred.resolve({cv: true, whisker: true});
		return deferred.promise;
	};
	var GetLion = function (id) {
		var deferred = $q.defer();
		var url = databases['lions'].url + '/' + id + '/profile';
		HTTPGet(url, {}).then(function (results) {
			 deferred.resolve(results.data);
		},
		function (error) {
			if(debug || (error.status != 401 && error.status != 403)){
				NotificationFactory.error({
					title: "Error", message: 'Unable to load Lion data',
					position: 'right', // right, left, center
					duration: 5000   // milisecond
				});
			}
			if(error.status == 401 || error.status == 403){
				console.log("lion resolve error");
				deferred.resolve({});
			}
			else{
				console.log("lion reject error");
				deferred.reject(error);
			}
		});
		return deferred.promise;
	};
	// Get Lion History Locations
	var LocationHistory = function (id) {
		var deferred = $q.defer();
		var url = databases['lions'].url + '/' + id + '/locations';
		HTTPGet(url,{ignoreLoadingBar: true}).then(function (results) {
				deferred.resolve(results.data);
		},
		function (error) {
			if(debug || (error.status != 401 && error.status != 403)){
				NotificationFactory.error({
					title: "Error", message: 'Unable to load History Locations data',
					position: 'right', // right, left, center
					duration: 5000   // milisecond
				});
			}
			if(error.status == 401 || error.status == 403){
				console.log("locations resolve error");
				deferred.resolve({});
			}else{
				console.log("locations reject error");
				deferred.reject(error);
			}
		});
		return deferred.promise;
	};

	var Conservationists = function () {
		var deferred = $q.defer();
		var url = '/users/conservationists';
		HTTPGet(url, {}).then(function (results) {
			 deferred.resolve(results.data);
		},
		function (error) {
			if(debug || (error.status != 401 && error.status != 403)){
				NotificationFactory.error({
					title: "Error", message: 'Unable to load Conservationists data',
					position: 'right', // right, left, center
					duration: 5000   // milisecond
				});
			}
			if(error.status == 401 || error.status == 403){
				console.log("conservationists resolve error");
				deferred.resolve({});
			}else{
				console.log("conservationists reject error");
				deferred.reject(error);
			}
		});
		return deferred.promise;
	};

	var Download = function (data) {
		var deferred = $q.defer();
		var getFileNameFromHeader = function(header) {
			if (!header) return null;
			var result = header.split(";")[1].trim().split("=")[1];
			return result.replace(/"/g, '');
		};
		var req = {
			method: 'GET',
			url: databases['images'].url + data,
			headers: { accept: 'application/zip' },
			responseType: 'arraybuffer',
			cache: false,
			transformResponse: function(data, headers) {
				var zip = null;
				if (data) {
					 zip = new Blob([data], { type: 'application/zip' });
				}
				var fileName = getFileNameFromHeader(headers('Content-Disposition'));
				var result = { blob: zip, fileName: fileName };
				return result;
			}
		};

		AuthService.chech_auth().then( function(resp){
			$http(req, {ignoreLoadingBar: true}).then(function (response){
				deferred.resolve(response.data);
			},
			function (error) {
				if(debug || (error.status != 401 && error.status != 403)){
					NotificationFactory.error({
						title: "Error", message: 'Unable to Download Images',
						position: 'right', // right, left, center
						duration: 5000   // milisecond
					});
				}
				if(error.status == 401 || error.status == 403){
					console.log("downloads resolve error");
					deferred.resolve({});
				}else{
					console.log("downloads reject error");
					deferred.reject(error.data);
				}
			});

		},function(err){
			deferred.reject(err);
		});
		return deferred.promise;
	};

	var HTTP = function (method, url, data, config, success, error) {
		AuthService.chech_auth().then( function(resp){
			if(method == 'GET'){
				$http.get(url, config).then(success, error);
			}
			else{
				var xsrfcookie = $cookies.get('_xsrf');
				var req = {
					method: method, url: url, data: data,
					headers: { 'Content-Type': 'application/json','X-XSRFToken' : xsrfcookie},
					config: config
				};
				$http(req).then(success, error);
			}

		},function(err){
			error(err);
		});
	};

	// Get Lion Relative List
	var Relatives = function (data_in) {
		var deferred = $q.defer();
		var lion_id = data_in.lion_id;
		var url = '/relatives/' + lion_id;
		if(data_in.method=='GET'){
			HTTPGet(url, {}).then(function (results) {
				deferred.resolve(results.data);
			},
			function (error) {
				if(debug || error.status != 404){
					NotificationFactory.error({
						title: "Error", message: "Unable to load lions' relatives",
						position: 'right', // right, left, center
						duration: 5000   // milisecond
					});
				}
				console.log("relatives reject error");
				deferred.reject(error);
			});
		}
		else{
			cachedData.LionsList = [];
		}
		if(data_in.method=='POST'){
			var data = data_in.data;
			HTTP('POST', url, data, {}, function (response) {
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
		if(data_in.method=='PUT'){
			url += '/relatives/' + data_in.rel_id;
			var data = data_in.data;
			HTTP('PUT', url, data, {}, function (response) {
				deferred.resolve(response.data);
			},
			function(error){
				if(debug || (error.status != 401 && error.status != 403)){
					NotificationFactory.error({
						title: "Error", message: 'Unable to Update a Relation',
						position: 'right', // right, left, center
						duration: 5000   // milisecond
					});
				}
				deferred.reject(error);
			});
		}
		if(data_in.method=='DELETE'){
			url += '/relatives/' + data_in.rel_id;
			HTTP('DELETE', url, null, {},
			function (response) {
				deferred.resolve(response.data);
			},
			function(error){
				if(debug || (error.status != 401 && error.status != 403)){
					NotificationFactory.error({
						title: "Error", message: 'Unable to Delete a Relation',
						position: 'right', // right, left, center
						duration: 5000   // milisecond
					});
				}
				deferred.reject(error);
			});
		}
		return deferred.promise;
	};

	// Post Imageset (CV Request)
	var RequestCV = function (imageset_id, data, success) {
		// Clear Cached LionsList
		cachedData.LionsList = [];
		return HTTP('POST', '/imagesets/' + imageset_id + '/cvrequest', data, {}, success,
		function (error) {
			if(debug || (error.status != 401 && error.status != 403)){
				NotificationFactory.error({
					title: "Error", message: 'Request failed',
					position: 'right', // right, left, center
					duration: 5000   // milisecond
				});
				console.log(error.status);
			}
		});
	};

	// Put ImageSet (Update Imageset)
	var PutImageSet = function (imageset_id, data, success, error){
		// Clear Cached LionsList
		cachedData.LionsList = [];
		return HTTP('PUT', '/imagesets/' + imageset_id, data, {}, success, error);
	};

	// Post ImageSet - New Imageset
	var PostImageset = function (data, success, error){
		// Clear Cached LionsList
		cachedData.LionsList = [];
		return HTTP('POST', '/imagesets', data, {}, success, error);
	};

	// Put Lion (Update Lion)
	var PutLionImageset = function (lion_id, data, success, error){
		// Clear Cached LionsList
		cachedData.LionsList = [];
		AuthService.chech_auth().then( function(resp){
			var xsrfcookie = $cookies.get('_xsrf');
			var promises = [];
			// Imageset
			if(Object.keys(data.imageset).length){
				var data_imageset = data.imageset;
				//angular.merge(data_imageset, cookies);
				var req = { method: 'PUT', url: '/imagesets/' + data.imagesetId, data: data_imageset,
									headers: { 'Content-Type': 'application/json','X-XSRFToken' : xsrfcookie}, config: {ignoreLoadingBar: true}};
				promises.push($http(req));
			}
			// Lion
			if(Object.keys(data.lion).length){
				var data_lion = data.lion;
				//angular.merge(data_lion, cookies);
				req = { method: 'PUT', url: '/lions/' + lion_id, data: data_lion,
								headers: { 'Content-Type': 'application/json','X-XSRFToken' : xsrfcookie}, config: {ignoreLoadingBar: true}};
				promises.push($http(req));
			}
			$q.all(promises).then(function (results) {
				var dados = [];
				results.forEach( function (result, index) {
					dados.push(result.data.data);
				});
				success(dados);
			},
			function (reason) {
				error(reason);
			});

		},function(err){
			error(err);
		});
	};

	// Put Lion (Set Primary)
	var SetPrimary = function (lion_id, data, success, error){
		// Clear Cached LionsList
		cachedData.LionsList = [];
		return HTTP('PUT', '/lions/' + lion_id, data, {}, success, error);
	};

	// Post Lion - New Lion
	var CreateLion = function (input_data, success, error){
		// Clear Cached LionsList
		cachedData.LionsList = [];
		AuthService.chech_auth().then( function(resp){
			var xsrfcookie = $cookies.get('_xsrf');
			var result_data;
			var data = {lion: input_data.lion, imageset: input_data.imageset}
			var req = {
				method: 'POST', url: '/lions/', data: data,
				headers: { 'Content-Type': 'application/json','X-XSRFToken' : xsrfcookie},
				config: {ignoreLoadingBar: true}
			};

			$http(req).then(function(response) {
				success(response);
			}, error);

		},function(err){
			error(err);
		});
	};

	var SwitchLion = function (input_data, success, error){
		// Clear Cached LionsList
		cachedData.LionsList = [];
		AuthService.chech_auth().then( function(resp){
			var xsrfcookie = $cookies.get('_xsrf');
			// Lion
			var req = {
				method: 'POST', url: '/lions/', data: input_data,
				headers: { 'Content-Type': 'application/json','X-XSRFToken' : xsrfcookie},
				config: {ignoreLoadingBar: true}
			};
			$http(req).then(function(response) {
				// Imageset
				var lion = response.data.data;
				// var data = {'lion_id': lion.id, 'is_verified': true, 'is_primary': true};
				// PutImageSet(input_data.imageset.id, data, function(response){
				success(lion);
				//}, error);
			}, error);
		},function(err){
			error(err);
		});
	};

	// Put Lion (Update Lion)
	var UpdateImage = function (image_id, data, success){
		// Clear Cached LionsList
		cachedData.LionsList = [];
		return HTTP('PUT', '/images/' + image_id, data, {},
			function (result) {
				success(result.data.data);
			},
			function(error){
				if(debug || (error.status != 401 && error.status != 403)){
					NotificationFactory.error({
						title: "Error", message: "Unable to Update Image data",
						position: 'right', // right, left, center
						duration: 5000   // milisecond
					});
				}
			}
		);
	};

	var UpdateImages = function (items, success){
		// Clear Cached LionsList
		cachedData.LionsList = [];
		AuthService.chech_auth().then( function(resp){
			var xsrfcookie = $cookies.get('_xsrf');
			var promises = items.map(function(item) {
				var req = { method: 'PUT',
										url: '/images/' + item.image_id,
										data: item.data,
										headers: { 'Content-Type': 'application/json','X-XSRFToken' : xsrfcookie},
										config: {ignoreLoadingBar: true}};
				return $http(req);
			});
			$q.all(promises).then(
				function (results) {
					var dados = [];
					results.forEach( function (result, index) {
						dados.push(result.data.data);
					})
					success(dados);
				},
				function(error){
					if(debug || (error.status != 401 && error.status != 403)){
						NotificationFactory.error({
							title: "Error", message: "Unable to Update Images data",
							position: 'right', // right, left, center
							duration: 5000   // milisecond
						});
					}
				}
			);

		},function(err){
			if(debug || (err.status != 401 && err.status != 403)){
				NotificationFactory.error({
					title: "Error", message: "Unable to Update Images data",
					position: 'right', // right, left, center
					duration: 5000   // milisecond
				});
			}
		});
	};

	// Delete CVRequest / CVResults
	var DeleteImage = function (image_id, success, error){
		// Clear Cached LionsList
		cachedData.LionsList = [];
		return HTTP('DELETE', '/images/' + image_id, {}, {}, success, error);
	};

	// Delete ImageSet
	var DeleteImageSet = function (imageset_id, success, error){
		// Clear Cached LionsList
		cachedData.LionsList = [];
		return HTTP('DELETE', '/imagesets/' + imageset_id, {}, {}, success, error);
	};

	// Delete Lion
	var DeleteLion = function (lion_id, success, error){
		// Clear Cached LionsList
		cachedData.LionsList = [];
		return HTTP('DELETE', '/lions/' + lion_id, {}, {}, success, error);
	};

	// Batch Delete Lions / Imagesets / Images
	var BatchDelete = function(data, success, error){
		// Clear Cached LionsList
		cachedData.LionsList = [];
		AuthService.chech_auth().then( function(resp){
			var xsrfcookie = $cookies.get('_xsrf');
			var url = '/'+ data.type + '/';
			var items = data.items;
			var promises = _.map(items, function(item) {
				var req = {
					method: 'DELETE',
					url: url + item.id,
					data: {'_xsrf':xsrfcookie},
					headers: { 'Content-Type': 'application/json','X-XSRFToken' : xsrfcookie},
					config: {ignoreLoadingBar: true}
				};
				return $http(req);
			});
			$q.all(promises).then(function (results) {
				success(results);
			},
			function (reason) {
				error(reason);
			});

		},function(err){
			error(err);
		});
	};

	// Batch Delete Lions / Imagesets / Images
	var BatchUpdate = function(input_data, success, error){
		// Clear Cached LionsList
		cachedData.LionsList = [];
		AuthService.chech_auth().then( function(resp){
			var xsrfcookie = $cookies.get('_xsrf');
			var promises = [];
			_.forOwn(input_data, function(item, key) {
				var base_url = (item.type == 'lion') ? '/lions/' : '/imagesets/';
				var data = item.data;
				console.log(data);
				var prom = _.map(item.ids, function(id, k){
					var url = base_url + id;
					console.log(url);
					return $http({
						method: 'PUT',
						url: url,
						data: data,
						headers: { 'Content-Type': 'application/json','X-XSRFToken' : xsrfcookie},
						config: {ignoreLoadingBar: true}
					});
				});
				promises = promises.concat(prom);
			});
			$q.all(promises).then(function (results) {
				console.log(results);
				var output = _.map(results, function(result){
					return result.data.data;
				});
				success(output);
			},
			function (reason) {
				error(reason);
			});
		},function(err){
			error(err);
		});
	};

	// Get CV Results
	var GetCVResults = function (cvresults_id) {
		var deferred = $q.defer();
		var url = '/cvresults/' + cvresults_id + '/list';
		HTTP('GET', url, null, {ignoreLoadingBar: true},
			function (results){
				var data = results.data.data.table;
				var associated_id = results.data.data.associated.id;
				var classifiers = results.data.data.classifiers;
				var status = results.data.data.status;
				var req_id = results.data.data.req_id;
				var execution = results.data.data.execution;
				var cvresults = _.map(data, function(element, index) {
					var elem = {};
					if(associated_id == element.id) elem["associated"] = true;
					else elem["associated"] = false;

					elem['cv'] = {
						'prediction': element.cv_prediction,
						'confidence': element.cv_confidence
					};
					elem['whisker'] = {
						'prediction': element.whisker_prediction,
						'confidence': element.whisker_confidence
					};

					delete element.cv_prediction
					delete element.cv_confidence
					delete element.whisker_prediction
					delete element.whisker_confidence
					delete element.gender;
					delete element.age;
					delete element.tags;

					return _.extend({}, element, elem);
				});
				deferred.resolve({
					cvresults: cvresults,
					type: { has_cv: classifiers.cv, has_whisker: classifiers.whisker },
					req_id: req_id,
					status: status,
					execution: execution
				});
			},
			function(error){
				if(debug || (error.status != 401 && error.status != 403)){
					NotificationFactory.error({
						title: "Error", message: 'Unable to load CV Results List',
						position: 'right', // right, left, center
						duration: 5000   // milisecond
					});
				}
				deferred.reject(error);
			}
		);
		return deferred.promise;
	};

	// Delete CVRequest / CVResults
	var DeleteCVRequest = function (cvrequest_id, success){
		// Clear Cached LionsList
		cachedData.LionsList = [];
		return HTTP('DELETE', '/cvrequests/' + cvrequest_id, {}, {}, success,
		function(error){
			if(debug || (error.status != 401 && error.status != 403)){
				NotificationFactory.error({
					title: "Error", message: 'Unable to Delete CV Results/CVRequest',
					position: 'right', // right, left, center
					duration: 5000   // milisecond
				});
			}
			console.log(error);
		});
	};

	var DataExport = function (inputdata){
		var deferred = $q.defer();
		var getFileNameFromHeader = function(header) {
			if (!header) return null;
			var result = header.split(";")[1].trim().split("=")[1];
			return result.replace(/"/g, '');
		};

		var data = inputdata.data;
		AuthService.chech_auth().then( function(resp){
			var xsrfcookie = $cookies.get('_xsrf');
			var url = '/data/export';
			// Lion
			var req = {
				method: 'POST',
				url: url,
				data: data,
				headers: {
					accept: 'application/zip',
					'Content-Type': 'application/json',
					'X-XSRFToken' : xsrfcookie
				},
				responseType: 'arraybuffer',
				cache: false,
				config: { ignoreLoadingBar: true },
				transformResponse: function(data, headers) {
					var zip = null;
					if (data) {
						zip = new Blob([data], { type: 'text/plain' });
					}
					var fileName = getFileNameFromHeader(headers('Content-Disposition'));
					var result = { blob: zip, fileName: fileName };
					return result;
				}
			};
			$http(req).then(function(response) {
				deferred.resolve(response.data);
			}, function (error) {
				if(debug || (error.status != 401 && error.status != 403)){
					NotificationFactory.error({
						title: "Error", message: 'Unable to Download Images',
						position: 'right', // right, left, center
						duration: 5000   // milisecond
					});
				}
				if(error.status == 401 || error.status == 403){
					console.log("downloads resolve error");
					deferred.resolve({});
				}else{
					console.log("downloads reject error");
					deferred.reject(error.data);
				}
			});

		},function(err){
			deferred.reject(err);
		});
		return deferred.promise;
	};

	var dataFactory = {};
	// List of ImageSets , Lions and Organizations
	dataFactory.Organizations = GetAllOrganizations;
	dataFactory.ImageSets = GetAllImageSets;
	dataFactory.AllLions = GetAllLions;
	// ImageSet to ImageSet Profile
	dataFactory.ImageSet = GetImageSet;
	// Lion to lion Profile
	dataFactory.Lion = GetLion;
	// Location History
	dataFactory.LocationHistory = LocationHistory;
	// Conservationists
	dataFactory.Conservationists = Conservationists;
	// CV Request (Post Imageset w/ /request)
	dataFactory.RequestCV = RequestCV;
	// Update Imageset
	dataFactory.Verify = PutImageSet;
	dataFactory.Associate = PutImageSet;
	dataFactory.SaveImageset = PutImageSet;
	dataFactory.CreateImageset = PostImageset;
	dataFactory.SetMainImagenId = PutImageSet;
	// Images
	dataFactory.UpdateImages = UpdateImages;
	dataFactory.UpdateImage = UpdateImage;

	dataFactory.DeleteLion = DeleteLion;
	dataFactory.DeleteImageSet = DeleteImageSet;
	dataFactory.DeleteImage = DeleteImage;
	// Batch Deletes
	dataFactory.BatchDelete = BatchDelete;
	dataFactory.BatchUpdate = BatchUpdate;
	dataFactory.DataExport = DataExport;

	// Update Lion
	dataFactory.SaveLion = PutLionImageset;
	dataFactory.CreateLion = CreateLion;
	dataFactory.SwitchLion = SwitchLion;
	dataFactory.SetPrimary = SetPrimary;

	// Get List of CV Results
	dataFactory.GetCVResults = GetCVResults;
	// Delete CV Results and CV Request
	dataFactory.DeleteCVRequest = DeleteCVRequest;

	dataFactory.GetImageGallery = GetImageGallery;
	// Relatives
	dataFactory.Relatives = Relatives;
	// CV Requirements
	dataFactory.CVRequirements = CVRequirements;

	dataFactory.Download = Download;
	return dataFactory;
}])

.factory('PollerService', ['$q', '$http', 'AuthService', function($q, $http, AuthService){
	return {
		cvrequests_list : function(){
			var url = '/cvrequests/list';
			var deferred = $q.defer();
			AuthService.chech_auth().then( function(resp){
				$http.get(url).then(function (response) {
					deferred.resolve(response.data);
				}, function(error){
					deferred.reject(error);
				});
			},function(error){
				deferred.reject(error);
			});
			return deferred.promise;
		},
		lions_list: function(token){
			var url = 'lions/list?token=' + token['id'];
			var deferred = $q.defer();
			AuthService.chech_auth().then( function(resp){
				$http.get(url).then(function (response) {
					deferred.resolve(response);
				}, function(error){
					deferred.reject(error);
				});
			},function(error){
				deferred.reject(error);
			});
			return deferred.promise;
		}
	}
}]);
