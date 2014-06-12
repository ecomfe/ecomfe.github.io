define(function(require) {

    var qtek = require('qtek');
    qtek.physics = require('qtek-physics');

    var Entity = require('./Entity');

    var appInstance;

    var App3D = qtek.core.Base.derive(function() {
        return {
            // Configs
            rendererConfig : null,

            fxUrl : 'framework/assets/fx/hdr.json',

            pointerLock : false,

            fullscreen : false,

            initialize : function() {},

            frame : function() {},

            defaultGraphicConfig : {
                enableShadow : false,
                shadowConfig : {},
                enablePostProcessing : true
            },

            graphicConfig : {},

            enablePhysics : false,
            ammoUrl : '',

            // Objects created by framework
            renderer : null,

            animation : null,

            compositor : null,

            shadowMapPass : null,

            physicsEngine : null,

            audioContext : null,

            _$currentWorld : null,

            _$compositorSceneNode : null,

            _$entities : []

        }
    }, {

        init : function() {
            this._$init();
        },

        start : function() {
            this.animation.on('frame', this._$frame, this);
        },

        pause : function() {
            this.animation.off('frame', this._$frame);
        },

        resize : function(width, height) {
            this.renderer.resize(width, height);
            if (this._$currentWorld) {
                this._$currentWorld.camera.aspect = width / height;
            }
        },

        loadWorld : function(world) {
            // TODO
            if (this.physicsEngine) {
                this.physicsEngine.init();
            }
            this._$currentWorld = world;
            this.updateGraphicConfig();

            var self = this;
            var task = world.$loadSelf();

            world.camera.aspect = this.renderer.width / this.renderer.height;
            
            if (task) {
                task.success(function() {
                    for (var i = 0; i < world.entities.length; i++) {
                        self.addEntity(world.entities[i]);
                    }
                });
            } else {
                for (var i = 0; i < world.entities.length; i++) {
                    self.addEntity(world.entities[i]);
                }
            }

            return task;
        },

        unloadWorld : function() {
            var world = this._$currentWorld;
            this._$currentWorld = null;

            world.$unloadSelf();

            for (var i = 0; i < world.entities.length; i++) {
                this.removeEntity(world.entities[i]);
            }

            this.renderer.disposeScene(world.scene);
            if (this.shadowMapPass) {
                this.shadowMapPass.dispose(this.renderer.gl);
            }
            if (this.physicsEngine) {
                this.physicsEngine.dispose();
            }
        },

        updateGraphicConfig : function() {
            qtek.core.util.extend(this.graphicConfig, this._$currentWorld.graphicConfig);
            qtek.core.util.defaults(this.graphicConfig, this.defaultGraphicConfig);
            
            // TODO dispose and recreate shadow map pass ?
            if (this.graphicConfig.enableShadow) {
                var shadowConfig = this.graphicConfig.shadowConfig;
                if (!this.shadowMapPass) {
                    this.shadowMapPass = new qtek.prePass.ShadowMap();
                }
                if (shadowConfig) {
                    if (shadowConfig.shadowBlur !== undefined) {
                        this.shadowMapPass.shadowBlur = shadowConfig.shadowBlur
                    }
                    if (shadowConfig.shadowCascade !== undefined) {
                        this.shadowMapPass.shadowCascade = shadowConfig.shadowCascade
                    }
                    if (shadowConfig.cascadeSplitLogFactor !== undefined) {
                        this.shadowMapPass.cascadeSplitLogFactor = shadowConfig.cascadeSplitLogFactor
                    }
                }
            }
        },

        addEntity : function(entity) {
            if (this._$currentWorld && entity.autoAddToScene) {
                this._$currentWorld.scene.add(entity.rootNode);
            }
            if (entity.collider && this.enablePhysics) {
                this.physicsEngine.addCollider(entity.collider);
            }
            
            this._$entities.push(entity);
        },

        removeEntity : function(entity) {
            if (this._$currentWorld && entity.autoAddToScene) {
                this._$currentWorld.scene.remove(entity.rootNode);
            }
            if (entity.collider && this.enablePhysics) {
                this.physicsEngine.removeCollider(entity.collider);
            }
            var idx = this._$entities.indexOf(entity);
            this._$entities.splice(idx, 1);
        },

        getCurrentWorld : function() {
            return this._$currentWorld;
        },

        getCurrentScene : function() {
            if (this._$currentWorld) {
                return this._$currentWorld.scene;
            }
        },

        getCurrentCamera : function() {
            if (this._$currentWorld) {
                return this._$currentWorld.camera;
            }
        },

        _$init : function() {
            var self = this;
            this.renderer = new qtek.Renderer(this.rendererConfig);

            this.animation = new qtek.animation.Animation();
            this.animation.start();

            qtek.core.util.defaults(this.graphicConfig, this.defaultGraphicConfig);
            
            // Init shadow pass
            if (this.graphicConfig.enableShadow) {
                this.shadowMapPass = new qtek.prePass.ShadowMap(this.shadowConfig);
            }

            // Init physics
            if (this.enablePhysics) {
                this.physicsEngine = new qtek.physics.Engine({
                    ammoUrl : this.ammoUrl
                });
            }

            // Init post processing
            if (this.graphicConfig.enablePostProcessing && this.fxUrl) {
                var task = this._$loadFX(this.fxUrl);
            }
            if (task) {
                task.success(function() {
                    self._$init2();
                });
            } else {
                this._$init2();
            }

            // Init web audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

        },

        _$init2 : function() {

            this.initialize();
            this.start();

            this._$lockChange = this._$lockChange.bind(this);
            this._$lockPointer = this._$lockPointer.bind(this);
            this._$fullScreenChange = this._$fullScreenChange.bind(this);

            var el = this.renderer.canvas;

            if (this.fullscreen) {
                document.addEventListener('fullscreenchange', this._$fullScreenChange, false);
                document.addEventListener('mozfullscreenchange', this._$fullScreenChange, false);
                document.addEventListener('webkitfullscreenchange', this._$fullScreenChange, false);
            }
            document.addEventListener("pointerlockchange", this._$lockChange, false);
            document.addEventListener("mozpointerlockchange", this._$lockChange, false);
            document.addEventListener("webkitpointerlockchange", this._$lockChange, false);   


            if (this.pointerLock) {
                el.addEventListener('click', this._$lockPointer);
            } else {
                el.addEventListener('mousemove', this._$createEventProxy('mousemove'));
            }

            el.addEventListener('mousedown', this._$createEventProxy('mousedown'), false);
            el.addEventListener('mouseup', this._$createEventProxy('mouseup'), false);

            document.addEventListener('keydown', this._$createEventProxy('keydown'), false);
            document.addEventListener('keyup', this._$createEventProxy('keyup'), false);
            document.addEventListener('keypress', this._$createEventProxy('keypress'), false);
        },

        _$lockPointer : function() {
            var el = this.renderer.canvas;
            if (this.fullscreen) {
                el.requestFullscreen = el.requestFullscreen ||
                                       el.mozRequestFullscreen ||
                                       el.webkitRequestFullscreen;
                el.requestFullscreen();
            } else {
                el.requestPointerLock = el.requestPointerLock ||
                                        el.mozRequestPointerLock ||
                                        el.webkitRequestPointerLock;

                el.requestPointerLock();
            }
        },

        _$fullScreenChange : function() {
            var el = this.renderer.canvas;

            if (
                document.webkitFullscreenElement === el ||
                document.mozFullscreenElement === el
            ) {
                el.requestPointerLock = el.requestPointerLock ||
                                        el.mozRequestPointerLock ||
                                        el.webkitRequestPointerLock;

                el.requestPointerLock();
            }
        },

        _$lockChange : function(e) {
            var el = this.renderer.canvas;
            if (
                document.mozPointerLockElement === el ||
                document.webkitPointerLockElement === el
            ) {
                el.addEventListener('mousemove', this._$createEventProxy('mousemove'), false);
            } else {
                el.removeEventListener('mousemove', this._$createEventProxy('mousemove'));
            }
        },

        _$loadFX : function(url) {

            var self = this;
            var FXLoader = new qtek.loader.FX();
            FXLoader.load(this.fxUrl);

            var sceneNode = new qtek.compositor.SceneNode({
                name : 'scene',
                // preZ : true,
                outputs : {
                    color : {
                        parameters : {
                            width : function(renderer) {
                                return renderer.width;
                            },
                            height : function(renderer) {
                                return renderer.height;
                            },
                            type : qtek.Texture.FLOAT
                        }
                    }
                }
            });

            if (this._$currentWorld) {
                sceneNode.camera = this._$currentWorld.camera;
                sceneNode.scene = this._$currentWorld.scene;
            }

            this._$compositorSceneNode = sceneNode;

            FXLoader.success(function(compositor) {
                compositor.add(sceneNode);
                self.compositor = compositor;
            });

            return FXLoader;
        },

        _$frame : function(deltaTime) {
            if (!this._$currentWorld) {
                return;
            }

            this._$currentWorld.$frame(deltaTime);
            for (var i =0; i < this._$entities.length; i++) {
                this._$entities[i].$frame(deltaTime);
            }

            this.frame(deltaTime);

            var renderer = this.renderer;
            var scene = this._$currentWorld.scene;
            var camera = this._$currentWorld.camera;

            // Set the position of listener same to camera
            var cameraWorldPosition = camera.getWorldPosition();
            this.audioContext.listener.setPosition(cameraWorldPosition.x, cameraWorldPosition.y, cameraWorldPosition.z);

            if (this.enablePhysics) {
                this.physicsEngine.step(deltaTime / 1000);
            }
            if (this.graphicConfig.enableShadow) {
                this.shadowMapPass.render(renderer, scene, camera);
            }
            if (this.graphicConfig.enablePostProcessing) {
                this._$compositorSceneNode.camera = camera;
                this._$compositorSceneNode.scene = scene;
                this.compositor.render(renderer);
            } else {
                renderer.render(scene, camera);
            }
        },

        _$createEventProxy : (function() {
            var events = {};
            return function(eveName) {
                var self = this;
                if (!events[eveName]) {
                    events[eveName] = function(e) {
                        if (self._$currentWorld) {
                            self._$currentWorld.trigger(eveName, e);
                        }
                        for (var i = 0; i < self._$entities.length; i++) {
                            self._$entities[i].trigger(eveName, e);
                        }
                    }
                }
                return events[eveName];
            }
        })()
    });

    App3D.getInstance = function(opts) {
        if (!appInstance && opts) {
            appInstance = new App3D(opts);
        }
        return appInstance;
    }

    return App3D;
})