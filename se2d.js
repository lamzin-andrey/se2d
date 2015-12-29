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
//===================Graphics=====================================
/**
 * @class Graphics
*/
function Graphics(parent) {
	this.TYPE_POINT = 1,
	this.TYPE_RECT  = 2;
	/** @property Array _objects Содержит объекты (ассоциативные массивы) типа точки линий и четырехугольники
     * item[type=TYPE_POINT]: type, x, y, color, fill_color, thikness, is_start, is_begin_fill, is_end_fill
     * *  is_start 1 если был вызван moveTo
     * item[type=TYPE_RECT] : type, x, y, w, h, color, fill_color, thikness
    */
	this._objects = [];
	/** @property {Object} _last_object @see item of _objects*/
	/** @property {Number} color Текущий цвет */
	this._color = 0x000000
	/** @property {Number} _fill_color Текущий цвет заливки*/
	this._fill_color = 0xFFFFFF;
	/** @property {Number} _thikness Текущая толщина*/
	this._thikness = 0.25;
	/** @property {Number} _new_color Новый цвет*/
	/** @property {Number} _new_fill_color Новый цвет заливки */
	/** @property {Number} _new_thikness Новая толщина */
	/** @property {Boolean} _is_begin_fill True if begin */
	this._is_begin_fill = false;
	/** @property {Boolean} _is_end_fill True if end */
	this._is_end_fill = false;
	/** @property {Sprite} _parent ссылка на отображаемый объект, с целью вычислять его размер при отрисовке линий */
	this._parent = parent;
}
Graphics.prototype.lineTo = function (x, y) {
	var o = this._last_object, params = {}, item;
	if (!o) {
		Error('need call moveTo before drawLine');
	}
	if (o.type == this.TYPE_RECT) {
		Error('need call moveTo before drawRect');
	}
	t = this.TYPE_POINT;
	//$clr, $thi
	this._applyLineStyle(params);
	if (params.clr == o.color) {
		params.clr = null;
	}
	if (params.thi == o.thikness) {
		params.thi = null;
	}
	if (this._parent._width < x) {
		this._parent.setWidth(x);
	}
	if (this._parent._height < y) {
		this._parent.setHeight(y);
	}
	item = this._createPoint(t, x, y, params.clr, params.thi);
	this._last_object = item;
	this._objects.push(item);
}
Graphics.prototype.moveTo = function (x, y) {
	var t = this.TYPE_POINT, params = {}, point, o;
	this._applyLineStyle(params);
	point = this._createPoint(t, x, y, params.clr, params.thi, true);
	//console.log(params);
	o = this._last_object;
	//пока забил на оптимизацию
	/*if ($o && isset($o['is_start'])) { //rewrite
		$i = count($this->_objects) - 1;
		$this->_objects[$i] = $point;
	} else {//append
		$this->_objects[] = $point;
	}*/
	this._objects.push(point);
	this._last_object = point;
}
Graphics.prototype.drawRect = function (x, y, width, height) {
	var o = {
		type  : this.TYPE_RECT,
		x     : x,
		y     : y,
		w     : width,
		h     : height,
		color: this._color,
		thikness: this._thikness,
		fill_color: this._is_begin_fill && !this._is_end_fill ?  this._fill_color : false
	};
	this._objects.push(o);
	this._last_object = o;
	
	if (this._parent._width < x + width) {
		this._parent.setWidth(x + width);
	}
	if (this._parent._height < y + height) {
		this._parent.setHeight(y + height);
	}
}

