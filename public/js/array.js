/**
 * 获取元素
 * @param index
 * @returns {*}
 */
Array.prototype.get = function(index) {
    try {
        let self = this;
        if (undefined == index
            || parseInt(index) < 0 || parseInt(index) > self.length) {
            return self[0];
        }
        return self[parseInt(index)];
    } catch (err) {
        return self[0];
    }
}

/**
 * 移除元素
 * @param indexs 下标集合
 */
Array.prototype.remove = function(indexs) {
    if (undefined == indexs || indexs.length<1) {
        return;
    }
    let self = this;
    let arr = indexs.sort(function(m,n){return m-n;}).reverse();
    arr.forEach(function(index){
        self.splice(index, 1);
    });
}

/**
 * 排序-倒序
 */
Array.prototype.sortDesc = function() {
    let self = this;
    return self.sort().reverse();
}

/**
 * 获取两个平面坐标点的直线距离
 * @param xy Array
 * @returns {number}
 */
Array.prototype.getDistance = function(xy) {
    let x1 = this[0];
    let y1 = this[1];
    let x2 = xy[0];
    let y2 = xy[1];
    return Math.sqrt(Math.pow(x1-x2, 2) + Math.pow(y1-y2, 2));
}

/**
 * 获取正/反方向
 * @param xy Array
 * @returns {string} {U:'上', D:'下', L:'左', R:'右'}
 */
Array.prototype.getDirection = function(xy) {
    let x1 = this[0];
    let y1 = this[1];
    let x2 = xy[0];
    let y2 = xy[1];
    let fx = '';
    if (x1>x2 && y1<y2) {
        fx = 'RU'; //右上5
    } else if (x1>x2 && y1>y2) {
        fx = 'RD'; //右下6
    } else if (x1<x2 && y1<y2) {
        fx = 'LU'; //左上7
    } else if (x1<x2 && y1>y2) {
        fx = 'LD'; //左下8
    } else if (x1==x2 && y1<y2) {
        fx = 'U'; //上1
    } else if (x1==x2 && y1>y2) {
        fx = 'D'; //下2
    } else if (x1<x2 && y1==y2) {
        fx = 'L'; //左3
    } else if (x1>x2 && y1==y2) {
        fx = 'R'; //右4
    }
    return fx;
    // return ['U','R','RU','RD'].indexOf(fx) > -1;
}

/**
 * 是否在平面矩阵
 * @param domain 二维坐标[[x,y],[x,y]]
 * @returns {boolean}
 */
Array.prototype.in = function(domain) {
    // domain[0][0]<=d.x && d.x<domain[1][0] && domain[0][1]<=d.y && d.y<domain[1][1]
    let x = this[0];
    let y = this[1];
    let a0 = domain[0];
    let a1 = domain[1];
    return a0[0] <= x && x < a1[0] && a0[1] <= y && y < a1[1];
}

/**
 * 放大/缩小
 * @param double 倍数
 * @returns {Array}
 */
Array.prototype.shrink = function(double) {
    if (undefined == double || typeof(double)!='number') {
        return this;
    }
    var self = this;
    self.forEach(function(item, index){
        self[index] = item * double;
    });
    return self;
}