// Client code
$(function () {
    // Helper util classes (TODO require them from external files)
    class PickHelper {
        constructor() {
            this.raycaster = new THREE.Raycaster();
            this.pickedObject = null;
            this.pickedObjectSavedColor = 0;
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
            const intersectedObjects = this.raycaster.intersectObjects(gameModels);
            if (intersectedObjects.length) {
                // pick the first object. It's the closest one
                this.pickedObject = intersectedObjects[0].object;
                // using the global objectTag for now
                objectTag = this.pickedObject.userData['tag']; // Custom object mesh label used to know if it can be interacted with
                // Update global object resource too
                objectTagResourceProperty = this.pickedObject.userData['resource'];
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
                    // Pass in the point where the ray intersected with the mesh under the mouse cursor to get the move position
                    updatePosition(intersectedObjects[0].point);
                }
                if (objectTag === 'tree') {
                    // Open context menu -- the in-game version
                    popContextMenu({
                        event: event,
                        contextMenu: $('#contextMenu--select-container'),
                        scene: scene
                    });
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
    const averageGroundHeight = 20;

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
    const MODEL_PATH = '/public/models/terrain_0002_export.glb';
    const TREE_PATH = '/public/models/tree_low_0001_export.glb';
    const PLAYER_PATH = '/public/models/player_cart_0001_export.glb';

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
    // Attach click event on canvas only
    $('#graphics-view--canvas').click(onCanvasMouseClick);
    // Context menu event handlers
    $('#contextMenu--select-cancel').click(closeContextMenu);
    // Event handlers binding
    $(document).ready(setupPlayer);
    $(document).click(setupMusicPlayer);

    // Game model meshes
    let gameModels = [];
    let activeSRIs = [];

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
        // // Update camera
        // let distToPlayer = playerModel.position.distanceTo(camera.position);
        // if(distToPlayer >= 150) {
        //     let newCamPos = playerModel.position.sub(new THREE.Vector3(distToPlayer,25,distToPlayer));
        //     camera.position.lerp(newCamPos, 0.25);
        //     let q = new THREE.Quaternion();
        //     //
        //     let rotation = THREE.MathUtils.setQuaternionFromProperEuler();
        // } else {
        //     camera.lookAt(playerModel.position);
        // }
        // TODO import three-pathfinding.js (stretch)  
    }
    // Pop the DOM context menu
    function popContextMenuDOM(event) {
        let dialogConfig = {
            autoOpen: false,
            show: {
                effect: "blind",
                duration: 500
            },
            hide: {
                effect: "puff",
                duration: 250
            },
            resizable: false,
            height: "auto",
            width: 400,
            modal: false,
            buttons: {
                "Trade to Broker": function () {
                    // send t broker
                    console.log("trading to broker " + event.data.item.info.item.name);
                    console.log("with unique id " + event.data.item.info.uniqueId);
                    console.log("Metadata : " + event.data.item.metaData.sellerId);
                    console.log("Metadata : " + event.data.item.metaData.timeStamp);
                    removeFromInventory(event.data.item);
                    tradeToBroker(event.data.item);
                    $('.explorable-text-view--update').html("You sent: " + event.data.item.info.item.name + " x" + event.data.item.info.qty + " to the brokerage.");
                    $(this).dialog("close");
                },
                "Manufacture": function () {
                    $(this).dialog("close");
                },
                "Consume (permanent)": function () {
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
        // emit onSellItem to server
        socket.emit('onSellItem', item);
        // Play sound FX
        playSound('#tradeToBrokerage');
    }

    // Pop the in-game context menu
    function popContextMenu(event) {
        // prevent event bubbling from massive amounts of clicks
        // console.log(event.data);
        // console.log(event.data.contextMenu);
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

        $(contextMenu).contextmenu(contextMenuFill);
        // Attach a one time event to close it if clicked anywhere else
        setTimeout(() => {
            $(document).one("click", closeContextMenu);
            if (event.event) event.event.stopPropagation()
        }, (10));
    }

    function openContextMenu() {
        $('#contextMenu--select-container').css("display", "block");
    }

    function closeContextMenu(event) {
        // TODO Don't close if clicked on context menu itself
        if ($('#contextMenu--select-container').css("display") === "block") {
            $('#contextMenu--select-container').css("display", "none");
        }
    }

    function popInventoryContextMenu(item) {
        let contextMenu = document.createElement("div");
        contextMenu.id = "dialog";
        contextMenu.title = "Resource";
        let li = document.createElement("li");
        let txt = document.createTextNode("Send to Broker?");
        li.style.listStyleType = "none";
        li.appendChild(txt);
        let ul = document.createElement("ul");
        ul.appendChild(li);
        contextMenu.appendChild(ul);
        document.body.append(contextMenu);

        $('#dialog').dialog();
        console.log("Sending item " + item.target.id + " to broker.");
        // Remove from inventory
        $('#' + item.target.id).remove();
    }

    function gatherResource(event) {
        if (!gameData) {
            console.error("ERROR: no game data");
            return;
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
                    info: resource,
                    metaData: metaData
                };
                inventory.push(dataBundle);
            }
        }
        console.log('added new resource to inventory : ');
        console.log(inventory);
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
        console.log('added item with unique id: ' + resource.uniqueId);
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

        function init() {

            scene = new THREE.Scene();
            scene.background = new THREE.Color(backgroundColor);

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
            canvasContainer.appendChild(renderer.domElement);

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
            let hemiLight = new THREE.HemisphereLight(0xFF9C4C, 0xFF9C4C, 0.05);
            hemiLight.position.set(0, 50, 0);

            // Add hemisphere light to scene
            scene.add(hemiLight);

            // Fog
            scene.fog = new THREE.FogExp2(0x25388a, 0.0040);

            let d = 8.25;
            let dirLight = new THREE.DirectionalLight(0xfc9e19, 0.01);
            dirLight.position.set(-8, 10, 8);
            dirLight.castShadow = true;
            dirLight.shadow.mapSize = new THREE.Vector2(2048, 2048);
            dirLight.shadow.camera.near = 0.1;
            dirLight.shadow.camera.far = 1500;
            dirLight.shadow.camera.left = d * -1;
            dirLight.shadow.camera.right = d;
            dirLight.shadow.camera.top = d;
            dirLight.shadow.camera.bottom = d * -1;
            // Add directional Light to scene
            scene.add(dirLight);

            const controls = new THREE.OrbitControls(camera, canvas);
            controls.target.set(0, 5, 0);
            controls.minPolarAngle = -45;
            controls.maxPolarAngle = Math.PI / 2; // Cannot rotate below pi/2 rad
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;
            // controls.minAzimuthAngle = -1 * 2 * Math.PI; // radians
            // controls.maxAzimuthAngle = 2 * Math.PI; // radians
            controls.enablePan = false;
            controls.enableZoom = true;
            controls.update();


            var pmremGenerator = new THREE.PMREMGenerator(renderer);
            pmremGenerator.compileEquirectangularShader();

            // Model loaders
            terrainModel;
            let treeModel;
            // Note the player model is global for now

            let terrain = new THREE.GLTFLoader();
            let tree = new THREE.GLTFLoader();
            let playerCart = new THREE.GLTFLoader();

            // Terrain
            terrain.load(MODEL_PATH, function (gltf) {
                terrainModel = gltf.scene;
                terrainModel.scale.set(1, 1, 1);
                terrainModel.position.set(0, 0, 0);
                terrainModel.receiveShadow = true;
                scene.add(terrainModel);

                // Player cart
                playerCart.load(PLAYER_PATH, function (gltf) {

                    playerModel = gltf.scene;
                    playerModel.scale.set(10, 10, 10);
                    playerModel.position.set(0, 20, 0);
                    // Shadows for each mesh
                    playerModel.traverse(function (child) {
                        if (child instanceof THREE.Mesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                        }
                    });
                    playerModel.castShadow = true;
                    scene.add(playerModel);
                    // Add lantern light to player's cart 
                    let lanternLight = new THREE.PointLight(0xFFFFFF, 0.1);
                    lanternLight.power = 800;
                    lanternLight.decay = 1;
                    lanternLight.distance = Infinity;
                    lanternLight.scale.set(1, 1, 1);
                    lanternLight.position.set(0, 2, 0);
                    lanternLight.castShadow = true;
                    scene.add(lanternLight);
                    lanternLight.parent = playerModel;

                    // TODO terrain raycaster
                    terrainRaycaster = new THREE.Raycaster();
                    terrainRaycaster.set(playerModel.position, new THREE.Vector3(0, -1, 0));

                    // Camera follow setup
                    relCameraPos = camera.position.sub(playerModel.position);
                    relCameraPosMag = camera.position.distanceTo(playerModel.position) - 0.5;
                    // Everything has been loaded at this point
                    // Cache our game models' mesh for raycasting
                    // TODO if an object with multiple meshes, group them or do something more efficient
                    // Loop through all scene children
                    gameModels.push(scene.children[2].children[0]); // Mesh object -- terrain
                    // gameModels.push(scene.children[3].children[0].children[0]); // Mesh object
                    // gameModels.push(scene.children[3].children[0].children[1]); // Mesh object
                    gameModels.push(scene.children[3].children[0].children[0]); // Mesh object // Player cart
                    gameModels.push(scene.children[3].children[0].children[1]); // Mesh object // Player cart
                    gameModels.push(scene.children[3].children[0].children[2]); // Mesh object // Player cart lantern light

                    // SERVER CODE
                    //
                    // Client-side network controller
                    // Each client has their own socket, which the server can listen to
                    socket = io(); // client connection socket
                    //const randomString = Math.random().toString(36).replace(/[^a-z]+/g, ''); // Used for generating uniquePlayerId
                    // myUniquePlayerId = new Hashes.SHA256().hex(randomString); // uniquePlayerId used to let the server and other players know who this unique entity is
                    myUniquePlayerId = THREE.MathUtils.generateUUID();
                    console.log(myUniquePlayerId);
                    const loadConfig = {
                        scale: 10,
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
                            // console.log("Client: Player with id " + data.myUniquePlayerId + " moved to new position: ");
                            // console.log(data.desiredPositionGoal);
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
                                        effect: "blind",
                                        duration: 500
                                    },
                                    hide: {
                                        effect: "puff",
                                        duration: 250
                                    },
                                    resizable: true,
                                    height: "auto",
                                    width: 400,
                                    modal: false,
                                    title: "Confirm Purchase?",
                                    buttons: {
                                        "Confirm": function () {
                                            let dataBundle = {
                                                uniquePlayerId: myUniquePlayerId,
                                                tradeInfo: {
                                                    sellerId: $(this).data('sellerId'),
                                                    info: info,
                                                    item: item
                                                },
                                                requestTimeStamp: Date.now()
                                            };
                                            socket.emit('onBuyItem', dataBundle);
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
                                        effect: "blind",
                                        duration: 500
                                    },
                                    hide: {
                                        effect: "puff",
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
                        socket.on('onPlayerDestroyedAResource', function(data){
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
                    update();
                }); // player.load                
            }); // terrain.load
        } // init
    } // Setup player

    // factory for resources
    function loadNewResource(loader, resourceScene, PATH, loadConfig) {
        // console.log(loadConfig);
        for (let i = 0; i < loadConfig.length; i++) {
            let newResource = loadConfig[i];
            loader.load(PATH, function (gltf) {
                resourceScene = gltf.scene;
                resourceScene.scale.set(newResource.scale, newResource.scale, newResource.scale);
                resourceScene.position.set(newResource.position.x, newResource.position.y, newResource.position.z);
                // Shadows for each mesh
                resourceScene.traverse(function (child) {
                    if (child instanceof THREE.Mesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                resourceScene.castShadow = true;
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
                    gameModels.push(resourceScene.children[0].children[i]); // the mesh
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
            // Shadows for each mesh
            newAvatarMesh.traverse(function (child) {
                if (child instanceof THREE.Mesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
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
        render();
        //console.log("x : " + camera.position.x + " y: " + camera.position.y + "z : " + camera.position.z);
        requestAnimationFrame(update);
    } //update

    function render() {
        // TODO run this animation code for all connected Avatars
        // Update this player
        if (playerModel && positionGoalProgress && currentWorldPosition) {
            // Camera follow target
            // TODO fix rotation or use orthographic instead OR first person
            //temp.set(camera.position.x, camera.position.y, goal.z);
            //camera.position.lerp(temp, 0.1);
            // Lerp towards the goal 
            positionGoalProgress.lerp(desiredPositionGoal, 0.1);
            // Update current world position
            currentWorldPosition.x = positionGoalProgress.x;
            currentWorldPosition.z = positionGoalProgress.z;
            // Update the model
            playerModel.position.set(currentWorldPosition.x, averageGroundHeight, currentWorldPosition.z);
            // let delta = performance.now() * 0.001;
            // console.log(delta);
            // TODO import three-pathfinding.js (stretch)  
            // TODO Position on terrain with raycaster
            // terrainRaycaster.set(playerModel.position, new THREE.Vector3(0, -1, 0));
            // let intersects = terrainRaycaster.intersectObject(terrainModel);
            // console.log(intersects[0]);
            // playerModel.position.y = intersects[0].point.y + 30;
            // Camera
            //     let standardPos = playerModel.position.add(relCameraPos);
            //     //console.log(standardPos);
            //     let up = new THREE.Vector3(0, 1, 0);
            //     let abovePos = playerModel.position.add(up.multiplyScalar(relCameraPosMag));
            //     //console.log(abovePos);
            //     let checkPoints = [];
            //     checkPoints.push(standardPos);
            //     checkPoints.push(standardPos.lerp(abovePos, 0.25));
            //     checkPoints.push(standardPos.lerp(abovePos, 0.50));
            //     checkPoints.push(standardPos.lerp(abovePos, 0.75));
            //     checkPoints.push(abovePos);

            //     // console.log(checkPoints[0]);
            //     // console.log(checkPoints[1]);
            //     // console.log(checkPoints[2]);
            //     // console.log(checkPoints[3]);
            //     // console.log(checkPoints[4]);
            //     // alert("TOP")
            //     for (let i = 0; i < checkPoints.length; i++) {
            //         //console.log(checkPoints[i].x + " " + checkPoints[i].y + " " + checkPoints[i].z);
            //         if (viewingPosCheck(checkPoints[i], playerModel.position)) {
            //             break;
            //         }
            //     }
            // camera.position.lerp(newPos, smooth * 0.01);
            camera.lookAt(positionGoalProgress);
        }
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
                for(let _i = 0; _i < gameModels.length; _i++) {
                    if(gameModels[_i].uuid === uuidToDelete) {
                        console.log("found game model raycast to delete");
                        gameModels.splice(_i, 1);
                    }
                }
                for(let i = 0; i < activeSRIs.length; i++) {
                    console.log("Sanity check: " + activeSRIs[i]);
                }
                // Emit to others that YOU destroyed that resource
                socket.emit("onResourceDestroyed", uuidToDelete);
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
    }
        
    function viewingPosCheck(checkPos, playerPosition) {
        let raycaster = new THREE.Raycaster();
        let dir = playerPosition.sub(checkPos);
        //console.log(checkPos);
        // console.log(dir.x + " " + dir.y + " " + dir.z);
        raycaster.set(checkPos, dir);
        // get the list of objects the ray intersected
        let hits = raycaster.intersectObjects(gameModels);
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

        const needResize =
            canvasPixelWidth !== width || canvasPixelHeight !== height;
        if (needResize) {
            renderer.setSize(width, height, false);
        }
        return needResize;
    } //resize

    function setupMusicPlayer() {
        // PLAY MUSIC
        let ambientMusic = $('#song18')[0];
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