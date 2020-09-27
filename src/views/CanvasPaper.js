import React, { Component } from 'react';
import Menus from './Menus';
import geo from './comm/ForceUtil';
import './../assets/css/CanvasPaper.css';

const d3 = window.d3;
class CanvasPaper extends Component {
    constructor(props){
        super(props);
        this.state = {
            id: '#board',
            size: {
                width: document.documentElement.clientWidth,
                height: document.documentElement.clientHeight,
                rectWidth: document.documentElement.clientWidth * 10,
                rectHeight: document.documentElement.clientHeight * 10
            },
            color: {
                node_master: "#FCD209", //主节点
                node_comm: "#2E89FB", //1
                node_girl: "#EEB8DB", //2
                node_module: "#C8C8C8", //模型节点
                bg: "white", //背景
                nodetext: "#666666", //节点文字
                linetext: "#999999", //线上文字
                lines: ["#9CC7D8", "#F3AF4F", "red"], //线 手动创建 选中
                colors: d3.scaleOrdinal().domain(d3.range(10)).range(d3.schemeCategory10) //颜色集
            },
            node: {
                main: 39,
                r: 20,
                icon: 18,
                distance: 120,
                iconpath: './img/icons/'
            },
            enable: {
                highlight: true, //高亮
                nodetext: true, //节点文字
                relationship: true, //关系
                score: true, //分值
                nodetag: true, //标签
            },
            scaleExtent: [0.2, 6], //缩放最小最大范围
            scale: 1, //缩放比例
            translate: [0, 0], //平移坐标
            ctrlKey: false,
            shiftKey: false,
            checkedNode: null //选中的节点
        };
        this.state.node.border = (this.state.node.r-this.state.node.icon)*2;
    };
    /**画布*/
    paper;
    /**forceSvg容器*/
    svg;
    simulation;
    /**刷子*/
    bursher;
    /**顶点*/
    nodes = [];
    /**边*/
    links = [];
    _links_container = [];
    _nodes_container = [];

