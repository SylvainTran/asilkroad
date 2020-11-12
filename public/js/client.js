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
                    console.log("walking");
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

    // CLIENT NETWORK CONTROLLER CODE
    //
    /////////////////////////////////

    // GAME DATA
    // the raw game data for caching
    let gameData;
    // BROKERAGE 
    // the up to date brokerage data
    let brokerage;
    // INVENTORY
    // the actual player inventory
    let inventory = []; // 6x4?
    const inventoryMaxSize = 24;
    // Currently selected object tag
    let objectTag = null;
    // The resource property of the tagged object
    let objectTagResourceProperty = null;
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

    // Three.js variables
    let camera;
    let renderer;
    const canvas = $('#graphics-view--canvas')[0];
    const canvasContainer = $('.explorable-graphics-view')[0];
    const backgroundColor = 0x3b3b3b;
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

    // Game model meshes
    let gameModels = [];

    // Update position
    function updatePosition(point) {
        desiredPositionGoal = point;
        // Set goal from new current world position of model
        positionGoalProgress = new THREE.Vector3(); // Empty object 3D as the point where the player clicked
        playerModel.getWorldPosition(positionGoalProgress);
        // Update server of new position change
        const dataPacket = {
            desiredPositionGoal: desiredPositionGoal, // The desired position to aim for
            positionGoalProgress: positionGoalProgress // the actual position right now
        };
        // socket.emit('emitPlayerChangeWorldPosition', )
        // TODO import three-pathfinding.js (stretch)  
    }
    // Pop the DOM context menu
    function popContextMenuDOM(event) {
        console.log(event.data);
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
        console.log('collect a resource');
        // Check inventory space left
        if (inventory.length > inventoryMaxSize) {
            // Instanciate in front of the model?
            $('.explorable-text-view--update').append('<h4><em>Inventory is full.</em></h4>');
            return;
        }
        let resource;
        console.log(objectTagResourceProperty);
        for (let i = 0; i < gameData['rawResources'].length; i++) {
            // TODO optimize this later
            if (gameData['rawResources'][i]['name'] === objectTagResourceProperty) {
                // Add to this player's inventory // Add a unique hash (SHA256) for this item instance
                // TODO add player's own unique hashed ID from database (owner)
                let randomString = Math.random().toString(36).replace(/[^a-z]+/g, '');
                resource = {
                    item: gameData['rawResources'][i],
                    uniqueId: new Hashes.SHA256().hex(randomString)
                };
                inventory.push(resource);
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
        $('#inventory').append('<li id=' + resource.uniqueId + '>' + objectTagResourceProperty + ' x1</li>');
        // Add eventlistener for the INVENTORY + BROKERAGE
        const contextMenu = $('#inventory-contextMenu--select-container');
        $('#' + resource.uniqueId).on("click", {
            event: event,
            contextMenu: contextMenu,
            scene: scene
        }, popContextMenuDOM);
    }
    $(document).ready(setupPlayer);
    $(document).click(setupMusicPlayer);

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
            renderer.shadowMap.enabled = true;
            renderer.gammaOutput = true;
            renderer.gammaFactor = 2.2;
            renderer.setPixelRatio(window.devicePixelRatio);
            canvasContainer.appendChild(renderer.domElement);

            camera = new THREE.PerspectiveCamera(
                50,
                window.innerWidth / window.innerHeight,
                0.1,
                3000
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
            scene.fog = new THREE.FogExp2(0x25388a, 0.0025);

            let d = 8.25;
            let dirLight = new THREE.DirectionalLight(0xfc9e19, 0.1);
            dirLight.position.set(-8, 10, 8);
            dirLight.castShadow = true;
            dirLight.shadow.mapSize = new THREE.Vector2(1024, 1024);
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

            const MODEL_PATH = '/public/models/terrain_0002_export.glb';
            const TREE_PATH = '/public/models/tree_low_0001_export.glb';
            const PLAYER_PATH = '/public/models/player_cart_0001_export.glb';

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

                // Trees
                tree.load(TREE_PATH, function (gltf) {
                    treeModel = gltf.scene;
                    treeModel.scale.set(1, 1, 1);
                    treeModel.position.set(0, 0, 0);
                    // treeModel.traverse(function(child) {
                    //   if(child instanceof THREE.Mesh) {
                    //     child.castShadow = true;
                    //     child.receiveShadow = true;
                    //   }
                    // });
                    treeModel.castShadow = true;
                    scene.add(treeModel);

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
                        let lanternLight = new THREE.PointLight(0xfc9e19, 10);
                        lanternLight.position.set(0, 5, 0);
                        lanternLight.castShadow = true;
                        scene.add(lanternLight);
                        lanternLight.parent = playerModel;

                        terrainRaycaster = new THREE.Raycaster();
                        terrainRaycaster.set(playerModel.position, new THREE.Vector3(0, -1, 0));

                        // Everything has been loaded at this point
                        // Cache our game models' mesh for raycasting
                        // TODO if an object with multiple meshes, group them or do something more efficient
                        // Loop through all scene children
                        gameModels.push(scene.children[2].children[0]); // Mesh object
                        gameModels.push(scene.children[3].children[0].children[0]); // Mesh object
                        gameModels.push(scene.children[3].children[0].children[1]); // Mesh object
                        gameModels.push(scene.children[4].children[0].children[0]); // Mesh object // Player cart
                        gameModels.push(scene.children[4].children[0].children[1]); // Mesh object // Player cart
                        gameModels.push(scene.children[4].children[0].children[2]); // Mesh object // Player cart
                        console.log(scene.children);

                        function loadNewAvatar(PATH, loadConfig) {
                            let newAvatar = new THREE.GLTFLoader();
                            let newAvatarMesh;
                            newAvatar.load(PATH, function (gltf) {
                                newAvatarMesh = gltf.scene;
                                console.log(newAvatarMesh);
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
                                    position: loadConfig.position
                                };
                                otherConnectedPlayers.push(avatarBundle);
                                scene.add(newAvatarMesh);
                            });
                        }
                        // SERVER CODE
                        //
                        //
                        // Client-side network controller
                        // Each client has their own socket, which the server can listen to
                        const socket = io(); // client connection socket
                        const randomString = Math.random().toString(36).replace(/[^a-z]+/g, ''); // Used for generating uniquePlayerId
                        const myUniquePlayerId = new Hashes.SHA256().hex(randomString); // uniquePlayerId used to let the server and other players know who this unique entity is
                        const loadConfig = {
                            scale: 10,
                            uniquePlayerId: null,
                            playerModel: null,
                            position: null
                        }; // Model loader config 

                        // Disconnect event
                        socket.on('disconnect', function () {
                            console.log('I disconnected');
                            // Pass in this avatar on disconnection for removal in other sockets' view
                            socket.emit('disconnectedPlayer', myUniquePlayerId);
                        });
                        socket.on('connect', function (data) {
                            // Join and send the playerModel for others to see
                            console.log("Player model: " + playerModel);
                            // PASS THE UNIQUE ID TOO
                            socket.emit('join', {
                                playerModel: playerModel,
                                position: playerModel.position,
                                uniquePlayerId: myUniquePlayerId
                            });
                            // Initial handshake
                            socket.on('joinedClientId', function (data) {
                                // cache id
                                socketId = data.clientId;
                                // Cache the game data
                                gameData = data.gameData;
                                // Cache brokerage
                                brokerage = JSON.parse(gameData.brokerage);
                                // Init inventory (from database)
                                // initInventory();            
                                // Send older avatars
                                console.log("Getting old avatars!" + data.olderAvatars);
                                // If the ids are differnt than this client id, load their model and last position
                                for (let i = 0; i < data.olderAvatars.length; i++) {
                                    if (data.olderAvatars[i].uniquePlayerId !== myUniquePlayerId) { // load
                                        loadConfig.uniquePlayerId = data.olderAvatars[i].uniquePlayerId;
                                        loadConfig.playerModel = data.olderAvatars[i].playerModel;
                                        loadConfig.position = data.olderAvatars[i].position;
                                        loadNewAvatar(PLAYER_PATH, loadConfig);
                                    }
                                }
                            });
                            //load others avatar
                            socket.on('newAvatarInWorld', function (avatar) {
                                const parsedAvatar = JSON.parse(avatar);
                                alert("NEW PLAYER");
                                console.log(parsedAvatar);
                                console.log("A NEW PLAYER JOINED THE WORLD AT: " + parsedAvatar.position.x + ", " + parsedAvatar.position.y + " ," + parsedAvatar.position.z);
                                console.log("THEIR SECRET ID: " + parsedAvatar.uniquePlayerId);
                                // update load config
                                loadConfig.uniquePlayerId = parsedAvatar.uniquePlayerId;
                                loadConfig.playerModel = parsedAvatar.playerModel;
                                loadConfig.position = parsedAvatar.position;

                                // Clone the avatar first in an instance of THREE.Object3D
                                loadNewAvatar(PLAYER_PATH, loadConfig);
                            });

                            socket.on('updatedConnectedAvatars', function (update) {
                                // Search for any differences 
                                // in the currently active scene models
                                for (let i = 0; i < scene.children; i++) {

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
                                // Get the last updated brokerage from host
                                brokerage = JSON.parse(updatedBrokerage);
                            });
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
                                console.log("sending message li");
                                $('#messages').append($('<li>').text(msg));
                            });
                            socket.on('newCycleBegin', function (msg) {
                                console.log("new cycle begins announcement");
                                $('#messages').append($('<li>').text(msg));
                            });
                        }); // on connect event
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
                }); // tree.load
            }); // terrain.load
        } // init
    } // Setup player

    function update() {
        render();
        //console.log("x : " + camera.position.x + " y: " + camera.position.y + "z : " + camera.position.z);

        requestAnimationFrame(update);
    } //update

    function render() {
        if (playerModel && positionGoalProgress && currentWorldPosition) {
            // Camera follow target
            let temp = positionGoalProgress;
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
            // TODO import three-pathfinding.js (stretch)  
            camera.lookAt(positionGoalProgress);
            // TODO Position on terrain with raycaster
            // terrainRaycaster.set(playerModel.position, new THREE.Vector3(0, -1, 0));
            // let intersects = terrainRaycaster.intersectObject(terrainModel);
            // console.log(intersects[0]);
            // playerModel.position.y = intersects[0].point.y + 30;
        }
        renderer.render(scene, camera);
    } // render

    function getCanvasRelativePosition(event) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: (event.clientX - rect.left) * canvas.width / rect.width,
            y: (event.clientY - rect.top) * canvas.height / rect.height,
        };
    }

    function setPickPosition(event) {
        const pos = getCanvasRelativePosition(event);
        pickPosition.x = (pos.x / canvas.width) * 2 - 1;
        pickPosition.y = (pos.y / canvas.height) * -2 + 1; // note we flip Y
    }

    function onCanvasMouseClick(event) {
        pickHelper.pick(pickPosition, gameModels, camera, scene, event);
        setPickPosition(event);
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
        let ambientMusic = $('#bensound-onceagain')[0];
        if (!ambientMusic.isPlaying) {
            ambientMusic.loop = true;
            ambientMusic.play();
        }
    }
});
