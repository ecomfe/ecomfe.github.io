define(function (require) {

    var app3D = require('../app');
    var qtek = require('qtek');
    var Entity = require('framework/Entity');

    var sceneEntity = Entity.create({

        modelUrl : app3D.getResourcePath('/assets/stealth_nrm.json'),

        mergeMesh : true,

        textureFlipY : false,

        colliderConfig : {
            name : 'scene',
            shape : {
                type : 'bvhTriangleMesh',
                geometryUrl : app3D.getResourcePath('/assets/physics/env_stealth_collision.json')
            },
            isStatic : true
        },

        onload : function() {

            var materials = {};
            var shaders = {};

            var alphaShader = new qtek.Shader({
                vertex : qtek.Shader.source('buildin.physical.vertex'),
                fragment : qtek.Shader.source('buildin.physical.fragment')
            });
            alphaShader.define('fragment', 'SRGB_DECODE');
            alphaShader.enableTexture('diffuseMap');
            alphaShader.define('fragment', 'DIFFUSEMAP_ALPHA_ALPHA');

            this.materials.forEach(function (material) {
                var diffuseTex = material.get('diffuseMap');
                var normalTex = material.get('normalMap');

                if (diffuseTex.image.src.match('tile_wireFence_dff') || diffuseTex.image.src.match('decal')) {
                    // if (diffuseTex.image.src.match('tile_wireFence_dff')) {
                    //     material.shadowTransparentMap = diffuseTex;
                    // }
                    material.attachShader(alphaShader, true);
                    material.transparent = true;
                    material.depthMask = false;
                } else {
                    material.shader.define('fragment', 'DIFFUSEMAP_ALPHA_GLOSS');
                    material.shader.define('fragment', 'SRGB_DECODE');
                    material.transparent = false;
                    material.depthMask = true;
                }
                if (diffuseTex.image.src.match('prop_battleBus_sack_dff')) {
                    material.set('glossiness', 0);
                } else if(diffuseTex.image.src.match('tile_tubeRibbed_dff')) {
                    material.set('glossiness', 0.2);
                } else {
                    material.set('specularColor', [0.17, 0.17, 0.17]);
                    material.set('glossiness', 0.8);
                }
            });
        },

        onframe : function() {

        }
    });

    return sceneEntity;
});