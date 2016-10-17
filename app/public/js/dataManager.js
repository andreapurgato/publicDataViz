/*
    Global variables.
 */

// Images info.
var imageWidth = 0;
var imageHeight = 0;
var imageRatio = 0;
var imageNumbers = 0;
var imageFactor = 3;
var imageName = "";

// Content div info.
var contentWidth = 0;
var contentHeight = 0;

// Data.
var lastData = {};
var multiData = [];
var communities = {};
var currentTimeInstant = -1;
var currentDrawNode = {};
var gComm;
var loading = false;

// Threshold.
var threshold = 0;
var filtering = false;

// Edges
var lastEdges = {};
var lastEdgesNumber = [];

var multiEdges = [];
var multiEdgesNumber = [];

var minEdges = Infinity;
var maxEdges = 0;
var drawing = false;

var maxCorrelation = -1;
var minCorrelation = Infinity;

// Pixels
var pixels = {};

// Colors
var color = {
    0: "#27ae60",
    1: "#c0392b",
    2: "#2980b9",
    3: "#8e44ad",
    4: "#f1c40f"
};

var brainColor = {
    0: "#00ff00",
    1: "#ff0000",
    2: "#33ffff",
    3: "#ff00cc",
    4: "#ffff00"
};

var commColor = {
    1: "#F8BBD0",
    2: "#F0F4C3",
    3: "#BBDEFB"
};

// Drawing properties.
var radius = 10;

var maxStroke = 10;
var minStroke = 1;
var minOpacity = 0.2;
var maxOpacity = 0.8;

var maxWidth = 0;
var maxHeight = 0;
var maxLeft = 0;
var maxTop = 0;

var enterd = false;

/*
    read the image info.
 */

function readInfo(session){

    infoFile = 'data/' + session['folder'] + '/info.txt';

    $.get(infoFile, function(fileContent) {

        // Get the lines.
        var lines = fileContent.split("\n");

        /// Iterate on each line
        $.each(lines, function(n, elem) {

            console.log(elem)

            // Split to get the component of one line.
            var values = elem.split(",");

            // Check the first value to see which characteristic is.

            if(values[0] == 'width'){
                imageWidth = parseInt(values[1]);
            }

            if(values[0] == 'height'){
                imageHeight = parseInt(values[1]);
            }

            if(values[0] == 'images') {
                imageNumbers = parseInt(values[1]);
            }

            if(values[0] == 'imageName') {
                imageName = values[1];
            }

        });

        // Print the characteristics.
        imageRatio = imageWidth / imageHeight;
        imageFactor = Math.ceil((contentWidth * 0.2) / imageWidth);
        console.log('Image Width: ' + imageWidth);
        console.log('Image Height: ' + imageHeight);
        console.log('Image Number: ' + imageNumbers);
        console.log('Image Name: ' + imageName);

        // Read the pixels.
        readPixel(session);

    });
}

/*
    Read the pixels order.
 */

function readPixel(session){

    pixelFile = 'data/' + session['folder'] + '/pixels.txt';
    $.get(pixelFile, function(fileContent) {

        // Get the lines.
        var lines = fileContent.split("\n");

        /// Iterate on each line
        $.each(lines, function(n, elem) {
            pixels[n] = parseInt(elem);
        });

        // Read the data.
        //readCommunities(session);
        readData(session, 0);

    });

}

/*
    Read the communities.
 */
function readCommunities(session){

    commFile = 'data/' + session['folder'] + '/Comm.txt';
    $.get(commFile, function(fileContent) {

        // Get the lines.
        var lines = fileContent.split("\n");

        /// Iterate on each line
        $.each(lines, function(n, elem) {

            var s = elem.split(",");
            if(communities[parseInt(s[0])] == undefined){
                communities[parseInt(s[0])] = {};
            }

            communities[parseInt(s[0])][parseInt(s[1])] = parseInt(s[2]);

        });

        // Read the data.
        readData(session, 0);

    });

}

/*
    Read the data.
 */
