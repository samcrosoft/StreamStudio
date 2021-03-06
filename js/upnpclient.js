function getUpnpPosition() {
	mediaRenderer.getPositionInfo().then(function(response) {      
		if (response && response.data) {
			var pct = (hmsToSecondsOnly(response.data.RelTime) * 100 / hmsToSecondsOnly(response.data.TrackDuration)).toFixed(2);
			$('.mejs-time-current').css({width: pct+'%', maxWidth: '100%'})
			$('span.mejs-currenttime').text(response.data.RelTime);
			$('span.mejs-duration').text(response.data.TrackDuration);
			mediaDuration = hmsToSecondsOnly(response.data.TrackDuration);
			if(upnpToggleOn) {
				mediaCurrentTime = hmsToSecondsOnly(relTime);
			} else {
				player.media.currentTime = hmsToSecondsOnly(relTime);
			}
			updateTimer.emit("timeupdate");
		} else {
			console.log("Upnp stopping...");
		}
    }).then( null, function( error) { // Handle any errors
		var pct = (hmsToSecondsOnly(relTime) * 100 / hmsToSecondsOnly(trackDuration)).toFixed(2);
		$('.mejs-time-current').css({width: pct+'%', maxWidth: '100%'})
		$('span.mejs-currenttime').text(relTime);
		$('span.mejs-duration').text(trackDuration);
		mediaDuration = hmsToSecondsOnly(trackDuration);
		if(upnpToggleOn) {
			mediaCurrentTime = hmsToSecondsOnly(relTime);
		} else {
			player.media.currentTime = hmsToSecondsOnly(relTime);
		}
		updateTimer.emit("timeupdate");
	});
}
