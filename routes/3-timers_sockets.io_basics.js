// TITLE: A Silkroad for Love, Simple Cyclical Exploration Engine
// AUTHOR: Sylvain Tran
// DATE: v0.1-pre-alpha on 12-10-2020
// GOAL: For the semester project in Cart 351
// DESCRIPTION: This container is a modular, re-purposable server container for "seasonal/generational-timescale-activism" related explorations. Any content in-canvas can be modified for a new experience
// The intent is to make this container server easy to embed in existing explorable sites, to explore ideas that require
// multiple generations in parallel to large real life timescales

// SERVER:
//
// Server namespace
var Server = Server = Server || {};
Server.express = require('express');
Server.path = require('path');
Server.WorldServer = Server.express();
Server.WorldServer.use('/public', Server.express.static(Server.path.join(__dirname, "../public")));
Server.http = require('http').createServer(Server.WorldServer);
// Emitter for CycleEvents
Server.CycleEventsEmitters = require('socket.io').listen(Server.http);

// GAME: 
//
// A periodic timer sets off in the game, starting at the beginning of a new cycle (8:00 UTC in this example)
Server.CYCLE_UTC_DATE = new Date(); // hours and locality in UTC in this example
// Our settings for the cycle. Could read from file
const cycleSettings = {
    // Customize this if necessary: normally this can be set to something else than getUTC, to schedule a new exploration/game in the future for example
    startDay: Server.CYCLE_UTC_DATE.getUTCDate(), // Day of the month
    startMonth: Server.CYCLE_UTC_DATE.getUTCMonth(), // Starts at 0, e.g., October is 09
    startYear: Server.CYCLE_UTC_DATE.getUTCFullYear(), // e.g., 2020
    cycleTotalDuration: 100, // in years
    cycleGenerationDuration: 10, // each cycle lasts this amount in years
    cycleTick: "hourly", // Hourly will make each hour tick increase a current cycle by the amount specified by cycleGenerationDuration 
    cycleType: "hoursToYears" // For in-game conversions
};

// DEVELOPMENT LOGGER:
//
// CYCLE SETTINGS
console.log("World Cycle Settings: ");
console.log(cycleSettings);
// MVC Architecture... The View will contain the rendered world
Server.Model = {};
Server.View = {};
Server.LogicController = {};

// MODEL LAYER: 
//
// GENERAL SETTINGS FOR A CYCLE
Server.Model.CycleSettings = function(cycleSettings) {
    // Private
    "use strict";
    const CYCLE_DAY_START = cycleSettings.startDay;
    const CYCLE_MONTH_START = cycleSettings.startMonth;
    const CYCLE_YEAR_START = cycleSettings.startYear;
    const CYCLE_TOTAL_DURATION = cycleSettings.cycleTotalDuration;
    const CYCLE_GENERATION_DURATION = cycleSettings.cycleGenerationDuration;
    const CYCLE_CHECKPOINTS = CYCLE_TOTAL_DURATION/CYCLE_GENERATION_DURATION // 100/10 = 10 checkpoints in-game
    const CYCLE_TICK = cycleSettings.cycleTick;
    const CYCLE_TYPE = cycleSettings.cycleType;

    return {
        CycleSettings: function() {
            return this;
        },
        getCycleDayStart: function() {
            return CYCLE_DAY_START;
        },
        getCycleMonthStart: function() {
            return CYCLE_MONTH_START;
        },
        getCycleYearStart: function() {
            return CYCLE_YEAR_START;
        },
        getCycleTotalDuration: function() {
            if(CYCLE_TOTAL_DURATION === null || CYCLE_TOTAL_DURATION === 0 || CYCLE_TOTAL_DURATION === 'undefined' || Number.isNaN(CYCLE_TOTAL_DURATION) === true) {
                console.log("Invalid value. Entering default values.");
                return 100; // Default value if bogus values entered
            }
            return CYCLE_TOTAL_DURATION;
        },        
        getCycleGenerationDuration: function() {
            if(CYCLE_GENERATION_DURATION === null || CYCLE_GENERATION_DURATION === 0 || CYCLE_GENERATION_DURATION === 'undefined' || Number.isNaN(CYCLE_GENERATION_DURATION) === true) {
                console.log("Invalid value. Entering default values.");
                return 10; // Default value if bogus values entered
            }
            return CYCLE_GENERATION_DURATION;
        },
        getCycleCheckPoints: function() {
            // Verify cycleSettings' values
            if(CYCLE_CHECKPOINTS === 0 || CYCLE_CHECKPOINTS === 'undefined' || CYCLE_CHECKPOINTS === null || Number.isNaN(CYCLE_CHECKPOINTS) === true) {
                console.error("Cycle total duration and generation duration must have a positive number value to continue.");
                console.log("Invalid value. Entering default values.");
                return 100 / 10; // Default calculation if bogus values entered
            }
            return CYCLE_CHECKPOINTS;
        },
        getCycleTick: function() {
            return CYCLE_TICK;
        },
        getCycleType: function() {
            return CYCLE_TYPE;
        }
    }
};

