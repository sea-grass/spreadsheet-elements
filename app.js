(function() {
  "use strict";
  var style, runButton, clearKeysButton;
  var hasRun, autoRun;
  
  //Ensure operability of app
  if (!window.localStorage) {
    document.body.innerHTML += "Unable to load app: localStorage missing!";
    throw "Unsupported: localStorage";
  }
  //Set some attributes about the app
  hasRun = false;
  autoRun = localStorage.getItem("ROS");
  //Set the app's start method
  Object.defineProperty(window, "start", { value: start });
  Object.defineProperty(window, "clearSettings", { value: clearSettings });
  
  //Create stylesheet
  style = document.head.appendChild(Cel.createStyle({
    "rules": {
      "html, body": {
        "width": "100%",
        "height": "100%",
        "overflow": "hidden"
      },
      "#background_info": {
        "position": "absolute",
        "top": "0",
        "right": "0",
        "width": "550px",
        "height": "100%",
        "border": "1px solid black",
        "overflow": "hidden"
      },
      "#background_info > div": {
        "width": "100%",
        "height": "100%",
        "word-wrap": "break-word",
        "overflow-x": "hidden",
        "overflow-y": "scroll"
      }
    }
  }));
  //Allow user to choose when to start the app
  runButton = document.body.appendChild(new Cel({
    "type": "button",
    "innerHTML": "Open website",
    "attrs": {
      "onclick": "start()"
    }
  }));
  clearKeysButton = document.body.appendChild(new Cel({
    "type": "button",
    "innerHTML": "Clear spreadsheet keys and autorun setting",
    "attrs": {
      "onclick": "clearSettings()"
    }
  }));
  if (autoRun === null) {
    autoRun = "unsure";
    localStorage.setItem("ROS", autoRun);
  } else if (autoRun === "yes") {
    start();
  }
  
  function start() {
    var userpref;
    if (autoRun === "unsure") {
      userpref = confirm("Do you want to auto-start this application next time?");
      if (userpref === true) {
        autoRun = "yes";
        localStorage.setItem("ROS", autoRun);
      } else if (userpref === false) {
        autoRun = "no";
        localStorage.setItem("ROS", autoRun);
      }
    }
    if (hasRun) {
      return; //we've already run the application, don't want to run it again
    } else {
      hasRun = true;
      runButton.remove();
      runApplication();
    }
  }
  function clearSettings() {
    localStorage.removeItem("ROS");
    localStorage.removeItem("SSK");
    console.log("removed!");
  }
  function runApplication() {
    var SHEET_KEY, SHEET_URL;
    var xmlhttp;
    //Get the spreadsheet key from localStorage
    SHEET_KEY = localStorage.getItem("SSK");
    if (SHEET_KEY === null || SHEET_KEY === "null") {
      SHEET_KEY = prompt("Enter your public Google Spreadshets Key for your Cel.js app:", "");
      if (SHEET_KEY === "") {
        alert("Unspecified: SHEET_KEY");
        throw "Unspecified: SHEET_KEY";
      }
      localStorage.setItem("SSK", SHEET_KEY);
    }
    //Define the ajax url
    SHEET_URL = "//spreadsheets.google.com/feeds/list/" + SHEET_KEY +
				"/od6/public/values?alt=json";
		//Create xmlhttp
		if (window["XMLHttpRequest"]) xmlhttp = new XMLHttpRequest();
		else xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
		//Add xmlhttp callback
		xmlhttp.onreadystatechange = function() {
		  var json;
		  //Ensure a successful response
		  if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
		    json = JSON.parse(xmlhttp.response);
		    createCelsFromSpreadsheetJSON(json);
		  }
		};
		xmlhttp.open("GET", SHEET_URL, true);
		xmlhttp.send();
  }
  function createCelsFromSpreadsheetJSON(json) {
    var metadata, feed, entry, options, cels;
    var i, key, key2, option; //iterators
    var regex, result;
    var localname, currCel, currEl, parentId, parent;
    //create basic metadata object
    metadata = {
      "author": "",
      "id": "",
      "title": "",
      "updated": ""
    };
    //acquire the feed from the spreadsheet JSON
    feed = json["feed"];
    //extract the metadata
    for (key in metadata) {
      if (metadata.hasOwnProperty(key)) {
        if (key === "author") {
          //NOTE: i feel like this for loop doesn't do anything...
          for (key2 in metadata[key]) {
            if (metadata[key].hasOwnProperty(key2)) {
              metadata[key][key2] = feed[key][0][key2]["$t"];
            }
          }
        } else {
          metadata[key] = feed[key]["$t"];
        }
      }
    }
    //Parse the JSON for Cel definitions
    entry = json["feed"]["entry"];
    //cels is where the Cel definitions will be stored
    cels = {};
    //entry.length is equal to the number of cel definitions
    for (i = 0; i < entry.length; i++) {
      //start off the cel definition as empty
      options = {};
      //in the JSON, spreadsheet cells are prefixed with "gsx$"
      regex = new RegExp("gsx\\$(.+)");
      //find all of the Cel options specified for this entry
      for (key in entry[i]) {
        if (entry[i].hasOwnProperty(key)) {
          result = key.match(regex);
          if (result) {
            result = result[1]; //we grab the part after the "gsx$"
            if (result === "classes") options[result] = entry[i][key]["$t"].split(" ");
            else options[result] = entry[i][key]["$t"];
          }
        }
      }
      /* Use the specified options or the generic ones if none exist*/
      for (option in Cel._generic_options) {
        if (Cel._generic_options.hasOwnProperty(option)) {
          options[option] = options[option.toLowerCase()] || Cel._generic_options[option];
          options[option] = options[option] || Cel._generic_options[option];
        }
      }
      /*apparently my code also requires the spreadsheet to supply "localname" and "parent" */
      cels[options.localname] = {
        parent: options.parent,
        celOptions: options
      };
    }
    /* Iterate over the Cel definitions and add to body */
    /*  Format: {
          localname: {
            parent, options
          }
        }
    */
    for (localname in cels) {
      if (cels.hasOwnProperty(localname)) {
        currCel = cels[localname];
        currEl = new Cel(currCel.celOptions);
        console.log(localname, currCel, currEl);
        /*Dynamically added scripts must have their content set to their text attribute*/
        if (currCel.celOptions['type'] === 'script') {
          currEl.text = currCel.celOptions['innerHTML'];
        }
        /* If a parent has been specified, then append the element to the parent instead */
        if (currCel.parent) {
          parentId = cels[currCel.parent].celOptions.id;
          if (!parentId) {
            console.log("Error: unspecified id for the cel " + localname + "'s parent");
          } else {
            parent = document.getElementById(parentId);
            if (!parent) {
              //TODO: Add fallback for when the parent has not been added to the DOM yet
              console.log("No parent with id " + parentId);
            } else {
              parent.appendChild(currEl);
            }
          }
        } else {
          document.body.appendChild(currEl);
        }
      }
    }
  }
})();
