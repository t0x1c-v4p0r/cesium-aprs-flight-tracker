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

    socket.on('new_flight_point', (new_flight_point) => {
      // New flight point received from the server
      const stop = Cesium.JulianDate.fromIso8601(new_flight_point.time); // Assumes timestamp is in Iso8601.
      const position = Cesium.Cartesian3.fromDegrees(new_flight_point.longitude, new_flight_point.latitude, new_flight_point.height);
      // Store the position along with its timestamp.
      // Add at run-time as samples are received from a server.
      positionProperty.addSample(stop, position);
      viewer.clock.stopTime = stop.clone(); // update the stop time
      const start = Cesium.JulianDate.fromIso8601("2020-03-09T23:10:00Z"); // TODO: Remove
      viewer.timeline.zoomTo(start, stop);
      // Plot it on the cesium app
      const pointEntity = viewer.entities.add({
        description: `Location: (${new_flight_point.longitude}, ${new_flight_point.latitude}, ${new_flight_point.height})`,
        position: position,
        point: { pixelSize: 10, color: Cesium.Color.RED }
      });
      viewer.flyTo(pointEntity);
    });

    Cesium.Ion.defaultAccessToken = process.env.VUE_APP_ACCESS_TOKEN
    
    var viewer = new Cesium.Viewer('cesiumContainer', {
        terrainProvider: Cesium.createWorldTerrain()
    });

      /*const osmBuildings = */viewer.scene.primitives.add(Cesium.createOsmBuildings());

      const flightData = JSON.parse(
      '[{"longitude":-122.39053,"latitude":37.61779,"height":-27.32},{"longitude":-122.39035,"latitude":37.61803,"height":-27.32},{"longitude":-122.39019,"latitude":37.61826,"height":-27.32},{"longitude":-122.39006,"latitude":37.6185,"height":-27.32},{"longitude":-122.38985,"latitude":37.61864,"height":-27.32},{"longitude":-122.39005,"latitude":37.61874,"height":-27.32},{"longitude":-122.39027,"latitude":37.61884,"height":-27.32},{"longitude":-122.39057,"latitude":37.61898,"height":-27.32},{"longitude":-122.39091,"latitude":37.61912,"height":-27.32},{"longitude":-122.39121,"latitude":37.61926,"height":-27.32},{"longitude":-122.39153,"latitude":37.61937,"height":-27.32},{"longitude":-122.39175,"latitude":37.61948,"height":-27.32},{"longitude":-122.39207,"latitude":37.6196,"height":-27.32},{"longitude":-122.39247,"latitude":37.61983,"height":-27.32},{"longitude":-122.39253,"latitude":37.62005,"height":-27.32},{"longitude":-122.39226,"latitude":37.62048,"height":-27.32},{"longitude":-122.39207,"latitude":37.62075,"height":-27.32},{"longitude":-122.39186,"latitude":37.62106,"height":-27.32},{"longitude":-122.39172,"latitude":37.62127,"height":-27.32},{"longitude":-122.39141,"latitude":37.62174,"height":-27.32},{"longitude":-122.39097,"latitude":37.62227,"height":-27.32},{"longitude":-122.39061,"latitude":37.6224,"height":-27.31},{"longitude":-122.39027,"latitude":37.62249,"height":-27.31},{"longitude":-122.38993,"latitude":37.62256,"height":-27.31},{"longitude":-122.3895,"latitude":37.62267,"height":-27.31},{"longitude":-122.3889,"latitude":37.62256,"height":-27.31},{"longitude":-122.38854,"latitude":37.62242,"height":-27.31},{"longitude":-122.38814,"latitude":37.62225,"height":-27.31},{"longitude":-122.38778,"latitude":37.62209,"height":-27.31},{"longitude":-122.38744,"latitude":37.62195,"height":-27.31},{"longitude":-122.38671,"latitude":37.62164,"height":-27.31},{"longitude":-122.38638,"latitude":37.62151,"height":-27.31},{"longitude":-122.38604,"latitude":37.62136,"height":-27.31},{"longitude":-122.38571,"latitude":37.62123,"height":-27.31},{"longitude":-122.38512,"latitude":37.62098,"height":-27.31},{"longitude":-122.3848,"latitude":37.62084,"height":-27.31},{"longitude":-122.38453,"latitude":37.62074,"height":-27.31},{"longitude":-122.38425,"latitude":37.62062,"height":-27.3},{"longitude":-122.38397,"latitude":37.62049,"height":-27.3},{"longitude":-122.38372,"latitude":37.62039,"height":-27.3},{"longitude":-122.3835,"latitude":37.6203,"height":-27.3},{"longitude":-122.38324,"latitude":37.62019,"height":-27.3},{"longitude":-122.38271,"latitude":37.61996,"height":-27.3},{"longitude":-122.38248,"latitude":37.61986,"height":-27.3},{"longitude":-122.38191,"latitude":37.61962,"height":-27.3},{"longitude":-122.38159,"latitude":37.6195,"height":-27.3},{"longitude":-122.38126,"latitude":37.61935,"height":-27.3},{"longitude":-122.38058,"latitude":37.61906,"height":-27.3},{"longitude":-122.38026,"latitude":37.61894,"height":-27.3},{"longitude":-122.37955,"latitude":37.61863,"height":-27.3},{"longitude":-122.37913,"latitude":37.61847,"height":-27.3},{"longitude":-122.3781,"latitude":37.61813,"height":-27.3},{"longitude":-122.37763,"latitude":37.61799,"height":-27.29},{"longitude":-122.37663,"latitude":37.61768,"height":-27.29},{"longitude":-122.37617,"latitude":37.61753,"height":-27.29},{"longitude":-122.37561,"latitude":37.61736,"height":-27.29},{"longitude":-122.37532,"latitude":37.61727,"height":-27.29},{"longitude":-122.37506,"latitude":37.61718,"height":-27.29},{"longitude":-122.37468,"latitude":37.61704,"height":-27.29},{"longitude":-122.37436,"latitude":37.61689,"height":-27.29},{"longitude":-122.37402,"latitude":37.61674,"height":-27.29},{"longitude":-122.37362,"latitude":37.61657,"height":-27.29},{"longitude":-122.3732,"latitude":37.6164,"height":-27.29},{"longitude":-122.37235,"latitude":37.61604,"height":-27.29},{"longitude":-122.37198,"latitude":37.61588,"height":-27.29},{"longitude":-122.3716,"latitude":37.61573,"height":-27.28},{"longitude":-122.3712,"latitude":37.61555,"height":-27.28},{"longitude":-122.37032,"latitude":37.61518,"height":-27.28},{"longitude":-122.36938,"latitude":37.61476,"height":-27.28},{"longitude":-122.36872,"latitude":37.6143,"height":-27.28},{"longitude":-122.36811,"latitude":37.61387,"height":-27.28},{"longitude":-122.36747,"latitude":37.61352,"height":-27.28},{"longitude":-122.36672,"latitude":37.61321,"height":-27.28},{"longitude":-122.36602,"latitude":37.61292,"height":-27.28},{"longitude":-122.3655,"latitude":37.61269,"height":-27.28},{"longitude":-122.36498,"latitude":37.61247,"height":-27.27},{"longitude":-122.3639,"latitude":37.61203,"height":-27.27},{"longitude":-122.36337,"latitude":37.6118,"height":-27.27},{"longitude":-122.36254,"latitude":37.61146,"height":-27.27},{"longitude":-122.36203,"latitude":37.61124,"height":-27.27},{"longitude":-122.36154,"latitude":37.61103,"height":-27.27},{"longitude":-122.36106,"latitude":37.61082,"height":-27.27},{"longitude":-122.36029,"latitude":37.61052,"height":-27.27},{"longitude":-122.35989,"latitude":37.61048,"height":-27.27},{"longitude":-122.35953,"latitude":37.61055,"height":-27.27},{"longitude":-122.35922,"latitude":37.61074,"height":-27.26},{"longitude":-122.35893,"latitude":37.61117,"height":-27.26},{"longitude":-122.35875,"latitude":37.61144,"height":-27.26},{"longitude":-122.35865,"latitude":37.61171,"height":-27.26},{"longitude":-122.35889,"latitude":37.612,"height":-27.26},{"longitude":-122.35923,"latitude":37.61211,"height":-27.26},{"longitude":-122.35954,"latitude":37.61222,"height":-27.26},{"longitude":-122.36029,"latitude":37.61253,"height":-27.27},{"longitude":-122.36184,"latitude":37.61317,"height":-27.27},{"longitude":-122.36823,"latitude":37.61588,"height":-27.28},{"longitude":-122.37163,"latitude":37.61728,"height":-27.28},{"longitude":-122.38041,"latitude":37.62096,"height":-27.3},{"longitude":-122.38548,"latitude":37.6231,"height":-27.31},{"longitude":-122.3905,"latitude":37.6252,"height":10.79},{"longitude":-122.39517,"latitude":37.62721,"height":56.5},{"longitude":-122.40037,"latitude":37.62955,"height":125.07},{"longitude":-122.40507,"latitude":37.63171,"height":186.03},{"longitude":-122.41457,"latitude":37.63623,"height":292.69},{"longitude":-122.42428,"latitude":37.64062,"height":384.12},{"longitude":-122.42896,"latitude":37.64261,"height":429.83},{"longitude":-122.43398,"latitude":37.6447,"height":483.17},{"longitude":-122.44357,"latitude":37.64859,"height":582.21},{"longitude":-122.45319,"latitude":37.65243,"height":643.16},{"longitude":-122.4639,"latitude":37.65678,"height":719.35},{"longitude":-122.47395,"latitude":37.66081,"height":803.15},{"longitude":-122.47922,"latitude":37.66286,"height":841.25},{"longitude":-122.48441,"latitude":37.66489,"height":879.34},{"longitude":-122.49505,"latitude":37.66933,"height":970.77},{"longitude":-122.5003,"latitude":37.67162,"height":993.62},{"longitude":-122.51083,"latitude":37.67647,"height":1024.08},{"longitude":-122.51626,"latitude":37.67999,"height":1039.31},{"longitude":-122.52048,"latitude":37.68431,"height":1046.93},{"longitude":-122.52323,"latitude":37.68939,"height":1069.79},{"longitude":-122.52456,"latitude":37.69482,"height":1092.65},{"longitude":-122.5255,"latitude":37.70298,"height":1115.52},{"longitude":-122.52602,"latitude":37.70943,"height":1138.38},{"longitude":-122.52634,"latitude":37.71574,"height":1161.25},{"longitude":-122.51643,"latitude":37.73744,"height":1245.12},{"longitude":-122.50723,"latitude":37.74465,"height":1283.25},{"longitude":-122.50024,"latitude":37.74957,"height":1313.75},{"longitude":-122.4864,"latitude":37.75959,"height":1397.6},{"longitude":-122.47231,"latitude":37.77008,"height":1504.31},{"longitude":-122.45805,"latitude":37.78079,"height":1626.25}]'
      );


    const timeStepInSeconds = 30;
    const totalSeconds = timeStepInSeconds * (flightData.length - 1);
    const start = Cesium.JulianDate.fromIso8601("2020-03-09T23:10:00Z");
    const stop = Cesium.JulianDate.addSeconds(start, totalSeconds, new Cesium.JulianDate());
    viewer.clock.startTime = start.clone();
    viewer.clock.stopTime = stop.clone();
    viewer.clock.currentTime = start.clone();
    viewer.timeline.zoomTo(start, stop);
    // Speed up the playback speed 50x.
    viewer.clock.multiplier = 50;
    // Start playing the scene.
    viewer.clock.shouldAnimate = true;

    // The SampledPositionedProperty stores the position and timestamp for each sample along the radar sample series.
    const positionProperty = new Cesium.SampledPositionProperty();

    for (let i = 0; i < flightData.length; i++) {
      const dataPoint = flightData[i];

      // Declare the time for this individual sample and store it in a new JulianDate instance.
      const time = Cesium.JulianDate.addSeconds(start, i * timeStepInSeconds, new Cesium.JulianDate());
      const position = Cesium.Cartesian3.fromDegrees(dataPoint.longitude, dataPoint.latitude, dataPoint.height);
      // Store the position along with its timestamp.
      // Here we add the positions all upfront, but these can be added at run-time as samples are received from a server.
      positionProperty.addSample(time, position);

      viewer.entities.add({
        description: `Location: (${dataPoint.longitude}, ${dataPoint.latitude}, ${dataPoint.height})`,
        position: position,
        point: { pixelSize: 10, color: Cesium.Color.RED }
      });
    }

    // STEP 6 CODE (airplane entity)
    async function loadModel() {
      // Load the glTF model from Cesium ion.
      const airplaneUri = await Cesium.IonResource.fromAssetId(process.env.VUE_APP_AIRPLANE_MODEL);
      const airplaneEntity = viewer.entities.add({
        availability: new Cesium.TimeIntervalCollection([ new Cesium.TimeInterval({ start: start, stop: stop }) ]),
        position: positionProperty,
        // Attach the 3D model instead of the green point.
        model: { uri: airplaneUri },
        // Automatically compute the orientation from the position.
        orientation: new Cesium.VelocityOrientationProperty(positionProperty),    
        path: new Cesium.PathGraphics({ width: 3 })
      });
      
      viewer.trackedEntity = airplaneEntity;
    }

    loadModel();


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