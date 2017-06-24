angular.module('starter.controllers', [])

  .controller('DashCtrl', function($scope, $http, $ionicModal, rootUrl) {
    function generateLabels () {
      var labels = [];
      var start = moment().hours(0).minutes(0).seconds(0);

      labels.push(start.format("HH:mm"));
      for(var i = 0; i < 22; i++){
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
      var nightSwitches = [];
      for(var i = 0; i < program.switches.length; i++){
        if(program.switches[i].type == "night"){
          nightSwitches.push(program.switches[i]);
        }
      }
      for(var i = 0; i < nightSwitches.length; i++){
        switchTimes.push(parseInt(nightSwitches[i].time.split(":").join("")));
      }

      for(var i = 0; i < switchTimes.length; i++){
        if(i==0){
          var percentage = Math.floor((switchTimes[i]/2400)*100) + "%";
        }else {
          percentage = Math.floor(((switchTimes[i] - switchTimes[i - 1]) / 2400)*100) + "%";
        }
        barWidthPercentages.push({width: percentage, state: nightSwitches[i].state});
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
  .controller('ProgramDetailCtrl', function ($scope, $http, $stateParams, rootUrl) {
    $scope.weekDay = $stateParams.weekDay;

    $scope.editSwitch = function (index) {

    };

    $scope.addSwitch = function () {

    };

    $http.get(rootUrl).then(function (response) {
      $scope.nightSwitches = [];
      var program = response.data.thermostat.week_program.days[$scope.weekDay];
      for(var i = 0; i < program.switches.length; i++){
        if(program.switches[i].state == "on"){
          program.switches[i].end = program.switches[i].time;
          if(i == 0){
            program.switches[i].start = "00:00";
          }else{
            program.switches[i].start = program.switches[i - 1].time;
          }
          $scope.nightSwitches.push(program.switches[i]);
        }
      }
      console.log($scope.nightSwitches);
    });
  });
