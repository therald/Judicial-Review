class Ideology {
    constructor(div, data, constitutional, precedent) {
        var viz = this;

        // Variable to see if the vizualization is "active", whatever that means
        // in the context of the viz
        viz.active = false;
        viz.div = d3.select(div);

        viz.constitutional = constitutional;
        viz.precedent = precedent;

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
        viz.xTicks = d3.scaleTime();
        viz.stack = d3.stack()
            .keys(["Liberal", "Unspecified", "Conservative"])
            .offset(d3.stackOffsetWiggle);

        viz.fillColorClasses = ["fill_blue", "fill_purple", "fill_red"];
        viz.years;
        viz.series;

        viz.parseDate = d3.timeParse("%Y");

        viz.data = data;
        viz.draw();
    }

    draw() {
        var viz = this;

        d3.csv("./data/ideology_data.csv", function (error, ideology_data) {
            viz.initializeScalesAndStack(viz, ideology_data);
            viz.drawStreams(viz);
            viz.drawXAxis(viz);
            viz.initializeHoverLine(viz);
            viz.addBrush(viz);
        });
    }

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

    addBrush(viz) {
        viz.svg.append("g")
            .attrs({
                id: "brush_area",
                class: "brush"
            })
            .on("mouseover", function() {
                document.getElementById("data_line").classList.add("visible");
                viz.adjustHoverLinePositionAndCounts(viz, this, viz.yScale);
            })
            .on("mousemove", function(d,i) {
                viz.adjustHoverLinePositionAndCounts(viz, this, viz.yScale);
            })
            .on("mouseout", function(d) {
                    document.getElementById("data_line").classList.remove("visible");
                    document.getElementById("conservative_count").innerHTML = '';
                    document.getElementById("liberal_count").innerHTML = '';
                    document.getElementById("unspecified_count").innerHTML = '';
            })
            .call(
                d3.brushX()
                .extent([[25, 0], [viz.width - 25, viz.height - 60]])
                .on("brush", function() {
                    viz.adjustHoverLinePositionAndCounts(viz, this, viz.yScale);
                })
                .on("end", function() {
                    viz.constitutional.update(viz.xTicks.invert(d3.event.selection[0]).getFullYear(), viz.xTicks.invert(d3.event.selection[1]).getFullYear(),viz.precedent);
                    //viz.precedent.update(viz.xTicks.invert(d3.event.selection[0]).getFullYear(), viz.xTicks.invert(d3.event.selection[1]).getFullYear());
                })
            );
    }

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
            .range([25, viz.width-25]);

        viz.xTicks.domain(d3.extent(viz.years, function(d) { return viz.parseDate(d); }))
            .range([25, viz.width-25]);

        viz.series = viz.stack(ideology_data);

        var mins = viz.series[0].map(d => d[0]);
        var maxs = viz.series[2].map(d => d[1]);
        viz.yScale.domain([Math.min(... mins), Math.max(... maxs)])
            .range([viz.height - 75, 0]);
    }

    initializeHoverLine(viz) {
        var date = viz.xTicks.invert(25);
        var year = date.getFullYear().toString();

        console.log(viz);

        var lineData = [
            { 'x': 25, 'y': (viz.series[0][year - viz.series[0][0].data.Year])["0"]},
            { 'x': 25, 'y': (viz.series[2][year - viz.series[0][0].data.Year])["1"]}
        ]

        var line = d3.line()
            .x(function(d) { return d['x']; })
            .y(function(d) { return viz.yScale(d['y']); });
        
        viz.svg.append("path")
            .attr("id", "data_line")
            .datum(lineData)
            .attr('d', line);
    }

    adjustHoverLinePositionAndCounts(viz, mouseEvent, yScale) {
        var dataLine = d3.select("#data_line");

        viz.mousePosX = d3.mouse(mouseEvent)[0];
        viz.mousePosY = d3.mouse(mouseEvent)[0];

        var date = viz.xTicks.invert(d3.mouse(mouseEvent)[0]);
        var year = date.getFullYear().toString();
        var initialYear = viz.series[0][0].data.Year
        var yearDifference = year - initialYear;

        var mousePos = d3.mouse(mouseEvent);

        if (mousePos == null) {
            mousePos = [25, viz.height/2];
        }

        var lineData = [
            { 'x': mousePos[0], 'y': (viz.series[0][yearDifference])["0"]},
            { 'x': mousePos[0], 'y': (viz.series[2][yearDifference])["1"]}
        ]

        var line = d3.line()
            .x(function(d) { return viz.computeXSnapping(viz, d['x']); })
            .y(function(d) { return viz.yScale(d['y']); });

        dataLine.datum(lineData)
            .attr('d', line);

        // Update ruling count texts
        var countData = (viz.series[0][yearDifference]).data;

        document.getElementById("conservative_count").innerHTML = countData.Conservative;
        document.getElementById("liberal_count").innerHTML = countData.Liberal;
        document.getElementById("unspecified_count").innerHTML = countData.Unspecified;
    }

    computeXSnapping(viz, xVal) {
        var date = viz.xTicks.invert(xVal);
        var year = date.getFullYear();

        return viz.xTicks(viz.parseDate(year));
    }
}