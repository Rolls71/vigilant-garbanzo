const mapWidth = 16
const mapHeight = 16
const mapSize = mapWidth*mapHeight
const mapScale = 1
const seedX = Math.random()
const seedY = Math.random()
var xPos = 0
var yPos = 0

var worldMap = {
    "home": [0, 0],
    "cursor": [0, 0],
}

$(onStart()); 

function onStart(){
    renderMap()

    $("#move-home").on('click', function(){
        xPos = worldMap["home"][0]
        yPos = worldMap["home"][1]
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
        map.append('<div class="grid-tile" id="'+i+'">'+v+'</div>')
    }

    $(".grid-tile").map(function() {
        this.className = ""
        this.classList.add("grid-tile")

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


    if (isInRange(...worldMap["cursor"])) {
        console.log(...worldMap["cursor"])
        console.log(getTileIdFromWorld(...worldMap["cursor"]))
        console.log($("#"+getTileIdFromWorld(...worldMap["cursor"])))
        $("#"+getTileIdFromWorld(...worldMap["cursor"]))[0].classList.add("cursor")
    }
}

function getPosFromRel(tileId) {
    id = Number(tileId)
    if (id == NaN) {
        throw "Error: Tile id is not a number"
    }
    x = id%mapWidth
    y = Math.floor(id/mapHeight)
    return [x, y]
}

function getRelFromWorldPos(xWorld, yWorld) {
    var x = Number(xWorld) - xPos
    var y = Number(yWorld) - yPos
    if (isNaN(x) || isNaN(y)) {
        throw "Error: Position x or y is not a number"
    }

    if (
        x >= 0 &&
        x < mapWidth &&
        y >= 0 &&
        y < mapHeight
    ) {
        return [x, y]
    }
    throw "Error: World position is not within relative screen bounds"
}

function getTileIdFromRel(xRel, yRel) {
    var x = Number(xRel)
    var y = Number(yRel)
    if (isNaN(x) || isNaN(y)) {
        throw "Error: Position x or y is not a number"
    }
    return x + y*mapWidth
}

function getTileIdFromWorld(x, y) {
    return getTileIdFromRel(...getRelFromWorldPos(x, y))
}

function getHeight(tileId) {    
    id = Number(tileId)
    if (isNaN(id)) {
        throw "Error: Tile id is not a number"
    }
    var x = id%mapWidth + seedX + xPos
    var y = Math.floor(id/mapWidth) + seedY + yPos
    var v = perlin.get(x/mapWidth, y/mapHeight)
}

function isInRange(x, y) {
    var x = Number(x)
    var y = Number(y)
    if (isNaN(x) || isNaN(y)) {
        throw "Error: Position x or y is not a number"
    }

    if (
        x >= xPos && 
        x < xPos + mapWidth && 
        y >= yPos && 
        y < yPos + mapHeight
    ) {
        return true
    }
    return false
}