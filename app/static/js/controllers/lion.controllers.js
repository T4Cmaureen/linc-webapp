'use strict';

angular.module('lion.guardians.lions.controllers', [])

.controller('NewLionCtrl', ['$scope', '$modal', '$window', function ($scope, $modal, $window) {

  $scope.lion = { id: 1, name: 'leão 1', age: 13, url_small: "/static/images/square-small/lion1.jpg", gender: 'male', organization: 'Lion Guardians', hasResults: true, pending: false, primary: true, verified: true, selected: false};

}])

.controller('SearchLionCtrl', ['$scope', 'LincServices', function ($scope, LincServices) {
  // Hide Filters
  $scope.isCollapsed = true;
  // Filters  scopes
  $scope.LionAge = { min: 1, max: 25, ceil: 30, floor: 0 };
  $scope.name_or_id ='';
  // Order by
  $scope.reverse = true;
  $scope.order = function(predicate) {
    $scope.reverse = ($scope.predicate === predicate) ? !$scope.reverse : false;
    $scope.predicate = predicate;
  };

  LincServices.getOrganizationsList()
  .success(function (list) {
    $scope.organizations = list.data;
    $scope.organizations.forEach(function (element, index, array) {
      element["checked"] = true;
    });
  })
  .error(function (error) {
    $scope.status = 'Unable to load organizations data: ' + error.message;
  });

  // Pagination scopes
  $scope.itemsPerPage = 10;
  $scope.currentPage = 0;

  LincServices.getLionsList()
  .success(function (list) {
    $scope.lions = list.data;
    $scope.setPage = function(n) {
      $scope.currentPage = n;
    };
    $scope.prevPage = function() {
      if ($scope.currentPage > 0)
        $scope.currentPage--;
    };
    $scope.nextPage = function() {
      if ($scope.currentPage < $scope.pageCount()-1)
        $scope.currentPage++;
    };
    $scope.firstPage = function() {
      $scope.currentPage = 0;
    };
    $scope.lastPage = function() {
      if ($scope.currentPage < $scope.pageCount()-1)
        $scope.currentPage = $scope.pageCount()-1;
    };
    $scope.prevPageDisabled = function() {
      return $scope.currentPage === 0 ? "disabled" : "";
    };
    $scope.nextPageDisabled = function() {
      return ($scope.currentPage === $scope.pageCount()-1 || !$scope.pageCount())? "disabled" : "";
    };
    $scope.pageCount = function() {
      return Math.ceil($scope.filtered_lions.length/$scope.itemsPerPage);
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
    $scope.viewer_label = function(){
      var label = "0 lions found";
      if($scope.filtered_lions){
        label = ($scope.filtered_lions.length).toString() + " lions found - " +
                ($scope.currentPage*$scope.itemsPerPage+1).toString() + " to " +
                (Math.min((($scope.currentPage+1)*$scope.itemsPerPage),$scope.filtered_lions.length)).toString();
      }
      return label;
    }
  })
  .error(function (error) {
      $scope.status = 'Unable to load lions data: ' + error.message;
  });
}]);