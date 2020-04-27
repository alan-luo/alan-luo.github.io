// helper functions
// returns bot <= x < top
let rand = (bot, top) => bot+Math.random()*(top-bot);
let randInt = (bot, top) => Math.floor(rand(bot, top));
let randSgn = () => -1 + 2*randInt(0, 2);
let sq = (x) => x * x;
let norm = (d1, d2) => sq(d1[0]-d2[0])+sq(d1[1]-d2[1]);
let dist = (d1, d2) => Math.sqrt(norm(d1, d2));

// setup code
let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");
ctx.translate(0.5, 0.5);

function resize() {
	canvas.width = 2*canvas.offsetWidth;	
	canvas.height = 2*canvas.offsetHeight;
}
resize();
window.addEventListener("resize", resize);


// draw code
const numDots = 100;

let frames = 0;
let dots = [];
let norms = [];

// init code
for(let i=0; i<numDots; i++) {
	dots.push([
		rand(0, canvas.width),
		rand(0, canvas.height),
		randSgn()*rand(0.1, 1),
		randSgn()*rand(0.1, 1),
		0,
		0,
		]);
	norms.push((new Array(numDots)).fill(0));
}

function calculateNorms() {
	for(let i=0; i<numDots; i++) { const d1 = dots[i];
		for(let j=0; j<i; j++) { const d2 = dots[j];
			norms[i][j] = norm(d1, d2);
		}
	}
}
calculateNorms();

let getCol = (norm) => 0.25-norm/160000;

function loop() {
	if(frames % 10 == 0) {
		calculateNorms();
	}

	ctx.clearRect(0, 0, canvas.width, canvas.height);


	ctx.fillStyle = "#bbb";
	ctx.lineWidth = 1;

	for(i in dots) { const dot = dots[i];
		ctx.beginPath();
		ctx.arc(dot[0], dot[1], 3, 0, 2*Math.PI);
		ctx.fill();

		// apply physics
		dot[0]+=dot[2];
		dot[1]+=dot[3];
		dot[2]+=dot[4];
		dot[3]+=dot[5];

		let doWipe = false;

		if(dot[0] < -5)  			{dot[0]+=canvas.width+10;  doWipe=true;}
		if(dot[0] > canvas.width+5) {dot[0]-=canvas.width+10;  doWipe=true;}
		if(dot[1] < -5) 			{dot[1]+=canvas.height+10; doWipe=true;}
		if(dot[1] > canvas.height+5){dot[1]-=canvas.height+10; doWipe=true;}

		if(doWipe) {
			for(let j=0; j<numDots; j++) {
				if(j<i) norms[i][j] = Infinity;
				else /*j<i*/ norms[j][i] = Infinity;
			};
		}

	}


	for(let i=0; i<numDots; i++) { const d1 = dots[i];
		for(let j=0; j<i; j++) { const d2 = dots[j];
			if(norms[i][j] < 40000) {
				col = getCol(norms[i][j]);
				ctx.strokeStyle = `rgba(40, 40, 10, ${col})`;
				ctx.beginPath();
				ctx.moveTo(d1[0], d1[1]);
				ctx.lineTo(d2[0], d2[1]);
				ctx.stroke();	
			}
		}
	}
	
	// ctx.fillRect(0, 0, 10, 10);
	frames++;
	window.requestAnimationFrame(loop);
}

loop();