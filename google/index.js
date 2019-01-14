var app = angular.module('geolocation', []);
var map;
var status = false;
var gmarkers = [];

app.controller('MainCtrl', function($scope) {
  var defaultCell = [{
    "id": 1,
    "cellTowers": [{
      "cellId": '',
      "locationAreaCode": '',
      "mobileCountryCode": '',
      "mobileNetworkCode": '',
      "signalStrength": -60
    }]
  }];

  const wapDefaults = [
    {
      "id": 1,
      "macAddress": '',
      "signalStrength": -70
    },
    {
      "id": 2,
      "macAddress": '',
      "signalStrength": -70
    }
  ]

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

  // Search for Cell Towers
  $scope.cellTowerSearch = function() {
    removeMarkers();
    geolocator('cells', $scope.cells, $scope.cells.length);
  }


  $scope.waps = wapDefaults;
  $scope.wapIndex = $scope.waps.length;

  $scope.addNewWap = function() {
    if($scope.waps.length>=5){
      alert("MAC address cannot be more than 5");
      return;
    }

    var newItemNo = ++$scope.wapIndex;
    $scope.waps.push({
      "id": newItemNo,
      "macAddress": '',
      "signalStrength": -70
    });
  };

  $scope.removeWap = function(id) {
    if($scope.waps.length<=2){
      alert("MAC address cannot be less than 2");
      return;
    }

    var index = -1;
    var comArr = eval( $scope.waps );
    for( var i = 0; i < comArr.length; i++ ) {
      if( comArr[i].id === id) {
        index = i;
        break;
      }
    }

    if( index === -1 ) {
      alert( "Something gone wrong" );
    }

    $scope.waps.splice( index, 1 );
  };

  // Search for WAP using MAC addresses
  $scope.wapSearch = function() {
    const wapDetails = {
      "considerIp": "false",
      "wifiAccessPoints": $scope.waps
    }
    geolocator('waps', null, null, wapDetails);

    // 00:0E:2E:D2:BB:05
    // 00:08:9F:0E:0B:EF
  }

  const defaultPoint = {
    "details": '',
    "radius": ''
  }
  $scope.coord = defaultPoint;

  $scope.placeCoordinates = function(coord) {
    const coords = $scope.coord.details.split(",");

    if ($scope.coord.details && $scope.coord.radius) {
      const data = {
        accuracy: null,
        radius: $scope.coord.radius,
        location: { lat: parseFloat(coords[0]), lng: parseFloat(coords[1]) }
      }

      placeMarker(data, null, null, 'blue');
      $('#enterCoordinates').modal('hide');
      $scope.coord = angular.copy(defaultPoint);

    } else {
      alert ('All fields are required');
    }
  }

// 6.45423, 3.389154

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

function geolocator(searchType, cells, cellsLength, waps) {

  let cellTowers = [];
  const geolocatorUrl = "https://www.googleapis.com/geolocation/v1/geolocate?key=AIzaSyD72XGkolbzqHdVS3JE3WgPtfU7h8zVb4E";

  if (cells) {
    cells.forEach(function (cell, index){

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

            placeMarker(data, cell, null, 'green');

            if (cellsLength > 1) {
              if (cellTowers.length === cellsLength) {
                // Now you can triangulate
                setTimeout(triangulate(cellTowers), 10000);
              };
            }

            $('#cellSearch').modal('hide');

          }
        }
      }
      xhr.open("POST", geolocatorUrl, true);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.send(searchParams);
    });
  } else if (waps) {
    console.log(waps)
    const searchParams = JSON.stringify(waps);
    const xhr = new XMLHttpRequest();

    xhr.onload = function() {
      if (this.readyState === XMLHttpRequest.DONE && this.status != 200) {
        const data = JSON.parse(xhr.responseText);
        if (data.hasOwnProperty('error')) {
          // Parse errors and display in a better format
          console.log(data)
          alert(data.error.message);
          // $('#cellSearch').modal('hide');
        }
      }

      // Add location data to the map
      if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
        const data = JSON.parse(xhr.responseText);
        if (data.hasOwnProperty('location')) {

        }
      }
    }
    xhr.open("POST", geolocatorUrl, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(searchParams);
  }
}

