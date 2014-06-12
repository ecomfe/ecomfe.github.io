define(function(require) {

    var qtek = require('qtek');
    var World = require('framework/World');
    var Atmosphere = require('framework/Atmosphere');
    var app3D = require('../app');

    var bootcamp = World.create({

        entities : [
            require('../entities/fireParticle'),
            require('../entities/m4'),
            require('../entities/soldier'),
            require('../entities/testGround')
        ],

        _sunLight : null,
        _atmospherePass : null,

        _sunsetLight : new qtek.math.Vector3(0.71, 0.49, 0.36),
        _noonLight : new qtek.math.Vector3(0.75, 0.75, 0.68),

        onload : function() {

            this._initLight();

            this._initSkybox();

            this._initGround();
        },

        onprogress : function(percent, nSettled, nAll) {
            console.log(percent, nSettled, nAll);
        },

        ontextureprogress : function(percent, nSettled, nAll) {
            console.log(percent, nSettled, nAll);
        },

        _initGround : function() {
            // Floor
            var floorBody = new qtek.physics.RigidBody({
                shape : new qtek.physics.shape.StaticPlane()
            });
            var floorNode = new qtek.Node();
            floorNode.rotation.rotateX(-Math.PI / 2);
            app3D.physicsEngine.addCollider(new qtek.physics.Collider({
                collisionObject : floorBody,
                physicsMaterial : new qtek.physics.Material(),
                sceneNode : floorNode,
                isStatic : true
            }));
        },

        _initLight : function() {

            var light = new qtek.light.Directional({
                intensity : 2.6,
                shadowResolution : 1024,
                shadowBias : 0.004,
                shadowSlopeScale : 4
            });
            light.position.set(3, 16, 10);
            light.lookAt(qtek.math.Vector3.ZERO);

            var cos = light.position.clone().normalize().dot(qtek.math.Vector3.UP);
            light.color = new qtek.math.Vector3().lerp(this._sunsetLight, this._noonLight, cos)._array;

            this.scene.add(light);

            this.scene.add(new qtek.light.Ambient({
                intensity : 0.4
            }));

            this._sunLight = light;
        },

        _initSkybox : function() {
            var cubeMap = new qtek.texture.TextureCube({
                width : 512,
                height : 512,
                type : qtek.Texture.FLOAT
            });
            var atmospherePass = new Atmosphere({
                texture : cubeMap
            });

            this._sunLight.update();
            atmospherePass.light = this._sunLight;
            atmospherePass.render(app3D.renderer);

            var skybox = new qtek.plugin.Skybox({
                scene : this.scene
            });
            skybox.material.set('environmentMap', cubeMap);

            this._atmospherePass = atmospherePass;
        },
    });

    return bootcamp;
});