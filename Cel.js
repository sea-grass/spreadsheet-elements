(function() {
  "use strict";
  var Cel = function Cel(options){ return Cel.create(options); };
  /* Cel._generic_options -- The default options for a Cel */
  Object.defineProperty(Cel, "_generic_options", {
    value:{
      "type": "div",
      "id": "",
      "classes": [],
      "attrs": {},
      "innerHTML": "",
      "innerText": "",
      "children": [],
      "style": {}
    }
  });
  /* Cel.create(options) -- the default functionality of Cel.js; creates an html element from the specified options */
  Cel.create = function(options) {
    var option, el;
    var i;
    var attr, currclass;
    var generic_options = Cel._generic_options;
    if (!options) options = {};
    /* set all of the fields in options */
    for (option in generic_options) {
      if (generic_options.hasOwnProperty(option)) {
        options[option] = options[option] || generic_options[option];
      }
    }
    /* create the element with the specified or default (div) type */
    el = document.createElement(options["type"]);
    /* assign the given id, if any */
    if (options["id"] !== "") el.id = options["id"];
    /* add all of the specified classes to this element, if any */
    for (i = 0; i < options["classes"].length; i++) {
      //TODO: Does not work cross-browser
      currclass = options["classes"][i];
      if (currclass !== "") el.classList.add(currclass);
    }
    /* set all of the specified attributes on this element, if any */
    for (attr in options["attrs"]) {
      if (options["attrs"].hasOwnProperty(attr)) {
        // e.g. <div contenteditable="contenteditable"> == <div contenteditable>, right?
        if (attr === options["attrs"][attr]) {
          el.setAttribute(attr)
        } else {
          el.setAttribute(attr, options["attrs"][attr]);
        }
      }
    }
    /* set the inner content of the element, if any specified */
    if (options["innerText"] !== "") el.innerText = options["innerText"];
    if (options["innerHTML"] !== "") el.innerHTML = options["innerHTML"];
    /* appends the specified children to the element, if any */
    for (i = 0; i < options["children"].length; i++) {
      //TODO: Check if another cel properties object or html element
      el.appendChild(options["children"][i]);
    }
    /* sets the supplied style rules, if any */
    for (rule in options["style"]) {
      if (options["style"].hasOwnProperty(rule)) {
        el["style"][rule] = options["style"][rule];
      }
    }
    /* returns the newly constructed element */
    return el;
  };
  /* Cel.createStyle(options) -- In addition to regular Cel options, supply "rules" */
  Cel.createStyle = function(options) {
    var basic_options, el;
    var selector, rule;
    var styleText = "";
    
    options = options || {};
    basic_options = options;
    if (basic_options["innerText"]) delete basic_options["innerText"];
    if (basic_options["innerHTML"]) delete basic_options["innerHTML"];
    if (basic_options["children"]) delete basic_options["children"];
    basic_options["type"] = "style";
    
    el = new Cel(basic_options);
    
    options["rules"] = options["rules"] || {};
    
    for (selector in options["rules"]) {
      if (options["rules"].hasOwnProperty(selector)) {
        styleText += selector + " { ";
        for (rule in options["rules"][selector]) {
          if (options["rules"][selector].hasOwnProperty(rule)) {
            styleText += rule + ": " + options["rules"][selector][rule] + "; "; 
          }
        }
        styleText += "} ";
      }
    }
    
    el.innerText = styleText;
    
    return el;
  };
  
  Object.defineProperty(window, "Cel", {
    "value": Cel
  });
})();