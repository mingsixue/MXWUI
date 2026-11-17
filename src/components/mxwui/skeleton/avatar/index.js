import {createPulseController} from '../pulse';

const SHAPE_LIST = ['circle', 'square'];
const SIZE_LIST = ['x-small', 'small', 'medium', 'large'];

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
        shape: {
            type: String,
            value: 'square'
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
        sizeClass: 'mx-skeleton-avatar-medium',
        shapeClass: 'mx-skeleton-avatar-square',
        sizeStyle: '',
        pulseAni: null
    },
    observers: {
        'loading, animate, shape, size, customStyle': function () {
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
        _resolveShape(shape) {
            if (SHAPE_LIST.indexOf(shape) >= 0) return shape;
            return 'square';
        },

        _resolveSize(size) {
            if (SIZE_LIST.indexOf(size) >= 0) {
                return {preset: size, style: ''};
            }
            if (typeof size === 'string' && size.trim()) {
                const val = size.trim();
                return {preset: '', style: `width:${val};height:${val};`};
            }
            return {preset: 'medium', style: ''};
        },

        _sync() {
            const {loading, animate, shape, size, customStyle} = this.data;
            const showSkeleton = loading !== false;
            const sizeInfo = this._resolveSize(size);

            this.setData({
                showSkeleton,
                sizeClass: sizeInfo.preset ? `mx-skeleton-avatar-${sizeInfo.preset}` : '',
                shapeClass: `mx-skeleton-avatar-${this._resolveShape(shape)}`,
                sizeStyle: `${sizeInfo.style}${customStyle || ''}`
            });

            if (!this._pulse) this._pulse = createPulseController(this);
            this._pulse.sync(!!animate, showSkeleton);
        }
    }
});
