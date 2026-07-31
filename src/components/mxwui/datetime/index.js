import {COLOR, hexToRGBA} from '../utils/common';

const MONTH = 12;
const HOUR = 24;
const MINUTE = 60;
const SECONDS = 60;

Component({
    properties: {
        // 是否显示
        visible: {
            type: Boolean,
            value: false,
            observer(newVal) {
                if (newVal) {
                    this.init();
                } else {
                    this.setData({pickerReady: false});
                }
            }
        },
        // 默认时间 YYYY-MM-DD HH:mm
        value: {
            type: String,
            value: ''
        },
        // 最小日期 YYYY-MM-DD[ HH[:mm[:ss]]]
        minDate: {
            type: String,
            value: ''
        },
        // 最大日期 YYYY-MM-DD[ HH[:mm[:ss]]]
        maxDate: {
            type: String,
            value: ''
        },
        // 分钟步长
        minuteStep: {
            type: Number,
            value: 1
        },
        // 是否显示年
        showYear: {
            type: Boolean,
            value: true
        },
        // 是否显示小时
        showHour: {
            type: Boolean,
            value: true
        },
        // 是否显示分
        showMinute: {
            type: Boolean,
            value: true
        },
        // 是否显示秒
        showSeconds: {
            type: Boolean,
            value: false
        },
        // 年-文案
        yearSuffix: {
            type: String,
            value: '年'
        },
        // 月-文案
        monthSuffix: {
            type: String,
            value: '月'
        },
        // 日-文案
        daySuffix: {
            type: String,
            value: '日'
        },
        // 小时-文案
        hourSuffix: {
            type: String,
            value: '时'
        },
        // 分钟-文案
        minuteSuffix: {
            type: String,
            value: '分'
        },
        // 秒-文案
        secondsSuffix: {
            type: String,
            value: '秒'
        },
        // 最小年份限制
        minYearLimit: {
            type: Number,
            value: 1970
        },
        // 最大年份限制
        maxYearLimit: {
            type: Number,
            value: 0
        },
        // 标题
        title: {
            type: String,
            value: ''
        },
        // 取消按钮文案
        cancelText: {
            type: String,
            value: '取消'
        },
        // 取消按钮文本色
        cancelColor: {
            type: String,
            value: COLOR.PLACEHOLDER_COLOR
        },
        // 确定按钮文案
        confirmText: {
            type: String,
            value: '确定'
        },
        // 确定按钮文本色
        confirmColor: {
            type: String,
            value: COLOR.THEME_COLOR
        },
        // 层级
        zIndex: {
            type: Number,
            value: 1
        },
        // 点击蒙层是否可以关闭弹窗
        isCloseMask: {
            type: Boolean,
            value: true
        },
    },
    data: {
        pickerReady: false,
        years: [],
        months: [],
        days: [],
        hours: [],
        minutes: [],
        seconds: [],
        currentIndex: [],
    },
    lifetimes: {
        ready() {
            if (!this.data.bgColor) {
                this.setData({
                    bgColor: hexToRGBA(COLOR.THEME_COLOR, 0.15)
                });
            }
        },
        detached() {
            this.clearIndexTimer();
        },
    },
    methods: {
        clearIndexTimer() {
            if (this._indexTimer) {
                clearTimeout(this._indexTimer);
                this._indexTimer = null;
            }
        },

        // 解析边界日期，空值返回 null
        getBoundDate(dateStr) {
            if (!dateStr) return null;
            return this.dealDate(dateStr);
        },

        // 将日期对象转为可比较时间戳
        dateToTime(dateObj) {
            if (!dateObj) return 0;
            return new Date(
                dateObj.year,
                (dateObj.monthStr || dateObj.month + 1) - 1,
                dateObj.day,
                dateObj.hour || 0,
                dateObj.minute || 0,
                dateObj.seconds || 0
            ).getTime();
        },

        // 将选中值限制在 minDate / maxDate 范围内
        clampToRange(dateObj, min, max) {
            let result = {...dateObj};
            if (min && this.dateToTime(result) < this.dateToTime(min)) {
                result = {...min};
            }
            if (max && this.dateToTime(result) > this.dateToTime(max)) {
                result = {...max};
            }
            return result;
        },

        // 按当前选中值与边界生成各列数据
        buildColumns(selected) {
            const {showYear, showHour, showMinute, showSeconds, minYearLimit, maxYearLimit} = this.data;
            const min = this.getBoundDate(this.data.minDate);
            const max = this.getBoundDate(this.data.maxDate);
            const nowYear = new Date().getFullYear();

            let minY = Number(minYearLimit) || 1970;
            let maxY = Number(maxYearLimit) || (selected.year || nowYear) + 20;
            if (min) minY = min.year;
            if (max) maxY = max.year;
            if (maxY < minY) maxY = minY;

            let years = [];
            if (showYear) {
                years = this.dealYear(selected, minY, maxY).list;
            }

            const year = selected.year || nowYear;
            const atMinYear = !!(min && year === min.year);
            const atMaxYear = !!(max && year === max.year);

            let monthStart = 1;
            let monthEnd = MONTH;
            if (atMinYear) monthStart = min.monthStr;
            if (atMaxYear) monthEnd = max.monthStr;
            if (monthEnd < monthStart) monthEnd = monthStart;
            const months = this.rangeList(monthStart, monthEnd);

            let month = selected.monthStr;
            if (months.indexOf(month) < 0) {
                month = months[0];
            }

            const atMinMonth = atMinYear && month === min.monthStr;
            const atMaxMonth = atMaxYear && month === max.monthStr;

            const dayLimit = new Date(year, month, 0).getDate();
            let dayStart = 1;
            let dayEnd = dayLimit;
            if (atMinMonth) dayStart = min.day;
            if (atMaxMonth) dayEnd = Math.min(max.day, dayLimit);
            if (dayEnd < dayStart) dayEnd = dayStart;
            const days = this.rangeList(dayStart, dayEnd);

            let day = selected.day;
            if (days.indexOf(day) < 0) {
                day = days[0];
            }

            const atMinDay = atMinMonth && day === min.day;
            const atMaxDay = atMaxMonth && day === max.day;

            let hours = [];
            let minutes = [];
            let seconds = [];

            if (showHour) {
                let hourStart = 0;
                let hourEnd = HOUR - 1;
                if (atMinDay) hourStart = min.hour;
                if (atMaxDay) hourEnd = max.hour;
                if (hourEnd < hourStart) hourEnd = hourStart;
                hours = this.rangeList(hourStart, hourEnd);

                let hour = selected.hour;
                if (hours.indexOf(hour) < 0) {
                    hour = hours[0];
                }

                if (showMinute) {
                    const atMinHour = atMinDay && hour === min.hour;
                    const atMaxHour = atMaxDay && hour === max.hour;
                    const step = Number(this.data.minuteStep) || 1;

                    let minuteStart = 0;
                    let minuteEnd = MINUTE - 1;
                    if (atMinHour) minuteStart = min.minute;
                    if (atMaxHour) minuteEnd = max.minute;
                    if (minuteEnd < minuteStart) minuteEnd = minuteStart;
                    minutes = this.rangeList(minuteStart, minuteEnd, step);

                    let minute = selected.minute;
                    if (minutes.indexOf(minute) < 0) {
                        // 对齐到最近的可选分钟
                        minute = minutes.reduce((prev, cur) =>
                            Math.abs(cur - selected.minute) < Math.abs(prev - selected.minute) ? cur : prev
                        , minutes[0]);
                    }

                    if (showSeconds) {
                        const atMinMinute = atMinHour && minute === min.minute;
                        const atMaxMinute = atMaxHour && minute === max.minute;

                        let secondStart = 0;
                        let secondEnd = SECONDS - 1;
                        if (atMinMinute) secondStart = min.seconds;
                        if (atMaxMinute) secondEnd = max.seconds;
                        if (secondEnd < secondStart) secondEnd = secondStart;
                        seconds = this.rangeList(secondStart, secondEnd);
                    }
                }
            }

            return {years, months, days, hours, minutes, seconds, year, month, day};
        },

        // 生成闭区间列表，可选步长
        rangeList(start, end, step = 1) {
            const list = [];
            const s = Number(step) || 1;
            for (let i = start; i <= end; i += s) {
                list.push(i);
            }
            if (!list.length) list.push(start);
            return list;
        },

        findIdx(arr, value) {
            if (!arr || !arr.length) return 0;
            const idx = arr.indexOf(value);
            return idx >= 0 ? idx : 0;
        },

        clampIdx(idx, list) {
            if (!list.length) return 0;
            if (idx < 0) return 0;
            if (idx > list.length - 1) return list.length - 1;
            return idx;
        },

        buildCurrentIndex({
            showYear, showHour, showMinute, showSeconds,
            years, months, days, hours, minutes, seconds,
            year, month, day, hour, minute, second,
        }) {
            let currentYearIndex = 0;
            let currentMonthIndex = this.findIdx(months, month);
            let currentDayIndex = this.findIdx(days, day);
            let currentHourIndex = 0;
            let currentMinuteIndex = 0;
            let currentSecondsIndex = 0;

            if (showYear) {
                currentYearIndex = this.findIdx(years, year);
            }
            if (showHour) {
                currentHourIndex = this.findIdx(hours, hour);
            }
            if (showHour && showMinute) {
                currentMinuteIndex = this.findIdx(minutes, minute);
            }
            if (showHour && showMinute && showSeconds) {
                currentSecondsIndex = this.findIdx(seconds, second);
            }

            currentYearIndex = this.clampIdx(currentYearIndex, years);
            currentMonthIndex = this.clampIdx(currentMonthIndex, months);
            currentDayIndex = this.clampIdx(currentDayIndex, days);
            currentHourIndex = this.clampIdx(currentHourIndex, hours);
            currentMinuteIndex = this.clampIdx(currentMinuteIndex, minutes);
            currentSecondsIndex = this.clampIdx(currentSecondsIndex, seconds);

            const currentIndex = [];
            if (showYear) currentIndex.push(currentYearIndex);
            currentIndex.push(currentMonthIndex);
            currentIndex.push(currentDayIndex);
            if (showHour) currentIndex.push(currentHourIndex);
            if (showHour && showMinute) currentIndex.push(currentMinuteIndex);
            if (showHour && showMinute && showSeconds) currentIndex.push(currentSecondsIndex);

            return {
                currentIndex,
                currentYearIndex,
                currentMonthIndex,
                currentDayIndex,
                currentHourIndex,
                currentMinuteIndex,
                currentSecondsIndex,
            };
        },

        // 从 picker value 数组解析各列索引
        parsePickerValue(value) {
            const {showYear, showHour, showMinute, showSeconds} = this.data;
            let curYearIndex = 0;
            let curMonthIndex = 0;
            let curDayIndex = 0;
            let curHourIndex = 0;
            let curMinuteIndex = 0;
            let curSecondsIndex = 0;

            if (value.length == 6) {
                curYearIndex = value[0];
                curMonthIndex = value[1];
                curDayIndex = value[2];
                curHourIndex = value[3];
                curMinuteIndex = value[4];
                curSecondsIndex = value[5];
            } else if (value.length == 5) {
                if (showYear) {
                    curYearIndex = value[0];
                    curMonthIndex = value[1];
                    curDayIndex = value[2];
                    curHourIndex = value[3];
                    curMinuteIndex = value[4];
                } else if (showSeconds) {
                    curMonthIndex = value[0];
                    curDayIndex = value[1];
                    curHourIndex = value[2];
                    curMinuteIndex = value[3];
                    curSecondsIndex = value[4];
                }
            } else if (value.length == 4) {
                if (showYear) {
                    curYearIndex = value[0];
                    curMonthIndex = value[1];
                    curDayIndex = value[2];
                    curHourIndex = value[3];
                } else {
                    curMonthIndex = value[0];
                    curDayIndex = value[1];
                    curHourIndex = value[2];
                    curMinuteIndex = value[3];
                }
            } else if (value.length == 2) {
                curMonthIndex = value[0];
                curDayIndex = value[1];
            } else if (value.length == 3 && showYear) {
                curYearIndex = value[0];
                curMonthIndex = value[1];
                curDayIndex = value[2];
            } else if (value.length == 3 && showHour) {
                curMonthIndex = value[0];
                curDayIndex = value[1];
                curHourIndex = value[2];
            }

            return {
                curYearIndex,
                curMonthIndex,
                curDayIndex,
                curHourIndex,
                curMinuteIndex,
                curSecondsIndex,
            };
        },

        init() {
            let {showYear, showHour, showMinute, showSeconds, value} = this.data;

            let nowDate = this.dealDate(value);
            const min = this.getBoundDate(this.data.minDate);
            const max = this.getBoundDate(this.data.maxDate);
            nowDate = this.clampToRange(nowDate, min, max);

            const columns = this.buildColumns(nowDate);
            const {
                years, months, days, hours, minutes, seconds,
            } = columns;

            const indices = this.buildCurrentIndex({
                showYear, showHour, showMinute, showSeconds,
                years, months, days, hours, minutes, seconds,
                year: nowDate.year,
                month: nowDate.monthStr,
                day: nowDate.day,
                hour: nowDate.hour,
                minute: nowDate.minute,
                second: nowDate.seconds,
            });

            this.clearIndexTimer();
            // iOS：先准备数据再挂载 picker-view，避免列空白
            this.setData({
                pickerReady: false,
                years,
                months,
                days,
                hours,
                minutes,
                seconds,
                ...indices,
                currentIndex: [],
            }, () => {
                this._indexTimer = setTimeout(() => {
                    this._indexTimer = null;
                    this.setData({
                        pickerReady: true,
                        currentIndex: indices.currentIndex,
                    });
                }, 50);
            });
        },

        changeIdx(e) {
            let {value} = e.detail;
            const {showYear, showHour, showMinute, showSeconds, years = []} = this.data;
            const {
                curYearIndex,
                curMonthIndex,
                curDayIndex,
                curHourIndex,
                curMinuteIndex,
                curSecondsIndex,
            } = this.parsePickerValue(value);

            const prevMonths = this.data.months || [];
            const prevDays = this.data.days || [];
            const prevHours = this.data.hours || [];
            const prevMinutes = this.data.minutes || [];
            const prevSeconds = this.data.seconds || [];

            let year = showYear
                ? (years[curYearIndex] || new Date().getFullYear())
                : new Date().getFullYear();
            let month = prevMonths[curMonthIndex] || 1;
            let day = prevDays[curDayIndex] || 1;
            let hour = prevHours[curHourIndex] || 0;
            let minute = prevMinutes[curMinuteIndex] || 0;
            let second = prevSeconds[curSecondsIndex] || 0;

            // 用当前选中值重建可选列（边界联动）
            const columns = this.buildColumns({
                year,
                monthStr: month,
                day,
                hour,
                minute,
                seconds: second,
            });

            const {
                years: nextYears,
                months: nextMonths,
                days: nextDays,
                hours: nextHours,
                minutes: nextMinutes,
                seconds: nextSeconds,
            } = columns;

            // 选中值若因边界裁剪失效，回落到列首项
            if (nextMonths.indexOf(month) < 0) month = nextMonths[0];
            if (nextDays.indexOf(day) < 0) day = nextDays[0];
            if (showHour && nextHours.indexOf(hour) < 0) hour = nextHours[0] || 0;
            if (showHour && showMinute && nextMinutes.indexOf(minute) < 0) minute = nextMinutes[0] || 0;
            if (showHour && showMinute && showSeconds && nextSeconds.indexOf(second) < 0) {
                second = nextSeconds[0] || 0;
            }

            const indices = this.buildCurrentIndex({
                showYear, showHour, showMinute, showSeconds,
                years: nextYears,
                months: nextMonths,
                days: nextDays,
                hours: nextHours,
                minutes: nextMinutes,
                seconds: nextSeconds,
                year,
                month,
                day,
                hour,
                minute,
                second,
            });

            this.setData({
                years: nextYears,
                months: nextMonths,
                days: nextDays,
                hours: nextHours,
                minutes: nextMinutes,
                seconds: nextSeconds,
                ...indices,
            });
        },

        // 手动解析日期，避免 iOS 对 Date 字符串解析不一致导致年/日列为空
        parseDateString(dateStr) {
            if (!dateStr) return null;
            const raw = String(dateStr).trim().replace(/\//g, '-');
            // YYYY-MM-DD[ HH[:mm[:ss]]]
            let match = raw.match(
                /^(\d{4})-(\d{1,2})-(\d{1,2})(?:\s+(\d{1,2})(?::(\d{1,2})(?::(\d{1,2}))?)?)?$/
            );
            if (match) {
                return {
                    year: Number(match[1]),
                    month: Number(match[2]),
                    day: Number(match[3]),
                    hour: Number(match[4] || 0),
                    minute: Number(match[5] || 0),
                    seconds: Number(match[6] || 0),
                };
            }
            // MM-DD[ HH[:mm[:ss]]]
            match = raw.match(
                /^(\d{1,2})-(\d{1,2})(?:\s+(\d{1,2})(?::(\d{1,2})(?::(\d{1,2}))?)?)?$/
            );
            if (match) {
                return {
                    year: new Date().getFullYear(),
                    month: Number(match[1]),
                    day: Number(match[2]),
                    hour: Number(match[3] || 0),
                    minute: Number(match[4] || 0),
                    seconds: Number(match[5] || 0),
                };
            }
            return null;
        },

        // 日期分解
        dealDate(dateStr) {
            const now = new Date();
            let year = now.getFullYear();
            let month = now.getMonth(); // 0-based
            let day = now.getDate();
            let hour = now.getHours();
            let minute = now.getMinutes();
            let seconds = now.getSeconds();

            if (dateStr) {
                const {showYear} = this.data;
                let normalized = String(dateStr).trim();
                if (!showYear && !/^\d{4}[-/]/.test(normalized)) {
                    normalized = `${year}-${normalized}`;
                }
                const parsed = this.parseDateString(normalized);
                if (parsed) {
                    year = parsed.year;
                    month = parsed.month - 1;
                    day = parsed.day;
                    hour = parsed.hour;
                    minute = parsed.minute;
                    seconds = parsed.seconds;
                } else {
                    // 兜底：补齐时分秒后再尝试一次原生解析
                    let fallback = normalized.replace(/-/g, '/');
                    if (!/\d:\d/.test(fallback)) {
                        fallback = `${fallback} 00:00:00`;
                    } else if (!/:\d{1,2}:\d{1,2}$/.test(fallback) && / \d{1,2}:\d{1,2}$/.test(fallback)) {
                        fallback = `${fallback}:00`;
                    }
                    const date = new Date(fallback);
                    if (!Number.isNaN(date.getTime())) {
                        year = date.getFullYear();
                        month = date.getMonth();
                        day = date.getDate();
                        hour = date.getHours();
                        minute = date.getMinutes();
                        seconds = date.getSeconds();
                    }
                }
            }

            // 校正非法日（如 2 月 31）
            const dayLimit = new Date(year, month + 1, 0).getDate();
            if (day > dayLimit) {
                day = dayLimit;
            }

            return {
                year,
                month,
                monthStr: month + 1,
                day,
                hour,
                minute,
                seconds,
                dayLimit,
            };
        },
        // 年处理
        dealYear(date, minYearLimit, maxYearLimit) {
            let years = [];
            let currentYearIndex = 0;
            let yearLimit = maxYearLimit - minYearLimit + 1;
            if (!Number.isFinite(yearLimit) || yearLimit <= 0) {
                yearLimit = 1;
                minYearLimit = date.year || new Date().getFullYear();
            }
            for (let i = 0; i < yearLimit; i++) {
                let year = i + minYearLimit;
                years.push(year);
                if (date.year == year) {
                    currentYearIndex = i;
                }
            }
            return {
                list: years,
                currentYearIndex
            };
        },
        handleMask() {
            if (this.data.isCloseMask) {
                this.setData({
                    visible: false,
                    pickerReady: false,
                });
                this.triggerEvent("datetime_close", {type: 'close'});
            }
        },
        handleCancel() {
            this.setData({
                visible: false,
                pickerReady: false,
            });
            this.triggerEvent("datetime_close", {type: 'cancel'});
        },
        handleConfirm() {
            const {
                years = [],
                months = [],
                days = [],
                hours = [],
                minutes = [],
                seconds = [],
                showYear,
                showHour,
                showMinute,
                showSeconds,
                currentYearIndex,
                currentMonthIndex,
                currentDayIndex,
                currentHourIndex,
                currentMinuteIndex,
                currentSecondsIndex
            } = this.data;

            let date = [];
            let time = [];

            if (showYear) {
                let year = years[currentYearIndex];
                if (year) {
                    date.push(year);
                }
            }

            let month = months[currentMonthIndex];
            if (month) {
                month = month < 10 ? `0${month}` : month;
                date.push(month);
            }

            let day = days[currentDayIndex];
            if (day) {
                day = day < 10 ? `0${day}` : day;
                date.push(day);
            }

            if (showHour) {
                let hour = hours[currentHourIndex];
                hour = hour < 10 ? `0${hour}` : hour;
                time.push(hour);
            }

            if (showMinute) {
                let minute = minutes[currentMinuteIndex];
                minute = minute < 10 ? `0${minute}` : minute;
                time.push(minute);
            }

            if (showSeconds) {
                let second = seconds[currentSecondsIndex];
                second = second < 10 ? `0${second}` : second;
                time.push(second);
            }

            let value = date.join('-');
            if (time.length) {
                value = `${value} ${time.join(':')}`;
            }

            this.setData({
                visible: false,
                pickerReady: false,
            });
            this.triggerEvent("datetime_confirm", {value: value});
        },
    }
});
