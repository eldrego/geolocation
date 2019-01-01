var app = angular.module('geolocation', []);
var map;
var status = false;
var gmarkers = [];

app.controller('MainCtrl', function($scope) {
  var defaultCell = [{
    "id": 1,
    "cellTowers": [{
      "cellId": 30961,
      "locationAreaCode": 181,
      "mobileCountryCode": 621,
      "mobileNetworkCode": 60,
      "signalStrength": -60
    }]
  }];

  $scope.cells = defaultCell;

  $scope.index = $scope.cells.length;

  $scope.addNewCell = function() {

    if($scope.cells.length>=5){
      alert("Cell towers cannot be more than 5");
      return;
    }

    var newItemNo = ++$scope.index;
    $scope.cells.push({
      "id": newItemNo,
      "cellTowers": [{
        "cellId": '',
        "locationAreaCode": '',
        "mobileCountryCode": '',
        "mobileNetworkCode": '',
        "signalStrength": -60
      }]
    });
  };

  $scope.removeCell = function(id) {
    if($scope.cells.length<=1){
      alert("Cell towers cannot be less than 1");
      return;
    }

    var index = -1;
    var comArr = eval( $scope.cells );
    for( var i = 0; i < comArr.length; i++ ) {
      if( comArr[i].id === id) {
        index = i;
        break;
      }
    }

    if( index === -1 ) {
    	alert( "Something gone wrong" );
    }

    $scope.cells.splice( index, 1 );
  };

  $scope.cellTowerSearch = function() {

    geolocator($scope.cells, $scope.cells.length);
    // $scope.cells.forEach(function (item, index){
    //
    //   delete item.id;
    //   geolocator(item);
    //
    //   if (($scope.cells.length - 1) === index) {
    //     console.log('triangulate now');
    //
    //     setTimeout(triangulate(cellTowers), 10000);
    //
    //   }
    // });
  }

});

function initMap() {
  let center = new google.maps.LatLng(0.0, 0.0);
  const myOptions = {
      zoom: 13,
      // streetViewControl: true,
      // mapTypeId: google.maps.MapTypeId.ROADMAP,
      // disableDefaultUI: true,
      mapTypeControl: true,

      mapTypeControlOptions: {
          style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
          position: google.maps.ControlPosition.TOP_RIGHT
      },
      zoomControl: true,
      zoomControlOptions: {
          style: google.maps.ZoomControlStyle.SMALL,
          position: google.maps.ControlPosition.RIGHT_CENTER
      },
      scaleControl: true,
      streetViewControl: false
  };

  map = new google.maps.Map(document.getElementById('map'), myOptions);
  map.setZoom(2);
  // map.setTilt(50); What does this do?

  center = new google.maps.LatLng(0.0, 0.0);
  map.setCenter(center);
}

function geolocator(cells, cellsLength) {

  var cellTowers = [];
  const APIKEY = 'AIzaSyAkRoMQzL7wzo7ysIy1LQXzI5rE6YDA4TY';
  const geolocatorUrl = "https://www.googleapis.com/geolocation/v1/geolocate?key=AIzaSyAkRoMQzL7wzo7ysIy1LQXzI5rE6YDA4TY";

  cells.forEach(function (cell, index){
    delete cell.id;

    const searchParams = JSON.stringify(cell);

    const xhr = new XMLHttpRequest();

    xhr.onload = function() {
      if (this.readyState === XMLHttpRequest.DONE && this.status != 200) {
        const data = JSON.parse(xhr.responseText);
        if (data.hasOwnProperty('error')) {
          // Parse errors and display in a better format
          alert(data.error.message);
          // $('#cellSearch').modal('hide');
        }
      }

      // Add location data to the map
      if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
        const data = JSON.parse(xhr.responseText);
        if (data.hasOwnProperty('location')) {

          // build triagulation metadata
          const cellDetails = {
            latitude: data.location.lat,
            longitude: data.location.lng,
            signalStrength: cell.cellTowers[0].signalStrength,
            signalStrengthRatio: 1
          };

          cellTowers.push(cellDetails);

          if (cellsLength > 1) {
            if ((cellsLength - 1) === index) {
              // Now you can triangulate
              setTimeout(triangulate(cellTowers), 10000);
            };
          }

          placeMarker(data, cell);
          $('#cellSearch').modal('hide');

        }
      }
    }
    xhr.open("POST", geolocatorUrl, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(searchParams);
  });

}

