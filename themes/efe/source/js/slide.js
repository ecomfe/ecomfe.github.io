function Slide(wrap, options) {
    this.wrap = wrap;

    options = options || {};
    this.gapTime = options.gapTime || 5000;
    this.step = options.step || 20;
    this.transitionTime = options.transitionTime || 300;

    var items = wrap.getElementsByTagName('li');
    this.items = [];
    for (var i = 0, l = items.length; i < l; i++) {
        this.items.push(items[i]);
        items[i].style.opacity = (i === 0 ? 1 : 0);
    }

    var tip = document.createElement('span');
    tip.className = 'slide-tip';
    tip.style.display = 'none';
    wrap.appendChild(tip);
    this.tip = tip;

    this.current = 0;
    this.initButton();
    this.updateTip();
    this.nextLater();
}

Slide.prototype.initButton = function () {
    if (this.items.length < 2) {
        return;
    }

    var prev = document.createElement('span');
    var next = document.createElement('span');;

    prev.className = 'slide-prev';
    next.className = 'slide-next';
    prev.innerHTML = '\uf104';
    next.innerHTML = '\uf105';
    this.wrap.appendChild(prev);
    this.wrap.appendChild(next);

    var me = this;
    prev.onselectstart = next.onselectstart = function () { return false; };
    prev.onclick = function () {
        me.transit(me.current, me.current - 1);
    };
    next.onclick = function () {
        me.transit(me.current, me.current + 1);
    };

    prev = next = null;
};

Slide.prototype.updateTip = function () {
    var len = this.items.length;
    if (len > 1) {
        this.tip.style.display = '';
        this.tip.innerHTML = this.current + 1 + '/' + len;
    }
};

Slide.prototype.nextLater = function () {
    var me = this;

    me.nextTimeout = setTimeout(
        function () {
            me.transit(me.current, me.current + 1);
        }, 
        me.gapTime
    );
};

Slide.prototype.transit = function (from, to) {
    if (this.transiting) {
        return;
    }

    if (to >= this.items.length) {
        to = 0;
    }

    if (to < 0) {
        to = this.items.length - 1;
    }

    if (from === to) {
        return;
    }

    this.transiting = 1;
    this.current = to;
    this.updateTip();
    var me = this;
    var timeout = me.transitionTime / me.step;
    var currentStep = 0;

    function nextStep() {
        me.items[from].style.opacity = 1 - currentStep / me.step;
        me.items[to].style.opacity = currentStep / me.step;
        currentStep++;


        if (currentStep <= me.step) {
            setTimeout(nextStep, timeout);
        }
        else {
            me.nextLater();
            me.transiting = 0;
        }
    }

    clearTimeout(this.nextTimeout);
    nextStep();
};