function readData(session, i){

    updateProgress(i * 100 / imageNumbers);

    // Check end
    if(i >= imageNumbers){

        // Add the data to the list.
        multiData.push(lastData);

        hideProgress();

        // Empty the content of the page.
        $('#timeLineBrush').html("");
        $('#pageContent').html("");

        // Update the session counter.
        n = parseInt($('#headerSessionNumber').text());
        $('#headerSessionNumber').html(n+1);

        // Update the session active
        text = $('#sessionLoaded').html();
        $('#sessionLoaded').html(text + '<div class=\"sessionLoadedItem\">' +
                                            '<b><font color=\"' + color[multiData.length - 1] + '\">Session ' + (multiData.length) + ': '
                                            + session['sessionName'] + '</font></b></div>');

        loading = false;

        return;
    }

    // Check start
    if( i == 0){

        if(loading){
            return;
        }

        loading = true;

        lastData = {};
        showProgress("Load Data");

        // Set the empty hash map of the data.
        for(var t = 0; t < imageNumbers; t++){
            lastData[t] = {};
        }

    }

    dataFile = 'data/' + session['folder'] + '/N_' + session['nodeNumber'] + '_W_' + session['timeWindow'] + '_T_' + i + '_correlation.txt';

    $.get(dataFile, function(fileContent) {

        // Get the lines.
        var lines = fileContent.split("\n");

        /// Iterate on each line
        /*
            -elem- is the correlation between the pixel -n- and all the other pixels.
         */
        $.each(lines, function(n, elem) {

            // Split to get the component of one line.
            var values = elem.split(",");

            // Iterate on each value.
            /*
                -j- is the number of pixel in pair with -n-.
             */
            correlation = {};

            // Get all the correlation.
            for(var j = 1; j < (values.length - 1); j++){
                correlation[j - 1] = values[j];
            }

            // Set the correlation of pixel -n-.
            lastData[i][n] = correlation;

        });

    });

    setTimeout(function(){
        readData(session, i+1);
    }, 0);

}

/*
    Set the dimension of the content page.
 */
jQuery(document).ready(function($) {

    contentWidth = $('#pageContent').width();
    contentHeight = $('#pageContent').height();

    // Print the characteristics.
    console.log('Content Width: ' + contentWidth);
    console.log('Content Height: ' + contentHeight);

});

/*
    Function used to filter the data and prepare the edges.
 */
function setThreshold(newThreshold){
    threshold = newThreshold;
}

function filterData(d, t){

    // Check data
    if(multiData.length == 0){

        showMessage("No sessions loaded", function(){});
        return;
    }

    /*
        Check if the first dataset.
     */
    if(d == 0 && t == 0){

        minEdges = Infinity;
        maxEdges = 0;

        multiEdges = [];
        multiEdgesNumber = [];

        if(filtering || loading || drawing){
            return;
        }

        showProgress("Filter Data");
        filtering = true;

    }

    /*
        Check if the last dataset.
     */
    if(d >= multiData.length){

        hideProgress();

        // Draw the timeline.
        drawTimeline();

        filtering = false;
        return;
    }

    updateProgress((t + (d * imageNumbers)) * 100 / (imageNumbers * multiData.length));

    /*
        Check if initial time stamp.
     */
    if( t == 0){
        lastEdges = {};
        lastEdgesNumber = []
    }

    currentEdges = {};
    edgesCounter = 0;

    // Iterate on each pixel in the timestamp.
    $.each(multiData[d][t], function(p,c){

        // Iterate on each correlation between -p- and the other nodes.
        $.each(c, function(q,v){

            // Check the threshold.
            if(v > threshold){

                if(p != q){
                // Create the edge and add to the edges list.
                    if(p < q){
                        key = p + '#' + q;
                        edge = [p, q];
                    } else {
                        key = q + '#' + p;
                        edge = [q, p];
                    }

                    // Check min and max correlation.
                    if(v < minCorrelation){
                        minCorrelation = v;
                    }
                    if(v > maxCorrelation){
                        maxCorrelation = v;
                    }

                    // Check if already exist.
                    if (!(key in currentEdges)){
                        edgesCounter++;
                        currentEdges[key] = edge;
                    }
                }


            }

        });

    });

    if(edgesCounter > maxEdges){
        maxEdges = edgesCounter;
    }

    if(edgesCounter < minEdges){
        minEdges = edgesCounter;
    }

    lastEdges[t] = currentEdges;
    lastEdgesNumber.push(edgesCounter);

    /*
        Check if the last instant.
     */
    if(t == (imageNumbers - 1)){

        multiEdges.push(lastEdges);
        multiEdgesNumber.push(lastEdgesNumber);

        // Call next dataset.
        setTimeout(function(){
            filterData(d+1, 0);
        }, 0);

    } else {

        // Call next time instant
        setTimeout(function(){
            filterData(d, t+1);
        }, 0);

    }


}

/*
      Function that show the timeline.
 */
