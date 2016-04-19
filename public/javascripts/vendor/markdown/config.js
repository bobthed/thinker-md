/**
 * Created by ling on 2015/3/3.
 */
String.prototype.hashCode = function () {
    var hash = 0, i, chr, len;
    if (this.length === 0) return hash;
    for (i = 0, len = this.length; i < len; i++) {
        chr = this.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
};
hljs.configure({useBR: false});
hljs.initHighlightingOnLoad();

marked.setOptions({
    renderer: new marked.Renderer(),
    gfm: true,
    emoji: true,
    tables: true,
    breaks: false,
    pedantic: false,
    sanitize: true,
    smartLists: true,
    smartypants: false,
    highlight: _.memoize(function (code, lang) {
        try {
            if (lang)
                return hljs.highlight(lang, code).value;
        } catch (e) {
            return hljs.highlightAuto(code).value;
        }
        return hljs.highlightAuto(code).value;
    }, function (code, lang) {
        return (code || '').hashCode() + '_' + (lang || '').hashCode();
    })
});