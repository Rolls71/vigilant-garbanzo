const MAP_WIDTH = 16
const MAP_HEIGHT = 16
const MAP_SIZE = MAP_WIDTH*MAP_HEIGHT
const MAP_SCALE = 1

const MIN_PRODUCTIVITY = 1
const MIN_RANGE = 3

const TILE_FOOD_COST_MULTIPLIER = 5

const SETTLEMENT_TILE_COST_DIVISOR = 4

var xPos = 0
var yPos = 0

var foodCount = 0
var productionCount = 0
var goldCount = 0

var dockyardCount = 0
var tileCount = 0
var goldCost = 0
var tileFoodCost = 10

var foodYield = 0
var productionYield = 0

var settlements = {
    "position": [],
    "productivity": [],
    "range": [],
}
var dockyards = {
    "position": [],
    "range": [],
}
var claims = []
var worldMap = {}

// Food, Production, Gold, Gold Cost
var tileYields = {
    "ocean-tile": [1, 0, 2, 1],
    "sand-tile": [0, 0, 1, 0],
    "grass-tile": [2, 0, 0, 0],
    "forest-tile": [1, 1, 0, 1],
    "mountain-tile": [0, 3, 1, 2],
} 

$(onStart()); 

function onStart(){
    renderMap()
    renderPanels()

    $("#move-home").on('click', function(){
        if (worldMap["home"]) {
            xPos = worldMap["home"][0] - Math.floor(MAP_WIDTH/2)
            yPos = worldMap["home"][1] - Math.floor(MAP_HEIGHT/2)
            renderMap() 
            renderPanels()
        }
    })
    $("#settle").on('click', function(){ 
        settle(); renderMap(); renderPanels() })
    $("#claim-tile").on('click', function(){ 
        claimTile(); renderMap(); renderPanels() })
    $("#build-dockyard").on('click', function(){ 
        buildDockyard(); renderMap(); renderPanels() })
    $("#increase-productivity").on('click', function(){ 
        modifyProductivity(1); renderPanels() })
    $("#decrease-productivity").on('click', function(){ 
        modifyProductivity(-1); renderPanels() })
    $("#increase-range").on('click', function(){ 
        modifyRange(1); renderPanels() })
    $("#decrease-range").on('click', function(){ 
        modifyRange(-1); renderPanels() })

    $("#move-left").on('click', function(){ 
        xPos = xPos-1; renderMap(); renderPanels() })
    $("#move-up").on('click', function(){ 
        yPos = yPos-1; renderMap(); renderPanels() })
    $("#move-right").on('click', function(){ 
        xPos = xPos+1; renderMap(); renderPanels() })
    $("#move-down").on('click', function(){ 
        yPos = yPos+1; renderMap(); renderPanels() })

    window.setInterval(function(){ tick() }, 1000)
}

function renderMap() {
    var map = $("#map")
    map.empty()
    for (var i = 0; i < 256; i++) {
        var x = i%MAP_WIDTH + xPos
        var y = Math.floor(i/MAP_WIDTH) + yPos
        map.append('<div class="grid-tile '+getTerrainFromPos(x, y)+'" id="'+i+'"></div>')
        $("#"+i).on('click', function(c){ setCursor(c) })
    }

    if (worldMap["cursor"] && isOnScreen(...worldMap["cursor"])) {
        $("#"+getTileIdFromWorld(...worldMap["cursor"]))[0]
            .classList.add("cursor-tile")
    }
    for (var i = 0; i < settlements["position"].length; i++) {
        if (isOnScreen(...settlements["position"][i])) {
            $("#"+getTileIdFromWorld(...settlements["position"][i]))[0]
                .classList.add("home-tile")
        }
    }
    for (var i = 0; i < claims.length; i++) {
        if (isOnScreen(...claims[i])) {
            $("#"+getTileIdFromWorld(...claims[i]))[0]
                .classList.add("claimed-tile")
        }
    }
    for (var i = 0; i < dockyards["position"].length; i++) {
        if (isOnScreen(...dockyards["position"][i])) {
            $("#"+getTileIdFromWorld(...dockyards["position"][i]))[0]
                .classList.add("dockyard-tile")
        }
    }
}

