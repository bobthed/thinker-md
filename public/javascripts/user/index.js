/**
 * Created by ling on 2015/3/2.
 */

$("#md").markdown({
    language: 'zh',
    fullscreen: {
        enable: true
    },
    resize:'vertical',
    localStorage:'md',
    imgurl: 'http://192.168.1.142:8080/upload',
    base64url: 'http://192.168.1.142:8080/base64'
});
