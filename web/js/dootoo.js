///////////////
// Map stuff //
///////////////
var geocoder;
var map;
var distance = 20;

function init_map() { // add parameter for location data
	geocoder = new google.maps.Geocoder();
	var mapOptions = {
			center: { lat: 35.27445, lng: -120.653455 },
			zoom: 12,
			maxZoom: 18
	};
	map = new google.maps.Map(document.getElementById('map'), mapOptions);
}

google.maps.event.addDomListener(window, 'load', init_map);

///////////////////
// Rest Handling //
///////////////////
var baseUrl = 'http://localhost:8081/';

///////////////////
//     Auth      //
///////////////////
function check_logged_in() {
	// call out to backend
	// if user is logged in, do not display the login dialog
}

function login() {
	$('#password').val('');
	if (!valid_username())
		return false
	var url = baseUrl + 'users/search/findById?email=' + $('#username').val();
	//TODO: call the correct endpoint for shiro stuff
	$.ajax({
		url:url,
		type:'GET',
		dataType:'json'
	}).done(function(data) {
		if (data._embedded != null && data._embedded.users.length > 0) {
			var user = data._embedded.users[0];
			var html = '<li class="navbar-text">';
			html += user.profileImg == null ? '<span class="glyphicon glyphicon-user"></span>' : '<img src = "' + user.proflieImg + '>';
			html += ' Hi, ' + user.firstName + '!</li><li><a href="/web" class="navbar-link">logout</a></li>'
			$('#login_nav').html(html);
		} else {
			alert('Could not login!');
		}
	}).fail(function() {
		alert('Could not login');
	});
	return true;
}

function valid_username() {
	if ($('#username').val() == '' || $('#username').val().indexOf('@') <= 0) {
		$('#username_group').addClass('has-error');
		return false;
	} else {
		$('#username_group').removeClass('has-error');
	}
	
	return true;
}

check_logged_in();

///////////////////
//   filtering   //
///////////////////
var tags = [];
function change_zip() {
	var where = document.getElementById('loc').value;
	if (where == null || where == '') {
		return false;
	}
	geocoder.geocode( { 'address': where}, function(results, status) {
		if (status == google.maps.GeocoderStatus.OK) {
			var lng = results[0].geometry.location.lng();
			var lat = results[0].geometry.location.lat();
			var url = 'http://localhost:8081/happenings/search/findByLocNear?loc=' + lat + ',' + lng + '&distance=' + distance + 'miles';
			$.ajax({
				url:url,
				type:'GET',
				dataType:'json'
			}).done(function(data) {
				map.setCenter(results[0].geometry.location);
				map.setZoom(12);
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
	// TODO: keep the existing tags?
	var what = document.getElementById('tags').value;
	var newTags = []
	if (what != '') {
		newTags = what.replace(', ',' ').replace(',',' ').split(' ');
	} else if (tags.length == 0) {
		return false;
	}
	tags = newTags.length > 0 ? $.merge(tags, what.replace(', ',' ').replace(',',' ').split(' ')) : tags;
	var latlng = map.getCenter();
	var lat = latlng.lat();
	var lng = latlng.lng();
	var url = 'http://localhost:8081/happenings/search/findByTagsInAndLocNear?tags=' + tags + '&loc=' + lat + ',' + lng + '&distance=' + distance + 'miles';
	$.ajax({
		url:url,
		type:'GET',
		dataType:'json'
	}).done(function(data) {
		$('#happenings').html('');
		pop_pills(tags);
		display_happenings(data);
		$('#tags').val('');
	});
	return false;
}

function display_happenings(data) {
	if (data._embedded != null) {
		var bounds = new google.maps.LatLngBounds();
		data._embedded.happenings.forEach(function(hap) {
			var row = '<tr><td><strong>' + hap.title + '</strong><br>';
			row += hap.description + "<br>";
			row += hap.address + " " + hap.startTime + " - " + hap.endTime;
			$('#happenings').append(row);
			var marker = new google.maps.Marker({
				position: new google.maps.LatLng(hap.loc.y,hap.loc.x),
				map: map,
				title: hap.title
			});
			bounds.extend(marker.position);
		});
		map.fitBounds(bounds);
	}
}

function pop_pills(tags) {
	$('#tag_pills').html('');
	tags.forEach(function (tag) {
		//TODO: add onclick to the 'x'
		var html = '<div id="' + tag + '-group" class="btn-group btn-group-xs" role="group"><button class="btn btn-primary btn-xs disabled" type="button">' + tag + '</button>';
		html += '<button id="' + tag + '" class="btn btn-primary btn-xs" type="button" onclick="remove_pill(this)"><span aria-hidden="true">&times;</button></div> ';
		$('#tag_pills').append(html);
	});
}

function remove_pill(tag) {
	tags.splice(tags.indexOf(tag.id),1);
	$('#' + tag.id + '-group').remove();
	filter_happenings();
}