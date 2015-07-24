/**
 * Module dependencies.
 **/
var async = require('async');
var moment = require('moment');
var rosie = require('rosie').Factory;
var mongoose = require('mongoose');
var Sensor = mongoose.model('Sensor');
var Measurement = mongoose.model('Measurement');

/*
 * Load config
 */
var env = process.env.NODE_ENV || 'development'
var config = require('../../config')[env]
var parameters = config.parameters;

/**
 * Sensor factory
 **/
rosie.define('Sensor')
	.sequence('_id', function(i) { return i })
	.sequence('name', function(i) { return 'Sensor '+ i })
	.sequence('description', function(i) { return 'some description for Sensor ' + i })
	.attr('geometry', function(){
		var lat = -90 + Math.random() * 180;
		var lon = -180 + Math.random() * 360;
		return {
			type: 'Point',
			coordinates: [lon,lat]
		}
	});

exports.createSensor = function(doneCreateSensor){
	var sensor = new Sensor(rosie.build('Sensor'));
	sensor.save(function(err){
		doneCreateSensor(err, sensor);
	})
}

exports.createSensors = function(n, doneCreateSensors){
	var self = this;
	async.timesSeries(n, function(i, doneEach){
    self.createSensor(doneEach);
  }, doneCreateSensors);
}


exports.createSensorsWithMeasurements = function(n, days, doneCreateSensorsWithMeasurements){
	var self = this;

  self.createSensors(n, function(err, allSensors){
    if (err) doneCreateSensorsWithMeasurements(err);
    async.eachSeries(allSensors, function(sensor, doneEachSensor){
      self.createMeasurements(sensor, days, doneEachSensor);
    }, function(errors){
			doneCreateSensorsWithMeasurements(errors, allSensors);
		});
  });
}

/**
 * Measurement factory
 **/
exports.createMeasurement = function(sensor, parameter, hoursAgo, doneCreateMeasurement){
	var measurement = new Measurement({
    sensor: sensor,
    parameter: parameter,
    collectedAt: moment().subtract(hoursAgo, 'hour')
  });

	switch (parameter._id) {
		case 'atmospheric_pressure':
			measurement.value = Math.random() * 105000;
			break;
		case 'electrical_conductivity':
				measurement.value = Math.random() * 20000;
			break;
		case 'ph':
				measurement.value = Math.random() * 14;
			break;
		case 'oxi-reduction_potential':
				measurement.value = Math.random() * 800;
			break;
		case 'water_temperature':
				measurement.value = 10 + Math.random() * 20;
			break;
		case 'ambient_temperature':
				measurement.value = 10 + Math.random() * 35;
			break;
		case 'relative_humidity':
				measurement.value = Math.random() * 100;
			break;
	}

	measurement.save(function(err){
		doneCreateMeasurement(err, sensor);
	})
}


exports.createMeasurements = function(sensor, days, doneCreateMeasurements){
	var self = this;

  // for each parameter
  async.eachSeries(parameters, function(parameter, doneEachParameter){
    // generate hourly measurements from now
  	async.timesSeries(days * 24, function(hoursAgo, doneEachHour){
      self.createMeasurement(sensor, parameter, hoursAgo - 1, doneEachHour);
    }, doneEachParameter);
  }, doneCreateMeasurements);
}