function drawTimeline(){

      $('#timeLineBrush').html("");

      /*
            Generate the graph.
       */

      // Get the container size.
      var brushContainerWidth = $('#timeLineBrush').width();
      var brushContainerHeight = $('#timeLineBrush').height();

      // Set the margin.
      var margin = {top: 30, right: 70, bottom: 30, left: 70};
      var width = brushContainerWidth - margin.left - margin.right;
      var height = brushContainerHeight - margin.top - margin.bottom;

      // Append the svg.
      var svg = d3.select("#timeLineBrush").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom);

      var x = d3.scale.linear().domain([0, (imageNumbers - 1)]).range([0, width]);
      var xInvers = d3.scale.linear().domain([0, width]).range([0, (imageNumbers - 1)]);

      var y = d3.scale.linear().domain([minEdges, maxEdges]).range([height, 0]);

      var graph = svg.append("svg:g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      var xAxis = d3.svg.axis().scale(x).ticks(10).orient("bottom").tickSize(-height).tickSubdivide(true);
      var yAxisLeft = d3.svg.axis().scale(y).ticks(5).orient("left");

      graph.append("svg:g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

      graph.append("svg:g")
            .attr("class", "y axis")
            .attr("transform", "translate(0,0)")
            .call(yAxisLeft);

      var line = d3.svg.line()
        .x(function(d,i) {
            return x(i);
        })
        .y(function(d) {
            return y(d);
        });

      for(j = 0; j < multiEdgesNumber.length; j++){
        graph.append("svg:path")
            .attr("d", line(multiEdgesNumber[j]))
            .attr("stroke", color[j]);
      }

      /*
            Generate the pointer.
       */

      // Append the container.

      var pointer = graph.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 2)
            .attr("height", (parseInt(svg.style("height")) - margin.top - margin.bottom))
            .attr("fill", "#e74c3c");

      var selection = graph.append("rect")
            .attr("x", 0)
            .attr("y", -2)
            .attr("width", 2)
            .attr("height", (parseInt(svg.style("height")) - margin.top - margin.bottom))
            .attr("fill", "#2c3e50");

      var text = graph.append("text")
            .attr("x", 0)
            .attr("y", -2)
            .attr("font-family", "Arial")
            .attr("font-size", "20px")
            .attr("fill", "#e74c3c");

      var textSelection = graph.append("text")
            .attr("x", 0)
            .attr("y", -2)
            .attr("font-family", "Arial")
            .attr("font-size", "20px")
            .attr("fill", "#2c3e50");

      svg.on("mousemove", function (d, i) {

            // Get X coordinate.
            var xPos = d3.mouse(this)[0];

            if(xPos > margin.left && xPos < (parseInt(svg.style("width")) - margin.right)){
                  pointer.attr('transform', 'translate(' + (xPos - margin.left) + ',0)');
                  text.attr('transform', 'translate(' + (xPos - margin.left - parseInt(text.style("width"))/2) + ',-2)')
                        .text(Math.round(xInvers(xPos - margin.left)));
            }

      })
      .on("click", function (d, i){

            // Get X coordinate.
            var xPos = d3.mouse(this)[0];

            if(xPos > margin.left && xPos < (parseInt(svg.style("width")) - margin.right)){
                  selection.attr('transform', 'translate(' + (xPos - margin.left) + ',0)');
                  textSelection.attr('transform', 'translate(' + (xPos - margin.left - parseInt(text.style("width"))/2) + ',-2)')
                        .text(Math.round(xInvers(xPos - margin.left)));

                  /*
                        Call the function to draw the networks.
                   */
                  currentTimeInstant = Math.round(xInvers(xPos - margin.left));
                  drawNetwork(0, Math.round(xInvers(xPos - margin.left)));

            }

      })
      .on("mouseleave", function (d, i){
            pointer.style("opacity", 0);;
            text.style("opacity", 0);
      })
      .on("mouseenter", function (d, i){
            pointer.style("opacity", 1);;
            text.style("opacity", 1);
      });

}

/*
      Function that draw the network of the current time instant.
 */