Graphics.prototype.beginFill = function (color) {
	this._fill_color = color;
	this._is_begin_fill = true;
	this._is_end_fill = false;
}
Graphics.prototype.setLineStyle = function(thikness, color) {
	this._new_color = color;
	this._new_thikness = thikness;
}
/***
 * @param float $thikness
 * @param uint  $color
 * @param float $alpha
 * @param boolean $pixelHinting = false
 * @param string $scaleMode = 'normal'
 * @param string $caps = null
 * @param string $joints = null
 * @param int $miterLimit = 3
 * @return void
*/
Graphics.prototype.lineStyle = function(thikness, color) {
	this.setLineStyle(thikness, color);
}
Graphics.prototype.endFill = function() {
	//пока забил на оптимизацию
	this._is_end_fill = true;
	/*$o = $this->_objects;
	if ($this->_objects && is_array($o)) {
		$c = count($o);
		if ($c && $o[$c - 1]['type'] == self::TYPE_POINT) {
			$this->_objects[$c - 1]['is_end_fill'] = true;
		}
	} else {
		$this->_is_end_fill = true;
	}*/
}
/**
 * @param {Object} {color, thikness} param
*/
Graphics.prototype._applyLineStyle = function(param) {
	var color, thikness;
	if (this._new_color && this._new_color != this._color) {
		color = this._color = this._new_color;
		this._new_color = null;
	} else {
		color = this._color;
	}
	
	if (this._new_thikness && this._new_thikness != this._thikness) {
		thikness = this._thikness = this._new_thikness;
		this._new_thikness = null;
	} else {
		thikness = this._thikness;
	}
	param.clr = color;
	param.thi = thikness;
}
Graphics.prototype._createPoint = function(type, x, y, color, thikness, is_start, is_begin_fill, is_end_fill) {
	if (!is_begin_fill) {
		is_begin_fill = this._is_begin_fill;
		this._is_begin_fill = false;
	}
	if (is_end_fill) {
		is_end_fill = this._is_end_fill;
		this._is_end_fill = false;
	}
	var fill_color = false;
	if (this._last_object && this._last_object.fill_color != this._fill_color) {
		fill_color = this._fill_color;
	}
	o = {
		type: type,
		x : x,
		y : y,
		color : color,
		fill_color : fill_color,
		thikness : thikness,
		is_start : is_start,
		is_begin_fill : is_begin_fill,
		is_end_fill : is_end_fill
	};
	return o;
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
	this.w = this._width  = img && img.width ? img.width : 0;
	this.h = this._height = img && img.height ? img.height : 0;
	this.se2d = SE2D;
	this.id = id;
	this.depth = depth;
	this.name;
	this.graphics = new Graphics(this);
	this.childs = [];
	this.childsMap = {};
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
	s.orign = o;
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
/**
 * @description Добавить клип
*/
Sprite.prototype.addChild = function (sprite) {
	var s, o = this, c = o.childs, L = c.length;
	if (!sprite.id) {
		sprite.id = 's' + L;
	}
	sprite.depth = L;
	sprite.parentClip = o;
	c.push(sprite);
	this.childsMap[id] = c.length - 1;
}
/**
 * @description установить ширину клипа
*/
Sprite.prototype.setWidth = function(w) {
	this.w = this.width = w;
}
/**
 * @description установить высоту клипа
*/
Sprite.prototype.setHeight = function(h) {
	this.h = this.height = h;
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
		this._root = {
			addChild: function(sprite) {
				var o = sprite, id = o.id;
				if (!id) {
					o.id = id = 's' + SE2D.sprites.length;
				}
				o.parentClip = SE2D._root;
				SE2D.sprites.push(o);
				SE2D._root[id] = o;
			}
		};
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
			if (spr.graphics._objects.length) {
				SE2D.drawGraphics(spr.graphics, spr.x, spr.y);
			}
			if (spr.img) {
				SE2D.c.drawImage(spr.img, spr.x, spr.y);
			}
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
/**
 * @description Отприсовка объекта Graphics клипов
 * @param {Graphics} graphics
 * @param {Number} dx
 * @param {Number} dy
*/
SimpleEngine2D.prototype.drawGraphics = function(graphics, dx, dy) {
	var j, G = graphics._objects, L = G.length, c = SE2D.c, p, 
		lastStart, color;
	for (j = 0; j < L; j++) {
		p = G[j];
		if (p.type) {
			if (p.type == graphics.TYPE_POINT) {
				if (p.is_start) {
					lastStart = p;
				}
				if (p.thikness) {
					//$this->_pdf->SetLineWidth($i['thikness'] / 10); //TODO attention
					c.lineWidth = p.thikness;
				}
				if (p.color) {
					//console.log(' pre set color ' + p.color);
					color = this.parseColor(p.color);
					//console.log(' set color ' + color);
					c.strokeStyle = color; //'#ff0000'
					//console.log(' set color ' + c.strokeStyle);
					//$this->_pdf->SetDrawColor($c->r, $c->g, $c->b); //TODO attention
				}
				if (p.is_begin_fill && p.fill_color) {
					color = '#' + p.fill_color.toString(16);
					c.fillStyle = color; //'#ff0000'
					//$this->_pdf->SetFillColor($c->r, $c->g, $c->b); //TODO attention
				}
				if (p.is_end_fill) {
					//$this->_pdf->SetFillColor(255, 255, 255);
					c.closePath();
					c.fillStyle = '#FFFFFF';
				}
				if (p.is_start) {
					c.beginPath();
					c.moveTo(lastStart.x + dx, lastStart.y + dy);
					lastStart = p;
				} else if (lastStart.x) {
					//$this->_pdf->Line($lastStart['x'] + $dX, $lastStart['y'] + $dY, $i['x'] + $dX, $i['y'] + $dY);
					c.lineTo(p.x + dx, p.y + dy);
					c.stroke();
					//c.path();
				} else {
					Error('On index k = ' + k +  ' lastObject not containt x ');
				}
			} else if (p.type == graphics.TYPE_RECT){
				if (p.fill_color) {
					color = '#' + p.fill_color.toString(16);
					//$this->_pdf->SetFillColor($c->r, $c->g, $c->b);
					c.fillStyle = color;
				} else {
					//$this->_pdf->SetFillColor(0);
					c.fillStyle = '#FFFFFF';
				}
				//$this->_pdf->Rect($i['x'] + $dX, $i['y'] + $dY, $i['w'], $i['h'], $style);
				c.fillRect(p.x + dx, p.y + dy, p.w, p.h);
			}
		} else {
			Error('Unexpected object!');
		}
		
		//end insert
	}
}
SimpleEngine2D.prototype.parseColor = function(c) {
	c = Number(c).toString(16);
	while (c.length < 6) {
		c = '0' + c;
	}
	c = '#' + c;
	return c;
}

function E(i) {return document.getElementById(i)}

function trace(s) {
	if (E("panel")) E("panel").innerHTML = s;
}
