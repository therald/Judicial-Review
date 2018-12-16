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
        viz.years = [];
        viz.series;
        viz.streamLabels;

        viz.LineXScale = d3.scaleTime();
        viz.LineXTicks = d3.scaleTime();
        viz.LineYScale = d3.scaleLinear();

        viz.hoverYear;

        viz.parseDate = d3.timeParse("%m/%d/%Y");
        viz.parseYear = d3.timeParse("%Y");

        viz.caseData = data;
        viz.ideologyData = {};
        viz.mq_scores = [];
        viz.splitJusticeData = {};

        viz.selectedIssueAreas = [];
        viz.startYear;
        viz.endYear;

        viz.streamGroup;
        viz.draw();
    }

    draw() {
        var viz = this;

        d3.csv("./data/martin_quinn_scores.csv", function (error, scores) {
            // Stream Graph
            viz.initializeIdeologyData(viz);
            viz.initializeScalesAndStack(viz, viz.ideologyData, viz.years);
            viz.drawStreams(viz);
            viz.drawXAxis(viz, viz.years);

            // Line Graph
            viz.mq_scores = scores;
            viz.initializeMQScalesAndAxis(viz);
            viz.plotLines(viz, viz.years);

            // Both
            viz.initializeHoverLines(viz);

            viz.mq_scores = scores;
        });
    }

    initializeIdeologyData(viz) {
        var data = viz.caseData;

        for (var i = 0; i < data.length; i++) {
            var caseData = data[i];
            var year = caseData.dateDecision.split("/")[2];

            // Construct Years
            if (!viz.years.includes(year)) {
                viz.years.push(year);
            }

            // Construct Ideology Data
            if (!(year in viz.ideologyData)) {
                viz.ideologyData[year] = {};
                viz.ideologyData[year].Issue_Areas = {};

                viz.ideologyData[year].Issue_Areas[caseData.issueArea] = {
                    1: 0,
                    2: 0,
                    3: 0
                };

                viz.ideologyData[year].Issue_Areas[caseData.issueArea][viz.getDecisionDirection(caseData.decisionDirection)] += 1;
            }
            else if (!(caseData.issueArea in viz.ideologyData[year].Issue_Areas)) {
                viz.selectedIssueAreas.push(caseData.issueArea);

                viz.ideologyData[year].Issue_Areas[caseData.issueArea] = {
                    1: 0,
                    2: 0,
                    3: 0
                };

                viz.ideologyData[year].Issue_Areas[caseData.issueArea][viz.getDecisionDirection(caseData.decisionDirection)] += 1;
            }
            else {
                viz.ideologyData[year].Issue_Areas[caseData.issueArea][viz.getDecisionDirection(caseData.decisionDirection)] += 1;
            }
        }
    }

    getDecisionDirection(direction) {
        if (Number(direction) == 0) {
            return 3;
        }

        return Number(direction);
    }

    drawStreams(viz) {
        var area = d3.area()
            .x(function(d) { return viz.xScale(Number(d.data.Year)); })
            .y0(function(d) { return viz.yScale(d[0]); })
            .y1(function(d) { return viz.yScale(d[1]); })
            .curve(d3.curveBasis);

        var index = 0;

        viz.streamGroup = viz.streamSvg.append("g")
            .attr("id", "stream_paths");

        viz.streamGroup.selectAll("path")
            .data(viz.series)
            .enter().append("path")
            .attr("d", area)
            .attr("class", function() {
                var classList = "ideology_path ";
                classList += viz.fillColorClasses[index++];
                return classList;
            });
    }

    drawXAxis(viz, years) {
        var xAxis = d3.axisBottom(viz.xTicks).tickValues(viz.xTicks.ticks(years.length/2));
        viz.streamSvg.append("g")
            .attr("id", "stream_axis")
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

    initializeScalesAndStack(viz, ideologyData, years) {
        viz.xScale.domain(d3.extent(years, function(d) { return d; }))
            .range([10, viz.ideology_width-10]);

        viz.xTicks.domain(d3.extent(years, function(d) { return viz.parseYear(d); }))
            .range([10, viz.ideology_width-10]);

        var dataForStack = viz.processIdeologyDataForStack(viz, ideologyData);
        viz.series = viz.stack(dataForStack);

        var mins = viz.series[0].map(d => d[0]);
        var maxs = viz.series[2].map(d => d[1]);
        viz.minOfMins = Math.min(... mins);

        viz.yScale.domain([Math.min(... mins), Math.max(... maxs)])
            .range([viz.ideology_height - 40, 0]);
    }

    processIdeologyDataForStack(viz, ideologyData) {
        var formattedData = [];

        for (var year in ideologyData) {
            var conservativeCount = 0;
            var liberalCount = 0;
            var unspecifiedCount = 0;

            for (var issueArea in ideologyData[year].Issue_Areas) {
                if (issueArea in viz.selectedIssueAreas) {
                    var counts = ideologyData[year].Issue_Areas[issueArea];
                    for (var count in counts) {
                        switch (count) {
                            case "3":
                                unspecifiedCount += counts[count];
                                break;
                            case "2":
                                liberalCount += counts[count];
                                break;
                            case "1":
                                conservativeCount += counts[count];
                                break;
                            default:
                                //do nothing
                                break;
                        }
                    }
                }
            }

            var idObj = {
                "Year": year,
                "Conservative": conservativeCount,
                "Liberal": liberalCount,
                "Unspecified": unspecifiedCount
            };

            formattedData.push(idObj);
        }

        viz.formattedIdeologyData = formattedData;

        return formattedData;
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
            .attr("id", "stream_rect")
            .attr("x", 11)
            .attr("y", 0)
            .attr("width", (viz.ideology_width - 16))
            .attr("height", (viz.ideology_height-40))
            .attr("opacity", 0)
            .on("mouseover", function() {
                document.getElementById("stream_line").classList.add("visible");
                document.getElementById("line_line").classList.add("visible");
                document.getElementById("ideology_right").classList.add("visible");
                viz.adjustStreamHoverLine(viz, this, true);
                viz.adjustLineHoverLine(viz, this, false);
                viz.updateDetailSection(viz);
            })
            .on("mousemove", function(d,i) {
                viz.adjustStreamHoverLine(viz, this, true);
                viz.adjustLineHoverLine(viz, this, false);
                viz.updateDetailSection(viz);
            })
            .on("mouseout", function(d) {
                document.getElementById("stream_line").classList.remove("visible");
                document.getElementById("line_line").classList.remove("visible");
                document.getElementById("ideology_right").classList.remove("visible");
            });

        viz.lineSvg.append("rect")
            .attr("id", "line_rect")
            .attr("x", 41)
            .attr("y", 0)
            .attr("width", (viz.justices_width - 48))
            .attr("height", (viz.justices_height-40))
            .attr("opacity", 0)
            .on("mouseover", function() {
                document.getElementById("stream_line").classList.add("visible");
                document.getElementById("line_line").classList.add("visible");
                document.getElementById("ideology_right").classList.add("visible");
                viz.adjustLineHoverLine(viz, this, true);
                viz.adjustStreamHoverLine(viz, this, false);
                viz.updateDetailSection(viz);
            })
            .on("mousemove", function(d,i) {
                viz.adjustLineHoverLine(viz, this, true);
                viz.adjustStreamHoverLine(viz, this, false);
                viz.updateDetailSection(viz);
            })
            .on("mouseout", function(d) {
                document.getElementById("stream_line").classList.remove("visible");
                document.getElementById("line_line").classList.remove("visible");
                document.getElementById("ideology_right").classList.remove("visible");
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
                .x(function(d) { return viz.xTicks(viz.parseYear(viz.hoverYear.toString())); })
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
        var initialYear = viz.series[0][0].data.Year;
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
            .x(function(d) { return viz.LineXTicks(viz.parseYear(viz.hoverYear.toString())); })
            .y(function(d) { 
                if (d['y'] == -1000000) {
                    return viz.ideology_height - 40;
                }
                return viz.LineYScale(d['y']);
            });
        }

        docLineLine.datum(lineLineData)
            .attr('d', lineLine);
    }

    updateDetailSection(viz) {
        document.getElementById("year_on_hover").innerHTML = viz.hoverYear;

        for (var obj in viz.formattedIdeologyData) {
            if (Number(viz.formattedIdeologyData[obj].Year) == viz.hoverYear) {
                var conservativeCount = Number(viz.formattedIdeologyData[obj].Conservative);
                document.getElementById("conservative_count").innerHTML = conservativeCount;
                var unspecifiedCount = Number(viz.formattedIdeologyData[obj].Unspecified);
                document.getElementById("unspecified_count").innerHTML = unspecifiedCount;
                var liberalCount = Number(viz.formattedIdeologyData[obj].Liberal);
                document.getElementById("liberal_count").innerHTML = liberalCount;
                var total = conservativeCount + unspecifiedCount + liberalCount;
                document.getElementById("total_count").innerHTML = total;
            } 
        }

        var justiceDetailDiv = document.getElementById("justices_and_scores");
        justiceDetailDiv.innerHTML = "";

        if (viz.hoverYear <= 2011) {
            var headerTag = document.createElement("h2");
            var headerTagText = document.createTextNode("Serving Justices");
            headerTag.appendChild(headerTagText);
            justiceDetailDiv.appendChild(headerTag);
        }

        var justiceDivs = [];
        for (var justiceName in viz.splitJusticeData) {
            for (var termData in viz.splitJusticeData[justiceName]) {
                if (Number(viz.splitJusticeData[justiceName][termData].term) == viz.hoverYear) {
                    var justiceDiv = document.createElement("div");
                    justiceDiv.classList.add("justice_div");
                    var justiceLabel = document.createElement("div");
                    var justiceLabelText = document.createTextNode(justiceName);
                    justiceLabel.classList.add("justice_name");
                    var justiceScore = document.createElement("div");
                    var justiceScoreText = document.createTextNode(Number(viz.splitJusticeData[justiceName][termData].mqScore).toFixed(2).toString());
                    justiceScore.classList.add("score");
                    justiceScore.setAttribute("id", "justice_score_" + justiceName);

                    justiceLabel.appendChild(justiceLabelText);
                    justiceScore.appendChild(justiceScoreText);

                    justiceDiv.appendChild(justiceLabel);
                    justiceDiv.appendChild(justiceScore);

                    var justiceObj = {
                        Year: viz.hoverYear,
                        Name: justiceName,
                        Score: viz.splitJusticeData[justiceName][termData].mqScore,
                        Obj: justiceDiv
                    };

                    if (!justiceDivs.map(o => o.Name).includes(justiceName)) {
                        justiceDivs.push(justiceObj);
                    }
                }
            }
        }

        justiceDivs = justiceDivs.sort(function(a,b) {
            return Number(b.Score) - Number(a.Score);
        });

        for (var i = 0; i < justiceDivs.length; i++) {
            justiceDetailDiv.appendChild(justiceDivs[i].Obj);
        }
    }

    initializeMQScalesAndAxis(viz) {
        viz.LineXScale.domain(d3.extent(viz.years, function(d) { return d; }))
            .range([40, viz.justices_width-10]);

        viz.LineXTicks.domain(d3.extent(viz.years, function(d) { return viz.parseYear(d); }))
            .range([40, viz.justices_width-10]);

        var xAxis = d3.axisBottom(viz.LineXTicks).tickValues(viz.LineXTicks.ticks(viz.years.length/2));
        viz.lineSvg.append("g")
            .attr("id", "line_x_axis")
            .attr("class", "axis axis--x")
            .attr("transform", "translate(0," + (viz.justices_height - 40) + ")")
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
            .attr("id", "line_y_axis")
            .attr("class", "axis axis--y")
            .attr("transform", "translate(40,0)")
            .call(yAxis)
            .selectAll("text")  
            .style("text-anchor", "end")
            .style("font-size", "0.75rem");

        viz.lineSvg.append("g")
            .attr("id", "line_y_axis_label")
            .append("text")
            .attr("transform", "translate(12" + " ," + ((viz.justices_height - 40)/2) + ") rotate(-90)")
            .style("text-anchor", "middle")
            .text("Martin-Quinn Scores");
    }

    plotLines(viz, years) {
        viz.splitOutJusticeData(viz, years);

        var justiceLines = viz.lineSvg.append("g")
            .attr("id", "justice_lines");

        for (var justice in viz.splitJusticeData) {
            var justiceData = viz.splitJusticeData[justice];

            var line = d3.line()
                 .x(function(d) { return viz.LineXScale(Number(d.term)); })
                 .y(function(d) { return viz.LineYScale(Number(d.mqScore)); });

            var newGroup = justiceLines.append("g")
                .attr("id", "justice_" + justice);

            newGroup.append("path")
                .attr("fill", "none")
                .attr("stroke", "#999")
                .attr("stroke-width", "2px")
                .attr('d', line(justiceData));
        }
    }

    splitOutJusticeData(viz, years) {
        viz.splitJusticeData = {};

        for (var obj in viz.mq_scores) {
            if (obj == "columns") {
                continue;
            }

            if (years.includes(viz.mq_scores[obj].term)) {
                if (viz.mq_scores[obj].justiceName in viz.splitJusticeData) {
                    viz.splitJusticeData[viz.mq_scores[obj].justiceName].push(viz.mq_scores[obj]);
                }
                else {
                    viz.splitJusticeData[viz.mq_scores[obj].justiceName] = [viz.mq_scores[obj]];
                }
            }
        }
    }

    update(startYear, endYear, selectedIssueAreas) {
        var viz = this;

        // Preprocess Data
        var processedYears = viz.processYears(viz, startYear, endYear);
        var processedIdeologyData = viz.processIdeologyData(viz, viz.ideologyData, startYear, endYear, selectedIssueAreas);
        var processedScoresData = viz.processScoresData(viz, viz.mq_scores, startYear, endYear, selectedIssueAreas);

        viz.initializeScalesAndStack(viz, processedIdeologyData, processedYears);
        viz.updateStreams(viz);
        viz.updateXAxis(viz, processedYears);

        viz.updateMQScalesAndAxis(viz, processedYears);
        viz.updatePlottedLines(viz, processedYears);

        viz.resetHoverLines(viz);
    }

    processYears(viz, start, end) {
        var processedData = [];

        for (var i = 0; i < viz.years.length; i++) {
            if (start <= Number(viz.years[i]) && viz.years[i] <= Number(end)) {
                processedData.push(viz.years[i]);
            }
        }

        return processedData;
    }

    processIdeologyData(viz, data, start, end, areas) {
        var processedData = {};

        for (var i in data) {
            if (Number(start) <= Number(i) && Number(i) <= Number(end)) {
                var processObj = {};
                for (var area in data[i].Issue_Areas) {
                    if (areas.includes(area)) {
                        processObj[area] = data[i].Issue_Areas[area];
                    }
                }
                processedData[i] = {};
                processedData[i]["Issue_Areas"] = processObj;
            }
        }

        return processedData;
    }

    processScoresData(viz, data, start, end, areas) {
        var processedData = [];

        for (var i = 0; i < data.length; i++) {
            if (Number(start) <= Number(data[i].term) && Number(data[i].term) <= Number(end)) {
                processedData.push(data[i]);
            }
        }

        return processedData;
    }

    updateStreams(viz) {
        var area = d3.area()
            .x(function(d) { return viz.xScale(Number(d.data.Year)); })
            .y0(function(d) { return viz.yScale(d[0]); })
            .y1(function(d) { return viz.yScale(d[1]); })
            .curve(d3.curveBasis);

        var index = 0;

        viz.streamGroup.remove();
        viz.streamGroup = viz.streamSvg.append("g")
            .attr("id", "stream_paths");

        viz.streamGroup.selectAll("path")
            .data(viz.series)
            .enter().append("path")
            .attr("d", area)
            .attr("class", function() {
                var classList = "ideology_path ";
                classList += viz.fillColorClasses[index++]
                return classList;
            });
    }

    updateXAxis(viz, years) {
        var xAxis = d3.axisBottom(viz.xTicks).tickValues(viz.xTicks.ticks(years.length/2));

        var drawnAxis = d3.select("#stream_axis");

        drawnAxis.call(xAxis)
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

    updateMQScalesAndAxis(viz, years) {
        viz.LineXScale.domain(d3.extent(years, function(d) { return d; }))
            .range([40, viz.justices_width-10]);

        viz.LineXTicks.domain(d3.extent(years, function(d) { return viz.parseYear(d); }))
            .range([40, viz.justices_width-10]);

        var xAxis = d3.axisBottom(viz.LineXTicks).tickValues(viz.LineXTicks.ticks(years.length/2));
        d3.select("#line_x_axis")
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

        console.log(viz.splitJusticeData);
        viz.LineYScale.domain([-8.0, 8.0])
            .range([(viz.justices_height - 40), 10]);

        var yAxis = d3.axisLeft(viz.LineYScale);
        d3.select("#line_y_axis")
            .call(yAxis)
            .selectAll("text")  
            .style("text-anchor", "end")
            .style("font-size", "0.75rem");
    }

    updatePlottedLines(viz, years) {
        d3.select("#justice_lines").remove();
        viz.plotLines(viz, years);
    }

    resetHoverLines(viz) {
        d3.select("#stream_line").remove();
        d3.select("#line_line").remove();
        d3.select("#stream_rect").remove();
        d3.select("#line_rect").remove();

        viz.initializeHoverLines(viz);
    }

    computeXSnapping(viz, xVal) {
        var date = viz.xTicks.invert(xVal);
        var year = date.getFullYear();

        return [year, viz.xTicks(viz.parseYear(year))];
    }

    computeXSnappingForLineChart(viz, xVal) {
        var date = viz.LineXTicks.invert(xVal);
        var year = date.getFullYear();

        return [year, viz.LineXTicks(viz.parseYear(year))];
    }
}