function drawNetwork(d, timeInstant){

    /*
        Check if another operation is runnig.
     */
    if(drawing || loading || filtering){
        return;
    }

    // Set the drawing operation to true, avoid overlap of draw.
    drawing = true;

    // Empty the page content.
    $('#pageContent').html("");

    // Get the container size.
    var networkContainerWidth = $('#pageContent').width();
    var networkContainerHeight = $('#pageContent').height();

    // Set the margin.
    var margin = {top: 50, right: 50, bottom: 50, left: 50};
    var height = networkContainerHeight;
    var width = networkContainerWidth;

    // Append the svg.
    var svg = d3.select("#pageContent").append("svg")
        .attr("width", width)
        .attr("height", height);

    /*
        Zoom function.
     */

    var xZoom = d3.scale.linear()
        .domain([0, (width - margin.left - margin.right)])
        .range([0, (width - margin.left - margin.right)]);

    var yZoom = d3.scale.linear()
        .domain([0, (height - margin.top - margin.bottom)])
        .range([(height - margin.top - margin.bottom), 0]);

    var zoom = d3.behavior.zoom().x(xZoom).y(yZoom)
        .scaleExtent([0.5, 8])
        .on("zoom", function(){

            d3.selectAll(".edge").attr("transform", function(d){

                // Mode edges
                d3.selectAll(".edge").attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");

                // Move and scale nodes
                d3.selectAll(".node").attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");

                // Move and scale brain rect
                pixelDimWidth = Math.floor((width - margin.left - margin.right) / (maxWidth));
                pixelDimHeight = Math.floor((height - margin.left - margin.right) / (maxHeight));
                d3.select("#brainRect").attr("transform", "translate(" + (((-d3.event.translate[0] / d3.event.scale / pixelDimWidth) + maxLeft) * imageFactor) + "," + (((-d3.event.translate[1] / d3.event.scale / pixelDimHeight) + maxTop) * imageFactor) + ")scale(" + (1/d3.event.scale) + ")");

            });

        });

    /*
        End zoom function.
     */

    gComm = svg.append("g")
        .attr("transform", "translate(0,0)")
        .attr("class", "comm");

    // Group where the network is drawn
    var g = svg.append("g")
        .attr("transform", "translate(0,0)")
        .attr("class", "net")
        .call(zoom);

    var gNodes = svg.append("g")
        .attr("transform", "translate(0,0)")
        .attr("class", "netNodes");

    // Rect that will allow the zoom.
    g.append("rect")
        .attr("x",0)
        .attr("y",0)
        .attr("width", (width - margin.left - margin.right))
        .attr("height",(height - margin.top - margin.bottom))
        .attr("transform","translate(" + margin.left + "," + margin.top + ")")
        .style("opacity", 0);

    // Hash table that contains the node drawn, avoid double drawn.
    var nodeDrawn = {};

    /*
        DRag and drop of the brain image..
     */
    var drag = d3.behavior.drag()
        .on("drag", function(d,i) {

            var gLoacl = d3.select(".brainImage");
            var xLocal = d3.transform(gLoacl.attr("transform")).translate[0];
            var yLocal = d3.transform(gLoacl.attr("transform")).translate[1];

            if((xLocal + d3.event.dx) < 0 || (xLocal + d3.event.dx + imageWidth * imageFactor) > contentWidth){
                return;
            }

            if((yLocal + d3.event.dy) < 0 || (yLocal + d3.event.dy + imageHeight * imageFactor) > contentHeight){
                return;
            }

            gLoacl.attr("transform", "translate(" + (xLocal + d3.event.dx) + "," + (yLocal + d3.event.dy) + ")");

        });

    /*
        Add the brain image.
     */
    var gImage = svg.append("g")
        .attr("transform", "translate(10,10)")
        .attr("class", "brainImage")
        .attr("render-order", -1)
        .call(drag);

    var image = gImage.append("image")
        .attr("xlink:href", "brain/" + imageName)
        .attr("x", "0px")
        .attr("y", "0px")
        .attr("width", (imageWidth * imageFactor))
        .attr("height", (imageHeight * imageFactor));

    // Red rect on th brain.
    gImage.append("rect")
        .attr("id", "brainRect")
        .attr("x",0)
        .attr("x",0)
        .attr("width", 0)
        .attr("height",0)
        .style("stroke", "#FF0000")
        .style("fill", "none")
        .style("opacity", 0);


    /*
        Set the max extension of the net.
     */
    setMaxExtension(timeInstant, width, height, nodeDrawn, g, gNodes, margin);

}

