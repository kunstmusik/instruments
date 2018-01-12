var touchIds = new Array(10); 
var touches = new Array(10); 
var touchArray = new Array(10); 

for(var i = 0; i < 10; i++) {
  touchIds[i] = 0;
  touches[i] = {x: -100, y: -100};
  touchArray[i] = null; 
}


var cs;


var userAgent = navigator.userAgent || navigator.vendor || window.opera;
var iOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream; 

const touchPanel = document.getElementById("touchPanel");

function resizeTouchPanel() {
  let w = document.body.clientWidth;
  let h = document.body.clientHeight;

  if(touchPanel.width != w || touchPanel.height != h) {
    touchPanel.width = w;
    touchPanel.height = h;
  }
}
resizeTouchPanel();

function drawTouchesImpl(ts) {
  if(touchPanel.getContext) {
    let ctx = touchPanel.getContext("2d");

    let w = touchPanel.parentNode.clientWidth;
    let h = touchPanel.parentNode.clientHeight;

    // clear screen
    ctx.clearRect(0, 0, w, h);

    //// draw info text
    //ctx.fillStyle = '#0f0f0f';
    //ctx.font = '24px Monospace';
    //ctx.fillText("mt0 - 2017.12.28", 48, 60);
   
    // draw touches
    ctx.fillStyle = 'green';

    for(var i = 0; i < 10; i++) {
      let t = touches[i];
      if(t.x >=0 && t.y >= 0) {
        ctx.fillRect(t.x - 10, t.y - 10, 20, 20);
        cs.setControlChannel("touch." + i + ".x", 
          t.x / w);
        cs.setControlChannel("touch." + i + ".y", 
          1 - (t.y / h));
      }
    }
  }
}

function drawTouches() {
  window.requestAnimationFrame(drawTouchesImpl);
}


function getTouchIdAssignment() { 
	for (var i = 0; i < 10; i++) {
		if (touchIds[i] == 0) {
			return i;
		}
	}
	return -1;
}

function getTouchId(t) {
	for (var i = 0; i < 10; i++) {
		if (touchArray[i] != null && 
        touchArray[i].identifier == t.identifier) {
			return i;
		}
	}
	return -1;
}


function touchStart(evt) {
  evt.preventDefault();

  var changedTouches = evt.changedTouches;   
  let w = touchPanel.parentNode.clientWidth;
  let h = touchPanel.parentNode.clientHeight;

  for (var i = 0; i < changedTouches.length; i++) {
    var touchId = getTouchIdAssignment();
    if (touchId != -1) {
      let t = changedTouches[i];
      touchArray[touchId] = t;
      touchIds[touchId] = 1;
      let xy = touches[touchId];
      xy.x = t.clientX;
      xy.y = t.clientY;

      let score = "i1." + touchId + " 0 -1 " + touchId;
      cs.readScore(score); 
      cs.setControlChannel("touch." + touchId + ".x", 
        t.clientX / w);
      cs.setControlChannel("touch." + touchId + ".y", 
        1 - (t.clientY / h));
    }
  }
  drawTouches();
}

function touchMove(evt) {
  evt.preventDefault();
  var changedTouches = evt.changedTouches;
  for (var i = 0; i < changedTouches.length; i++) {
		let t = changedTouches[i];

    var touchId = getTouchId(t);
    if(touchId != -1) {
      let pt = touches[touchId];
      pt.x = t.clientX;
      pt.y = t.clientY;
    }
  }
  drawTouches();
}


function touchEnd(evt) {
  evt.preventDefault();
  var changedTouches = evt.changedTouches;
  for (var i = 0; i < changedTouches.length; i++) {
    var touchId = getTouchId(changedTouches[i]);
    if(touchId != -1) {
			touchIds[touchId] = 0;
			touchArray[touchId] = null;
      let t = changedTouches[i];
      cs.readScore("i-1." + touchId +" 0 1");
      let xy = touches[touchId];
      xy.x = -100;
      xy.y = -100;
    }
  }
  drawTouches();
}

// Called when Csound WASM completes loading
function onRuntimeInitialized() {
  resizeTouchPanel();
  var client = new XMLHttpRequest();
  client.open('GET', 'mt0.orc', true);
  client.onreadystatechange = function() {
    var txt = client.responseText;

    var finishLoadCsObj = function() {
      cs = new CsoundObj();
      cs.setOption("-m0");
      cs.compileOrc(
        "sr=48000\nksmps=32\n0dbfs=1\nnchnls=2\n" + 
      txt);
      cs.start(); 
      cs.audioContext.resume();

      if(ld != null) {
        ld.remove();
      }

      touchPanel.addEventListener("touchstart", touchStart, false);
      touchPanel.addEventListener("touchmove", touchMove, false);
      touchPanel.addEventListener("touchend", touchEnd, false);
    }


    var ld = document.getElementById("loadDiv");

    if(iOS) {
      ld.innerHTML = "Tap to start Csound";
      ld.addEventListener ("click", function() {
        finishLoadCsObj();
      });
    } else {
      finishLoadCsObj();
    }
    
    setInterval(resizeTouchPanel, 200); 
  }
  client.send();

}




// Disable Context Menu
window.oncontextmenu = function(event) {
     event.preventDefault();
     event.stopPropagation();
     return false;
};

// Disable touch scrolling
document.body.addEventListener('touchmove', function(event) {
    event.preventDefault();
}, false); 


function load_script(src, async) {
  var script = document.createElement('script');
  script.src = src;
  script.async = async;
  document.head.appendChild(script);
}

// Initialize Module before WASM loads
Module = {};
Module['wasmBinaryFile'] = 'wasm/libcsound.wasm';
Module['print'] = console.log;
Module['printErr'] = console.log;
Module['onRuntimeInitialized'] = onRuntimeInitialized;

if(!iOS && (typeof WebAssembly !== undefined)) {
  console.log("Using WASM Csound...");
  load_script("wasm/libcsound.js", false);
  load_script("wasm/FileList.js", false);
  load_script("wasm/CsoundObj.js", false);
} else {
  console.log("Using asm.js Csound...");
  Module['memoryInitializerPrefixURL'] = "asmjs/";
  load_script("asmjs/libcsound.js", false);
  load_script("asmjs/FileList.js", false);
  load_script("asmjs/CsoundObj.js", false);
}
