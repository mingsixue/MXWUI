import {createPulseController} from '../pulse';

Component({
    properties: {
        loading: {
            type: Boolean,
            value: true
        },
        animate: {
            type: Boolean,
            value: false
        },
        customStyle: {
            type: String,
            value: ''
        }
    },
    data: {
        showSkeleton: true,
        pulseAni: null
    },
    observers: {
        'loading, animate': function () {
            this._sync();
        }
    },
    lifetimes: {
        attached() {
            this._pulse = createPulseController(this);
            this._sync();
        },
        detached() {
            if (this._pulse) this._pulse.stop();
        }
    },
    methods: {
        _sync() {
            const {loading, animate} = this.data;
            const showSkeleton = loading !== false;
            this.setData({showSkeleton});
            if (!this._pulse) this._pulse = createPulseController(this);
            this._pulse.sync(!!animate, showSkeleton);
        }
    }
});
