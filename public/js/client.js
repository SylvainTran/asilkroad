// Client code
$(function () {
    // Tell to move 
    let allowPositionUpdate = false;
    // Game model meshes
    let gameModels = [];
    let activeSRIs = [];
    let manufacturingQueue = []; // Currently manufactured objects
    let pickHelperGameModels = [];
    // LanterLight
    let lanternLight;
    // clock for frame rates and also decreasing factors
    let clock = new THREE.Clock();
    let speed = 2;
    let delta = 0;
    let player; // client player instance
    // Fireplace model
    let fireplaceModel;
    // Actual progression
    let progression = {
        tutorials: {
            movementControls: false,
            cameraControls: false,
            resourceCollectionActions: false,
            inventoryActions: false,
            fireplacePowerDecay: false,
            fireplacePowerSell: false,
            fireplaceMilestone: false,
            brokerageActions: false,
            brokerageActions2: false,
            brokerageActions3: false,
            events: false,
            goals: false,
            economy: false,
            otherPlayers: false
        }
    };

    class Player {
        constructor(lanternLight) {
            // Private properties            
            this.lanternLight = lanternLight; // Physical lantern light
            this.maxLanternLightPower = 499; // For tutorial, 500 is threshold to buy/sell. Then max = 2000 as normal
        }
        // Public methods
        getLanternLightPower() {
            return Math.floor(this.lanternLight.power);
        }
        setMaxLanternLightPower(value) {
            this.maxLanternLightPower = value;
        }
        // Sets the player's lantern light values
        setPlayerLanternLightValues(power, decay, distance) {
            this.lanternLight.power = power;
            this.lanternLight.decay = decay;
            this.lanternLight.distance = distance;
        }
        updatePlayerLanternLightValues(delta) {
            // Tutorial
            if(!progression.tutorials.fireplacePowerDecay) {
                return;
            }
            this.lanternLight.power -= (1 / (1 - 0.5)) * delta * 10;
            this.lanternLight.power = THREE.MathUtils.clamp(this.lanternLight.power, 0, this.maxLanternLightPower);
            // Update UI 
            $('.ui--lantern-light-level').html("Fireplace Strength: " + Math.floor(this.lanternLight.power));
        }
        playerFeedLanternLight(item) {
            // console.log(item);
            let feedAmount = item.info.item.value; // TODO set this up by item type
            this.lanternLight.power += feedAmount * 100;
            this.lanternLight.power = THREE.MathUtils.clamp(this.lanternLight.power, 0, this.maxLanternLightPower);
        }
        manufactureItem(item) {
            console.log(item);
            popManufactureMenuDOM(item);
        }
    }
    // Helper util classes (TODO require them from external files)
    class PickHelper {
        constructor() {
            this.raycaster = new THREE.Raycaster();
            this.pickedObject = null;
            this.pickedObjectSavedColor = 0;
            this.gameModels = gameModels;
        }
        getGameModels() {
            return this.gameModels;
        }
        setGameModels(newGameModels) {
            this.gameModels = newGameModels;
        }
        addToGameModels(mesh) {
            this.gameModels.push(mesh);
        }
        checkInteractibles(normalizedPosition, camera, scene, event) {
            if (this.pickedObject) {
                if (this.pickedObject.material.emissive) {
                    this.pickedObject.material.emissive.setHex(this.pickedObjectSavedColor);
                    this.pickedObject = undefined;
                }
            }
            // cast a ray through the frustum
            this.raycaster.setFromCamera(normalizedPosition, camera);
            // get the list of objects the ray intersected
            const intersectedObjects = this.raycaster.intersectObjects(this.gameModels);

            if (intersectedObjects.length) {
                if (intersectedObjects[0].object === null) return;
                let interactible = false;
                this.pickedObject = intersectedObjects[0].object;
                objectTag = this.pickedObject.userData['tag']; // Custom object mesh label used to know if it can be interacted with
                if(objectTag.toLowerCase() === "floor" || objectTag.toLowerCase() === "terrain") {
                    return;
                }
                objectTagResourceProperty = this.pickedObject.userData['resource'];
                selectedObjUUID = this.pickedObject.parent.parent.uuid;
                if(objectTag === "tree" || objectTag === "adventurerRecruitingTable" || objectTag === "fireplace" || objectTag === "manufacturingWorkbench" || objectTag === "flareflag" || objectTag === "courrierOps") {
                    interactible = true;
                    // UX: Text info
                    $('.explorable-text-view--update').html('<h4><em>It is some ' + objectTag + '.</em></h4>');
                }
                // UX: Selectable Color flash
                if (interactible && this.pickedObject.material) {
                    if (this.pickedObject.material.emissive) {
                        this.pickedObjectSavedColor = this.pickedObject.material.emissive.getHex();
                        // set its emissive color to white
                        this.pickedObject.material.emissive.setHex(0xFFFFFF);
                    }
                }
            }
        }
        pick(normalizedPosition, gameModels, camera, scene, event) {
            // restore the color if there is a picked object
            if (this.pickedObject) {
                if (this.pickedObject.material.emissive) {
                    this.pickedObject.material.emissive.setHex(this.pickedObjectSavedColor);
                    this.pickedObject = undefined;
                }
            }
            // cast a ray through the frustum
            this.raycaster.setFromCamera(normalizedPosition, camera);
            // get the list of objects the ray intersected
            const intersectedObjects = this.raycaster.intersectObjects(this.gameModels);
            // for(let i = 0; i < this.gameModels.length; i++) {
            //     console.log("Game model UUID: " + this.gameModels[i].parent.parent.uuid);
            // }
            if (intersectedObjects.length) {
                if (intersectedObjects[0].object === null) return;
                // pick the first object. It's the closest one
                this.pickedObject = intersectedObjects[0].object;
                // using the global objectTag for now
                objectTag = this.pickedObject.userData['tag']; // Custom object mesh label used to know if it can be interacted with
                // console.log(objectTag);
                // Update global object resource too
                objectTagResourceProperty = this.pickedObject.userData['resource'];
                // console.log(objectTagResourceProperty);
                // Update selected obj uuid
                selectedObjUUID = this.pickedObject.parent.parent.uuid;
                // Walkable object?
                const walkable = this.pickedObject.userData['walkable'];
                // Signs and Feedback : Text UI
                // Get the userDataObjectLabel that we defined in Blender (mesh custom properties)
                $('.explorable-text-view--update').html('<h4><em>It is some ' + this.pickedObject.userData['tag'] + '.</em></h4>');

                // Signs and Feedback : Visual UI FX
                // save its color if it's a mesh with a material
                if (this.pickedObject.material) {
                    if (this.pickedObject.material.emissive && objectTag === 'tree') {
                        this.pickedObjectSavedColor = this.pickedObject.material.emissive.getHex();
                        // set its emissive color to white
                        this.pickedObject.material.emissive.setHex(0xFFFFFF);
                    }
                }
                // Interactivity selector : Deal with objects according to their custom userData tag
                if (walkable === 'true') {
                    // Allow position change
                    allowPositionUpdate = true;
                    // Pass in the point where the ray intersected with the mesh under the mouse cursor to get the move position
                    updatePosition(intersectedObjects[0].point);
                    // Adjust ground height if walking inside house
                    if(objectTag.toLowerCase() === 'floor') {
                        averageGroundHeight = 4;
                    } else {
                        averageGroundHeight = 1;
                    }
                }
                if (objectTag === 'tree' || objectTag === 'adventurerRecruitingTable') {
                    // Open context menu -- the in-game version
                    popContextMenu({
                        event: event,
                        contextMenu: $('#contextMenu--select-container'),
                        scene: scene,
                        tag: objectTag
                    });
                }
                if (objectTag === 'fireplace') {
                    $('.brokerage-view-container').fadeToggle();
                }
            }
        }
    }
    // THREE JS
    //
    // 

    // CLIENT NETWORK CONTROLLER CODE
    //
    /////////////////////////////////
    // The socket instance used for updating the server
    let socket;
    // uniquePlayerId (TODO need a permanent one in the database, generated once on account creation)
    let myUniquePlayerId;
    // GAME DATA
    // the raw game data for caching
    let gameData;
    // BROKERAGE 
    // the up to date brokerage data
    let brokerage = new Map();
    // INVENTORY
    // the actual player inventory
    let inventory = []; // 6x4?
    const inventoryMaxSize = 24;
    // Currently selected object tag
    let objectTag = null;
    // The resource property of the tagged object
    let objectTagResourceProperty = null;
    // The uuid of the currently selected object
    let selectedObjUUID;
    // The obj to delete
    let objToDeleteUUID;
    // The player 
    let playerModel; // Loaded in init() only, but used to update positions etc.
    // Used for movement
    let positionGoalProgress;
    // Other players' avatar to be updated on move/animation
    let otherConnectedPlayers = [];
    // Global scene for now
    let scene;
    // Current position for movement anim
    let currentWorldPosition = new THREE.Vector3();
    // Move point picked by player
    let desiredPositionGoal;
    // // Raycast for positioning player on terrain
    let terrainRaycaster;
    // Terrain model
    let terrainModel;
    // Average terrain ground height to place models (temporary)
    let averageGroundHeight = 4;
    // INTERACTIBLES MODELS
    let adventurerRecruitingTableModel;
    let manufacturingTableModel;
    let courrierOpsModel;
    let flareflagModel;

    // CAMERA
    // Smooth factor
    const smooth = 1.5;
    // Relative position of the camera from the player
    let relCameraPos = THREE.Vector3();
    // Distance of the camera from the player
    let relCameraPosMag = 0;
    // Position the camera is trying to reach
    let newPos;

    // Model paths
    const MODEL_PATH = '/public/models/lounge_ops_all_export_0004.glb';
    const TREE_PATH = '/public/models/tree_low_0001_export.glb';
    const PLAYER_PATH = '/public/models/player_cart_0001_export.glb';
    const BONFIRE_PATH = '/public/models/bonfire_export_0003.glb';
    const FIREPLACE_PATH = '/public/models/fireplace_export_0002.glb';
    const ADVENTURER_RECRUITING_TABLE_PATH = '/public/models/adventurerRecruitingTable_export_0001.glb';
    const MANUFACTURING_TABLE_PATH = '/public/models/manufacturingTable_export_0001.glb';
    const COURRIER_OPS_PATH = '/public/models/courrierOps_export_0001.glb';
    const FLAREFLAG_PATH = '/public/models/flareflag_export_0001.glb';

    // Env. Props


    // Three.js variables
    let camera;
    let renderer;
    const canvas = $('#graphics-view--canvas')[0];
    const canvasContainer = $('.explorable-graphics-view')[0];
    const backgroundColor = 0x000000;
    // Pick helper
    const pickPosition = {
        x: 0,
        y: 0
    };
    const pickHelper = new PickHelper();
    $('#graphics-view--canvas').on("mousemove", onCanvasMouseMove);
    // Attach click event on canvas only
    $('#graphics-view--canvas').on("click", onCanvasMouseClick);
    // Context menu event handlers
    $('#contextMenu--select-cancel').click(closeContextMenu);
    // Event handlers binding
    $(document).ready(setupPlayer);
    $(document).click(setupMusicPlayer);

    // Update position
    function updatePosition(point) {
        // Only allow position updates if socket() was initialized in setup() on all models loaded
        if (!socket) return;
        desiredPositionGoal = point;
        // Set goal from new current world position of model
        positionGoalProgress = new THREE.Vector3(); // Empty object 3D as the point where the player clicked
        playerModel.getWorldPosition(positionGoalProgress);
        // Update server of new position change
        const dataPacket = {
            myUniquePlayerId: myUniquePlayerId,
            desiredPositionGoal: desiredPositionGoal, // The desired position to aim for
            positionGoalProgress: positionGoalProgress // the actual position right now
        };
        socket.emit('emitPlayerChangeWorldPosition', dataPacket);
        // Play sound FX
        playSound("#playerMove");
        // TODO import three-pathfinding.js (stretch)  
    }

    function popManufactureMenuDOM(item) {
        let confirmDialogConfig = {
            autoOpen: true,
            show: {
                effect: "fade",
                duration: 500
            },
            hide: {
                effect: "fade",
                duration: 250
            },
            resizable: true,
            height: "auto",
            width: 400,
            modal: false,
            title: "Confirm Manufacture?",
            buttons: {
                "Confirm": function () {
                    // Match with produce that was passed in data                    
                    let produce = $(this).data('produce'); // a string
                    // Pass this request about what to manufacture to the factory
                    console.log(item);
                    let dataBundle = {
                        uniqueItemId: item.info.uniqueId,
                        name: item.name,
                        produce: produce,
                        progress: 0 // To be updated
                    };
                    //let newUniqueId = THREE.MathUtils.generateUUID();
                    socket.emit('onManufactureItem', dataBundle);
                    // Send back list of something thats needed by server people?
                    removeFromInventory(item);
                    // Update current manufactured items list cache
                    manufacturingQueue.push(dataBundle);
                    $(this).dialog("close");
                },
                Cancel: function () {
                    $(this).dialog("close");
                }
            }
        };
        let dialogConfig = {
            autoOpen: false,
            show: {
                effect: "fade",
                duration: 500
            },
            hide: {
                effect: "fade",
                duration: 250
            },
            resizable: false,
            height: "auto",
            width: 800,
            modal: false,
            buttons: {
                "Choose Tier": function () {
                    console.log(item);
                    $('#inventory-contextMenu--manufacture-container').html("");
                    let header = "Resource: " + item.name + "<br>" + "Used For: <em>\"" + item.info.item.description + "\"</em>" + "<h1>Produces:</h1><br>";
                    let ul = $("<ul>");
                    $('#inventory-contextMenu--manufacture-container').append(header);
                    for (let i = 0; i < item.info.item.produce.length; i++) {
                        if (item.info.item.produce[i] === undefined) continue;
                        let li = $("<li>");
                        $(li).on("click", function () {
                            // Emit on buy request to server
                            $('#inventory-contextMenu--manufacture-container').html("You are about to manufacture this item. This will destroy the item.");
                            $('#inventory-contextMenu--manufacture-container').data("produce", item.info.item.produce[i]).dialog(confirmDialogConfig);
                        });
                        $(li).html("Produce: " + item.info.item.produce[i] + "<br>");
                        $(ul).append(li);
                    }
                    $('#inventory-contextMenu--manufacture-container').append(ul);
                    $('.explorable-text-view--update').html("You are manufacturing: " + item.name);
                },
                Cancel: function () {
                    $(this).dialog("close");
                }
            }
        };
        $('#inventory-contextMenu--manufacture-container').dialog(dialogConfig);
        $('#inventory-contextMenu--manufacture-container').dialog("open");
    }
    // Pop the DOM context menu
    function popContextMenuDOM(event) {
        // Tutorial -- TODO UX, embed and play small video of gameplay tutorial
        if (!progression.tutorials.brokerageActions) {
            // Pop-up tutorial
            $('#tutorial--container').html("");
            let p = $("<p>");
            let tutorialText = "You are amazing at this. I bet your parents are proud of you. Now that an item has been selected in your inventory, let's try trading it to the brokerage. Choose 'Trade to Broker' now.";
            p.append(tutorialText);
            $('#tutorial--container').html(tutorialText);
            $('#tutorial--container').dialog({
                position: {
                    my: "center top",
                    at: "center top",
                    of: window
                }
            });
            progression.tutorials.brokerageActions = true;
        }
        $('#inventory-contextMenu--select-container').html("");
        let dialogConfig = {
            autoOpen: false,
            show: {
                effect: "fade",
                duration: 500
            },
            hide: {
                effect: "fade",
                duration: 250
            },
            resizable: false,
            height: "auto",
            width: "auto",
            modal: false,
            buttons: {
                "Trade to Broker": function () {
                    // Fireplace power condition Tutorial
                    if (!progression.tutorials.fireplacePowerSell) {
                        checkFireplacePower();
                        // Pop-up tutorial
                        $('#tutorial--container').html("");
                        let p = $("<p>");
                        let tutorialText = "Surprised? You will only be able to use the Network and sell or buy items from other players if there is enough light in your current house's fireplace. The only way to ensure that is to cut some firewood and stoke the fireplace. Try choosing 'Stoke Fireplace' instead, then chop another wood and try selling it to the brokerage again.";
                        p.append(tutorialText);
                        $('#tutorial--container').html(tutorialText);
                        $('#tutorial--container').dialog({
                            position: {
                                my: "center top",
                                at: "center top",
                                of: window
                            }
                        });
                    }
                    if(!progression.tutorials.fireplaceMilestone && progression.tutorials.fireplacePowerSell && progression.tutorials.fireplacePowerDecay) {
                        // Pop-up tutorial
                        $('#tutorial--container').html("");
                        let p = $("<p>");
                        let tutorialText = "Well done. Remember, the same rule applies to buying items from other players.";
                        p.append(tutorialText);
                        $('#tutorial--container').html(tutorialText);
                        $('#tutorial--container').dialog({
                            position: {
                                my: "center top",
                                at: "center top",
                                of: window
                            }
                        });
                        progression.tutorials.fireplaceMilestone = true;
                    }            
                    // Check fireplace power to see if allow sale
                    if(!checkFireplacePower()) {
                        return;
                    }
                    console.log(event.data.item);
                    removeFromInventory(event.data.item);
                    tradeToBroker(event.data.item);
                    $('.explorable-text-view--update').html("You sent: " + event.data.item.name + " x" + event.data.item.info.qty + " to the brokerage.");
                    $(this).dialog("close");
                },
                "Manufacture": function () {
                    player.manufactureItem(event.data.item);
                    $(this).dialog("close");
                },
                "Stoke Fireplace": function () {
                    // Tutorial
                    if(!progression.tutorials.fireplacePowerDecay) {
                        player.setMaxLanternLightPower(2000); // Default value now that player finished the tutorial
                        player.setPlayerLanternLightValues(2000, 1.5, 150);
                        progression.tutorials.fireplacePowerDecay = true;
                        progression.tutorials.fireplacePowerSell = true;
                    }
                    player.playerFeedLanternLight(event.data.item);
                    removeFromInventory(event.data.item);
                    playSound('#foom_0');
                    $(this).dialog("close");
                },
                "Create campfire": function () {
                    // instantiate a pre-designed campfire asset
                    createBonfire();
                    $(this).dialog("close");
                },
                Cancel: function () {
                    $(this).dialog("close");
                }
            }
        };
        $('#inventory-contextMenu--select-container').dialog(dialogConfig);
        $('#inventory-contextMenu--select-container').dialog("open");
    }
    // removeFromInventory
    //
    // Removes traded item from inventory
    function removeFromInventory(item) {
        $('#' + item.info.uniqueId).remove();
    }
    // tradeToBroker
    //
    // This sends the selected inventory item to the brokerage
    function tradeToBroker(item) {
        // Tutorial
        if (!progression.tutorials.brokerageActions2) {
            $('#tutorial--container').html("");
            let p = $("<p>");
            let tutorialText = "Congratulations, you've just posted your first item on the brokerage. Now, let's try buying it back. Click on the fireplace and scroll down the opened up brokerage list. Find 'wood'. Click on it to trigger the buy menu.";
            p.append(tutorialText);
            $('#tutorial--container').html(tutorialText);
            $('#tutorial--container').dialog({
                position: {
                    my: "center top",
                    at: "center top",
                    of: window
                }
            });
            progression.tutorials.brokerageActions2 = true;
        }
        // emit onSellItem to server
        socket.emit('onSellItem', item);
        // Play sound FX
        playSound('#tradeToBrokerage');
    }

    // Pop the in-game context menu
    function popContextMenu(event) {
        // TODO make this better
        if (event.tag === 'adventurerRecruitingTable') {
            $('#contextMenu--select-collect').css("display", "none");
            $('#contextMenu--select-recruit').css("display", "inline-block");
        } else {
            $('#contextMenu--select-collect').css("display", "inline-block");
            $('#contextMenu--select-recruit').css("display", "none");
        }
        // prevent event bubbling from massive amounts of clicks
        let contextMenu = event.contextMenu[0];
        if (event.event) {
            event.event.stopPropagation();
            contextMenu.style.display = "block";
            contextMenu.style.position = "fixed";
            contextMenu.style.top = event.event.clientY + "px";
            contextMenu.style.left = event.event.clientX + "px";
            $('.contextMenu--select-label').html(objectTag);
        }
        let contextMenuFill;
        if ($(contextMenu).attr('id') === 'contextMenu--select-container') {
            contextMenuFill = {
                delegate: ".hasmenu",
                menu: [{
                        title: "Confirm",
                        cmd: "Confirm"
                    },
                    {
                        title: "Cancel",
                        cmd: "Cancel"
                    }
                ],
                select: function (event, ui) {
                    // alert("select " + ui.cmd + " on " + ui.target.text());
                    switch (ui.cmd) {
                        case "Confirm":
                            break;
                        case "Cancel":
                            $(contextMenu).css("display", "none");
                            break;
                        default:
                            break;
                    }
                }
            };
        } else {
            contextMenuFill = {
                delegate: ".hasmenu",
                menu: [{
                        title: "Confirm",
                        cmd: "Confirm"
                    },
                    {
                        title: "Cancel",
                        cmd: "Cancel"
                    }
                ],
                select: function (event, ui) {
                    // alert("select " + ui.cmd + " on " + ui.target.text());
                    switch (ui.cmd) {
                        case "Confirm":
                            break;
                        case "Cancel":
                            contextMenu.style.display = "none";
                            break;
                        default:
                            break;
                    }
                }
            };
        }
        // UX: Audio feedback
        let soundFeedback;
        switch(event.tag) {
            case 'tree':
                soundFeedback = "#cloth-inventory";
                break;
            case 'adventurerRecruitingTable':
                soundFeedback = "#amulet-of-absorption";
                break;
            case 'manufacturingTable':
                soundFeedback = "#amulet-of-absorption";
                break;                    
            default: 
                break;
        }
        playSound(soundFeedback);

        $(contextMenu).contextmenu(contextMenuFill);
        // Attach a one time event to close it if clicked anywhere else
        setTimeout(() => {
            $(document).one("click", closeContextMenu);
            if (event.event) event.event.stopPropagation()
        }, (10));
    }

    function closeContextMenu(event) {
        // TODO Don't close if clicked on context menu itself
        if ($('#contextMenu--select-container').css("display") === "block") {
            $('#contextMenu--select-container').css("display", "none");
        }
    }

    function recruitNewAdventurer(event) {
        if (!gameData) {
            return;
        }
        // Open UI
        let recruitDialogConfig = {
            autoOpen: true,
            show: {
                effect: "fade",
                duration: 500
            },
            hide: {
                effect: "fade",
                duration: 250
            },
            resizable: true,
            height: "auto",
            width: 400,
            modal: false,
            title: "Recruitment Menu",
            buttons: {
                // Show list of available server-generated adventurers + remote players?
                "Show List": function () {
                    let newUniqueId = THREE.MathUtils.generateUUID();
                    let dataBundle = {
                        uniquePlayerId: myUniquePlayerId,
                        metaData: {
                            timeStamp: Date.now()
                        }
                    };
                    // Get last updated list of adventurers
                    for (let i = 0; i < gameData.labourResources.length; i++) {
                        let newLi = $("<li>");
                        $(newLi).addClass("brokerage-li");
                        $(newLi).attr('id', newUniqueId);
                        $(newLi).html(gameData.labourResources[i].name);
                        // console.log(dataBundle);
                        $(newLi).on("click", {
                            event: null,
                            contextMenu: this,
                            scene: scene,
                            item: dataBundle
                        }, popContextMenuDOM);
                        $('#ops--recruitment-menu-container').append(newLi);
                    }
                    // socket.emit('onRecruitAdventurer', dataBundle);
                    // $(this).dialog("close");
                    // $('#inventory-contextMenu--select-container').dialog("close");
                },
                Cancel: function () {
                    $(this).dialog("close");
                }
            }
        };

        $('#ops--recruitment-menu-container').dialog(recruitDialogConfig);
    }

    function gatherResource(event) {
        if (!gameData) {
            console.error("ERROR: no game data");
            return;
        }
        // Tutorial
        if (!progression.tutorials.inventoryActions) {
            // Pop-up tutorial
            $('#tutorial--container').html("");
            let p = $("<p>");
            let tutorialText = "Well done! You have a great talent inside. Now that you have a resource, left click on it in the inventory to open the inventory context menu.";
            p.append(tutorialText);
            $('#tutorial--container').html(tutorialText);
            $('#tutorial--container').dialog({
                position: {
                    my: "center top",
                    at: "center top",
                    of: window
                }
            });
            progression.tutorials.inventoryActions = true;
        }
        console.log('collecting a resource');
        // Check inventory space left
        if (inventory.length > inventoryMaxSize) {
            // Instanciate in front of the model?
            $('.explorable-text-view--update').append('<h4><em>Inventory is full.</em></h4>');
            return;
        }
        let resource;
        let dataBundle;
        console.log(objectTagResourceProperty);
        for (let i = 0; i < gameData['rawResources'].length; i++) {
            // TODO optimize this later
            if (gameData['rawResources'][i]['name'] === objectTagResourceProperty) {
                // Add to this player's inventory // Add a unique hash (SHA256) for this item instance
                // TODO add player's own unique hashed ID from database (owner)
                // let randomString = Math.random().toString(36).replace(/[^a-z]+/g, '');
                resource = {
                    item: gameData['rawResources'][i],
                    uniqueId: THREE.MathUtils.generateUUID(),
                    // uniqueId: new Hashes.SHA256().hex(randomString),
                    qty: 1
                };
                let metaData = {
                    sellerId: myUniquePlayerId,
                    timeStamp: Date.now() // ms
                };
                dataBundle = {
                    name: gameData['rawResources'][i]['name'],
                    info: resource,
                    metaData: metaData
                };
                inventory.push(dataBundle);
            }
        }
        console.log('Added a new resource to inventory.');
        // Update view
        // sound:
        let soundFX = null;
        switch (objectTag) {
            case 'tree':
                soundFX = $('#getWoodSoundFX')[0];
                break;
            default:
                break;
        }
        if (soundFX && !soundFX.isPlaying) {
            soundFX.play();
        }
        // inventory view: // each item img/icon/text will have a unique id from 1 to maxsize (24)
        // With an event listener on click to open a context menu / send to brokerage
        console.log('Item with unique id: ' + resource.uniqueId);
        let newLi = $("<li>");
        $(newLi).addClass("brokerage-li");
        $(newLi).attr('id', resource.uniqueId);
        $(newLi).html(objectTagResourceProperty + " x1");
        $('#inventory').append(newLi);
        // Destroy the resource from the game world!
        objToDeleteUUID = selectedObjUUID;
        destroyResource(objToDeleteUUID);
        socket.emit('emitCollectedSRIResource', selectedObjUUID);
        // Add eventlistener for the INVENTORY + BROKERAGE
        const contextMenu = $('#inventory-contextMenu--select-container');
        $('#' + resource.uniqueId).on("click", {
            event: event,
            contextMenu: contextMenu,
            scene: scene,
            item: dataBundle
        }, popContextMenuDOM);
    }

    function setupPlayer() {
        // 3D view -- Three.js complete setup
        console.log("client js loaded");
        init();
        // Draggable and resizable UI -- break the frame!
        $(".inventory-view-container").resizable({
            start: function (event, ui) {
                ui.element.draggable("disable");
            },
            stop: function (event, ui) {
                ui.element.draggable("enable");
            },
            handles: "n, e, s, w"
        });
        $(".brokerage-view-container").resizable({
            start: function (event, ui) {
                ui.element.draggable("disable");
            },
            stop: function (event, ui) {
                ui.element.draggable("enable");
            },
            handles: "n, e, s, w"
        });
        $(".explorable-text-view").resizable({
            start: function (event, ui) {
                ui.element.draggable("disable");
            },
            stop: function (event, ui) {
                ui.element.draggable("enable");
            },
            handles: "n, e, s, w"
        });
        $(".chat-view-container").resizable({
            start: function (event, ui) {
                ui.element.draggable("disable");
            },
            stop: function (event, ui) {
                ui.element.draggable("enable");
            },
            handles: "n, e, s, w"
        });
        $(".inventory-view-container").draggable();
        $(".brokerage-view-container").draggable();
        $(".chat-view-container").draggable();
        $(".explorable-text-view").draggable();

        function init() {
            scene = new THREE.Scene();
            scene.background = new THREE.Color(backgroundColor);

            // Override for logger
            scene.toString = function sceneToString() {
                let ret;
                for (let i = 0; i < this.children.length; i++) {
                    ret = 'UUID: ' + this.children[i].uuid;
                }
                return ret;
            }

            // Init the renderer
            renderer = new THREE.WebGLRenderer({
                canvas,
                antialias: true
            });
            renderer.physicallyCorrectLights = true; // Physical lights switch
            renderer.shadowMap.enabled = true;
            renderer.gammaOutput = true;
            renderer.gammaFactor = 2.2;
            renderer.setPixelRatio(window.devicePixelRatio);
            // canvasContainer.appendChild(renderer.domElement);

            camera = new THREE.PerspectiveCamera(
                50,
                window.innerWidth / window.innerHeight,
                0.1,
                500
            );
            camera.position.z = 91;
            camera.position.x = 89;
            camera.position.y = 142;

            // Camera helper
            // const helper = new THREE.CameraHelper(camera);
            // scene.add(helper);

            // Axes helper
            // const axesHelper = new THREE.AxesHelper( 50 );
            // scene.add( axesHelper );

            // Add lights
            let hemiLight = new THREE.HemisphereLight(0xFF9C4C, 0xFF9C4C, 0.005);
            hemiLight.position.set(0, 50, 0);
            hemiLight.power = 5000;
            hemiLight.decay = 2;
            hemiLight.distance = 1000;

            // Add hemisphere light to scene
            scene.add(hemiLight);

            // Fog
            scene.fog = new THREE.FogExp2(0x25388a, 0.00040);

            let d = 8.25;
            let dirLight = new THREE.DirectionalLight(0x25388a, 0.001);
            dirLight.position.set(0, 20, 0);
            dirLight.castShadow = true;
            dirLight.shadow.mapSize = new THREE.Vector2(2048, 2048);
            dirLight.shadow.mapSize.width = 1024;
            dirLight.shadow.mapSize.height = 1024;
            dirLight.shadow.camera.near = 0.5;
            dirLight.shadow.camera.far = 800;
            dirLight.shadow.camera.left = d * -1;
            dirLight.shadow.camera.right = d;
            dirLight.shadow.camera.top = d;
            dirLight.shadow.camera.bottom = d * -1;
            // Add directional Light to scene
            scene.add(dirLight);

            // const helper = new THREE.DirectionalLightHelper( dirLight, 5 );
            // scene.add( helper );

            let ambientLight = new THREE.AmbientLight(0xd6701c, 0.025);
            ambientLight.position.set(0, 0, 0);
            scene.add(ambientLight);

            const controls = new THREE.OrbitControls(camera, canvas);
            controls.target.set(0, 5, 0);
            controls.minPolarAngle = -45;
            controls.maxPolarAngle = Math.PI / 2; // Cannot rotate below pi/2 rad
            controls.enableDamping = true;
            controls.dampingFactor = 0.25;
            controls.minDistance = 50;
            controls.maxDistance = 200;
            // controls.minAzimuthAngle = -1 * 2 * Math.PI; // radians
            // controls.maxAzimuthAngle = 2 * Math.PI; // radians
            controls.enablePan = true;
            controls.enableZoom = true;
            controls.update();


            var pmremGenerator = new THREE.PMREMGenerator(renderer);
            pmremGenerator.compileEquirectangularShader();

            // Model loaders
            let terrain = new THREE.GLTFLoader();
            let playerCart = new THREE.GLTFLoader();
            let fireplaceLoader = new THREE.GLTFLoader();
            let adventurerRecruitingTable = new THREE.GLTFLoader();
            let manufacturingTable = new THREE.GLTFLoader();
            let courrierOps = new THREE.GLTFLoader();
            let flareflag = new THREE.GLTFLoader();

            function interactibleGLTFAssetLoader(loader, path, model) {
                loader.load(path, function (gltf) {
                    model = gltf.scene;
                    model.scale.set(1, 1, 1);
                    model.castShadow = true;
                    scene.add(model);
                });
            }
            // Terrain
            terrain.load(MODEL_PATH, function (gltf) {
                terrainModel = gltf.scene;
                terrainModel.scale.set(1, 1, 1);
                terrainModel.position.set(0, 0, 0);
                terrainModel.receiveShadow = true;
                terrainModel.traverse((o) => {
                    if (o.isMesh) {
                        o.material.metalness = 0;
                        o.material.roughness = 100;
                    }
                });
                scene.add(terrainModel);

                // Player cart
                playerCart.load(PLAYER_PATH, function (gltf) {

                    playerModel = gltf.scene;
                    playerModel.scale.set(5, 5, 5);
                    playerModel.position.set(0, averageGroundHeight, 0);
                    playerModel.castShadow = true;
                    playerModel.traverse((o) => {
                        if (o.isMesh) {
                            o.material.metalness = 0;
                            o.material.roughness = 100;
                        }
                    });
                    scene.add(playerModel);

                    //  INTERACTIBLES
                    // Adventurer Recruiting Table
                    adventurerRecruitingTable.load(ADVENTURER_RECRUITING_TABLE_PATH, function (gltf) {
                        adventurerRecruitingTableModel = gltf.scene;
                        adventurerRecruitingTableModel.scale.set(1, 1, 1);
                        adventurerRecruitingTableModel.castShadow = true;
                        scene.add(adventurerRecruitingTableModel);
                    });
                    // Manufacturing Table
                    manufacturingTable.load(MANUFACTURING_TABLE_PATH, function (gltf) {
                        manufacturingTableModel = gltf.scene;
                        manufacturingTableModel.scale.set(1, 1, 1);
                        manufacturingTableModel.castShadow = true;
                        scene.add(manufacturingTableModel);
                    });
                    // Courrier OPS
                    courrierOps.load(COURRIER_OPS_PATH, function (gltf) {
                        courrierOpsModel = gltf.scene;
                        courrierOpsModel.scale.set(1, 1, 1);
                        courrierOpsModel.castShadow = true;
                        scene.add(courrierOpsModel);
                    });
                    // Flareflag
                    flareflag.load(FLAREFLAG_PATH, function (gltf) {
                        flareflagModel = gltf.scene;
                        flareflagModel.scale.set(1, 1, 1);
                        flareflagModel.castShadow = true;
                        scene.add(flareflagModel);
                    });
                    // Fireplace
                    fireplaceLoader.load(FIREPLACE_PATH, function (gltf) {
                        fireplaceModel = gltf.scene;
                        fireplaceModel.scale.set(1, 1, 1);
                        fireplaceModel.position.set(0, averageGroundHeight, 0);
                        fireplaceModel.castShadow = true;
                        scene.add(fireplaceModel);
                        // Add lantern light to player's cart 
                        // Light as a mechanic
                        lanternLight = new THREE.PointLight(0xFFFFFF, 0.5);
                        lanternLight.power = 499; // Temporary default value. After tutorial, this is set to 2000
                        lanternLight.decay = 1.5;
                        lanternLight.distance = 150;
                        lanternLight.scale.set(1, 1, 1);
                        lanternLight.position.set(15, 3, 44);
                        lanternLight.castShadow = true;
                        scene.add(lanternLight);
                        lanternLight.parent = fireplaceModel;

                        // Create the player
                        player = new Player(lanternLight);

                        // TODO terrain raycaster
                        terrainRaycaster = new THREE.Raycaster();
                        terrainRaycaster.set(playerModel.position, new THREE.Vector3(0, -1, 0));

                        // Camera follow setup
                        relCameraPos = camera.position.sub(playerModel.position);
                        relCameraPosMag = camera.position.distanceTo(playerModel.position) - 0.5;
                        // Everything has been loaded at this point
                        // Add scene meshes to raycasting cache
                        scene.traverse(function (child) {
                            if (child instanceof THREE.Mesh) {
                                pickHelperGameModels.push(child);
                            }
                        });
                        pickHelper.setGameModels(pickHelperGameModels);
                        // SERVER CODE
                        //
                        // Client-side network controller
                        // Each client has their own socket, which the server can listen to
                        socket = io(); // client connection socket
                        //const randomString = Math.random().toString(36).replace(/[^a-z]+/g, ''); // Used for generating uniquePlayerId
                        // myUniquePlayerId = new Hashes.SHA256().hex(randomString); // uniquePlayerId used to let the server and other players know who this unique entity is
                        myUniquePlayerId = THREE.MathUtils.generateUUID();
                        const loadConfig = {
                            scale: 5,
                            uniquePlayerId: null,
                            playerModel: null,
                            position: null
                        }; // Model loader config 
                        // Confirm before leaving page
                        // $(window).bind("beforeunload", function (e) {
                        //     return "Do you really want to leave the game?";
                        // })
                        // Disconnect event
                        socket.on('disconnect', function () {
                            otherConnectedPlayers = [];
                        });
                        socket.on('connect', function (data) {
                            // Join and send the playerModel for others to see
                            // PASS THE UNIQUE ID TOO
                            socket.emit('join', {
                                playerModel: playerModel,
                                position: playerModel.position,
                                uniquePlayerId: myUniquePlayerId
                            });

                            // Initial handshake => Backwards update for older avatars that were already instantiated
                            socket.on('joinedClientId', function (data) {
                                // cache id
                                socketId = data.clientId;
                                // Cache the game data
                                gameData = data.gameData;
                                // Init inventory (from database)
                                // initInventory();            
                                // Send older avatars
                                // If the ids are differnt than this client id, load their model and last position
                                for (let i = 0; i < data.olderAvatars.length; i++) {
                                    if (data.olderAvatars[i].data.uniquePlayerId !== myUniquePlayerId) { // load
                                        loadConfig.uniquePlayerId = data.olderAvatars[i].data.uniquePlayerId;
                                        loadConfig.playerModel = data.olderAvatars[i].data.playerModel;
                                        loadConfig.position = data.olderAvatars[i].data.position;
                                        loadNewAvatar(PLAYER_PATH, loadConfig);
                                    }
                                }
                                // Create current brokerage
                                // Refresh view
                                // Cache brokerage
                                $('#brokerage-list').html('');
                                brokerage = new Map(JSON.parse(gameData.brokerage));
                                let content, newLi;
                                brokerage.forEach((item, info) => {
                                    content = info + " : qty: x" + item.totalQty + " : value: " + item.value + " gold";
                                    newLi = $('<li>');
                                    updateBrokerageView(item, info, newLi);
                                    $('#brokerage-list').append($(newLi).text(content));
                                });
                                // Create current active SRI                            
                                let loader = new THREE.GLTFLoader();
                                let resourceScene;
                                loadNewResource(loader, resourceScene, TREE_PATH, data.activeSRI);
                                // Check progression for tutorial status
                                if (!progression.tutorials.resourceCollectionActions) {
                                    // Pop-up tutorial
                                    $('#tutorial--container').html("");
                                    let p = $("<p>");
                                    let tutorialText = "<em>Welcome to the Lounge, <strong>brave Guild Master</strong>.<br><br>\"What? Who am I, you ask?<br><br>...They call me 'Old Man' around here, probably because I'm old. Very old. Just call me what you want, okay? Now, let's get started.\"</em><br><br>Use the left mouse button to move the character around. Hold the mouse button to rotate the camera. Use the wheel to zoom. Play with these controls for a while, just have fun if that's possible.<br><br>\"<em>Done already? Now, go find yourself a tree and left click on it to open the action context menu.<br><br>Once you have clicked a tree, or any resource for the matter, a context menu will appear. Remember that, adventurer.\"</em><br><br><strong>Find a tree</strong>, and choose <strong>'Collect'</strong> to continue.";
                                    p.append(tutorialText);
                                    $('#tutorial--container').html(tutorialText);
                                    $('#tutorial--container').dialog({
                                        position: {
                                            my: "center top",
                                            at: "center top",
                                            of: window
                                        }
                                    });
                                    progression.tutorials.resourceCollectionActions = true;
                                }
                            });
                            //load others avatar
                            socket.on('newAvatarInWorld', function (avatar) {
                                const parsedAvatar = JSON.parse(avatar.data);
                                // update load config
                                loadConfig.uniquePlayerId = parsedAvatar.uniquePlayerId;
                                loadConfig.playerModel = parsedAvatar.playerModel;
                                loadConfig.position = parsedAvatar.position;
                                // Clone the avatar first in an instance of THREE.Object3D
                                loadNewAvatar(PLAYER_PATH, loadConfig);
                                // Alert the others
                                socket.emit('chat message', "A new player entered the game.");
                            });
                            // Update connected avatars on request
                            socket.on('updatedConnectedAvatars', function (data) {
                                // Search for any differences 
                                // in the currently active scene models
                                let uuidToDelete = data.disconnectedPlayerId;
                                for (let i = 0; i < otherConnectedPlayers.length; i++) {
                                    if (otherConnectedPlayers[i].uniquePlayerId === uuidToDelete) {
                                        // console.log(otherConnectedPlayers[i].gltfRef.uuid);
                                        // console.log("DELETING DISCONNECTED PLAYER");
                                        for (let j = 0; j < scene.children.length; j++) {
                                            // console.log("UUID " + scene.children[j].uuid);
                                            if (scene.children[j].uuid === otherConnectedPlayers[i].gltfRef.uuid) {
                                                let meshes = scene.children[j].children[0].children;
                                                console.log(meshes);
                                                for (let k = 0; k < meshes.length; k++) {
                                                    meshes[k].geometry.dispose();
                                                    meshes[k].material.dispose();
                                                    scene.remove(meshes[k].parent.parent); // Mesh -> Group -> glTF scene object
                                                    renderer.dispose();
                                                }
                                            }
                                        }
                                        otherConnectedPlayers.splice(i, 1);
                                    }
                                }
                            });
                            socket.on('emitToOtherPlayersChangedWorldPosition', function (data) {
                                if (otherConnectedPlayers.length <= 0) {
                                    return;
                                }
                                // Update other players if there are any
                                // Search the model associated with that player ID
                                for (let i = 0; i < otherConnectedPlayers.length; i++) {
                                    if (otherConnectedPlayers[i].uniquePlayerId === data.myUniquePlayerId) {
                                        // Append update new movementData packet, render() will handle the rest?
                                        otherConnectedPlayers[i].movementData = data;
                                    }
                                }
                                // Update all players' position
                                for (let i = 0; i < otherConnectedPlayers.length; i++) {
                                    let otherCurrentPos = new THREE.Vector3(otherConnectedPlayers[i].movementData.positionGoalProgress.x, otherConnectedPlayers[i].movementData.positionGoalProgress.y, otherConnectedPlayers[i].movementData.positionGoalProgress.z);
                                    let otherGoalPos = new THREE.Vector3(otherConnectedPlayers[i].movementData.desiredPositionGoal.x, otherConnectedPlayers[i].movementData.desiredPositionGoal.y, otherConnectedPlayers[i].movementData.desiredPositionGoal.z);
                                    // Lerp towards the goal 
                                    otherCurrentPos.lerp(otherGoalPos, 0.1);
                                    // Update the model
                                    let otherPlayerModel = otherConnectedPlayers[i].gltfRef;
                                    // console.log(otherPlayerModel);
                                    otherPlayerModel.position.set(otherCurrentPos.x, averageGroundHeight, otherCurrentPos.z);
                                    playSound("#otherPlayerMove");
                                }
                            });
                            // Error handling
                            socket.on('connect_error', (error) => {
                                console.log("connectionError");
                                // TODO					
                            });
                            // When browser launches, fetch any room ids from host
                            socket.emit("fetchGameId");
                            // on new game created
                            socket.on('fetchGameIdResponse', function (data) {
                                console.log("Game room: " + data);
                            });
                            // GAME 
                            //
                            // DATA
                            socket.on('getGameData', function (data) {

                            });
                            socket.on('onRefreshBrokerage', function (updatedBrokerage) {
                                // Recreate a map for the brokerage
                                brokerage = new Map(JSON.parse(updatedBrokerage));
                                // Refresh view
                                $('#brokerage-list').html('');
                                let content, newLi;
                                brokerage.forEach((item, info) => {
                                    content = info + " : qty: x" + item.totalQty + " : value: " + item.value + " gold";
                                    newLi = $('<li>');
                                    updateBrokerageView(item, info, newLi);
                                    $('#brokerage-list').append($(newLi).text(content));
                                });
                            });

                            function updateBrokerageView(item, info, component) {
                                let dialogConfig;
                                $(component).addClass("brokerage-li");
                                // Add greyed out look if no seller 
                                if (item.sellerIds.length <= 0) {
                                    $(component).addClass("brokerage--empty-listing");
                                } else {
                                    $(component).addClass("brokerage--with-listing");
                                }
                                $(component).on('click', function () {
                                    $('#inventory-contextMenu--select-container').html("");
                                    let confirmDialogConfig = {
                                        autoOpen: true,
                                        show: {
                                            effect: "fade",
                                            duration: 500
                                        },
                                        hide: {
                                            effect: "fade",
                                            duration: 250
                                        },
                                        resizable: true,
                                        height: "auto",
                                        width: 400,
                                        modal: false,
                                        title: "Confirm Purchase?",
                                        buttons: {
                                            "Confirm": function () {
                                                // Check fireplace strength to see if can buy
                                                if(!checkFireplacePower()) {
                                                    return;
                                                }
                                                let newUniqueId = THREE.MathUtils.generateUUID();
                                                let dataBundle = {
                                                    uniquePlayerId: myUniquePlayerId,
                                                    name: info,
                                                    info: {
                                                        item: item,
                                                        uniqueId: newUniqueId,
                                                        qty: 1
                                                    },
                                                    metaData: {
                                                        sellerId: $(this).data('sellerId'),
                                                        timeStamp: Date.now()
                                                    }
                                                };
                                                socket.emit('onBuyItem', dataBundle);
                                                // Get item
                                                console.log(item);
                                                console.log(info);
                                                let newLi = $("<li>");
                                                $(newLi).addClass("brokerage-li");
                                                $(newLi).attr('id', newUniqueId);
                                                $(newLi).html(info + " x1");
                                                console.log(dataBundle);
                                                $(newLi).on("click", {
                                                    event: null,
                                                    contextMenu: this,
                                                    scene: scene,
                                                    item: dataBundle
                                                }, popContextMenuDOM);
                                                $('#inventory').append(newLi);
                                                $(this).dialog("close");
                                                $('#inventory-contextMenu--select-container').dialog("close");
                                            },
                                            Cancel: function () {
                                                $(this).dialog("close");
                                            }
                                        }
                                    };
                                    let dialogConfig = {
                                        autoOpen: false,
                                        show: {
                                            effect: "fade",
                                            duration: 500
                                        },
                                        hide: {
                                            effect: "fade",
                                            duration: 250
                                        },
                                        resizable: true,
                                        height: "auto",
                                        width: 700,
                                        modal: false,
                                        title: info,
                                        buttons: {
                                            "Show sellers": function () {
                                                $('#inventory-contextMenu--select-container').html("");
                                                // TODO make this from Narrative in the item data
                                                if (!progression.tutorials.brokerageActions3) {
                                                    // Pop-up tutorial
                                                    $('#tutorial--container').html("");
                                                    let p = $("<p>");
                                                    let tutorialText = "I bet you're confused right now. It's not so bad: This menu will show you the current value of the item, its rarity, what people generally use it for, and most importantly, it will show you a list of sellers who might sell you the item. <strong>Click on any seller in the list and choose to purchase one wood </strong> to continue.";
                                                    p.append(tutorialText);
                                                    $('#tutorial--container').html(tutorialText);
                                                    $('#tutorial--container').dialog({
                                                        position: {
                                                            my: "center top",
                                                            at: "center top",
                                                            of: window
                                                        }
                                                    });
                                                    progression.tutorials.brokerageActions3 = true;
                                                }

                                                let header = "Resource: " + info + "<br>" + "Value (AI Stock Value): " + item.value + " gold" + "<br>" + "Current Rarity: <span style=\"color: gold;\">Precious</span>" + "<br>" + "Used For: <em>\"You can't eat it, but maybe it can spark a nice fire. God only knows what awaits us in the dark.\"- The Friendly Anonymous Explorer</em>" + "<br>" + "<h1>Sellers:</h1><br>";
                                                let ul = $("<ul>");
                                                $('#inventory-contextMenu--select-container').append(header);
                                                for (let i = 0; i < item.sellerIds.length; i++) {
                                                    if (item.sellerIds[i] === undefined) continue;
                                                    let li = $("<li>");
                                                    $(li).on("click", function () {
                                                        // Emit on buy request to server
                                                        $('#inventory-contextMenu--buy-container').html("You are about to purchase an item from another player.");
                                                        $('#inventory-contextMenu--buy-container').data("sellerId", item.sellerIds[i]).dialog(confirmDialogConfig);
                                                    });
                                                    $(li).html("Seller: " + item.sellerIds[i] + "<br>");
                                                    $(ul).append(li);
                                                }
                                                $('#inventory-contextMenu--select-container').append(ul);
                                            },
                                            Cancel: function () {
                                                $(this).dialog("close");
                                            }
                                        }
                                    } // Dialog config
                                    $('#inventory-contextMenu--select-container').dialog(dialogConfig);
                                    $('#inventory-contextMenu--select-container').dialog("open");
                                }); // on click
                                return dialogConfig;
                            }
                            socket.on('onBuyItem', function () {

                            });
                            socket.on('onSellItem', function () {
                                // Emit sale
                                // First validate if qty provided to sell matches actual inventory qty of that item

                                // Also must emit requestRefreshBrokerage event after sale is complete
                            });
                            socket.on('onBuildItem', function () {

                            });
                            socket.on('chat message', function (msg) {
                                $('#messages').append($('<li>').text(msg));
                            });
                            socket.on('newCycleBegin', function (data) {
                                console.log("A new cycle of natural resources has begun.");
                                console.log(data.resources.length + " rare resources have spawned in the world.");
                                $('#messages').append($('<li>').text(data.message));
                                // Instantiate them in the world
                                let loader = new THREE.GLTFLoader();
                                let resourceScene;
                                //let PATH;
                                loadNewResource(loader, resourceScene, TREE_PATH, data.resources);
                            });
                            socket.on('onPlayerDestroyedAResource', function (data) {
                                // Renew active SRI
                                activeSRIs = data.activeSRI;
                                // Destroy the activeSRI with the uuid
                                destroyMeshByUUID(data.uuidDelete);
                            });
                        }); // On connect
                        $('form').submit(function () {
                            socket.emit('chat message', $('#chat-view-inputfield').val());
                            $('#chat-view-inputfield').val('');
                            return false;
                        });
                        // Events
                        // Attach a once event on the action 
                        $('#contextMenu--select-collect').on("click", function (event) {
                            gatherResource();
                        });
                        $('#contextMenu--select-recruit').on("click", function (event) {
                            recruitNewAdventurer();
                        });
                        $('#ui-button-inventory').on('click', function (event) {
                            $('.inventory-view-container').fadeToggle(300);
                        });
                        $('#ui-button-manufacture-list').on('click', function (event) {
                            // Prepare the ui
                            $('.ui-manufacture-panel').html("");
                            let header = "<h2>Current production: </h2>";
                            let ul = $("<ul>");
                            $('.ui-manufacture-panel').append(header);
                            for (let i = 0; i < manufacturingQueue.length; i++) {
                                let li = $("<li>");
                                $(li).on("click", function () {
                                    // More details about the production

                                });
                                $(li).html("<h4>Produce: " + "<h5>" + manufacturingQueue[i].produce + "</h5>" + "<h4>" + "Progress (%): " + "</h4>" + "<h5>" + manufacturingQueue[i].progress + "</h5>");
                                $(ul).append(li);
                            }
                            $('.ui-manufacture-panel').append(ul);
                            let dialogOptions = {
                                title: "Solar Manufacturing Queue",
                                autoOpen: true,
                                show: {
                                    effect: "fade",
                                    duration: 250
                                },
                                hide: {
                                    effect: "fade",
                                    duration: 250
                                },
                                resizable: false,
                                height: 800,
                                width: 800,
                                modal: false,
                                buttons: {
                                    Refresh: function () {
                                        $(this).dialog("close");
                                    },
                                    Cancel: function () {
                                        $(this).dialog("close");
                                    }
                                }
                            }
                            $('.ui-manufacture-panel').dialog(dialogOptions);
                        });
                        update();
                    }); // fireplace.load
                }); // player.load                
            }); // terrain.load
        } // init
    } // Setup player

    // factory for resources
    function loadNewResource(loader, resourceScene, PATH, loadConfig) {
        console.log(loadConfig);
        for (let i = 0; i < loadConfig.length; i++) {
            let newResource = loadConfig[i];
            loader.load(PATH, function (gltf) {
                resourceScene = gltf.scene;
                resourceScene.scale.set(newResource.scale, newResource.scale, newResource.scale);
                resourceScene.position.set(newResource.position.x, newResource.position.y, newResource.position.z);
                resourceScene.castShadow = true;
                resourceScene.traverse((o) => {
                    if (o.isMesh) {
                        o.material.metalness = 0;
                        o.material.roughness = 100;
                    }
                });
                // Override the uuid with the server's
                // console.log("old resource UUID : " + resourceScene.uuid);
                resourceScene.uuid = newResource.uuid;
                // console.log("new resource UUID : " + resourceScene.uuid);
                // Cache that avatar for later use
                let resourceBundle = {
                    type: resourceScene.name,
                    gltfRef: resourceScene,
                    uuid: newResource.uuid,
                    position: newResource.position
                };
                activeSRIs.push(resourceBundle);
                // For raycasting, we need their meshes in the gameModels array
                for (let i = 0; i < resourceScene.children[0].children.length; i++) {
                    pickHelper.getGameModels().push(resourceScene.children[0].children[i]); // the mesh
                }
                scene.add(resourceScene);
                // console.log(scene.children);
                // console.log(activeSRIs[0].uuid);
            });
        }
    }
    // Factory for new avatar models
    function loadNewAvatar(PATH, loadConfig) {
        let newAvatar = new THREE.GLTFLoader();
        let newAvatarMesh;
        newAvatar.load(PATH, function (gltf) {
            newAvatarMesh = gltf.scene;
            newAvatarMesh.scale.set(loadConfig.scale, loadConfig.scale, loadConfig.scale);
            newAvatarMesh.position.set(loadConfig.position.x, loadConfig.position.y, loadConfig.position.z);
            newAvatarMesh.castShadow = true;
            // Cache that avatar for later use
            let avatarBundle = {
                gltfRef: newAvatarMesh,
                uniquePlayerId: loadConfig.uniquePlayerId,
                playerModel: loadConfig.playerModel,
                position: loadConfig.position,
                movementData: {
                    desiredPositionGoal: loadConfig.position, // Both the dseired goal and progress are init at current world position
                    positionGoalProgress: loadConfig.position
                } // Object type; the constantly updated data Packet
            };
            // console.log(avatarBundle.gltfRef);
            otherConnectedPlayers.push(avatarBundle);
            scene.add(newAvatarMesh);
        });
    }

    function update() {
        resizeRendererToDisplaySize(renderer);
        render();
        //console.log("x : " + camera.position.x + " y: " + camera.position.y + "z : " + camera.position.z);
        requestAnimationFrame(update);
    } //update

    function render() {
        // TODO run this animation code for all connected Avatars
        // Update this player
        if (playerModel && positionGoalProgress && currentWorldPosition) {
            // Camera follow target
            // Lerp towards the goal 
            positionGoalProgress.lerp(desiredPositionGoal, 0.1);
            // Update current world position
            currentWorldPosition.x = positionGoalProgress.x;
            currentWorldPosition.z = positionGoalProgress.z;
            // Update the model
            playerModel.position.set(currentWorldPosition.x, averageGroundHeight, currentWorldPosition.z);
            // camera.position.lerp(newPos, smooth * delta);
            camera.lookAt(positionGoalProgress);
        }
        // Update light values
        delta = clock.getDelta();
        player.updatePlayerLanternLightValues(delta);
        //smoothLookAt(playerModel);
        // }
        // Update other players' position
        // TODO update otherConnectedPlayers on socket.on('disconnect') to delete their data 
        renderer.render(scene, camera);
    } // render

    function destroyResource(uuidToDelete) {
        // console.log("ALL ACTIVE SRIS" + activeSRIs);
        for (let i = 0; i < activeSRIs.length; i++) {
            // console.log("this uuid: " + activeSRIs[i].uuid);
            // console.log("target: " + uuidToDelete);
            if (activeSRIs[i].uuid === uuidToDelete) {
                destroyMeshByUUID(uuidToDelete);
                activeSRIs.splice(i, 1);
                updateGameModelsCache(uuidToDelete);
                // Emit to others that YOU destroyed that resource
                socket.emit("onResourceDestroyed", uuidToDelete);
            }
        }
    }

    function updateGameModelsCache(uuidToDelete) {
        let closedGameModels = pickHelper.getGameModels();
        for (let _i = 0; _i < closedGameModels.length; _i++) {
            if (closedGameModels[_i].parent.parent.uuid === uuidToDelete) {
                let newGameModels = closedGameModels.filter(function (currentValue, index, arr) {
                    return (arr[index].parent.parent.uuid !== uuidToDelete);
                });
                pickHelper.setGameModels(newGameModels);
            }
        }
    }

    function destroyMeshByUUID(uuidToDelete) {
        // Update global with the networked uuid to delete 
        objToDeleteUUID = uuidToDelete;
        for (let j = 0; j < scene.children.length; j++) {
            if (scene.children[j].uuid === uuidToDelete) {
                let meshes = scene.children[j].children[0].children;
                // console.log(meshes);
                for (let k = 0; k < meshes.length; k++) {
                    meshes[k].geometry.dispose();
                    meshes[k].material.dispose();
                    scene.remove(meshes[k].parent.parent); // Mesh -> Group -> glTF scene object
                    renderer.dispose();
                }
            }
        }
        // update gameModels cache too
        updateGameModelsCache(uuidToDelete);
    }

    function viewingPosCheck(checkPos, playerPosition) {
        console.log(checkPos);
        console.log(playerPosition);
        let raycaster = new THREE.Raycaster();
        let dir = new THREE.Vector3().copy(playerPosition.sub(checkPos));
        console.log(dir);
        //console.log(dir.x + " " + dir.y + " " + dir.z);
        raycaster.set(checkPos, dir);
        // get the list of objects the ray intersected
        let hits = raycaster.intersectObjects(pickHelper.getGameModels());
        //console.log(hits);
        if (hits.length > 0) {
            // pick the first object. It's the closest one
            console.log(hits[0].distance);
            console.log(hits[0].object.name);
            if (hits[0].object.uuid !== playerModel.uuid) {
                return false;
            }
        }
        // If we haven't hit anything or we've hit the player, this is an appropriate position.
        newPos = checkPos;
        return true;
    }

    function createBonfire() {
        let bonfireModel;
        let bonfire = new THREE.GLTFLoader();
        console.log("Creating campfire");
        bonfire.load(BONFIRE_PATH, function (gltf) {
            bonfireModel = gltf.scene;
            bonfireModel.scale.set(50, 50, 50);
            bonfireModel.position.set(playerModel.x, 5, playerModel.z);
            bonfireModel.receiveShadow = false;
            bonfireModel.traverse((o) => {
                if (o.isMesh) {
                    o.material.metalness = 0;
                    o.material.roughness = 0;
                    pickHelperGameModels.push(o);
                    pickHelper.addToGameModels(o);
                }
            });
            bonfireModel.uuid = THREE.MathUtils.generateUUID();
            let bonfireBundle = {
                type: bonfireModel.name,
                gltfRef: bonfireModel,
                uuid: bonfireModel.uuid,
                position: bonfireModel.position
            };
            scene.add(bonfireModel);
            let bonfireLight = new THREE.PointLight(0xFFFFFF, 30);
            bonfireLight.power = 5000;
            bonfireLight.decay = 2;
            bonfireLight.distance = 1000;
            bonfireLight.scale.set(50, 50, 50);
            bonfireLight.position.set(playerModel.x, 5, playerModel.z);
            bonfireLight.castShadow = false;
            scene.add(bonfireLight);
        });
    }

    function checkFireplacePower() {
        const NETWORK_INTERACTION_MIN_THRESHOLD = 500;
        console.log("CHECK BUY VAL" + player.getLanternLightPower());
        if(player.getLanternLightPower() < NETWORK_INTERACTION_MIN_THRESHOLD) {
            $('#warning--container').dialog();
            return false;
        } 
        return true;
    }

    function smoothLookAt(playerModel) {
        // Create a vector from the camera towards the player.
        let relPlayerPosition = playerModel.position.sub(camera.position);
        //console.log(relPlayerPosition);
        // Create a rotation based on the relative position of the player being the forward vector.
        let lookAtRotation = new THREE.Quaternion();
        // Cos(theta/2)^2 + ((ax)^2 + (ay)^2 + (az)^2) * sin(theta/2)^2 = 1
        // rotation about the relPlayer * up vector 
        lookAtRotation.setFromUnitVectors(relPlayerPosition, new THREE.Vector3(0, 1, 0)).normalize();
        // Lerp the camera's rotation between it's current rotation and the rotation that looks at the player.
        //camera.quaternion.slerp(lookAtRotation, smooth * 0.001);
        camera.applyQuaternion(lookAtRotation);
    }

    function getCanvasRelativePosition(event) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: (event.clientX - rect.left) * canvas.width / rect.width,
            y: (event.clientY - rect.top) * canvas.height / rect.height,
        };
    }

    // Normalized 2D mouse coordinates to world space coordinates
    function setPickPosition(event) {
        const pos = getCanvasRelativePosition(event);
        pickPosition.x = (pos.x / canvas.width) * 2 - 1;
        pickPosition.y = (pos.y / canvas.height) * -2 + 1; // note we flip Y
        // Cache it to avoid too many calls
        cachedMousePos = pos;
    }

    function onCanvasMouseMove(event) {
        console.log("Changed mouse position");
        // Raycast to display interactible things in the environment
        setPickPosition(event);
        pickHelper.checkInteractibles(pickPosition, camera, scene, event);
    }

    function onCanvasMouseClick(event) {
        setPickPosition(event);
        pickHelper.pick(pickPosition, gameModels, camera, scene, event);
    }

    function resizeRendererToDisplaySize(renderer) {
        const canvas = renderer.domElement;
        let width = window.innerWidth;
        let height = window.innerHeight;
        let canvasPixelWidth = canvas.width / window.devicePixelRatio;
        let canvasPixelHeight = canvas.height / window.devicePixelRatio;

        const needResize = canvasPixelWidth !== width || canvasPixelHeight !== height;
        if (needResize) {
            renderer.setSize(width, height, false);
        }
        return needResize;
    } //resize

    function setupMusicPlayer() {
        // PLAY MUSIC
        let ambientMusic = $('#ObservingTheStar')[0];
        if (!ambientMusic.isPlaying) {
            ambientMusic.loop = true;
            ambientMusic.play();
        }
    }

    function playSound(soundId) {
        let soundEffect = $(soundId)[0];
        if (!soundEffect.isPlaying) {
            soundEffect.loop = false;
            soundEffect.play();
        }
    }
});