function renderPanels() {
    $("#food-panel").text(foodCount+" Food (+"+foodYield+")")
    $("#production-panel").text(productionCount+"/"+productionYield+" Production")
    $("#gold-panel").text(goldCount+" Gold")

    $("#selected-settlement").hide()
    $("#settlement-stats").hide()
    $("#build-dockyard").hide()
    $("#increase-dock-range").hide()
    $("#decrease-dock-range").hide()
    $("#increase-productivity").hide()
    $("#decrease-productivity").hide()
    $("#increase-range").hide()
    $("#decrease-range").hide()

    var tiles = $(".cursor-tile")
    if (tiles.length != 1) {
        $("#settle").hide()
        $("#claim-tile").hide()
        return
    }
    var tile = tiles[0]


    $("#settle").show()
    $("#claim-tile").show()

    if (tile.classList.contains("home-tile")) {
        $("#settle").hide()
        $("#claim-tile").hide()
        $("#selected-settlement").show()
        $("#settlement-stats").show()
        $("#increase-productivity").show()
        $("#decrease-productivity").show()
        $("#increase-range").show()
        $("#decrease-range").show()

        var id = getSettlementFromTileId(tile.id)
        $("#settlement-stats").html("Productivity: "+settlements["productivity"][id]
            +"<br>Range: "+settlements["range"][id])
        return
    }
    if (tile.classList.contains("ocean-tile")) {
        $("#settle").hide()
    }
    if (tile.classList.contains("claimed-tile")) {
        $("#claim-tile").hide()
        if (tile.classList.contains("sand-tile") && 
                settlements["position"].length > 1) {
            if (!tile.classList.contains("dockyard-tile")) {
                $("#build-dockyard").show()
                $("#build-dockyard").html("Build Dockyard "
                    +getDockyardGoldCost()+" Gold "
                    +getDockyardProductionCost()+" Production")
            } else {
                $("#settle").hide()
                $("#increase-dock-range").show()
                $("#decrease-dock-range").show()
            }
        }
    }


}

function tick() {
    foodYield = settlements["position"].length
    productionYield = 0
    for (var i = 0; i < claims.length; i++) {
        var highestProductivity = 0
        for (var j = 0; j < settlements["position"].length; j++) {
            if (isInRange(
                ...claims[i], 
                ...settlements["position"][j], 
                settlements["range"][j]
                ) && settlements["productivity"][j] > highestProductivity) {
                    highestProductivity = settlements["productivity"][j]
                }
        }
        if (highestProductivity == 0) {
            throw "Error: claim with 0 productivity."
        } else {
            var terrain = getTerrainFromPos(...claims[i])
            foodYield += tileYields[terrain][0]*highestProductivity
            productionYield += tileYields[terrain][1]
        }
    }
    foodCount += foodYield
    renderPanels()
}



// Actions
function settle() {
    // Pass if lacking necessary resources
    if (goldCount < getSettlementCost()) {
        console.log("Failed Settle: Lacking necessary resources")
        return
    }

    // Pass if on top of building
    if (JSON.stringify(dockyards["position"])
        .indexOf(JSON.stringify(worldMap["cursor"])) >= 0) {
        console.log("Failed Settle: Can't settle on top of buildings")
        return
    }

    // Pass if ocean selected
    if (getTerrainFromPos(...worldMap["cursor"]) == "ocean-tile") {
        console.log("Failed Settle: Can't settle on water")
    }

    goldCount -= getSettlementCost()
    
    settlements["position"].push(worldMap["cursor"])
    settlements["productivity"].push(MIN_PRODUCTIVITY)
    settlements["range"].push(MIN_RANGE)
    worldMap["home"] = worldMap["cursor"]

    claims.push(worldMap["cursor"])

    // claim tile
    var yields = [0, 0, 0]
    $("#"+getTileIdFromWorld(...worldMap['cursor']))[0].classList.forEach((e) => {
        if (tileYields[e]) {
            yields = yields.map(function(num, i) {
                return num + tileYields[e][i]
            })
        }
    })
    tileCount += 1
    foodYield += yields[0]
    productionCount += yields[1]
    goldCount += yields[2]
    tileFoodCost = 10*settlements["position"].length
    
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

    // Pass if lacking necessary resources
    if (foodCount < getTileFoodCost() || goldCount < goldCost) {
        console.log("Failed Claim: Lacking necessary resources")
        return
    }

    // Pass if out of range of settlements
    for (var i = 0; i < settlements["position"].length; i++) {
        if (isInSettlementRange(i, ...worldMap["cursor"])) {
            break
        }
        if (i+1 == settlements["position"].length) {
            console.log("Failed Claim: No settlement in range")
            return
        }
    }

    // Pass if ocean tile out of range of dockyards
    if (getTerrainFromPos(...worldMap["cursor"]) == "ocean-tile" &&
        !isCoastal()) {
        if (dockyards["position"].length == 0) {
            console.log("Failed Ocean Claim: No dockyard in range")
            return
        }
        for (var i = 0; i < dockyards["position"].length; i++) {
            if (isInRange(...dockyards["position"][i], ...worldMap["cursor"],
                dockyards["range"][i])) {
                break
            }
            if (i+1 == dockyards["position"].length) {
                console.log("Failed Ocean Claim: No dockyard in range")
                return
            }
        }
    }

    claims.push(worldMap["cursor"])

    var yields = [0, 0, 0]
    $("#"+getTileIdFromWorld(...worldMap['cursor']))[0].classList.forEach((e) => {
        if (tileYields[e]) {
            yields = yields.map(function(num, i) {
                return num + tileYields[e][i]
            })
        }
    })

    goldCount -= goldCost
    foodCount -= getTileFoodCost()
    tileCount += 1
    tileFoodCost *= 2

    foodYield += yields[0]
    productionCount += yields[1]
    goldCount += yields[2]
}

