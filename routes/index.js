// TITLE: A Silkroad for Love, Simple Cyclical Exploration Engine
// AUTHOR: Sylvain Tran
// DATE: v0.1-pre-alpha on 12-10-2020
// GOAL: For the semester project in Cart 351
// DESCRIPTION: A silkroad game

// Libraries
//
// THREE.js
global.THREE = require("three");
// require("three/examples/js/loaders/GLTFLoader");

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
Server.GameEventsEmitter = require('socket.io').listen(Server.http);
// Client and server handshake: counter and unique client ids
Server.clientIdsCounter = 0;
Server.clientIds = [];
let connectedAvatars = []; // All the avatars that joined the game (3D models to be updated)

const LABOUR_RESOURCES = [{
        name: "",
        type: "volunteer",
        weight: 1.2,
        value: 1,
        health: 10,
        lifespan: 20,
        cost: 0,
        produce: []
    },
    {
        name: "",
        type: "freelancer",
        weight: 1.2,
        value: 1,
        health: 10,
        lifespan: 20,
        cost: 0,
        produce: []
    },
    {
        name: "",
        type: "intern",
        weight: 1.2,
        value: 1,
        health: 10,
        lifespan: 20,
        cost: 0,
        produce: []
    },
    {
        name: "",
        type: "student",
        weight: 1.2,
        value: 1,
        health: 10,
        lifespan: 20,
        cost: 0,
        produce: []
    },
    {
        name: "",
        type: "junior",
        weight: 1.2,
        value: 1,
        health: 10,
        lifespan: 20,
        cost: 0,
        produce: []
    },
    {
        name: "",
        type: "apprentice",
        weight: 1.2,
        value: 1,
        health: 10,
        lifespan: 20,
        cost: 0,
        produce: []
    },
    {
        name: "",
        type: "skilled",
        weight: 1.2,
        value: 1,
        health: 10,
        lifespan: 20,
        cost: 0,
        produce: []
    },
    {
        name: "",
        type: "expert",
        weight: 1.2,
        value: 1,
        health: 10,
        lifespan: 20,
        cost: 0,
        produce: []
    },
    {
        name: "",
        type: "professional",
        weight: 1.2,
        value: 1,
        health: 10,
        lifespan: 20,
        cost: 0,
        produce: []
    },
    {
        name: "",
        type: "master",
        weight: 1.2,
        value: 1,
        health: 10,
        lifespan: 20,
        cost: 0,
        produce: []
    },
    {
        name: "",
        type: "retired",
        weight: 1.2,
        value: 1,
        health: 10,
        lifespan: 20,
        cost: 0,
        produce: []
    },
];

