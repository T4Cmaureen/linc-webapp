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
angular.module('linc.auth.services', [])

.factory('AuthService', ['$http', '$q', '$localStorage', '$cookies',
  function ($http, $q, $localStorage, $cookies) {
	var authService = {'user': $localStorage.user};

	authService.Login = function (data, success, error){
		var req = { method: 'POST',
								url: '/login',
								data: data,
								headers: { 'Content-Type': 'application/json', 'X-XSRFToken' : data['_xsrf']},
								config: {}};
		$http(req).then(function(response){
			var data = response.data.data;
			var auth_user = {
				'name': data['username'],
				'id': data['id'],
				'organization': data['orgname'],
				'organization_id': data['organization_id'],
				'admin': data['admin'],
				'logged': true,
				'token': data['token']
			}
			$localStorage.user = auth_user;
			authService.user = auth_user;
			success(auth_user.logged);
		}, function(response){
			var data = response.data;
			if (response.status == 412){
				data = response.data.data;
			}
			error({status: response.status, data: data});
		});
	};

	authService.Agree = function (data, success, error){
		var req = {
			method: 'POST',
			url: '/auth/agree',
			data: data,
			headers: { 'Content-Type': 'application/json', 'X-XSRFToken' : data['_xsrf']},
			config: {}
		};
		$http(req).then(function(response){
			var data = response.data.data;
			var auth_user = {
				'name': data['username'],
				'id': data['id'],
				'organization': data['orgname'],
				'organization_id': data['organization_id'],
				'admin': data['admin'],
				'logged': true,
				'token': data['token']
			}
			$localStorage.user = auth_user;
			authService.user = auth_user;
			success(auth_user.logged);
		}, error);
	};

	authService.Logout = function (success, error){
		var xsrfcookie = $cookies.get('_xsrf');
		var req = { method: 'POST',
									 url: '/logout',
									data: {},
							 headers: { 'Content-Type': 'application/json', 'X-XSRFToken' : xsrfcookie},
								config: {}};
		$http(req).then(function(response){
			$cookies.remove('userlogin');
			$localStorage.$reset();
			authService.user = null;
			success();
		}, function(response){
			$cookies.remove('userlogin');
			$localStorage.$reset();
			authService.user = null;
			error(response);
		});
	};

	authService.UpdatePassword = function(data){
		var deferred = $q.defer();
		var xsrfcookie = $cookies.get('_xsrf');
		$http({
			method: 'POST',
			url: '/auth/recovery',
			data: data,
			headers: { 'Content-Type': 'application/json', 'X-XSRFToken': xsrfcookie },
			config: {}
		}).then(function(response){
			deferred.resolve(response.data);
		}, function(error){
			deferred.reject(error.data);
		});
		return deferred.promise;
	};

	authService.ChangePassword = function(data){
		var deferred = $q.defer();
		var xsrfcookie = $cookies.get('_xsrf');
		var url = '/auth/changepassword';
		var req = {
			method: 'POST',
			url: url,
			data: data['data'],
			headers: { 'Content-Type': 'application/json','X-XSRFToken' : xsrfcookie},
			config: {}
		};

		$http(req).then(function(response){
			deferred.resolve(response.data);
		},function(err){
			deferred.reject(err);
		});
		return deferred.promise;
	};

	authService.RequestAccess = function(data){
		var deferred = $q.defer();
		var xsrfcookie = $cookies.get('_xsrf');
		var url = '/auth/requestaccess';
		var req = {
			method: 'POST',
			url: url,
			data: data['data'],
			headers: { 'Content-Type': 'application/json','X-XSRFToken' : xsrfcookie},
			config: {}
		};

		$http(req).then(function(response){
			deferred.resolve(response.data);
		},function(err){
			deferred.reject(err);
		});
		return deferred.promise;
	};

	authService.isAuthenticated = function(){
		var user = authService.user;
		if(user==undefined || !user.logged)
			return false;
		else
			return true;
	};

	authService.isAuthorized = function (authorized) {
		var user = authService.user;
		if(user==undefined) return false;
		if(!user.logged) return false;
		if(user.admin) return true;
		if(authorized=='admin') return false;
		return true;
	};

	authService.setUser = function (val) {
		authService.user = val;
		$localStorage.user = val;
	};

	authService.chech_auth = function(){
		var req = { method: 'GET', url: 'auth/check', data: {} };
		return $http(req);
	};

	authService.login_chech_auth = function(){
		var req = { method: 'GET', url: 'auth/check', data: {}, ignore401: true };
		return $http(req);
	}
	return authService;
}]);