function placeMarker(data, cell, waps, color) {

  const position = { lat: data.location.lat, lng: data.location.lng};
  let bounds = new google.maps.LatLngBounds();

  bounds.extend(position);
  const center = new google.maps.LatLng(data.location.lat, data.location.lng);

  let infoWindowContent = '';

  if (cell) {
    // Info Window Content
    infoWindowContent = '<div class="info_content">' +
        '<div class="row">' +
        '<div class="col-md-6">' +
        '<p><b>MNC: </b>'+ cell.cellTowers[0].mobileNetworkCode +'</p>' +
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
  } else if (waps){
    infoWindowContent = '<div class="info_content">' +
        '<div class="row">' +
        '<div class="col-md-6">' +
        '<p><b>MNC: </b> Content for the Gods </p>' +
        '</div>' +
        '</div></div>';
  } else {
    infoWindowContent = '<div class="info_content">' +
        '<div class="row">' +
        '<div class="col-md-6">' +
        '<p><b>Lat: </b>'+ data.location.lat +'</p>' +
        '<p><b>Lng: </b>'+ data.location.lng +'</p>' +
        '<p><b>Accuracy: </b>'+ data.accuracy || null +'</p>' +
        '</div>' +
        '</div></div>';
  }

  // Display multiple markers on a map
  var infowindow = new google.maps.InfoWindow({
    content: infoWindowContent
  });

  const marker = new google.maps.Marker({
    position: position,
    map: map,
    title: 'Cell Tower',
    icon: {
      url: "http://maps.google.com/mapfiles/ms/icons/"+color+"-dot.png"
    }
  });

  if(data.radius) {
    const circle = new google.maps.Circle({
      map: map,
      radius: parseInt(data.radius),
      fillColor: '#313131',
      fillOpacity: .3,
      strokeColor: '#fff',
      strokeOpacity: .4,
      strokeWeight: .8
    });

    circle.bindTo('center', marker, 'position');
    gmarkers.push(circle);
  }

  // Allow each marker to have an info window
  marker.addListener('click', function() {
    infowindow.open(map, marker);
  });

  gmarkers.push(marker);
  map.fitBounds(bounds);

  var boundsListener = google.maps.event.addListener((map), 'bounds_changed', function(event) {
    this.setZoom(14);
    google.maps.event.removeListener(boundsListener);
  });
}

// function placeTriangulatedMarker(data) {
//
//   const position = { lat: data.location.lat, lng: data.location.lng};
//   let bounds = new google.maps.LatLngBounds();
//
//   bounds.extend(position);
//   const center = new google.maps.LatLng(data.location.lat, data.location.lng);
//
//   const marker = new google.maps.Marker({
//     position: position,
//     map: map,
//     icon: {
//       url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
//     }
//   });
//
//   gmarkers.push(marker);
// }

// function placeCoordinates(lat, long, radius) {
//   const position = { lat: parseFloat(lat), lng: parseFloat(long)};
//   let bounds = new google.maps.LatLngBounds();
//
//   bounds.extend(position);
//   const center = new google.maps.LatLng(parseInt(lat), parseInt(long));
//
//   const marker = new google.maps.Marker({
//     position: position,
//     map: map,
//     icon: {
//       url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
//     },
//     title: 'Placed marker'
//   });
//
//   var circle = new google.maps.Circle({
//     map: map,
//     radius: parseInt(radius),
//     fillColor: '#313131',
//     fillOpacity: .3,
//     strokeColor: '#fff',
//     strokeOpacity: .5,
//     strokeWeight: .9
//   });
//
//   circle.bindTo('center', marker, 'position');
//
//   gmarkers.push(marker);
//   gmarkers.push(circle);
//
//   map.fitBounds(bounds);
//
//   var boundsListener = google.maps.event.addListener((map), 'bounds_changed', function(event) {
//     this.setZoom(14);
//     google.maps.event.removeListener(boundsListener);
//   });
// }

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

  const data = {
    location: { lat: clientLatitude, lng: clientLongitude },
  };

  placeMarker(data, null, null, 'red');
}

$(document).ready(function () {
  $(document).on('click', '#placeit', function(event) {
    const data = {
      accuracy: 1663,
      location: { lat: 6.4557421, lng: 3.3976888 },
    }
    placeMarker(data);
  })
});
