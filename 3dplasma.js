// make jslint stop after the first error so we can do all sort of nasty tricks
/*jslint passfail: true*/


// shim layer with setTimeout fallback
window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          function( callback ){
            window.setTimeout(callback, 1000 / 60);
          };
})();

// declare global vars to enable shortening by google closure compiler
var PI, w,h,randW, randH, scr, scrData32, fps, t, st, shm=-1, run=1;

// center canvas, black background
b.style.margin = 0;
b.style.background = 'black';
c.style.display = 'block';
c.style.margin = 'auto';

// make canvas size 1000*800 or adapt to window size
w = c.width = Math.min(innerWidth, 1000);
h = c.height = Math.min(((innerHeight/5)|0)*5, 600);

// draw black background
a.fillStyle = 'black';
a.fillRect(0, 0, w, h);

// set font and font fillstyle
a.font = 'bold 10px arial';
a.fillStyle = 'white';

// shortcut for π
PI = Math.PI;

// create random pattern
randW = randH = 150;

// create random data of randW * randH size
// color value satisfies 0 < v < 0xCF
randData = new Uint32Array(randW*randH);
for (i=0; i<=randW*randH-1; i++) {
    rv = Math.random()*0xCF|0;
    v = 0xFF300030 |(rv<<8);
    randData[i] = v;
}

// read pixel data from canvas and make it available as unsigned int32 array
scr = a.getImageData(0, 0, w, h);
scrData32 = new Uint32Array(scr.data.buffer);

render = function(t, fps) {
    var rt, u, scrpos, randxpos, randypos, randv, scrv, scrrpos, rx, ry, fxy, xmod, ymod, ct, m;

    // set random offset to shift random pattern on each frame to create illusion of new random pattern
    rt = randData[t%randData.length];

    // cycle through horizontal lines but only calculate every 5th line
    for (y = 0; y < h; y+=5) {

        // first loop copies random pattern starting from left
        for (x = 0; x<randW; x++) {
            scrpos = y*w+x;

            // random pattern is repeated horizontally and vertically
            randxpos = x%randW;
            randypos = y%randH;
            randpos = (randypos*randW + randxpos + rt)%randData.length;
            randv = randData[randpos];

            if (shm==1) {
                // black out left column if user has chosen to show the height map
                scrData32[scrpos]=0xFF000000;
            } else {
                // draw random pattern to screen buffer
                scrData32[scrpos]=randv;
            }
        }

        // second loop copies pixel data from left but changes pattern frequency
        // depending on given height of current pixel
        // read http://www.leweyg.com/download/SIRD/AbSIRD/essay.html on how exactly 
        // the algorithm works
        for (x=randW; x<w; x++) {

            scrpos = y*w+x;

            // initialise plasma
            m = 3;
            rx = m*PI*x/w;
            ry = m/2*PI*y/h;
            ct=t/30;

            // calculate current height using three trigonometric functions
            // read http://www.bidouille.org/prog/plasma on how to create a plasma effect
            fxy = Math.sin(rx+ct);
            fxy += Math.cos(ry+ct);
            fxy += Math.sin(3*(rx*Math.sin(ct/6)+ry*Math.cos(ct/4))+ct);

            // correct offset and resize s.t. 0 < fxy < 1
            fxy = (fxy+3)/6;

            // limit height value to add more depth
            fxy = fxy<0.4?0:fxy;

            // scale fxy to width of random pattern. this ratio changes 3d depth
            scrv = (fxy*randW/3)|0;

            // calculate position to read from
            scrrpos = (scrpos-randW+scrv);

            if(shm==1) {
                // show height map if user has chosen to do so
                scrData32[scrpos] = 0xFF000000|(scrv/randW*3*255);
            } else {
                // copy pixel from left
                scrData32[scrpos] = scrData32[scrrpos];
            }
        }

        // copy calculated line three times to fill interleaved gaps
        l = scrData32.subarray(y*w, y*w+w);
        scrData32.set(l, (y+1)*w);
        scrData32.set(l, (y+2)*w);
        scrData32.set(l, (y+3)*w);

    }

    // write rendered frame back to canvas
    a.putImageData(scr, 0, 0);

    // add my name and #f/s
    a.fillText('PHST/13 '+fps.toFixed(2)+' f/s', w-100, h-4);
}

t = fps = 0;
st = new Date().getTime();

// add event listener to bind function keys
document.addEventListener('keydown', function(e) {
    run = e.keyCode==32 ? run*-1 : run*1;
    shm = e.keyCode==72 ? shm*-1 : shm*1;
});

(function loop() {
    requestAnimFrame(loop);
    // only render when running
    if (run==1) {
        render(t++, fps);
        fps = Math.round(10*(t*1E3/(new Date().getTime() - st)))/10;
    }
})();
