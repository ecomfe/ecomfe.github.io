define(function (require) {
    
    var qtek = require('qtek');
    var app3D = require('../app');
    var Entity = require('framework/Entity');

    var fireParticle = require('./fireParticle');

    var m4Entity = Entity.create({

        modelUrl : app3D.getResourcePath('/assets/M4.json'),

        textureFlipY : true,

        autoAddToScene : false,

        onload : function() {
            var normalMap = new qtek.texture.Texture2D({
                wrapS : qtek.Texture.REPEAT,
                wrapT : qtek.Texture.REPEAT
            });
            normalMap.load(app3D.getResourcePath('/assets/textures/M4_NMM_01.jpg'));

            this.rootNode.traverse(function(node) {
                if (node.geometry) {
                    node.geometry.generateTangents();
                }
            });

            this.materials.forEach(function(material) {
                material.shader = material.shader.clone();
                material.shader.define('fragment', 'DIFFUSEMAP_ALPHA_GLOSS');
                material.shader.define('fragment', 'SRGB_DECODE');
                material.shader.enableTexture('normalMap');
                material.set('normalMap', normalMap);
                material.set('specularColor', [0.01, 0.01, 0.01]);
                material.set('glossiness', 3.0);
            });

            this.rootNode.scale.set(100, 100, 100);

            this.rootNode.getChildByName('M4').add(fireParticle.rootNode);
            fireParticle.rootNode.position.z = 0.80;
            fireParticle.rootNode.position.y = 0.11;
        },

        onunload : function() {
        }
    });

    return m4Entity;
})