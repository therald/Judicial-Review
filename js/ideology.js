class Ideology {
    constructor(div, data) {
        var viz = this;

        // Variable to see if the vizualization is "active", whatever that means
        // in the context of the viz
        viz.active = false;
        viz.div = d3.select(div);

        // Get the total width and height from the div
        viz.totalWidth = viz.div.node().getBoundingClientRect().width;
        viz.totalHeight = viz.div.node().getBoundingClientRect().height;

        // Set up the svg to preserve the aspect ratio
        viz.svg = viz.div.append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("viewBox", "0 0 " + viz.totalWidth + " " + viz.totalHeight)
            .attr("preserveAspectRatio", "xMinYMin");
        
        // d3 margin convention
        viz.width = document.getElementById(div.substring(1)).offsetWidth;
        viz.height = document.getElementById(div.substring(1)).offsetHeight;

        viz.mousePosX = 0;
        viz.mousePosY = 0;

        viz.xScale = d3.scaleTime();
        viz.yScale = d3.scaleLinear();
        viz.minOfMins = 0;
        viz.xTicks = d3.scaleTime();
        viz.stack = d3.stack()
            .keys(["Liberal", "Unspecified", "Conservative"])
            .offset(d3.stackOffsetWiggle);

        viz.fillColorClasses = ["fill_blue", "fill_purple", "fill_red"];
        viz.years;
        viz.series;
        viz.streamLabels;

        viz.parseDate = d3.timeParse("%Y");

        viz.data = data;
        viz.draw();
    }

    draw() {
        var viz = this;

        d3.csv("./data/ideology_data.csv", function (error, ideology_data) {
            viz.initializeScalesAndStack(viz, ideology_data);
            //viz.drawLegend(viz);
            viz.drawStreams(viz);
            viz.drawXAxis(viz);
            viz.initializeHoverLine(viz);
            viz.drawStreamLabels(viz, [50, viz.height/2]);
            //viz.addBrush(viz);
        });
    }

    // drawLegend(viz) {
    //     var div = d3.select("#ideology_legend_and_values");

    //     var width = div.node().getBoundingClientRect().width;
    //     var height = div.node().getBoundingClientRect().height;

    //     var legendSvg = div
    //         .append("svg")
    //         .attr("width", "100%")
    //         .attr("height", "100%")
    //         .attr("viewBox", "0 0 " + width + " " + height)
    //         .attr("preserveAspectRatio", "xMinYMin");

    //     var start = 0;
    //     var conservativeGroup = legendSvg.append("g")
    //         .attr("id", "legend_conservative");
    //     conservativeGroup.append("rect")
    //         .attrs({ x: 10, y: 10, width: 20, height: 20, class: "fill_red" })
    //     conservativeGroup.append("text")
    //         .attr('class', "legend_label")
    //         .attr('x', 35)
    //         .attr('y', (height-5))
    //         .style("text-anchor", "start")
    //         .text("Conservative");

    //     start += (d3.select("#legend_conservative").node().getBBox().width + 75);
    //     var unspecifiedGroup = legendSvg.append("g")
    //         .attr("id", "legend_unspecified")
    //         .attr("transform", "translate(" + start + " ,0)");
    //     unspecifiedGroup.append("rect")
    //         .attrs({ x: 10, y: 10, width: 20, height: 20, class: "fill_purple" })
    //     unspecifiedGroup.append("text")
    //         .attr('class', "legend_label")
    //         .attr('x', 35)
    //         .attr('y', (height-5))
    //         .style("text-anchor", "start")
    //         .text("Unspecified");

    //     start += (d3.select("#legend_unspecified").node().getBBox().width + 75);
    //     var liberalGroup = legendSvg.append("g")
    //         .attr("id", "legend_liberal")
    //         .attr("transform", "translate(" + start + " ,0)");
    //     liberalGroup.append("rect")
    //         .attrs({ x: 10, y: 10, width: 20, height: 20, class: "fill_blue" })
    //     liberalGroup.append("text")
    //         .attr('class', "legend_label")
    //         .attr('x', 35)
    //         .attr('y', (height-5))
    //         .style("text-anchor", "start")
    //         .text("Liberal");
    // }

    drawStreams(viz) {
        var area = d3.area()
            .x(function(d) { return viz.xScale(Number(d.data.Year)); })
            .y0(function(d) { return viz.yScale(d[0]); })
            .y1(function(d) { return viz.yScale(d[1]); })
            .curve(d3.curveBasis);

        var index = 0;
        viz.svg.selectAll("path")
            .data(viz.series)
            .enter().append("path")
            .attr("d", area)
            .attr("class", function() {
                var classList = "ideology_path ";
                classList += viz.fillColorClasses[index++]
                return classList;
            });
    }

    // addBrush(viz) {
    //     viz.svg.append("g")
    //         .attrs({
    //             id: "brush_area",
    //             class: "brush"
    //         })
    //         .on("mouseover", function() {
    //             document.getElementById("data_line").classList.add("visible");
    //             document.getElementById("conservative_count").classList.add("visible");
    //             document.getElementById("unspecified_count").classList.add("visible");
    //             document.getElementById("liberal_count").classList.add("visible");
    //             document.getElementById("year_hover").classList.add("visible");
    //             viz.adjustHoverLinePositionAndCounts(viz, this);
    //         })
    //         .on("mousemove", function(d,i) {
    //             viz.adjustHoverLinePositionAndCounts(viz, this);
    //         })
    //         .on("mouseout", function(d) {
    //             document.getElementById("data_line").classList.remove("visible");
    //             document.getElementById("conservative_count").classList.remove("visible");
    //             document.getElementById("unspecified_count").classList.remove("visible");
    //             document.getElementById("liberal_count").classList.remove("visible");
    //             document.getElementById("year_hover").classList.remove("visible");
    //         });
    // }

    drawXAxis(viz) {
        var xAxis = d3.axisBottom(viz.xTicks).tickValues(viz.xTicks.ticks(viz.years.length/4).concat(viz.xTicks.domain()));
        viz.svg.append("g")
            .attr("class", "axis axis--x")
            .attr("transform", "translate(0," + (viz.height - 60) + ")")
            .call(xAxis)
            .selectAll("text")  
            .style("text-anchor", "end")
            .style("font-size", "0.75rem")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-65)");

        viz.svg.append("text")
            .attr("transform", "translate(" + (viz.width/2) + " ," + (viz.height - 5) + ")")
            .style("text-anchor", "middle")
            .text("Year");
    }

    initializeScalesAndStack(viz, ideology_data) {
        viz.years = ideology_data.map(d => d.Year);

        viz.xScale.domain(d3.extent(viz.years, function(d) { return d; }))
            .range([50, viz.width-50]);

        viz.xTicks.domain(d3.extent(viz.years, function(d) { return viz.parseDate(d); }))
            .range([50, viz.width-50]);

        viz.series = viz.stack(ideology_data);

        var mins = viz.series[0].map(d => d[0]);
        var maxs = viz.series[2].map(d => d[1]);
        viz.minOfMins = Math.min(... mins);
        viz.yScale.domain([Math.min(... mins), Math.max(... maxs)])
            .range([viz.height - 75, 0]);
    }

    initializeHoverLine(viz) {
        var date = viz.xTicks.invert(50);
        var year = date.getFullYear().toString();

        console.log("initializing hover line");

        var lineData = [
            { 'x': 50, 'y': -1000000},
            { 'x': 50, 'y': (viz.series[2][year - viz.series[0][0].data.Year])["1"]}
        ]

        var line = d3.line()
            .x(function(d) { return d['x']; })
            .y(function(d) {
                if (d['y'] == -1000000) {
                    return viz.height - 60;
                }
                return viz.yScale(d['y']);
            });
        
        viz.svg.append("path")
            .attr("id", "data_line")
            .datum(lineData)
            .attr('d', line);
    }

    adjustHoverLinePositionAndCounts(viz, mouseEvent) {
        var dataLine = d3.select("#data_line");

        viz.mousePosX = d3.mouse(mouseEvent)[0];
        viz.mousePosY = d3.mouse(mouseEvent)[0];

        var date = viz.xTicks.invert(d3.mouse(mouseEvent)[0]);
        var year = date.getFullYear().toString();
        var initialYear = viz.series[0][0].data.Year
        var yearDifference = year - initialYear;

        var mousePos = d3.mouse(mouseEvent);

        if (mousePos == null) {
            mousePos = [50, viz.height/2];
        }

        var lineData = [
            { 'x': mousePos[0], 'y': -1000000},
            { 'x': mousePos[0], 'y': (viz.series[2][yearDifference])["1"]}
        ];

        var line = d3.line()
            .x(function(d) { return viz.computeXSnapping(viz, d['x']); })
            .y(function(d) { 
                if (d['y'] == -1000000) {
                    return viz.height - 60;
                }
                return viz.yScale(d['y']);
            });

        dataLine.datum(lineData)
            .attr('d', line);

        // Update ruling count texts
        var countData = (viz.series[0][yearDifference]).data;

        viz.updateDataLabels(viz, mousePos);
    }

    drawStreamLabels(viz, mouseEvent) {
        var labels = document.getElementById("stream_labels");

        if (labels != null) {
            labels.parentNode.removeChild(labels);
        }

        var date = viz.xTicks.invert(mouseEvent[0]);
        var year = date.getFullYear().toString();

        var firstYear = viz.series[0][0].data.Year;
        var yearDifference = year - firstYear;

        var low1 = (viz.series[2][yearDifference])["0"];
        var high1 = (viz.series[2][yearDifference])["1"];
        var midpoint1 = (low1 + high1)/2;
        var data1 = (viz.series[2][yearDifference])["data"].Conservative;

        var low2 = (viz.series[1][yearDifference])["0"];
        var high2 = (viz.series[1][yearDifference])["1"];
        var midpoint2 = (low2 + high2)/2;
        var data2 = (viz.series[2][yearDifference])["data"].Unspecified;

        var low3 = (viz.series[0][yearDifference])["0"];
        var high3 = (viz.series[0][yearDifference])["1"];
        var midpoint3 = (low3 + high3)/2;
        var data3 = (viz.series[2][yearDifference])["data"].Liberal;

        var streamLabels = viz.svg.append('g')
            .attr('id', 'stream_labels');

        streamLabels.append('text')
            .attr('id', "conservative_count")
            .attr('class', "data_label")
            .attr('x', viz.computeXSnapping(viz, mouseEvent[0])+5)
            .attr('y', viz.yScale(midpoint1))
            .style("text-anchor", "start")
            .text(data1);

        streamLabels.append('text')
            .attr('id', "unspecified_count")
            .attr('class', "data_label")
            .attr('x', viz.computeXSnapping(viz, mouseEvent[0])+5)
            .attr('y', viz.yScale(midpoint2))
            .style("text-anchor", "start")
            .text(data2);

        streamLabels.append('text')
            .attr('id', "liberal_count")
            .attr('class', "data_label")
            .attr('x', viz.computeXSnapping(viz, mouseEvent[0])+5)
            .attr('y', viz.yScale(midpoint3))
            .style("text-anchor", "start")
            .text(data3);

        streamLabels.append('text')
            .attr('id', "year_hover")
            .attr('class', "data_label")
            .attr('x', viz.computeXSnapping(viz, mouseEvent[0])+5)
            .attr('y', (viz.height - 65))
            .style("text-anchor", "start")
            .text(year);
    }

    updateDataLabels(viz, mouseEvent) {
        var date = viz.xTicks.invert(mouseEvent[0]);
        var year = date.getFullYear().toString();

        var firstYear = viz.series[0][0].data.Year;
        var yearDifference = year - firstYear;

        var low1 = (viz.series[2][yearDifference])["0"];
        var high1 = (viz.series[2][yearDifference])["1"];
        var midpoint1 = (low1 + high1)/2;
        var data1 = (viz.series[2][yearDifference])["data"].Conservative;

        var low2 = (viz.series[1][yearDifference])["0"];
        var high2 = (viz.series[1][yearDifference])["1"];
        var midpoint2 = (low2 + high2)/2;
        var data2 = (viz.series[2][yearDifference])["data"].Unspecified;

        var low3 = (viz.series[0][yearDifference])["0"];
        var high3 = (viz.series[0][yearDifference])["1"];
        var midpoint3 = (low3 + high3)/2;
        var data3 = (viz.series[2][yearDifference])["data"].Liberal;

        var streamLabels = viz.svg.append('g')
            .attr('id', 'stream_labels');

        viz.svg.select("#conservative_count")
            .attr('x', viz.computeXSnapping(viz, mouseEvent[0])+5)
            .attr('y', viz.yScale(midpoint1))
            .text(data1);

        viz.svg.select("#unspecified_count")
            .attr('x', viz.computeXSnapping(viz, mouseEvent[0])+5)
            .attr('y', viz.yScale(midpoint2))
            .text(data2);

        viz.svg.select("#liberal_count")
            .attr('x', viz.computeXSnapping(viz, mouseEvent[0])+5)
            .attr('y', viz.yScale(midpoint3))
            .text(data3);

        viz.svg.select("#year_hover")
            .attr('x', viz.computeXSnapping(viz, mouseEvent[0])+5)
            .attr('y', (viz.height - 65))
            .text(year);
    }

    computeXSnapping(viz, xVal) {
        var date = viz.xTicks.invert(xVal);
        var year = date.getFullYear();

        return viz.xTicks(viz.parseDate(year));
    }
}