const RAW_RESOURCES = [{
        name: "water",
        weight: 1,
        value: 10,
        produce: ["cotton", "rice"],
        effects: []
    },
    {
        name: "cotton",
        weight: 1.2,
        value: 1,
        produce: ["denim_jeans"]
    },
    {
        name: "abaca",
        weight: 0.7,
        value: 1.3,
        produce: []
    },
    {
        name: "algae",
        weight: 0.02,
        value: 1.3,
        produce: []
    },
    {
        name: "aluminium",
        weight: 0.7,
        value: 1.3,
        produce: []
    },
    {
        name: "calcium_carbonate",
        weight: 0.7,
        value: 1.3,
        produce: []
    },
    {
        name: "cellulose",
        weight: 0.7,
        value: 1.3,
        produce: []
    },
    {
        name: "chitin",
        weight: 0.7,
        value: 1.3,
        produce: []
    },
    {
        name: "rice",
        weight: 0.7,
        value: 1.3,
        produce: ["rice_roll"]
    },
    {
        name: "sugar",
        weight: 0.01,
        value: 1.5,
        produce: []
    },
    {
        name: "pepper",
        weight: 0.01,
        value: 1.5,
        produce: []
    },
    {
        name: "paprika",
        weight: 0.01,
        value: 1.5,
        produce: []
    },
    {
        name: "coconut",
        weight: 0.7,
        value: 1.3,
        produce: []
    },
    {
        name: "cork",
        weight: 0.7,
        value: 1.3,
        produce: []
    },
    {
        name: "eucalyptus",
        weight: 0.7,
        value: 1.3,
        produce: []
    },
    {
        name: "fibre",
        weight: 0.7,
        value: 1.3,
        produce: []
    },
    {
        name: "glass",
        weight: 0.7,
        value: 1.3,
        produce: []
    },
    {
        name: "hemp",
        weight: 0.7,
        value: 1.3,
        produce: []
    },
    {
        name: "jute",
        weight: 0.7,
        value: 1.3,
        produce: []
    },
    {
        name: "linen",
        weight: 0.7,
        value: 1.3,
        produce: []
    },
    {
        name: "lyocell",
        weight: 0.7,
        value: 1.3,
        produce: []
    },
    {
        name: "fish_waste",
        weight: 0.7,
        value: 1.3,
        produce: []
    },
    {
        name: "muskin",
        weight: 0.7,
        value: 1.3,
        produce: []
    },
    {
        name: "mycelium",
        weight: 0.7,
        value: 1.3,
        produce: []
    },
    {
        name: "bamboo",
        weight: 0.7,
        value: 1.3,
        produce: []
    },
    {
        name: "palm_leaf",
        weight: 0.7,
        value: 1.3,
        produce: []
    },
    {
        name: "corn",
        weight: 0.7,
        value: 1.3,
        produce: []
    },
    {
        name: "silk",
        weight: 0.7,
        value: 1.3,
        produce: []
    },
    {
        name: "wheat",
        weight: 0.7,
        value: 1.3,
        produce: []
    },
    {
        name: "steel",
        weight: 0.7,
        value: 1.3,
        produce: []
    },
    {
        name: "starch",
        weight: 0.7,
        value: 1.3,
        produce: []
    },
    {
        name: "soy",
        weight: 0.7,
        value: 1.3,
        produce: []
    },
    {
        name: "waste",
        weight: 0.7,
        value: 1.3,
        produce: []
    },
    {
        name: "wool",
        weight: 0.7,
        value: 1.3,
        produce: []
    },
    {
        name: "lamb_meat",
        weight: 0.7,
        value: 1.3,
        produce: []
    },
    {
        name: "beef_meat",
        weight: 0.7,
        value: 1.3,
        produce: []
    },
    {
        name: "oil",
        weight: 5,
        value: 20,
        produce: []
    },
    {
        name: "wood",
        weight: 10,
        value: 15,
        produce: []
    },
    {
        name: "fish",
        weight: 3,
        value: 15,
        produce: []
    },
    {
        name: "plastic",
        weight: 0.01,
        value: 0.5,
        produce: []
    },
    {
        name: "chicken_meat",
        weight: 0.01,
        value: 0.5,
        produce: []
    },
    {
        name: "weed",
        weight: 0.01,
        value: 0.01,
        produce: []
    }
];

const TIER_1_TRADES = [{
        name: "denim_jeans",
        weight: 2.2,
        value: 5,
        multiply: 1.2
    },
    {
        name: "toothpaste",
        weight: 1.6,
        value: 2.50,
        multiply: 1.05
    },
    {
        name: "soap",
        weight: 0.6,
        value: 2.20,
        multiply: 1.1
    }
];

let PRIMARY_INDUSTRIES = [{
        name: "agriculture",
        stock: 0.54,
        pro: "environment",
        con: "economic_growth"
    },
    {
        name: "",
        stock: 0.54,
        pro: "environment",
        con: "economic_growth"
    }
];

let SECONDARY_INDUSTRIES = [{
        name: "steel",
        stock: 0.54,
        pro: "environment",
        con: "economic_growth"
    },
    {
        name: "bio",
        stock: 0.54,
        pro: "environment",
        con: "economic_growth"
    },
    {
        name: "pharmaceutical",
        stock: 0.60,
        pro: "",
        con: "economic_growth"
    },
    {
        name: "defense",
        stock: 0.70,
        pro: "",
        con: ""
    },
    {
        name: "processed_food",
        stock: 0.15,
        pro: "",
        con: ""
    },
    {
        name: "clothes",
        stock: 0.15,
        pro: "",
        con: ""
    }
];

let TERTIARY_INDUSTRIES = [{
        name: "teaching",
        stock: 0.54,
        pro: "environment",
        con: "economic_growth"
    },
    {
        name: "nursing",
        stock: 0.54,
        pro: "environment",
        con: "economic_growth"
    },
    {
        name: "entertainment",
        stock: 0.70,
        pro: "",
        con: ""
    },
    {
        name: "restauration",
        stock: 0.25,
        pro: "",
        con: ""
    },
    {
        name: "fashion",
        stock: 0.15,
        pro: "",
        con: ""
    }
];

