// TODO 
// Move the model loading out to a sperate class
define(function(require) {

    var qtek = require('qtek');
    qtek.physics = require('qtek-physics');

    var decodingContext = new (window.AudioContext || window.webkitAudioContext);

    var Entity = qtek.core.Base.derive(function(){
        return {
            // ------Configs
            modelUrl : '',
            textureRoot : '',

            // Collider config
            // isStatic
            // isGhostObject
            // isKinematic
            // type : ''
            // shape : {}
            // physicsMaterial : {}
            // 
            colliderConfig : null,
            rootNode : null,

            // Animation urls
            clipUrls : null,

            // Audio urls
            audioUrls : null,

            // Texture override options
            textureFlipY : true,
            textureAnisotropic : 8,
            // If merge mesh of same material
            mergeMesh : false,
            // Max joint number for skinning mesh
            maxJointNumber : 100,

            // Plugin Constructors
            plugins : [],

            // If added to scene after loaded
            autoAddToScene : true,

            // -------Result resources
            mainClip : null,

            clips : {},

            audioBuffers : {},

            meshes : [],

            materials : [],

            textures : [],

            skinnedMeshes : [],

            skeletons : [],

            collider : null,

            _$pluginInstances : [],

            _$initialized : false
        }
    }, function() {
        if (!this.rootNode) {
            this.rootNode = new qtek.Node();
        }
    }, {

        $loadSelf : function () {
            var self = this;
            
            var tasks = [];
            var physicsTask = this._$initPhysics();
            if (physicsTask) {
                tasks.push(physicsTask);
            }

            if (this.modelUrl) {
                var modelLoadingTask = this._$loadModel();
                tasks.push(modelLoadingTask);
            }

            var animationLoadingTask = this._$loadAnimations();
            if (animationLoadingTask) {
                tasks.push(animationLoadingTask);
            }

            var audioLoadingTask = this._$loadAudios();
            if (audioLoadingTask) {
                tasks.push(audioLoadingTask);
            }

            if (tasks.length > 0) {
                var taskGroup = new qtek.async.TaskGroup();
                taskGroup.all(tasks).success(function() {
                    self._$initialized = true;
                    self._$initPlugins();
                    self.trigger('load');
                });
                return taskGroup;
            } else {
                self._$initialized = true;
                self._$initPlugins();
                self.trigger('load');
                return null;
            }
        },

        $frame : function(deltaTime) {
            if (this._$initialized) {
                this.trigger('frame', deltaTime);
            }
        },

        $unloadSelf : function() {
            this._$initialized = false;
            this.trigger('unload');
            this.rootNode._children = [];
        },

        _$initPlugins : function() {
            this._$pluginInstances.length = 0;
            for (var i = 0; i < this.plugins.length; i++) {
                var Plugin = new this.plugins[i];
                var plug = new Plugin();
                plug.entity = this;
                plug.enable();
                this._$pluginInstances.push(plug);
            }
        },

        _$initPhysics : function() {
            var shapeLoadTask;
            if (this.colliderConfig) {
                var collider = new qtek.physics.Collider({
                    isStatic : this.colliderConfig.isStatic,
                    isKinematic : this.colliderConfig.isKinematic,
                    isGhostObject : this.colliderConfig.isGhostObject,
                    physicsMaterial : new qtek.physics.Material(this.colliderConfig.physicsMaterial),
                    sceneNode : this.rootNode
                });
                this.collider = collider;
                var rigidBody = new qtek.physics.RigidBody();
                if (this.colliderConfig.mass !== undefined) {
                    rigidBody.mass = this.colliderConfig.mass;
                }
                if (this.colliderConfig.name !== undefined) {
                    collider.name = this.colliderConfig.name;
                }

                collider.collisionObject = rigidBody;
                
                var shapeConfig = this.colliderConfig.shape;

                var res = this._$createShape(shapeConfig, rigidBody);
                shapeLoadTask = res[0];
                var shape = res[1];
                rigidBody.shape = shape;
            }
            return shapeLoadTask;
        },

        _$createShape : function(shapeConfig) {
            var task;
            var shape;
            switch (shapeConfig.type) {
                case 'box':
                    shape = new qtek.physics.shape.Box(shapeConfig);
                    break;
                case 'capsule':
                    shape = new qtek.physics.shape.Capsule(shapeConfig);
                    break;
                case 'cone':
                    shape = new qtek.physics.shape.Cone(shapeConfig);
                    break;
                case 'cylinder':
                    shape = new qtek.physics.shape.Cylinder(shapeConfig);
                    break;
                case 'sphere':
                    shape = new qtek.physics.shape.Sphere(shapeConfig);
                    break;
                case 'staticPlane':
                    shape = new qtek.physics.shape.StaticPlane(shapeConfig);
                    break;
                case 'convexTriangleMesh':
                    var ShapeConstructor = qtek.physics.shape.ConvexTriangleMesh;
                case 'bvhTriangleMesh':
                    var ShapeConstructor = ShapeConstructor || qtek.physics.shape.BvhTriangleMesh;
                case 'convexHull':
                    var ShapeConstructor = ShapeConstructor || qtek.physics.shape.ConvexHull;
                    shape = new ShapeConstructor(shapeConfig);
                    task = new qtek.async.Task();
                    if (shapeConfig.geometryUrl && ! shapeConfig.geometry) {
                        var loader = new qtek.loader.GLTF();
                        loader.load(shapeConfig.geometryUrl);
                        loader.success(function(res) {
                            var scene = res.scene;
                            scene.traverse(function(node) {
                                // Find the first geometry
                                if (node.geometry) {
                                    shape.geometry = node.geometry;
                                    return true;
                                }
                            });

                            task.resolve();
                        });
                    }
                    break;
                case "compound":
                    var tasks = [];
                    shape = new qtek.physics.shape.Compound();
                    for (var i =0; i < shapeConfig.children.length; i++) {
                        var childShapeConfig = shapeConfig.children[i];
                        var res = this._$createShape(childShapeConfig.shape);
                        if (res[0]) {
                            tasks.push(res[0]);
                        }
                        shape.addChildShape(res[1], childShapeConfig.position, childShapeConfig.rotation);
                    }
                    if (tasks.length > 0) {
                        task = new qtek.async.TaskGroup();
                        task.all(tasks);   
                    }
                    break;
                default:
                    throw new Error('Unkown shape type ' + shapeConfig.type);
            }
            return [task, shape];
        },

        _$loadModel : function() {

            var loadingTask = new qtek.async.Task();

            var self = this;
            var modelLoader = new qtek.loader.GLTF({
                textureRootPath : this.textureRoot
            });
            modelLoader.load(this.modelUrl);
            modelLoader.success(function(res) {
                // Model
                var scene = res.scene;
                if (self.mergeMesh) {
                    self._$mergeSceneByMaterial(scene);
                }
                var children = scene.children();
                for (var i = 0; i < children.length; i++) {
                    self.rootNode.add(children[i]);
                }

                // Textures
                var textureList = [];
                for (var name in res.textures) {
                    var texture = res.textures[name];
                    texture.flipY = self.textureFlipY;
                    texture.anisotropic = self.textureAnisotropic;
                    if (!texture.isRenderable()) {
                        textureList.push(texture);
                    }
                }
                self.textures = textureList;

                // Split skinning mesh
                var skinnedMeshesNeedsSplit = [];
                self.rootNode.traverse(function(node) {
                    if (node.skeleton && (node.joints.length > self.maxJointNumber)) {
                        skinnedMeshesNeedsSplit.push(node);
                    }
                });
                skinnedMeshesNeedsSplit.forEach(function(mesh) {
                    qtek.util.mesh.splitByJoints(mesh, self.maxJointNumber, true);
                })

                // Meshes and materials
                self.materials.length = 0;
                self.meshes.length = 0;
                var materials = {};
                self.rootNode.traverse(function(node) {
                    if (node instanceof qtek.Mesh) {
                        self.meshes.push(node);
                        if (node.skeleton) {
                            self.skinnedMeshes.push(node);
                        }
                        if (node.material) {
                            materials[node.material.__GUID__] = node.material;
                        }
                    }
                });
                for (var guid in materials) {
                    self.materials.push(materials[guid]);
                }

                // Skeletons
                self.skeletons.length = 0;
                var skeletons = {};
                self.skinnedMeshes.forEach(function(skinnedMesh) {
                    skeletons[skinnedMesh.skeleton.name] = skinnedMesh.skeleton;
                });
                for (var name in skeletons) {
                    self.skeletons.push(skeletons[name]);
                }

                // Animation clip
                if (res.clip) {
                    self.mainClip = res.clip;

                    self.skinnedMeshes.forEach(function(skinnedMesh) {
                        skinnedMesh.skeleton.addClip(self.mainClip);
                    });
                }

                loadingTask.resolve();
            });

            return loadingTask;
        },

        _$loadAnimations : function() {
            this.clips = {};
            var self = this;
            var tasks = [];
            var animationNames = [];
            if (this.clipUrls) {
                for (var name in this.clipUrls) {
                    var url = this.clipUrls[name];
                    var loader = new qtek.loader.GLTF();
                    loader.load(url);
                    animationNames.push(name);
                    tasks.push(loader);
                }
            }
            if (tasks.length) {
                var taskGroup = new qtek.async.TaskGroup();
                taskGroup.all(tasks);
                taskGroup.success(function(res) {
                    for (var i = 0; i < res.length; i++) {
                        var item = res[i];
                        var animationName = animationNames[i];
                        if (item.clip) {
                            self.clips[animationName] = item.clip;
                        }
                    }
                })
                return taskGroup;
            }
        },

        _$loadAudios : function() {
            this.audioBuffers = {}
            var self = this;
            var tasks = [];
            var audioNames = [];
            if (this.audioUrls) {
                for (var name in this.audioUrls) {
                    var url = this.audioUrls[name];
                    audioNames.push(name);
                    var task = qtek.async.Task.makeRequestTask(url, 'arraybuffer')
                    tasks.push(task);
                }
            }

            if (tasks.length) {
                var taskGroup = new qtek.async.TaskGroup();
                var decodingCount = 0;
                var decodingTask = new qtek.async.Task();
                
                taskGroup.all(tasks)
                .success(function(buffers) {
                    decodingCount = buffers.length;
                    buffers.forEach(function(buffer, i) {
                        var audioName = audioNames[i];
                        decodingContext.decodeAudioData(buffers[i], function(decodedBuffer) {
                            decodingCount--;
                            if (decodingCount == 0) {
                                decodingTask.resolve();
                            }
                            self.audioBuffers[audioName] = decodedBuffer;
                        }, function() {
                            decodingCount--;
                            if (decodingCount == 0) {
                                decodingTask.resolve();
                            }
                            console.error('Audio ' + audioName + ' data is invalid');
                        });
                    });
                });

                return decodingTask;
            }
        },

        _$mergeSceneByMaterial : function(scene) {
            var meshListGroupByMat = {};
            scene.update();
            scene.traverse(function(node) {
                if (node.material) {
                    if (!meshListGroupByMat[node.material.name]) {
                        meshListGroupByMat[node.material.name] = [];
                    }
                    meshListGroupByMat[node.material.name].push(node);
                }
            });

            var children = scene.children();
            children.forEach(function(child) {
                scene.remove(child);
            });
            for (var name in meshListGroupByMat) {
                var meshList = meshListGroupByMat[name];
                var vertexCount = 0;
                var meshListToMerge = [];
                for (var i = 0; i < meshList.length; i++) {
                    var mesh = meshList[i];
                    var count = mesh.geometry.getVertexNumber();
                    if (vertexCount + count > 0xffff) {
                        var mergedMesh = qtek.util.mesh.merge(meshListToMerge, true);
                        scene.add(mergedMesh);

                        vertexCount = count;
                        meshListToMerge = [mesh];
                    } else {
                        meshListToMerge.push(mesh);
                        vertexCount += count;
                    }
                }

                var mergedMesh = qtek.util.mesh.merge(meshListToMerge, true);
                scene.add(mergedMesh);
            }
        }
    });

    Entity.events = [
        'load',
        'frame',
        'mousedown',
        'mouseup',
        'keydown',
        'keypress',
        'keyup',
        'mousemove',
        'click',
        'unload'
    ]

    Entity.create = function(opts) {
        
        var events = {};

        for (var i = 0; i < Entity.events.length; i++) {
            var eventName = Entity.events[i];
            var e = opts['on' + eventName];
            if (e) {
                events[eventName] = e;
                delete opts['on' + eventName];
            }
        }

        var entity = new Entity(opts);
        for (var name in events) {
            entity.on(name, events[name]);
        }

        return entity;
    }

    return Entity;
});