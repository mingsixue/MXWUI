import {createPulseController} from '../pulse';

const SIZE_LIST = ['small', 'medium', 'large'];

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
        size: {
            type: String,
            value: 'medium'
        },
        customStyle: {
            type: String,
            value: ''
        }
    },
    data: {
        showSkeleton: true,
        sizeClass: 'mx-skeleton-button-medium',
        pulseAni: null
    },
    observers: {
        'loading, animate, size': function () {
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
        _resolveSize(size) {
            if (SIZE_LIST.indexOf(size) >= 0) return size;
            return 'medium';
        },

        _sync() {
            const {loading, animate, size} = this.data;
            const showSkeleton = loading !== false;
            this.setData({
                showSkeleton,
                sizeClass: `mx-skeleton-button-${this._resolveSize(size)}`
            });
            if (!this._pulse) this._pulse = createPulseController(this);
            this._pulse.sync(!!animate, showSkeleton);
        }
    }
});
