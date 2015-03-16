/**
 * Created by ling on 2015/3/2.
 */

$("textarea[data-provide='markdown']").markdown({
    language: 'zh',
    fullscreen: {
        enable: true
    },
    imgurl: 'http://192.168.1.142:8080/upload',
    base64url: 'http://192.168.1.142:8080/base64'
});