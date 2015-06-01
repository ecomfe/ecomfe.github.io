define(function(require) {
    
    var qtek = require('qtek');
    qtek.physics = require('qtek-physics');
    var Entity = require('./Entity');

    var Prefab = qtek.core.Base.derive({
        
        config : null,

        _$entities : [],

        _$entity : null,

        _$initialized : false
    }, {

        $init : function() {
            var config = this.config;
            // Preloading
            this._$entity = Entity.create(qtek.core.util.clone(config));
            var task = this._$entity.$loadSelf();

            delete config.modelUrl;
            delete config.textureRoot;
            delete config.colliderConfig;
            delete config.rootNode;
            delete config.clipUrls;
            delete config.audioUrls;
            delete config.waitTexture;
            delete config.textureFlipY;
            delete config.textureAnisotropic;
            delete config.mergeMesh;
            delete config.maxJointNumber;

            if (task) {
                task.success(function() {
                    this._$initialized = true;
                }, this);
            } else {
                this._$initialized = true;
            }
            return task;
        },

        createEntity : function() {
            if (!this._$initialized) {
                return false;
            } else {
                var entity = Entity.create(qtek.core.util.clone(this.config));
                entity.rootNode = this._$entity.rootNode.clone();
                if (this._$entity.collider) {
                    var collider = this._$entity.collider;
                    entity.collider = new qtek.physics.Collider({
                        collisionObject : collider.collisionObject.clone(),
                        sceneNode : entity.rootNode,
                        physicsMaterial : collider.physicsMaterial,
                        isKinematic : collider.isKinematic,
                        isStatic : collider.isStatic,
                        isGhostObject : collider.isGhostObject
                    });
                }

                entity.$loadSelf();

                this._$entities.push(entity);

                return entity;
            }
        },

        destroyEntity : function(entity) {
            var idx = this._$entities.indexOf(entity);
            this._$entities.splice(idx, 1);
            entity.$unloadSelf();
        }
    });

    Prefab.create = function(opts) {
        var prefab = new Prefab(opts);
        prefab.$init();
        return prefab;
    }

    return Prefab;
});