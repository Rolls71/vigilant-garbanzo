const mapWidth = 16
const mapHeight = 16
const mapSize = mapWidth*mapHeight
const mapScale = 1
const seedX = Math.random()
const seedY = Math.random()
var xPos = 0
var yPos = 0
var xPosHome = 0
var yPosHome = 0

$(onStart()); 

function onStart(){
    renderMap()

    $("#move-home").on('click', function(){
        xPos = xPosHome
        yPos = yPosHome
        renderMap() 
    })
    $("#move-left").on('click', function(){ xPos = xPos-1; renderMap() })
    $("#move-up").on('click', function(){ yPos = yPos-1; renderMap() })
    $("#move-right").on('click', function(){ xPos = xPos+1; renderMap() })
    $("#move-down").on('click', function(){ yPos = yPos+1; renderMap() })
}

function renderMap() {
    var map = $("#map")
    map.empty()
    for (var i = 0; i < 256; i++) {
        var x = i%mapWidth + seedX + xPos
        var y = Math.floor(i/mapWidth) + seedY + yPos
        var v = perlin.get(x/mapWidth, y/mapHeight)
        map.append('<div class="grid-item" id="'+i+'">'+v+'</div>')
    }

    var items = $(".grid-item").map(function() {
        this.className = ""
        this.classList.add("grid-item")

        const n = Number(this.innerHTML)
        if (n < -0.1) {
            this.classList.add("ocean-tile")
        } else if (n <= 0) {
            this.classList.add("sand-tile")
        } else if (n <= 0.2) {
            this.classList.add("grass-tile")
        } else if (n <= 0.4) {
            this.classList.add("forest-tile")
        } else if (n <= 1) {
            this.classList.add("mountain-tile")
        } 
        this.innerHTML = ""
    })
}

function allowDrop(ev) {
    ev.preventDefault();
}

function drag(ev) {
    ev.dataTransfer.setData("text", ev.target.id);
}

function drop(ev) {
    ev.preventDefault();
    var data = ev.dataTransfer.getData("text");
    ev.target.appendChild(document.getElementById(data));
}