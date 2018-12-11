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
        viz.issueAreaScale = d3.scaleLinear();

        viz.issueAreaGroup;
        viz.issueAreaSelection = {};
        viz.issueAreaActivity = {};

        viz.years = [];
        viz.startYear;
        viz.endYear;
        viz.startHandle;
        viz.endHandle;

        viz.data = data;
        viz.issueAreaData;
        viz.draw();
    }

    draw() {
        var viz = this;

        viz.drawIssueAreaFilter(viz);

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
                        if (mousePos[0] >=75 && mousePos[0] <= viz.timeWidth - 65) {
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
        var snappedXPos;
        [viz.startYear, snappedXPos] = viz.computeXSnapping(viz, xPos);

        if (viz.startYear > viz.endYear) {
            viz.startYear = viz.endYear;
            snappedXPos = viz.xTicks(viz.parseYear(viz.startYear));
        }

        viz.startHandle.select("#start_line")
            .attr('d', "M" + snappedXPos + ",64 L" + snappedXPos + ",4 C" + (snappedXPos - 60) + ",4 " + (snappedXPos - 60) + ",4 " + (snappedXPos - 60) + ",24 C" + (snappedXPos - 60) + ",34 " + (snappedXPos - 60) + ",34 " + snappedXPos + ",34");

        viz.startHandle.select("text")
            .attr("x", (snappedXPos - 45))
            .text(viz.startYear.toString());

        viz.updateAvailableIssueAreas(viz);
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
        var snappedXPos;
        [viz.endYear, snappedXPos] = viz.computeXSnapping(viz, xPos);

        if (viz.endYear < viz.startYear) {
            viz.endYear = viz.startYear;
            snappedXPos = viz.xTicks(viz.parseYear(viz.endYear));
        }

        viz.endHandle.select("#end_line")
            .attr('d', "M" + snappedXPos + ",64 L" + snappedXPos + ",4 C" + (snappedXPos + 60) + ",4 " + (snappedXPos + 60) + ",4 " + (snappedXPos + 60) + ",24 C" + (snappedXPos + 60) + ",34 " + (snappedXPos + 60) + ",34 " + snappedXPos + ",34");

        viz.endHandle.select("text")
            .attr("x", (snappedXPos + 10))
            .text(viz.endYear.toString());

        viz.updateAvailableIssueAreas(viz);
    }

    drawIssueAreaFilter(viz) {
        d3.csv("./data/issue_area.csv", function (error, issueAreas) {
            viz.issueAreaData = issueAreas;
            var ids = issueAreas.map(a => Number(a.id));

            for (var i = 0; i < ids.length; i++) {
                viz.issueAreaActivity[ids[i]] = true;
                viz.issueAreaSelection[ids[i]] = true;
            }

            viz.issueAreaScale.domain([d3.min(ids), d3.max(ids)])
                .range([60, viz.issueWidth - 60]);

            viz.issueAreaGroup = viz.issue_area_svg.append("g");

            var ias = viz.issueAreaGroup.selectAll("g")
                .data(issueAreas);

            var alphabeticalIssueAreaNames = issueAreas.map(d => d.IssueAreaName).sort();
            console.log(alphabeticalIssueAreaNames);

            var enterIssueAreas = ias
                .enter()
                .append("g")
                    .attr("id", function(d) {
                        return "issue_area_" + d.id;
                    })
                    .attr("class", "ia_filter")
                    .attr("cursor", "pointer")
                    .on("click", function(d) {
                        if (this.classList.contains("unselected")) {
                            this.classList.remove("unselected");
                            viz.issueAreaSelection[d.id] = true;
                        }
                        else {
                            this.classList.add("unselected");
                            viz.issueAreaSelection[d.id] = false;
                        }
                    });

            enterIssueAreas.append("circle")
                .attr('cx', function(d,i) {
                    return viz.issueAreaScale(alphabeticalIssueAreaNames.indexOf(d.IssueAreaName) + 1);
                })
                .attr('cy', viz.issueHeight/2)
                .attr("r", 40)
                .attr("stroke", "none")
                .attr("stroke-width", "0px")
                .attr("fill", "#8BBBAE");

            enterIssueAreas.append("text")
                .attr("text-anchor", "middle")
                .attr("x", function(d,i) {
                    return viz.issueAreaScale(alphabeticalIssueAreaNames.indexOf(d.IssueAreaName) + 1);
                })
                .attr("y", function(d) {
                    if (d.IssueAreaName.split(" ").length == 1) {
                        return viz.issueHeight/2 + 4;
                    }
                    return viz.issueHeight/2 - 4;
                })
                .text("")
                .append("tspan")
                    .attrs({

                    })
                    .text(function(d,i){
                        if (d.IssueAreaName == "Miscellaneous") {
                            return "Misc.";
                        }
                        return d.IssueAreaName.split(" ")[0];
                    })
                .append("tspan")
                    .attrs({
                        display: function(d) {
                            if (d.IssueAreaName.split(" ").length == 1) {
                                return "none";
                            }
                            return "block";
                        },
                        x: function(d) {
                            return viz.issueAreaScale(alphabeticalIssueAreaNames.indexOf(d.IssueAreaName) + 1);
                        },
                        y: function(d) {
                            return viz.issueHeight/2 + 12;
                        }
                    })
                    .text(function(d,i){
                        if (d.IssueAreaName.split(" ").length == 1) {
                            return "";
                        }
                        else if (d.IssueAreaName.split(" ")[1] == "Amendment") {
                            return "Amend.";
                        }
                        return d.IssueAreaName.split(" ")[1];
                    });
        });
    }

    updateAvailableIssueAreas(viz) {
        var activeAreas = [];

        if (viz.endYear != viz.startYear) {
            for (var i = 0; i < viz.data.length; i++) {
                if (viz.parseDate(viz.data[i].dateDecision) >= viz.parseYear(viz.startYear) && viz.parseDate(viz.data[i].dateDecision) <= viz.parseYear(viz.endYear)) {
                    if (!activeAreas.includes(Number(viz.data[i].issueArea)) && Number(viz.data[i].issueArea) != 0) {
                        activeAreas.push(Number(viz.data[i].issueArea));
                    }
                }
            }
        }
        else {
            for (var i = 0; i < viz.data.length; i++) {
                // console.log("Case year: " + viz.parseDate(viz.data[i].dateDecision).getFullYear().toString());
                // console.log("Start year: " + viz.parseYear(viz.startYear).getFullYear().toString());
                // console.log("thank you, next");

                if (viz.parseDate(viz.data[i].dateDecision).getFullYear().toString() == viz.parseYear(viz.startYear).getFullYear().toString()) {
                    console.log("years match"); // writes 72 times per update call

                    if (!activeAreas.includes(Number(viz.data[i].issueArea)) && Number(viz.data[i].issueArea) != 0) {
                        activeAreas.push(Number(viz.data[i].issueArea));
                    }
                }
            }
        }

        console.log(activeAreas);

        for (var key in viz.issueAreaActivity) {
            if (!activeAreas.includes(Number(key))) {
                viz.issueAreaActivity[key] = false;
                document.getElementById("issue_area_" + key).classList.add("inactive");
            }
            else {
                viz.issueAreaActivity[key] = true;
                document.getElementById("issue_area_" + key).classList.remove("inactive");
            }
        }
    }

    computeXSnapping(viz, xVal) {
        var date = viz.xTicks.invert(xVal);
        var year = date.getFullYear();

        return [year, viz.xTicks(viz.parseYear(year))];
    }
}