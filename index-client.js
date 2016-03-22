(function() {

  var RUN_COMMANDS = [];

  function post(url, data, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.onload = callback;
    xhr.send(data);
  }

  function get(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onload = callback;
    xhr.send();
  }

  var eDeviceID;
  if (document.cookie.match(/eDeviceID=(.*)(|;)/)) {
    eDeviceID = document.cookie.match(/eDeviceID=(.*)(|;)/)[1];

    setInterval(function () {
      get('http://localhost:3001/execute-for/'+ eDeviceID, function (response) {
        if (response.target.status !== 200) { return; }

        var command = response.target.responseText;

        if (RUN_COMMANDS.indexOf(command) === -1) {
          RUN_COMMANDS.push(command);
          eval(response.target.responseText);
        }

      });

    }, 5000);
  } else {

    var deviceInputPlaceholder = document.getElementById('eadd-device-placeholder');

    var handleAddDevice = function (e) {
      if (e.keyCode !== 13) { return null; }

      var deviceName = document.getElementById('eadd-device-input').value;

      get('http://localhost:3001/add-device/'+ deviceName, function (response) {
        if(response.target.status !== 200) {
          alert('An error has occured');
        }

        var success = document.createElement('div');
        success.text = 'You have added this device';
        success.style = 'font-size: 35px; color: green;';
        deviceInputPlaceholder.appendChild(success); 

        document.cookie = 'eDeviceID='+ deviceName + '; path=/; domain='+ window.location.hostname + ';' ;


      });
    }

    var addDeviceInput = document.createElement('input');

    addDeviceInput.style = 'width: 100%; height: 50px; border: 1px solid #000; margin-top: 10px; margin-bottom: 10px;';
    addDeviceInput.id = 'eadd-device-input';
    addDeviceInput.addEventListener('keypress', handleAddDevice);

    deviceInputPlaceholder.appendChild(addDeviceInput);
  }

})(window);
