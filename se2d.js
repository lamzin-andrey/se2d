'use strict';
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
	"int":function(n, radix) {
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
	},
	/**
	 * @description Создать копию объекта или массива
	 * @param {Array or Object} o
	 * @return {Array or Object or null}
	*/
	clone:function(o) {
		var i, newO;
		if (o instanceof Array) {
			newO = [];
			for (i = 0; i < o.length; i++) {
				newO[i] = o[i];
			}
			return newO;
		}
		if (o instanceof Object) {
			newO = {};
			for (i in o) {
				newO[i] = o[i];
			}
			return newO;
		}
		return null;
	},
	/**
	 * @description Вставляет в массив a элемент после позиции b
	 *  Например a = [1, 2, 3], arrayInsert(a, 0, 10); должно привести к [1, 10, 2, 3]
	 * @param {Array} a
	 * @param {Number} index
	 * @param {*} item
	*/
	arrayInsert:function(a, index, item){
		a.splice(index + 1, 0, item);
	}
};
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
	var o = this._last_object, params = {}, item, t;
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
		this._parent.setWidth(x, 1);
	}
	if (this._parent._height < y) {
		this._parent.setHeight(y, 1);
	}
	item = this._createPoint(t, x, y, params.clr, params.thi);
	this._last_object = item;
	this._objects.push(item);
	this._parent.visible = true;
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
	}, params = {};
	this._applyLineStyle(params);
	this._objects.push(o);
	this._last_object = o;
	
	if (this._parent._width < x + width) {
		this._parent.setWidth(x + width, 1);
	}
	if (this._parent._height < y + height) {
		this._parent.setHeight(y + height, 1);
	}
	this._parent.visible = true;
}

