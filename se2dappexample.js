/**
 * @class TestSm [artfon]
*/
function TestSm() {
	window.w = window;
	w.SE2D.app = w.SE2D.canvas.app = this;// SE2D.setApp(this);
	w.SE2D.gridCell = 8; //для оптимизации расчета столкновений, 8 взято как сторона "кирпича"
	w.SE2D.onLoadImages = this.onInit;
	w.SE2D.addGraphResources(["4.jpg", "t"
	]);
	
	//SE2D.canvas.onmousemove = this.onMouseMove;
	w.SE2D.onEnterFrame = this.onEnterFrame;
}
/**
 * @description this is SE2D
*/
TestSm.prototype.onInit = function() {
		var o = this;
		this.app.t = w.SE2D._root.t;
		this.app.t.visible = 1;
		this.app.t.scaleX = 1;
		this.app.t.scaleY = 1;
		this.app.t.go(150, 100);

		this.app.dr = 3; 
		this.app.dx = 1;
		this.app.a = ["se2d", "micron", "php.js", "filemanager"];
		this.app.it = 0;
		
		
		setInterval(function(){
		  o.app.dr += o.app.dx;
		  if (o.app.dr > 16 || o.app.dr < 3) {
			  o.app.dx *= -1;
			  
			  o.app.it++;
			  if (o.app.it >= o.app.a.length) {
				  o.app.it = 0;
			  }
		  }
		}, 100);
		
	       
		try{		
  //e("bQuit").value = "Start";
  
		} catch( err ){
		  se( err );
		}
	
		return;
}
/**
 * @description this is SE2D
*/
TestSm.prototype.onEnterFrame = function(e) {
  var app = this.app;
  app.t.rotation += app.dr;
  console.log(app.dr);
}
