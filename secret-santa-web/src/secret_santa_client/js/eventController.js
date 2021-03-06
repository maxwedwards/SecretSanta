app.controller('eventController', function(event, santa, $timeout, $location, user, preferences, $routeParams, eventUsers, $q){
    var self = this;

    var eventIdRaw = $routeParams.id;
    if (!eventIdRaw)
        $location.path('/events');

    self.eventId = parseInt(eventIdRaw);

    self.fail = false;
    self.success = false;

    self.event = { preferencesAvailable: false, venue : null, namesAvailable : false };
    self.preferences = {};

    self.santaVisible = false;
    self.santaSaysNo = false;

    self.name = null;
    self.email = null;
    self.admin = false;

    self.eventUsers = [];

    self.santa = "Uh oh, something is wrong here..";
    self.timeout = 0;

    self.newDate = null;

    $q.all(
        user.get(function (data) {
            self.name = data.name;
            self.email = data.email;
        })
    ).then(function(){
        eventUsers.query({ id: self.eventId },function(data){
            self.eventUsers = data;

            angular.forEach(data, function(item){
                if (item.email === self.email)
                {
                    self.admin = item.admin;
                }
            })
        });
    });



    preferences.get({ id: self.eventId }, function(data){
        if (data.venue != null) {
            self.preferences.attending = true;
            self.preferences.doingPresents = data.doingPresents;
        }
    });

    event.get({ id: self.eventId }, function (data) {
        self.event = data;
        self.event.venueSelected = data.venue != null;
        self.event.dateSelected = data.date != null;

        if (data.date)
        {
            // TODO needs to be made UTC/correct timezone?
            /*var parsed = data.date.substring(6,10) + '-' +
                data.date.substring(3,5) + '-' +
                data.date.substring(0,2) + ' ' +
                data.date.substring(11,16);

            self.event.date = moment(parsed);*/

            self.event.date = moment(data.date);
        }

        if (self.event.namesAvailable) {
            santa.save({id: self.eventId}, {},
                function (data) {
                    if (data.allowed == false) {
                        self.santaSaysNo = true;
                    }
                    else {
                        self.santa = data.name;
                    }

                    self.fail = false;
                    self.success = true;
                }, function (error) {
                    $location.path('/login')
                }
            );
        }
    });

    self.showSanta = function(){
        self.santaVisible = true;

        self.timeout = 3;

        timeoutLoop();

        return false;
    };

    function timeoutLoop(){
        $timeout(function(){
            if (self.timeout == 1) {
                self.santaVisible = false;
            }
            else {
                self.timeout = self.timeout - 1;
                timeoutLoop();
            }
        }, 1000);
    }
});
