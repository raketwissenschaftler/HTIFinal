angular.module('starter.controllers', ['ionic-timepicker'])

  .controller('DashCtrl', function($scope, $http, $ionicModal, rootUrl) {
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

    function generateData(program, labels, dayTemperature, nightTemperature) {
      var data = [];
      var switchCounter = 0;
      var onSwitches = [];
      for(var i = 0; i < program.length; i++){
        if(program[i].state == "on"){
          onSwitches.push(program[i]);
        }
      }
      var currentSwitch = onSwitches[switchCounter];
      for(var i = 0; i < labels.length; i++){
        var labelTime = moment(labels[i], "HH:mm");
        while (switchCounter < onSwitches.length - 1 && labelTime >= moment(currentSwitch.time, "HH:mm")) {
          switchCounter++;
          currentSwitch = onSwitches[switchCounter];
        }
        if (currentSwitch.type == "night") {
          data.push(nightTemperature);
        } else {
          data.push(dayTemperature);
        }
      }
      return data;
    }
    $scope.choice = 1;
    $scope.graphOptions = {
      elements: {
        point: {
          radius: 0,
          hitRadius: 0,
          hoverRadius: 0
        }
      }
    };
    $http.get(rootUrl).then(function (response) {
      $scope.currentTemp = response.data.thermostat.current_temperature;
      $scope.currentProgram = response.data.thermostat.week_program.days[response.data.thermostat.current_day];
      $scope.programBars = getBarWidthPrecentages($scope.currentProgram);
      var labels = generateLabels();
      $scope.data = generateData(
        $scope.currentProgram.switches, labels,
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
        tooltipFormat: renderToolTip
      });
    });

    function renderToolTip(args) {
      if (args.handle.index == 1) {
        return "&#x1f319; " + parseFloat(args.value).toFixed(1) + "&deg;";
      }else{
        return "&#x1f31e; " + parseFloat(args.value).toFixed(1) + "&deg;";
      }
    }

    function getBarWidthPrecentages(program) {
      var barWidthPercentages = [];
      var switchTimes = [];
      var onSwitches = [];
      for(var i = 0; i < program.switches.length; i++){
        if(program.switches[i].type == "night"){
          onSwitches.push(program.switches[i]);
        }
      }
      for(var i = 0; i < onSwitches.length; i++){
        switchTimes.push(parseInt(onSwitches[i].time.split(":").join("")));
      }

      for(var i = 0; i < switchTimes.length; i++){
        if(i==0){
          var percentage = Math.floor((switchTimes[i]/2400)*100) + "%";
        }else {
          percentage = Math.floor(((switchTimes[i] - switchTimes[i - 1]) / 2400)*100) + "%";
        }
        barWidthPercentages.push({width: percentage, state: onSwitches[i].state});
      }
      return barWidthPercentages;
    }

    $scope.overrideTemp = function () {
      $scope.modal.show();
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
        step: 0.1
      });
    };

    $ionicModal.fromTemplateUrl("templates/override-temps.html", {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function (modal) {
      $scope.modal = modal;
    });


  })

  .controller('ProgramCtrl', function($scope, $http, rootUrl) {
    $scope.weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  })
  .controller('ProgramDetailCtrl', function ($scope, $http, $stateParams, $ionicModal, ionicTimePicker, rootUrl) {
    $scope.weekDay = $stateParams.weekDay;
    $scope.switchType = "day";
    var endTimePicker = {
      callback: function (val) {
        if(typeof (val) === 'undefined'){
          console.log("Time not selected")
        }else{
          //add -1 is needed to fix that the starttime will be upped with 1 on what the timepicker shows
          $scope.endTime = moment(val * 1000).add(-1, "hour");
          console.log($scope.endTime);
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
      $scope.program.switches.sort(function (a, b) {
        return moment(b.time, "HH:mm") - moment(a.time, "HH:mm");
      });
      for(var i = 0; i < $scope.program.switches.length; i++){
        if($scope.program.switches[i].state == "on" && $scope.program.switches[i].time != "00:00"){
          $scope.program.switches[i].end = $scope.program.switches[i].time;
          if(i == 0){
            $scope.program.switches[i].start = "00:00";
          }else{
            $scope.program.switches[i].start = $scope.program.switches[i - 1].time;
          }

          $scope.onSwitches.push($scope.program.switches[i]);
        }
      }
      $scope.onSwitches.sort(function (a, b) {
        return moment(b.start, "HH:mm") - moment(a.start, "HH:mm");
      });
    }

    $scope.setStartTime = function () {
      var startTimePicker = {
        callback: function (val) {
          if (typeof (val) === 'undefined') {
            console.log('Time not selected');
          } else {
            //add -1 is needed to fix that the starttime will be upped with 1 on what the timepicker shows
            $scope.startTime = moment(val * 1000).add(-1, "hour");
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
      generateOnSwitches();
      console.log("Changes submitted");
      $scope.modal.hide();
    };
    $ionicModal.fromTemplateUrl("templates/addSwitchModal.html", {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function (modal) {
      $scope.modal = modal;
    });

    $http.get(rootUrl).then(function (response) {
      $scope.onSwitches = [];
      $scope.program = response.data.thermostat.week_program.days[$scope.weekDay];
      generateOnSwitches();
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
