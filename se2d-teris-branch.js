//=================== tools ============================================
var U = {
	/**
	 * @param Parent
	 * @param Child
	 * */
	extend:function (Parent, Child) {
		var F = new Function();
		F.prototype = Parent.prototype;
		Child.prototype = new F();
		Child.prototype.constructor = Child;
		Child.superclass = Parent.prototype;
	},
	/**
	 * @param {Class} Parent - переменная типа пользовательский класс
	 * @param {String} FunctionName - имя функции
	 * @param {Class} This - указатель на объект класса потомка
	 * @args - {Array} аргументы, переданные This, в котором переопределен FunctionName
	 * */
	Super:function (Parent, FunctionName, This, args) {
		Parent.superclass[FunctionName].apply(This, args);
	},
	sz:function (o) {
		return (o.length ? o.length : 0);
	},
	round:function(x) {
		return Math.round(x);
	},
	int:function(n, radix) {
		if (!radix) {
			radix = 10;
		}
		return parseInt(n, radix);
	},
	rand:function(min, max) {
		var n = Math.random(),
			s = String(n),
			_max = max - min,
			r = String(_max).length;
		s = s.split('.')[1];
		if (s) {
			s = s.replace(/^0+/, '');
			s = s.substring(0, r);
		}
		while (!s || s.length < r) {
			n = Math.random();
			s = String( n );
			s = s.split('.')[1];
			if (s) {
				s = s.replace(/^0+/, '');	
				s = s.substring(0, r);
			}
		}
		n = parseInt(s) % _max;
		if (n == 0) {
			r = U.rand(1000, 9999);
			if (r % 2 == 0) {
				n = _max;
			}
		}
		n += min;
		return n;
	},
	/**
	 * @description php time()
	*/
	time:function() {
		return parseInt(new Date().getTime()/1000);
	},
	/**
	 * @description Возвращает percent от percents100
	 * @param {Number} percent
	 * @param {Number} percents100
	 * @return {Number} percent процентов от величины percents100
	*/
	getPercents:function(percent, percents100) {
		var one = percents100 / 100;
		return (percent * one);
	}
}
//===================DisplayObjects=====================================
/**
 * @param {Image} img
 * @param {String} id
 * @param {Number} depth
 * */
