/**
 * Created by ling on 2015/1/13.
 */
var stopEvent = function (evt) {
    evt = evt || window.event;

    if (evt.preventDefault) {
        evt.preventDefault();
        evt.stopPropagation();
    }
    if (evt.returnValue)
        evt.returnValue = false;
    if (evt.cancelBubble)
        evt.cancelBubble = true;
    return false;
};

String.prototype.trim = function () {
    return this.replace(/(^\s*)|(\s*$)/g, '');
};

String.prototype.lastChar = function () {
    return this.charAt(this.length - 1);
};

String.prototype.fristChar = function () {
    return this.charAt(0);
};

String.prototype.toUnicode = function () {
    var temp,
        i = 0,
        r = '',
        len = this.length;

    for (; i < len; i++) {
        temp = this.charCodeAt(i).toString(16);
        while (temp.length < 4)
            temp = '0' + temp;

        r += '\\u' + temp;
    }
    return r;
};
String.prototype.countOf = function (reg) {
    if (undefined !== reg)
        return (this.match(reg) || []).length;
    return 0;
};

String.prototype.countOfTab = function () {
    var reg = /\u0020{4}/g;
    return (this.match(reg) || []).length;
};

String.prototype.countOfTabEnter = function () {
    var reg = /\u0020{4}\u000a/g;
    return (this.match(reg) || []).length;
};

String.prototype.countOfTabInCloseTag = function () {
    var reg = /\u007b\u000a*\u0020{4}\u000a*\u007d/g;
    return (this.match(reg) || []).length;
};

var textareaMap = {};
var EditCommand = Undo.Command.extend({
    constructor: function (textarea, oldValue, newValue) {
        this.textarea = textarea;
        this.oldValue = oldValue;
        this.newValue = newValue;
    },
    execute: function () {
    },
    undo: function () {
        this.textarea.value = this.oldValue;
    },
    redo: function () {
        this.textarea.value = this.newValue;
    }
});

var tabFunc = function (evt) {
    evt = evt || window.event;
    var keyCode = evt.keyCode,
        tab = 9,
        enter = 13,
        key_y = 89,
        key_z = 90;
    var target = evt.target,
        stack = null,
        dataStep = null,
        selectionStart = -1,
        selectionEnd = -1,
        tabKey = '\u0020\u0020\u0020\u0020',
        doubleTabKey = tabKey + tabKey,
        enterKey = '\u000a',
        value = '',
        prefix = '',
        suffix = '';
    if (target && target.tagName === 'TEXTAREA') {
        if (null === target.getAttribute('data-step')) {
            target.setAttribute('data-step', new Date().getTime().toString());
        }
        dataStep = target.getAttribute('data-step');
        if (undefined === textareaMap[dataStep]) {
            stack = new Undo.Stack();
            textareaMap[dataStep] = stack;
        } else {
            stack = textareaMap[dataStep];
        }
        selectionStart = target.selectionStart;
        selectionEnd = target.selectionEnd;
        value = target.value;
        if (selectionStart < 0 || selectionEnd < 0) {
            return stopEvent(evt);
        } else {
            prefix = value.substring(0, selectionStart);
            suffix = value.substring(selectionEnd);
        }
    } else {
        return;
    }

    //tab
    if (keyCode === tab) {
        var _value = prefix + tabKey + suffix;

        selectionStart += 4;
        selectionEnd = selectionStart;
        target.value = _value;
        target.setSelectionRange(selectionStart, selectionEnd);
        stack.execute(new EditCommand(target, value, _value));
        return stopEvent(evt);
    }

    //enter
    if (keyCode === enter) {
        //{}
        var _value = '',
            frist = prefix.trim().lastChar(),
            last = suffix.trim().fristChar(),
            count = prefix.countOf(/\u000a/g);
        if (('\u003b' === frist || '\u0029' === frist || '\u007b' === frist) && '\u007d' === last) {
            if (count === 0) {
                _value = prefix + enterKey + tabKey + enterKey + suffix;
                selectionStart += 5;
            } else if (count > 0) {
                var tabs = prefix.substring(prefix.lastIndexOf('\u000a'), selectionStart).countOfTab(), i = 0, tabStr = '';
                for (; i < tabs; ++i) {
                    tabStr += tabKey;
                }
                _value += prefix;
                _value += enterKey;
                _value += tabStr;
                if ('\u003b' !== frist) {
                    _value += tabKey;
                    ++tabs;
                }
                if (enterKey !== suffix.fristChar()) {
                    _value += enterKey;
                    _value += tabStr;
                }
                _value += suffix;

                selectionStart += 1 + (tabs * 4);
            }
        } else {
            _value = prefix + enterKey + suffix;
            ++selectionStart;
        }

        selectionEnd = selectionStart;
        target.value = _value;
        target.setSelectionRange(selectionStart, selectionEnd);
        stack.execute(new EditCommand(target, value, _value));
        return stopEvent(evt);
    }

    //Ctrl+Z
    if (evt.ctrlKey === true && keyCode === key_z) {
        if (stack.canUndo()) {
            stack.undo();
        }
        return stopEvent(evt);
    }

    //Ctrl+y
    if (evt.ctrlKey === true && keyCode === key_y) {
        if (stack.canRedo()) {
            stack.redo();
        }
        return stopEvent(evt);
    }
};

window.document.addEventListener('keydown', tabFunc, false);