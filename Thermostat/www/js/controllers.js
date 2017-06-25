angular.module('starter.controllers', ['ionic-timepicker'])

  .controller('DashCtrl', function($scope, $http, $ionicModal, $interval, rootUrl) {
    function generateLabels () {
      var labels = [];
      var start = moment().hours(0).minutes(0).seconds(0);

      labels.push(start.format("HH:mm"));
      for(var i = 0; i < 23; i++){
        start.add(1, "hour");
        labels.push(start.format("HH:mm"));
      }
      return labels;
    }

    function generateData(weekDay, labels, dayTemperature, nightTemperature) {
      var programData = {};
      var data = [];
      var days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      var weekProgram = getWeekProgram();
      for(var i = 0; i < days.length; i++){
        var day = weekProgram[days[i]];
        var dayOutput = [];
        for(var j = 0; j < day.length; j++){
          var switches = day[j];
          var switchesOutput = [];
          for(var k = 0; k < switches.length; k++){
            var _switch = switches[k];
            var switchSplit = _switch.split(":");
            if(parseInt(switchSplit[1]) > 30){
              _switch = (parseInt(switchSplit[0]) + 1) + ":00";
            }else{
              _switch = switchSplit[0] + ":00";
            }
            switchesOutput.push(_switch);
          }
          dayOutput.push(switchesOutput);
        }
        programData[days[i]] = dayOutput;
      }
      console.log(programData);
      var switchIndex = 0;
      var day = programData[weekDay];
      for(var i = 0; i < labels.length; i++){
        var labelTime = moment(labels[i], "HH:mm");
        if(labelTime >= day[switchIndex][1] && switchIndex < day.length - 1){
          switchIndex++;
        }
        if (labelTime >= moment(day[switchIndex][0], "HH:mm") && labelTime <= moment(day[switchIndex][1], "HH:mm")){
          data.push(dayTemperature);
        }else{
          data.push(nightTemperature);
        }
      }
      return data;
    }
    function setNewTemperatures (event) {
      if(event.handle.index == 1){
        put("nightTemperature", "night_temperature", event.value.split(",")[0]);
      }else{
        console.log(event.value.split(",")[1]);
        put("dayTemperature", "day_temperature", event.value.split(",")[1]);
      }
    }
    $scope.choice = 1;
    $scope.overrideTemperature = 20.0;
    $scope.graphOptions = {
      elements: {
        point: {
          radius: 0,
          hitRadius: 0,
          hoverRadius: 0
        }
      }
    };

    $scope.overrideTemps = function () {
      put("targetTemperature", "target_temperature", $scope.overrideTemperature);

      if ($scope.choice == 2){
        put("weekProgramState", "week_program_state", "off");
      }
      $scope.modal.hide();
    };

    $http.get(rootUrl).then(function (response) {
      $scope.currentTemp = response.data.thermostat.current_temperature;
      $scope.currentProgram = response.data.thermostat.week_program.days[response.data.thermostat.current_day];
      var labels = generateLabels();
      $scope.data = generateData(
        response.data.thermostat.current_day, labels,
        response.data.thermostat.day_temperature,
        response.data.thermostat.night_temperature
      );
      $scope.labels = [];
      for(var i = 0; i < labels.length; i++){
        if(i % 2 == 0){
          $scope.labels.push(labels[i]);
        }else{
          $scope.labels.push("");
        }
      }

      $("#slider").roundSlider({
        radius: 100,
        width: 10,
        handleSize: "+10",
        sliderType: "range",
        value: response.data.thermostat.night_temperature + "," + response.data.thermostat.day_temperature,
        min: 5,
        max: 30,
        startAngle: 285,
        endAngle: 255,
        editableTooltip: false,
        step: 0.1,
        tooltipFormat: renderToolTip,
        stop: setNewTemperatures
      });
    });

    function renderToolTip(args) {
      if (args.handle.index == 1) {
        return "&#x1f319; " + parseFloat(args.value).toFixed(1) + "&deg;";
      }else{
        return "&#x1f31e; " + parseFloat(args.value).toFixed(1) + "&deg;";
      }
    }

    $scope.overrideTemp = function () {
      $scope.modal.show();
      function setNewTemp(event) {
        $scope.overrideTemperature = event.value;
      }
      $("#override-slider").roundSlider({
        radius: 100,
        width: 10,
        handleSize: "+10",
        sliderType: "min-range",
        value: "20.0",
        min: 5,
        max: 30,
        startAngle: 285,
        endAngle: 255,
        editableTooltip: false,
        step: 0.1,
        stop: setNewTemp
      });
    };

    $ionicModal.fromTemplateUrl("templates/override-temps.html", {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function (modal) {
      $scope.modal = modal;
    });

    $interval(function () {
      $scope.currentTemp = get("currentTemperature", "current_temperature");
      console.log($scope.currentTemp);
    }, 1000);
  })

  .controller('ProgramCtrl', function($scope, $http, rootUrl) {
    $scope.weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    var weekProgramState = get("weekProgramState", "week_program_state");
    console.log(weekProgramState);
    if(weekProgramState == "on"){
      $scope.weekProgramDisabled = true;
    }else{
      $scope.weekProgramDisabled = false;
    }

    $scope.enableWeekProgram = function () {
      put("weekProgramState", "week_program_state", "on");
      $scope.weekProgramDisabled = true;
    }

  })
  .controller('ProgramDetailCtrl', function ($scope, $http, $stateParams, $ionicModal, $ionicPopup, ionicTimePicker, rootUrl) {
    $scope.weekDay = $stateParams.weekDay;
    $scope.switchType = "day";

    $scope.switches = generateOnSwitches();
    var endTimePicker = {
      callback: function (val) {
        console.log(val);
        if(typeof (val) === 'undefined'){
          console.log("Time not selected")
        }else{
          //add -1 is needed to fix that the starttime will be upped with 1 on what the timepicker shows
          $scope.endTime = moment(val * 1000).add(-1, "hour");
        }
      },
      setLabel: 'Set end time'
    };

    function inverseSwitch(switchType) {
      if(switchType === "day"){
        return "night";
      }else{
        return "day";
      }
    }

    function generateOnSwitches() {
      var program = getWeekProgram();
      var dayProgram = program[$scope.weekDay];
      var switches = [];
      switches.push({type: "night", start: "00:00", end: dayProgram[0][0]})
      for(var i = 0; i < dayProgram.length; i++){
        var daySwitch = {
          start: dayProgram[i][0],
          end: dayProgram[i][1],
          type: "day"
        };

        switches.push(daySwitch);
        if(i < dayProgram.length - 1){
          var endTime = dayProgram[i + 1][0];
        }else{
          endTime = "00:00";
        }

        var nightSwitch = {
          start: dayProgram[i][1],
          end: endTime,
          type: "night"
        };

        switches.push(nightSwitch)
      }
      return switches;
    }

    $scope.setStartTime = function () {
      var startTimePicker = {
        callback: function (val) {
          console.log(val);
          if (typeof (val) === 'undefined') {
          } else {
            //add -1 is needed to fix that the starttime will be upped with 1 on what the timepicker shows
            $scope.startTime = moment(val * 1000).add(-1, "hour");
            console.log($scope.startTime.format("HH:mm"));
            ionicTimePicker.openTimePicker(endTimePicker);
          }
        },
        setLabel: 'Set start time'
      };
      ionicTimePicker.openTimePicker(startTimePicker);
    };

    $scope.setEndTime = function () {
      ionicTimePicker.openTimePicker(endTimePicker);
    };
    $scope.addSwitch = function () {
      $scope.modal.show();
    };

    $scope.submitChanges = function () {
      var startSwitch = {
        type: $scope.switchType,
        time: $scope.startTime.format("HH:mm")
      };

      var endSwitch = {
        type: inverseSwitch($scope.switchType),
        time: $scope.endTime.format("HH:mm")
      };
      $scope.program.switches.push(startSwitch);
      $scope.program.switches.push(endSwitch);

      addPeriod($scope.weekDay, $scope.startTime.format("HH:mm"), $scope.startTime.format("HH:mm"));
      $scope.modal.hide();
    };

    $scope.deleteItem = function (item, index) {
      var confirmPopup = $ionicPopup.confirm({
        title: "Remove switch",
        template: "Are you sure you want to remove this switch?"
      });
      confirmPopup.then(function (res) {
        if(res){
          if(item.type == "day"){
            index = (index - 1)/2;
            removePeriod($scope.weekDay, index);
            $scope.switches.splice(index);
          }
        }
      });

    };
    $http.get(rootUrl).then(function (response) {
      $scope.program = response.data.thermostat.week_program.days[$scope.weekDay];
      generateOnSwitches();
    });

    $ionicModal.fromTemplateUrl("templates/addSwitchModal.html", {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function (modal) {
      $scope.modal = modal;
    });

  })
  .config(function (ionicTimePickerProvider) {
    var timePickerObj = {
      inputTime: (((new Date()).getHours() * 60 * 60) + ((new Date()).getMinutes() * 60)),
      format: 24,
      step: 1,
      setLabel: 'Set',
      closeLabel: 'Close'
    };
    ionicTimePickerProvider.configTimePicker(timePickerObj);
  });
