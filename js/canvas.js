// do params
let myFill = "#bbb";
let numDots = 100;
let scroll = false;

if(typeof(canvasParams) != "undefined") {
	if(canvasParams.fillColor) myFill = canvasParams.fillColor;
	if(canvasParams.numDots) numDots = canvasParams.numDots;
	if(canvasParams.scroll) scroll = canvasParams.scroll;
}

// helper functions
let rand = (bot, top) => bot+Math.random()*(top-bot);
let randInt = (bot, top) => Math.floor(rand(bot, top));
let randSgn = () => -1 + 2*randInt(0, 2);
let sq = (x) => x * x;
let norm = (d1, d2) => sq(d1[0]-d2[0])+sq(d1[1]-d2[1]);
let diff = (v1, v2) => [v1[0] - v2[0], v1[1] - v2[1]];
let scale = (c, v) => [c*v[0], c*v[1]];
let grav = (c, p) => { // force caused by center on point
	let n = norm(c, p); d = Math.sqrt(n);
	let vec = diff(p, c);
	let mult = (n < 1) ? 1 : 1/n;
	return scale(mult, vec);
};
const zero = [0, 0];

// setup code
let canvas = document.getElementById("head-canvas");
let ctx = canvas.getContext("2d");
ctx.translate(0.5, 0.5);
const canvasScale = 1.8;

function resize() {
	canvas.width = canvasScale*canvas.offsetWidth;	
	canvas.height = canvasScale*canvas.offsetHeight;
}
resize();
window.addEventListener("resize", resize);


// init code

let frames = 0;
let dots = [];
let norms = [];

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

// mouse code
let mouse = [-100, -100];
let particles = [];
let mouseticks = 0;

let force = {on:false, age:0};
function makeParticle(vscale) {
	particles.push({
		data:[
			canvasScale * mouse[0],
			canvasScale * mouse[1],
			vscale * randSgn()*rand(2, 5), 
			vscale * randSgn()*rand(2, 5),
		],
		r:randInt(3, 10),
		color:`${rand(0, 360)}, 60%, 70%`,
		a: 0.6,
		age:0,
		state:0,
	});
}
function mousemove(e) {
	mouse[0] = e.pageX;
	mouse[1] = e.pageY;
	if(scroll) {
		mouse[1]-= window.scrollY;
	}
	makeParticle(1);

	if(mouseticks % 2 == 0) {

			
		if(canvasScale * mouse[1] < canvas.height) {
			force.age = 0;
			force.on = true;
		}
	}
	mouseticks++;
}
window.addEventListener("mousemove", mousemove);

function click() {
	for(let i=0; i<10; i++) {
		makeParticle(2);
	}
}
window.addEventListener("click", click);

// draw code
let getCol = (norm) => 0.25-norm/160000;
ctx.lineWidth = 1;


function loopCanvas() {
	// cache norms for 10 frames each time
	if(frames % 10 == 0) {
		calculateNorms();
	}
	if(frames % 10 == 0) {
		particles = particles.filter((obj) => obj);
	}
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	// update force
	if(force.on) {
		force.age++;
		if(force.age == 50) force.on = false;
	}

	// draw / update dots
	ctx.fillStyle = myFill;
	for(i in dots) { const dot = dots[i];
		ctx.beginPath();
		ctx.arc(dot[0], dot[1], 3, 0, 2*Math.PI);
		ctx.fill();

		// apply physics
		dot[0]+=dot[2];
		dot[1]+=dot[3];
		dot[2]+=dot[4];
		dot[3]+=dot[5];

		if(norm(zero, [dot[2], dot[3]]) > 2) {
			dot[2] *= 0.95;
			dot[3] *= 0.95;
		}
		if(force.on) {
			let f = scale(5, grav(scale(canvasScale, mouse), dot));
			dot[4] = f[0];
			dot[5] = f[1];
		} else {
			dot[4] = 0;
			dot[5] = 0;
		}

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

	// draw lines
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

	// draw / update particles
	for(i in particles) { 
		let p = particles[i]; 
		if(p == null) continue; 
		let data = p.data;


		ctx.fillStyle = `hsla(${p.color}, ${p.a})`;
		ctx.beginPath();
		ctx.arc(data[0], data[1], p.r, 0, 2*Math.PI);
		ctx.fill();

		data[0]+=data[2];
		data[1]+=data[3];
		data[2]*= 0.95;
		data[3]*= 0.95;


		//lifecycle
		if(p.state == 0) {
			if(p.age > 30) {
				p.state = 1;
				p.age = 0;
			}
		} 
		else if(p.state == 1) {
			p.a -= 0.1;
			if(p.age > 30) {
				particles[i] = null;
			}
		}
		p.age++;
	}
	
	// ctx.fillRect(0, 0, 10, 10);
	frames++;
}