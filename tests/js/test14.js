Math.trunc = Math.trunc || function(x) {
	return x - x % 1;
}

// Variables globales de utilidad
var canvas = document.querySelector("canvas");
var ctx = canvas.getContext("2d");
var w = canvas.width;
var h = canvas.height;
var oldTime=0;

// GAME FRAMEWORK 
var GF = function(){

 	// variables para contar frames/s, usadas por measureFPS
 	var frameCount = 0;
 	var lastTime;
 	var fpsContainer;
 	var fps; 

    //  variable global temporalmente para poder testear el ejercicio
    inputStates = {
    	left: false,
    	right: false,
    	up: false,
    	down: false,
    	space: false
    };

    const TILE_WIDTH=24, TILE_HEIGHT=24;
    var numGhosts = 4;
    var ghostcolor = {};
    ghostcolor[0] = "rgba(255, 0, 0, 255)";
    ghostcolor[1] = "rgba(255, 128, 255, 255)";
    ghostcolor[2] = "rgba(128, 255, 255, 255)";
    ghostcolor[3] = "rgba(255, 128, 0,   255)";
	ghostcolor[4] = "rgba(50, 50, 255,   255)"; // blue, vulnerable ghost
	ghostcolor[5] = "rgba(255, 255, 255, 255)"; // white, flashing ghost


	// hold ghost objects
	var ghosts = {};

	var Ghost = function(id, ctx){

		this.x = 0;
		this.y = 0;
		this.velX = 0;
		this.velY = 0;
		this.speed = 1;
		
		this.nearestRow = 0;
		this.nearestCol = 0;

		this.ctx = ctx;

		this.id = id;
		this.homeX = 0;
		this.homeY = 0;

		this.sprite=0;
		this.sprites = [];
		//derecha
		this.sprites[0] = new Sprite('./res/img/sprites.png', [456, 16*this.id + 65], [16,16], 0.005, [0,1]);
		this.sprites[1] = new Sprite('./res/img/sprites.png', [583, 65], [16,16], 0.005, [0,1]);
		this.sprites[2] = new Sprite('./res/img/sprites.png', [615, 65], [16,16], 0.005, [0,1]);
		this.sprites[3] = new Sprite('./res/img/sprites.png', [588, 84], [10,6], 0.005, [0,1]);
		//izquierda
		this.sprites[4] = new Sprite('./res/img/sprites.png', [488, 16*this.id + 65], [16,16], 0.005, [0,1]);
		//arriba
		this.sprites[5] = new Sprite('./res/img/sprites.png', [520, 16*this.id + 65], [16,16], 0.005, [0,1]);
		//abajo
		this.sprites[6] = new Sprite('./res/img/sprites.png', [552, 16*this.id + 65], [16,16], 0.005, [0,1]);

		this.draw = function(){
			if (this.state == Ghost.NORMAL){
				this.sprite.render(this.ctx, this.x-(thisGame.TILE_WIDTH/2),this.y-(thisGame.TILE_HEIGHT/2));
			} else if (this.state == Ghost.VULNERABLE){
				if (thisGame.ghostTimer>100||(0<thisGame.ghostTimer &&thisGame.ghostTimer<25)||(50<thisGame.ghostTimer &&thisGame.ghostTimer<75)){
					this.sprites[1].render(this.ctx, this.x-(thisGame.TILE_WIDTH/2),this.y-(thisGame.TILE_HEIGHT/2));
				} else if((25<=thisGame.ghostTimer &&thisGame.ghostTimer<=50)||(75<=thisGame.ghostTimer &&thisGame.ghostTimer<=100)){
					this.sprites[2].render(this.ctx, this.x-(thisGame.TILE_WIDTH/2),this.y-(thisGame.TILE_HEIGHT/2));
				}
			} else if(this.state == Ghost.SPECTACLES){
				this.sprites[3].render(this.ctx, this.x-(thisGame.TILE_WIDTH/2),this.y-(thisGame.TILE_HEIGHT/2));
			}
	    }; // draw

	    this.move = function() {

	    	var posiblesMovimientos = [ [0,-1], [1,0], [0,1], [-1,0] ];
	    	var soluciones = [];
	    	this.nearestRow = Math.trunc(this.y/thisGame.TILE_HEIGHT);
	    	this.nearestCol = Math.trunc(this.x/thisGame.TILE_WIDTH);
	    	if(thisGame.mode == thisGame.NORMAL){
	    		if (this.y%(thisGame.TILE_HEIGHT/2)==0 &&this.x%(thisGame.TILE_WIDTH/2)==0 &&this.y%thisGame.TILE_HEIGHT!=0 && this.x%thisGame.TILE_WIDTH!=0){			
	    			for(var i=0;i<posiblesMovimientos.length;i++){
	    				if (!thisLevel.isWall(this.nearestRow+posiblesMovimientos[i][1], this.nearestCol+posiblesMovimientos[i][0])){					
	    					soluciones.push(posiblesMovimientos[i]);
	    				}
	    			}
	    			var esPared=false;
	    			if(this.velX > 0 && thisLevel.isWall(this.nearestRow, this.nearestCol+1)){
	    				esPared = true;
	    			}
	    			if (this.velX < 0 && thisLevel.isWall(this.nearestRow, this.nearestCol-1)){
	    				esPared = true;
	    			}
	    			if(this.velY >0 && thisLevel.isWall(this.nearestRow+1, this.nearestCol)){
	    				esPared = true;
	    			}
	    			if(this.velY < 0 && thisLevel.isWall(this.nearestRow-1, this.nearestCol)){
	    				esPared = true;
	    			}		

	    			if (esPared || soluciones.length >=3){
	    				var solucionRandom =Math.floor((Math.random() * soluciones.length) + 0);
	    				this.velX = this.speed*soluciones[solucionRandom][0];
	    				this.velY = this.speed*soluciones[solucionRandom][1];
	    				this.x = this.x + this.velX;
	    				this.y = this.y + this.velY;
	    			} else {
	    				this.x = this.x + this.velX;
	    				this.y = this.y + this.velY;
	    			}			
	    		}else {
	    			this.x = this.x + this.velX;
	    			this.y = this.y + this.velY;
	    		}
	    		if(this.state == Ghost.SPECTACLES){
	    			var homeYfantasma = Math.trunc(this.homeY/thisGame.TILE_HEIGHT);
	    			var homeXfantasma = Math.trunc(this.homeX/thisGame.TILE_WIDTH);						
	    			if (this.nearestCol == homeXfantasma && this.nearestRow == homeYfantasma){
	    				this.x = this.homeX;
	    				this.y = this.homeY;
	    				this.state = Ghost.NORMAL;					
	    			}else {
	    				this.x = this.x + this.velX;
	    				this.y = this.y + this.velY;
	    			}
	    		}
	    	}

	    	console.log("velX: "+ this.velX +", velY: "+ this.velY);
	    	if (this.velX==-1){
	    		this.sprite = this.sprites[4];
	    	} else if (this.velX==1){
	    		this.sprite = this.sprites[0];
	    	} else if (this.velY==-1){
	    		this.sprite = this.sprites[5];
	    	} else if (this.velY==1){
	    		this.sprite = this.sprites[6];
	    	}
	    	this.sprite.update(delta);
	    };

	}; // fin clase Ghost

	 // static variables
	 Ghost.NORMAL = 1;
	 Ghost.VULNERABLE = 2;
	 Ghost.SPECTACLES = 3;

	 var Level = function(ctx) {
	 	this.ctx = ctx;
	 	this.lvlWidth = 0;
	 	this.lvlHeight = 0;

	 	this.map = [];

	 	this.pellets = 0;
	 	this.powerPelletBlinkTimer = 0;

	 	this.setMapTile = function(row, col, newValue){
	 		if(newValue == 2 ||newValue == 3){
	 			this.pellets++;
	 		}
	 		this.map[(row*this.lvlWidth)+col] = newValue;
	 	};

	 	this.getMapTile = function(row, col){
	 		return this.map[(row*this.lvlWidth)+col];
	 	};

	 	this.printMap = function(){
	 		console.log(this.map);
	 	};

	 	this.loadLevel = function(){
		// leer res/levels/1.txt y guardarlo en el atributo map	
		// haciendo uso de setMapTile
		$.ajaxSetup({async:false});

		$.get("./res/levels/1.txt", (data) => {    
			var trozos = data.split("#");

				//cojo el ancho
				var valores = trozos[1].split(" ");
				this.lvlWidth = valores[2];

				//cojo la altura
				valores = trozos[2].split(" ");
				this.lvlHeight = valores[2];

				//cojo los valores
				valores = trozos[3].split("\n");
				var filas = valores.slice(1,valores.length-1);

				$.each(filas, (n, elem1) => {
					var nums = elem1.split(" ");
					$.each(nums, (m, elem2) => {
						this.setMapTile(n,m,elem2);
					});
				});
			});
		this.printMap();
	};

	this.drawMap = function(){

		var TILE_WIDTH = thisGame.TILE_WIDTH;
		var TILE_HEIGHT = thisGame.TILE_HEIGHT;

		var tileID = {
			'door-h' : 20,
			'door-v' : 21,
			'pellet-power' : 3
		};

		 //contar para pintar o no pildoras
		 if (this.powerPelletBlinkTimer<60){
		 	this.powerPelletBlinkTimer++;
		 }
		 else{
		 	this.powerPelletBlinkTimer=0;
		 }
		 for (var fila=0; fila<=thisGame.screenTileSize[0];fila++){
		 	for (var colum=0; colum <thisGame.screenTileSize[1];colum++){
		 		var baldosa = this.getMapTile(fila, colum);
					if (baldosa==2){//pildora
						ctx.beginPath();
						ctx.arc(colum*TILE_HEIGHT+TILE_HEIGHT/2,fila*TILE_WIDTH+TILE_WIDTH/2,3,0,360); 						
						ctx.fillStyle="#FFFFFF";
						ctx.fill();
					}else if(baldosa==3){//pildora de poder
						if(this.powerPelletBlinkTimer<30){
							ctx.beginPath();
							ctx.arc(colum*TILE_HEIGHT+TILE_HEIGHT/2,fila*TILE_WIDTH+TILE_WIDTH/2,3,0,360);
							ctx.fillStyle="#FF0000";
							ctx.fill();
						}						
					}else if(baldosa==4){//packman

					}else if(10<=baldosa && baldosa<=13){//fantasmas
						ctx.fillStyle="#000000";
						ctx.fillRect(colum*TILE_HEIGHT,fila*TILE_WIDTH,TILE_WIDTH,TILE_HEIGHT);
					}else if(100<=baldosa && baldosa<=199){//trozo de pared azul
						ctx.fillStyle="#0000FF";
						ctx.fillRect(colum*TILE_HEIGHT,fila*TILE_WIDTH,TILE_WIDTH,TILE_HEIGHT);																
					}
				}
			}
			displayScore();
			if(thisGame.mode == thisGame.GAME_OVER){
				gameOver();
			} else if(thisGame.mode == thisGame.WIN){
				youWin();
			}
		};


		this.isWall = function(row, col) {
			var baldosa = this.getMapTile(row,col);
			//trozo de pared azul
			return (100<=baldosa && baldosa<=199);
		};


		this.checkIfHitWall = function(possiblePlayerX, possiblePlayerY, row, col){
			var esPared = false;
			if(possiblePlayerX%(thisGame.TILE_HEIGHT/2)==0||possiblePlayerY%(thisGame.TILE_WIDTH/2)==0){
				var fila = Math.trunc(possiblePlayerY/thisGame.TILE_HEIGHT);
				var colum = Math.trunc(possiblePlayerX/thisGame.TILE_WIDTH);
				esPared = this.isWall(fila, colum);
			}
			else{
				esPared = true;
			} 
			return esPared;
		};

		this.checkIfHit = function(playerX, playerY, x, y, holgura){
			if(Math.abs(playerX - x) > holgura || Math.abs(playerY - y) > holgura){
				return false;
			}else{
				return true;
			}
		};


		this.checkIfHitSomething = function(playerX, playerY, row, col){
			var tileID = {
				'door-h' : 20,
				'door-v' : 21,
				'pellet-power' : 3,
				'pellet': 2
			};

			var baldosa = this.getMapTile(row, col);

			if(baldosa == 2 || baldosa ==3){
				this.pellets--;
				this.setMapTile(row, col, 0);
				if(this.pellets==0){
					console.log("NEXT LEVEL!!!!!!!");
					thisGame.setMode(thisGame.WIN);
					guardarPuntuacion(thisGame.points);
				}
				eating.play();
			}
			//  Gestiona las puertas teletransportadoras
			if (baldosa==20){
				//de izquierda a derecha
				if(col==0){
					player.x = (thisGame.screenTileSize[1]-1)*thisGame.TILE_WIDTH-thisGame.TILE_WIDTH/2;
					player.y = playerY;
				} else {//de derecha a izquierda
					player.x = thisGame.TILE_WIDTH+thisGame.TILE_WIDTH/2;
					player.y = playerY;
				}
			} else if(baldosa==21){
				//de arriba a abajo
				if(row==0){
					player.y = (thisGame.screenTileSize[0]-1)*thisGame.TILE_HEIGHT-thisGame.TILE_HEIGHT/2;
					player.x = playerX;
				} else { //de abajo a arriba
					player.y = thisGame.TILE_HEIGHT+thisGame.TILE_HEIGHT/2;
					player.x = playerX;
				}
			}
			
			// Gestiona la recogida de píldoras de poder		
			// (cambia el estado de los fantasmas)
			if(baldosa ==3){
				for (var i=0; i< numGhosts; i++){
					var fantasma = ghosts[i];
					fantasma.state = Ghost.VULNERABLE;
					thisGame.ghostTimer = 360;
					thisGame.addToScore();
				}
				eatpill.play();

			}

		};

	}; // end Level 

	var Pacman = function() {
		this.radius = 10;
		this.x = 0;
		this.y = 0;
		this.speed = 3;
		this.angle1 = 0.25;
		this.angle2 = 1.75;
		this.sprites = [];
		this.sprites[0] = new Sprite('./res/img/sprites.png', [454,0], [16,16], 0.005, [0,1,2]);
		this.sprites[1] = new Sprite('./res/img/sprites.png', [502,0], [16,16], 0.005, [0,1,2,3,4,5,6,7,8,9,10]);
		this.sprites[2] = new Sprite('./res/img/sprites.png', [454,32], [16,16], 0.005, [0,1]);
		this.sprites[3] = new Sprite('./res/img/sprites.png', [454,48], [16,16], 0.005, [0,1]);
		this.sprites[4] = new Sprite('./res/img/sprites.png', [454,16], [16,16], 0.005, [0,1]);
		this.sprite = 0;
	};

	Pacman.prototype.move = function() {

		if (player.velX==-3){
			this.sprite = this.sprites[4];
		} else if (player.velX==3){
			this.sprite = this.sprites[0];
		} else if (player.velY==-3){
			this.sprite = this.sprites[2];
		} else if (player.velY==3){
			this.sprite = this.sprites[3];
		}
		
		this.sprite.update(delta);
		
		
		if(player.radius <= player.x && player.x <= w-player.radius){
			player.x = player.x + player.velX;
		} else if(player.radius > player.x){
			player.x = player.radius;
		} else if(player.x > w-player.radius){
			player.x= w-player.radius;
		}

		if(player.radius <= player.y && player.y <= h-player.radius){
			player.y = player.y+player.velY;
		} else if(player.radius > player.y){
			player.y = player.radius;
		} else if(player.y > h-player.radius){
			player.y = h-player.radius;
		}
		//  Gestiona las puertas teletransportadoras
		this.x = player.x;
		this.y = player.y;
		this.nearestRow = Math.trunc(player.y/thisGame.TILE_HEIGHT);
		this.nearestCol = Math.trunc(player.x/thisGame.TILE_WIDTH);
		thisLevel.checkIfHitSomething(this.x, this.y, this.nearestRow, this.nearestCol);

		//Si chocamos contra un fantasma y su estado es Ghost.VULNERABLE
		//cambiar velocidad del fantasma y pasarlo a modo Ghost.SPECTACLES
		for (var i=0; i< numGhosts; i++){
			var fantasma = ghosts[i];
			if (thisLevel.checkIfHit(this.x, this.y, fantasma.x, fantasma.y, thisGame.TILE_WIDTH/2)){
				if (fantasma.state == Ghost.VULNERABLE){					
					fantasma.state = Ghost.SPECTACLES;
					thisGame.addToScore();
					ghost_eaten.play();
					var velocidadX = fantasma.homeX-fantasma.x;
					var velocidadY = fantasma.homeY-fantasma.y;
					fantasma.velX = velocidadX*fantasma.speed/Math.abs(Math.max(velocidadX, velocidadY));
					fantasma.velY = velocidadY*fantasma.speed/Math.abs(Math.max(velocidadX, velocidadY));
				} 
				else if (fantasma.state == Ghost.NORMAL){					
					thisGame.lifes--;
					die.play();
					if (thisGame.lifes>0 ){
						thisGame.setMode(thisGame.HIT_GHOST);	
					} else{
						thisGame.setMode(thisGame.GAME_OVER);
					}					
				}				
			}			
		}
	};


     // Función para pintar el Pacman
     Pacman.prototype.draw = function(x, y) {
     	player.sprite.render(ctx,player.x-(thisGame.TILE_WIDTH/2),player.y-(thisGame.TILE_HEIGHT/2));
     };

     var player = new Pacman();
     for (var i=0; i< numGhosts; i++){
     	ghosts[i] = new Ghost(i, canvas.getContext("2d"));
     }


     var thisGame = {
     	getLevelNum : function(){
     		return 0;
     	},
     	setMode : function(mode) {
     		this.mode = mode;
     		this.modeTimer = 0;
     	},
     	addToScore : function(){
     		thisGame.points = thisGame.points + thisGame.puntos;
     	},
     	screenTileSize: [24, 21],
     	TILE_WIDTH: 24, 
     	TILE_HEIGHT: 24,
     	ghostTimer: 0,
     	NORMAL : 1,
     	HIT_GHOST : 2,
     	GAME_OVER : 3,
     	WAIT_TO_START: 4,
     	WIN: 5,
     	modeTimer: 0,
     	lifes : 3,
     	points : 0,
     	highscore : 0,
     	puntos:100
     };

     var thisLevel = new Level(canvas.getContext("2d"));
     thisLevel.loadLevel( thisGame.getLevelNum() );
	// thisLevel.printMap(); 

	var displayScore = function(){
		thisGame.highscore = cargarPuntuacion();
		ctx.font = "bold 25px sans-serif";
		ctx.fillStyle="#FF0000";
		ctx.fillText("HIGH SCORE " + thisGame.highscore ,300,22);
		ctx.fillText("POINTS "+ thisGame.points,22,22);
		ctx.fillText("LIFES "+ thisGame.lifes,121,598);
	};

	var gameOver = function(){
		ctx.font = "bold 50px sans-serif";
		ctx.fillStyle="#FF0000";
		ctx.fillText("GAME OVER ",100,320);
	};

	var youWin = function(){
		ctx.font = "bold 50px sans-serif";
		ctx.fillStyle="#FF0000";
		ctx.fillText("YOU WIN!!!",100,320);
	};

	var measureFPS = function(newTime){
		// la primera ejecución tiene una condición especial

		if(lastTime === undefined) {
			lastTime = newTime; 
			return;
		}

		// calcular el delta entre el frame actual y el anterior
		var diffTime = newTime - lastTime; 

		if (diffTime >= 1000) {

			fps = frameCount;    
			frameCount = 0;
			lastTime = newTime;
		}

		// mostrar los FPS en una capa del documento
		// que hemos construído en la función start()
		fpsContainer.innerHTML = 'FPS: ' + fps; 
		frameCount++;
	};

	// clears the canvas content
	var clearCanvas = function() {
		ctx.clearRect(0, 0, w, h);
	};

	var recuperarAnterior= function(dirAnterior){
		if (dirAnterior=="left"){
			inputStates.left=true;
		} else if(dirAnterior=="right"){
			inputStates.right=true;
		} else if(dirAnterior=="up"){
			inputStates.up=true;
		} else if(dirAnterior=="down"){
			inputStates.down=true;
		}
	};

	var dirAnterior="";

	var checkInputs = function(){
		var row = Math.trunc(player.y/thisGame.TILE_HEIGHT);
		var	col = Math.trunc(player.x/thisGame.TILE_WIDTH);
		//divisibles entre 12 y no entre 24
		if (player.y%(thisGame.TILE_HEIGHT/2)===0 && player.x%(thisGame.TILE_WIDTH/2)==0 && player.y%(thisGame.TILE_HEIGHT)!=0 && player.x%(thisGame.TILE_WIDTH)!=0) {
			if(inputStates.left){
				if (!thisLevel.checkIfHitWall(player.x - 5*player.speed, player.y, row, col)){
					dirAnterior = "left";
					player.velX=-player.speed;
					player.velY=0;
				}else{
					player.velX = 0;
					player.velY = 0;
					inputStates.left=false;
					recuperarAnterior(dirAnterior);
				}			
			} else if (inputStates.right){
				if (!thisLevel.checkIfHitWall(player.x + 4*player.speed, player.y, row, col)){
					dirAnterior = "right";
					player.velX=player.speed;
					player.velY=0;
				} else{
					player.velX = 0;
					player.velY = 0;
					inputStates.right=false;
					recuperarAnterior(dirAnterior);
				}				
			} else if (inputStates.up){
				if (!thisLevel.checkIfHitWall(player.x, player.y - 5*player.speed, row, col)){
					dirAnterior = "up";
					player.velY=-player.speed;
					player.velX=0;
				}else{
					player.velX = 0;
					player.velY = 0;
					inputStates.up=false;
					recuperarAnterior(dirAnterior);
				}	
			} else if (inputStates.down){
				if (!thisLevel.checkIfHitWall(player.x, player.y + 4*player.speed, row, col)){
					dirAnterior = "down";
					player.velY=player.speed;
					player.velX=0;
				}else{
					player.velX = 0;
					player.velY = 0;
					inputStates.down=false;
					recuperarAnterior(dirAnterior);
				}	

			} else if (inputStates.space){
				console.log("Se ha pulsado espacio");
			} else{
				if (!thisLevel.checkIfHitWall(player.x + 4*player.speed, player.y, row, col)){
					dirAnterior = "right";
					player.velX=player.speed;
					player.velY=0;
				}else{
					player.velX=0;
					player.velY = 0;
					recuperarAnterior(dirAnterior);
				}
			} 
		}		
	};

	var updateTimers = function(){
		// Actualizar thisGame.ghostTimer (y el estado de los fantasmas, tal y como se especifica en el enunciado)
		if (thisGame.ghostTimer>0){
			thisGame.ghostTimer--;
		} else {
			for (var i=0; i< numGhosts; i++){
				var fantasma = ghosts[i];
				if(fantasma.state==Ghost.VULNERABLE){
					fantasma.state = Ghost.NORMAL;
				}
			}
			thisGame.ghostTimer = 0;
		}
		// actualiza modeTimer...
		thisGame.modeTimer++;
	};

	var timer = function(currentTime) {
		var aux = currentTime - oldTime;
		oldTime = currentTime;
		return aux;
	};

	var mainLoop = function(time){
		//main function, called each frame 
		measureFPS(time);
		delta = timer(time);
	    // sólo en modo NORMAL
	    if(thisGame.mode==thisGame.NORMAL){
	    	checkInputs();

			// Mover fantasmas
			for (var i=0; i< numGhosts; i++){
				var fantasma = ghosts[i];
				fantasma.move();
			}

			player.move();		
		}

	    // en modo HIT_GHOST
	    if(thisGame.mode==thisGame.HIT_GHOST){
	    	if(thisGame.modeTimer==90){
	    		thisGame.setMode(thisGame.WAIT_TO_START);
	    	}

	    }
	   	// Clear the canvas
	   	clearCanvas();

	   	thisLevel.drawMap();

		// Pintar fantasmas
		for (var i=0; i< numGhosts; i++){
			var fantasma = ghosts[i];
			fantasma.draw();
		}

		player.draw();

		updateTimers();

		 // en modo WAIT_TO_START
		 if(thisGame.mode==thisGame.WAIT_TO_START){
		 	if(thisGame.modeTimer==30){		 		
	    		// call the animation loop every 1/60th of second
	    		//requestAnimationFrame(mainLoop);
	    		reset();
	    	}
	    }
	    if(thisGame.mode!=thisGame.GAME_OVER ||thisGame.mode!=thisGame.WIN){
	    	// call the animation loop every 1/60th of second
	    	requestAnimationFrame(mainLoop);
	    } else{
	    	siren.stop();
	    }
	};

	var addListeners = function(){
		window.addEventListener( "keydown", function(evento){
			tecla = evento.keyCode; 
			if(tecla==37){
				inputStates.left=true;
				inputStates.right=false;
				inputStates.up=false;
				inputStates.down=false;
				inputStates.space=false;
			}else if(tecla==39){
				inputStates.right=true;
				inputStates.left=false;
				inputStates.up=false;
				inputStates.down=false;
				inputStates.space=false;
			}else if(tecla==38){
				inputStates.up=true;
				inputStates.right=false;
				inputStates.left=false;
				inputStates.down=false;
				inputStates.space=false;
			}else if(tecla==40){
				inputStates.down=true;
				inputStates.up=false;
				inputStates.right=false;
				inputStates.left=false;
				inputStates.space=false;
			}else if(tecla==32){
				inputStates.space=true;
				inputStates.down=false;
				inputStates.up=false;
				inputStates.right=false;
				inputStates.left=false;
			}

		}, false );
	};

	var reset = function(){
		var fila = 0;
		var colum = 0;
		var todos,encontrado = false;
		var i=0;
		while(fila<=thisGame.screenTileSize[0]&&!encontrado&&!todos){
			while(colum <thisGame.screenTileSize[1]&&!encontrado&&!todos){
				baldosa = thisLevel.getMapTile(fila,colum);
				if (baldosa==4){
					player.x= colum*thisGame.TILE_WIDTH+thisGame.TILE_WIDTH/2;
					player.y = fila*thisGame.TILE_HEIGHT+thisGame.TILE_HEIGHT/2;					
					player.speed = 3;
					encontrado = true;
				} else if(10<=baldosa && baldosa<=13){
					ghosts[i].state = Ghost.NORMAL;    				
					if (baldosa==10){
						ghosts[i].x = colum*thisGame.TILE_WIDTH+thisGame.TILE_WIDTH/2;
						ghosts[i].y = fila*thisGame.TILE_HEIGHT+thisGame.TILE_HEIGHT/2;
						ghosts[i].homeX = ghosts[i].x;
						ghosts[i].homeY = ghosts[i].y;
						ghosts[i].velX = ghosts[i].speed;
						i++;    					
					} else if(baldosa==11){
						ghosts[i].x = colum*thisGame.TILE_WIDTH+thisGame.TILE_WIDTH/2;
						ghosts[i].y = fila*thisGame.TILE_HEIGHT+thisGame.TILE_HEIGHT/2;
						ghosts[i].homeX = ghosts[i].x;
						ghosts[i].homeY = ghosts[i].y;
						ghosts[i].velX = ghosts[i].speed;    					
						i++;
					}else if(baldosa==12){
						ghosts[i].x = colum*thisGame.TILE_WIDTH+thisGame.TILE_WIDTH/2;
						ghosts[i].y = fila*thisGame.TILE_HEIGHT+thisGame.TILE_HEIGHT/2;
						ghosts[i].homeX = ghosts[i].x;
						ghosts[i].homeY = ghosts[i].y;  
						ghosts[i].velX = ghosts[i].speed;					
						i++;
					}else if(baldosa==13){
						ghosts[i].x = colum*thisGame.TILE_WIDTH+thisGame.TILE_WIDTH/2;
						ghosts[i].y = fila*thisGame.TILE_HEIGHT+thisGame.TILE_HEIGHT/2;
						ghosts[i].homeX = ghosts[i].x;
						ghosts[i].homeY = ghosts[i].y;
						ghosts[i].velX = ghosts[i].speed;				
						i++;
					}
					if (i>numGhosts){
						todos = true;
					}    				
				}    			
				colum++;
			}
			colum=0;
			fila++;
		}
	    // test14
	    thisGame.setMode(thisGame.NORMAL);
	};

	var start = function(){
        // adds a div for displaying the fps value
        fpsContainer = document.createElement('div');
        document.body.appendChild(fpsContainer);

        addListeners();

        reset();

        resources.load([
        	'./res/img/sprites.png'
        	]);
        resources.onReady(init);

    };

    function guardarPuntuacion(puntos) {
    	var puntosLocal = parseInt(localStorage.getItem("puntos"));
    	if(puntosLocal<puntos){
    		localStorage.setItem("puntos", puntos); 	
    	}
    	localStorage.setItem("puntos", puntos); 	
    }

    function cargarPuntuacion() {
    	console.log(parseInt(localStorage.getItem("puntos")));
    	return parseInt(localStorage.getItem("puntos"));    

    }

    function init(){
    	loadAssets();
    }

    function loadAssets(){
    	eatpill = new Howl({
    		src: ['./res/sounds/eat_pill.mp3'],
    		volume: 1,
    		onload: function() {
    			eating = new Howl({
    				src: ['./res/sounds/eating.mp3'],
    				volume: 1,
    				onload: function() {
    					siren = new Howl({
    						src: ['./res/sounds/siren.mp3'],
    						autoplay: true,
    						loop: true,
    						volume: 1,
    						onload: function() {
    							waza = new Howl({
    								src: ['./res/sounds/waza.mp3'],
    								volume: 2,
    								onload: function() {
    									die = new Howl({
    										src: ['./res/sounds/die.mp3'],
    										volume: 1,
    										onload: function() {
    											eat_ghost = new Howl({
    												src: ['./res/sounds/eat_ghost.mp3'],
    												volume: 1,
    												onload: function() {
    													ghost_eaten = new Howl({
    														src: ['./res/sounds/ghost_eaten.mp3'],
    														volume: 1,
    														onload: function() {
																requestAnimationFrame(mainLoop); // comenzar animación
															}
														});
    												}
    											});
    										}
    									});
    								}
    							});
    						}
    					});
    				}
    			});
    		}
    	});
    }

    //our GameFramework returns a public API visible from outside its scope
    return {
    	start: start,
    	thisGame: thisGame
    };
};


var game = new GF();
game.start();