let QUATERNARY_INDUSTRIES = [{
        name: "scientific_research",
        stock: 0.32,
        pro: "",
        con: ""
    },
    {
        name: "aerospace_research",
        stock: 0.32,
        pro: "",
        con: ""
    }
];

// Bacteria strains used for food development
let PROKARYOTES_STRAINS_CULTURE = [{
    name: "Lactobacillus",
    produce: ["yogurt", "cheese"]
}];

let EUKARYOTES_STRAINS_CULTURE = [{
    type: "fungi",
    name: "yeast",
    produce: []
}];

// Researchable techniques
let PRODUCE_TECHNIQUES = [{
        name: "fermentation",
        produce: ["pickled_cucumber", "kombucha", "kimchi", "yogurt", "wine", "beer"]
    },
    {
        name: "bacteria_culture",
        produce: ["antibiotics", "agriculture_boost", "oil_spill_breakdown", "sewage_treatment"],
        cost: {
            value: 5,
            laboratory: ["solid_media", "liquid_media"]
        }
    }
];

// BROKERAGE MODEL
// map hash table for the base data
let brokerage = new Map();
brokerage = setupBrokerage();
// RESOURCE CACHE (SRIs)
let instantiatedResources = [];
let activeSRI = []; // UPDATE THIS WHEN PLAYERS TAKE DOWN AN SRI

// setupBrokerage
//
// Fills an empty brokerage from raw data
function setupBrokerage() {
    for (let i = 0; i < RAW_RESOURCES.length; i++) {
        let item = RAW_RESOURCES[i];
        let itemName = item['name'];
        brokerage.set(itemName, {
            'value': item['value'], // base value
            'totalQty': 0, // 0 for now
            'sellerIds': [], // Empty for now
        });
        // console.log(brokerage.get(itemName));
    }
    // Map to array
    // const _brokerage = Array.from(brokerage).reduce(function(obj, [key, value]){
    //     obj[key] = value;
    //     return obj;
    // }, {});
    // console.log(brokerage);
    return brokerage;
}
// sellItemToBrokerage
// itemToSell: the object containing the mapped key of the item to sell along with the seller's data
// For incoming sell requests
function sellItemToBrokerage(itemToSellData) {
    // Check the itemToSell is in the brokerage database
    //console.log(brokerage);
    //if(!brokerage.has(itemToSellData.info.item.name)) return;

    // Update currentItem
    let currentItemToSellData = brokerage.get(itemToSellData.info.item.name);  // Target
    // // Update new seller
    currentItemToSellData.sellerIds.push(itemToSellData.metaData.sellerId);
    // Update new totalQty
    let newQty = parseInt(currentItemToSellData.totalQty);
    newQty += parseInt(itemToSellData.info.qty);
    currentItemToSellData.totalQty = newQty;
    // console.log("TOTAL QTY: " + currentItemToSellData.totalQty);
    // console.log(currentItemToSellData);

    // Update value: Todo call another function
    // May have to use map.delete instead here
    // brokerage.set(itemToSellData.name, Object.assign(currentItemToSellData, updatedItemData));
    // Refresh view by broadcasting the updated brokerage is done in a separate event request from client

    // Template for sell item code
    // On sell request, add to queue of objects to sell by Host.
    // In a different sell function, run through sell queue (update it first), then
    // Object.Assign() copy obj of mapped itemName for each request, and append new entry obj in sellerIds array 

    // Template
    // 'value': item['value'], // To be adjusted by host depending on totalQty (supply) and demand (depends on in-game factors etc. to be defined)
    // 'totalQty': 0, // Calculated from all qtys in sellerIds
    // 'sellerIds': [{ // Seller data
    //     'thisSellerId': '', // To be provided at transaction (socket id)
    //     'thisSellerName': '', //optional character's name
    //     'timeStamp': null, // To be provided at transaction
    //     'qty': 1, // can be any value up to a max value, to be provided at transaction
    // }
}

