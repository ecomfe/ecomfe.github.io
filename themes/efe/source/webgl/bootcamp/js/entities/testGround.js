define(function (require) {

    var app3D = require('../app');
    var qtek = require('qtek');
    var Entity = require('framework/Entity');

    var sceneEntity = Entity.create({

        mergeMesh : true,

        onload : function() {
            var groundPlane = new qtek.Mesh({
                geometry : new qtek.geometry.Plane({
                    widthSegments : 100,
                    heightSegments : 100
                }),
                material : new qtek.Material({
                    shader : qtek.shader.library.get('buildin.basic', 'diffuseMap')
                }),
                culling : false
            });
            groundPlane.material.set('color', [0.7, 0.7, 0.7]);
            groundPlane.geometry.generateBarycentric();
            groundPlane.rotation.rotateX(-Math.PI / 2);
            groundPlane.scale.set(50, 50, 1);

            var texture = qtek.util.texture.createChessboard(2048, 16);
            texture.anisotropic = 32;
            groundPlane.material.set('diffuseMap', texture);

            this.rootNode.add(groundPlane);
        },

        onframe : function() {
            
        }
    });

    return sceneEntity;
});