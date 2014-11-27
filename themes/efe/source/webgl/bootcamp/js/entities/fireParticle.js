define(function(require) {
    
    var qtek = require('qtek');
    var app3D = require('../app');
    var Entity = require('framework/Entity');

    var Emitter = qtek.particleSystem.Emitter;

    function createParticleMaterial() {
        var particleMaterial = new qtek.Material({
            shader : new qtek.Shader({
                vertex : qtek.Shader.source('buildin.particle.vertex'),
                fragment : qtek.Shader.source('buildin.particle.fragment')
            }),
            transparent : true,
            depthMask : false
        });
        particleMaterial.shader.enableTexture('sprite');

        return particleMaterial
    }

    var fireParticle = Entity.create({

        _fireSmokeParticle : null,

        _fireSparkParticle : null,

        _fireParticle : null,

        _fireSparkEmitter : null,
        _fireSmokeEmitter : null,

        autoAddToScene : false,

        onload : function() {
            var fireSmokeSprite = new qtek.texture.Texture2D();
            fireSmokeSprite.load(app3D.getResourcePath('/assets/textures/fire_fire2.png'));
            var fireSparkSprite = new qtek.texture.Texture2D();
            fireSparkSprite.load(app3D.getResourcePath('/assets/textures/spark.jpg'));
            // var fireSprite = new qtek.texture.Texture2D();
            // fireSprite.load('assets/te xtures/fire_006.png');

            var fireSmokeMat =  createParticleMaterial();
            var fireSparkMat = createParticleMaterial();
            // var fireMat = createParticleMaterial();
            
            fireSmokeMat.shader.define('both', 'UV_ANIMATION');
            fireSmokeMat.set('sprite', fireSmokeSprite);
            
            fireSparkMat.set('sprite', fireSparkSprite);
            fireSparkMat.blend = function(_gl) {
                _gl.blendEquation(_gl.FUNC_ADD);
                _gl.blendFunc(_gl.ONE, _gl.ONE);
            }
            
            // fireMat.shader.define('both', 'UV_ANIMATION');
            // fireMat.set('sprite', fireSprite);

            this._fireSmokeEmitter = new Emitter({
                max : 30,
                amount : 3,
                life : Emitter.random1D(0.5, 1.5),
                spriteSize : Emitter.random1D(40, 100),
                position : Emitter.vector(new qtek.math.Vector3(0, 0, 0)),
                velocity : Emitter.random3D(new qtek.math.Vector3(-0.3, -0.1, -0.3), new qtek.math.Vector3(0.3, 0.3, 0.3))
            });
            this._fireSmokeParticle = new qtek.particleSystem.ParticleSystem({
                material : fireSmokeMat,
                loop : true,
                spriteAnimationTileX : 4,
                spriteAnimationTileY : 4,
                spriteAnimationRepeat : 1
            });
            this._fireSmokeParticle.addEmitter(this._fireSmokeEmitter);

            this._fireSparkEmitter = new Emitter({
                max : 1,
                amount : 1,
                life : Emitter.constant(0.1),
                spriteSize : Emitter.constant(400),
                position : Emitter.vector(new qtek.math.Vector3(0, 0, 0)),
                velocity : Emitter.vector(new qtek.math.Vector3(0, 0, 0))
            });

            this._fireSparkParticle = new qtek.particleSystem.ParticleSystem({
                material : fireSparkMat,
                loop : true
            });
            this._fireSparkParticle.addEmitter(this._fireSparkEmitter);

            this.rootNode.add(this._fireSparkParticle);
            this.rootNode.add(this._fireSmokeParticle);

            this.stop();
        },

        onframe : function(deltaTime) {
            this._fireSmokeParticle.updateParticles(deltaTime);
            this._fireSparkParticle.updateParticles(deltaTime);
        },
 
        play : function() {
            this._fireSparkEmitter.amount = 1;
            this._fireSmokeEmitter.amount = 3;
        },

        stop : function() {
            this._fireSparkEmitter.amount = 0;
            this._fireSmokeEmitter.amount = 0;
        }
    });

    return fireParticle;
});