// GAME: 
//
// Brokerage Controller
// 1̶.̶ C̶a̶c̶h̶e̶ a̶l̶l̶ t̶h̶e̶ e̶x̶i̶s̶t̶i̶n̶g̶ i̶t̶e̶m̶s̶ i̶n̶ t̶h̶e̶ g̶a̶m̶e̶ o̶v̶e̶r̶ t̶o̶ c̶l̶i̶e̶n̶t̶ s̶i̶d̶e̶ (̶f̶o̶r̶ v̶a̶l̶i̶d̶a̶t̶i̶o̶n̶ e̶t̶c̶.̶)̶
// 1.5 Every fixed tick (e.g., live or 5 secs), refresh brokerage list (valuing, quantity, taxes fluctuation)
// over to client
// 
// 2. On player requesting a buy or sell with brokerage interface,
// Buy pseudocode
// Client -> First validate if player has enough capital + resources + labor + build queues 
// Client -> If so, then request Host to exchange an item (x quantity requested) for agreed upon
// capital, resource
// Host -> Update bought item value, quantity left, updates all clients (broadcast) of updated
// brokerage, then personally for the client that requested the trade, deduct capital, labor and resources AND take fixed commission rate (5%-15%) and add qty requested
// Host -> Also must get the sold item's socket.id corresponding to the original seller and send them the agreed price.
// Host -> Finally add the item in that client's trade item inventory
// If an important acquisition/buy, maybe announce to server
// Sell pseudocode
// Client -> First validate if player has enough of the item to sell as referred in sale request
// If so, request Host to deduct from trade items inventory said items
// Host -> increment qty of said items and update its valuing if needed, then broadcast to all clients the updated brokerage
// Host -> Also cache the seller's unique socket.id, to know whom to pay when other players buy said item

// Automatic resource assignment system vs. player investment system
// Each player starts with a primary resource (i.e., forest)
// That generates base revenue to start investments and hire labor
// But the primary resource declines in health
// Player has fixed amount of "play cards"/action points to play until they regenerate over time
// These include buyouts, sellouts, manufacturing, industry investments, "quest scenarios"
// Player can process raw resources into tiered trade items and keep going to increase valuing 
// and then sell them. All items have an expiry/decreasing value factor/decay rate to incentivize going on.
// Money is deducted periodically from owning a primary resource (rights, landlord, etc.)
// and hiring labour + investing in industries, incentivizing ongoing active gameplay

// Win lose system
// Each game must last around 30-45 minutes (maybe)
// then a set of winning conditions and losing conditions in established at the beginning of a match
// but that is only known to the player and not others -- and each has a different role in the economy
// These roles are fixed, so that one pursues their scenario's conditions
// This mechanic reinforces the intertextual elements/layers of meanings desired

// Cycle System
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
// console.log("World Cycle Settings: ");
// console.log(cycleSettings);
// MVC Architecture... The View will contain the rendered world
Server.Model = {};
Server.View = {};
Server.LogicController = {};

// MODEL LAYER: 
//
// GENERAL SETTINGS FOR A CYCLE
Server.Model.CycleSettings = function (cycleSettings) {
    // Private
    "use strict";
    const CYCLE_DAY_START = cycleSettings.startDay;
    const CYCLE_MONTH_START = cycleSettings.startMonth;
    const CYCLE_YEAR_START = cycleSettings.startYear;
    const CYCLE_TOTAL_DURATION = cycleSettings.cycleTotalDuration;
    const CYCLE_GENERATION_DURATION = cycleSettings.cycleGenerationDuration;
    const CYCLE_CHECKPOINTS = CYCLE_TOTAL_DURATION / CYCLE_GENERATION_DURATION // 100/10 = 10 checkpoints in-game
    const CYCLE_TICK = cycleSettings.cycleTick;
    const CYCLE_TYPE = cycleSettings.cycleType;

    return {
        CycleSettings: function () {
            return this;
        },
        getCycleDayStart: function () {
            return CYCLE_DAY_START;
        },
        getCycleMonthStart: function () {
            return CYCLE_MONTH_START;
        },
        getCycleYearStart: function () {
            return CYCLE_YEAR_START;
        },
        getCycleTotalDuration: function () {
            if (CYCLE_TOTAL_DURATION === null || CYCLE_TOTAL_DURATION === 0 || CYCLE_TOTAL_DURATION === 'undefined' || Number.isNaN(CYCLE_TOTAL_DURATION) === true) {
                console.log("Invalid value. Entering default values.");
                return 100; // Default value if bogus values entered
            }
            return CYCLE_TOTAL_DURATION;
        },
        getCycleGenerationDuration: function () {
            if (CYCLE_GENERATION_DURATION === null || CYCLE_GENERATION_DURATION === 0 || CYCLE_GENERATION_DURATION === 'undefined' || Number.isNaN(CYCLE_GENERATION_DURATION) === true) {
                console.log("Invalid value. Entering default values.");
                return 10; // Default value if bogus values entered
            }
            return CYCLE_GENERATION_DURATION;
        },
        getCycleCheckPoints: function () {
            // Verify cycleSettings' values
            if (CYCLE_CHECKPOINTS === 0 || CYCLE_CHECKPOINTS === 'undefined' || CYCLE_CHECKPOINTS === null || Number.isNaN(CYCLE_CHECKPOINTS) === true) {
                console.error("Cycle total duration and generation duration must have a positive number value to continue.");
                console.log("Invalid value. Entering default values.");
                return 100 / 10; // Default calculation if bogus values entered
            }
            return CYCLE_CHECKPOINTS;
        },
        getCycleTick: function () {
            return CYCLE_TICK;
        },
        getCycleType: function () {
            return CYCLE_TYPE;
        }
    }
};