function buildDockyard() {
    // Pass if no adjacent ocean
    var adj = getAdjacentPos(...worldMap["cursor"])
    for (var i = 0; i < adj.length; i++) {
        if (getTerrainFromPos(...adj[i]) == "ocean-tile") {
            break
        }
        if (i == adj.length-1) {
            console.log("Failed Dockyard Build: No adjacent ocean")
            return
        }
    }

    // Pass if lacking necessary resources
    if (goldCount < getDockyardGoldCost() || 
        productionCount < getDockyardProductionCost()) {
        console.log("Failed Dockyard Build: Lacking necessary resources")
        return
    }

    // Pass if on-top of another building
    if (JSON.stringify(dockyards["position"])
            .indexOf(JSON.stringify(worldMap["cursor"])) >= 0) {
        console.log("Failed Dockyard Build: Can't build on top of buildings")
        return
    }

    goldCount -= getDockyardGoldCost()
    productionCount -= getDockyardProductionCost()

    dockyards["position"].push(worldMap["cursor"])
    dockyards["range"].push(MIN_RANGE)
    dockyardCount += 1
}

function modifyProductivity(v) {
    // Pass if would use or produce more production than exists
    if (productionCount - v < 0 || productionCount - v > productionYield) {
        console.log("Failed modify: Too much production or none left")
        return
    }

    var tileId = getTileIdFromWorld(...worldMap["cursor"])
    var settlementId = getSettlementFromTileId(tileId)

    // Pass if would decrease productivity below minimum value
    if (settlements["productivity"][settlementId] + v < MIN_PRODUCTIVITY) {
        console.log("Failed modify: Would go below minimum productivity")
        return
    }

    productionCount -= v
    settlements["productivity"][settlementId] += v

}

function modifyRange(v) {
    // Pass if would use or produce more production than exists
    if (productionCount - v < 0 || productionCount - v > productionYield) {
        console.log("Failed modify: Too much production or none left")
        return
    }

    var tileId = getTileIdFromWorld(...worldMap["cursor"])
    var settlementId = getSettlementFromTileId(tileId)

    // Pass if would decrease range below minimum value
    if (settlements["range"][settlementId] + v < MIN_RANGE) {
        console.log("Failed modify: Would go below minimum range")
        return
    }

    productionCount -= v
    settlements["range"][settlementId] += v

}

function setCursor(c){
    worldMap['cursor'] = [...getWorldPosFromId(c.target.id)] 
    $("#selected-tile").text("Selected Tile: "+c.target.classList)

    var yields = [0, 0, 0, 0]
    $("#"+getTileIdFromWorld(...worldMap['cursor']))[0].classList.forEach((e) => {
        if (tileYields[e]) {
            yields = yields.map(function(num, i) {
                return num + tileYields[e][i]
            })
        }
    })

    goldCost = yields[3]
    $("#claim-tile").text("Claim "+goldCost+" Gold, "+getTileFoodCost()+" Food")
    $("#settle").text("Settle "+getSettlementCost()+" Gold")
    $("#tile-yields").text("Yields "+yields[0]+" food, "
        +yields[1]+" production, and "+yields[2]+" gold.")

    renderMap()
    renderPanels()
}



