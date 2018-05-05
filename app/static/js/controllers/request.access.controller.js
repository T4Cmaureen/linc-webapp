/* jshint unused:vars */
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

angular.module('request.access.controller', [])
// Login
.controller('RequestAccessCtrl', ['$scope', '$uibModalInstance', 'AuthService', 'NotificationFactory',
  function ($scope, $uibModalInstance, AuthService, NotificationFactory) {

	$scope.title = 'Request Access to Linc';
	$scope.showValidationMessages = false;
	$scope.dataloading = false;

	$scope.request = {
		email: '',
		fullname: '',
		organization: '',
		geographical: ''
	};

	$scope.Cancel = function(){
		$uibModalInstance.dismiss();
	};

	$scope.submit = function (form){
		if(form.$valid){
			$scope.showValidationMessages = false;
			$scope.dataloading = true;
			AuthService.RequestAccess({data: $scope.request})
			.then(function(response){
				$scope.dataloading = false;
				NotificationFactory.success({
					title: 'Access Reuqest', message: response.message,
					position: "right",
					duration: 4000
				});
				$uibModalInstance.close(response);
			},
			function(error){
				$scope.dataloading = false;
				NotificationFactory.error({
					title: 'Access Request', message: error.data.message,
					position: 'right',
					duration: 5000
				});
			});
		}
		else {
			$scope.showValidationMessages = true;
		}
	};

}]);