// Test Object: The server's model
const ServerModelCycleSettings = Server.Model.CycleSettings(cycleSettings).CycleSettings();
// console.log("A");
// console.log(ServerModelCycleSettings);

// LOGIC LAYER:
// @args: ServerModelCycleSettings
// CycleEvents: Controller for in-game cycle events 
Server.LogicController.CycleEvents = function (ServerModelCycleSettings) {
    // Data test
    // console.log("B");
    // console.log(ServerModelCycleSettings.getCycleCheckPoints());
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
    const MIN_INSTANCES_PER_CYCLE = 5;
    const MAX_INSTANCES_PER_CYCLE = 15; 
    // RESOURCE PATHS FOR GENERATION
    const TREE_PATH = '/public/models/tree_low_0001_export.glb';
    const MAX_ACTIVE_SRI = 5;

    switch (cycleTick) {
        case "hourly":
            // Convert cycleGenerationDuration to real life hours
            // One hour = 1000 * 60 * 60 milliseconds
            const hourInMs = 1000 * 60 * 60;
            // console.log("Starting a new cycle in one hour.");
            // SERVER_CYCLE_TICK = 600 * 1000; // Every 10 minutes
            SERVER_CYCLE_TICK = 10 * 1000; // Every 10 minutes
            break;
        default:
            break;
    }

    return {
        getServerCycleTickInterval: function () {
            return serverCycleTickInterval;
        },
        getTickCount: function () {
            return tickCount;
        },
        // The server runs that game cycle for 10 hours (until 18:00 EST).
        // Every hour, the game checkpoints each user's socket: decisions (game logic) and updates the game world. 10 years pass every hour
        // in my example.
        loopCycleEvents: function () {
            if (tickCount === 0) {
                serverCycleTickInterval = setInterval(() => {
                    // Reset
                    instantiatedResources = null;
                    instantiatedResources = [];
                    // if (tickCount >= ServerModelCycleSettings.getCycleCheckPoints()) {
                    //     clearInterval(serverCycleTickInterval);
                    //     console.log("Game over.");
                    //     return; // Cycles are over at this stage
                    // }
                    // Checkpoint: Check all logged in sockets' data
                    // And update the world, until end of Cycle Total Duration
                    // Generate a new SRI
                    // RESOURCES
                    // Only generate when the special resources left are all GONE.
                    if(activeSRI.length >= MAX_ACTIVE_SRI) {
                        return;
                    }
                    if(activeSRI.length === 0) {
                        activeSRI = [];
                    }
                    let randType = THREE.MathUtils.randInt(0, 10);
                    let resourceType;
                    if(randType <= 3){
                        resourceType = "tree";                     
                    } else if(randType <= 6) {
                        resourceType = "tree"; // Only trees for now TODO add more types
                    } else {
                        resourceType = "tree";
                    }
                    // let randResCount = THREE.MathUtils.randInt(MIN_INSTANCES_PER_CYCLE, MAX_INSTANCES_PER_CYCLE);
                    let randResCount = 1; // Simple case

                    for(let i = 0; i < randResCount; i++) {
                        let newResourceUUID = THREE.MathUtils.generateUUID();
                        let loadConfig = {
                            scale: 1,
                            position: new THREE.Vector3(THREE.MathUtils.randInt(-1000, 1000), 0, THREE.MathUtils.randInt(-100, 100)), // TODO defined places on the map read from file
                            type: resourceType,
                            uuid: newResourceUUID,
                        };
                        //console.log(loadConfig.position);
                        instantiatedResources.push(loadConfig);
                        // Update the activeSRI
                        activeSRI.push(loadConfig);
                    }
                    // emit this tree to the players so that they can load it
                    console.log("NEW CYCLE BEGIN: " + tickCount + "th cycle.");
                    Server.GameEventsEmitter.emit("newCycleBegin", {message: "A New Special Resource Instance has spawned in the world.", resources: instantiatedResources } );
                    Server.onNewCycleBegin("Seasons pass.");
                    ++tickCount;
                }, SERVER_CYCLE_TICK);
            }
        }
    }
}