function drawEdges(d, t, i, width, height, nodeDrawn, g, gNodes, margin){

      /*
        Check if the last dataset.
      */
      if(d >= multiEdges.length){
            drawing = false;

          if (Object.keys(nodeDrawn).length == 0){
              return;
          }

          // Draw the edges.
          g.append("line")
              .attr("class", "edge")
              .attr("id", key)
              .attr("x1", 0)
              .attr("y1", 0)
              .attr("x2", 0)
              .attr("y2", 0)
              .attr("stroke-width", 0);

          d3.select("#brainRect")
              .attr("width", (maxWidth * imageFactor))
              .attr("height", (maxHeight * imageFactor))
              .attr("transform","translate(" + (maxLeft * imageFactor) + "," + (maxTop * imageFactor) + ")")
              .style("opacity", 1);

          d3.select(".brainImage").append("circle")
              .attr("class", "brainNodeOne")
              .attr("opacity", 0);

          d3.select(".brainImage").append("circle")
              .attr("class", "brainNodeTwo")
              .attr("opacity", 0);

          d3.select(".brainImage").append("line")
              .attr("class", "brainEdge")
              .attr("opacity", 0);

          currentDrawNode = nodeDrawn;

          return;
      }

      if(Object.keys(multiEdges[d][t]).length > 0){

          key = Object.keys(multiEdges[d][t])[i];

          nodeOneRel = multiEdges[d][t][key][0];
          nodeTwoRel = multiEdges[d][t][key][1];

          nodeOne = pixels[nodeOneRel];
          nodeTwo = pixels[nodeTwoRel];

          // Elaborate node 1
          oneRow = Math.floor(nodeOne / imageWidth);
          oneCol = nodeOne - oneRow * imageWidth;

          oneCoord = [(oneCol - maxLeft) * Math.floor((width - margin.left - margin.right) / (maxWidth)) ,(oneRow - maxTop) * Math.floor((height - margin.top - margin.bottom) / (maxHeight))];

          // Elaborate node 2
          twoRow = Math.floor(nodeTwo / imageWidth);
          twoCol = nodeTwo - twoRow * imageWidth;

          twoCoord = [(twoCol - maxLeft) * Math.floor((width - margin.left - margin.left) / (maxWidth)) ,(twoRow - maxTop) * Math.floor((height - margin.top - margin.bottom) / (maxHeight))];

          // Draw the nodes.
          if(!(nodeOne in nodeDrawn)){

              nodeDrawn[nodeOne] = 1;

              gNodes.append("circle")
                  .attr("cx", (oneCoord[0] + margin.left))
                  .attr("cy", (oneCoord[1] + margin.top))
                  .attr("r", radius)
                  .attr("class", "node")
                  .attr("id", nodeOne)
                  .style("fill", "#2c3e50")
                  .on("mouseover", function(d) {

                      mouseOverNode(this);

                  })
                  .on("mouseout", function(d) {

                      mouseLeaveNode(this);

                  });
          }

          if(!(nodeTwo in nodeDrawn)){

              nodeDrawn[nodeTwo] = 1;

              gNodes.append("circle")
                  .attr("cx", (twoCoord[0] + margin.left))
                  .attr("cy", (twoCoord[1] + margin.top))
                  .attr("r", radius)
                  .attr("class", "node")
                  .attr("id", nodeTwo)
                  .style("fill", "#2c3e50")
                  .on("mouseover", function(d) {

                      mouseOverNode(this);

                  })
                  .on("mouseout", function(d) {

                      mouseLeaveNode(this)

                  });
          }

          // Draw the edges.
          /*
          g.append("line")
              .attr("class", "edge")
           .attr("id", (key + "#" + d))
              .attr("x1", (oneCoord[0] + margin.left))
              .attr("y1", (oneCoord[1] + margin.top))
              .attr("x2", (twoCoord[0] + margin.left))
              .attr("y2", (twoCoord[1] + margin.top))
              .attr("stroke-width", function(){

                  c = multiData[d][t][nodeOneRel][nodeTwoRel];
                  var map = d3.scale.linear()
                      .domain([minCorrelation, maxCorrelation])
                      .range([minStroke, maxStroke]);

                  return map(c);

              })
              .attr("opacity", function(){

                  c = multiData[d][t][nodeOneRel][nodeTwoRel];
                  var map = d3.scale.linear()
                      .domain([minCorrelation, maxCorrelation])
                      .range([minOpacity, maxOpacity]);

                  return map(c);

              })
              .attr("stroke", color[d])
              .on("mouseover", function(d) {

                  mouseOverEdge(this);

              })
              .on("mouseout", function(d) {

                  mouseLeaveEdge(this);

              });
          */

          if(nodeOne != nodeTwo){


              middlePoint = [(oneCoord[0] + twoCoord[0]) / 2, (oneCoord[1] + twoCoord[1]) / 2];
              mCoeff = parseFloat(twoCoord[1] - oneCoord[1]) / parseFloat(twoCoord[0] - oneCoord[0]);
              deltaX = 0.01 * Math.sqrt(Math.pow((twoCoord[0] - oneCoord[0]), 2) + Math.pow((twoCoord[1] - oneCoord[1]), 2));
              deltaY = - (1 / mCoeff) * deltaX;
              //console.log(mCoeff, deltaX, deltaY)

              if(deltaY == Infinity || deltaY == -Infinity){
                  deltaY = 0;
              }

              if(Math.random() > 0.5){
                  finalPoint = [middlePoint[0] + deltaX, middlePoint[1] + deltaY];
              } else {
                  finalPoint = [middlePoint[0] - deltaX, middlePoint[1] - deltaY];

              }


              var curved = d3.svg.line()
                  .x(function(d) { return d.x; })
                  .y(function(d) { return d.y; })
                  .interpolate("cardinal")
                  .tension(0);

              var points = [{x: (oneCoord[0] + margin.left), y: (oneCoord[1] + margin.top)}, {x: (finalPoint[0] + margin.left), y: (finalPoint[1] + margin.top)}, {x: (twoCoord[0] + margin.left), y: (twoCoord[1] + margin.top)}];

              g.append("path").attr("d", curved(points))
                  .attr("class", "edge")
                  .attr("id", (key + "#" + d))
                  .attr("fill", "none")
                  .attr("stroke-width", function(){

                      c = multiData[d][t][nodeOneRel][nodeTwoRel];
                      var map = d3.scale.linear()
                          .domain([minCorrelation, maxCorrelation])
                          .range([minStroke, maxStroke]);

                      return map(c);

                  })
                  .attr("opacity", function(){

                      c = multiData[d][t][nodeOneRel][nodeTwoRel];
                      var map = d3.scale.linear()
                          .domain([minCorrelation, maxCorrelation])
                          .range([minOpacity, maxOpacity]);

                      return map(c);

                  })
                  .attr("stroke", color[d]);


          }



          /*
                Check if the last instant.
           */
          if(i == (Object.keys(multiEdges[d][t]).length - 1)){

              // Call next dataset.
              setTimeout(function(){
                  drawEdges(d+1, t, 0, width, height, nodeDrawn, g, gNodes, margin);
              }, 0);

          } else {

              // Call next time instant
              setTimeout(function(){
                  drawEdges(d, t, i+1, width, height, nodeDrawn, g, gNodes, margin);
              }, 0);

          }

      } else {

          // Call next dataset.
          setTimeout(function(){
              drawEdges(d+1, t, 0, width, height, nodeDrawn, g, gNodes, margin);
          }, 0);

      }

}

