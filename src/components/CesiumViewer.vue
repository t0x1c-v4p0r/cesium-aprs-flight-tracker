<template>
    <div id="cesiumContainer"></div>
</template>

<script>
import *  as Cesium from 'cesium';
import "../../node_modules/cesium/Build/Cesium/Widgets/widgets.css";
import { io } from "socket.io-client";
// import "./css/main.css";
export default {
  name: 'CesiumViewer',
  props: {
    msg: String
  },
  mounted: () => {
    const socket = io();

    socket.on('connect', () => {
      console.log('connect')
    })

    socket.on('message', (msg) => {
      console.log('message:',msg)
    })

    // const balloonUri = Cesium.IonResource.fromAssetId(585832/*process.env.VUE_APP_BALLOON_MODEL*/);
    Cesium.Ion.defaultAccessToken = process.env.VUE_APP_ACCESS_TOKEN

    var viewer = new Cesium.Viewer('cesiumContainer', {
        terrainProvider: Cesium.createWorldTerrain()
    });

    viewer.scene.primitives.add(Cesium.createOsmBuildings());
    // The SampledPositionedProperty stores the position and timestamp for each sample along the radar sample series.
    const positionProperty = new Cesium.SampledPositionProperty();

    var start_time = null; // for two different socket callbacks to manipulate the start time of the animation
    var stop_time = null; // for two different socket callbacks to manipulate the stop time of the animation
    var balloonEntity = null; // for two different socket callbacks to manipulate the entity that models the position of the balloon

    // On fresh reload, get existing flight data from the server to plot
    socket.on('prev_flight_data', (prev_flight_points) => {
      if (prev_flight_points == null) return;
      prev_flight_points = prev_flight_points.split('\n');
      for(var i=0; i<prev_flight_points.length-1; i++) {
        if(prev_flight_points[i]=="") continue;
        if(i==0) start_time = Cesium.JulianDate.fromIso8601(JSON.parse(prev_flight_points[0]).time); // Assumes timestamp is in Iso8601.
        stop_time = Cesium.JulianDate.fromIso8601(JSON.parse(prev_flight_points[i]).time); // Update the stop time until we reach the last timestamp
        var flight_point = JSON.parse(prev_flight_points[i]);
        console.log(i, ': ', flight_point);
        // Declare the time for this individual sample and store it in a new JulianDate instance.
        const time = Cesium.JulianDate.fromIso8601(flight_point.time); // Assumes timestamp is in Iso8601.
        const position = Cesium.Cartesian3.fromDegrees(flight_point.longitude, flight_point.latitude, flight_point.height);
        // Store the position along with its timestamp.
        // Here we add the positions all upfront, but these can be added at run-time as samples are received from a server.
        positionProperty.addSample(time, position);
        /*const pointEntity = */ viewer.entities.add({
          description: `Stats: (${flight_point.longitude}, ${flight_point.latitude}, ${flight_point.height})`,
          position: position,
          point: { pixelSize: 10, color: Cesium.Color.RED }
        });
      }
      viewer.clock.currentTime = stop_time.clone(); // current_time should be the latest packet reported. Set current_time before we add a 1sec delay to the stop_time.
      if (stop_time) stop_time = Cesium.JulianDate.addSeconds(stop_time, 1, new Cesium.JulianDate()); // if we only have 1 data point, stop_time > start_time
      if(start_time == null || stop_time == null) return;
      console.log('TEST' + start_time + '; ' + stop_time);
      viewer.clock.startTime = start_time.clone();
      viewer.clock.stopTime = stop_time.clone();
      viewer.timeline.zoomTo(start_time, stop_time);
      viewer.clock.shouldAnimate = false;
      balloonEntity = viewer.entities.add({ // add path for flight points we already know.
        availability: new Cesium.TimeIntervalCollection(
          [ new Cesium.TimeInterval(
            { start: start_time, stop: stop_time}) 
          ]
        ),
        position: positionProperty,
        // point: { pixelSize: 30, color: Cesium.Color.GREEN },
        model: { uri: "./CesiumBalloon.glb", maximumScale: 5000},
        // model: { uri: balloonUri, maximumScale: 5000},
        orientation: new Cesium.VelocityOrientationProperty(positionProperty), 
        path: new Cesium.PathGraphics({ width: 3 })
      });
      // Make the camera track the balloon.
      viewer.trackedEntity = balloonEntity;
    });

    // New flight point received from the server
    socket.on('new_flight_point', (new_flight_point) => {
      stop_time = Cesium.JulianDate.addSeconds(Cesium.JulianDate.fromIso8601(new_flight_point.time), 1, new Cesium.JulianDate()); // Required for stop_time > start_time for when we only have 1 data
      const position = Cesium.Cartesian3.fromDegrees(new_flight_point.longitude, new_flight_point.latitude, new_flight_point.height);
      // Store the position along with its timestamp.
      // Add at run-time as samples are received from a server.
      positionProperty.addSample(stop_time, position);
      viewer.clock.stopTime = stop_time.clone(); // update the stop time
      // Plot it on the cesium app
      /* const pointEntity = */ viewer.entities.add({
        description: `Location: (${new_flight_point.longitude}, ${new_flight_point.latitude}, ${new_flight_point.height})`,
        position: position,
        point: { pixelSize: 10, color: Cesium.Color.RED }
      });
      if (balloonEntity != null) { // Where there are data already present in Cesium before new data is entered.
        balloonEntity.position = positionProperty; // Update the path of the balloon object
        balloonEntity.orientation =  new Cesium.VelocityOrientationProperty(positionProperty);
        // Extend the life of the balloon object
        balloonEntity.availability = new Cesium.TimeIntervalCollection([ new Cesium.TimeInterval({ start: start_time, stop: stop_time}) ]);
        var current_time = Cesium.JulianDate.fromIso8601(new_flight_point.time);
        viewer.clock.currentTime = current_time.clone();
      } else { // For fresh servers without any previous flight data. ie balloonEntity == null && start_time == null.
        start_time = Cesium.JulianDate.fromIso8601(new_flight_point.time); // Assumes timestamp is in Iso8601.
        viewer.clock.startTime = start_time.clone(); // update the stop time
        viewer.clock.currentTime = start_time.clone(); // update the clock displayed in the GUI
        viewer.timeline.zoomTo(start_time, stop_time);
        // A balloon object must be created.
        balloonEntity = viewer.entities.add({ // add path for flight points we already know.
          availability: new Cesium.TimeIntervalCollection(
            [ new Cesium.TimeInterval(
              { start: start_time, stop: stop_time}) 
            ]
          ),
          // model: { uri: balloonUri, maximumScale: 5000},
          orientation: new Cesium.VelocityOrientationProperty(positionProperty), 
          position: positionProperty,
          // point: { pixelSize: 30, color: Cesium.Color.GREEN },
          model: { uri: "./CesiumBalloon.glb", maximumScale: 5000},
          path: new Cesium.PathGraphics({ width: 3 })
        });
        viewer.clock.currentTime = start_time.clone(); // Teleport the balloon to its latest reported position.
        viewer.trackedEntity = balloonEntity;
      }

    });
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
div#cesiumContainer {
  /*height: 100vh;
  width: 100vw;*/
}
</style>