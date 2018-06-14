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

angular.module('linc.classifier.graph.controller', [])

.controller('ClassifierGrapphCtrl', ['$scope', '$uibModalInstance', 'data', function ($scope, $uibModalInstance, data) {

	this.$scope = $scope;

	$scope.title = ' Graph';
	$scope.content = 'Form';

	// Cancel
	$scope.Cancel = function () {
		$uibModalInstance.dismiss('cancel');
	};

	$scope.chartConfig = {
		chart: { renderTo: 'hichart', type: 'scatter', zoomType: 'xy'},
		title: { text: data.title },
		subtitle: {text: data.subtitle },
		credits: {style:{ color: '#d95210', fontSize: '10px' },  href: "http://www.venidera.com", text: "Venidera.com"},
		xAxis: { title: { enabled: true, text: 'Prediciton (%)' }, max: 100, startOnTick: true, endOnTick: true, showLastLabel: true },
		yAxis: { title: { text: 'Confidence (%)' }, max: 100 },
		tooltip: {
			enabled: true,
			formatter: function() {
				return '<div style="color: ' + this.color + ';">Lion (' + this.point.id +') ' + this.key + '<div><br>' +
				'Prediction: <b>' + this.x + ' %</b><br>Confidence: <b>' + this.y + ' %</b>';
			}
		},
		legend: { layout: 'horizontal', align: 'right', verticalAlign: 'top', y: 5, floating: false, backgroundColor: '#FFFFFF', borderWidth: 1 },
		plotOptions: {
			series: {
				dataLabels: {
					enabled: true,
					useHTML: true,
					formatter: function(){
						return '<div style="color: ' + this.color + ';">Lion ' + this.point.id + '<div>';
					}
				}
			},
			scatter: {
				marker: { radius: 5, states: { hover: { enabled: true, lineColor: 'rgb(100,100,100)' } } },
				states: { hover: { marker: { enabled: false } } },
				cursor: 'pointer',
				events: {
					click: function(event) {
						$scope.CompareImages(event.point.id);
					}
				}
			}
		},
		series: data.series
	}
}]);
