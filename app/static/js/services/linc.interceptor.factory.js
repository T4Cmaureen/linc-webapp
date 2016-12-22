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

angular.module('linc.interceptor.factory', [])

.factory('httpInterceptor', ['$q', '$injector', '$cookies', function($q, $injector, $cookies){
  return {
      'response': function (response) {
          if (response.status === 401) {
              //console.log("Response 401");
          }
          return response || $q.when(response);
      },
      'responseError': function (rejection) {
          if (rejection.status === 401) {
            if((rejection.config.ignore401 == undefined) ||
               (rejection.config.ignore401 != undefined && !rejection.config.ignore401)){
              $injector.get('AuthService').setUser(null);
              $cookies.remove("userlogin");
              if(rejection.config.url != "/login")
                $injector.get('$window').location.reload();
              //$injector.get('$state').transitionTo('login');
              //console.log("Response Error 401");
            }
            else {
              //console.log("Response Error 401 - Ignore 401");
            }
          }
          if (rejection.status === 403) {
            /*
            var notification = $injector.get('NotificationFactory');
            if(notification){
              notification.info({
                title: 'Forbidden', message: 'Not authorized to access',
                position: 'left',  // right, left, center
                duration: 2000     // milisecond
              });
            }
            */
            $injector.get('$state').transitionTo('home');
          }
          return $q.reject(rejection);
      }
  };
}])

.config(function ($httpProvider) {
  $httpProvider.interceptors.push('httpInterceptor');
});
