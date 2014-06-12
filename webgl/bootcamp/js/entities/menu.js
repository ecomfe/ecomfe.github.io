define(function (require) {
    
    var qtek = require('qtek');
    var app3D = require('../app');
    var Entity = require('framework/Entity');
    var ko = require('knockout');

    var html = '\
        <ul id="main-menu" class="menu" data-bind="foreach:currentMenuItems">\
            <li data-bind="text:title"></li>\
        </ul>\
    ';
    var dom = document.createElement('div');
    dom.innerHTML = html;

    var menuEntity = Entity.create({

        menuItems : [],

        currentMenuItems : ko.observableArray(),

        _menuFootprints : [],

        _menuDom : dom.children[0],

        _selectedIdx : 0,

        _isBinded : false,

        onload : function() {
            document.body.appendChild(this._menuDom);

            this.currentMenuItems(this.menuItems);
            if (!this._isBinded) {
                ko.applyBindings(this, this._menuDom);
                this._isBinded = true;
            }
            this._selectMenuItem();
        },

        onunload : function() {
            document.body.removeChild(this._menuDom);
        },

        _selectMenuItem : function() {
            var itemEls = this._menuDom.querySelectorAll('li');
            var idx = this._selectedIdx;
            if (itemEls[idx] !== undefined) {
                qtek.core.util.each(itemEls, function(el) {
                    el.classList.remove('active');
                });
                itemEls[idx].classList.add('active');
            }
        },

        _enterMenuItem : function() {
            var item = this.currentMenuItems()[this._selectedIdx];
            if (item.children) {
                this._menuFootprints.push(this.currentMenuItems());
                this.currentMenuItems(item.children);
                this._selectedIdx = 0;
                this._selectMenuItem();
            } else if (item.onenter) {
                item.onenter.call(this);
            }
        },

        onkeydown : function(e) {

            e.preventDefault();

            switch(e.keyCode) {
                case 87: //w
                case 38: //up arrow
                    this._selectedIdx = Math.max(this._selectedIdx - 1, 0);
                    this._selectMenuItem();
                    break;
                case 83: //s
                case 40: //down arrow
                    this._selectedIdx = Math.min(this._selectedIdx + 1, this.currentMenuItems().length - 1);
                    this._selectMenuItem();
                    break;
                case 13: //enter
                case 32: //space
                    this._enterMenuItem();
                    break;
                case 27: //esc
                case 8: //backspace
                    if (this._menuFootprints.length > 0) {
                        this.currentMenuItems(this._menuFootprints.pop());
                        this._selectedIdx = 0;
                        this._selectMenuItem();
                    }

                    break;
            }

            return false;
        }
    });

    return menuEntity;
})