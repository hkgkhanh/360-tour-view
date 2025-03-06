var layer = document.querySelector(".layer");
var PanoViewer = eg.view360.PanoViewer;
// var panoControls = PanoControls;
var container = document.getElementById("myPanoViewer");
var panoviewer = document.getElementById("panoSet");
var hotspots = Array.prototype.slice.call(document.querySelectorAll(".hotspot"));
var currentPage = "1";

function openLayer(img) {
    layer.querySelector("img").src = "https://naver.github.io/egjs-view360/v3/examples/panoviewer/etc/img/" + img;
    layer.style.display = "block";
}
function closeLayer(e) {
    if (e.target === layer) {
        layer.style.display = "none";
    }
}
function toRadian(deg) {
    return deg * Math.PI / 180;
}
function getHFov(fov) {
    var rect = container.getBoundingClientRect();
    var width = rect.width;
    var height = rect.height;
    return Math.atan(width / height * Math.tan(toRadian(fov) / 2)) / Math.PI * 360;
}
function rotate(point, deg) {
    var rad = toRadian(deg);
    var cos = Math.cos(rad);
    var sin = Math.sin(rad);

    return [cos * point[0] - sin * point[1], sin * point[0] + cos * point[1]];
}
function setHotspotOffset(hotspot, viewer) {
    hotspot.style.display = "block";
    var oyaw = viewer.getYaw();
    var opitch = viewer.getPitch();
    var yaw = parseFloat(hotspot.getAttribute("data-yaw"));
    var pitch = parseFloat(hotspot.getAttribute("data-pitch"));
    var deltaYaw = yaw - oyaw;
    var deltaPitch = pitch - opitch;

    if (deltaYaw < -180) {
        deltaYaw += 360;
    } else if (deltaYaw > 180) {
        deltaYaw -= 360;
    }
    if (Math.abs(deltaYaw) > 90) {
        hotspot.style.transform = "translate(-200px, 0px)";
        return;
    }
    var radYaw = toRadian(deltaYaw);
    var radPitch = toRadian(deltaPitch);

    var fov = viewer.getFov();
    var hfov = getHFov(fov);

    var rx = Math.tan(toRadian(hfov) / 2);
    var ry = Math.tan(toRadian(fov) / 2);


    var point = [
        Math.tan(-radYaw) / rx,
        Math.tan(-radPitch) / ry,
    ];

    // Image rotation compensation
    // The original image is about 10 degrees tilted.
    point = point.map(function (p) {
        return p * Math.cos(15 / 180 * Math.PI);
    });
    point[1] = rotate(point, deltaYaw > 0 ? -10 : 10)[1];

    // point[0] /= 1.05;
    var left = viewer._width / 2 + point[0] * viewer._width / 2;
    var top = viewer._height / 2 + point[1] * viewer._height / 2;

    hotspot.style.transform = "translate(" + left + "px, " + top + "px) translate(-50%, -50%)";

    if (!isInside(hotspot, container)) {
        hotspot.style.display = "none";
    }
}
function setHotspotOffsets(viewer) {
    hotspots.filter(function (hotspot) {
        return hotspot.getAttribute("data-page") === currentPage;
    }).forEach(function (hotspot) {
        setHotspotOffset(hotspot, viewer);
    });

    hotspots.filter(function (hotspot) {
        return hotspot.getAttribute("data-page") != currentPage;
    }).forEach(function (hotspot) {
        hotspot.style.display = "none";
    });
}
function load(target, page) {
    if (currentPage == page) {
        return;
    }
    var yaw = target.getAttribute("data-yaw");
    var pitch = target.getAttribute("data-pitch");

    currentPage = "" + page;

    viewer.lookAt({
        yaw: yaw,
        pitch: pitch,
        fov: 30
    }, 500);

    setTimeout(function () {
        panoviewer.setAttribute("data-page", currentPage);
        viewer.setImage("asset/img" + page + ".jpg", {
            projectionType: "equirectangular"
        });
    }, 500);
}

// create PanoViewer with option
var viewer = new PanoViewer(
    container,
    {
        image: "asset/img1.jpg",
        projectionType: "equirectangular"
    }
).on("ready", function (e) {
    viewer.lookAt({
        fov: 80,
    });

    setTimeout(function () {
        viewer.lookAt({
            fov: 65,
        }, 500);
        setHotspotOffsets(viewer);
    });
}).on("viewChange", function (e) {
    setHotspotOffsets(viewer);
}).on("error", function (e) {
    console.error(e);
});

// var panoviewerSet = document.getElementById("panoSet");
// panoControls.init(panoviewerSet, panoViewer);
// panoControls.showLoading();

var isAutoCruising = false;
var rafId = 0;

document.querySelector(".around").addEventListener("click", function(e) {
    toggleLookAround();
});

// document.querySelector(".fullscreen").addEventListener("click", function(e) {
//     toggleFullscreen();
// });

document.querySelector(".music").addEventListener("click", function(e) {
    toggleMusic();
});

function toggleLookAround() {
    var start = new Date().getTime();

    if(isAutoCruising) {
        window.cancelAnimationFrame(rafId);
        isAutoCruising = false;
        return;
    };

    var pitch = viewer.getPitch();
    var yaw = viewer.getYaw();
    var delta = 0;

    function lookAround() {
        delta = (new Date().getTime() - start);
        viewer.lookAt({
            yaw: yaw + (delta / 100) % 360,
            pitch: pitch
        }, 0);

        isAutoCruising && (rafId = window.requestAnimationFrame(lookAround));
    }

    rafId = window.requestAnimationFrame(lookAround);
    isAutoCruising = true;
}

function enterFullscreen() {
    const elem = document.documentElement; // Fullscreen the entire page
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.mozRequestFullScreen) { // Firefox
        elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) { // Chrome, Safari, Edge
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { // IE/Edge
        elem.msRequestFullscreen();
    }
    // console.log("boom");

    container.style.width = "100vw";
    container.style.height = "100vh";
    document.getElementsByTagName("canvas").width = container.clientWidth;
    document.getElementsByTagName("canvas").height = container.clientHeight;
}

function exitFullscreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
    }

    container.style.width = "600px";
    container.style.height = "400px";
    document.getElementsByTagName("canvas").width = container.clientWidth;
    document.getElementsByTagName("canvas").height = container.clientHeight;
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        enterFullscreen();
    } else {
        exitFullscreen();
    }
}

function toggleMusic() {
    if (document.getElementById("bgMusic").paused) {
        document.getElementById("bgMusic").play();
    } else {
        document.getElementById("bgMusic").pause();
    }
}

function isInside(divA, divB) {
    let rectA = divA.getBoundingClientRect();
    let rectB = divB.getBoundingClientRect();
    console.log(rectA);
    console.log(rectB);

    return (
        rectA.top >= rectB.top &&
        rectA.left >= rectB.left &&
        rectA.right <= rectB.right &&
        rectA.bottom <= rectB.bottom
    );
}