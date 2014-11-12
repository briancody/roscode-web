///////////////
// Map stuff //
///////////////
var geocoder;
var map;

function init_map() { // add parameter for location data
	geocoder = new google.maps.Geocoder();
	var mapOptions = {
			center: { lat: 35.27445, lng: -120.653455 },
			zoom: 12
	};
	map = new google.maps.Map(document.getElementById('map'), mapOptions);
}

google.maps.event.addDomListener(window, 'load', init_map);

///////////////////
// Rest Handling //
///////////////////
function change_zip() {
	var where = document.getElementById('loc').value;
	if (where == null || where == '') {
		return false;
	}
	geocoder.geocode( { 'address': where}, function(results, status) {
		if (status == google.maps.GeocoderStatus.OK) {
			var lng = results[0].geometry.location.lng();
			var lat = results[0].geometry.location.lat();
			var url = 'http://localhost:8081/happenings/search/findByLocNear?loc=' + lng + ',' + lat
			$.ajax({
				url:url,
				type:'GET',
				dataType:'json'
			}).done(function(data) {
				map.setCenter(results[0].geometry.location);
				$('#happenings').html('');
				display_happenings(data);
				$('#loc').val('');
			});
		} else {
			alert ('Could not geocode your address.');
		}
	});
	return false;
}

function filter_happenings() {
	var what = document.getElementById('tags').value;
	if (what == null || what == '') {
		return false;
	}
	var latlng = map.getCenter();
	var lat = latlng.lat();
	var lng = latlng.lng();
	var url = 'http://localhost:8081/happenings/search/findByTagsInAndLocNear?tags=' + what + '&loc=' + lng + ',' + lat;
	$.ajax({
		url:url,
		type:'GET',
		dataType:'json'
	}).done(function(data) {
		$('#happenings').html('');
		display_happenings(data);
		$('#tags').val('');
	});
	return false;
}

function display_happenings(data) {
	if (data._embedded != null) {
		data._embedded.happenings.forEach(function(hap) {
			var row = "<tr><td><strong>" + hap.title + "</strong><br>";
			row += hap.description + "<br>";
			row += hap.address + " " + hap.startTime + " - " + hap.endTime;
			$('#happenings').append(row);
		});
	}
	
}