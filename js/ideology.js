class Ideology {
    constructor(ideology_div, justices_div, data) {
        var viz = this;

        // Variable to see if the vizualization is "active", whatever that means
        // in the context of the viz
        viz.active = false;
        viz.ideology_div = d3.select(ideology_div);
        viz.justices_div = d3.select(justices_div);

        // Get the total width and height from the div
        viz.totalStreamWidth = viz.ideology_div.node().getBoundingClientRect().width;
        viz.totalStreamHeight = viz.ideology_div.node().getBoundingClientRect().height;
        viz.totalLineWidth = viz.justices_div.node().getBoundingClientRect().width;
        viz.totalLineHeight = viz.justices_div.node().getBoundingClientRect().height;

        // Set up the svg to preserve the aspect ratio
        viz.streamSvg = viz.ideology_div.append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("viewBox", "0 0 " + viz.totalStreamWidth + " " + viz.totalStreamHeight)
            .attr("preserveAspectRatio", "xMinYMin");

        viz.lineSvg = viz.justices_div.append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("viewBox", "0 0 " + viz.totalLineWidth + " " + viz.totalLineHeight)
            .attr("preserveAspectRatio", "xMinYMin");
        
        // d3 margin convention
        viz.ideology_width = document.getElementById(ideology_div.substring(1)).offsetWidth;
        viz.ideology_height = document.getElementById(ideology_div.substring(1)).offsetHeight;
        viz.justices_width = document.getElementById(justices_div.substring(1)).offsetWidth;
        viz.justices_height = document.getElementById(justices_div.substring(1)).offsetHeight;

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

        viz.LineXScale = d3.scaleTime();
        viz.LineXTicks = d3.scaleTime();
        viz.LineYScale = d3.scaleLinear();

        viz.hoverYear;

        viz.parseDate = d3.timeParse("%Y");

        viz.data = data;
        viz.mq_scores = [];
        viz.splitJusticeData = {};
        viz.draw();
    }

    draw() {
        var viz = this;

        d3.csv("./data/ideology_data.csv", function (error, ideology_data) {
            d3.csv("./data/martin_quinn_scores.csv", function (error, scores) {
                // Stream Graph
                viz.initializeScalesAndStack(viz, ideology_data);
                viz.drawStreams(viz);
                viz.drawXAxis(viz);
                viz.drawStreamLabels(viz, [10, viz.ideology_height/2]);

                // Line Graph
                viz.filterScoresForYearRange(viz, scores);
                viz.initializeMQScalesAndAxis(viz);
                viz.plotLines(viz);

                // Both
                viz.initializeHoverLines(viz);
            });
        });
    }

    drawStreams(viz) {
        var area = d3.area()
            .x(function(d) { return viz.xScale(Number(d.data.Year)); })
            .y0(function(d) { return viz.yScale(d[0]); })
            .y1(function(d) { return viz.yScale(d[1]); })
            .curve(d3.curveBasis);

        var index = 0;
        viz.streamSvg.selectAll("path")
            .data(viz.series)
            .enter().append("path")
            .attr("d", area)
            .attr("class", function() {
                var classList = "ideology_path ";
                classList += viz.fillColorClasses[index++]
                return classList;
            });
    }

    drawXAxis(viz) {
        var xAxis = d3.axisBottom(viz.xTicks).tickValues(viz.xTicks.ticks(viz.years.length/2));
        viz.streamSvg.append("g")
            .attr("class", "axis axis--x")
            .attr("transform", "translate(0," + (viz.ideology_height - 40) + ")")
            .call(xAxis)
            .selectAll("text")  
            .style("text-anchor", "end")
            .style("font-size", "0.75rem")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-65)")
            .attr("display", function(d,i) {
                if (i%2 == 0) {
                    return 'block';
                }
                return 'none';
            });
    }

    initializeScalesAndStack(viz, ideology_data) {
        viz.years = ideology_data.map(d => d.Year);

        viz.xScale.domain(d3.extent(viz.years, function(d) { return d; }))
            .range([10, viz.ideology_width-10]);

        viz.xTicks.domain(d3.extent(viz.years, function(d) { return viz.parseDate(d); }))
            .range([10, viz.ideology_width-10]);

        viz.series = viz.stack(ideology_data);

        var mins = viz.series[0].map(d => d[0]);
        var maxs = viz.series[2].map(d => d[1]);
        viz.minOfMins = Math.min(... mins);
        viz.yScale.domain([Math.min(... mins), Math.max(... maxs)])
            .range([viz.ideology_height - 40, 0]);
    }

    initializeHoverLines(viz) {
        var date = viz.xTicks.invert(10);
        var year = date.getFullYear().toString();

        var streamLineData = [
            { 'x': 10, 'y': -1000000},
            { 'x': 10, 'y': (viz.series[2][year - viz.series[0][0].data.Year])["1"]}
        ];

        var streamLine = d3.line()
            .x(function(d) { return d['x']; })
            .y(function(d) {
                if (d['y'] == -1000000) {
                    return viz.ideology_height - 40;
                }
                return viz.yScale(d['y']);
            });
        
        viz.streamSvg.append("path")
            .attr("id", "stream_line")
            .datum(streamLineData)
            .attr('d', streamLine);

        var lineLineData = [
            { 'x': 40, 'y': -1000000},
            { 'x': 40, 'y': 10}
        ];

        var lineLine = d3.line()
            .x(function(d) { return d['x']; })
            .y(function(d) {
                if (d['y'] == -1000000) {
                    return viz.ideology_height - 40;
                }
                return viz.yScale(d['y']);
            });

        viz.lineSvg.append("path")
            .attr("id", "line_line")
            .datum(lineLineData)
            .attr('d', lineLine);

        viz.streamSvg.append("rect")
            .attr("x", 11)
            .attr("y", 0)
            .attr("width", (viz.ideology_width - 16))
            .attr("height", (viz.ideology_height-40))
            .attr("opacity", 0)
            .on("mouseover", function() {
                document.getElementById("stream_line").classList.add("visible");
                document.getElementById("line_line").classList.add("visible");
                // document.getElementById("conservative_count").classList.add("visible");
                // document.getElementById("unspecified_count").classList.add("visible");
                // document.getElementById("liberal_count").classList.add("visible");
                // document.getElementById("year_hover").classList.add("visible");
                viz.adjustStreamHoverLine(viz, this, true);
                viz.adjustLineHoverLine(viz, this, false);
            })
            .on("mousemove", function(d,i) {
                viz.adjustStreamHoverLine(viz, this, true);
                viz.adjustLineHoverLine(viz, this, false);
            })
            .on("mouseout", function(d) {
                document.getElementById("stream_line").classList.remove("visible");
                document.getElementById("line_line").classList.remove("visible");
                // document.getElementById("conservative_count").classList.remove("visible");
                // document.getElementById("unspecified_count").classList.remove("visible");
                // document.getElementById("liberal_count").classList.remove("visible");
                // document.getElementById("year_hover").classList.remove("visible");
            });

        viz.lineSvg.append("rect")
            .attr("x", 41)
            .attr("y", 0)
            .attr("width", (viz.justices_width - 48))
            .attr("height", (viz.justices_height-40))
            .attr("opacity", 0)
            .on("mouseover", function() {
                document.getElementById("stream_line").classList.add("visible");
                document.getElementById("line_line").classList.add("visible");
                // document.getElementById("conservative_count").classList.add("visible");
                // document.getElementById("unspecified_count").classList.add("visible");
                // document.getElementById("liberal_count").classList.add("visible");
                // document.getElementById("year_hover").classList.add("visible");
                viz.adjustLineHoverLine(viz, this, true);
                viz.adjustStreamHoverLine(viz, this, false);
            })
            .on("mousemove", function(d,i) {
                viz.adjustLineHoverLine(viz, this, true);
                viz.adjustStreamHoverLine(viz, this, false);
            })
            .on("mouseout", function(d) {
                document.getElementById("stream_line").classList.remove("visible");
                document.getElementById("line_line").classList.remove("visible");
                // document.getElementById("conservative_count").classList.remove("visible");
                // document.getElementById("unspecified_count").classList.remove("visible");
                // document.getElementById("liberal_count").classList.remove("visible");
                // document.getElementById("year_hover").classList.remove("visible");
            });
    }

    adjustStreamHoverLine(viz, mouseEvent, isFirst) {
        var docStreamLine = d3.select("#stream_line");

        viz.mousePosX = d3.mouse(mouseEvent)[0];
        viz.mousePosY = d3.mouse(mouseEvent)[1];

        var date = viz.xTicks.invert(viz.mousePosX);
        var year = date.getFullYear().toString();
        var initialYear = viz.series[0][0].data.Year
        var yearDifference = year - initialYear;
        if (yearDifference < 0) {
            yearDifference = 0;
        }

        var mousePos = d3.mouse(mouseEvent);

        if (mousePos == null) {
            mousePos = [10, viz.ideology_height/2];
        }

        var streamLineData = [
            { 'x': mousePos[0], 'y': -1000000},
            { 'x': mousePos[0], 'y': (viz.series[2][yearDifference])["1"]}
        ];

        var streamLine;
        if (isFirst) {
            streamLine = d3.line()
                .x(function(d) {
                    var return_val;
                    [viz.hoverYear, return_val] = viz.computeXSnapping(viz, d['x']);
                    return return_val; 
                })
                .y(function(d) { 
                    if (d['y'] == -1000000) {
                        return viz.ideology_height - 40;
                    }
                    return viz.yScale(d['y']);
                });
        }
        else {
            streamLine = d3.line()
                .x(function(d) { return viz.xTicks(viz.parseDate(viz.hoverYear.toString())); })
                .y(function(d) { 
                    if (d['y'] == -1000000) {
                        return viz.ideology_height - 40;
                    }
                    return viz.yScale(d['y']);
                });
        }

        docStreamLine.datum(streamLineData)
            .attr('d', streamLine);
    }

    adjustLineHoverLine(viz, mouseEvent, isFirst) {
        var docLineLine = d3.select("#line_line");

        viz.mousePosX = d3.mouse(mouseEvent)[0];
        viz.mousePosY = d3.mouse(mouseEvent)[1];

        var date = viz.xTicks.invert(viz.mousePosX);
        var year = date.getFullYear().toString();
        var initialYear = viz.series[0][0].data.Year
        var yearDifference = year - initialYear;
        if (yearDifference < 0) {
            yearDifference = 0;
        }

        var mousePos = d3.mouse(mouseEvent);

        if (mousePos == null) {
            mousePos = [10, viz.ideology_height/2];
        }

        var lineLineData = [
            { 'x': mousePos[0], 'y': -1000000},
            { 'x': mousePos[0], 'y': 10}
        ];

        var lineLine;

        if (isFirst) {
            lineLine = d3.line()
            .x(function(d) {
                var return_val;
                [viz.hoverYear, return_val] = viz.computeXSnappingForLineChart(viz, d['x']);
                return return_val;
            })
            .y(function(d) { 
                if (d['y'] == -1000000) {
                    return viz.ideology_height - 40;
                }
                return viz.LineYScale(d['y']);
            });
        }
        else {
            lineLine = d3.line()
            .x(function(d) { return viz.LineXTicks(viz.parseDate(viz.hoverYear.toString())); })
            .y(function(d) { 
                if (d['y'] == -1000000) {
                    return viz.ideology_height - 40;
                }
                return viz.LineYScale(d['y']);
            });
        }

        docLineLine.datum(lineLineData)
            .attr('d', lineLine);

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

        // var streamLabels = viz.svg.append('g')
        //     .attr('id', 'stream_labels');

        // streamLabels.append('text')
        //     .attr('id', "conservative_count")
        //     .attr('class', "data_label")
        //     .attr('x', viz.computeXSnapping(viz, mouseEvent[0])+5)
        //     .attr('y', viz.yScale(midpoint1))
        //     .style("text-anchor", "start")
        //     .text(data1);

        // streamLabels.append('text')
        //     .attr('id', "unspecified_count")
        //     .attr('class', "data_label")
        //     .attr('x', viz.computeXSnapping(viz, mouseEvent[0])+5)
        //     .attr('y', viz.yScale(midpoint2))
        //     .style("text-anchor", "start")
        //     .text(data2);

        // streamLabels.append('text')
        //     .attr('id', "liberal_count")
        //     .attr('class', "data_label")
        //     .attr('x', viz.computeXSnapping(viz, mouseEvent[0])+5)
        //     .attr('y', viz.yScale(midpoint3))
        //     .style("text-anchor", "start")
        //     .text(data3);

        // streamLabels.append('text')
        //     .attr('id', "year_hover")
        //     .attr('class', "data_label")
        //     .attr('x', viz.computeXSnapping(viz, mouseEvent[0])+5)
        //     .attr('y', (viz.height - 65))
        //     .style("text-anchor", "start")
        //     .text(year);
    }

    updateDataLabels(viz, mouseEvent) {
        var date = viz.xTicks.invert(mouseEvent[0]);
        var year = date.getFullYear().toString();

        var firstYear = viz.series[0][0].data.Year;
        var yearDifference = year - firstYear;
        if (yearDifference < 0) {
            yearDifference = 0;
        }

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

        // var streamLabels = viz.svg.append('g')
        //     .attr('id', 'stream_labels');

        // viz.svg.select("#conservative_count")
        //     .attr('x', viz.computeXSnapping(viz, mouseEvent[0])+5)
        //     .attr('y', viz.yScale(midpoint1))
        //     .text(data1);

        // viz.svg.select("#unspecified_count")
        //     .attr('x', viz.computeXSnapping(viz, mouseEvent[0])+5)
        //     .attr('y', viz.yScale(midpoint2))
        //     .text(data2);

        // viz.svg.select("#liberal_count")
        //     .attr('x', viz.computeXSnapping(viz, mouseEvent[0])+5)
        //     .attr('y', viz.yScale(midpoint3))
        //     .text(data3);

        // viz.svg.select("#year_hover")
        //     .attr('x', viz.computeXSnapping(viz, mouseEvent[0])+5)
        //     .attr('y', (viz.height - 65))
        //     .text(year);
    }

    filterScoresForYearRange(viz, scores) {
        for (var i = 0; i < scores.length; i++) {
            if (Number(scores[i].term) >= Number(viz.years[0])) {
                viz.mq_scores.push(scores[i]);
            }
        }
    }

    initializeMQScalesAndAxis(viz) {
        viz.LineXScale.domain(d3.extent(viz.years, function(d) { return d; }))
            .range([40, viz.ideology_width-10]);

        viz.LineXTicks.domain(d3.extent(viz.years, function(d) { return viz.parseDate(d); }))
            .range([40, viz.ideology_width-10]);

        var xAxis = d3.axisBottom(viz.LineXTicks).tickValues(viz.LineXTicks.ticks(viz.years.length/2));
        viz.lineSvg.append("g")
            .attr("class", "axis axis--x")
            .attr("transform", "translate(0," + (viz.ideology_height - 40) + ")")
            .call(xAxis)
            .selectAll("text")  
            .style("text-anchor", "end")
            .style("font-size", "0.75rem")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-65)")
            .attr("display", function(d,i) {
                if (i%2 == 0) {
                    return 'block';
                }
                return 'none';
            });

        viz.LineYScale.domain([-8.0, 8.0])
            .range([(viz.justices_height - 40), 10]);

        var yAxis = d3.axisLeft(viz.LineYScale);
        viz.lineSvg.append("g")
            .attr("class", "axis axis--y")
            .attr("transform", "translate(40,0)")
            .call(yAxis)
            .selectAll("text")  
            .style("text-anchor", "end")
            .style("font-size", "0.75rem");

        viz.lineSvg.append("text")
            .attr("transform", "translate(12" + " ," + ((viz.justices_height - 40)/2) + ") rotate(-90)")
            .style("text-anchor", "middle")
            .text("Martin-Quinn Scores");
    }

    plotLines(viz) {
        viz.splitOutJusticeData(viz);

        for (var justice in viz.splitJusticeData) {
            var justiceData = viz.splitJusticeData[justice];

            var line = d3.line()
                 .x(function(d) { return viz.LineXScale(Number(d.term)); })
                 .y(function(d) { return viz.LineYScale(Number(d.mqScore)); });

            var newGroup = viz.lineSvg.append("g")
                .attr("id", "justice_" + justice);

            newGroup.append("path")
                .attr("fill", "none")
                .attr("stroke", "#999")
                .attr("stroke-width", "2px")
                .attr('d', line(justiceData));
        }
    }

    splitOutJusticeData(viz) {
        for (var obj in viz.mq_scores) {
            if (viz.mq_scores[obj].justiceName in viz.splitJusticeData) {
                viz.splitJusticeData[viz.mq_scores[obj].justiceName].push(viz.mq_scores[obj]);
            }
            else {
                viz.splitJusticeData[viz.mq_scores[obj].justiceName] = [viz.mq_scores[obj]];
            }
        }
    }

    update(startYear, endYear, selectedIssueAreas) {
        
    }

    computeXSnapping(viz, xVal) {
        var date = viz.xTicks.invert(xVal);
        var year = date.getFullYear();

        return [year, viz.xTicks(viz.parseDate(year))];
    }

    computeXSnappingForLineChart(viz, xVal) {
        var date = viz.LineXTicks.invert(xVal);
        var year = date.getFullYear();

        return [year, viz.LineXTicks(viz.parseDate(year))];
    }
}