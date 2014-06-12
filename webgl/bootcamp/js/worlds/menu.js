define(function(require) {

    var qtek = require('qtek');
    var World = require('framework/World');
    var Atmosphere = require('framework/Atmosphere');
    var app3D = require('../app');
    var bootcamp = require('./bootcamp');

    var menuEntity = require('../entities/menu');

    menuEntity.menuItems = [
        {
            title : 'play',
            onenter : function() {
                app3D.unloadWorld(menu);
                // Directly load the world will stop the browser
                // Don't know why(guess its gc problem)
                setTimeout(function() {
                    app3D.loadWorld(bootcamp);
                }, 1000);
            }
        },
        {
            title : 'options',
            children : [
                {
                    title : "shadow"
                },
                {
                    title : "post processing"
                }
            ]
        },
        {
            title : 'about'
        }
    ];

    var menu = World.create({

        entities : [
            require('../entities/m4'),
            require('../entities/soldierMenu'),
            menuEntity
        ],

        graphicConfig : {
            enableShadow : false
        },

        _skybox : null,

        onload : function() {

            this._initLight();

            this._initSkybox();

            this.camera.position.set(1, 1, -2.5);
            this.camera.lookAt(new qtek.math.Vector3(1, 1, 0));

            this.entities[1].rootNode.rotation.rotateY(Math.PI - 0.3);
            this.entities[1].rootNode.position.x = 0.3;
        },

        onprogress : function(percent, nSettled, nAll) {
            app3D.showLoading();
            app3D.setLoadingPercent(percent * 0.5);
        },

        ontextureprogress : function(percent, nSettled, nAll) {
            app3D.setLoadingDesc('LOADING MENU');
            app3D.setLoadingPercent(percent * 0.5 + 0.5);
        },

        ontextureload : function() {
            app3D.setLoadingDesc('LOADING MENU');
            app3D.hideLoading();
        },

        _initLight : function() {

            var light = new qtek.light.Directional({
                intensity : 1
            });
            light.position.set(3, 10, -10);
            light.lookAt(qtek.math.Vector3.ZERO);

            this.scene.add(light);

            this.scene.add(new qtek.light.Ambient({
                intensity : 0.4
            }));
        },

        _initSkybox : function() {
            var skybox = new qtek.plugin.Skybox({
                scene : this.scene
            });
            var envMap = new qtek.texture.TextureCube();
            envMap.load({
                'px' : app3D.getResourcePath('/assets/textures/envmap/px.png'),
                'nx' : app3D.getResourcePath('/assets/textures/envmap/nx.png'),
                'py' : app3D.getResourcePath('/assets/textures/envmap/py.png'),
                'ny' : app3D.getResourcePath('/assets/textures/envmap/ny.png'),
                'pz' : app3D.getResourcePath('/assets/textures/envmap/pz.png'),
                'nz' : app3D.getResourcePath('/assets/textures/envmap/nz.png'),
            });
            skybox.material.shader = skybox.material.shader.clone();
            skybox.material.shader.define('fragment', 'SRGB_DECODE');
            skybox.material.set('environmentMap', envMap);

            this.skybox = skybox;
        },

        onmousemove : function(e) {
            var dx = e.movementX || 
                    e.mozMovementX ||
                    e.webkitMovementX || 0;
            var dy = e.movementY ||
                    e.mozMovementY ||
                    e.webkitMovementY || 0;

            // this.camera.rotation.rotateY(dx / 10000);
        },

        onunload : function() {
            app3D.renderer.disposeNode(this.skybox);
        }
    });

    return menu;
});