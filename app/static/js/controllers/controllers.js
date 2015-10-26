'use strict';

angular.module('lion.guardians.controllers', ['lion.guardians.login.controller',
                                                               'lion.guardians.home.controller',
                                                               'lion.guardians.side.menu.controller',
                                                               'lion.guardians.lions.controllers',
                                                               'lion.guardians.image.set.controllers',
                                                               'lion.guardians.conservationists.controller',
                                                               'lion.guardians.image.gallery.controller',
                                                               'lion.guardians.metadata.controller',
                                                               'lion.guardians.location.history.controller',
                                                               'lion.guardians.cvresults.controller',
                                                               'lion.guardians.cvrefine.controller',
                                                               'lion.guardians.upload.images.controller',
                                                               'lion.guardians.services' ])

.controller('BodyCtrl', ['$scope', '$state', '$localStorage', function ($scope, $state, $localStorage){
    $scope.bodyClasses = 'default';
    // this'll be called on every state change in the app
    $scope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams){
        if (toState.data != undefined && angular.isDefined(toState.data.bodyClasses)) {
            $scope.bodyClasses = toState.data.bodyClasses;
            return;
        }
        $scope.bodyClasses = 'default';
    });
    $scope.$storage = $localStorage;
}])

.filter('offset', function() {
  return function(input, start) {
    start = parseInt(start, 10);
    var res = _.slice(input, start);
    return res
  };
})

// Age Filter
.filter('age_filter', function(){
  return function(input, age) {
    var filtered = _.filter(input, function(value){
        return value.age >= age.min && value.age <= age.max;
    });
    return filtered;
  };
})
// Name or Id Filter
.filter('nameid_filter', function(){
  return function(input, name, id) {
    var filtered = _.filter(input, function(value){
        if(!name.length)
          return true;
        return ((value.name.indexOf(name) !== -1) || (value.id.toString().indexOf(id) !== -1));
    });
    return filtered;
  };
})

// Filter by Organization
.filter('organization_filter', function(){
  return function(input, organizations) {
    var filtered = _.filter(input, function(value){
        return (_.result(_.find(organizations, {'name': value.organization}), 'checked'));
    });
    return filtered;
  };
})

;
