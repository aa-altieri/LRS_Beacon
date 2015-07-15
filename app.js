// This function will build the xapi statement to report beacon detection
// or loss of signal
function xapi_notify(verb, status, key){

var d = new Date();
var n = d.toISOString();


var statement = {
    "timestamp": n,
    "actor": {
        "mbox": "mailto:altierian@gmail.com",
        "name": "EMT_002",
        "objectType": "Agent"
    },
    
    "verb": {
        "id": "http://adlnet.gov/expapi/verbs/" + verb,
        "display": {
            "en-US": verb
        }
    },
    
    "object": {
        "id": "http://adlnet.gov/expapi/activities/beacon",
        "definition": {
            "name": {
                "en-US": "beacon_tag"
            },
            "description": {
                "en-US": "beacon_tag has been " + status 
            }
        },
        "objectType": "Activity"
    },
    
    "result": {
        "response": key
    }
};

       // Dispatch the statement to the LRS
        ADL.XAPIWrapper.sendStatement(statement);
        alert("Statement Submitted");
}



var app = (function()
{
	// Application object.
	var app = {};

	// Specify your beacon 128bit UUIDs here.
	var regions =
	[
		// Estimote Beacon factory UUID.
		// Sample UUIDs for beacons in our lab.
		{uuid:'2F234454-CF6D-4A0F-ADF2-F4911BA9FFA6'}
	];

	// Dictionary of beacons.
	var beacons = {};

	// Timer that displays list of beacons.
	var updateTimer = null;

	app.initialize = function()
	{
		document.addEventListener('deviceready', onDeviceReady, false);
	};

	function onDeviceReady()
	{
		// Specify a shortcut for the location manager holding the iBeacon functions.
		window.locationManager = cordova.plugins.locationManager;

		// Start tracking beacons!
		startScan();

		// Display refresh timer.
		updateTimer = setInterval(displayBeaconList, 500);
	}

	function startScan()
	{
		
		// The delegate object holds the iBeacon callback functions
		// specified below.
		var delegate = new locationManager.Delegate();

		// Called continuously when ranging beacons.
		delegate.didRangeBeaconsInRegion = function(pluginResult)
		{	
			var count = 0;
			//console.log('didRangeBeaconsInRegion: ' + JSON.stringify(pluginResult))
			for (var i in pluginResult.beacons)
			{
				// Insert beacon into table of found beacons.
				var beacon = pluginResult.beacons[i];
				beacon.timeStamp = Date.now();
				var key = beacon.uuid + ':' + beacon.major + ':' + beacon.minor;
// Check to see if we've already found this beacon, if we have, ignore it.  
// If not, send the xAPI statement that the beacon was enabled

				if (key in beacons) {}
					else {xapi_notify("initialized", "enabled", key);}
				beacons[key] = beacon;
			}
		};

		// Called when starting to monitor a region.
		// (Not used in this example, included as a reference.)
		delegate.didStartMonitoringForRegion = function(pluginResult)
		{
			//console.log('didStartMonitoringForRegion:' + JSON.stringify(pluginResult))
		};

		// Called when monitoring and the state of a region changes.
		// (Not used in this example, included as a reference.)
		delegate.didDetermineStateForRegion = function(pluginResult)
		{
			//console.log('didDetermineStateForRegion: ' + JSON.stringify(pluginResult))
		};

		// Set the delegate object to use.
		locationManager.setDelegate(delegate);

		// Request permission from user to access location info.
		// This is needed on iOS 8.
		locationManager.requestAlwaysAuthorization();

		// Start monitoring and ranging beacons.
		for (var i in regions)
		{
			var beaconRegion = new locationManager.BeaconRegion(
				i + 1,
				regions[i].uuid);

			// Start ranging.
			locationManager.startRangingBeaconsInRegion(beaconRegion)
				.fail(console.error)
				.done();

			// Start monitoring.
			// (Not used in this example, included as a reference.)
			locationManager.startMonitoringForRegion(beaconRegion)
				.fail(console.error)
				.done();
		}
	}

	function displayBeaconList()
	{
		// Clear beacon list.
		$('#found-beacons').empty();

		var timeNow = Date.now();

		// Update beacon list.
		$.each(beacons, function(key, beacon)
		{
			// Only show beacons that are updated during the last 60 seconds.
//			if (beacon.timeStamp + 60000 > timeNow)
			if (beacon.timeStamp + 5000 > timeNow)

			{
				// Map the RSSI value to a width in percent for the indicator.
				var rssiWidth = 1; // Used when RSSI is zero or greater.
				if (beacon.rssi < -100) { rssiWidth = 100; }
				else if (beacon.rssi < 0) { rssiWidth = 100 + beacon.rssi; }

				// Create tag to display beacon data.
				var element = $(
					'<li>'
					+	'<strong>UUID: ' + beacon.uuid + '</strong><br />'
					+	'Major: ' + beacon.major + '<br />'
					+	'Minor: ' + beacon.minor + '<br />'
					+	'Proximity: ' + beacon.proximity + '<br />'
					+	'RSSI: ' + beacon.rssi + '<br />'
					+ 	'<div style="background:rgb(255,128,64);height:20px;width:'
					+ 		rssiWidth + '%;"></div>'
					+ '</li>'
				);

				$('#warning').remove();
				$('#found-beacons').append(element);
			}
			else 
			{
// If the beacon hasn't been heard from in x seconds, send the statement to the LRS
// that the tag was disabled.

			xapi_notify("terminated", "disabled", key);

// remove the beacon from the list of found beacons.  This way, it will only report
// that it's was disabled once.  Also, it will report again the next time it's found.
			delete beacons[key];			
			}
		});
	}

	return app;
})();

app.initialize();
