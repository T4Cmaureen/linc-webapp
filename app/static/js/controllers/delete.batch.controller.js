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

angular.module('linc.delete.batch.controller', [])

.controller('DeleteBatchCtrl', ['$scope', '$uibModalInstance', 'metadata', 'LincServices', 'NotificationFactory',
  function ($scope, $uibModalInstance, metadata, LincServices, NotificationFactory) {

	$scope.metadata = metadata;

	$scope.orderby = { reverse: false, predicate: 'id' };
	$scope.order = function(predicate) {
		$scope.orderby.reverse = ($scope.orderby.predicate === predicate) ? !$scope.orderby.reverse : false;
		$scope.orderby.predicate = predicate;
	};

	$scope.title = (($scope.metadata.type == 'lions') ? 'Lions' : 'ImageSets') + ' - Batch Delete';
	$scope.content = 'Form';
	$scope.message = 'Are you sure you want to delete the ' + $scope.metadata.selected.length + ' ' + (($scope.metadata.type == 'lions') ? 'Lions' : 'ImageSets') + '?';
	$scope.dataloading = false;
	// Cancel
	$scope.Cancel = function () {
		$uibModalInstance.dismiss('cancel');
	};

	$scope.Delete = function() {
		$scope.dataloading = true;
		var type = $scope.metadata.type;
		var items = $scope.metadata.selected;
		var data = {'type': type, 'items': items};
		var message = 'All ' + (($scope.metadata.type == 'lions') ? 'Lions' : 'ImageSets') + ' were successfully deleted';
		LincServices.BatchDelete(data, function(result){
			NotificationFactory.success({
				title: 'Delete', 
				message: message,
				position: "right",
				duration: 3000
			});
			$uibModalInstance.close(result);
		},function(error){
			if($scope.debug || (error.status != 401 && error.status != 403)){
				NotificationFactory.error({
					title: "Fail: "+ modalScope.title, 
					message: message.Error,
					position: 'right',
					duration: 5000
				});
			}
			$uibModalInstance.close(error);
		});
	};
}]);