Graphics.prototype.beginFill = function (color) {
	this._fill_color = color;
	this._is_begin_fill = true;
	this._is_end_fill = false;
	this._parent.visible = true;
}
Graphics.prototype.setLineStyle = function(thikness, color) {
	/*this._new_color = color;
	this._new_thikness = thikness;/**/
	this._color = color;
	this._thikness = thikness;
	this._parent.visible = true;
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
	this._objects[this._objects.length - 1].is_end_fill = true;
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
	if (this._new_color !== this._color) {
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
	/*if (!is_end_fill) {
		is_end_fill = this._is_end_fill;
		this._is_end_fill = false;
	}*/
	var fill_color = false, o;
	//if (this._last_object && this._last_object.fill_color != this._fill_color) {
		fill_color = this._fill_color;
	//}
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
Graphics.prototype.clear = function() {
	this._objects = [];
	this._color = 0x000000
	this._fill_color = 0xFFFFFF;
	this._thikness = 0.25;
	this._is_begin_fill = false;
	this._is_end_fill = false;
}
//===================DisplayObjects=====================================
/**
 * @param {Image} img
 * @param {String} id
 * @param {Number} depth
 * */
function Sprite(img, id, depth) {
		this.initSprite(img, id, depth);
}
/**
 * @description
 * @param
 * @return
*/
Sprite.prototype.initSprite = function (img, id, depth) {
	this.cells = []; //номера строк и столбцов сетки [row,col], если SE2D.gridCell is int
	this.nearSprites = []; //идентификаторы спрайтов, находящихся в той же ячейке, если SE2D.gridCell is int
	this.dc; //danger collision - not 0 if in cell exists any sprites
	this.is_image  = 0; //1 когда спрайт не надо учитывать при обработке столкновений
	this.visible = 0;
	this.img = img;
	this.sourceW = this.w = this._width  = img && img.width ? img.width : 0;
	this.sourceH = this.h = this._height = img && img.height ? img.height : 0;
	this._scaleX = this._scaleY = 1;
	
	/** @property {Number} Sprite.scaleX */
	Object.defineProperty(this, 'scaleX', {
		enumerable:true,
		get:function(){
			return this._scaleX;
		},
		set:function(v){
			this._scaleX = v;
			this.setWidth(this.sourceW * v);
		}
	});
	/** @property {Number} Sprite.scaleY */
	Object.defineProperty(this, 'scaleY', {
		enumerable:true,
		get:function(){
			return this._scaleY;
		},
		set:function(v){
			this._scaleY = v;
			this.setHeight(this.sourceH * v);
		}
	});
	
	this.se2d = window.SE2D;
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
	
	s.parentClip = SE2D._root;
	
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
	var se = window.SE2D, o = this, i, L = U.sz(o.cells), id = o.id, cellId;
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
//TODO remove clip from previous parent (doublicate!)
Sprite.prototype.addChild = function (sprite) {
	var s, o = this, c = o.childs, L = c.length;
	//console.log( 'remove sprite #' + sprite.id );
	sprite.removeFromParentScope();
	if (!sprite.id) {
		sprite.id = 's' + L;
	}
	sprite.depth = L;
	sprite.parentClip = o;
	c.push(sprite);
	this.childsMap[sprite.id] = c.length - 1;
}
/**
 * @description Удалить ссылки на клип в родителе
*/
Sprite.prototype.removeFromParentScope = function () {
	var sprite = this, parent = sprite.parentClip, i, L, 
		aBuf = [], oBuf = {}, array, mapName = 'childsMap';
	if (!parent) {
		return false;
	}
	if (parent.isRoot) {
		array = SE2D.sprites;
	} else {
		array = parent.childs;
	}
	if (sprite.id) {
		L = array.length;
		for (i = 0; i < L; i++) {
			if (array[i].id !== sprite.id) {
				aBuf.push( array[i] );
			}
		}
		if (parent.isRoot) {
			SE2D.sprites = aBuf;
		} else {
			parent.childs = aBuf;
		}
		if (parent instanceof Sprite) {
			for (i in parent[mapName]) {
				if (i !== sprite.id) {
					oBuf[i] = parent[mapName][i];
				}
			}
			parent[mapName] = oBuf;
		} else if(parent.isRoot) {
			//console.log( 'remove sprite #' + sprite.id );
			for (i in parent) {
				if (i !== sprite.id) {
					oBuf[i] = parent[i];
				}
			}
			parent = oBuf;
		}
	}
}
/**
 * @description установить ширину клипа
*/
Sprite.prototype.setWidth = function(w, resetSource) {
	this.w = this._width = w;
	if (resetSource) {
		this.sourceW = w;
	}
}
/**
 * @description установить высоту клипа
*/
Sprite.prototype.setHeight = function(h, resetSource) {
	this.h = this._height = h;
	if (resetSource) {
		this.sourceH = h;
	}
}
/**
 * @description Устанавливает координаты мыши в клипе
*/
Sprite.prototype.setMouseXY = function() {
	if (SE2D.mouseX) {
		this.mouseX = SE2D.mouseX - this.x;
		this.mouseY = SE2D.mouseY - this.y;
	}
}
/**
 * @description Восстанавливает содержимое спрайта из дампа
*/
Sprite.prototype.fromObject = function(parentSprite, dump) {
	var s, i;//TODO TextField support
	if (dump.text) {
		s = new TextField(dump.name);
		s.stroke = dump.stroke;
		s.textFormat = dump.textFormat;
	} else {
		s = new Sprite(null, dump.name, 0);
	}
	//s.graphics = {_objects:dump.graphics};
	//s.graphics._parent = s;
	s.graphics = new Graphics(s);
	s.graphics._objects = dump.graphics;
	
	s.setHeight(+dump.h ? +dump.h : 0, 1);
	s.setWidth(+dump.w ? +dump.w : 0, 1);
	s.rotation = dump.rotation;
	s.x = dump.x;
	s.y = dump.y;
	s.visible = true;
	if (dump.text) {
		s.text = dump.text;
	}
	//console.log(s);
	for (i = 0; i < dump.numChildren; i++) {
		this.fromObject(s, dump.children[i]);
	}
	parentSprite.addChild(s);
}
/**
 * @description Очищает у всех потомков graphics
*/
Sprite.prototype.clear = function() {
	this.graphics.clear();
	for (var i = 0; i < this.childs.length; i++) {
		this.childs[i].clear();
	}
}
/**
 * @description Удаляет всех потомков
*/
Sprite.prototype.removeAllChilds = function() {
	this.childs = [];
	this.childsMap = {};
}
/**
 * @description Получить по id или имени
 * @return {Sprite} || null
*/
Sprite.prototype.getChildByName = function(name) {
	return ( (this.childsMap[name] || this.childsMap[name] === 0) && this.childs[ this.childsMap[name] ] ? this.childs[ this.childsMap[name] ] : null);
}
//=================TextFormat============================================
/**
 * @param {String} font
 * @param {Number} size
 * @param {Number} color
*/
function TextFormat(font, size, color) {
	this.font = font ? font : 'Times';
	this.size = size ? size : 12;
	this.color = color ? color : 0x000000;
}
//=================TextField============================================
function TextField(id) {
	this.initSprite(null, id, 0);
	this.textFormat = new TextFormat();
	
	/** @property {Number} TextField.textWidth */
	Object.defineProperty(this, 'textWidth', {
		enumerable:true,
		get:function(){
			return (+this._textWidth ? +this._textWidth : 0);
		}
	});
	/** @property {Number} TextField.text */
	Object.defineProperty(this, 'text', {
		enumerable:true,
		get:function(){
			return this._text;
		},
		set:function(v){
			this._text = v;
			this._textWidth = this._getTextWidth(v);
		}
	});
}
U.extend(Sprite, TextField);
/**
 * @param TextFormat tf
*/
TextField.prototype.setTextFormat = function(tf) {
	this.textFormat = tf;
}
TextField.prototype.getTextFormat = function() {
	return this.textFormat;
}
TextField.prototype._getTextWidth = function(s) {
	var c = SE2D.c;
	c.font = this.textFormat.size + "px " + this.textFormat.font;
	return c.measureText(s).width;
}
	/**
	 * TODO for fromArray info
     * @return array
    
    public function TextField::toArray() {
		$result = parent::toArray();
		$result['text'] = $this->_text;
		$result['textWidth'] = $this->_textWidth;
		$result['textFormat'] = array(
			'font' => $this->_textFormat->font,
			'size' => $this->_textFormat->size,
			'color' => $this->_textFormat->color,
		);
		return $result;
    }*/
    
//=================Engine 2D============================================
SimpleEngine2D.prototype.onEnterFrame = function () {}
SimpleEngine2D.prototype.onLoadImages = function () {}
SimpleEngine2D.prototype.onLoadRastrResource = function () {}
function SimpleEngine2D (canvasId, fps) {
	var o = document.getElementById(canvasId);
	if (o && o.getContext) {
		if (!window.SE2D) {
			window.SE2D = this;
		}
		this.test = '000';
		this.c = o.getContext("2d");
		this.canvas = o;
		this.canvas.onclick = this.onclick;
		this.canvas.onmousemove = this.onMouseMove;
		//this.canvas.ontouch = this.ontouch; //TODO
		this.w = o.width;
		this.h = o.height;
		this.fps = fps;
		this.rastrData = [];
		this.sprites = [];
		//TODO remove clip from previous parent (doublicate!)
		this._root = {
			addChild: function(sprite) {
				var o = sprite, id = o.id;
				if (o.id == 'isRoot' || o.id == 'addChild') {
					Error('Invalid name of the clip "' + o.id + '"');
				}
				if (!id) {
					o.id = id = 's' + SE2D.sprites.length;
				}
				o.parentClip = SE2D._root;
				SE2D.sprites.push(o);
				SE2D._root[id] = o;
			},
			isRoot: true
		};
		this.grid = {};
		this.__images_length = -1;
		//для оптимизации расчета столкновений
		this.gridCell; //Если определено, лучше использовать Sprite.go(x,y) для установки координат спрайта
		/** @property {levelsInfo} Хранит данные о том, сколько всего level в _root.sprites и номера позиций для каждого  
		   Например  если пять спрайтов на уровне 0 и 2 на уровне 1 {0: 4, 1:1}*/
		this.levelsInfo = {};
		/** @property {Number} DEFAULT_LEVEL хранит уровень по умолчанию, который будет рисваиваться Sprite._level*/
		this.DEFAULT_LEVEL = 0;
		setInterval(this.tick, 1000 / fps);
	} else {
		//alert("Object canvas with id '" + canvasId + "' not found");
	}
}
SimpleEngine2D.prototype.onEnterFrame = function () {}
SimpleEngine2D.prototype.onLoadImages = function () {}
SimpleEngine2D.prototype.onLoadRastrResource = function () {}
SimpleEngine2D.prototype.tick = function () {
	var sz = SE2D.sprites.length, i, spr;
	SE2D.c.clearRect(0, 0, SE2D.w, SE2D.h);
	for (i = 0; i < sz; i +=1) {
		spr = SE2D.sprites[i];
		if (spr.visible != false) {
			SE2D.draw(spr);
			spr.setMouseXY();
		}
	}
	SE2D.onEnterFrame();
}
//TODO когда дойдешь до рекурсии, до отрисовки графики потомков, не забудь умножать для них spr.x, spr.y нв scaleX родителя
/**
 * @param {Sprite} s
 * @param {Number} offsetX
 * @param {Number} offsetY
*/
SimpleEngine2D.prototype.draw = function(s, offsetX, offsetY, lvl) {
	var arr = s.childs, i, L = arr.length,
		parentScx, parentScy, o;
	offsetX = offsetX ? offsetX : 0;
	offsetY = offsetY ? offsetY : 0;
	
	parentScx = s.scaleX;
	parentScy = s.scaleY;
	o = s;
	while (o.parentClip) {
		o = o.parentClip;
		if (!o.isRoot) {
			parentScx *= o.scaleX;
			parentScy *= o.scaleY;
		}
	}
	
	lvl = +lvl ? +lvl : 0;
	
	if (s instanceof TextField) {
		var tfm = s.getTextFormat(),
		c = SE2D.c,
		sFColor = c.fillStyle,
		sColor = c.strokeStyle;
		c.fillStyle  = SE2D.parseColor(tfm.color);
		c.strokeStyle = SE2D.parseColor(tfm.color);
		//TODO size with scaleY
		c.font = tfm.size + "px " + tfm.font;
		if (!s.stroke) {
			c.fillText(s.text, (s.x + offsetX) * parentScx, (s.y + offsetY) * parentScy + tfm.size);
		} else {
			c.strokeText(s.text, (s.x + offsetX) * parentScx, (s.y + offsetY) * parentScy + tfm.size);
		}
		c.fillStyle = sFColor;
		c.strokeStyle = sColor;
	}
	
	
	if (s.img) {
		if (!s.fixSize) {
			SE2D.c.drawImage(s.img, (s.x + offsetX) * parentScx, (s.y + offsetY) * parentScy, s.img.width * parentScx, s.img.height *  parentScy);
		} else {
			SE2D.c.drawImage(s.img, (s.x + offsetX) * parentScx, (s.y + offsetY) * parentScy);
		}
	}
	
	//Вообще-то Сначала берем графикс и рисуем его, но тут пока так
	/*$objects = $displayObject->graphics->_objects;
	$this->_drawGraphics($objects, $offsetX  + $displayObject->x, $offsetY  + $displayObject->y);*/
	

	if (s.graphics._objects.length) {
		SE2D.drawGraphics(s.graphics, (s.x + offsetX) * parentScx, (s.y + offsetY) * parentScy, (s.id == 's1'));
	}
	
	for (i = 0; i < L; i++) {
		if (arr[i].visible) {
			SE2D.draw(arr[i], (s.x + offsetX), (s.y + offsetY), lvl + 1);
		}
	}
}
/**
 * @param {String} path to image
 * @param {String} rastrId
*/
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
	o.parentClip = se2d._root;
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
	SE2D.onMouseMove(e);
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
 * @description Мониторит координаты курсора мыши
*/
SimpleEngine2D.prototype.onMouseMove = function (e) {
	SE2D.mouseX = e.x || e.layerX  || (e.clientX - SE2D.canvas.offsetLeft);
	SE2D.mouseY = e.y || e.layerY  || (e.clientY - SE2D.canvas.offsetTop);
}
/**
 * @description Удалить клип
 * @param {String}|{Sprite} id
*/
SimpleEngine2D.prototype.remove = function (id) {
	var i, copy = [], strId = id, j,
	/** @var {Array of String} aClipIdList идентификаторы клипов, записаных в соответствующую ячейку сетки */
	aClipIdList, 
	/** @var {} принимает значения идентификаторов ячееек сетки, в которых записан id клипа */
	cellId;
	if (!(id instanceof Sprite)) {
		id = SE2D._root[id];
	}
	if (!(id instanceof Sprite)) {
		return;
	}
	//Уничтожить ссылки на удаляемый клип в this.grid (туда их записывает метод go)
	for (i = 0; i < id.cells.length; i++) {
		cellId = id.cells[i][0] + '_' + id.cells[i][1];
		aClipIdList = this.grid[cellId];
		if (aClipIdList) {
			for (j in aClipIdList) {
				delete this.grid[cellId][j];
			}
		}
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
 * @description Отрисовка объекта Graphics клипов
 * @param {Graphics} graphics
 * @param {Number} dx
 * @param {Number} dy
*/
SimpleEngine2D.prototype.drawGraphics = function(graphics, dx, dy, dbg) {
	var j, G = graphics._objects, L = G.length, c = SE2D.c, p, 
		lastStart, color, scaleX = graphics._parent.scaleX, 
		scaleY = graphics._parent.scaleY, fillStart = 0,
		parent = graphics._parent, iP = parent;
	var parentScx = scaleX,
		parentScy = scaleY;
	;
	while (iP.parentClip) {
		iP = iP.parentClip;
		if (!iP.isRoot) {
			parentScx *= iP.scaleX;
			parentScy *= iP.scaleY;
		}
	}
	scaleX = parentScx;
	scaleY = parentScx;

	
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
				if (p.color || p.color == 0) {
					color = this.parseColor(p.color);
					c.strokeStyle = color;
				}
				if (p.is_begin_fill && p.fill_color) {
					color = this.parseColor(p.fill_color);
					c.fillStyle = color; //'#ff0000'
					fillStart = 1;
				}
				if (p.is_end_fill) {
					c.closePath();
					c.stroke();
					c.fill();
					c.fillStyle = '#FFFFFF';
					fillStart = 0;
				}
				if (p.is_start) {
					c.beginPath();
					
					c.moveTo(lastStart.x * scaleX + dx, lastStart.y * scaleY + dy);
					lastStart = p;
				} else if (lastStart.x || lastStart.x === 0) {
					c.lineTo( p.x * scaleX  + dx, p.y * scaleY + dy);
					if (!fillStart) {
						c.stroke();
					}
				} else {
					Error('On index k = ' + j +  ' lastObject not containt x ');
				}
			} else if (p.type == graphics.TYPE_RECT){
				if (p.fill_color) {
					color = SE2D.parseColor(p.fill_color);
					//$this->_pdf->SetFillColor($c->r, $c->g, $c->b);
					c.fillStyle = color;
					c.fillRect( p.x * scaleX + dx, p.y * scaleY + dy, p.w * scaleX, p.h * scaleY);
				} else {
					//console.log(p);
					c.strokeStyle = this.parseColor(p.color);
					c.strokeRect( p.x * scaleX + dx, p.y * scaleY + dy, p.w * scaleX, p.h * scaleY);
				}
				
			}
		} else {
			Error('Unexpected object!');
		}
		
		//end insert
	}
}
SimpleEngine2D.prototype.parseColor = function(c) {
	//console.log('call parseColor ' + c);
	if (c == 0) {
		return '#000001';
	}
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