// Function that extract the max width of the draw
function setMaxExtension(timeInstant, width, height, nodeDrawn, g, gNodes, margin){

    var mostTop = Infinity;
    var mostBottom = 0;

    var mostLeft = Infinity;
    var mostRight = 0;


    for(d = 0; d < multiEdges.length; d++){

        // Find the most left,right,top and bottom pixels.
        for(j = 0; j < Object.keys(multiEdges[d][timeInstant]).length; j++){

            key = Object.keys(multiEdges[d][timeInstant])[j];

            nodeOneRel = multiEdges[d][timeInstant][key][0];
            nodeTwoRel = multiEdges[d][timeInstant][key][1];

            nodeOne = pixels[nodeOneRel];
            nodeTwo = pixels[nodeTwoRel];

            // Elaborate node 1.
            oneRow = Math.floor(nodeOne / imageWidth);
            oneCol = nodeOne - oneRow * imageWidth;

            // Elaborate node 2
            twoRow = Math.floor(nodeTwo / imageWidth);
            twoCol = nodeTwo - twoRow * imageWidth;


            // Catch the most....

            // One
            if(oneCol < mostLeft){
                mostLeft = oneCol;
            }
            if(oneCol > mostRight){
                mostRight = oneCol;
            }

            // Two
            if(twoCol < mostLeft){
                mostLeft = twoCol;
            }
            if(twoCol > mostRight){
                mostRight = twoCol;
            }

            // Catch the most....

            // One
            if(oneRow < mostTop){
                mostTop = oneRow;
            }
            if(oneRow > mostBottom){
                mostBottom = oneRow;
            }

            // Two
            if(twoRow < mostTop){
                mostTop = twoRow;
            }
            if(twoRow > twoRow){
                mostBottom = twoRow;
            }

        }

    }


    maxWidth = (mostRight - mostLeft);
    maxHeight = (mostBottom - mostTop);

    maxLeft = mostLeft;
    maxTop = mostTop;

    /*
        Draw the netwrks.
     */
    drawEdges(0, timeInstant, 0, width, height, nodeDrawn, g,gNodes, margin);

}

/*
    Function used to reset the data.
 */
function resetData(){

    $('#timeLineBrush').html("");
    $('#pageContent').html("");

    $('#sessionLoaded').html("<b>Active Sessions</b>");
    $('#sessionLoadedBig').html("");

    multiData = [];
    multiEdges = [];
    multiEdgesNumber = [];

    lastData = {};
    lastEdges = {};
    lastEdgesNumber = {};

    sessionLoaded = {};

    currentTimeInstant = -1;

}

/*
    Function called when the mouse is intercting with the network.
 */
function mouseOverNode(nodeObj){

    if(drawing){
        return;
    }

    enterd = true;

    var node = d3.select(nodeObj);
    var id = parseInt(node.attr("id"));

    var str = "<center><b>Node: " + id + "</b></center><br>" +
        "Outgoing edges: <br>";

    var row = Math.floor(id / imageWidth);
    var col = id - row * imageWidth;

    d3.select(".brainNodeOne")
        .attr("cx", (col * imageFactor))
        .attr("cy", (row * imageFactor))
        .attr("r", 2 + "px")
        .style("fill", "#00FF00")
        .attr("opacity", 1);

    node.attr("r", (radius * 1.5))
        .attr("opacity", 0.8);

    var edges = d3.selectAll(".edge");
    for(i = 0; i < edges[0].length; i++){

        var key = d3.select(edges[0][i]).attr("id");
        var split = key.split("#");

        if((id == pixels[split[0]]) || (id == pixels[split[1]])){

            if(id != pixels[split[0]]){
                str += '<font color=\"' + color[split[2]] + '\">to: ' + pixels[split[0]] + ' sim: ' + multiData[split[2]][currentTimeInstant][split[0]][split[1]] + '</font><br>';
                //str += '<font color=\"' + color[split[2]] + '\">to ' + pixels[split[0]] + '</font><br>';
            }

            if(id != pixels[split[1]]){
                str += '<font color=\"' + color[split[2]] + '\">to: ' + pixels[split[0]] + ' sim: ' + multiData[split[2]][currentTimeInstant][split[1]][split[0]] + '</font><br>';
                //str += '<font color=\"' + color[split[2]] + '\">to ' + pixels[split[1]] + '</font><br>';
            }

            var edge = d3.select(edges[0][i]);
            var stroke = edge.attr("stroke-width");
            var opacity = edge.attr("opacity");
            edge.attr("opacity", opacity * 2)
                .attr("stroke-width", stroke * 2);

            var pixelOne = pixels[split[0]];
            var pixelTwo = pixels[split[1]];

            // Elaborate node 1
            var oneRow = Math.floor(pixelOne / imageWidth);
            var oneCol = pixelOne - oneRow * imageWidth;

            // Elaborate node 2
            var twoRow = Math.floor(pixelTwo / imageWidth);
            var twoCol = pixelTwo - twoRow * imageWidth;

            d3.select(".brainImage").append("line")
                .attr("x1", (oneCol * imageFactor))
                .attr("y1", (oneRow * imageFactor))
                .attr("x2", (twoCol * imageFactor))
                .attr("y2", (twoRow * imageFactor))
                .attr("class", "edgeTemp")
                .attr("stroke-width", 1 + "px")
                .attr("stroke", brainColor[split[2]])
                .attr("opacity", 1);

            d3.select(".brainImage").append("circle")
                .attr("cx", (oneCol * imageFactor))
                .attr("cy", (oneRow * imageFactor))
                .attr("r", 2 + "px")
                .attr("class", "nodeTemp")
                .style("fill", brainColor[split[2]])
                .attr("opacity", 1);

            d3.select(".brainImage").append("circle")
                .attr("cx", (twoCol * imageFactor))
                .attr("cy", (twoRow * imageFactor))
                .attr("r", 2 + "px")
                .attr("class", "nodeTemp")
                .style("fill", brainColor[split[2]])
                .attr("opacity", 1);

        } else {

            var edge = d3.select(edges[0][i]);
            var stroke = edge.attr("stroke-width");
            var opacity = edge.attr("opacity");
            edge.attr("opacity", opacity / 4)
                .attr("stroke-width", stroke / 4);

        }

    }

    var mouse = d3.mouse(nodeObj);

    // Tooltip.
    $('#tooltip').show(0, function(){

        //$("#tooltip").css('top', (mouse[1] + 15));
        //$("#tooltip").css('left', (mouse[0] + 15));
        $("#tooltip").html(str);

    });

}

