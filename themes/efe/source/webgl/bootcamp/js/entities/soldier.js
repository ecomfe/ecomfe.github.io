define(function (require) {

    var qtek = require('qtek');
    var app3D = require('../app');
    var Entity = require('framework/Entity');


    var concreteParticlePrefab = require('../prefabs/concreteParticlePrefab');
    var fireParticle = require('./fireParticle');
    var m4 = require('./m4');

    var soldierEntity = Entity.create({

        modelUrl : app3D.getResourcePath('/assets/soldier.json'),

        clipUrls : {
            'run' : app3D.getResourcePath('/assets/animations/run/run.json'),
            'strafeRunLeft' : app3D.getResourcePath('/assets/animations/run/strafeRunLeft.json'),
            'strafeRunRight' : app3D.getResourcePath('/assets/animations/run/strafeRunRight.json'),
            'runBackwards' : app3D.getResourcePath('/assets/animations/run/runBackwards.json'),
            'idle' : app3D.getResourcePath('/assets/animations/idle.json'),
            'standing' : app3D.getResourcePath('/assets/animations/standing.json'),
            'standingAim' : app3D.getResourcePath('/assets/animations/standingAim.json'),
            'standingAimUp' : app3D.getResourcePath('/assets/animations/standingAimUp.json'),
            'standingAimDown' : app3D.getResourcePath('/assets/animations/standingAimDown.json'),
            'standingFire' : app3D.getResourcePath('/assets/animations/standingFire.json')
        },

        audioUrls : {
            'm4Shoot' : app3D.getResourcePath('/assets/audios/m4_shoot.wav'),
            'concreteFootstep' : app3D.getResourcePath('/assets/audios/concrete_footsteps_1.wav')
        },

        colliderConfig : {
            shape : {
                type : 'compound',
                children : [{
                    position : new qtek.math.Vector3(0, 1, 0),
                    shape : {
                        type : 'cylinder',
                        halfExtents : new qtek.math.Vector3(0.5, 1, 0.5)
                    }
                }]
            },

            // Strangely if the mass is zero
            // the collider will pass through other colliders
            mass : 10
        },

        textureFlipY : true,

        maxJointNumber : 40,

        maxForwardSpeed : 4.6,

        maxBackwardSpeed : 2,
        
        maxSidewaySpeed : 3.07,


        // Animation clips
        _runClip : null,

        _finalClip : null,

        _aimClip : null,

        _additiveFireClip : null,

        _standingFireClip : null,


        _footstepAudioSource : null,
        _footstepAudioPanner : null,

        _isPlaingFootstepAudio : false,

        _soldierRoot : null,

        _speed : new qtek.math.Vector2(),

        _offsetPitch : 0,
        _offsetRoll : 0,

        _orientationChanged : false,

        _hasCollision : false,

        // Soldier status 
        _isAim : false,
        _aimPercent : 0,
        _aimTransitionTime : 0.2,

        _isFire : false,
        _isReload : false,

        _fireRate : 15,

        _aimCameraPos : new qtek.math.Vector3(-0.5, 1.6, -1),

        _cameraPos : new qtek.math.Vector3(0, 1.8, -2.3),

        onload : function() {

            var camera = app3D.getCurrentCamera();

            this._soldierRoot = this.rootNode;
            this._soldierRoot.scale.set(0.01, 0.01, 0.01);

            this.rootNode = new qtek.Node();
            if (this._soldierRoot.parent) {
                this._soldierRoot.parent.add(this.rootNode);
            }
            this.rootNode.add(this._soldierRoot);
            this.rootNode.add(camera);

            this.rootNode.position.set(5, 0, 5);
            this.collider.sceneNode = this.rootNode;

            this._initAnimation();

            this._setCamera(this._cameraPos);

            this.meshes.forEach(function(mesh) {
                mesh.frustumCulling = false;
            });

            this.materials.forEach(function(material) {
                material.shader.define('fragment', 'DIFFUSEMAP_ALPHA_GLOSS');
                material.shader.define('fragment', 'SRGB_DECODE');
                material.set('glossiness', 2.0);
            });

            this.collider.on('collision', this._onCollision, this);

            // var entity = concreteParticlePrefab.createEntity();
            // app3D.addEntity(entity);
            // entity.rootNode.position.set(5, 0, 10);
            this.rootNode.getDescendantByName('RArmHand').add(m4.rootNode);
        },

        _onCollision : function(contacts) {
            for (var i = 0; i < contacts.length; i++) {
                var contact = contacts[i];
                if (contact.otherCollider.name == 'scene') {
                    // Not with the ground
                    if (contact.normal.dot(qtek.math.Vector3.UP) < 0.99) {
                        this._hasCollision = true;
                    }
                }
            }
        },

        _initAnimation : function() {

            this.skeletons.forEach(function(skeleton) {
                skeleton.removeClipsAll();
            });

            // Create blend tree
            var runClip = new qtek.animation.Blend2DClip();
            runClip.addInput(new qtek.math.Vector2(0, -this.maxBackwardSpeed), this.clips.runBackwards, 200)
            runClip.addInput(new qtek.math.Vector2(0, 0), this.clips.standing);
            runClip.addInput(new qtek.math.Vector2(0, this.maxForwardSpeed), this.clips.run, 100);
            runClip.addInput(new qtek.math.Vector2(-this.maxSidewaySpeed, 0), this.clips.strafeRunLeft, 400);
            runClip.addInput(new qtek.math.Vector2(this.maxSidewaySpeed, 0), this.clips.strafeRunRight, 100);

            var aimClip = new qtek.animation.Blend1DClip();
            aimClip.addInput(-1, this.clips.standingAimDown);
            aimClip.addInput(0, this.clips.standingAim);
            aimClip.addInput(1, this.clips.standingAimUp);

            var finalClip = new qtek.animation.Blend1DClip();
            finalClip.addInput(0, runClip);
            finalClip.addInput(1, aimClip);

            finalClip.setLoop(true);
            app3D.animation.addClip(finalClip);

            var standingFire = this.clips.standingFire;
            standingFire.setLoop(true);
            app3D.animation.addClip(standingFire);

            this._runClip = runClip;
            this._finalClip = finalClip;
            this._aimClip = aimClip;
            this._standingFireClip = standingFire;


            this._createBlendOutput(finalClip);
            this._createBlendOutput(aimClip);
            this._createBlendOutput(runClip);

            this._additiveFireClip = this._createEmptySkinningClip();

            this.skeletons.forEach(function(skeleton) {
                skeleton.addClip(finalClip.output);
            }, this);
        },

        _createBlendOutput : function(clip) {
            clip.output = new qtek.animation.SkinningClip();

            for (var i = 0; i < this.clips.standing.jointClips.length; i++) {
                clip.output.addJointClip(new qtek.animation.SamplerClip({
                    name : this.clips.standing.jointClips[i].name
                }));
            }
        },

        _playFootstepAudio : function() {
            this._footstepAudioSource = app3D.audioContext.createBufferSource();
            this._footstepAudioSource.buffer = this.audioBuffers.concreteFootstep;
            this._footstepAudioSource.loop = true;
            this._footstepAudioSource.playbackRate.value = 1.5;

            this._footstepAudioPanner = app3D.audioContext.createPanner();
            var gainNode = app3D.audioContext.createGain();
            gainNode.gain.value = 0.8;

            this._footstepAudioSource.connect(this._footstepAudioPanner);
            this._footstepAudioPanner.connect(gainNode);
            gainNode.connect(app3D.audioContext.destination);


            this._footstepAudioSource.start(0);
        },

        _createEmptySkinningClip : function() {

            var clip = new qtek.animation.SkinningClip();

            for (var i = 0; i < this.clips.standing.jointClips.length; i++) {
                clip.addJointClip(new qtek.animation.SamplerClip({
                    name : this.clips.standing.jointClips[i].name
                }));
            }

            return clip;
        },

        _addFireAnimation : function() {
            var additiveFireClip = this._additiveFireClip;
            additiveFireClip.subtractiveBlend(this.clips.standingFire, this.clips.standingAim);
            this._finalClip.output.additiveBlend(this._finalClip.output, additiveFireClip);
        },

        _getClampedSpeed : function() {

            var a2 = this.maxSidewaySpeed;
            if (this._speed.y >= 0) {
                var b2 = this.maxForwardSpeed;
            } else {
                var b2 = this.maxBackwardSpeed;
            }
            // Clamp speed
            var a1 = Math.abs(this._speed.x);
            var b1 = Math.abs(this._speed.y);
            var x = (a1 * a2 * b2) / (a2 * b1 + a1 * b2);
            var y = x * b1 / a1;
            var lenSquared = x * x + y * y;
            var clampedSpeed = this._speed.clone();
            if (lenSquared < this._speed.squaredLength()) {
                clampedSpeed.normalize().scale(Math.sqrt(lenSquared) - 0.01);
            }

            return clampedSpeed;
        },

        onframe : function(deltaTime) {
            deltaTime /= 1000;

            if (this._isAim) {
                this._speed.set(0, 0);
            }
            // Aiming
            var aiming = false;
            if (this._aimPercent < 1 && this._isAim) {
                this._aimPercent += deltaTime / this._aimTransitionTime;
                aiming = true;
            } else if (this._aimPercent > 0 && !this._isAim) {
                this._aimPercent -= deltaTime / this._aimTransitionTime;
                aiming = true;
            }
            this._aimPercent = Math.min(Math.max(0, this._aimPercent), 1);
            this._finalClip.position = this._aimPercent;
            if (aiming) {
                var cameraPos = new qtek.math.Vector3().lerp(this._cameraPos, this._aimCameraPos, this._aimPercent);
                this._setCamera(cameraPos);
            }

            var clampedSpeed = this._getClampedSpeed();

            this._runClip.position.copy(clampedSpeed);
            this.skeletons.forEach(function(skeleton) {
                if (this._isFire) {
                    this._addFireAnimation();
                }
                skeleton.setPose(0);
            }, this);

            var rootNode = this.rootNode;
            var soldierRoot = this._soldierRoot;
            var camera = app3D.getCurrentCamera();

            if (this._offsetRoll) {
                camera.rotateAround(qtek.math.Vector3.ZERO, qtek.math.Vector3.UP, -this._offsetPitch * Math.PI / 180);
                this._orientationChanged = true;
            }
            if (this._offsetPitch) {
                var xAxis = camera.localTransform.right.normalize();
                camera.rotateAround(qtek.math.Vector3.ZERO, xAxis, -this._offsetRoll * Math.PI / 180);
                this._orientationChanged = true;
            }
            this._offsetRoll = this._offsetPitch = 0;

            if (this._isAim) {
                var tmp = -camera.localTransform.forward.normalize().dot(qtek.math.Vector3.UP);
                var angle = Math.PI / 2 - Math.acos(tmp);
                this._aimClip.position = angle / Math.PI * 2;
            }

            if (this._speed.y !== 0 || this._speed.x !== 0 || this._isAim) {
                this._applyOrientationChange();
            }

            var position = rootNode.position;
            var xAxis = soldierRoot.localTransform.right.normalize();
            var zAxis = soldierRoot.localTransform.forward.normalize();

            zAxis.y = 0;

            if (this._speed.y !== 0 || this._speed.x !== 0) {
                var speed = this.collider.collisionObject.linearVelocity;
                speed.copy(zAxis).scale(clampedSpeed.y);
                speed.scaleAndAdd(xAxis, -clampedSpeed.x);

                // Play sound
                if (!this._isPlaingFootstepAudio) {
                    this._playFootstepAudio();
                    this._isPlaingFootstepAudio = true;
                }
                if (this._footstepAudioPanner) {
                    var soldierPosition = soldierRoot.getWorldPosition();
                    this._footstepAudioPanner.setPosition(soldierPosition.x, 0, soldierPosition.z);
                }
            } else {
                this.collider.collisionObject.linearVelocity.set(0, 0, 0);

                if (this._isPlaingFootstepAudio) {
                    this._footstepAudioSource.stop(0);
                    this._isPlaingFootstepAudio = false;   
                }
            }

            // Force the rotation and y position to be identity
            // In case it is modified by the physics engine
            this.rootNode.rotation.identity();
            this.rootNode.position.y = 0;

            if (this._isFire) {
                this._fire(deltaTime);
            }
        },

        _fire : (function() {
            var elapsedTime = 0;
            return function(deltaTime) {
                elapsedTime += deltaTime;
                if (elapsedTime > 1 / this._fireRate) {
                    var ray = app3D.getCurrentCamera().castRay(new qtek.math.Vector2());
                    // Avoid hit the soldier rigidBody
                    var start = ray.origin.clone().scaleAndAdd(ray.direction, 2);
                    var end = ray.origin.clone().scaleAndAdd(ray.direction, 10000);
                    app3D.physicsEngine.rayTest(start, end, this._rayTestCallback)   

                    elapsedTime = 0;

                    this._playFireAudio();

                }
            }
        })(),

        _playFireAudio : function() {
            var source = app3D.audioContext.createBufferSource();
            source.buffer = this.audioBuffers.m4Shoot;
            source.playbackRate.value = 1 + Math.random() * 0.1;
            var panner = app3D.audioContext.createPanner();
            var position = m4.rootNode.getWorldPosition();
            panner.setPosition(position.x, position.y, position.z);
            source.connect(panner);
            panner.connect(app3D.audioContext.destination);
            source.start(0);
        },

        _rayTestCallback : function(collider, hitPoint, hitNormal) {
            if (!collider) {
                return;
            }
            var entity = concreteParticlePrefab.createEntity();
            app3D.addEntity(entity);
            entity.rootNode.position.copy(hitPoint);
            if (hitNormal.y < 0.01) {
                var side = qtek.math.Vector3.POSITIVE_Y;
            } else {
                var side = qtek.math.Vector3.POSITIVE_X;
            }
            var forward = new qtek.math.Vector3();
            qtek.math.Vector3.cross(forward, hitNormal, side);
            entity.rootNode.lookAt(hitPoint.sub(forward), hitNormal);
        },

        _applyOrientationChange : function() {
            if (this._orientationChanged) {
                var rootNode = this.rootNode;
                var soldierRoot = this._soldierRoot;
                var camera = app3D.getCurrentCamera();
                // Rotate the character to the direction of camera
                var t = camera.localTransform.forward;
                t.y = soldierRoot.position.y;
                soldierRoot.lookAt(t, qtek.math.Vector3.UP);

                this._orientationChanged = false;
            }
        },

        _setCamera : function(relPos) {
            var zAxis = this._soldierRoot.localTransform.forward.normalize();
            var xAxis = this._soldierRoot.localTransform.right.normalize();
            var yAxis = this._soldierRoot.localTransform.up.normalize();
            var mainCamera = app3D.getCurrentCamera();
            mainCamera.position
                .copy(zAxis).scale(relPos.z)
                .add(xAxis.scale(relPos.x))
                .add(yAxis.scale(relPos.y));
            mainCamera.lookAt(zAxis.scale(10).add(mainCamera.position), qtek.math.Vector3.UP);

            mainCamera.update();
        },

        onmousemove : function(e) {
            var dx = e.movementX || 
                    e.mozMovementX ||
                    e.webkitMovementX || 0;
            var dy = e.movementY ||
                    e.mozMovementY ||
                    e.webkitMovementY || 0;

            this._offsetPitch += dx / 10;
            this._offsetRoll += dy / 10;
        },

        onkeydown : function(e) {
            switch(e.keyCode) {
                case 87: //w
                case 37: //up arrow
                    this._speed.y = this.maxForwardSpeed;
                    break;
                case 83: //s
                case 40: //down arrow
                    var tmp = -this.maxBackwardSpeed - this._speed.y;
                    this._speed.y = tmp * 0.8 + this._speed.y;
                    break;
                case 65: //a
                case 37: //left arrow
                    this._speed.x = -this.maxSidewaySpeed;
                    break;
                case 68: //d
                case 39: //right arrow
                    this._speed.x = this.maxSidewaySpeed;
                    break; 
            }
        },

        onkeyup : function(e) {
            switch(e.keyCode) {
                case 87: //w
                case 38: //up arrow
                case 83: //s
                case 40: //down arrow
                    this._speed.y = 0;
                    break;
                case 65: //a
                case 37: //left arrow
                case 68: //d
                case 39: //right arrow
                    this._speed.x = 0;
                    break; 
            }
        },

        onmousedown : function(e) {
            if (e.button == 0) {
                if (this._isAim) {
                    this._isFire = true;
                    fireParticle.play();
                }
            } else if (e.button == 2) {
                this._isAim = true;
                this._applyOrientationChange();
            }
        },

        onmouseup : function(e) {
            if (e.button == 0) {
                this._isFire = false;
                fireParticle.stop();
            } else if (e.button == 2) {
                this._isAim = false;
                this._isFire = false;
                this._applyOrientationChange();
            }
        },

        onunload : function() {
            app3D.animation.removeClip(this._finalClip);
            app3D.animation.removeClip(this._standingFireClip);
        }
    });

    return soldierEntity;
});