    init = () => {
        this.paper = d3.select(this.state.id)
            .attr("tabindex", 1)
            .on("keydown.brush", this.bindKeydown)
            .on("keyup.brush", this.bindKeyup)
            .each(function(){ this.focus(); })
            .append("svg")
            .attr("id", "svg")
            .attr("pointer-events", "all")
            .attr("xmlns", "http://www.w3.org/2000/svg")
            .attr("xmlns:xlink", "http://www.w3.org/1999/xlink")
            .attr("width", this.state.size.width)
            .attr("height", this.state.size.height);
        this.createDefs();
        this.createRect();
        this.bursher = this.createBrush();
        this.createContainer();
        this.renderForceSimulation();
    }
    createDefs = () => {
        //五角星
        this.paper.append("symbol").append("path")
            .attr("id", "zdry_")
            .attr("class", "starpath")
            .attr("stroke", "none")
            .attr("d", "M25,-25 L19,-7 L35,-18 L15,-18 L31,-7 z");
        //箭头
        this.paper.append("defs").selectAll(".markerend")
            .data(this.state.color.lines)
            .enter()
            .append("marker")
            .attr("class", "markerend")
            .attr("id", function(d,i){return "arrow_"+i;})
            .attr("markerUnits", "strokeWidth") //设置为strokeWidth箭头会随着线的粗细发生变化
            //.attr("markerUnits", "userSpaceOnUse")
            .attr("markerWidth", "12")
            .attr("markerHeight", "12")
            .attr("refX", "50")
            .attr("refY", "6")
            .attr("orient", "auto") //绘制方向，可设定为：auto（自动方向）和角度值
            .append("path")
            .attr("fill", function(d,i){return d;})
            .attr("d", "M2,2 L10,6 L2,10 L6,6 L2,2"); //箭头路径
        d3.select("defs").selectAll(".markerstart")
            .data(this.state.color.lines)
            .enter()
            .append("marker")
                .attr("class", "markerstart")
                .attr("id", function(d,i){return "arrowstart_"+i;})
                .attr("markerUnits", "strokeWidth")
                .attr("markerWidth", "12")
                .attr("markerHeight", "12")
                .attr("refX", "-50")
                .attr("refY", "6")
                .attr("orient", "auto")
            .append("path")
                .attr("fill", function(d,i){return d;})
                .attr("d", "M10,2 L2,6 L10,10 L6,6 Z");
    }
    createRect = () => {
        this.paper.append("g").attr("class","g-rect")
            .on("dblclick.zoom", null)
            .append("rect")
            .attr("width", this.state.size.rectWidth)
            .attr("height", this.state.size.rectHeight)
            .attr("x", -this.state.size.rectWidth/2)
            .attr("y", -this.state.size.rectHeight/2)
            .attr("opacity", 0);
        this.zoomListener(true);
    }
    createBrush = () => {
        this.paper.append("g").attr("class","g-brush");
        let self = this;
        //设置或获取刷取操作的可刷取范围
        let extent = [[-this.state.size.rectWidth, -this.state.size.rectHeight], [this.state.size.rectWidth, this.state.size.rectHeight]];
        let brush = d3.brush();
        return brush
            .extent(extent)
            .on("brush", function(){
                let domain = d3.event.selection;
                self.nodes.forEach(function(d,i){
                    let xy = [d.x, d.y];
                    let has = xy.in(domain);
                    d3.select("g.g_"+d.id+">circle").classed("checked", has?"1":"");
                });
            });
    }
    createContainer = () => {
        var self = this;
        this.svg = this.paper.append("g")
            .attr("class", "g-container")
            .attr("transform", "translate(0,0)")
            .on("mousemove", function(){
                if (!self.state.checkedNode) {
                    return;
                }
                self.drawLineTemplate([[self.state.checkedNode.x,self.state.checkedNode.y], d3.mouse(this)])
            })
            .on("mouseup", function(){
                self.setState({
                    checkedNode:null
                });
            });
        this._links_container = this.svg.append("g").attr("class", "links-container");
        this._nodes_container = this.svg.append("g").attr("class", "nodes-container");
        //线模板
        this._links_container.append("path")
            .attr("class", "dragline")
            .attr("d", "M0,0L0,0")
            .attr("stroke", this.state.color.lines[1])
            .attr("storke-width", "1")
            .attr("fill", "none");
    }
    renderForceSimulation = () => {
        let self = this;
        self.simulation = d3.forceSimulation()
            .force("link", d3.forceLink().distance(function(){return self.state.node.distance;}))
            .force("charge", d3.forceManyBody().strength(-800))
            .force("center", d3.forceCenter().x(self.state.size.width/2).y(self.state.size.height/2))
        ;
    }
    zoomListener = (enable) => {
        if (typeof(enable) == "undefined" || !enable) {
            d3.select("g.g-rect").call(d3.zoom().on("zoom", null));
            return;
        }
        let self = this;
        d3.select("g.g-rect").call(
            d3.zoom().scaleExtent(self.state.scaleExtent).on("zoom", function(){
                self.transform(d3.event.transform.k, [d3.event.transform.x, d3.event.transform.y])
            })
        );
    }
    ticked = () => {
        let self = this;
        this.svg.selectAll(".nodes")
            .attr('transform', function(d) {
                return 'translate(' + d.x + ',' + d.y + ')'
            });
        this.svg.selectAll("path.link")
            .attr("d", function(d,i){
                let m = [d.source.x, d.source.y];
                let l = [d.target.x, d.target.y];
                if (geo.isFirstQuadrant(d)) {
                    return "M"+l.join(",")+" L"+m.join(",");
                } else {
                    return "M"+m.join(",")+" L"+l.join(",");
                }
            })
            .attr("marker-start", function(d){
                if (!geo.isFirstQuadrant(d)) { return ""; }
                return "url(#arrowstart_"+self.getPathColorIndex(d)+")";
            })
            .attr("marker-end", function(d){
                if (geo.isFirstQuadrant(d)) { return ""; }
                return "url(#arrow_"+self.getPathColorIndex(d)+")";
            });
        this.svg.selectAll(".linktext")
            .attr("dy", "-6")
            .attr("dx", function(d) {
                let source = [d.source.x, d.source.y];
                let target = [d.target.x, d.target.y];
                return source.getDistance(target)/2;
            });
    }
    redraw = () => {
        var that = this;
        //线
        var linksUpdate = that._links_container.selectAll("path.link").data(that.links, function(d){
            return "path_"+d.source.id+"_"+d.target.id;
        });
        linksUpdate.enter().insert("path", "g.nodes")
            .attr("id", function(d){
                return "path_"+d.source.id+"_"+d.target.id;
            })
            .attr("class", "link")
            .attr("stroke-width", 1)
            .attr("stroke", function(d,i){
                return that.state.color.lines[that.getPathColorIndex(d)];
            })
            .attr("fill", "none")
            .on("mouseover", function(d,i){
                //that.setTipsInfo(d.source.text+"--"+d.target.text, "角色："+d.relation+"，信任度："+d.value);
            })
            .on("mouseout", function(d,i){
                //that.resetTipsInfo();
            });
        linksUpdate.exit().remove();

        //线上文字
        var linktextUpdate = that._links_container.selectAll("text.linktext").data(that.links, function(d){
            return "pathtext_"+d.source.id+"_"+d.target.id;
        });
        linktextUpdate.enter().append("text")
            .attr("id", function(d){
                return "pathtext_"+d.source.id+"_"+d.target.id;
            })
            .attr("class", "linktext")
            .attr("fill", that.state.color.linetext)
            // .attr("text-anchor", "middle")
            .append("textPath")
            .attr("xlink:href", function(d){
                return "#path_"+d.source.id+"_"+d.target.id;
            })
            .text(function(d){
                if (!d.value || !that.state.enable.relationship) {
                    return '';
                }
                return d.relation;
            })
            .append("tspan")
            .attr("fill", function(d,i){
                return that.state.color.colors(d.value);
            })
            .text(function(d){
                if (!d.value || !that.state.enable.score) {
                    return '';
                }
                return d.value;
            });
        linktextUpdate.exit().remove();

        //节点
        var nodesUpdate = that._nodes_container.selectAll("g.nodes").data(that.nodes, function(d,i){
            return d.id;
        });
        var nodesEnterG = nodesUpdate.enter().append("g")
            .attr("class", function(d,i){
                return "nodes g_"+d.id;
            })
            .attr("cursor", "default")
            .attr("transform", "translate(0,0)")
            .call(d3.drag().on("start", function(d,i){
                if (!d3.event.active) {
                    //设置衰减系数，对节点位置移动过程的模拟，数值越高移动越快，数值范围[0,1]
                    that.simulation.alphaTarget(0.8).restart();
                }
                d.fx = d.x;
                d.fy = d.y;
            }).on("drag", function(d,i){
                d.fx = d3.event.x;
                d.fy = d3.event.y;
            }).on("end", function(d,i){
                //that.simulation.stop();
                that.simulation.alphaTarget(0);
            }))
            .on("click", function(d,i){
                d3.selectAll("g>circle").attr("stroke","none");
                d3.select("g.g_"+d.id+">circle").attr("stroke","#2E89FB").attr("stroke-width",6).attr("stroke-opacity","0.3")
            })
            .on("dblclick", function(d,i){
                if (!d.hasOwnProperty('open') || !d.open) {
                    d.open = 1;
                    that.randomGenerateForce(d);
                } else {
                    d.open = 0;
                    that.collapseChilds(d.id);
                }
                console.info("dblclick",i,d)
            })
            .on("mousedown", function(d){
                if (d3.event.which==3) {
                    that.setState({
                        checkedNode:d
                    });
                }
            })
            .on("mouseup", function(d){
                that.drawLineTemplate();
                /*1选中的节点为空 2等于自己 3已存在关系*/
                let __id = d.id;
                if (!that.state.checkedNode || __id==that.state.checkedNode.id) {
                    return;
                }
                let __cid = that.state.checkedNode.id;
                //是否已存在关系
                let __links = that.links.filter(function(l){
                    if ((l.source.id==__id && l.target.id==__cid)
                        || (l.target.id==__id && l.source.id==__cid)) {
                        return true;
                    }
                    return false;
                });
                if (__links.length > 0) {
                    console.info('link exists!!!');
                    return;
                }
                let link = {"source": that.state.checkedNode.id, "target":d.id, "value":"1", "relation":"新建", "type":1};
                that.addLinks(link);
                that.dodo();
            })
            .on("mouseover", function(d,i){
                // that.setTipsInfo(d.text, "姓名："+d.text+"，ID："+d.id);
                // if (that.enable.highlight) {
                //     var ids = [];
                //     d3.selectAll(".link").transition().duration(0).attr("opacity", function(link){
                //         if (link.source.id==d.id || link.target.id==d.id) {
                //             ids.push(link.source.id);
                //             ids.push(link.target.id);
                //             return 1;
                //         }
                //         return 0.2;
                //     });
                //     d3.selectAll(".nodes").transition().duration(0).attr("opacity", function(item){
                //         return ids.indexOf(item.id) > -1 ? 1 : 0.2;
                //     });
                // }
            })
            .on("mouseout", function(d,i){
                // that.resetTipsInfo();
                // if (that.enable.highlight) {
                //     d3.selectAll(".link").transition().duration(0).attr("opacity", 1);
                //     d3.selectAll(".nodes").transition().duration(0).attr("opacity", 1);
                // }
            });
        nodesEnterG.append("use").attr("xlink:href", "#zdry_")
            .attr("fill", "red")
            .attr("opacity", function(d,i){
                var ids = ['sanguo', 'caocao', 'liubei', 'sunquan', 'liuxie'];
                return ids.indexOf(d.id)>-1 ? 1 : 0;
            });
        nodesEnterG.append("circle")
            .attr("r", function(d,i){
                d.weight = that.links.filter(function(link){
                    return link.source.index==i || link.target.index==i;
                }).length;
                return that.state.node.r;
            })
            .attr("fill", function(d,i){
                var ids = [
                    'sunshangxiang', 'daqiao', 'xiaoqiao', 'diaochan',
                    'caifuren', 'jingzhu',
                    'wangmeiren', 'fuhuanghou', 'dongguiren', 'caojie', 'caoxian', 'caohua'
                ];
                return ids.indexOf(d.id)>-1 ? that.state.color.node_girl : that.state.color.node_comm;
            });
        nodesEnterG.append("image")
            .attr("xlink:href", function(d,i){
                return that.state.node.iconpath+d.icon;
            })
            .attr("width", function(d,i){
                return that.state.node.icon*2;
            })
            .attr("height", function(d,i){
                return that.state.node.icon*2;
            })
            .attr("x", function(d,i){
                return -that.state.node.icon;
            })
            .attr("y", function(d,i){
                return -that.state.node.icon;
            });
        nodesEnterG.append("text")
            .attr("x", -14)
            .attr("y", -10)
            .attr("dy", 45)
            .attr("fill", this.state.color.nodetext)
            .text(function(d,i){
                if (!d.text || !that.state.enable.nodetext) {
                    return '';
                }
                if (i==0) {
                    d.fx = that.state.size.width/2;
                    d.fy = that.state.size.height/2;
                }
                return d.text;
            });
        nodesUpdate.exit().remove();
    }
    dodo = () => {
        this.simulation.nodes(this.nodes).on("tick", this.ticked);
        this.simulation.force("link").links(this.links);
        this.redraw();
    }
    /**
     * 平移缩放
     * @param __scale
     * @param __translate
     */
    transform = (__scale, __translate) => {
        this.setState({
            scale:__scale || 1,
            translate: __translate || [0,0]
        });
        let __transform = "translate("+this.state.translate+") scale("+this.state.scale+")";
        d3.select('.g-container').transition().duration(0).attr("transform", __transform);
        if (this.state.scale<0.35) {
            d3.selectAll(".linktext").transition().duration(0).attr("opacity", 0);
            d3.selectAll("g.nodes>image").transition(500).duration(0).attr("opacity", 0);
            d3.selectAll("g.nodes>text").transition().duration(0).attr("opacity", 0);
        } else {
            d3.selectAll(".linktext").transition().duration(0).attr("opacity", 1);
            d3.selectAll("g.nodes>image").transition(500).duration(0).attr("opacity", 1);
            d3.selectAll("g.nodes>text").transition().duration(0).attr("opacity", 1);
        }
    }
    /**
     * 自动适应
     */
    resize = () => {
        this.paper
            .attr("width", document.documentElement.clientWidth)
            .attr("height", document.documentElement.clientHeight);
    }
    /**
     * 解除锁定
     * @param id
     */
    unlock = (id) => {
        this.nodes.filter(function(n){
            if (geo.isNullStr(id)) {
                return n.index != 0;
            }
            return n.id = id;
        }).forEach(function(n){
            n.fx = null;
            n.fy = null;
        });
    }
    addNodes = (nodes) => {
        let self = this;
        let type = Object.prototype.toString.call(nodes);
        if (type=='[object Array]') {
            nodes.forEach(function(node,i){
                self.nodes.push(node);
            });
            return;
        }
        if (type=='[object Object]') {
            self.nodes.push(nodes);
            return;
        }
    }
    addLinks = (links) => {
        let self = this;
        let type = Object.prototype.toString.call(links);
        if (type=='[object Array]') {
            links.forEach(function(link,i){
                self.links.push(link);
            });
            return;
        }
        if (type=='[object Object]') {
            self.links.push(links);
            return;
        }
    }
    /**
     * 绘制线模板
     * @param xy
     */
    drawLineTemplate = (xy) => {
        let template = d3.select("path.dragline");
        if (typeof(xy) == 'undefined') {
            template.attr("marker-end", "").attr("stroke-dasharray", "").attr("d", "M0,0L0,0");
            return;
        }
        template.attr("marker-end", "url('#arrow_2')").attr("stroke-dasharray", "10,2").attr("d", "M"+xy[0]+"L"+xy[1]);
    }
    /**
     * 获取边颜色索引
     * @param link
     * @returns {number}
     */
    getPathColorIndex = (link) => {
        let type = 0;
        let lines = this.state.color.lines;
        try {
            if (link.hasOwnProperty("type")) {
                if (parseInt(link.type)>=0 && parseInt(link.type)<lines.length) {
                    type = parseInt(link.type);
                }
            }
        } catch (err) {}
        return type;
    }
    randomGenerateForce = (d) => {
        let self = this;
        let max = 7, min = 2;
        let random = Math.floor(Math.random()*(max-min+1))+min;
        let zs = self.nodes.length;
        for (let j=0;j<random;j++) {
            let _xh = (zs+j+1);
            let _id = "xiaobing_"+_xh;
            let node = {"id":_id, "text":"小兵"+_xh, "icon":"i_daqiao.png"};
            let link = {"source": _id, "target":d.id, "value":"", "relation":""};
            self.addNodes(node);
            self.addLinks(link);
        }
        self.dodo();
    }
    collapseChilds = (id) => {
        let self = this;
        let nodeIdArr = [], linkIdArr = [];
        let nodeIndexArr = [], linkIndexArr = [];
        self.links.filter(function(link,i){
            let __typeof = typeof(link.source);
            if (__typeof != 'object') {
                return link.source==id || link.target==id;
            } else {
                return link.source.id==id || link.target.id==id;
            }
        }).forEach(link=>{
            let __id;
            let __index;
            if (link.source.id==id) {
                __id = link.target.id;
                __index = link.target.index;
            } else {
                __id = link.source.id;
                __index = link.source.index;
            }
            let __links = self.links.filter(function(l){
                return (l.source.id==__id || l.target.id==__id);
            });
            if (__links.length>1) return;
            nodeIdArr.push(__id);
            nodeIndexArr.push(__index);
            linkIdArr.push(__links[0].source.id+'_'+__links[0].target.id);
            linkIndexArr.push(__links[0].index);
        });
        self.nodes.remove(nodeIndexArr);
        self.links.remove(linkIndexArr);
        self.dodo();
    }
    bindKeydown = () => {
        console.info("brush keydown")
        console.info(d3.event)
        this.setState({
            ctrlKey: d3.event.ctrlKey,
            shiftKey: d3.event.shiftKey
        });
        let which = d3.event.which;
        var self = this;
        if (this.state.shiftKey) {
            this.zoomListener(false);
            d3.select("g.g-brush").call(self.bursher);
        }
        else if (which==67) { // the 'c' key

        }
        else if (which==46) { // the 'delete' key

        }
    }
    bindKeyup = () => {
        console.info("brush keyup")
        this.setState({
            ctrlKey: d3.event.ctrlKey,
            shiftKey: d3.event.shiftKey
        });
        d3.select("g.g-brush").text('');
        this.zoomListener(true);
    }
    render() {
        console.info('render')
        return (
            <div>
                <Menus/>
                <div id="force-view container" style={{padding:0, width:'100%'}}>
                    <div id="board"></div>
                </div>
            </div>
        )
    }
    componentDidMount() {
        // console.info('componentDidMount')
        // console.info(this)
        // console.info(this.state)
        //document.querySelector('#board').style.background="url('./img/starbg.png')";
        this.init();
        let self = this;
        d3.json('./../data/demo.json').then(function(data){
            console.info("init data", data)
            self.addNodes(data.nodes);
            self.addLinks(data.links);
            self.dodo();
        })
        window.addEventListener("resize", self.resize);
    }
    componentDidUpdate() {
        // console.info('componentDidUpdate')
        console.info(this)
    }
}

export default CanvasPaper;