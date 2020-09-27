
// let getWebRoot = function() {
//     var contextPath = document.location.pathname;
//     var end = contextPath.substr(1).indexOf('/') + 1;
//     return contextPath.substr(0, end);
// };

/**
 * 检验空字符串
 * @param str
 * @returns {boolean}
 */
//eslint-disable-line
let isNullStr = (str) => {
    if (undefined===str
        || str.trim().length===0
        || str.trim().toLowerCase()==='null') {
        return true;
    }
    return false;
};

// let removeSpace = (str) => {
//     return str.replace(/ +/g,' ').replace(/^ | $/g,'');
// }

/**
 * 是否在第一、四象限
 * @param link
 * @returns {boolean}
 */
let isFirstQuadrant = (link) => {
    var m = [link.source.x, link.source.y];
    var l = [link.target.x, link.target.y];
    let fx = m.getDirection(l);
    let arr = ['U','R','RU','RD'];
    return arr.indexOf(fx) > -1;
};

export default {
    'isNullStr': isNullStr,
    'isFirstQuadrant': isFirstQuadrant
};