Server.LogicController.CycleEvents(ServerModelCycleSettings).loopCycleEvents();

// Host references required for game
// Join game
let newGameId = (Math.random() * 100000) | 0;
console.log("Emit created new game with game room id: " + newGameId);
// Create new brokerage

function getHostGameModel() {
    let _brokerage = JSON.stringify(Array.from(brokerage));
    return {
        'gameId': newGameId,
        'rawResources': RAW_RESOURCES,
        'labourResources': LABOUR_RESOURCES,
        'brokerage': _brokerage
    }
}

// EVENTS:
//
// HOST SETUP AND INIT

// CONNECTION EVENT (When new or returning users connect to a new game cycle)
Server.bindHostEvents = function (socket) {
    // Client Server handshake
    let gameData = getHostGameModel();
    socket.on('join', function (data) {
        ++Server.clientIdsCounter;
        // Cache that avatar on the host side
        console.log(data);
        connectedAvatars.push({socketId: this.id, data: data});
        // TODO need hard fast fail here... do not allow player to enter game if no game data
        // TODO make this only for the client who just joined
        // Update this newly joined player socket (only) with previously joined avatars
        Server.GameEventsEmitter.to(socket.id).emit('joinedClientId', { clientId: Server.clientIdsCounter, gameData: gameData, olderAvatars: connectedAvatars, activeSRI: activeSRI } );        
        // IMPoRTANT; need to constantly keep connectedAvatars pdated with latest position
        // Broadcast to everyone but the sender that avatar
        socket.broadcast.emit('newAvatarInWorld', {socketId: this.id, data: JSON.stringify(data)});
        console.log('a new user with id ' + Server.clientIdsCounter + " has entered with avatar: " + data + " and id: " + this.id);
        Server.clientIds.push({
            id: Server.clientIdsCounter,
            socketId: socket.id,
        });
    });
    socket.on('emitPlayerChangeWorldPosition', function(data) {
        // console.log("Player with id " + data.myUniquePlayerId + " moved to new position: ");
        // console.log(data.desiredPositionGoal);
        // Broadcast this position to all other players
        socket.broadcast.emit('emitToOtherPlayersChangedWorldPosition', data);
    });
    socket.on('fetchGameId', function (data) {
        console.log('user : ' + this.id + ' has requested the game id. Sending back Room id #: ' + gameData.gameId);
        //console.log(gameData);
        socket.emit('fetchGameIdResponse', gameData['gameId']);
    });
    // Attach a listener to that socket client, so when a connected socket emits a chat message event, they the server will emit the event + the msg
    socket.on('chat message', function (msg) {
        console.log('a user sent a message');
        Server.GameEventsEmitter.emit("chat message", msg);
    });
    // New cycle event
    socket.on('newCycleBegin', function (msg) {
        Server.GameEventsEmitter.emit("newCycleBegin", msg);
    });
    // Disconnected player
    socket.on('disconnect', function () {
        console.log('A user disconnected ' + socket.id);
        //search and remove the player avatar associated with the unique id of disconnectedPlayer
        let disconnectedUniqueUserId;
        console.log(connectedAvatars);
        for(let i = 0; i < connectedAvatars.length; i++) {
            console.log(connectedAvatars[i].socketId);
            if(connectedAvatars[i].socketId === socket.id) {
                disconnectedUniqueUserId = connectedAvatars[i].data.uniquePlayerId;
                console.log("deleting socketID " + connectedAvatars[i].socketId + " unique game ID: " + disconnectedUniqueUserId);
                connectedAvatars.splice(i, 1);
            }
        }
        // Update all sockets with the updated Server.connectedAvatars
        socket.broadcast.emit('updatedConnectedAvatars', {disconnectedPlayerId: disconnectedUniqueUserId, updatedConnectedAvatars: connectedAvatars});
    });
    socket.on('onBuyItem', function (itemToBuyData) {
        console.log(itemToBuyData);
        // Adjust item values in brokerage?
        let oldTotalQty = brokerage.get(itemToBuyData.tradeInfo.info).totalQty;
        console.log(oldTotalQty);
        // TODO actually give the user the choice of how many pieces to buy, and group items by qty bundles
        // let qtyToBuy = itemToBuyData.tradeInfo.item.qty;
        // console.log(qtyToBuy);
        let oldSellerIds = brokerage.get(itemToBuyData.tradeInfo.info).sellerIds;
        let sellerIdToCompensate = itemToBuyData.tradeInfo.sellerId;
        let index = oldSellerIds.indexOf(sellerIdToCompensate);
        oldSellerIds.splice(index, 1);
        brokerage.set(itemToBuyData.tradeInfo.info, {
            'value': itemToBuyData.tradeInfo.item.value, // TODO dynamically re-adjust value based on scarcity, offer and supply
            'totalQty': oldTotalQty - 1, // TODO see previous TODO
            'sellerIds': oldSellerIds,
        });
        console.log(brokerage.get(itemToBuyData.tradeInfo.info));
        // Take comission fee from seller (in buy function)
        // Pay a guaranteed ticket if quality is good enough?
        // Host appraises quality of good and changes rating of seller 
        // Resend updated brokerage to everyone
        let arrayMapBrokerage = JSON.stringify(Array.from(brokerage));
        Server.GameEventsEmitter.emit('onRefreshBrokerage', arrayMapBrokerage);
    });
    socket.on('onSellItem', function (itemToSellData) {
        // First add to queue of items to sell on brokerage to prevent simultaneous conflicts
        // TODO 
        // Update brokerage in host side
        // console.log(itemToSellData);
        sellItemToBrokerage(itemToSellData);
        // Emit to everyone the updated brokerage
        // console.log(brokerage);
        // Socket doesn't transit maps yet
        let arrayMapBrokerage = JSON.stringify(Array.from(brokerage));
        Server.GameEventsEmitter.emit('onRefreshBrokerage', arrayMapBrokerage);
        // Can sell information too?
    });
    socket.on('onBuildItem', function () {

    });
    socket.on("onResourceDestroyed", function(uuid) {
        console.log("uuid to splice");
        for(let i = 0; i < activeSRI.length; i++) {
            console.log(activeSRI[i].uuid);
            if(activeSRI[i].uuid === uuid) {
                console.log("Found uuid to delete on server");
                activeSRI.splice(i, 1);
            }
        }
        socket.broadcast.emit("onPlayerDestroyedAResource", {activeSRI: activeSRI, uuidDelete: uuid});
    });
}

// PORT LISTENERS:
//
// MAIN GAME PORT
let port = process.env.PORT; // heroku
if(port == null || port == "") {
    port = 3000;    
}
Server.http.listen(port, () => {
    console.log('listening on *:3000');
});

// ROUTES:
//
// AT /PUBLIC SERVES GAME.HTML
Server.WorldServer.get('/', (req, res) => {
    res.sendFile("Game.html", {
        root: Server.path.join(__dirname, '../public/')
    });
});

// EVENTS REGISTRATION
//
// connection
Server.GameEventsEmitter.on('connection', Server.bindHostEvents);

// EVENTS::onNewCycleBegin
//
// ON NEW CYCLE BEGIN
Server.onNewCycleBegin = function (msg) {
    console.log('A new cycle begin event has triggered. Depending on your CYCLE settings, this means the world will begin a new cycle.');
    console.log('Each socket will get this event tick.');
    console.log("Announcement: " + msg);
}