/******************************* Pure Functions *******************************/

// Fetch functions
function getRelPosFromId(tileId) {
    id = Number(tileId)
    if (id == NaN) {
        throw "Error: Tile ID "+id+"is not a number"
    } else if (id >= MAP_SIZE || id < 0) {
        throw "Error: ID not within range"
    }
    x = id%MAP_WIDTH
    y = Math.floor(id/MAP_HEIGHT)
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
        x < MAP_WIDTH &&
        y >= 0 &&
        y < MAP_HEIGHT
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
    return x + y*MAP_WIDTH
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

function getTerrainFromPos(x, y) {
    var n = perlin.get(x/MAP_WIDTH, y/MAP_HEIGHT)
    if (n < 0.1) {
        return "ocean-tile"
    } else if (n <= 0.15) {
        return "sand-tile"
    } else if (n <= 0.3) {
        return "grass-tile"
    } else if (n <= 0.4) {
        return "forest-tile"
    } else if (n <= 1) {
        return "mountain-tile"
    } 
}

function getSettlementFromTileId(id) {
    var pos = getWorldPosFromId(id)
    var i
    for (i = 0; i < settlements["position"].length; i++) {
        if (settlements["position"][i][0] == pos[0]
            && settlements["position"][i][1] == pos[1]) {
                break
        }
    }
    return i
}



// Formulas
function getTileFoodCost() {
    return tileFoodCost
}

function getSettlementCost() {
    return goldCost + Math.pow(settlements["position"].length, 1)
}

function getDockyardGoldCost() {
    return Math.pow(2, dockyardCount)
}

function getDockyardProductionCost() {
    return dockyardCount + 1
}



// Bool Tests
function isOnScreen(x, y) {
    var x = Number(x)
    var y = Number(y)
    if (isNaN(x) || isNaN(y)) {
        throw "Error: Position x or y is not a number"
    }

    if (
        x >= xPos && 
        x < xPos + MAP_WIDTH && 
        y >= yPos && 
        y < yPos + MAP_HEIGHT
    ) {
        return true
    }
    return false
}

function isClaimed(x, y) {
    if (JSON.stringify(settlements["position"]).indexOf(JSON.stringify([x, y])) >= 0) {
        return true
    }

    if (claims.length > 0 &&
        JSON.stringify(claims).indexOf(JSON.stringify([x, y])) >= 0) {
        return true
    }
    return false
}

function isInSettlementRange(i, x, y) {
    return isInRange(
        ...settlements["position"][i], x, y, settlements["range"][i]
    )
}

function isInRange(x1, y1, x2, y2, range) {
    return (Math.sqrt( Math.pow(x2-x1, 2) + Math.pow(y2-y1, 2) ) <= range)
}

function isConnected(x1, y1, x2, y2) {
    var claimsStr = JSON.stringify(claims)
    if (claimsStr.indexOf([x1, y1]) < 0 || 
        claimsStr.indexOf([x2, y2]) < 0) {
        return false
    }
    
    var searchList = getAdjacentPos(x1, y1)
    var searched = []
    var strClaims = JSON.stringify(claims)
    while(Array.isArray(searchList) && searchList.length > 0) {
        // search pos is claimed
        var pos = searchList.pop()
        searched.push(pos)
        console.log("  "+pos)
        if (strClaims.indexOf(JSON.stringify([pos[0], pos[1]])) < 0) {
            continue
        }

        // target pos is found
        if (pos[0] == x2 && pos[1] == y2) {
            return true
        }

        // Add new adjacent positions to search
        var adj = getAdjacentPos(pos[0], pos[1])
        for (var i = 0; i < adj.length; i++) { 
            if (JSON.stringify(searchList.concat(searched))
                    .indexOf(JSON.stringify(adj[i])) < 0) {
                searchList.push(adj[i])
            }
        }
    }
    return false
}

function isCoastal() {
    var neighbours = getAdjacentPos(...worldMap["cursor"])
    for (var i = 0; i < neighbours.length; i++) {
        if (getTerrainFromPos(...neighbours[i]) != "ocean-tile" &&
            isClaimed(...neighbours[i])) {
            return true
        }
    }
    return false
}