function mouseLeaveNode(nodeObj){

    if(drawing || !enterd){
        return;
    }

    enterd = false;

    var node = d3.select(nodeObj);
    var id = parseInt(node.attr("id"));

    d3.select(".brainNodeOne")
        .attr("opacity", 0);

    node.attr("r", radius)
        .attr("opacity", 1);

    var edges = d3.selectAll(".edge");
    for(i = 0; i < edges[0].length; i++){

        var key = d3.select(edges[0][i]).attr("id");
        var split = key.split("#");

        if((id == pixels[split[0]]) || (id == pixels[split[1]])){

            var edge = d3.select(edges[0][i]);
            var stroke = edge.attr("stroke-width");
            var opacity = edge.attr("opacity");
            edge.attr("opacity", opacity / 2)
                .attr("stroke-width", stroke / 2);

        } else {

            var edge = d3.select(edges[0][i]);
            var stroke = edge.attr("stroke-width");
            var opacity = edge.attr("opacity");
            edge.attr("opacity", opacity * 4)
                .attr("stroke-width", stroke * 4);

        }

    }

    d3.selectAll(".nodeTemp").remove();
    d3.selectAll(".edgeTemp").remove();

    $('#tooltip').hide(0, function(){

        $('#tooltip').html("")

    });

}


function mouseOverEdge(edgeObj){

    if(drawing){
        return;
    }

    enterd = true;

    var edge = d3.select(edgeObj);
    var key = edge.attr("id");

    var pixelOne = pixels[key.split("#")[0]];
    var pixelTwo = pixels[key.split("#")[1]];

    // Elaborate node 1
    var oneRow = Math.floor(pixelOne / imageWidth);
    var oneCol = pixelOne - oneRow * imageWidth;

    // Elaborate node 2
    var twoRow = Math.floor(pixelTwo / imageWidth);
    var twoCol = pixelTwo - twoRow * imageWidth;

    /*
        Prendere la key thi this e scomporla per risalire alla linea da disegnare.
     */

    d3.select(".brainEdge")
        .attr("x1", (oneCol * imageFactor))
        .attr("y1", (oneRow * imageFactor))
        .attr("x2", (twoCol * imageFactor))
        .attr("y2", (twoRow * imageFactor))
        .attr("stroke-width", 1 + "px")
        .attr("stroke", brainColor[key.split("#")[2]])
        .attr("opacity", 1);

    d3.select(".brainNodeOne")
        .attr("cx", (oneCol * imageFactor))
        .attr("cy", (oneRow * imageFactor))
        .attr("r", 2 + "px")
        .style("fill", brainColor[key.split("#")[2]])
        .attr("opacity", 1);

    d3.select(".brainNodeTwo")
        .attr("cx", (twoCol * imageFactor))
        .attr("cy", (twoRow * imageFactor))
        .attr("r", 2 + "px")
        .style("fill", brainColor[key.split("#")[2]])
        .attr("opacity", 1);


    var stroke = edge.attr("stroke-width");
    var opacity = edge.attr("opacity");
    edge.attr("opacity", opacity * 2)
        .attr("stroke-width", stroke * 2);

    var circles = d3.selectAll(".node");
    for(i = 0; i < circles[0].length; i++){

        if(d3.select(circles[0][i]).attr("id") == pixelOne){
            d3.select(circles[0][i])
                .attr("r", (radius * 1.5))
                .attr("opacity", 0.8);
        }

        if(d3.select(circles[0][i]).attr("id") == pixelTwo){
            d3.select(circles[0][i])
                .attr("r", (radius * 1.5))
                .attr("opacity", 0.8);
        }

    }

}

