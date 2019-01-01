var app = angular.module('geolocation', []);

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
    if ($scope.cells.length > 1) {
      // Do triangulation stuff here.
    }

    $scope.cells.forEach(function (item){
      delete item.id
      geolocator(item);
    });
  }

});

var map;
var status = false;
var gmarkers = [];

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

function geolocator(cellParameters) {
  const APIKEY = 'AIzaSyAkRoMQzL7wzo7ysIy1LQXzI5rE6YDA4TY';
  const geolocatorUrl = "https://www.googleapis.com/geolocation/v1/geolocate?key=AIzaSyAkRoMQzL7wzo7ysIy1LQXzI5rE6YDA4TY";

  const searchParams = JSON.stringify(cellParameters);

  const xhr = new XMLHttpRequest();
  xhr.open("POST", geolocatorUrl, true);

  //Send the proper header information along with the request
  xhr.setRequestHeader("Content-Type", "application/json");

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
        placeMarker(data, cellParameters);
        $('#cellSearch').modal('hide');
      }
    }
  }
  xhr.send(searchParams);
}

function placeMarker(data, cellParameters) {

  const position = { lat: data.location.lat, lng: data.location.lng};
  let bounds = new google.maps.LatLngBounds();

  bounds.extend(position);
  const center = new google.maps.LatLng(data.location.lat, data.location.lng);

  // Info Window Content
  const infoWindowContent = '<div class="info_content">' +
      '<div class="row">' +
      '<div class="col-md-6">' +
      '<p><b>MNC: </b>'+cellParameters.cellTowers[0].mobileNetworkCode+'</p>' +
      '<p><b>MCC: </b>'+ cellParameters.cellTowers[0].mobileCountryCode +'</p>' +
      '<p><b>LAC: </b>'+ cellParameters.cellTowers[0].locationAreaCode +'</p>' +
      '<p><b>CELL ID: </b>'+ cellParameters.cellTowers[0].cellId +'</p>' +
      '</div>' +
      '<div class="col-md-6">' +
      '<p><b>Lat: </b>'+ data.location.lat +'</p>' +
      '<p><b>Lng: </b>'+ data.location.lng +'</p>' +
      '<p><b>Accuracy: </b>'+ data.accuracy +'</p>' +
      '</div>' +
      '</div></div>';

  // Display multiple markers on a map
  var infowindow = new google.maps.InfoWindow({
    content: infoWindowContent
  });


  const marker = new google.maps.Marker({
    position: position,
    map: map,
    title: 'title'
  });

  var circle = new google.maps.Circle({
    map: map,
    radius: 100,    // 10 miles in metres
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

$(document).ready(function () {
  $(document).on('click', '#placeit', function(event) {
    const data = {
      accuracy: 1663,
      location: { lat: 6.4557421, lng: 3.3976888 },
    }
    placeMarker(data);
  })

  $(document).on("click","#cellTowerSearch",function(event) {
    event.preventDefault();

    const cellId = numberParser($('input#cellId').val());
    const lac = numberParser($('input#lac').val());
    const mcc = numberParser($('input#mcc').val());
    const mnc = numberParser($('input#mnc').val());

    if (cellId && lac && mcc && mnc) {
      const cellParameters = {
       "homeMobileCountryCode": mcc,
       "homeMobileNetworkCode": mnc,
       "cellTowers": [
        {
         "cellId": cellId,
         "locationAreaCode": lac,
         "mobileCountryCode": mcc,
         "mobileNetworkCode": mnc
        }
       ],
       "wifiAccessPoints": []
      }

      // Get data from from and pass wot geolocator function
      geolocator(cellParameters);
    } else {
      alert ('All fields are required')
    }

  });

  $(document).on("click","#WiFiSearch",function(event) {
    event.preventDefault();

    var validateMAC = /^(([A-Fa-f0-9]{2}[:]){5}[A-Fa-f0-9]{2}[,]?)+$/

    // Create a reg expression to check that values are in valid MAC address format

    const macOne = $('input#macOne').val();
    const macTwo = $('input#macTwo').val();

    console.log(validateMAC.test(macOne));
    console.log(validateMAC.test(macTwo));

    if (validateMAC.test(macOne) && validateMAC.test(macTwo)) {
      const wifiMACAddress = {
        "considerIp": "false",
        "wifiAccessPoints": [
          {
              "macAddress": macOne,
              "signalStrength": -43,
              "signalToNoiseRatio": 0
          },
          {
              "macAddress": macTwo,
              "signalStrength": -55,
              "signalToNoiseRatio": 0
          }
        ]
      }

      // Get data from from and pass wot geolocator function
      geolocator(wifiMACAddress);
    } else {
      alert ('All fields are required')
    }

  });

  // var center = new google.maps.LatLng(0.0, 0.0);
  //
  // google.maps.event.addDomListener(window, 'load', initialize);
  // google.maps.event.addDomListener(window, 'resize', function () {
  //   map.setCenter(center);
  // });
});
