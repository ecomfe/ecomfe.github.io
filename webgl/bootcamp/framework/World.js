// TODO : Put shadow config, compositor config, physic config here
define(function(require) {
    
    var qtek = require('qtek');

    var Entity = require('./Entity');

    var World = qtek.core.Base.derive(function() {
        return {

            name : '',

            scene : new qtek.Scene(),

            camera : new qtek.camera.Perspective(),

            entities : [],
            
            graphicConfig : {},

            _$loadingTask : null,

            _$textureLoaded : false,

            _$initialized : false,
        }
    }, function() {
        if (!this.name) {
            this.name = 'WORLD_' + this.__GUID__;
        }
    }, {

        $loadSelf : function() {
            var tasks = [];
            var self = this;
            for (var i = 0; i < this.entities.length; i++) {
                var entity = this.entities[i];
                var task = entity.$loadSelf();
                if (task) {
                    tasks.push(task);
                }
            }
            if (tasks.length > 0) {
                var taskGroup = new qtek.async.TaskGroup();
                taskGroup.all(tasks);
                taskGroup.success(function() {
                    self._$init2();
                })
                this._$loadingTask = taskGroup;
                return taskGroup;
            } else {
                self._$init2();
            }
        },

        _$init2 : function() {
            if (this._$loadingTask) {
                this._$progress();
            }
            this._$loadingTask = null;
            this._$initialized = true;
            this._$loadingTextures();
            this.trigger('load');
        },

        $unloadSelf : function() {
            for (var i = 0; i < this.entities.length; i++) {
                var entity = this.entities[i];
                entity.$unloadSelf();
            }
            this._$initialized = false;
            this._$textureLoaded = false;
            this.trigger('unload');
        },

        $frame : function(deltaTime) {
            if (this._$initialized) {
                if (!this._$textureLoaded) {
                    this._$textureProgress();
                }
                this.trigger('frame', deltaTime);
            } else {
                this._$progress();
            }
        },

        _$loadingTextures : function() {
            var textures = [];
            var self = this;
            for (var i = 0; i < this.entities.length; i++) {
                var entity = this.entities[i];
                for (var j = 0; j < entity.textures.length; j++) {
                    var texture = entity.textures[j];
                    if (!texture.isRenderable()) {
                        textures.push(entity.textures[j]);
                    }
                }
            }
            if (textures.length > 0) {
                var taskGroup = new qtek.async.TaskGroup();
                taskGroup.allSettled(textures);
                taskGroup.success(function() {
                    self._$textureProgress();
                    self._$loadingTask = null;
                    self._$textureLoaded = true;
                    self.trigger('textureload');
                });
                this._$loadingTask = taskGroup;
            } else {
                this._$textureLoaded = true;
            }
        },

        _$progress : function() {
            var nTask = this._$loadingTask.getTaskNumber(true);
            var nSettled = this._$loadingTask.getSettledNumber(true);
            this.trigger('progress', nSettled / nTask, nSettled, nTask);
        },

        _$textureProgress : function() {
            var nTask = this._$loadingTask.getTaskNumber(true);
            var nSettled = this._$loadingTask.getSettledNumber(true);
            this.trigger('textureprogress', nSettled / nTask, nSettled, nTask);
        }
    });

    World.events = [
        'load',
        'progress',
        'textureload',
        'textureprogress',
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

    World.create = function(opts) {
        
        var events = {};

        for (var i = 0; i < World.events.length; i++) {
            var eventName = World.events[i];
            var e = opts['on' + eventName];
            if (e) {
                events[eventName] = e;
                delete opts['on' + eventName];
            }
        }

        var world = new World(opts);
        for (var name in events) {
            world.on(name, events[name]);
        }

        return world;
    }

    return World;
})