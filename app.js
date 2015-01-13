//Ensure operability of app
if (!window.localStorage) {
	document.body.innerHTML += "Unable to load app: localStorage missing!";
}



//Allow user to choose when to start the app
var runButton = new Cel({
	type: "button",
	attrs: {
		onclick: "start()"
	},
	innerHTML: "Open website"
});
document.body.appendChild(runButton);
var hasRun = false;

//Also allow the user to choose to run on startup
var autoRun = localStorage.getItem("ROS");
while (autoRun == null) {
	autoRun = "unsure";
	localStorage.setItem("ROS", autoRun);
}
if (autoRun == "yes") {
	start();
}

function start() {
if (autoRun == "unsure") {
	var userpref = confirm("Do you want to auto-start this application next time?");
	if (userpref == true) {
		autoRun = "yes";
		localStorage.setItem("ROS", autoRun);
	} else if (userpref == false) {
		autoRun = "no";
		localStorage.setItem("ROS", autoRun);
	}
}
if (hasRun) {
	return;
} else {
	hasRun = true;
	runButton.remove();
}
//Do everything in encapsulated, anonymous function
(function() {

	//Set up ajax call
	var xmlhttp = function(callback) {
		//Get google spreadsheet key from localStorage
		var SHEET_KEY = localStorage.getItem("SSK");
		while (SHEET_KEY == null) {
			SHEET_KEY = prompt("Enter your public Google Spreadsheets Key", "");
			localStorage.setItem("SSK", SHEET_KEY);
		}
		//Define the ajax url
		var SHEET_URL = "//spreadsheets.google.com/feeds/list/" + SHEET_KEY +
				"/od6/public/values?alt=json";
		//Create xmlhttp
		var xmlhttp;
		if (window.XMLHttpRequest) {
			xmlhttp = new XMLHttpRequest();
		} else {
			xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
		}
		xmlhttp.onreadystatechange = function() {
			//Ensure a success response
			if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
				//transform content to json then pass it to the callback
				var json = JSON.parse(xmlhttp.response);
				callback(json);
			}
		};
		xmlhttp.open("GET", SHEET_URL, true);
		return xmlhttp;
	}(function callback(json) {
		//In callback,
			//Get some spreadsheet metadata
			var metadata = function() {
				var info = {
					author: "",
					id: "",
					title: "",
					updated: ""
				};
				var feed = json["feed"];
				for (key in info) {
					if (key == "author") {
						for (key2 in info[key]) {
							info[key][key2] = feed[key][0][key2]["$t"];
						}
					} else {
						info[key] = feed[key]["$t"];
					}
				}
				return info;
			}();
			//Parse response for cel definitions
			var cels = function(definitions) {
				var entry = json["feed"]["entry"];
				//entry.length == number of element definitions
				for (var i = 0; i < entry.length; i++) {
					var options = {};
					//spreadsheet cells are prefixed with "gsx$"
					var regex = new RegExp("gsx\\$(.+)");
					for (key in entry[i]) {
						var res = key.match(regex);
						if (res && (res = res[1])) {
							options[res] = entry[i][key]["$t"];
						}
					}
					var celOptions = {
						type: options.type ? options.type : "",
						id: options.id ? options.id : "",
						classes: options.classes ? options.classes.split(" ") : [],
						innerHTML: options.innerhtml ? options.innerhtml : ""
					};
					definitions[options.localname] = {
						parent: options.parent,
						celOptions: celOptions
					};
				}
				return definitions;
			}({});
			//Iterate the cel definitions and add to body
			//Format of cels: [
			//	{ local_name, parent, celOptions },
			//	{ local_name, parent, celOptions }	
			//]
			for (key in cels) {
				var curr = cels[key];
				var el = new Cel(curr.celOptions);
				if (curr.parent) {
					var parentId = cels[curr.parent].celOptions.id;
					var parent = document.getElementById(parentId);
					parent.appendChild(el);
				} else {
					document.body.appendChild(el);
				}
			}
	});
	//Send xmlhttp
	xmlhttp.send();
}())
}
