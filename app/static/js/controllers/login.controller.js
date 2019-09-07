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

angular.module('linc.login.controller', [])
// Login
.controller('LoginCtrl', ['$scope', '$state', '$q', '$uibModal', 'AuthService', 'NotificationFactory',
  function ($scope, $state, $q, $uibModal, AuthService, NotificationFactory) {

	$scope.loginData = { username : '' , password : '', _xsrf: ''};
	$scope.dataLoading = false;
	$scope.remember = true;

	var user = AuthService.user;
	$scope.checkLogged = function(){
		AuthService.login_chech_auth().then(function(resp){
			$state.go("home");
		}, function(error){
			console.log('unauthenticated')
		});
	};

	var Agreement = function(){
		var deferred = $q.defer();
		var mScope = $scope.$new();
		mScope.title = 'End User License Agreement (EULA)';
		var mInstance = $uibModal.open({
			templateUrl: 'agreement.html',
			scope: mScope,
			backdrop: 'static',
			keyboard  : false
		});
		mInstance.result.then(function (result) {
			console.log("Agree");
			deferred.resolve();
		}, function(result){
			deferred.reject();
			console.log("Not agreed.");
		});
		mScope.Agree = function (){
			mInstance.close();
		};
		mScope.Cancel = function(){
			mInstance.dismiss();
		};
		return deferred.promise;
	};

	$scope.login = function() {
		if (!user || !user.logged){
			if (!$scope.loginData.username || !$scope.loginData.password){
				alert('Please fill the email address and password to login.');
			}else{
				$scope.dataLoading = true;
				AuthService.setUser(null);
				// Authentication Service
				AuthService.Login($scope.loginData, function(logged){
					$scope.dataLoading = false;
					if (!logged){
						NotificationFactory.error({
							title: 'Login', message: 'Login error.',
							position: 'left',
							duration: 6000
						});
					}
					else{
						$state.go("home");
					}
				}, function (error){
					$scope.dataLoading = false;
					if (error.status == 412){
						Agreement().then(function () {
							_.merge($scope.loginData, error.data);
							delete $scope.loginData['password'];
							AuthService.Agree($scope.loginData, function(){
								$state.go("home");
							}, function(error){
								console.log(error);
							});
						});
					}
					else{
						var modalScope = $scope.$new();
						modalScope.title = 'Login Error';
						modalScope.modalMessage = error.data.message;
						var modalInstance = $uibModal.open({
							templateUrl: 'LoginError.tpl.html',
							scope: modalScope,
							size: '350px'
						});
						modalScope.close = function (){
							modalInstance.close();
						};
					}
				});
			}
		}
	};

	$scope.forgotPwd = function(){
		var modalScope = $scope.$new();
		modalScope.dataSending = false;
		modalScope.title = 'Reset your password?';
		modalScope.showValidationMessages = false;
		modalScope.forgot = {username: $scope.loginData.username};
		modalScope.tooltip = {title: '<span><i class="icon icon-info"></i>passwords must match</span>', checked: false};

		var modalInstance = $uibModal.open({
			templateUrl: 'ForgetPwd.tpl.html',
			scope: modalScope
		});
		modalInstance.result.then(function (result) {
			var data = {'username': result.username, 'password': null};
			modalScope.dataSending = false;
			ShowInfo(data);
		});
		modalScope.UpdatePassword = function (valid){
			if(valid){
				modalScope.dataSending = true;
				AuthService.UpdatePassword({email: modalScope.forgot.username, password: modalScope.forgot.password})
				.then(function(response){
					// $scope.loginData.username = modalScope.forgot.username;
					modalInstance.close(modalScope.forgot);
				},
				function(error){
					modalScope.dataSending = false;
					var title = "Error";
					if(error.status == 404)
						title = "Not Found";
					var message = error.data.message;
					NotificationFactory.error({
						title: title, message: message,
						position: 'right', // right, left, center
						duration: 5000   // milisecond
					});
				});
			}
			else {
				modalScope.showValidationMessages = true;
			}
		}
		modalScope.cancel = function(){
			modalInstance.dismiss();
		}
	};

	var ShowInfo = function (data){
		var modalScope = $scope.$new();
		modalScope.title = 'New Password';
		modalScope.modalMessage = "An email with instructions to change password has been sent to "+
													data.username + ".";
		var modalInstance = $uibModal.open({
			templateUrl: 'ForgetSended.tpl.html',
			scope: modalScope,
			size: '350px'
		});
		modalInstance.result.then(function (result) {
		}, function(error){
		});
		modalScope.close = function (){
			modalInstance.close();
		}
	};

	$scope.checkLogged();
}]);
