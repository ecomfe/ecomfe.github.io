define(function (require) {
    
    var qtek = require('qtek');
    var app3D = require('../app');
    var Entity = require('framework/Entity');


    var propBattleBusEntity = Entity.create({

        modelUrl : app3D.getResourcePath('/assets/prop_battleBus_nrm.json'),

        textureFlipY : false,

        onload : function() {
            this.materials.forEach(function(material) {
                material.shader = material.shader.clone(true);
                material.shader.define('fragment', 'DIFFUSEMAP_ALPHA_GLOSS');
                material.shader.define('fragment', 'SRGB_DECODE');
                material.shader.enableTexture('normalMap');
                material.set('specularColor', [0.1, 0.1, 0.1]);
                material.set('glossiness', 0.7);
            });
        }
    });

    return propBattleBusEntity;
})