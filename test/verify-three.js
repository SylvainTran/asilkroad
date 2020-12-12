global.THREE = require('three');
let assert = require('assert');

describe('The THREE object', function() {
  it('should have a defined BasicShadowMap constant', function() {
    assert.notEqual('undefined', THREE.BasicShadowMap);
  }),

  it('should be able to construct a Vector3 with default of x=0', function() {
    let vec3 = new THREE.Vector3();
    assert.equal(0, vec3.x);
  })
  it('should be able to set a userData value manually to each mesh', function() {
    let manufacturingTable = new global.THREE.GLTFLoader();
    let model;
    const MANUFACTURING_TABLE_PATH = '/public/models/manufacturingTable_export_0001.glb';
    manufacturingTable.load(MANUFACTURING_TABLE_PATH, function (gltf) {
      model = gltf.scene;
      model.scale.set(1, 1, 1);
      model.castShadow = true;
      model.traverse((o) => {
          if (o.isMesh) {
              o.userData['tag'] = "manufacturingWorkbench";
              assert.equal("manufacturingWorkbench", o.userData['tag']);
          }
      });
    });
  });
})