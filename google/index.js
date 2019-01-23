var app = angular.module('geolocation', []);
var map;
var status = false;
var gmarkers = [];

app.controller('MainCtrl', function($scope) {
  $scope.cells = [{
    "id": 2,
    "cellTowers": [{
      "cellId": 9341,
      "locationAreaCode": 12710,
      "mobileCountryCode": 255,
      "mobileNetworkCode": 6,
      "signalStrength": 28
    }]
  },{
    "id": 3,
    "cellTowers": [{
      "cellId": 9243,
      "locationAreaCode": 12710,
      "mobileCountryCode": 255,
      "mobileNetworkCode": 6,
      "signalStrength": 26
    }]
  },{
    "id": 4,
    "cellTowers": [{
      "cellId": 9401,
      "locationAreaCode": 12710,
      "mobileCountryCode": 255,
      "mobileNetworkCode": 6,
      "signalStrength": 17
    }]
  }];

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
    removeMarkers();
    geolocator('cells', $scope.cells, $scope.cells.length);
  }

  // Build WAP JSON for Google Search
  $scope.waps = [
    { "id": 1, "address": '', "signalStrength": -70},
    { "id": 2, "address": '', "signalStrength": -70}
  ];
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
  $scope.wapSearch = function() {
    const wapDetails = {
      "considerIp": "false",
      "wifiAccessPoints": $scope.waps
    }
    geolocator('waps', null, null, wapDetails);
  }

  // Build WAP JSON for Mylnikov Search
  $scope.macs = [{ "id": 1, "address": '', "signalStrength": -70}]
  $scope.macsIndex = $scope.macs.length;
  $scope.addNewMac = function() {
    if($scope.macs.length>=5){
      alert("MAC address cannot be more than 5");
      return;
    }

    var newItemNo = ++$scope.macsIndex;
    $scope.macs.push({
      "id": newItemNo,
      "address": '',
      "signalStrength": -70
    });
  };

  $scope.removeMac = function(id) {
    if($scope.macs.length<=1){
      alert("MAC address cannot be less than 1");
      return;
    }

    var index = -1;
    var comArr = eval( $scope.macs );
    for( var i = 0; i < comArr.length; i++ ) {
      if( comArr[i].id === id) {
        index = i;
        break;
      }
    }

    if( index === -1 ) {
      alert( "Something gone wrong" );
    }

    $scope.macs.splice( index, 1 );
  };
  $scope.macSearch = function() {
    bssidSearch($scope.macs, $scope.macsIndex);
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

    } else {
      alert ('All fields are required');
    }
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
            $('#cellSearch').modal('hide');
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

    const searchParams = JSON.stringify(waps);
    const xhr = new XMLHttpRequest();

    xhr.onload = function() {
      if (this.readyState === XMLHttpRequest.DONE && this.status != 200) {
        const data = JSON.parse(xhr.responseText);
        if (data.hasOwnProperty('error')) {
          // Parse errors and display in a better format
          alert(data.error.message);
          $('#macSearch').modal('hide');
        }
      }

      // Add location data to the map
      if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
        const data = JSON.parse(xhr.responseText);
        if (data.hasOwnProperty('location')) {
          placeMarker(data, null, null, 'blue');
          $('#macSearch').modal('hide');
        }
      }
    }
    xhr.open("POST", geolocatorUrl, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(searchParams);
  }
}

function bssidSearch(macs) {
  removeMarkers();

  const bssid = parseString(macs).split(",")
  bssid.forEach(function(mac) {
    findWifi(mac, bssid)
  });


}

function findWifi(wifiBssid, bssid) {
  wifiBssid.split(";").slice(0, 20).forEach(function (name) {
    bssidOne = name.trim().split(",")[0];
      if (bssidOne.length >= 12) {
        $.getJSON("https://api.mylnikov.org/wifi?v=1.1&bssid=" + bssidOne + "&jsoncallback=?",
          { tags: "jquery", tagmode: "any", format: "json" },
          function (response) {
            if (response.result == 200) {
              const data = {
                accuracy: response.data.range,
                location: { lat: response.data.lat, lng: response.data.lon },
              }
              placeMarker(data, null, bssid, 'yellow');

              $('#wifiSearch').modal('hide');
            }

            if (response.result != 200) {
              alert(wifiBssid +" "+response.desc);
            }
        });
      } else {
        alert('Please MAC Address format');
      }
  });
  return false;
}

function placeMarker(data, cell, waps, color) {


  const position = { lat: data.location.lat, lng: data.location.lng};
  let bounds = new google.maps.LatLngBounds();
  bounds.extend(position);
  const center = new google.maps.LatLng(data.location.lat, data.location.lng);

  console.log(bounds);

  let infoWindowContent = '<div class="info_content"><div class="row">';

  if (cell) {
    infoWindowContent += '<div class="col-md-6">' +
        '<p><b>MNC: </b>'+ cell.cellTowers[0].mobileNetworkCode +'</p>' +
        '<p><b>MCC: </b>'+ cell.cellTowers[0].mobileCountryCode +'</p>' +
        '<p><b>LAC: </b>'+ cell.cellTowers[0].locationAreaCode +'</p>' +
        '<p><b>CELL ID: </b>'+ cell.cellTowers[0].cellId +'</p>' +
        '</div>';
  } else if (waps){
    infoWindowContent += '<div class="col-md-6">' +
        '<p><b>MAC Address: </b>'+ waps[0] +'</p>' +
        '</div>';
  }

  infoWindowContent +='<div class="col-md-6">' +
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
    icon: {
      url: "http://maps.google.com/mapfiles/ms/icons/"+color+"-dot.png"
    }
  });

  if(data.radius || data.accuracy) {
    let radius = parseInt(data.radius) || parseInt(data.accuracy)
    const circle = new google.maps.Circle({
      map: map,
      radius: radius,
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
    this.setZoom(5);
    google.maps.event.removeListener(boundsListener);
  });
}

function removeMarkers() {
  for (i = 0; i < gmarkers.length; i++) {
    gmarkers[i].setMap(null);
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

function numberParser(number) {
  const parsedNumber = parseInt(number)
  if (isNaN(parsedNumber)) {
    return false;
  } else {
    return parsedNumber
  }
}

function parseString(macs){
  let parsedMacs = '';
  let searchString = '';

  parsedMacs = macs.map(function(mac) {
    let string= mac.address
    return string;
  })

  searchString = parsedMacs.join(",");
  return searchString
}
