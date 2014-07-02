/*global window, document, location, CodeMirror, jsyaml, inspect, base64, hasher*/



window.runDemo = function runDemo() {
  'use strict';

  if (window!=window.top) {
    document.getElementsByTagName("body")[0].classList.add("in-frame");
  }

  var source, initial, permalink, timer1, timer2 = null,
      fallback = document.getElementById('source').value || ',',
      result = document.getElementById("result"),
      template = Handlebars.compile(document.getElementById('template').innerHTML);

  // add sexy constructor
  var sexyType = new jsyaml.Type('!sexy', {
    loadKind: 'sequence', // See node kinds in YAML spec: http://www.yaml.org/spec/1.2/spec.html#kind//
    loadResolver: function (state) {
      // You can access actual data from YAML via `state.result`.
      // After the resolving, you should put the resolved value into `state.result`.
      var index, length;

      for (index = 0, length = state.result.length; index < length; index += 1) {
        state.result[index] = 'sexy ' + state.result[index];
      }

      return true;
    }
  });

  var SEXY_SCHEMA = jsyaml.Schema.create([ sexyType ]);

  function display_error(message){
    result.innerHTML = message;
  }

  function parse() {
    var str, obj;

    try {
      str = source.getValue();
      obj = jsyaml.load(str, { schema: SEXY_SCHEMA });

      permalink.href = '#tcc=' + base64.encode(str);
      embedlink.value = '<iframe width="1024" height="860" src="' + permalink.href + '"></iframe>';

      result.innerHTML = template(obj);
    } catch (err) {
      result.innerHTML = "<pre>" + err.stack || err.message || String(err) + "</pre>";
    }
  }

  window.loadFromGist = function(data){
    var content;
    for (var key in data.data.files) {
      if (data.data.files[key].language === "YAML"){
        content = data.data.files[key].content;
        break;
      }
    }
    if (content) {
      source.setValue(content);
      parse();
    }
    else display_error("<h1>No YAML file found in gist</h1>");
  }

  function updateSource() {
    var yaml;

    if (location.hash){
      if ('#tcc=' === location.hash.toString().slice(0,5)) {
        yaml = base64.decode(location.hash.slice(5));
      } else if ('#gist=' === location.hash.toString().slice(0,6)) {
        display_error("<h2>Loading Gist</h2>")
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = 'https://api.github.com/gists/' + location.hash.toString().slice(6) + '?callback=loadFromGist';
        document.getElementsByTagName("body")[0].appendChild(script);
        return;
      }
    }
    source.setValue(yaml || fallback);
    parse();
  }

  permalink = document.getElementById('permalink');

  source = CodeMirror.fromTextArea(document.getElementById('source'), {
    mode: 'yaml',
    undoDepth: 1,
    onKeyEvent: function (_, evt) {
      switch (evt.keyCode) {
        case 37:
        case 38:
        case 39:
        case 40:
          return;
      }

      if (evt.type === 'keyup') {
        window.clearTimeout(timer1);
        timer1 = window.setTimeout(parse, 500);

        if (null === timer2) {
          timer2 = setTimeout(function () {
            window.clearTimeout(timer1);
            window.clearTimeout(timer2);
            timer2 = null;
            parse();
          }, 1000);
        }
      }
    }
  });

  // result = CodeMirror.fromTextArea(document.getElementById('result'), {
  //   readOnly: true
  // });

  // initial source
  if (!location.hash) document.getElementsByTagName("body")[0].classList.add("editor-open");

  updateSource();

  // start monitor hash change
  hasher.prependHash = '';
  hasher.changed.add(updateSource);
  hasher.initialized.add(updateSource);
  hasher.init();
};


////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////
