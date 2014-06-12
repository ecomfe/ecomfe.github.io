define(function (require) {

    var qtek = require('qtek');
    var app3D = require('../app');
    var Entity = require('framework/Entity');

    var m4 = require('./m4');

    var soldierEntity = Entity.create({

        modelUrl : app3D.getResourcePath('/assets/soldier.json'),

        clipUrls : {
            'idle' : app3D.getResourcePath('/assets/animations/idle.json')
        },

        textureFlipY : true,

        maxJointNumber : 40,

        onload : function() {
            this.rootNode.scale.set(0.01, 0.01, 0.01);

            this.meshes.forEach(function(mesh) {
                mesh.frustumCulling = false;
            });

            this.materials.forEach(function(material) {
                material.shader.define('fragment', 'DIFFUSEMAP_ALPHA_GLOSS');
                material.shader.define('fragment', 'SRGB_DECODE');
                material.set('glossiness', 4.0);
            });

            this.rootNode.getDescendantByName('RArmHand').add(m4.rootNode);

            this.clips.idle.setLoop(true);
            this.skeletons.forEach(function(skeleton) {
                skeleton.addClip(this.clips.idle);
            }, this);

            app3D.animation.addClip(this.clips.idle);
        },

        onframe : function() {
            this.skeletons.forEach(function(skeleton) {
                skeleton.setPose(0);
            }, this);
        },

        onunload : function() {
            app3D.animation.removeClip(this.clips.idle);
        }
    });
    return soldierEntity;
});