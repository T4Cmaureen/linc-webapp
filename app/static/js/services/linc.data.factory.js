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
angular.module('linc.data.factory', [])

.factory('LincDataFactory', [ 'LincServices', '$q', '$localStorage', function(LincServices, $q, $localStorage) {
	var initialized = false;
	var default_options = {
		orderby : {
			reverse: false,
			predicate: 'id'
		},
		isCollapsed: {
			Age: true,
			NameOrId: true,
			Organization: true,
			TagFeatures: true,
			Gender: true,
			Primary: true,
			Location: true,
			Boundarys: true
		},
		filters:{
			Ages: { min: 0, max: 32, options: {ceil: 32, floor: 0 }},
			NameOrId: '',
			TagFeatures: '',
			Organizations: [],
			Genders: [{name: 'male', label: 'Male', checked: true}, {name: 'female', label: 'Female', checked: true}, {name: 'unknown', label: 'Unknown', checked: true}],
			Primary: [{name: true, label: 'Primary', checked: true}, {name: false, label: 'Not Primary', checked: true}],  
			Location: { latitude:'', longitude: '', radius: '' },
			Boundarys: ''
		},
		pages: { PerPage: 0, currentPage: 0},
	};
	
	var options = {
		lions: angular.copy(default_options),
		imagesets: angular.copy(default_options),
		cvrequests: angular.copy(default_options)
	};

	var default_organizations =[];
	var init_organizations = function(type){
		var deferred = $q.defer();
		 LincServices.Organizations().then(function (organizations){
			default_organizations =  _.map(organizations, function(element) {
				return _.extend({}, element, {checked: true});
			});
			default_options.filters.Organizations = angular.copy(default_organizations);
			options.lions.filters.Organizations = angular.copy(default_organizations);
			options.imagesets.filters.Organizations = angular.copy(default_organizations);
			options.cvrequests.filters.Organizations = angular.copy(default_organizations);

			if($localStorage.boundarys){
				options.lions.filters.Boundarys = $localStorage.boundarys;
				options.imagesets.filters.Boundarys = $localStorage.boundarys;
			}

			if(type=='lions')
				deferred.resolve(options.lions);
			else if(type=='imagesets')
				deferred.resolve(options.imagesets);
			else if(type=='cvrequests')
				deferred.resolve(options.cvrequests);
			else{
				deferred.resolve(default_options);
			}
		},function(err){
			deferred.reject(err);
		});
		return deferred.promise;
	};

	return {
		get_defaults (){
			if(!default_organizations.length)
				return init_organizations();
			else
				return (default_options);
		},
		get_lions_options: function () {
			console.log('Load Lions Sets Options')
			if($localStorage.lions){
				var lions = $localStorage.lions;
				if($localStorage.boundarys)
					lions.filters.Boundarys = $localStorage.boundarys;
				return lions;
			}
			else if(!default_organizations.length){
				return init_organizations('lions');;
			}
			else{
				var lions = options.lions;
				if($localStorage.boundarys)
					lions.filters.Boundarys = $localStorage.boundarys;
				return (lions);
			}
		},
		set_lions_options: function (opt) {
			console.log('Save Lions Options');
			options.lions = opt;
			$localStorage.lions = opt;
			$localStorage.boundarys = opt.filters.Boundarys;
		},
		get_imagesets_options: function () {
			console.log('Load Image Sets Options')
			if($localStorage.imagesets){
				var imagesets = $localStorage.imagesets;
				if($localStorage.boundarys)
					imagesets.filters.Boundarys = $localStorage.boundarys;
				return imagesets;
			}
			else if(!default_organizations.length){
				return init_organizations('imagesets');
			}
			else{
				var imagesets = options.imagesets;
				if($localStorage.boundarys)
					imagesets.filters.Boundarys = $localStorage.boundarys;
				return imagesets;
			}
		},
		set_imagesets_options: function (opt) {
			console.log('Save Image Sets Options')
			options.imagesets = opt;
			$localStorage.imagesets = opt;
			$localStorage.boundarys = opt.filters.Boundarys;
		},
		get_cvrequests_options: function () {
			if($localStorage.cvrequests)
				return $localStorage.cvrequests;
			else if(!default_organizations.length)
				return init_organizations('cvrequests');
			else
				return (options.cvrequests);
		},
		set_cvrequests_options: function (opt) {
			options.cvrequests = opt;
			$localStorage.cvrequests = opt;
		}
	};
}])

.factory('LincApiDataFactory', [ 'LincApiServices', '$localStorage', function(LincApiServices, $localStorage) {
	var initialized = false;
	var settings = {
			'Selected_tab': 'users',
			'users': {
				'reverse': false,
				'predicative': 'id',
				'Selecteds': [],
				'Mode': ''
			},
			'organizations': {
				'reverse': false,
				'predicative': 'id',
				'Selecteds': [],
				'Mode': ''
			},
			'lions': {
				'reverse': false,
				'predicative': 'id',
				'Selecteds': [],
				'Mode': ''
			},
			'imagesets': {
				'reverse': false,
				'predicative': 'id',
				'Selecteds': [],
				'Mode': ''
			},
			'images': {
				'reverse': false,
				'predicative': 'id',
				'Selecteds': [],
				'Mode': '',
				'currentPage': 0
			},
			'cvrequests': {
				'reverse': false,
				'predicative': 'id',
				'Selecteds': [],
				'Mode': ''
			},
			'cvresults': {
				'reverse': false,
				'predicative': 'id',
				'Selecteds': [],
				'Mode': ''
			}
	};

	if($localStorage.settings)
		settings = $localStorage.settings;
	return {
		get_settings: function () {
			return (settings);
		},
		set_settings: function (source) {
			settings = source;
			$localStorage.settings = settings;
		}
	};
}])

.factory('toClipboard', ['$compile','$rootScope','$document', function($compile,$rootScope,$document) {
	return {
		copy: function(element){
			var copyElement = angular.element('<span id="ngClipboardCopyId">'+element+'</span>');
			var body = $document.find('body').eq(0);
			body.append($compile(copyElement)($rootScope));

			var ngClipboardElement = angular.element(document.getElementById('ngClipboardCopyId'));
			var range = document.createRange();

			range.selectNode(ngClipboardElement[0]);

			window.getSelection().removeAllRanges();
			window.getSelection().addRange(range);

			var successful = document.execCommand('copy');

			var msg = successful ? 'successful' : 'unsuccessful';
			console.log('Copying text command was ' + msg);
			window.getSelection().removeAllRanges();

			copyElement.remove();
		}
	}
}]);
