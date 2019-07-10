/**
 * @class iParserTool
 * @var {Number} areaW - ширина "стакана"
 * @var {Array}  workGrid - массив i, j, представляющий собой сетку тетриса i - строки, j - столюбцы
 * @var {Object x, y}  workGridCellSz - размеры ячейки workGrid
 * @var {Number}  workGridNumRow      - количество строк в сетке
 * @var {Number}  workGridNumCell     - количество столбцов в сетке
 * @var {iParserToolFigure}  figure        - активная на данный момент фигура
*/
function iParserTool() {
	var o = this;
	SE2D.app = SE2D.canvas.app = this;// SE2D.setApp(this);
	SE2D.gridCell = 10; //для оптимизации расчета столкновений, 8 взято как сторона "кирпича"
	SE2D.onLoadImages = this.onInit;
	SE2D.addGraphResources(["example.png", "subject"
	]);
	SE2D.onEnterFrame = function(){
		o.onEnterFrame();
	};
}
/**
 * @description this is SE2D
*/
iParserTool.prototype.onInit = function() {
	var mc = this.app.subject = SE2D._root.subject;
	mc.x = 0;
	mc.y = 0;
	mc.visible = 1;
	return;
	if (window.runUnittest && runUnittest instanceof Function) {
		runUnittest();
	}
}
/**
 * @description this is SE2D
*/
iParserTool.prototype.onEnterFrame = function(e) {
	
}
