app.controller('editEventController', function ($scope, $routeParams, event, preferences, dates, venues, eventUsers, $location, eventUser, emailUsers) {

    var self = this;
    self.eventId = $routeParams.id;

    self.fail = false;
    self.success = false;


    self.formatDate = function (date) {
        return date.format('Do MMMM YYYY');
    };

    self.creating = false;
    self.event = {name: null, date: null};
    self.addedDates = [];
    self.addedVenues = [];
    self.addedAttendees = [];
    self.name = null;
    self.namesAvailable = false;
    self.preferencesAvailable = true;

    self.newDate = moment().format('d MMMM YYYY');
    self.newVenue = null;
    self.newAttendee = null;
    self.newAttendeeValid = true;

    self.emailContent = null;

    self.viewState = 'Data';

    if (!self.eventId) {
        self.creating = true;
    }
    else {
        event.get({id: self.eventId}, function (data) {
            self.name = data.name;
            self.namesAvailable = data.namesAvailable;
            self.preferencesAvailable = data.preferencesAvailable;

            if (self.namesAvailable)
                self.viewState = 'Control';
        });

        venues.query({id: self.eventId}, function (data) {
            self.addedVenues = data;
        });

        dates.query({id: self.eventId}, function (data) {
            self.addedDates = [];

            angular.forEach(data, function (item) {
                self.addedDates.push(moment(item));
            });
        });

        eventUsers.query({id: self.eventId}, function (data) {
            self.addedAttendees = data;

            for (var i = 0; i < self.addedAttendees.length; i++) {
                self.addedAttendees[i].initialName = self.addedAttendees[i].name;
            }
        });
    }


    self.addDate = function (date) {
        self.addedDates.push(moment(date));

        self.newDate = moment().format('d MMMM YYYY');

        return false;
    };

    self.removeDate = function (date) {
        self.addedDates.splice(self.addedDates.indexOf(date), 1);

        return false;
    };

    self.addVenue = function (venue) {
        self.addedVenues.push(venue);

        self.newVenue = null;

        return false;
    };

    self.removeVenue = function (venue) {
        self.addedVenues.splice(self.addedVenues.indexOf(venue), 1);

        return false;
    };

    self.addAttendee = function (attendee) {
        self.newAttendeeValid = true;

        if (attendee.indexOf(';') > 0) {
            var splits = attendee.split(';');

            for (var i = 0; i < splits.length; i++) {
                if (!validateEmail(splits[i])) {
                    self.newAttendeeValid = false;
                }
            }

            for (var i = 0; i < splits.length; i++) {
                self.addedAttendees.push({email: splits[i].trim(), name: null, admin: false, initialName: null});
            }

            self.newAttendee = null;

            return false;
        }
        else if (attendee.indexOf(',') > 0) {
            var splits = attendee.split(',');

            for (var i = 0; i < splits.length; i++) {
                if (!validateEmail(splits[i])) {
                    self.newAttendeeValid = false;
                }
            }

            for (var i = 0; i < splits.length; i++) {
                self.addedAttendees.push({email: splits[i].trim(), name: null, admin: false, initialName: null});
            }

            self.newAttendee = null;

            return false;
        }

        if (!validateEmail(attendee)) {
            self.newAttendeeValid = false;
            return false;
        }

        self.addedAttendees.push({email: attendee.trim(), name: null, admin: false, initialName: null});

        self.newAttendee = null;

        return false;
    };

    self.validateNewAttendee = function () {
        if (validateEmail(self.newAttendee)) {
            self.newAttendeeValid = true;
        }
    };

    self.removeAttendee = function (attendee) {
        self.addedAttendees.splice(self.addedAttendees.indexOf(attendee), 1);

        return false;
    };

    self.saveEvent = function () {
        if (self.creating) {
            event.save({
                name: self.name
            }, function (response) {
                saveDatesVenuesAttendees(response.event_id);

                $location.path('/event/' + response.event_id)
            });
        }
        else {
            saveDatesVenuesAttendees(self.eventId);
        }

        if (self.eventId)
            $location.path('/event/' + self.eventId)
    };

    self.emailAttendees = function (message) {
        emailUsers.save({id: self.eventId}, {message: message});
        self.emailContent = null;
    };

    function saveDatesVenuesAttendees(eventId) {
        var converted = [];
        for (var i = 0; i < self.addedDates.length; i++) {
            converted.push(self.addedDates[i].format('YYYY-MM-DD 00:00:00'));
        }

        dates.save({id: eventId}, {dates: converted});

        venues.save({id: eventId}, {venues: self.addedVenues});

        eventUsers.query({id: self.eventId}, function (serverAttendees) {
            var found = false;

            for (var i = 0; i < serverAttendees.length; i++) {
                found = false;

                for (var b = 0; b < self.addedAttendees.length; b++) {
                    if (self.addedAttendees[b].email === serverAttendees[i].email) {
                        // need to delete this person
                        found = true;
                    }
                }

                if (!found) {
                    eventUser.delete({id: self.eventId, userId: serverAttendees[i].id});
                }
            }

            for (var i = 0; i < self.addedAttendees.length; i++) {
                found = false;

                for (var b = 0; b < serverAttendees.length; b++) {
                    if (self.addedAttendees[i].email === serverAttendees[b].email) {
                        found = true;
                    }
                }

                if (found) {
                    eventUser.update({id: eventId}, self.addedAttendees[i]);
                }
                else {
                    eventUser.save({id: eventId}, self.addedAttendees[i]);
                }
            }
        });
    }

    function validateEmail(email) {
        var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email);
    }

    //$location.path( "/event/:id/edit" );
});