// Test Object: The server's model
const ServerModelCycleSettings = Server.Model.CycleSettings(cycleSettings).CycleSettings();
console.log("A");
console.log(ServerModelCycleSettings);

// LOGIC LAYER:
// @args: ServerModelCycleSettings
// CycleEvents: Controller for in-game cycle events 
Server.LogicController.CycleEvents = function(ServerModelCycleSettings) {
    // Data test
    console.log("B");
    console.log(ServerModelCycleSettings.getCycleCheckPoints());
    // Private
    const date = new Date();
    const nowHours = date.getUTCHours();
    const nowMinutes = date.getUTCMinutes();
    const nowSeconds = date.getUTCSeconds();
    // Server Model Cycle Settings conversions to real life time
    const cycleTick = ServerModelCycleSettings.getCycleTick();
    const cycleType = ServerModelCycleSettings.getCycleType();
    // The SetInterval tick timing is set by the Cycle Tick settings
    let SERVER_CYCLE_TICK = null;
    // Tick counter (will stop ticking stop the game once the Cycle Total Duration has been ticked)
    let tickCount = 0;
    let serverCycleTickInterval;
    switch(cycleTick) {
        case "hourly":
            // Convert cycleGenerationDuration to real life hours
            // One hour = 1000 * 60 * 60 milliseconds
            const hourInMs = 1000 * 60 * 60;
            console.log("Starting a new cycle in one hour.");
            SERVER_CYCLE_TICK = 1000; // Starting in...
            break;
        default:
            break;
    }

    return {
        getServerCycleTickInterval: function() {
            return serverCycleTickInterval;
        },
        getTickCount: function() {
            return tickCount;
        },
        setTickCount: function(value) {
            console.log("Setting tick count");
            console.log("value: " + value);
            tickCount = value;
            console.log("Setter this: " + tickCount);
            console.log("Setter not this: " + tickCount);
        },
        // The server runs that game cycle for 10 hours (until 18:00 EST).
        // Every hour, the game checkpoints each user's socket: decisions (game logic) and updates the game world. 10 years pass every hour
        // in my example.
        loopCycleEvents: function() {
            if(tickCount === 0) {
                serverCycleTickInterval = setInterval( () => {
                    console.log("COUNT: " + tickCount);
                    if(tickCount >= ServerModelCycleSettings.getCycleCheckPoints()) {
                        clearInterval(serverCycleTickInterval);
                        console.log("Game over.");
                        return; // Cycles are over at this stage
                    }
                    // Checkpoint: Check all logged in sockets' data
                    // And update the world, until end of Cycle Total Duration
                    console.log("NEW CYCLE BEGIN: " + tickCount + "th cycle.");
                    Server.CycleEventsEmitters.emit("newCycleBegin", "A New Cycle Begins");
                    Server.onNewCycleBegin("Seasons pass. Man will return to dust. Dust to dust.");
                    ++tickCount;
                }, SERVER_CYCLE_TICK);    
            }
        }
    }
}

Server.LogicController.CycleEvents(ServerModelCycleSettings).loopCycleEvents();

// EVENTS:
//
// CONNECTION EVENT (When new or returning users connect to a new game cycle)
Server.connectionEvent = function(socket) {
    console.log('A new user has connected to the world.');
    // Attach a listener to that socket client, so when a connected socket emits a chat message event, they the server will emit the event + the msg
    socket.on('chat message', function(msg) {
        console.log('a user sent a message');
        Server.CycleEventsEmitters.emit("chat message", msg);
    });
    // New cycle event
    socket.on('newCycleBegin', function(msg) {
        Server.CycleEventsEmitters.emit("newCycleBegin", msg);
    });
    // Disconnect event
    socket.on('disconnect', function () {
        console.log('A user disconnected');
     });
}


// PORT LISTENERS:
//
// MAIN GAME PORT
Server.http.listen(3000, () => {
    console.log('listening on *:3000');
});

// ROUTES:
//
// AT /PUBLIC SERVES GAME.HTML
Server.WorldServer.get('/', (req, res) => {
    res.sendFile("Game.html", { root: Server.path.join(__dirname, '../public/') });
});

// EVENTS REGISTRATION
//
// connection
Server.CycleEventsEmitters.on('connection', Server.connectionEvent); 

// EVENTS::onNewCycleBegin
//
// ON NEW CYCLE BEGIN
Server.onNewCycleBegin = function(msg) {
    console.log('A new cycle begin event has triggered. Depending on your CYCLE settings, this means the world will begin a new cycle.');
    console.log('Each socket will get this event tick.');
    console.log("Announcement: " + msg);
}

// EXPORTS FOR TESTS
//
// SERVER NAMESPACE
module.exports = {
    Server: Server
};