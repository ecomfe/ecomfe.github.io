define(function(require) {
    
    var app3D = require('../app');
    var qtek = require('qtek');
    var Prefab = require('framework/Prefab');

    var Emitter = qtek.particleSystem.Emitter;

    var sprite1 = new qtek.texture.Texture2D();
    sprite1.load(app3D.getResourcePath('/assets/textures/fire_fire2.png'));
    var sprite2 = new qtek.texture.Texture2D();
    sprite2.load(app3D.getResourcePath('/assets/textures/concreto_5.png'));

    // Particle effect 1
    var particleMaterial1 = new qtek.Material({
        shader : new qtek.Shader({
            vertex : qtek.Shader.source('buildin.particle.vertex'),
            fragment : qtek.Shader.source('buildin.particle.fragment')
        }),
        transparent : true,
        depthMask : false
    });
    particleMaterial1.shader.enableTexture('sprite');
    particleMaterial1.shader.define('both', 'UV_ANIMATION');
    particleMaterial1.set('sprite', sprite1);
    var emitter1 = new Emitter({
        max : 1000,
        amount : 40,
        life : Emitter.constant(0.7),
        spriteSize : Emitter.random1D(10, 20),
        position : Emitter.vector(new qtek.math.Vector3(0, 0, 0)),
        velocity : Emitter.random3D(new qtek.math.Vector3(-0.5, 1.0, -0.5), new qtek.math.Vector3(0.5, 3, 0.5))
    });

    var shootParticle1 = new qtek.particleSystem.ParticleSystem({
        name : 'shootParticle1',
        material : particleMaterial1,
        loop : false,
        oneshot : true,
        duration : 0.7,
        spriteAnimationTileX : 4,
        spriteAnimationTileY : 4,
        spriteAnimationRepeat : 1
    });

    // Particle effect 2
    var particleMaterial2 = new qtek.Material({
        shader : new qtek.Shader({
            vertex : qtek.Shader.source('buildin.particle.vertex'),
            fragment : qtek.Shader.source('buildin.particle.fragment')
        }),
        transparent : true,
        depthMask : false
    })
    particleMaterial2.shader.enableTexture('sprite');
    particleMaterial2.set('sprite', sprite2);

    var emitter2 = new Emitter({
        max : 500,
        amount : 20,
        life : Emitter.constant(0.7),
        spriteSize : Emitter.random1D(50, 100),
        position : Emitter.vector(new qtek.math.Vector3(0, 0, 0)),
        velocity : Emitter.random3D(new qtek.math.Vector3(-0.5, 0.5, -0.5), new qtek.math.Vector3(0.5, 2, 0.5))
    });

    var shootParticle2 = new qtek.particleSystem.ParticleSystem({
        name : 'shootParticle2',
        material : particleMaterial2,
        oneshot : true,
        loop : false,
        duration : 0.7,
    })

    var rootNode = new qtek.Node();
    rootNode.add(shootParticle1);
    rootNode.add(shootParticle2);

    var tmpMat4 = new qtek.math.Matrix4;
    var concreteParticlePrefab = Prefab.create({

        config : {
            
            _shootParticle1 : null,
            _shootParticle2 : null,

            _gravityField : new qtek.particleSystem.GravityField({
                gravity : new qtek.math.Vector3(0, -2, 0)
            }),

            rootNode : rootNode,

            onload : function() {
                this._shootParticle1 = this.rootNode.childAt(0);
                this._shootParticle1.addEmitter(emitter1);
                this._shootParticle1.addField(this._gravityField);
                this._shootParticle2 = this.rootNode.childAt(1);
                this._shootParticle2.addEmitter(emitter2);
                this._shootParticle2.addField(this._gravityField);
            },

            onframe : function(deltaTime) {
                qtek.math.Matrix4.invert(tmpMat4, this.rootNode.worldTransform);
                this._gravityField.gravity.copy(tmpMat4.up).normalize().scale(-2);

                if (this._shootParticle1) {
                    this._shootParticle1.updateParticles(deltaTime);
                    this._shootParticle2.updateParticles(deltaTime);

                    if (this._shootParticle1.isFinished()) {
                        app3D.removeEntity(this);
                        // TODO
                        // app3D.renderer.disposeNode(this.rootNode);
                        this._shootParticle1.dispose(app3D.renderer.gl);
                        this._shootParticle2.dispose(app3D.renderer.gl);

                        concreteParticlePrefab.destroyEntity(this);
                    }
                }

            }
        }
    });

    return concreteParticlePrefab;
})