function mouseLeaveEdge(edgeIbj){

    if(drawing || !enterd){
        return;
    }

    enterd = false;

    var edge = d3.select(edgeIbj);
    var key = edge.attr("id");

    var pixelOne = pixels[key.split("#")[0]];
    var pixelTwo = pixels[key.split("#")[1]];

    d3.select(".brainEdge")
        .attr("opacity", 0);

    d3.select(".brainNodeOne")
        .attr("opacity", 0);

    d3.select(".brainNodeTwo")
        .attr("opacity", 0);

    var stroke = edge.attr("stroke-width");
    var opacity = edge.attr("opacity");
    edge.attr("opacity", opacity / 2)
        .attr("stroke-width", stroke / 2);

    var circles = d3.selectAll(".node");
    for(i = 0; i < circles[0].length; i++){

        if(d3.select(circles[0][i]).attr("id") == pixelOne){
            d3.select(circles[0][i])
                .attr("r", radius)
                .attr("opacity", 1);
        }

        if(d3.select(circles[0][i]).attr("id") == pixelTwo){
            d3.select(circles[0][i])
                .attr("r", radius)
                .attr("opacity", 1);
        }

    }

}

/*
    Function that draw the communities.
 */
function drawCommunities(){

    var margin = {top: 50, right: 50, bottom: 50, left: 50};
    var width = $('#pageContent').width();
    var height = $('#pageContent').height();

    $.each(communities[currentTimeInstant], function(node, comm){

        nodeAbs = pixels[node];

        if(currentDrawNode[nodeAbs] != undefined){

            oneRow = Math.floor(nodeAbs / imageWidth);
            oneCol = nodeAbs - oneRow * imageWidth;
            oneCoord = [(oneCol - maxLeft) * Math.floor((width - margin.left - margin.right) / (maxWidth)) ,(oneRow - maxTop) * Math.floor((height - margin.top - margin.bottom) / (maxHeight))];

            var deltaRow = 1;
            var found = false;

            while(!found && deltaRow < 50){

                $.each(communities[currentTimeInstant], function(nodeLoc, commLoc){

                    nodeAbsLoc = pixels[nodeLoc];

                    if(currentDrawNode[nodeAbsLoc] != undefined){

                        oneRowLoc = Math.floor(nodeAbsLoc / imageWidth);
                        oneColLoc = nodeAbsLoc - oneRowLoc * imageWidth;
                        oneCoordLoc = [(oneColLoc - maxLeft) * Math.floor((width - margin.left - margin.right) / (maxWidth)) ,(oneRowLoc - maxTop) * Math.floor((height - margin.top - margin.bottom) / (maxHeight))];

                        if(oneCol == oneColLoc + deltaRow && comm == commLoc && node != nodeLoc){

                            found = true;

                            var m = parseFloat(oneCoord[1] - oneCoordLoc[1]) / parseFloat(oneCoord[0] - oneCoordLoc[0]);
                            //console.log(oneCoord, oneCoordLoc)
                            for(var x = 0; x < (oneCoord[0] - oneCoordLoc[0]); x++){
                                var y = m * x;
                                var r = Math.random() * 1.5 + 1;
                                //console.log(x,y)
                                gComm.append("circle")
                                    .attr("cx", (oneCoordLoc[0] + margin.left + x))
                                    .attr("cy", (oneCoordLoc[1] + margin.top + y))
                                    .attr("r", radius * r)
                                    .attr("class", "comm")
                                    .style("fill", commColor[comm]);
                            }

                        }

                    }


                });

                deltaRow++;

            }

        }

        $.each(communities[currentTimeInstant], function(node, comm){

            nodeAbs = pixels[node];

            if(currentDrawNode[nodeAbs] != undefined){

                oneRow = Math.floor(nodeAbs / imageWidth);
                oneCol = nodeAbs - oneRow * imageWidth;

                oneCoord = [(oneCol - maxLeft) * Math.floor((width - margin.left - margin.right) / (maxWidth)) ,(oneRow - maxTop) * Math.floor((height - margin.top - margin.bottom) / (maxHeight))];

                gComm.append("circle")
                    .attr("cx", (oneCoord[0] + margin.left))
                    .attr("cy", (oneCoord[1] + margin.top))
                    .attr("r", radius * 3.5)
                    .attr("class", "comm")
                    .style("fill", commColor[comm]);

            }


        });


    });

}