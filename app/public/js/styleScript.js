jQuery(document).ready(function($) {

    // Set the width of the menu button and the image.
    var headerHeight = $('#headerMenu').height();
    $('#headerMenu').css({'width':headerHeight+'px'});
    $('#headerMenu').css({'background-size':headerHeight+'px'});

    // Menu mouse ico
    $('#headerMenu').css('cursor','pointer');

    // Make the menu ready
    $('.toggle-menu').jPushMenu();

    // Menu create new session ico
    $('.menuToggle').css('cursor','pointer');

    var newSessionMarginLeft = $('#newSession').width()/2;
    $('#newSession').css({'margin-left': -newSessionMarginLeft+'px'});

    var deleteSessionMarginLeft = $('#deleteSession').width()/2;
    $('#deleteSession').css({'margin-left': -deleteSessionMarginLeft+'px'});

    var popupMessageMarginLeft = $('#popupMessage').width()/2;
    $('#popupMessage').css({'margin-left': -popupMessageMarginLeft+'px'});

    var rogressBarMarginLeft = $('#progressBar').width()/2;
    $('#progressBar').css({'margin-left': -rogressBarMarginLeft+'px'});

    var infoMarginTop = $('#timeLineInfo').height()/2 - $('#timeLineText').height()/2;
    $('#timeLineText').css({'margin-top': infoMarginTop + 'px'});
    $('#timeLineValue').css({'margin-top': infoMarginTop + 'px'});
    $('#timeLineFilter').css({'margin-top': infoMarginTop + 'px'});
    $('#timeLineFilter').css('cursor','pointer');

    $('#timeLineComm').css({'margin-top': infoMarginTop + 'px'});
    $('#timeLineComm').css('cursor','pointer');

    // Draw the slider
    drawSlider();

});

/*
    Functions used to popup a message.
 */
var messageCallback;
function showMessage(str, callback){

    // Clear message.
    $("#popupMessageContent").html("");

    // Set and visualize the message.
    $('#popupMessageContent').append(str + '</span>');
    $('#popupMessage').fadeIn('slow', 'swing');

    // Set the callback
    messageCallback = callback;

}

function hideMessage(){
    $('#popupMessage').fadeOut('slow', 'swing');
    messageCallback();
}

/*
      Functions that show the progress bar for the filtering.
 */
function showProgress(str){

      // Show the filtering div.
      $('#progressBar').fadeIn('slow', 'swing');
      $('#progressBarDraw').html("");
      $('h1','#progressBarDraw').html(str);

      // Take the div dimension.
      var progressBarWidth = $('#progressBar').width();
      var progressBarHeight = 50;

      // Select the div where draw.
      var progress = d3.select("#progressBarDraw").append("svg:svg")
            .attr("id","progressBarSvg")
            .attr("width", progressBarWidth)
            .attr("height", progressBarHeight);

      progress.append("rect")
            .attr("id","progressRect")
            .attr("width", 0)
            .attr("fill", "#2c3e50")
            .attr("height", progressBarHeight)
            .attr("x",0)
            .attr("y",0);

}

function hideProgress(){

      $('#progressBar').fadeOut('slow', 'swing');

}

function updateProgress(perc){

      // Compute the percentage.
      var progressBarWidth = ($('#progressBar').width() - 30);
      var progressWidth = progressBarWidth * (perc / 100);

      d3.select('#progressRect').attr("width", progressWidth);

}


/*
    Function that draws the slider.
 */
function drawSlider(){

    width = $('#timeLineSlider').width() * 0.9;
    height = $('#timeLineSlider').height() * 0.9;

    var margin = {top: ($('#timeLineSlider').height() * 0.05), right: ($('#timeLineSlider').width() * 0.05), bottom: ($('#timeLineSlider').height() * 0.05), left: ($('#timeLineSlider').width() * 0.05)},

        width = width - margin.left - margin.right,
        height = height - margin.bottom - margin.top,
        startingValue = 0;

    // sets scale for slider
    var x = d3.scale.linear()
        .domain([-1, 1])
        .range([0, width])
        .clamp(true);

    // defines brush
    var brush = d3.svg.brush()
        .x(x)
        .extent([startingValue, startingValue])
        .on("brush", brushed);

    var svg = d3.select("#slider").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        // classic transform to position g
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.append("g")
        .attr("class", "x axis")
        // put in middle of screen
        .attr("transform", "translate(0," + height / 2 + ")")
        // inroduce axis
        .call(d3.svg.axis()
            .scale(x)
            .orient("bottom")
            .tickFormat(function(d) { return d; })
            .tickSize(0)
            .tickPadding(12)
            .tickValues(function() {
                values = [];
                n = -1
                i = 0;
                while(n <= 1){
                    values[i] = n;
                    i++;
                    n += 0.25;
                }
                return values;
            }))
        .select(".domain")
        .select(function() {return this.parentNode.appendChild(this.cloneNode(true)); })
        .attr("class", "halo");

    var slider = svg.append("g")
        .attr("class", "slider")
        .call(brush);

    slider.selectAll(".extent,.resize")
        .remove();

    slider.select(".background")
        .attr("height", height);

    var handle = slider.append("g")
        .attr("class", "handle");

    handle.append("path")
        .attr("transform", "translate(0," + height / 2 + ")")
        .attr("d", "M 0 -" + height/4 + " V " + height/4);

    handle.append('text')
        .text(startingValue)
        .attr("transform", "translate(0," + (height / 2 - height / 4) + ")");

    slider.call(brush.event);

    function brushed() {
        var value = brush.extent()[0];

        if (d3.event.sourceEvent) { // not a programmatic event
            handle.select('text');
            value = x.invert(d3.mouse(this)[0]);
            brush.extent([value, value]);
        }

        var thresholdValue = Math.floor(value * 100) / 100;

        /*
            CALL THE UPDATE EDGES.
         */
        setThreshold(thresholdValue);

        handle.attr("transform", "translate(" + x(value) + ",0)");
        handle.select('text').text(thresholdValue);

        // Display the threshold.
        $("#timeLineValue").html("");
        $("#timeLineValue").append(thresholdValue);

    }

}