define(function(require) {

    var qtek = require('qtek');
    var Entity = require('./Entity');

    var EntityPlugin = qtek.core.Base.derive({
        entity : null
    }, {

        enable : function() {
            var self = this;
            if (this.entity) {
                Entity.events.forEach(function(name) {
                    var handler = this['on' + name];
                    if (handler) {
                        this.entity.on(name, handler, self);
                    }
                }, this);
            }
        },
        disable : function() {
            if (this.entity) {
                Entity.events.forEach(function(name) {
                    var handler = this['on' + name];
                    if (handler) {
                        this.entity.off(name, handler);
                    }
                }, this);
            }
        },
        // Hookers
        onload : null,
        onframe : null,
        onmousedown : null,
        onkeydown : null,
        onkeypress : null,
        onkeyup : null,
        onmousemove : null,
        onclick : null
    });

    return EntityPlugin;
})