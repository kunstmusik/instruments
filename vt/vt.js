var touchArray = new Array(10); 

for(var i = 0; i < 10; i++) {
  touchArray[i] = null; 
}


var cs;

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

    // draw touches
    ctx.fillStyle = 'green';
    ctx.strokeStyle = 'white';

    for(var i = 0; i < 10; i++) {
      let t = touchArray[i];
      if(t != null) {
        ctx.beginPath();
        ctx.arc(t.clientX, t.clientY, 20, 0, 2 * Math.PI, true);
        ctx.fill();
        ctx.stroke();

        cs.setControlChannel("touch." + i + ".x", 
          t.clientX / w);
        cs.setControlChannel("touch." + i + ".y", 
          1 - (t.clientY / h));
      }
    }

  }
}

function drawTouches() {
  window.requestAnimationFrame(drawTouchesImpl);
}


function getTouchIdAssignment() { 
	for (var i = 0; i < 10; i++) {
		if (touchArray[i] == null) {
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
  CSOUND_AUDIO_CONTEXT.resume();

  var changedTouches = evt.changedTouches;   
  let w = touchPanel.parentNode.clientWidth;
  let h = touchPanel.parentNode.clientHeight;

  for (var i = 0; i < changedTouches.length; i++) {
    var touchId = getTouchIdAssignment();
    if (touchId != -1) {
      let t = changedTouches[i];
      touchArray[touchId] = t;

      let score = "i1." + touchId + " 0 -1 " + touchId;
      cs.setControlChannel("touch." + touchId + ".x", 
        t.clientX / w);
      cs.setControlChannel("touch." + touchId + ".y", 
        1 - (t.clientY / h));
      cs.readScore(score); 
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
      touchArray[touchId] = t;
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
			touchArray[touchId] = null;
      let t = changedTouches[i];
      cs.readScore("i-1." + touchId +" 0 1");
    }
  }
  drawTouches();
}

// Called when Csound WASM completes loading
function onRuntimeInitialized() {
  resizeTouchPanel();
  var client = new XMLHttpRequest();
  client.open('GET', 'vt.orc', true);
  client.onreadystatechange = function() {
    var txt = client.responseText;

    var finishLoadCsObj = function() {
      cs = new CsoundObj();
      cs.setOption("-m0");
      cs.setOption("-odac");
      cs.compileOrc(
        "sr=48000\nksmps=32\n0dbfs=1\nnchnls=2\nnchnls_i=1" +
      txt);
      cs.start(); 

      if(ld != null) {
        ld.remove();
      }

      touchPanel.addEventListener("touchstart", touchStart, false);
      touchPanel.addEventListener("touchmove", touchMove, false);
      touchPanel.addEventListener("touchend", touchEnd, false);
    }


    var ld = document.getElementById("loadDiv");

    if(CSOUND_AUDIO_CONTEXT.state != "running") {
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
    //event.preventDefault();
}, false); 

CsoundObj.importScripts("../csound/").then(() => {
  onRuntimeInitialized();
});