function Sprite(img, id, depth) {
	this.cells = []; //номера строк и столбцов сетки [row,col], если SE2D.gridCell is int
	this.nearSprites = []; //идентификаторы спрайтов, находящихся в той же ячейке, если SE2D.gridCell is int
	this.dc; //danger collision - not 0 if in cell exists any sprites
	this.is_image  = 0; //1 когда спрайт не надо учитывать при обработке столкновений
	this.visible = 0;
	this.img = img;
	this.w = this._width = img.width;
	this.h = this._height = img.height;
	this.se2d = img.se2d;
	this.id = id;
	this.depth = depth;
	this.name;
	this.go(0, 0);
}
/**
 * @description info может содержать информацию о ребрах sprite, которые пересеклись с this
 * Например если после вызова info == {t:1, r:1} - значит пересекся верхним и правым ребрами
 * @param {Object} {x,y,w,h}
 * @param {Object} info {t(op),r(ight),b(ottom),l(eft)}
 * @return true если bounds-ы объектов пересекаются
*/
Sprite.prototype.hitTest = function (sprite, info) {
	var s = sprite, o = this, flag = false;
	if ( (s.x + s.w) >= o.x && s.x <= (o.x + o.w) && (s.y + s.h) >= o.y && s.y <= (o.y + o.h) ) {
		flag = true;
	}
	if (flag && info) {
		delete info.t;
		delete info.r;
		delete info.b;
		delete info.l;
		if ( (s.x + s.w) >= o.x && (s.x + s.w) <= (o.x + o.w) ) {
			info.r = 1;
		}
		if ( s.x >= o.x && s.x <= (o.x + o.w) ) {
			info.l = 1;
		}
		if ( (s.y + s.h) >= o.y && (s.y + s.h) <= (o.y + o.h) ) {
			info.b = 1;
		}
		if ( s.y >= o.y && s.y <= (o.y + o.h) ) {
			info.t = 1;
		}
	}
	return flag;
}
/**
 * @description
 * @param {Number} x
 * @param {Number} y
 * @return true если точка пересекается с объектом
*/
Sprite.prototype.hitTestPoint = function (x, y) {
	var o = this;
	if (o.x <= x && (o.x + o.w) >= x && o.y <= y && (o.y + o.h) >= y) {
		return true;
	}
	return false;
}
/**
 * @description Клонировать клип
 * @param {Number} x
 * @param {Number} y
 * @param {String} y
 * @param {Bumber} visible
 * @return Sprite
*/
Sprite.prototype.clone = function (x, y, id, visible) {
	var o = this, 
		c = (o.clone_id_counter ? o.clone_id_counter + 1 : 0),
		s = new Sprite(o.img, o.id + '_' + c, SE2D.sprites.length /*+ 1*/);
	o.clone_id_counter = c + 1;
	SE2D._root[o.id + '_' + c] = s;
	SE2D.sprites.push(s);
	if (visible) {
		s.visible = visible;
	}
	s.go(x, y);
	if (id) {
		s.id = id;
	}
	
	return s;
}
/**
 * @description установить координаты клипа на холсте и его положение в сетке
*/
Sprite.prototype.go = function (x, y) {
	var se = SE2D, o = this, i, L = U.sz(o.cells), id = o.id, cellId;
	o.x = x;
	o.y = y;
	if (0 == o.visible || 1 == o.is_image || !se.gridCell || !se.grid) {
		return;
	}
	//записать, в каких ячейках сетки расположен клип.
		//перебрать все ячейки клипа и стереть из них его id
		for (i = 0; i < L; i++) {
			cellId = o.cells[i][0] + '_' + o.cells[i][1];
			if (se.grid[cellId]) {
				delete se.grid[cellId][id];
			}
		}
		//вычислить занимаемые ячейки
		//во все ячейки сетки, занятые клипом и записать в них его id
		//составить список идентификаторов спрайтов, которые находятся в той же ячейке
		o.cells = [];
		o.nearSprites = [];
		var map = {}, _id, t, qu, other = {}, j;
		//@return {r,c}
		function calc(x, y) {
			var n  =se.gridCell, 
				col = Math.floor(x / n),
				row = Math.floor(y / n);
			return {r:row, c:col};
		}
		qu = [{x:o.x, y:o.y}, {x:o.x + o.w, y:o.y}, {x:o.x + o.w, y:o.y + o.h}, {x:o.x, y:o.y + o.h}];
		for (i = 0; i < 4; i++) {
			t = calc(qu[i].x, qu[i].y);
			_id = t.r + '_' + t.c;
			if (!map[_id]) {
				map[_id] = 1;
				o.cells.push([t.r, t.c]);
				if (!se.grid[_id]) {
					se.grid[_id] = {};
				}
				se.grid[_id][id] = 1;
				for (j in se.grid[_id]) {
					if (j != id && !other[j]) {
						other[j] = 1;
						o.nearSprites.push(j);
					}
				}
			}
		}
		o.dc = o.nearSprites.length;
}
//=================Engine 2D============================================
SimpleEngine2D.prototype.onEnterFrame = function () {}
SimpleEngine2D.prototype.onLoadImages = function () {}
SimpleEngine2D.prototype.onLoadRastrResource = function () {}
function SimpleEngine2D (canvasId, fps) {
	var o = document.getElementById(canvasId);
	if (o && o.getContext) {
		if (!window.SE2D) {
			SE2D = this;
		}
		this.test = '000';
		this.c = o.getContext("2d");
		this.canvas = o;
		this.canvas.onclick = this.onclick;
		//this.canvas.ontouch = this.ontouch; //TODO
		this.w = o.width;
		this.h = o.height;
		this.fps = fps;
		this.rastrData = [];
		this.sprites = [];
		this._root = {};
		this.grid = {};
		this.__images_length = -1;
		//для оптимизации расчета столкновений
		this.gridCell; //Если определено, лучше использовать Sprite.go(x,y) для установки координат спрайта
		setInterval(this.tick, 1000 / fps);
	} else {
		alert("Object canvas with id '" + canvasId + "' not found");
	}
}
SimpleEngine2D.prototype.tick = function () {
	var sz = SE2D.sprites.length, i, spr;
	SE2D.c.clearRect(0, 0, SE2D.w, SE2D.h);
	for (i = 0; i < sz; i +=1) {
		spr = SE2D.sprites[i];
		if (spr.visible != false) {
			SE2D.c.drawImage(spr.img, spr.x, spr.y);
		}
	}
	SE2D.onEnterFrame();
}
/**
 * @param {String} path to image
 * @param {String} rastrId
 * */
