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

    Cesium.Ion.defaultAccessToken = process.env.VUE_APP_ACCESS_TOKEN

    var viewer = new Cesium.Viewer('cesiumContainer', {
        terrainProvider: Cesium.createWorldTerrain()
    });

    viewer.scene.primitives.add(Cesium.createOsmBuildings());
    // The SampledPositionedProperty stores the position and timestamp for each sample along the radar sample series.
    const positionProperty = new Cesium.SampledPositionProperty();

    var start_time = null; // for two different socket callbacks to manipulate the start time of the animation
    var stop_time = null; // for two different socket callbacks to manipulate the stop time of the animation
    var current_time = null; // for two different socket callbacks to manipulate the current time of the animation
    var balloonEntity = null; // for two different socket callbacks to manipulate the entity that models the position of the balloon

    // On fresh reload, get existing flight data from the server to plot
    socket.on('prev_flight_data', (prev_flight_points) => {
      if (prev_flight_points == null) return;
      prev_flight_points = prev_flight_points.split('\n');
      for(var i=0; i<prev_flight_points.length; i++) {
        if(prev_flight_points[i]=="") continue; // Ignore empty strings from the delimiter split
        if(start_time==null) start_time = Cesium.JulianDate.fromIso8601(JSON.parse(prev_flight_points[i]).time); // Take the first flight data point as the start point. Assumes flight data is in order.
        current_time = Cesium.JulianDate.fromIso8601(JSON.parse(prev_flight_points[i]).time); // Update the current time until we reach the last timestamp
        var flight_point = JSON.parse(prev_flight_points[i]);
        console.log(i, ': ', flight_point);
        // Declare the time for this individual sample and store it in a new JulianDate instance.
        const time = Cesium.JulianDate.fromIso8601(flight_point.time); // Assumes timestamp is in Iso8601.
        const position = Cesium.Cartesian3.fromDegrees(flight_point.longitude, flight_point.latitude, flight_point.height);
        // Store the position along with its timestamp.
        var comment = flight_point.comment.slice(0,-16); // Edit if necessary for your specific mission
        // Here we add the positions all upfront, but these can be added at run-time as samples are received from a server.
        positionProperty.addSample(time, position);
        viewer.entities.add({
          description: `Location: (${flight_point.longitude}, ${flight_point.latitude}, ${flight_point.height})`,
          label: {
            text : comment,
            font : '14pt monospace',
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            outlineWidth : 2,
            verticalOrigin : Cesium.VerticalOrigin.BOTTOM,
            pixelOffset : new Cesium.Cartesian2(0, -9)
          },
          position: position,
          point: { pixelSize: 10, color: Cesium.Color.RED }
        });
      }
      if(start_time == null || current_time == null) return; // For the case that there is no previous flight data
      viewer.clock.currentTime = current_time.clone(); // current_time should be the latest packet reported. Set current_time before we add a 1sec delay to the stop_time.
      stop_time = Cesium.JulianDate.addSeconds(current_time, 1, new Cesium.JulianDate()); // if we only have 1 data point, stop_time > start_time
      console.log('Clock interval: ' + start_time + ' to ' + stop_time);
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
      viewer.trackedEntity = undefined;
      // Make the camera fly to the balloon.
      viewer.flyTo(balloonEntity);
    });

    // New flight point received from the server
    socket.on('new_flight_point', (new_flight_point) => { //new_flight_point is JSON obj
      current_time = Cesium.JulianDate.fromIso8601(new_flight_point.time);
      const position = Cesium.Cartesian3.fromDegrees(new_flight_point.longitude, new_flight_point.latitude, new_flight_point.height);
      // Store the position along with its timestamp.
      var comment = new_flight_point.comment.slice(0,-16); // Edit if necessary for your specific mission
      // Add at run-time as samples are received from a server.
      positionProperty.addSample(current_time, position);
      // Plot it on the cesium app
      viewer.entities.add({
        description: `Location: (${new_flight_point.longitude}, ${new_flight_point.latitude}, ${new_flight_point.height})`,
        label: {
          text : comment,
          font : '14pt monospace',
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          outlineWidth : 2,
          verticalOrigin : Cesium.VerticalOrigin.BOTTOM,
          pixelOffset : new Cesium.Cartesian2(0, -9)
        },
        position: position,
        point: { pixelSize: 10, color: Cesium.Color.RED }
      });
      if (balloonEntity != null) { // Where there are data already present in Cesium before new data is entered.
        var revd_pkt_stop_time = Cesium.JulianDate.addSeconds(current_time, 1, new Cesium.JulianDate()); // Required for stop_time > start_time
        if(Cesium.JulianDate.compare(revd_pkt_stop_time, stop_time) > 0) {
          stop_time = revd_pkt_stop_time.clone(); // Incase flight data is sent in the wrong order.
        }
        balloonEntity.position = positionProperty; // Update the path of the balloon object
        balloonEntity.orientation =  new Cesium.VelocityOrientationProperty(positionProperty);
        // Extend the life of the balloon object
        balloonEntity.availability = new Cesium.TimeIntervalCollection([ new Cesium.TimeInterval({ start: start_time, stop: stop_time}) ]);
        // window.alert("New packet received! Teleporting you over!");
        viewer.clock.shouldAnimate = false;
      } else { // For fresh servers without any previous flight data. ie balloonEntity == null && start_time == null.
        stop_time = Cesium.JulianDate.addSeconds(current_time, 1, new Cesium.JulianDate()); // Required for stop_time > start_time
        viewer.clock.startTime = current_time.clone(); // define the start time
        viewer.timeline.zoomTo(current_time, stop_time); // in this special case, the current_time is also the start_time
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
      }
      viewer.clock.currentTime = current_time.clone(); // update the clock displayed in the GUI
      viewer.clock.stopTime = stop_time.clone(); // update the stop time
      viewer.trackedEntity = undefined; // Untrack any objects to make the camera flight transition smooth
      viewer.flyTo(balloonEntity); // Teleport the camera to the balloon
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