function placeMarker(data, cell) {

  const position = { lat: data.location.lat, lng: data.location.lng};
  let bounds = new google.maps.LatLngBounds();

  bounds.extend(position);
  const center = new google.maps.LatLng(data.location.lat, data.location.lng);

  // Info Window Content
  const infoWindowContent = '<div class="info_content">' +
      '<div class="row">' +
      '<div class="col-md-6">' +
      '<p><b>MNC: </b>'+cell.cellTowers[0].mobileNetworkCode +'</p>' +
      '<p><b>MCC: </b>'+ cell.cellTowers[0].mobileCountryCode +'</p>' +
      '<p><b>LAC: </b>'+ cell.cellTowers[0].locationAreaCode +'</p>' +
      '<p><b>CELL ID: </b>'+ cell.cellTowers[0].cellId +'</p>' +
      '</div>' +
      '<div class="col-md-6">' +
      '<p><b>Lat: </b>'+ data.location.lat +'</p>' +
      '<p><b>Lng: </b>'+ data.location.lng +'</p>' +
      '<p><b>Accuracy: </b>'+ data.accuracy || null +'</p>' +
      '</div>' +
      '</div></div>';

  // Display multiple markers on a map
  var infowindow = new google.maps.InfoWindow({
    content: infoWindowContent
  });

  const marker = new google.maps.Marker({
    position: position,
    map: map,
    title: 'Cell Tower',
    icon: {
      url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png"
    }
  });

  var circle = new google.maps.Circle({
    map: map,
    // radius: 100,    // 10 miles in metres
    fillColor: '#313131',
    fillOpacity: .3,
    strokeColor: '#fff',
    strokeOpacity: .4,
    strokeWeight: .8
  });

  circle.bindTo('center', marker, 'position');

  // Allow each marker to have an info window
  marker.addListener('click', function() {
    infowindow.open(map, marker);
  });

  gmarkers.push(marker);
  gmarkers.push(circle);

  map.fitBounds(bounds);

  var boundsListener = google.maps.event.addListener((map), 'bounds_changed', function(event) {
    this.setZoom(14);
    google.maps.event.removeListener(boundsListener);
  });
}

function placeTriangulatedMarker(data) {

  const position = { lat: data.location.lat, lng: data.location.lng};
  let bounds = new google.maps.LatLngBounds();

  bounds.extend(position);
  const center = new google.maps.LatLng(data.location.lat, data.location.lng);

  const marker = new google.maps.Marker({
    position: position,
    map: map,
    icon: {
      url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
    }
  });

  gmarkers.push(marker);
}

function removeMarkers() {
  for (i = 0; i < gmarkers.length; i++) {
    gmarkers[i].setMap(null);
  }
}

function numberParser(number) {
  const parsedNumber = parseInt(number)
  if (isNaN(parsedNumber)) {
    return false;
  } else {
    return parsedNumber
  }
}

function triangulate(towers) {
  console.log(towers, 'these are the towers');

  var totalSignalStrength = 0;
  for (var i = 0; i < towers.length; i++)
  totalSignalStrength += towers[i].signalStrength;

  for (var i = 0; i < towers.length; i++)
  towers[i].signalStrengthRatio = towers[i].signalStrength / totalSignalStrength;

  var clientLongitude = 0;
  for (var i = 0; i < towers.length; i++)
  clientLongitude += towers[i].longitude * towers[i].signalStrengthRatio;

  var clientLatitude = 0;
  for (var i = 0; i < towers.length; i++)
  clientLatitude += towers[i].latitude * towers[i].signalStrengthRatio;

  console.log("longitude: " + clientLongitude);
  console.log("latitude: " + clientLatitude);

  const data = {
    location: { lat: clientLatitude, lng: clientLongitude },
  };

  placeTriangulatedMarker(data);
}

$(document).ready(function () {
  $(document).on('click', '#placeit', function(event) {
    const data = {
      accuracy: 1663,
      location: { lat: 6.4557421, lng: 3.3976888 },
    }
    placeMarker(data);
  })

  // var center = new google.maps.LatLng(0.0, 0.0);
  //
  // google.maps.event.addDomListener(window, 'load', initialize);
  // google.maps.event.addDomListener(window, 'resize', function () {
  //   map.setCenter(center);
  // });
});