SimpleEngine2D.prototype.addRastr = function (src, rastrId) {
	//console.log(rastrId);
	
	var i = new Image();
	this.rastrData.push(i);
	i.depth = this.rastrData.length - 1;
	i.se2d = this;
	i.id = rastrId;
	i.onload = this.onLoadImage;
	i.onerror = this.onErrorLoadImage;
	i.src = src;
}
/**
 * Загрузка графических ресурсов приложения
 * Вызывает onLoadImages когда все готово
 * Может вызываться как с одним аргументом массивом, так и со многими аргументами строками
 * @param Aray args - массив строк, каждый первый аргумент - путь к изображению, каждый второй - идентификатор клипа в объекте SE2D._root
 */
SimpleEngine2D.prototype.addGraphResources = function (args) {
	//TODO доработать для возможности передавать анимацию
	//каждый первый элемент может быть массивом путей
	//здесь просто приводим его к формату чет - путь, нечет - id
	//А в onLoadImages если такой se2d._root[img.id] уже есть
	//просто добавляем очередной кадр se2d._root[img.id].addFrame(img);
	
	var sz = U.sz(args), i = 0, half = sz / 2;
	/*console.log(half + ", " + Math.round(half) + ", " + sz);
	console.log(args);*/
	
	if (half != Math.round(half)) {
		throw "Need odd count items in first arument for SE2D.addGraphResources";
	}
	this.__images_count = this.__images_length = sz / 2;
	for (i = 0; i < sz; i += 2) {
		if (i + 1 < sz) {
			this.addRastr(args[i], args[i + 1]);
		}
	}
}
/**
 * Вызывается после загрузки очередного изображения
 * @see addGraphResources
 * @param {Event} evt
 * */
SimpleEngine2D.prototype.onLoadImage = function () {
	var img = this, se2d = img.se2d, o = new Sprite(img, img.id, img.depth);
	se2d._root[img.id] = o;
	se2d.sprites.push(o);
	se2d.__images_count--;
	SE2D.onLoadRastrResource(img.id);
	//console.log(se2d.__images_count);
	if (se2d.__images_count == 0) {
		se2d.orderImagesByDepth();
		se2d.onLoadImages();
	}
}
/**
 * Вызывается после ошибки загрузки очередного изображения
 * @see addGraphResources
 * @param {Error} err
 * */
SimpleEngine2D.prototype.onErrorLoadImage = function () {
	SE2D.__images_count--;
	if (SE2D.__images_count == 0) {
		SE2D.onLoadImages();
	}
}
/**
 * Упорядочить изображения по depth
*/
SimpleEngine2D.prototype.orderImagesByDepth = function () {
	var sz = SE2D.sprites.length, i, j, sprA, sprB;
	for (i = 0; i < sz; i +=1) {
		for (j = 0; j < sz; j +=1) {
			sprA = SE2D.sprites[i];
			sprB = SE2D.sprites[j];
			if (sprA.depth < sprB.depth) {
				var b = SE2D.sprites[i];
				SE2D.sprites[i] = SE2D.sprites[j];
				SE2D.sprites[j] = b;
			}
		}
	}
}
/**
 * @description Установить реакции на клик или тач для перечисленых клипов 
 * @param Array names список имен клипов
*/
SimpleEngine2D.prototype.setButtons = function (names) {
	var i;
	for (i = 0; i < U.sz(names); i++) {
		if (this._root[names[i]]) {
			this._root[names[i]].is_button = 1;
		}
	}
}
/**
 * @description Установить реакции на клик или тач для клипов с is_button = 1; this is SE2D.canvas
 * @param Array names список имен клипов
*/
SimpleEngine2D.prototype.onclick = function (e) {
	var x = e.clientX - SE2D.canvas.offsetLeft,
		y = e.clientY - SE2D.canvas.offsetTop,
		mc, i;
	for (i = 0; i < U.sz(SE2D.sprites); i++) {
		mc = SE2D.sprites[i];
		if (mc && mc.is_button == 1) {
			if (mc.onclick instanceof Function && mc.hitTestPoint(x, y)) {
				mc.onclick({x:x, y:y, target:mc});
			}
		}
	}
}
/**
 * @description Удалить клип
 * @param {String}|{Sprite} id
*/
SimpleEngine2D.prototype.remove = function (id) {
	var i, copy = [];
	if (!(id instanceof Sprite)) {
		id = SE2D._root[id];
	}
	if (!(id instanceof Sprite)) {
		return;
	}
	for (i = 0; i < SE2D.sprites.length; i++) {
		if (SE2D.sprites[i] != id) {
			copy.push(SE2D.sprites[i]);
		}
	}
	SE2D.sprites = copy;
	for (i in SE2D._root) {
		if (SE2D._root[i] == id) {
			delete SE2D._root[i];
		}
	}
}

function E(i) {return document.getElementById(i)}

function trace(s) {
	if (E("panel")) E("panel").innerHTML = s;
}
