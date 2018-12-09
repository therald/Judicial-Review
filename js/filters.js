class Filters {
    constructor(time_div, issue_area_div, data, ideology, constitutional, precedent) {
        var viz = this;

        // Variable to see if the vizualization is "active", whatever that means
        // in the context of the viz
        viz.active = false;
        viz.time_div = d3.select(time_div);
        viz.issue_area_div = d3.select(issue_area_div);

        viz.ideology = ideology;
        viz.constitutional = constitutional;
        viz.precedent = precedent;

        // Get the total width and height from the div
        viz.totalTimeWidth = viz.time_div.node().getBoundingClientRect().width;
        viz.totalTimeHeight = viz.time_div.node().getBoundingClientRect().height;
        viz.totalIssueWidth = viz.issue_area_div.node().getBoundingClientRect().width;
        viz.totalIssueHeight = viz.issue_area_div.node().getBoundingClientRect().height;

        // Set up the svg to preserve the aspect ratio
        viz.time_svg = viz.time_div.append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("viewBox", "0 0 " + viz.totalTimeWidth + " " + viz.totalTimeHeight)
            .attr("preserveAspectRatio", "xMinYMin");
        viz.issue_area_svg = viz.issue_area_div.append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("viewBox", "0 0 " + viz.totalIssueWidth + " " + viz.totalIssueHeight)
            .attr("preserveAspectRatio", "xMinYMin");
        
        // d3 margin convention
        viz.timeWidth = document.getElementById(time_div.substring(1)).offsetWidth;
        viz.timeHeight = document.getElementById(time_div.substring(1)).offsetHeight;
        viz.issueWidth = document.getElementById(issue_area_div.substring(1)).offsetWidth;
        viz.issueHeight = document.getElementById(issue_area_div.substring(1)).offsetHeight;

        viz.parseDate = d3.timeParse("%m/%d/%Y");
        viz.parseYear = d3.timeParse("%Y");

        viz.xTicks = d3.scaleTime();

        viz.years = [];
        viz.startYear;
        viz.endYear;
        viz.startHandle;
        viz.endHandle;

        viz.data = data;
        viz.draw();
    }

    draw() {
        var viz = this;

        viz.years = [... new Set(viz.data.map(d => viz.parseDate(d.dateDecision).getFullYear()))];
        viz.startYear = viz.years[0];
        viz.endYear = viz.years[viz.years.length - 1];
        viz.drawTimeFilter(viz);
        viz.drawStartHandle(viz);
        viz.drawEndHandle(viz);
    }

    drawTimeFilter(viz) {
        viz.xTicks.domain(d3.extent(viz.years, function(d) { return viz.parseYear(d); }))
            .range([75, viz.timeWidth-75]);

        var xAxis = d3.axisBottom(viz.xTicks).tickValues(viz.xTicks.ticks(viz.years.length).concat(viz.xTicks.domain()));

        viz.time_svg.append("g")
            .attr("class", "axis axis--x")
            .attr("transform", "translate(0," + (viz.timeHeight - 40) + ")")
            .call(xAxis)
            .selectAll("text")  
            .style("text-anchor", "end")
            .style("font-size", "0.75rem")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-65)")
            .attr("display", function(d,i) {
                if (i%2 == 1) {
                    return 'none';
                }
                return 'block';
            });
    }

    drawStartHandle(viz) {
        var date = viz.xTicks.invert(75);
        var year = date.getFullYear().toString();

        viz.startYear = Number(year);

        viz.startHandle = viz.time_svg.append("g")
            .attr("id", "start-handle")
            .attr("cursor", "pointer")
            .call(d3.drag()
                .on("drag", function() { //TODO: this won't take into account what part of handle is selected on drag
                    var mousePos = d3.mouse(this);
                    var mouseX = viz.xTicks.invert(viz.startYear);
                    if (mousePos != null) {
                        if (mousePos[0] >=75 && mousePos[0] <= viz.timeWidth - 75) {
                            viz.updateStartHandle(viz, mousePos[0]);
                        }
                    }
                })
            );
        
        viz.startHandle.append("path")
            .attr("id", "start_line")
            .attr("stroke-width", "2px")
            .attr("stroke", "black")
            .attr("fill", "white")
            .attr('d', "M75,64 L75,4 C15,4 15,4 15,24 C15,34 15,34 75,34");

        viz.startHandle.append("text")
            .attr("x", 30)
            .attr("y", 24)
            .text("1946");
    }

    updateStartHandle(viz, xPos) {
        var snappedXPos = viz.computeXSnapping(viz, xPos);
        viz.startYear = viz.xTicks.invert(snappedXPos).getFullYear();

        if (viz.startYear > viz.endYear) {
            viz.startYear = viz.endYear;
            snappedXPos = viz.xTicks(viz.parseYear(viz.startYear));
        }

        viz.startHandle.select("#start_line")
            .attr('d', "M" + snappedXPos + ",64 L" + snappedXPos + ",4 C" + (snappedXPos - 60) + ",4 " + (snappedXPos - 60) + ",4 " + (snappedXPos - 60) + ",24 C" + (snappedXPos - 60) + ",34 " + (snappedXPos - 60) + ",34 " + snappedXPos + ",34");

        viz.startHandle.select("text")
            .attr("x", (snappedXPos - 45))
            .text(viz.startYear.toString());
    }

    drawEndHandle(viz) {
        var date = viz.xTicks.invert(viz.timeWidth - 75);
        var year = date.getFullYear().toString();

        viz.endYear = Number(year);

        viz.endHandle = viz.time_svg.append("g")
            .attr("id", "end-handle")
            .attr("cursor", "pointer")
            .call(d3.drag()
                .on("drag", function() { //TODO: this won't take into account what part of handle is selected on drag
                    var mousePos = d3.mouse(this);
                    var mouseX = viz.xTicks.invert(viz.endYear);
                    if (mousePos != null) {
                        if (mousePos[0] >=75 && mousePos[0] <= viz.timeWidth - 65) {
                            viz.updateEndHandle(viz, mousePos[0]);
                        }
                        else if (mousePos > viz.timeWidth - 75) {
                            viz.updateEndHandle(viz, viz.timeWidth - 75);
                        }
                    }
                })
            );
        
        viz.endHandle.append("path")
            .attr("id", "end_line")
            .attr("stroke-width", "2px")
            .attr("stroke", "black")
            .attr("fill", "white")
            .attr('d', "M" + (viz.timeWidth - 75) + ",64 L" + (viz.timeWidth - 75) + ",4 C" + (viz.timeWidth - 15) + ",4 " + (viz.timeWidth - 15) + ",4 " + (viz.timeWidth - 15) + ",24 C" + (viz.timeWidth - 15) + ",34 " + (viz.timeWidth - 15) + ",34 " + (viz.timeWidth - 75) + ",34");

        viz.endHandle.append("text")
            .attr("x", (viz.timeWidth - 65))
            .attr("y", 24)
            .text("2018");
    }

    updateEndHandle(viz, xPos) {
        var snappedXPos = viz.computeXSnapping(viz, xPos);
        viz.endYear = viz.xTicks.invert(snappedXPos).getFullYear();

        if (viz.endYear < viz.startYear) {
            viz.endYear = viz.startYear;
            snappedXPos = viz.xTicks(viz.parseYear(viz.endYear));
        }

        viz.endHandle.select("#end_line")
            .attr('d', "M" + snappedXPos + ",64 L" + snappedXPos + ",4 C" + (snappedXPos + 60) + ",4 " + (snappedXPos + 60) + ",4 " + (snappedXPos + 60) + ",24 C" + (snappedXPos + 60) + ",34 " + (snappedXPos + 60) + ",34 " + snappedXPos + ",34");

        viz.endHandle.select("text")
            .attr("x", (snappedXPos + 10))
            .text(viz.endYear.toString());
    }

    drawIssueAreaFilter() {
        d3.csv("./data/issue_area.csv", function (error, issueAreas) {

        });
    }

    computeXSnapping(viz, xVal) {
        var date = viz.xTicks.invert(xVal);
        var year = date.getFullYear();
        console.log(viz.parseYear(year));

        return viz.xTicks(viz.parseYear(year));
    }
}