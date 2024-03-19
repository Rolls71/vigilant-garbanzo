const mapWidth = 16
const mapHeight = 16
const mapSize = mapWidth*mapHeight
const mapScale = 1
var xPos = 0
var yPos = 0

var foodCount = 0
var productionCount = 0
var goldCount = 0

var worldMap = {
    "claims": [],
}

var tileYields = {
    "ocean-tile": [1, 0, 1],
    "sand-tile": [0, 0, 1],
    "grass-tile": [2, 0, 0],
    "forest-tile": [1, 1, 0],
    "mountain-tile": [0, 2, 1],
}

$(onStart()); 

function onStart(){
    renderMap()
    renderPanels()

    $("#move-home").on('click', function(){
        if (worldMap["home"]) {
            xPos = worldMap["home"][0] - Math.floor(mapWidth/2)
            yPos = worldMap["home"][1] - Math.floor(mapHeight/2)
            renderMap() 
        }
    })
    $("#set-home").on('click', function(){
        worldMap["home"] = worldMap["cursor"] 
        worldMap["claims"] = []
        renderMap()
    })
    $("#claim-tile").on('click', function(){ claimTile() })

    $("#move-left").on('click', function(){ xPos = xPos-1; renderMap() })
    $("#move-up").on('click', function(){ yPos = yPos-1; renderMap() })
    $("#move-right").on('click', function(){ xPos = xPos+1; renderMap() })
    $("#move-down").on('click', function(){ yPos = yPos+1; renderMap() })

}

function renderMap() {
    var map = $("#map")
    map.empty()
    for (var i = 0; i < 256; i++) {
        var x = i%mapWidth + xPos
        var y = Math.floor(i/mapWidth) + yPos
        var v = perlin.get(x/mapWidth, y/mapHeight)
        map.append('<div class="grid-tile" id="'+i+'">'+v+'</div>')
        $("#"+i).on('click', function(c){ setCursor(c) })
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


    if (worldMap["cursor"] && isInRange(...worldMap["cursor"])) {
        $("#"+getTileIdFromWorld(...worldMap["cursor"]))[0]
            .classList.add("cursor-tile")
    }
    if (worldMap["home"] && isInRange(...worldMap["home"])) {
        $("#"+getTileIdFromWorld(...worldMap["home"]))[0]
            .classList.add("home-tile")
    }
    for (var i = 0; i < worldMap["claims"].length; i++) {
        $("#"+getTileIdFromWorld(...worldMap["claims"][i]))[0]
        .classList.add("claimed-tile")
    }
}

function renderPanels() {
    $("#food-panel").text(foodCount+" Food")
    $("#production-panel").text(productionCount+" Production")
    $("#gold-panel").text(goldCount+" Gold")
}

function setCursor(c){
    worldMap['cursor'] = [...getWorldPosFromId(c.target.id)] 
    $("#selected-tile").text("Selected Tile: "+c.target.classList)

    var yields = [0, 0, 0]
    $("#"+getTileIdFromWorld(...worldMap['cursor']))[0].classList.forEach((e) => {
        if (tileYields[e]) {
            yields = yields.map(function(num, i) {
                return num + tileYields[e][i]
            })
        }
    })
    $("#tile-yields").text("Yields "+yields[0]+" food, "
        +yields[1]+" production, and "+yields[2]+" gold.")

    renderMap()
}

function getRelPosFromId(tileId) {
    id = Number(tileId)
    if (id == NaN) {
        throw "Error: Tile ID "+id+"is not a number"
    } else if (id >= mapSize || id < 0) {
        throw "Error: ID not within range"
    }
    x = id%mapWidth
    y = Math.floor(id/mapHeight)
    return [x, y]
}

function getWorldPosFromId(tileId) {
    return getWorldPosFromRel(...getRelPosFromId(tileId))
}

function getWorldPosFromRel(xRel, yRel) {
    var x = Number(xRel) + xPos
    var y = Number(yRel) + yPos
    if (isNaN(x) || isNaN(y)) {
        throw "Error: Position x or y is not a number"
    }
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

function getAdjacentPos(xP, yP) {
    var x = Number(xP)
    var y = Number(yP)
    if (isNaN(x) || isNaN(y)) {
        throw "Error: Position x or y is not a number"
    }
    return [
        [x+1, y], 
        [x-1, y], 
        [x, y+1],
        [x, y-1],
    ]
}

function isClaimed(x, y) {
    if (!worldMap["home"]) {
        return false
    }
    if (worldMap["home"].toString() == [x, y].toString()) {
        return true
    }

    if (worldMap["claims"].length > 0 &&
        worldMap["claims"].toString().indexOf([x, y].toString()) >= 0) {
        return true
    }
    return false
}

function getHeight(tileId) {    
    id = Number(tileId)
    if (isNaN(id)) {
        throw "Error: Tile id is not a number"
    }
    var x = id%mapWidth + xPos
    var y = Math.floor(id/mapWidth) + yPos
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

function claimTile() {
    // Pass if no home set
    if (!worldMap["home"]) {
        console.log("Failed Claim: No home set")
        return
    }

    // Pass if already claimed
    if (isClaimed(...worldMap["cursor"])) {
        console.log("Failed Claim: Already claimed")
        return
    }

    // Pass if not adjacent to a claim or home
    var neighbours = getAdjacentPos(...worldMap["cursor"])
    for (var i = 0; i < neighbours.length; i++) {
        if (isClaimed(...neighbours[i])) {
            break
        }
        if (i+1 == neighbours.length) {
            console.log("Failed Claim: No adjacent claims")
            return
        }
    }

    worldMap["claims"].push(worldMap["cursor"])
    renderMap()

    var yields = [0, 0, 0]
    $("#"+getTileIdFromWorld(...worldMap['cursor']))[0].classList.forEach((e) => {
        if (tileYields[e]) {
            yields = yields.map(function(num, i) {
                return num + tileYields[e][i]
            })
        }
    })
    foodCount += yields[0]
    productionCount += yields[1]
    goldCount += yields[2]
    renderPanels()
}