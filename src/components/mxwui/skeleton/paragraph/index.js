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
        rows: {
            type: null,
            value: 3
        },
        customStyle: {
            type: String,
            value: ''
        }
    },
    data: {
        showSkeleton: true,
        rowList: [],
        pulseAni: null
    },
    observers: {
        'loading, animate, rows': function () {
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
        _resolveRows(rows) {
            const num = Number(rows);
            if (Number.isNaN(num) || num <= 0) return 0;
            return Math.min(Math.floor(num), 20);
        },

        _sync() {
            const {loading, animate, rows} = this.data;
            const showSkeleton = loading !== false;
            const count = this._resolveRows(rows);
            const rowList = [];
            for (let i = 0; i < count; i++) {
                rowList.push({
                    index: i,
                    last: i === count - 1 && count > 1
                });
            }

            this.setData({showSkeleton, rowList});
            if (!this._pulse) this._pulse = createPulseController(this);
            this._pulse.sync(!!animate, showSkeleton);
        }
    }
});
