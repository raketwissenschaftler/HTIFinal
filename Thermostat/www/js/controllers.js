angular.module('starter.controllers', [])

  .controller('DashCtrl', function($scope, $http, $ionicModal, rootUrl) {
    $http.get(rootUrl).then(function (response) {
      $scope.currentTemp = response.data.thermostat.current_temperature;
      $scope.currentProgram = response.data.thermostat.week_program.days[response.data.thermostat.current_day];
      $scope.programBars = getBarWidthPrecentages($scope.currentProgram);
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

    $("#slider").roundSlider({
      radius: 100,
      width: 10,
      handleSize: "+10",
      sliderType: "range",
      value: "15.0,21.0",
      min: 5,
      max: 30,
      startAngle: 285,
      endAngle: 255,
      editableTooltip: false,
      step: 0.1,
      tooltipFormat: renderToolTip
    });


    $scope.overrideTemp = function () {
      $scope.modal.show();
      $("#override-slider").roundSlider({
        radius: 100,
        width: 10,
        handleSize: "+10",
        sliderType: "default",
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
    })
  })

  .controller('ProgramCtrl', function($scope) {
    $scope.weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    $scope.sliders = [
      {title:'User 1: ', value:100 },
      {title:'User 2: ', value:200 },
      {title:'User 3: ', value:450 }
    ];
  });
